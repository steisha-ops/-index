const post = (u, d) => {
    console.log(`📤 POST ${u}`, d);
    return fetch(u, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)})
        .then(r=>{
            console.log(`📥 POST ${u} status:`, r.status);
            return r.json();
        })
        .catch(e=> { console.error("❌ POST Error:", e); return null; });
};
const get = (u) => {
    console.log(`📤 GET ${u}`);
    return fetch(u)
        .then(r=>{
            console.log(`📥 GET ${u} status:`, r.status);
            return r.json();
        })
        .catch(e=> { console.error("❌ GET Error:", e); return []; });
};

export const api = {
    getSettings: () => get('/api/settings'),
    getNews: () => get('/api/news'),
    getButtons: () => get('/api/buttons'),
    getMarkers: () => get('/api/markers'),
    getRegions: () => get('/api/regions'),
    getHistory: () => get('/api/history'),
    getHourly: () => get('/api/hourly'),
    getWidgets: () => get('/api/widgets'),
    getAuthors: () => get('/api/authors'),
    getPopups: () => get('/api/popups'),
    getAuthor: (id) => get(`/api/authors/${id}`),
    getRegionData: (id) => get(`/api/region_data/${id}`),
    
    // FIX: Add the missing getPages function that was causing the crash in App.jsx
    getPages: () => get('/api/pages'),

    sendReport: (text, image) => post('/api/reports', {text, image}),
};