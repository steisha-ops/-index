const post = (u, d) => fetch(u, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)}).then(r=>r.json());
const get = (u) => fetch(u).then(r=>r.json());

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