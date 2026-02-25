const BASE = "/api"; // Прокси на 3001

const req = async (url, method='GET', body=null) => {
    try {
        const opts = { method, headers: {'Content-Type':'application/json'} };
        if(body) opts.body = JSON.stringify(body);
        
        console.log(`Sending ${method} to ${url}`);
        const res = await fetch(`${BASE}${url}`, opts);
        
        if(!res.ok) {
            const txt = await res.text();
            console.error("Server Error:", txt);
            return { error: txt };
        }
        
        return await res.json();
    } catch(e) {
        console.error("Network Error:", e);
        return { error: "Network Error" };
    }
};

export const api = {
    // ПРОСТОЙ ЛОГИН
    login: (password) => req('/auth/login', 'POST', { password }),
    
    getRegions: () => req('/regions'),
    addRegion: (d) => req('/regions', 'POST', d),
    deleteRegion: (id) => req(`/regions/${id}`, 'DELETE'),
    
    getRegionData: (id) => req(`/region_data/${id}`),
    updateRegionIndex: (id, v) => req('/update_region_index', 'POST', {id, value:v}),
    updateRegionHistory: (id, d, v) => req('/update_region_history', 'POST', {id, date:d, value:v}),
    deleteHistoryDay: (id, d) => req('/delete_history_day', 'POST', {region_id:id, date:d}),
    shiftDay: (id) => req('/shift_day', 'POST', {region_id:id}),

    getPopups: () => req('/popups'),
    addPopup: (d) => req('/popups', 'POST', d),
    deletePopup: (id) => req(`/popups/${id}`, 'DELETE'),

    getButtons: () => req('/buttons'),
    addButton: (d) => req('/buttons', 'POST', d),
    deleteButton: (id) => req(`/buttons/${id}`, 'DELETE'),


    getPages: () => req('/pages'),
    addPage: (d) => req('/pages', 'POST', d),
    deletePage: (id) => req(`/pages/${id}`, 'DELETE'),

    getWidgets: () => req('/widgets'),
    createWidget: (d) => req('/widgets', 'POST', d),
    deleteWidget: (id) => req(`/widgets/${id}`, 'DELETE'),

    getForecasts: () => req('/forecasts'),
    saveForecasts: (d) => req('/forecasts', 'POST', d),

    getMarkers: () => req('/markers'),
    addMarker: (d) => req('/markers', 'POST', d),
    deleteMarker: (id) => req(`/markers/${id}`, 'DELETE'),
    
    sendNotification: (d) => req('/notify', 'POST', d),
    getSettings: () => req('/settings'),
};
