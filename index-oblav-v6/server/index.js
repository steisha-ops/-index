import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const app = express();
const PORT = 3001;
const saltRounds = 10; // For bcrypt

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

const reqLog = {}; // Rate limiting
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

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Memory cache for frequently accessed data
const cache = {
    regions: null,
    authors: null,
    news: null,
    widgets: null,
    buttons: null,
    popups: null,
    pages: null,
    lastUpdate: {}
};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

// Путь к базе
const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("❌ DB Error:", err); } 
    else { console.log("✅ DB Connected."); initDb(); }
});

function initDb() {
    db.configure('busyTimeout', 5000);
    db.serialize(() => {
        // 1. ТАБЛИЦЫ
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
            `CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY, text TEXT, image TEXT, created_at TEXT)`
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

        // 2. НАПОЛНЕНИЕ (SEEDING)
        db.get("SELECT count(*) as c FROM regions", (e,r) => {
            if(r && r.c === 0) {
                console.log("🌱 Database is empty. Seeding...");
                
                db.serialize(() => {
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

                    console.log("✅ Seeding completed.");
                });
            } else {
                console.log("✅ Database already has data (regions count:", r?.c, ")");
            }
        });
    });
}

// --- CACHE HELPERS ---
const isCacheValid = (key) => cache.lastUpdate[key] && (Date.now() - cache.lastUpdate[key] < CACHE_TTL);
const setCache = (key, value) => { cache[key] = value; cache.lastUpdate[key] = Date.now(); };

// --- API ROUTES --

const get = (sql, cacheKey) => (req, res) => {
    if (cacheKey && isCacheValid(cacheKey)) {
        return res.json(cache[cacheKey] || []);
    }
    db.all(sql, (e,r) => {
        const result = r || [];
        if (cacheKey) setCache(cacheKey, result);
        res.json(result);
    });
};

// READ
app.get('/api/regions', get("SELECT * FROM regions", 'regions'));
app.get('/api/news', get("SELECT news.*, authors.name, authors.handle, authors.avatar, authors.is_verified FROM news LEFT JOIN authors ON news.author_id = authors.id ORDER BY news.id DESC", 'news'));
app.get('/api/widgets', get("SELECT * FROM widgets", 'widgets'));
app.get('/api/buttons', get("SELECT * FROM buttons", 'buttons'));
app.get('/api/popups', get("SELECT * FROM popups", 'popups'));
app.get('/api/pages', get("SELECT * FROM pages", 'pages'));
app.get('/api/markers', get("SELECT * FROM markers"));
app.get('/api/authors', (req, res) => {
    console.log("📍 GET /api/authors called");
    db.all("SELECT id, name, handle, avatar, bio, is_verified FROM authors", (err, rows) => {
        console.log("  Authors from DB:", rows?.length || 0, rows || []);
        if(err) console.error("  ERROR:", err);
        res.json(rows || []);
    });
});
app.get('/api/settings', get("SELECT * FROM settings"));

app.get('/api/authors/:id', (req, res) => {
    db.get("SELECT id, name, handle, avatar, bio, is_verified FROM authors WHERE id=?", [req.params.id], (e, a) => {
        db.all("SELECT * FROM news WHERE author_id=? ORDER BY id DESC", [req.params.id], (e2, n) => res.json({author:a||{}, news:n||[]}));
    });
});

app.get('/api/region_data/:id', (req, res) => {
    db.get("SELECT * FROM regions WHERE id=?", [req.params.id], (e, region) => {
        if(!region) return res.json({region: null, history: []});
        db.all("SELECT * FROM history WHERE region_id=? ORDER BY date ASC", [req.params.id], (e2, history) => {
            res.json({ region, history: history||[] });
        });
    });
});

