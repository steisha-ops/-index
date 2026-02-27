// Кэш для API запросов с лучшей управлением памятью
const apiCache = new Map();
const CACHE_DURATION = {
    'short': 30000,   // 30 сек
    'medium': 300000, // 5 минут
    'long': 3600000   // 1 час
};

// Максимальный размер кэша (количество записей)
const MAX_CACHE_SIZE = 100;

const getCached = (key) => {
    const item = apiCache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.duration) {
        apiCache.delete(key);
        return null;
    }
    return item.data;
};

const setCached = (key, data, duration = 'medium') => {
    // Очищаем кэш если он переполнен
    if (apiCache.size >= MAX_CACHE_SIZE) {
        const firstKey = apiCache.keys().next().value;
        apiCache.delete(firstKey);
    }
    
    apiCache.set(key, {
        data,
        timestamp: Date.now(),
        duration: CACHE_DURATION[duration]
    });
};

const post = (u, d) => {
    console.log(`📤 POST ${u}`, d);
    return fetch(u, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(d),
        signal: AbortSignal.timeout(15000) // 15 сек timeout
    })
        .then(r=>{
            console.log(`📥 POST ${u} status:`, r.status);
            return r.json();
        })
        .catch(e=> { 
            console.error("❌ POST Error:", e); 
            return null; 
        });
};

const get = (u, cacheDuration = 'medium', skipCache = false) => {
    // Проверяем кэш (если не skip)
    if (!skipCache) {
        const cached = getCached(u);
        if (cached) {
            console.log(`📦 CACHE HIT ${u}`);
            return Promise.resolve(cached);
        }
    }
    
    console.log(`📤 GET ${u}` + (skipCache ? ' [NO CACHE]' : ''));
    return fetch(u, { 
        signal: AbortSignal.timeout(15000) // 15 сек timeout
    })
        .then(r=>{
            console.log(`📥 GET ${u} status:`, r.status);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(data => {
            if (!skipCache) setCached(u, data, cacheDuration);
            return data;
        })
        .catch(e=> { 
            console.error("❌ GET Error:", e); 
            return []; 
        });
};

export const api = {
    getSettings: () => get('/api/settings', 'long'),
    getNews: (limit = 20) => get(`/api/news?limit=${limit}`, 'medium'),
    getButtons: () => get('/api/buttons', 'long'),
    getMarkers: () => get('/api/markers', 'medium'),
    getRegions: () => get('/api/regions', 'long'),
    getHistory: () => get('/api/history', 'short'),
    getHourly: () => get('/api/hourly', 'short'),
    getWidgets: () => get('/api/widgets', 'long'),
    getAuthors: () => get('/api/authors', 'medium'),
    getPopups: () => get('/api/popups', 'long'),
    getAuthor: (id) => get(`/api/authors/${id}`, 'medium'),
    getRegionData: (id) => get(`/api/region_data/${id}`, 'short', true), // skipCache=true - всегда свежие данные!
    getPages: () => get('/api/pages', 'long'),

    sendReport: (text, image) => post('/api/reports', {text, image}),
    
    // Write operations - update index, history, etc
    updateRegionIndex: async (id, value) => {
        const result = await post('/api/update_region_index', {id, value});
        // Очищаем кэш региона после обновления
        if (result && result.ok) {
            apiCache.delete(`/api/region_data/${id}`);
            console.log(`🧹 Cleared cache for region ${id}`);
        }
        return result;
    },
    updateRegionHistory: async (id, date, value) => {
        const result = await post('/api/update_region_history', {id, date, value});
        if (result && result.ok) {
            apiCache.delete(`/api/region_data/${id}`);
        }
        return result;
    },
    deleteHistoryDay: async (id, date) => {
        const result = await post('/api/delete_history_day', {region_id: id, date});
        if (result && result.ok) {
            apiCache.delete(`/api/region_data/${id}`);
        }
        return result;
    },
    shiftDay: async (id) => {
        const result = await post('/api/shift_day', {region_id: id});
        if (result && result.ok) {
            apiCache.delete(`/api/region_data/${id}`);
        }
        return result;
    },
    saveSetting: async (key, value) => {
        const result = await post('/api/settings', {key, value});
        if (result && result.ok) {
            apiCache.clear(); // Очищаем весь кэш при изменении настроек
            console.log('🧹 Cleared all cache after settings change');
        }
        return result;
    },
    updateHistory: async (date, value) => {
        const result = await post('/api/history', {date, value});
        if (result && result.ok) {
            apiCache.clear(); // Очищаем кэш при обновлении истории
        }
        return result;
    },
    createAuthor: (data) => post('/api/authors', data),
    postNews: (data) => post('/api/news', data),
    deleteMarker: (id) => post(`/api/markers/${id}/delete`, {}),
    addMarker: (data) => post('/api/markers', data),
    addButton: (data) => post('/api/buttons', data),
    deleteButton: (id) => post(`/api/buttons/${id}/delete`, {}),
    getReports: () => get('/api/reports', 'medium'),
    
    // Prefetch функция для предварительной загрузки данных
    prefetch: (url, cacheDuration = 'medium') => {
        return get(url, cacheDuration);
    },
    
    // Batch prefetch для загрузки нескольких запросов одновременно
    prefetchBatch: (urls, cacheDuration = 'medium') => {
        return Promise.all(urls.map(url => get(url, cacheDuration)));
    },
    
    // Очистить кэш
    clearCache: () => apiCache.clear(),
    
    // Очистить определенный кэш
    clearCacheFor: (url) => apiCache.delete(url),
    
    // Получить размер кэша (для отладки)
    getCacheSize: () => apiCache.size,
    
    // ИСТОРИЯ СОВЕСТИ
    getConscienceHistory: () => get('/api/conscience_history', 'long'),
    addConscienceEntry: async (data) => {
        const result = await post('/api/conscience_history', data);
        if (result && result.ok) {
            apiCache.delete('/api/conscience_history');
        }
        return result;
    },
    deleteConscienceEntry: async (id) => {
        const result = await post(`/api/conscience_history/${id}/delete`, {});
        if (result && result.ok) {
            apiCache.delete('/api/conscience_history');
        }
        return result;
    },
    getConscienceButtonStatus: () => get('/api/conscience_button_enabled', 'medium'),
    toggleConscienceButton: async (enabled) => {
        const result = await post('/api/conscience_history/button/toggle', {enabled});
        if (result && result.ok) {
            apiCache.delete('/api/conscience_button_enabled');
        }
        return result;
    },
};