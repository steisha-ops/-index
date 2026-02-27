const BASE = "/api"; // Прокси на 3001

// Кэш для быстрого доступа к region_data
const dataCache = new Map();

const getCached = (key) => {
    const item = dataCache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.duration) {
        dataCache.delete(key);
        return null;
    }
    return item.data;
};

const setCached = (key, data, ttl = 1000) => {
    dataCache.set(key, {
        data,
        timestamp: Date.now(),
        duration: ttl
    });
};

const req = async (url, method='GET', body=null) => {
    try {
        const opts = { method, headers: {'Content-Type':'application/json'} };
        if(body) opts.body = JSON.stringify(body);
        
        console.log(`📤 ${method} ${BASE}${url}`, body || '');
        const res = await fetch(`${BASE}${url}`, opts);
        
        console.log(`📥 Status: ${res.status}`);
        
        let data;
        try {
            data = await res.json();
        } catch (parseErr) {
            console.error("JSON parse error:", parseErr);
            return { ok: false, error: `Parse Error: ${parseErr.message}` };
        }
        
        if (!res.ok) {
            console.error("❌ Server Error:", data);
            return { ok: false, error: data?.error || data?.message || `Error ${res.status}` };
        }
        
        console.log(`✅ Response:`, data);
        return data;
    } catch(e) {
        console.error("❌ Network Error:", e);
        return { ok: false, error: `Network Error: ${e.message}` };
    }
};

export const api = {
    // AUTH
    login: (password) => req('/auth/login', 'POST', { password }),
    
    // REGIONS
    getRegions: () => req('/regions'),
    addRegion: (d) => req('/regions', 'POST', d),
    deleteRegion: (id) => req(`/regions/${id}`, 'DELETE'),
    
    // REGION DATA & GRAPHS - ВСЕГДА СВЕЖИЕ ДАННЫЕ (без кэша)
    getRegionData: async (id, skipCache = false) => {
        // Добавляем timestamp к запросу чтобы браузер не кэшировал
        const timestamp = Date.now();
        const data = await req(`/region_data/${id}?t=${timestamp}`);
        // ВАЖНО: не кэшируем, всегда берем со сервера
        return data;
    },
    
    // ВНУТРЕННЯЯ ФУНКЦИЯ: загрузить данные и сохранить в кэш
    _getCachedRegionData: async (id) => {
        // Очищаем кэш перед загрузкой
        dataCache.delete(`region_${id}`);
        
        const data = await req(`/region_data/${id}`);
        if (data.ok || data.region) {
            setCached(`region_${id}`, data, 500); // КЭШ только на 500мс для временных данных
        }
        return data;
    },
    
    updateRegionIndex: async (id, v) => {
        console.log(`🔄 Updating region ${id} index to ${v}`);
        const res = await req('/update_region_index', 'POST', {id, value:v});
        
        if (res.ok) {
            // ОЧЕНЬ ВАЖНО: очищаем все кэши
            dataCache.clear();
            console.log(`✅ Index updated successfully, cache cleared`);
            console.log(`📊 Server response:`, res);
            
            // Возвращаем полный ответ сервера (содержит регион и историю)
            return res;
        }
        
        console.error(`❌ Update failed:`, res.error);
        return res;
    },
    
    updateRegionHistory: async (id, d, v) => {
        const res = await req('/update_region_history', 'POST', {id, date:d, value:v});
        if (res.ok) {
            dataCache.clear(); // Очищаем ВСЕ кэши
        }
        return res;
    },
    
    deleteHistoryDay: async (id, d) => {
        const res = await req('/delete_history_day', 'POST', {region_id:id, date:d});
        if (res.ok) {
            dataCache.clear();
        }
        return res;
    },
    
    shiftDay: async (id) => {
        const res = await req('/shift_day', 'POST', {region_id:id});
        if (res.ok) {
            dataCache.clear();
        }
        return res;
    },

    // POPUPS
    getPopups: () => req('/popups'),
    addPopup: (d) => req('/popups', 'POST', d),
    deletePopup: (id) => req(`/popups/${id}`, 'DELETE'),

    // BUTTONS
    getButtons: () => req('/buttons'),
    addButton: (d) => req('/buttons', 'POST', d),
    deleteButton: (id) => req(`/buttons/${id}`, 'DELETE'),

    // PAGES
    getPages: () => req('/pages'),
    addPage: (d) => req('/pages', 'POST', d),
    deletePage: (id) => req(`/pages/${id}`, 'DELETE'),

    // WIDGETS
    getWidgets: () => req('/widgets'),
    createWidget: (d) => req('/widgets', 'POST', d),
    deleteWidget: (id) => req(`/widgets/${id}`, 'DELETE'),

    // FORECASTS
    getForecasts: () => req('/forecasts'),
    saveForecasts: (d) => req('/forecasts', 'POST', d),

    // MARKERS
    getMarkers: () => req('/markers'),
    addMarker: (d) => req('/markers', 'POST', d),
    deleteMarker: (id) => req(`/markers/${id}`, 'DELETE'),
    
    // NOTIFICATIONS & SETTINGS
    sendNotification: (d) => req('/notify', 'POST', d),
    getSettings: () => req('/settings'),
    
    // CONSCIENCE HISTORY
    getConscienceHistory: () => req('/conscience_history'),
    addConscienceEntry: (d) => req('/conscience_history', 'POST', d),
    deleteConscienceEntry: (id) => req(`/conscience_history/${id}`, 'DELETE'),
    getConscienceButtonStatus: () => req('/conscience_button_enabled'),
    toggleConscienceButton: (enabled) => req('/conscience_history/button/toggle', 'POST', {enabled}),
};