app.get('/api/notifications/poll', (req, res) => {
    db.all("SELECT * FROM notifications WHERE id > ? ORDER BY id DESC LIMIT 1", [req.query.last_id||0], (e,r)=>res.json(r||[]));
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
app.post('/api/regions', (req, res) => db.run("INSERT INTO regions (name, lat, lng, zoom, current_index) VALUES (?,?,?,?,3.0)", [req.body.name, req.body.lat, req.body.lng, req.body.zoom], function(){
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
    res.json({ok:true});
}));
app.delete('/api/regions/:id', (req,res) => { db.run("DELETE FROM regions WHERE id=?",[req.params.id]); db.run("DELETE FROM history WHERE region_id=?",[req.params.id]); res.json({ok:true}); });

app.post('/api/update_region_index', (req, res) => {
    try {
        const id = validateInput(req.body.id, 'number', 1, 10000);
        const value = validateInput(req.body.value, 'number', 0.1, 11);
        db.run("UPDATE regions SET current_index=? WHERE id=?", [value, id], ()=>res.json({ok:true}));
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
        db.run("DELETE FROM history WHERE region_id=? AND date LIKE ?", [id, `${date}%`], () => {
            db.run("INSERT INTO history (region_id, date, value) VALUES (?,?,?)", [id, date, value], ()=>res.json({ok:true}));
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
        db.run("DELETE FROM history WHERE region_id=? AND date LIKE ?", [region_id, `${date}%`], ()=>res.json({ok:true}));
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/shift_day', (req, res) => {
    try {
        const region_id = validateInput(req.body.region_id, 'number', 1, 10000);
        db.get("SELECT MAX(date) as last FROM history WHERE region_id=?", [region_id], (e,r)=>{
            if(!r) return res.json({ok:false});
            const next = new Date(r.last); next.setDate(next.getDate()+1);
            db.run("DELETE FROM history WHERE region_id=? AND date = (SELECT MIN(date) FROM history WHERE region_id=?)", [region_id, region_id]);
            db.run("INSERT INTO history (region_id, date, value) SELECT ?,?,value FROM history WHERE region_id=? ORDER BY date DESC LIMIT 1", [region_id, next.toISOString().split('T')[0], region_id], ()=>res.json({ok:true}));
        });
    } catch(e) {
        res.status(400).json({error: e.message});
    }
});

app.post('/api/news', (req,res) => db.run("INSERT INTO news (author_id,text,image,date,btn_text,btn_link,tags,is_highlighted) VALUES (?,?,?,?,?,?,?,?)", [req.body.author_id,req.body.text,req.body.image,new Date().toISOString(),req.body.btn_text,req.body.btn_link,req.body.tags,req.body.is_highlighted?1:0], ()=>{ cache.news = null; res.json({ok:true});}));
app.delete('/api/news/:id', (req,res) => db.run("DELETE FROM news WHERE id=?", [req.params.id], ()=>{ cache.news = null; res.json({ok:true});}));

app.post('/api/authors', (req,res) => db.run("INSERT INTO authors (name,handle,avatar,bio,is_verified) VALUES (?,?,?,?,?)", [req.body.name,req.body.handle,req.body.avatar,req.body.bio,req.body.is_verified?1:0], ()=>{ cache.authors = null; res.json({ok:true});}));
app.delete('/api/authors/:id', (req,res) => db.run("DELETE FROM authors WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

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

// --- ENDPOINTS ---
app.get('/api/markers', get("SELECT * FROM markers"));
app.post('/api/markers', (req,res) => db.run("INSERT INTO markers (lat,lng,desc) VALUES (?,?,?)", [req.body.lat,req.body.lng,req.body.desc], ()=>res.json({ok:true})));
app.delete('/api/markers/:id', (req,res) => db.run("DELETE FROM markers WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

app.post('/api/notify', (req,res) => db.run("INSERT INTO notifications (title,body,type) VALUES (?,?,?)", [req.body.title,req.body.body,req.body.type], ()=>res.json({ok:true})));

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

app.post('/api/optimize', (req,res) => db.run("VACUUM", [], ()=>res.json({ok:true})));

app.listen(PORT, () => console.log(`✅ Server OK on port ${PORT}`));
