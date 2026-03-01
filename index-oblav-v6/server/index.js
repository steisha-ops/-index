import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const app = express();
const PORT = 3001;
const saltRounds = 10;

// Улучшенная компрессия + кэширование
app.use(compression({ 
    level: 9, 
    threshold: 512,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));

// Кэширование статика на 1 час
app.use((req, res, next) => {
    if (req.url.match(/\.(js|css|woff2|woff|ttf|font)$/)) {
        res.set('Cache-Control', 'public, max-age=3600, immutable');
    } else if (req.url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
        res.set('Cache-Control', 'public, max-age=86400, immutable');
    } else if (req.url === '/index.html' || req.url === '/') {
        res.set('Cache-Control', 'public, max-age=3600');
    } else {
        // API endpoints - НИКОГДА НЕ КЭШИРУЕМ!
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
    next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: false,
    maxAge: 86400
}));

// ===== SECURITY =====
const validateInput = (val, type = 'string', min = 0, max = Infinity) => {
    if (type === 'number') {
        const n = parseFloat(val);
        if (isNaN(n) || n < min || n > max) throw new Error(`Invalid number: ${val}`);
        return n;
    }
    if (type === 'string') {
        if (!val || typeof val !== 'string' || val.length > max) throw new Error(`Invalid string`);
        return val.trim();
    }
    return val;
};

const reqLog = {};
const checkRateLimit = (ip) => {
    const now = Date.now();
    if (!reqLog[ip]) reqLog[ip] = [];
    reqLog[ip] = reqLog[ip].filter(t => now - t < 60000);
    if (reqLog[ip].length > 150) return false;
    reqLog[ip].push(now);
    return true;
};

app.use((req, res, next) => {
    const ip = req.ip || 'unknown';
    if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Too many requests' });
    next();
});

// ===== CACHE =====
const dataCache = new Map();
const CACHE_TTL_MS = 5000; // 5 seconds для обычных данных
const EXTENDED_CACHE_TTL_MS = 2000; // 2 seconds для region_data (очень короткий чтобы избежать рассинхронизации)
const SHORT_CACHE_TTL_MS = 1000; // 1 second для region_data при изменении

const getCached = (key) => {
    const item = dataCache.get(key);
    if (!item) return null;
    if (Date.now() - item.time > item.ttl) {
        dataCache.delete(key);
        return null;
    }
    return item.data;
};

const setCached = (key, data, ttl = CACHE_TTL_MS) => {
    dataCache.set(key, { data, time: Date.now(), ttl });
};

// Путь к базе
const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { 
        console.error("❌ DB Error:", err); 
    } else { 
        console.log("✅ DB Connected.");
        initDb();
    }
});

