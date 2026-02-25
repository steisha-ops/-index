// Кэш для API запросов
const apiCache = new Map();
const CACHE_DURATION = {
    'short': 30000,   // 30 сек
    'medium': 300000, // 5 минут
    'long': 3600000   // 1 час
};

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
    apiCache.set(key, {
        data,
        timestamp: Date.now(),
        duration: CACHE_DURATION[duration]
    });
};

const post = (u, d) => {
    console.log(`📤 POST ${u}`, d);
    return fetch(u, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(d)})
        .then(r=>{
            console.log(`📥 POST ${u} status:`, r.status);
            return r.json();
        })
        .catch(e=> { console.error("❌ POST Error:", e); return null; });
};

const get = (u, cacheDuration = 'medium') => {
    // Проверяем кэш
    const cached = getCached(u);
    if (cached) {
        console.log(`📦 CACHE HIT ${u}`);
        return Promise.resolve(cached);
    }
    
    console.log(`📤 GET ${u}`);
    return fetch(u, { 
        signal: AbortSignal.timeout(15000) // 15 сек timeout
    })
        .then(r=>{
            console.log(`📥 GET ${u} status:`, r.status);
            return r.json();
        })
        .then(data => {
            setCached(u, data, cacheDuration);
            return data;
        })
        .catch(e=> { console.error("❌ GET Error:", e); return []; });
};

export const api = {
    getSettings: () => get('/api/settings', 'long'),
    getNews: () => get('/api/news', 'medium'),
    getButtons: () => get('/api/buttons', 'long'),
    getMarkers: () => get('/api/markers', 'medium'),
    getRegions: () => get('/api/regions', 'long'),
    getHistory: () => get('/api/history', 'short'),
    getHourly: () => get('/api/hourly', 'short'),
    getWidgets: () => get('/api/widgets', 'long'),
    getAuthors: () => get('/api/authors', 'medium'),
    getPopups: () => get('/api/popups', 'long'),
    getAuthor: (id) => get(`/api/authors/${id}`, 'medium'),
    getRegionData: (id) => get(`/api/region_data/${id}`, 'short'),
    getPages: () => get('/api/pages', 'long'),

    sendReport: (text, image) => post('/api/reports', {text, image}),
    
    // Prefetch функция для предварительной загрузки данных
    prefetch: (url, cacheDuration = 'medium') => {
        return get(url, cacheDuration);
    },
    
    // Очистить кэш
    clearCache: () => apiCache.clear(),
    
    // Очистить определенный кэш
    clearCacheFor: (url) => apiCache.delete(url)
};