function initDb() {
    db.configure('busyTimeout', 5000);
    
    // 1. ТАБЛИЦЫ - создаём их сразу
    const schema = [
        `CREATE TABLE IF NOT EXISTS regions (id INTEGER PRIMARY KEY, name TEXT, lat REAL, lng REAL, zoom INTEGER, current_index REAL)`,
        `CREATE TABLE IF NOT EXISTS history (region_id INTEGER, date TEXT, value REAL)`,
        `CREATE TABLE IF NOT EXISTS news (id INTEGER PRIMARY KEY, author_id INTEGER, text TEXT, image TEXT, date TEXT, btn_text TEXT, btn_link TEXT, tags TEXT, is_highlighted INTEGER)`,
        `CREATE TABLE IF NOT EXISTS authors (id INTEGER PRIMARY KEY, name TEXT, handle TEXT, avatar TEXT, bio TEXT, is_verified INTEGER, password TEXT, access_level INTEGER DEFAULT 0, failed_login_attempts INTEGER DEFAULT 0, lock_expires_at DATETIME)`,
        `CREATE TABLE IF NOT EXISTS widgets (id INTEGER PRIMARY KEY, type TEXT, title TEXT, text TEXT, color TEXT, icon TEXT, link TEXT, image TEXT, is_wide INTEGER, sub_widgets TEXT)`,
        `CREATE TABLE IF NOT EXISTS buttons (id INTEGER PRIMARY KEY, label TEXT, icon TEXT, link TEXT)`,
        `CREATE TABLE IF NOT EXISTS popups (id INTEGER PRIMARY KEY, title TEXT, text TEXT, image TEXT)`,
        `CREATE TABLE IF NOT EXISTS pages (id INTEGER PRIMARY KEY, slug TEXT, title TEXT, content TEXT, is_hidden INTEGER)`,
        `CREATE TABLE IF NOT EXISTS markers (id INTEGER PRIMARY KEY, lat REAL, lng REAL, desc TEXT)`,
        `CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, title TEXT, body TEXT, type TEXT)`,
        `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
        `CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY, text TEXT, image TEXT, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS conscience_history (id INTEGER PRIMARY KEY, title TEXT, text TEXT, icon TEXT, image TEXT, _order INTEGER DEFAULT 0, enabled INTEGER DEFAULT 1)`,
        `CREATE TABLE IF NOT EXISTS widget_layouts (id INTEGER PRIMARY KEY, user_id TEXT UNIQUE, widget_order TEXT, created_at TEXT, updated_at TEXT)`
    ];
    schema.forEach(sql => db.run(sql));
    
    // Create indexes for performance
    const indexes = [
        "CREATE INDEX IF NOT EXISTS idx_news_author ON news(author_id)",
        "CREATE INDEX IF NOT EXISTS idx_history_region ON history(region_id, date)",
        "CREATE INDEX IF NOT EXISTS idx_authors_id ON authors(id)",
        "CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug)"
    ];
    indexes.forEach(sql => db.run(sql));

    // 2. НАПОЛНЕНИЕ (SEEDING) - в фоне, не блокируя сервер
    db.get("SELECT count(*) as c FROM regions", (e,r) => {
        if(r && r.c === 0) {
            console.log("🌱 Database is empty. Seeding...");
            
            // Регионы
            const stmt = db.prepare("INSERT INTO regions (name, lat, lng, zoom, current_index) VALUES (?,?,?,?,?)");
            stmt.run('Москва', 55.75, 37.61, 11, 3.5);
            stmt.run('Санкт-Петербург', 59.93, 30.33, 11, 8.0);
            stmt.finalize();

            // История (График)
            const hist = db.prepare("INSERT INTO history (region_id, date, value) VALUES (?,?,?)");
            const today = new Date();
            for(let i=180; i>=0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                hist.run(1, d.toISOString().split('T')[0], (3 + Math.sin(i/10)).toFixed(2));
                hist.run(2, d.toISOString().split('T')[0], (7 + Math.cos(i/10)).toFixed(2));
            }
            hist.finalize();

            // Автор
            db.run("INSERT INTO authors (name, handle, avatar, bio, is_verified) VALUES (?,?,?,?,?)", ['Admin', 'admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 'System Admin', 1], function() {
                console.log("✅ Author 'Admin' created with ID:", this.lastID);
            });
            
            // Новости
            db.run("INSERT INTO news (author_id, text, date, tags, is_highlighted) VALUES (?,?,?,?,?)", [1, 'Система запущена.', new Date().toISOString(), 'info', 1], function() {
                console.log("✅ News created with ID:", this.lastID);
            });

            // Виджеты и Кнопки
            db.run("INSERT INTO widgets (type, title, text, color, icon, is_wide) VALUES (?,?,?,?,?,?)", ['clock', 'Время', '', 'blue', 'Clock', 0]);
            db.run("INSERT INTO buttons (label, icon, link) VALUES (?,?,?)", ['Help', 'Zap', 'popup:1']);
            db.run("INSERT INTO popups (title, text) VALUES (?,?)", ['Info', 'Test Popup']);

            // История Совести - инициализируем записи
            const conscience = db.prepare("INSERT INTO conscience_history (title, text, icon, image, _order, enabled) VALUES (?,?,?,?,?,?)");
            conscience.run('Право на выбор', 'Каждый гражданин имеет право выбора пути служения своей стране в соответствии со своей совестью', '🕊️', null, 0, 1);
            conscience.run('Альтернативная служба', 'Альтернативная гражданская служба (АГС) - это форма исполнения гражданской функции госуда вместо военной службы', '⚖️', null, 1, 1);
            conscience.run('За мир', 'Мы работаем над тем, чтобы каждый человек смог выбрать достойный путь', '🤝', null, 2, 1);
            conscience.finalize();

            console.log("✅ Seeding completed.");
        } else {
            console.log("✅ Database already has data (regions count:", r?.c, ")");
        }
    });
}

// --- API ROUTES HELPER ---
const get = (sql, cacheKey) => (req, res) => {
    if (cacheKey) {
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);
    }
    db.all(sql, (err, rows) => {
        const data = rows || [];
        if (cacheKey) setCached(cacheKey, data);
        res.json(data);
    });
};

// --- API ROUTES --

// READ
app.get('/api/regions', (req, res) => {
    const cacheKey = 'regions_list';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    db.all("SELECT id, name, lat, lng, zoom, current_index FROM regions", (err, rows) => {
        const data = rows || [];
        setCached(cacheKey, data);
        res.json(data);
    });
});
app.get('/api/news', get("SELECT news.id, news.author_id, news.text, news.image, news.date, news.btn_text, news.btn_link, authors.name, authors.handle, authors.avatar, authors.is_verified FROM news LEFT JOIN authors ON news.author_id = authors.id ORDER BY news.id DESC LIMIT 50", 'news'));
app.get('/api/widgets', get("SELECT id, type, title, text, color, icon, link, image, is_wide, sub_widgets FROM widgets LIMIT 100", 'widgets'));
app.get('/api/buttons', get("SELECT * FROM buttons LIMIT 50", 'buttons'));
app.get('/api/popups', get("SELECT * FROM popups LIMIT 50", 'popups'));
app.get('/api/pages', get("SELECT id, slug, title, is_hidden FROM pages WHERE is_hidden=0 LIMIT 50", 'pages'));
app.get('/api/markers', get("SELECT * FROM markers"));
app.get('/api/authors', (req, res) => {
    const cacheKey = 'authors_list';
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);
    
    console.log("📍 GET /api/authors called");
    db.all("SELECT id, name, handle, avatar, bio, is_verified FROM authors LIMIT 100", (err, rows) => {
        console.log("  Authors from DB:", rows?.length || 0);
        if(err) console.error("  ERROR:", err);
        const data = rows || [];
        setCached(cacheKey, data);
        res.json(data);
    });
});
app.get('/api/settings', get("SELECT * FROM settings"));

app.get('/api/authors/:id', (req, res) => {
    db.get("SELECT id, name, handle, avatar, bio, is_verified FROM authors WHERE id=?", [req.params.id], (e, a) => {
        db.all("SELECT * FROM news WHERE author_id=? ORDER BY id DESC", [req.params.id], (e2, n) => res.json({author:a||{}, news:n||[]}));
    });
});

app.get('/api/region_data/:id', (req, res) => {
    try {
        const regionId = validateInput(req.params.id, 'number', 1, 10000);
        
        // НЕ используем КЕША для region_data - ВСЕГДА свежие данные из БД!
        console.log(`🔄 [DB QUERY] region_${regionId} (no cache)`);
        
        // Query database - параллельно загружаем регион и историю
        db.get("SELECT id, current_index FROM regions WHERE id=?", [regionId], (e, region) => {
            if (e || !region) {
                console.log(`❌ [ERROR] Region ${regionId} not found`);
                res.json({region: null, history: []});
                return;
            }
            
            // Use LIMIT for large datasets - только последние 90 дней для быстрой загрузки
            db.all("SELECT date, value FROM history WHERE region_id=? ORDER BY date DESC LIMIT 90", [regionId], (e2, historyData) => {
                if (e2) {
                    console.log(`❌ [ERROR] History query failed:`, e2);
                    res.json({region, history: []});
                    return;
                }
                
                const responseData = { 
                    region, 
                    history: (historyData || []).reverse(),
                    _timestamp: Date.now()  // Добавляем timestamp для отслеживания версии данных
                };
                console.log(`✅ [DATA LOADED] region_${regionId} | index=${region.current_index} | history=${historyData?.length || 0} items | @${new Date().toISOString()}`);
                res.json(responseData);
            });
        });
    } catch(e) {
        console.log(`❌ [ERROR]`, e.message);
        res.status(400).json({error: e.message});
    }
});

app.get('/api/notifications/poll', (req, res) => {
    db.all("SELECT * FROM notifications WHERE id > ? ORDER BY id DESC LIMIT 1", [req.query.last_id||0], (e,r)=>res.json(r||[]));
});

// WIDGETS
app.post('/api/widgets', (req,res) => {
    const { type, title, text, color, icon, is_wide, image, link, indicator, shadow, vibration, sub_widgets } = req.body;
    const sql = "INSERT INTO widgets (type, title, text, color, icon, is_wide, image, link, sub_widgets) VALUES (?,?,?,?,?,?,?,?,?)";
    db.run(sql, [type, title, text, color, icon, is_wide ? 1 : 0, image || null, link || null, sub_widgets ? JSON.stringify(sub_widgets) : null], function() {
        dataCache.delete('widgets');
        res.json({ok:true, id:this.lastID});
    });
});

app.delete('/api/widgets/:id', (req,res) => {
    db.run("DELETE FROM widgets WHERE id=?", [req.params.id], ()=> {
        dataCache.delete('widgets');
        res.json({ok:true});
    });
});

// PAGES (HTML)
app.post('/api/pages', (req,res) => {
    const { slug, title, content } = req.body;
    if (!slug || !title) return res.status(400).json({ error: 'Missing slug or title' });
    
    const sql = "INSERT INTO pages (slug, title, content, is_hidden) VALUES (?,?,?,?)";
    db.run(sql, [slug, title, content || '', 0], function() {
        dataCache.delete('pages');
        res.json({ok:true, id:this.lastID});
    });
});

app.delete('/api/pages/:id', (req,res) => {
    db.run("DELETE FROM pages WHERE id=?", [req.params.id], ()=> {
        dataCache.delete('pages');
        res.json({ok:true});
    });
});

// FORECASTS
app.get('/api/forecasts', (req, res) => {
    const cacheKey = 'forecasts';
    const cached = getCached(cacheKey);
    if (cached) {
        const etag = `"${Buffer.from(JSON.stringify(cached)).toString('base64').substring(0, 20)}"`;
        res.set('ETag', etag);
        res.set('Cache-Control', 'public, max-age=300, must-revalidate');
        return res.json(cached);
    }
    
    db.get("SELECT value FROM settings WHERE key='forecasts'", (err, row) => {
        if (err) {
            console.error('DB Error reading forecasts:', err);
            const defaults = [
                { day: 'ПН', risk: 45, label: 'Низкий', icon: '✅' },
                { day: 'ВТ', risk: 62, label: 'Средний', icon: '⚠️' },
                { day: 'СР', risk: 78, label: 'Высокий', icon: '⛔' },
                { day: 'ЧТ', risk: 85, label: 'Критический', icon: '🔴' },
                { day: 'ПТ', risk: 55, label: 'Средний', icon: '⚠️' },
                { day: 'СБ', risk: 30, label: 'Низкий', icon: '✅' },
                { day: 'ВС', risk: 20, label: 'Минимальный', icon: '✅' }
            ];
            setCached(cacheKey, defaults, EXTENDED_CACHE_TTL_MS);
            const etag = `"${Buffer.from(JSON.stringify(defaults)).toString('base64').substring(0, 20)}"`;
            res.set('ETag', etag);
            res.set('Cache-Control', 'public, max-age=300, must-revalidate');
            return res.json(defaults);
        }
        if (row && row.value) {
            try {
                const data = JSON.parse(row.value);
                setCached(cacheKey, data, EXTENDED_CACHE_TTL_MS);
                const etag = `"${Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 20)}"`;
                res.set('ETag', etag);
                res.set('Cache-Control', 'public, max-age=300, must-revalidate');
                return res.json(data);
            } catch (e) {
                console.error('JSON parse error:', e);
            }
        }
        const defaults = [
            { day: 'ПН', risk: 45, label: 'Низкий', icon: '✅' },
            { day: 'ВТ', risk: 62, label: 'Средний', icon: '⚠️' },
            { day: 'СР', risk: 78, label: 'Высокий', icon: '⛔' },
            { day: 'ЧТ', risk: 85, label: 'Критический', icon: '🔴' },
            { day: 'ПТ', risk: 55, label: 'Средний', icon: '⚠️' },
            { day: 'СБ', risk: 30, label: 'Низкий', icon: '✅' },
            { day: 'ВС', risk: 20, label: 'Минимальный', icon: '✅' }
        ];
        setCached(cacheKey, defaults, EXTENDED_CACHE_TTL_MS);
        const etag = `"${Buffer.from(JSON.stringify(defaults)).toString('base64').substring(0, 20)}"`;
        res.set('ETag', etag);
        res.set('Cache-Control', 'public, max-age=300, must-revalidate');
        res.json(defaults);
    });
});

app.post('/api/forecasts', (req, res) => {
    const data = JSON.stringify(req.body);
    dataCache.delete('forecasts');
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('forecasts', ?)", [data], (err) => {
        if (err) {
            console.error('DB Error saving forecasts:', err);
            return res.status(500).json({ok:false, error:err.message});
        }
        res.json({ok:true});
    });
});

// DEBUG - Check all data in DB
app.get('/api/debug/authors', (req, res) => {
    db.all("SELECT * FROM authors", (e, authors) => {
        console.log("🔍 DEBUG authors:", authors);
        res.json({ total: authors?.length || 0, authors: authors || [] });
    });
});

app.get('/api/debug/db', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (e, tables) => {
        console.log("🔍 DEBUG tables:", tables);
        res.json({tables});
    });
});

// WRITE (CRUD)
// BUTTONS
app.post('/api/buttons', (req,res) => {
    try {
        const { label, icon, link } = req.body;
        if (!label || !link) return res.status(400).json({ error: 'Missing label or link' });
        
        db.run("INSERT INTO buttons (label, icon, link) VALUES (?,?,?)", [label, icon || 'Info', link], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create button: ' + err.message });
            dataCache.delete('buttons');
            res.json({ok:true, id:this.lastID});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.delete('/api/buttons/:id', (req,res) => {
    try {
        const id = validateInput(req.params.id, 'number', 1, 10000);
        db.run("DELETE FROM buttons WHERE id=?", [id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete button: ' + err.message });
            dataCache.delete('buttons');
            res.json({ok:true});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

// POPUPS
app.post('/api/popups', (req,res) => {
    try {
        const { title, text, image } = req.body;
        if (!title) return res.status(400).json({ error: 'Missing title' });
        
        db.run("INSERT INTO popups (title, text, image) VALUES (?,?,?)", [title, text || '', image || null], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create popup: ' + err.message });
            dataCache.delete('popups');
            res.json({ok:true, id:this.lastID});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.delete('/api/popups/:id', (req,res) => {
    try {
        const id = validateInput(req.params.id, 'number', 1, 10000);
        db.run("DELETE FROM popups WHERE id=?", [id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete popup: ' + err.message });
            dataCache.delete('popups');
            res.json({ok:true});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

// REGIONS
app.post('/api/regions', (req,res) => {
    try {
        const { name, lat, lng, zoom } = req.body;
        if (!name || !lat || !lng || !zoom) return res.status(400).json({ error: 'Missing required fields' });
        
        const latitude = validateInput(lat, 'number', -90, 90);
        const longitude = validateInput(lng, 'number', -180, 180);
        const zoomLevel = validateInput(zoom, 'number', 1, 20);
        
        db.run("INSERT INTO regions (name, lat, lng, zoom, current_index) VALUES (?,?,?,?,3.0)", [name, latitude, longitude, zoomLevel], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create region: ' + err.message });
            
            // Auto-history for new region
            const id = this.lastID;
            const stmt = db.prepare("INSERT INTO history (region_id, date, value) VALUES (?,?,?)");
            const today = new Date();
            for(let i=180; i>=0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                stmt.run(id, d.toISOString().split('T')[0], (3.0).toFixed(2));
            }
            stmt.finalize();
            
            dataCache.delete('regions_list');
            res.json({ok:true, id:this.lastID});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.delete('/api/regions/:id', (req,res) => {
    try {
        const id = validateInput(req.params.id, 'number', 1, 10000);
        db.run("DELETE FROM regions WHERE id=?", [id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete region: ' + err.message });
            db.run("DELETE FROM history WHERE region_id=?", [id], (err2) => {
                if (err2) console.error("Warning: failed to delete history:", err2);
                dataCache.delete('regions_list');
                dataCache.delete(`region_${id}`);
                res.json({ok:true});
            });
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/update_region_index', (req, res) => {
    try {
        const id = validateInput(req.body.id, 'number', 1, 10000);
        const value = validateInput(req.body.value, 'number', 0.1, 11);
        
        // Проверяем, существует ли регион
        db.get("SELECT id FROM regions WHERE id=?", [id], (err, region) => {
            if (err) return res.status(500).json({error: "Database error: " + err.message});
            if (!region) return res.status(404).json({error: "Region not found"});
            
            // Обновляем индекс с обработкой ошибок
            db.run("UPDATE regions SET current_index=? WHERE id=?", [value, id], function(err) {
                if (err) return res.status(500).json({error: "Update failed: " + err.message});
                if (this.changes === 0) return res.status(400).json({error: "No rows updated"});
                
                // Инвалидируем кеш ПОЛНОСТЬЮ и логируем
                dataCache.delete(`region_${id}`);
                dataCache.delete('regions_list');
                console.log(`🗑️ [CACHE CLEARED] region_${id} - index updated from unknown to ${value}`);
                
                // ВАЖНО: Загружаем свежие данные и возвращаем их клиенту
                db.get("SELECT id, current_index FROM regions WHERE id=?", [id], (e2, updatedRegion) => {
                    if (e2) return res.status(500).json({ok:true, message: `Index updated to ${value}`});
                    
                    // Загружаем историю
                    db.all("SELECT date, value FROM history WHERE region_id=? ORDER BY date DESC LIMIT 90", [id], (e3, history) => {
                        const responseData = {
                            ok: true,
                            message: `Index updated to ${value}`,
                            region: updatedRegion,
                            history: (history || []).reverse(),
                            _timestamp: Date.now()  // Timestamp для отслеживания версии
                        };
                        console.log(`✅ [INDEX UPDATED] region_${id} | new index=${updatedRegion.current_index} | @${new Date().toISOString()}`);
                        res.json(responseData);
                    });
                });
            });
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/update_region_history', (req, res) => {
    try {
        const id = validateInput(req.body.id, 'number', 1, 10000);
        const date = validateInput(req.body.date, 'string', 8, 20);
        const value = validateInput(req.body.value, 'number', 0.1, 11);
        if (!/^\d{4}-\d{2}-\d{2}/.test(date)) throw new Error('Invalid date format');
        
        // Проверяем, существует ли регион
        db.get("SELECT id FROM regions WHERE id=?", [id], (err, region) => {
            if (err) return res.status(500).json({error: "Database error: " + err.message});
            if (!region) return res.status(404).json({error: "Region not found"});
            
            // Удаляем старое значение за эту дату
            db.run("DELETE FROM history WHERE region_id=? AND date LIKE ?", [id, `${date}%`], (err) => {
                if (err) return res.status(500).json({error: "Delete failed: " + err.message});
                
                // Вставляем новое значение
                db.run("INSERT INTO history (region_id, date, value) VALUES (?,?,?)", [id, date, value], function(err) {
                    if (err) return res.status(500).json({error: "Insert failed: " + err.message});
                    
                    // Инвалидируем кеш и логируем
                    dataCache.delete(`region_${id}`);
                    console.log(`🗑️ [CACHE CLEARED] region_${id} - history updated for ${date}`);
                    
                    // ВАЖНО: Загружаем свежие данные и возвращаем их
                    db.all("SELECT date, value FROM history WHERE region_id=? ORDER BY date DESC LIMIT 90", [id], (e2, history) => {
                        const responseData = {
                            ok: true,
                            message: `History updated for ${date}`,
                            history: (history || []).reverse()
                        };
                        res.json(responseData);
                    });
                });
            });
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/delete_history_day', (req, res) => {
    try {
        const region_id = validateInput(req.body.region_id, 'number', 1, 10000);
        const date = validateInput(req.body.date, 'string', 8, 20);
        if (!/^\d{4}-\d{2}-\d{2}/.test(date)) throw new Error('Invalid date format');
        
        db.get("SELECT id FROM regions WHERE id=?", [region_id], (err, region) => {
            if (err) return res.status(500).json({error: "Database error: " + err.message});
            if (!region) return res.status(404).json({error: "Region not found"});
            
            db.run("DELETE FROM history WHERE region_id=? AND date LIKE ?", [region_id, `${date}%`], function(err) {
                if (err) return res.status(500).json({error: "Delete failed: " + err.message});
                
                // Инвалидируем кеш
                dataCache.delete(`region_${region_id}`);
                
                // ВАЖНО: Загружаем свежие данные и возвращаем
                db.all("SELECT date, value FROM history WHERE region_id=? ORDER BY date DESC LIMIT 90", [region_id], (e2, history) => {
                    res.json({
                        ok: true,
                        message: `Day ${date} deleted`,
                        history: (history || []).reverse()
                    });
                });
            });
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/shift_day', (req, res) => {
    try {
        const region_id = validateInput(req.body.region_id, 'number', 1, 10000);
        
        db.get("SELECT id FROM regions WHERE id=?", [region_id], (err, region) => {
            if (err) return res.status(500).json({error: "Database error: " + err.message});
            if (!region) return res.status(404).json({error: "Region not found"});
            
            // Получаем последнюю дату
            db.get("SELECT MAX(date) as last FROM history WHERE region_id=?", [region_id], (e, r) => {
                if (e) return res.status(500).json({error: "Query error: " + e.message});
                if (!r || !r.last) return res.status(400).json({error: "No history data"});
                
                const next = new Date(r.last);
                next.setDate(next.getDate() + 1);
                const nextDateStr = next.toISOString().split('T')[0];
                
                // Удаляем самый старый день
                db.run("DELETE FROM history WHERE region_id=? AND date = (SELECT MIN(date) FROM history WHERE region_id=?)", [region_id, region_id], (err) => {
                    if (err) return res.status(500).json({error: "Delete failed: " + err.message});
                    
                    // Добавляем новый день с последним значением
                    db.run("INSERT INTO history (region_id, date, value) SELECT ?,?,value FROM history WHERE region_id=? ORDER BY date DESC LIMIT 1", 
                        [region_id, nextDateStr, region_id], function(err) {
                            if (err) return res.status(500).json({error: "Insert failed: " + err.message});
                            
                            // Инвалидируем кеш
                            dataCache.delete(`region_${region_id}`);
                            
                            // ВАЖНО: Загружаем свежие данные и возвращаем
                            db.all("SELECT date, value FROM history WHERE region_id=? ORDER BY date DESC LIMIT 90", [region_id], (e2, history) => {
                                res.json({
                                    ok: true,
                                    message: `Day shifted to ${nextDateStr}`,
                                    history: (history || []).reverse()
                                });
                            });
                        }
                    );
                });
            });
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/news', (req,res) => {
    try {
        const { author_id, text, image, btn_text, btn_link, tags, is_highlighted } = req.body;
        if (!author_id || !text) return res.status(400).json({ error: 'Missing author_id or text' });
        
        db.run("INSERT INTO news (author_id,text,image,date,btn_text,btn_link,tags,is_highlighted) VALUES (?,?,?,?,?,?,?,?)", 
            [author_id, text, image || null, new Date().toISOString(), btn_text || null, btn_link || null, tags || null, is_highlighted?1:0], 
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to create news: ' + err.message });
                dataCache.delete('news');
                res.json({ok:true, id:this.lastID});
            }
        );
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.delete('/api/news/:id', (req,res) => {
    try {
        const id = validateInput(req.params.id, 'number', 1, 1000000);
        db.run("DELETE FROM news WHERE id=?", [id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete news: ' + err.message });
            dataCache.delete('news');
            res.json({ok:true});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/authors', (req,res) => {
    try {
        const { name, handle, avatar, bio, is_verified } = req.body;
        if (!name) return res.status(400).json({ error: 'Missing name' });
        
        db.run("INSERT INTO authors (name,handle,avatar,bio,is_verified) VALUES (?,?,?,?,?)", 
            [name, handle || null, avatar || null, bio || null, is_verified?1:0], 
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to create author: ' + err.message });
                dataCache.delete('authors_list');
                res.json({ok:true, id:this.lastID});
            }
        );
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.delete('/api/authors/:id', (req,res) => {
    try {
        const id = validateInput(req.params.id, 'number', 1, 1000000);
        db.run("DELETE FROM authors WHERE id=?", [id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete author: ' + err.message });
            dataCache.delete('authors_list');
            res.json({ok:true});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

// --- AUTH ENDPOINTS ---
app.post('/api/auth/login', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Missing password" });

    // Default admin auth (simplified for config-manager)
    const correctPassword = 'admin'; // CHANGE THIS!
    
    if (password === correctPassword) {
        res.json({ ok: true, message: "Login successful", admin: true });
    } else {
        res.status(401).json({ error: "Invalid password" });
    }
});

// --- NEW AUTHOR AUTH ---
app.post('/api/author/set-password', (req, res) => {
    const { author_id, password } = req.body;
    if (!author_id || !password) return res.status(400).json({ error: "Missing author_id or password" });

    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) return res.status(500).json({ error: "Server error during password hashing" });
        db.run("UPDATE authors SET password = ?, access_level = 1, failed_login_attempts = 0, lock_expires_at = NULL WHERE id = ?", [hash, author_id], function(err) {
            if (err) return res.status(500).json({ error: "Failed to update password" });
            res.json({ ok: true, message: "Password updated successfully" });
        });
    });
});

app.post('/api/author/login', (req, res) => {
    const { handle, password } = req.body;
    if (!handle || !password) return res.status(400).json({ error: "Missing handle or password" });

    const sql = "SELECT * FROM authors WHERE handle = ?";
    db.get(sql, [handle], (err, author) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (!author) return res.status(404).json({ error: "Author not found" });

        // Check if account is locked
        if (author.lock_expires_at && new Date(author.lock_expires_at) > new Date()) {
            return res.status(403).json({ error: `Account is locked until ${new Date(author.lock_expires_at).toLocaleString()}` });
        }

        if (!author.password) return res.status(403).json({ error: "Password not set for this author" });

        bcrypt.compare(password, author.password, (err, result) => {
            if (err) return res.status(500).json({ error: "Server error during password comparison" });

            if (result) {
                // Password is correct, reset failed attempts
                const resetSql = "UPDATE authors SET failed_login_attempts = 0, lock_expires_at = NULL WHERE id = ?";
                db.run(resetSql, [author.id]);
                
                // Exclude password and lock info from the response
                const { password, failed_login_attempts, lock_expires_at, ...authorData } = author;
                res.json({ ok: true, message: "Login successful", author: authorData });
            } else {
                // Password is incorrect, increment failed attempts
                const newAttempts = (author.failed_login_attempts || 0) + 1;
                
                if (newAttempts >= 4) {
                    // Lock account for 1 year
                    const lockDate = new Date();
                    lockDate.setFullYear(lockDate.getFullYear() + 1);
                    const lockSql = "UPDATE authors SET failed_login_attempts = ?, lock_expires_at = ? WHERE id = ?";
                    db.run(lockSql, [newAttempts, lockDate.toISOString(), author.id], () => {
                         res.status(401).json({ error: "Invalid credentials. Account has been locked for 1 year due to too many failed attempts." });
                    });
                } else {
                    // Just increment the counter
                    const incrementSql = "UPDATE authors SET failed_login_attempts = ? WHERE id = ?";
                    db.run(incrementSql, [newAttempts, author.id], () => {
                        res.status(401).json({ error: `Invalid credentials. ${4 - newAttempts} attempts remaining before account lock.` });
                    });
                }
            }
        });
    });
});

// MARKERS
app.post('/api/markers', (req,res) => {
    try {
        const { lat, lng, desc } = req.body;
        if (lat === undefined || lng === undefined) return res.status(400).json({ error: 'Missing lat or lng' });
        
        const latitude = validateInput(lat, 'number', -90, 90);
        const longitude = validateInput(lng, 'number', -180, 180);
        
        db.run("INSERT INTO markers (lat,lng,desc) VALUES (?,?,?)", [latitude, longitude, desc || ''], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create marker: ' + err.message });
            res.json({ok:true, id:this.lastID});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.delete('/api/markers/:id', (req,res) => {
    try {
        const id = validateInput(req.params.id, 'number', 1, 1000000);
        db.run("DELETE FROM markers WHERE id=?", [id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete marker: ' + err.message });
            res.json({ok:true});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

// NOTIFICATIONS
app.post('/api/notify', (req,res) => {
    try {
        const { title, body, type } = req.body;
        if (!title) return res.status(400).json({ error: 'Missing title' });
        
        db.run("INSERT INTO notifications (title,body,type) VALUES (?,?,?)", [title, body || '', type || 'info'], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to create notification: ' + err.message });
            res.json({ok:true, id:this.lastID});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/reports', (req,res) => {
    console.log("📋 POST /api/reports received");
    db.run("INSERT INTO reports (text, image, created_at) VALUES (?,?,?)", [req.body.text, req.body.image, new Date().toISOString()], function(err) {
        if(err) {
            console.error("❌ Report error:", err);
            return res.json({ok: false, error: err.message});
        }
        console.log("✅ Report saved:", this.lastID);
        res.json({ok:true});
    });
});

app.get('/api/reports', (req,res) => {
    db.all("SELECT id, text, image, created_at FROM reports ORDER BY id DESC", (err, rows) => {
        res.json(rows || []);
    });
});

// CONSCIENCE HISTORY - История Совести
app.get('/api/conscience_history', (req,res) => {
    db.all("SELECT id, title, text, icon, image, _order, enabled FROM conscience_history WHERE enabled=1 ORDER BY _order ASC", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post('/api/conscience_history', (req,res) => {
    try {
        const { title, text, icon, image, _order } = req.body;
        if (!title) return res.status(400).json({ error: 'Missing title' });
        
        db.run(
            "INSERT INTO conscience_history (title, text, icon, image, _order, enabled) VALUES (?,?,?,?,?,?)",
            [title || '', text || '', icon || '🕊️', image || null, _order || 0, 1],
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to create entry: ' + err.message });
                // Clear cache
                dataCache.delete('conscience_history');
                res.json({ok:true, id: this.lastID, title, text, icon, image, _order, enabled: 1});
            }
        );
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.delete('/api/conscience_history/:id', (req,res) => {
    try {
        const id = validateInput(req.params.id, 'number', 1, 1000000);
        db.run("DELETE FROM conscience_history WHERE id=?", [id], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to delete entry: ' + err.message });
            // Clear cache
            dataCache.delete('conscience_history');
            res.json({ok:true});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

// Disable/Enable conscience history button
app.post('/api/conscience_history/button/toggle', (req,res) => {
    try {
        const { enabled } = req.body;
        db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('conscience_button_enabled', ?)", [enabled ? '1' : '0'], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            dataCache.delete('settings');
            res.json({ok:true, enabled});
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

// Get conscience button status
app.get('/api/conscience_button_enabled', (req,res) => {
    db.get("SELECT value FROM settings WHERE key='conscience_button_enabled'", (err, row) => {
        const enabled = row?.value !== '0';
        res.json({enabled});
    });
});

// ===== WIDGET LAYOUTS (iOS HOME SCREEN CUSTOMIZATION) =====

// Get user's widget layout
app.get('/api/widget-layouts/:userId', (req, res) => {
    try {
        const userId = validateInput(req.params.userId, 'string', 1, 500);
        db.get("SELECT widget_order FROM widget_layouts WHERE user_id=?", [userId], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            const order = row?.widget_order ? JSON.parse(row.widget_order) : null;
            res.json({ order });
        });
    } catch(e) {
        res.status(400).json({ error: e.message });
    }
});

// Save user's widget layout
app.post('/api/widget-layouts', (req, res) => {
    try {
        const { userId, widgetOrder } = req.body;
        const clean_userId = validateInput(userId, 'string', 1, 500);
        if (!Array.isArray(widgetOrder)) throw new Error('widgetOrder must be array');
        
        const now = new Date().toISOString();
        const order_json = JSON.stringify(widgetOrder);
        
        db.run(
            "INSERT OR REPLACE INTO widget_layouts (user_id, widget_order, created_at, updated_at) VALUES (?, ?, COALESCE((SELECT created_at FROM widget_layouts WHERE user_id=?), ?), ?)",
            [clean_userId, order_json, clean_userId, now, now],
            function(err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ ok: true, order: widgetOrder });
            }
        );
    } catch(e) {
        res.status(400).json({ error: e.message });
    }
});

// Delete widget layout (reset to default)
app.delete('/api/widget-layouts/:userId', (req, res) => {
    try {
        const userId = validateInput(req.params.userId, 'string', 1, 500);
        db.run("DELETE FROM widget_layouts WHERE user_id=?", [userId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true });
        });
    } catch(e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/optimize', (req,res) => db.run("VACUUM", [], ()=>res.json({ok:true})));

app.listen(PORT, () => console.log(`✅ Server OK on port ${PORT}`));
