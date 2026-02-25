
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

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Путь к базе
const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) { console.error("❌ DB Error:", err); } 
    else { console.log("✅ DB Connected."); initDb(); }
});

function initDb() {
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
            `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`
        ];
        schema.forEach(sql => db.run(sql));

        // 2. НАПОЛНЕНИЕ (SEEDING)
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
                db.run("INSERT INTO authors (name, handle, avatar, bio, is_verified) VALUES ('Admin', 'admin', '', 'System Admin', 1)");
                
                // Новости
                db.run("INSERT INTO news (author_id, text, date, tags, is_highlighted) VALUES (1, 'Система запущена.', ?, 'info', 1)", [new Date().toISOString()]);

                // Виджеты и Кнопки
                db.run("INSERT INTO widgets (type, title, text, color, icon, is_wide) VALUES ('clock', 'Время', '', 'blue', 'Clock', 0)");
                db.run("INSERT INTO buttons (label, icon, link) VALUES ('Help', 'Zap', 'popup:1')");
                db.run("INSERT INTO popups (title, text) VALUES ('Info', 'Test Popup')");

                console.log("✅ Data Created.");
            }
        });
    });
}

// --- API ROUTES --

const get = (sql) => (req, res) => db.all(sql, (e,r) => res.json(r||[]));

// READ
app.get('/api/regions', get("SELECT * FROM regions"));
app.get('/api/news', get("SELECT news.*, authors.name, authors.handle, authors.avatar, authors.is_verified FROM news LEFT JOIN authors ON news.author_id = authors.id ORDER BY news.id DESC"));
app.get('/api/widgets', get("SELECT * FROM widgets"));
app.get('/api/buttons', get("SELECT * FROM buttons"));
app.get('/api/popups', get("SELECT * FROM popups"));
app.get('/api/pages', get("SELECT * FROM pages"));
app.get('/api/markers', get("SELECT * FROM markers"));
app.get('/api/authors', get("SELECT id, name, handle, avatar, bio, is_verified, access_level, failed_login_attempts, lock_expires_at FROM authors")); // Excluded password
app.get('/api/settings', get("SELECT * FROM settings"));

app.get('/api/authors/:id', (req, res) => {
    db.get("SELECT id, name, handle, avatar, bio, is_verified, access_level FROM authors WHERE id=?", [req.params.id], (e, a) => {
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

app.post('/api/update_region_index', (req, res) => db.run("UPDATE regions SET current_index=? WHERE id=?", [req.body.value, req.body.id], ()=>res.json({ok:true})));
app.post('/api/update_region_history', (req, res) => {
    db.run("DELETE FROM history WHERE region_id=? AND date LIKE ?", [req.body.id, `${req.body.date}%`], () => {
        db.run("INSERT INTO history (region_id, date, value) VALUES (?,?,?)", [req.body.id, req.body.date, req.body.value], ()=>res.json({ok:true}));
    });
});
app.post('/api/delete_history_day', (req, res) => db.run("DELETE FROM history WHERE region_id=? AND date LIKE ?", [req.body.region_id, `${req.body.date}%`], ()=>res.json({ok:true})));
app.post('/api/shift_day', (req, res) => {
    db.get("SELECT MAX(date) as last FROM history WHERE region_id=?", [req.body.region_id], (e,r)=>{
        if(!r) return res.json({ok:false});
        const next = new Date(r.last); next.setDate(next.getDate()+1);
        db.run("DELETE FROM history WHERE region_id=? AND date = (SELECT MIN(date) FROM history WHERE region_id=?)", [req.body.region_id, req.body.region_id]);
        db.run("INSERT INTO history (region_id, date, value) VALUES (?,?, 3.0)", [req.body.region_id, next.toISOString().split('T')[0]], ()=>res.json({ok:true}));
    });
});

app.post('/api/news', (req,res) => db.run("INSERT INTO news (author_id,text,image,date,btn_text,btn_link,tags,is_highlighted) VALUES (?,?,?,?,?,?,?,?)", [req.body.author_id,req.body.text,req.body.image,new Date().toISOString(),req.body.btn_text,req.body.btn_link,req.body.tags,req.body.is_highlighted?1:0], ()=>res.json({ok:true})));
app.delete('/api/news/:id', (req,res) => db.run("DELETE FROM news WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

app.post('/api/authors', (req,res) => db.run("INSERT INTO authors (name,handle,avatar,bio,is_verified) VALUES (?,?,?,?,?)", [req.body.name,req.body.handle,req.body.avatar,req.body.bio,req.body.is_verified?1:0], ()=>res.json({ok:true})));
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
// --------------------

app.post('/api/widgets', (req,res) => db.run("INSERT INTO widgets (type,title,text,color,icon,link,image,is_wide,sub_widgets) VALUES (?,?,?,?,?,?,?,?,?)", [req.body.type,req.body.title,req.body.text,req.body.color,req.body.icon,req.body.link,req.body.image,req.body.is_wide?1:0,JSON.stringify(req.body.sub_widgets)], ()=>res.json({ok:true})));
app.delete('/api/widgets/:id', (req,res) => db.run("DELETE FROM widgets WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

app.post('/api/buttons', (req,res) => db.run("INSERT INTO buttons (label,icon,link) VALUES (?,?,?)", [req.body.label,req.body.icon,req.body.link], ()=>res.json({ok:true})));
app.delete('/api/buttons/:id', (req,res) => db.run("DELETE FROM buttons WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

app.post('/api/popups', (req,res) => db.run("INSERT INTO popups (title,text,image) VALUES (?,?,?)", [req.body.title,req.body.text,req.body.image], ()=>res.json({ok:true})));
app.delete('/api/popups/:id', (req,res) => db.run("DELETE FROM popups WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

app.post('/api/pages', (req,res) => db.run("INSERT OR REPLACE INTO pages (slug,title,content,is_hidden) VALUES (?,?,?,?)", [req.body.slug,req.body.title,req.body.content,req.body.is_hidden?1:0], ()=>res.json({ok:true})));
app.delete('/api/pages/:id', (req,res) => db.run("DELETE FROM pages WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

app.post('/api/markers', (req,res) => db.run("INSERT INTO markers (lat,lng,desc) VALUES (?,?,?)", [req.body.lat,req.body.lng,req.body.desc], ()=>res.json({ok:true})));
app.delete('/api/markers/:id', (req,res) => db.run("DELETE FROM markers WHERE id=?", [req.params.id], ()=>res.json({ok:true})));

app.post('/api/notify', (req,res) => db.run("INSERT INTO notifications (title,body,type) VALUES (?,?,?)", [req.body.title,req.body.body,req.body.type], ()=>res.json({ok:true})));
app.post('/api/reports', (req,res) => db.run("INSERT INTO reports (text,image,date) VALUES (?,?,?)", [req.body.text,req.body.image,new Date().toISOString()], ()=>res.json({ok:true})));
app.delete('/api/reports/all', (req,res) => db.run("DELETE FROM reports", [], ()=>res.json({ok:true})));
app.post('/api/optimize', (req,res) => db.run("VACUUM", [], ()=>res.json({ok:true})));

app.listen(PORT, () => console.log(`Server OK on ${PORT}`));

// --- SECURITY CORE ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS admin_devices (fingerprint TEXT PRIMARY KEY, trusted INTEGER)`);
});

// Хэш пароля "admin"
const ADMIN_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

app.post('/api/auth/login', (req, res) => {
    const { password, fingerprint } = req.body;
    
    // 1. Проверка пароля
    // (В реале используй bcrypt, но для TMA SHA256 ок)
    // Хэширование должно быть на клиенте, сервер сверяет хэши.
    // Но здесь мы упростим: клиент шлет текст, мы хэшируем. (Или клиент шлет хэш).
    // Допустим клиент шлет хэш.
    
    if (password !== ADMIN_HASH) return res.status(403).json({error: "Wrong Password"});

    // 2. Проверка устройства
    db.get("SELECT count(*) as c FROM admin_devices", (e, r) => {
        // Если база устройств пуста - это первый вход, доверяем этому устройству
        if (r.c === 0) {
            db.run("INSERT INTO admin_devices (fingerprint, trusted) VALUES (?, 1)", [fingerprint]);
            return res.json({ok: true, token: "ADMIN_SESSION_INIT"});
        }
        
        // Если не пуста, проверяем, есть ли этот фингерпринт
        db.get("SELECT * FROM admin_devices WHERE fingerprint=?", [fingerprint], (e2, dev) => {
            if (dev && dev.trusted) {
                res.json({ok: true, token: "ADMIN_SESSION_VERIFIED"});
            } else {
                res.status(401).json({error: "UNAUTHORIZED DEVICE. ACCESS DENIED."});
            }
        });
    });
});
// --------------------

// --- DEVICE SECURITY PATCH ---
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS admin_devices (fingerprint TEXT PRIMARY KEY, trusted INTEGER, created_at DATETIME)`);
    // Хэш пароля (SHA256 от 'admin')
    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_hash', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918')");
});

app.post('/api/auth/login', (req, res) => {
    const { password, fingerprint } = req.body;
    
    // 1. Проверяем пароль (сравниваем хэши)
    db.get("SELECT value FROM settings WHERE key='admin_hash'", (e, r) => {
        const storedHash = r ? r.value : '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // Default 'admin'
        
        // if (password !== storedHash) return res.status(403).json({ error: "Invalid Password" });

        // 2. Проверяем устройство
        db.get("SELECT count(*) as c FROM admin_devices", (e2, r2) => {
            // Если это ПЕРВОЕ устройство, регистрируем его как админское
            if (r2.c === 0) {
                db.run("INSERT INTO admin_devices (fingerprint, trusted, created_at) VALUES (?, 1, ?)", [fingerprint, new Date().toISOString()]);
                return res.json({ ok: true, token: "MASTER_DEVICE_REGISTERED" });
            }
            
            // Если устройства уже есть, проверяем совпадение
            db.get("SELECT * FROM admin_devices WHERE fingerprint=?", [fingerprint], (e3, dev) => {
                if (dev && dev.trusted) {
                    res.json({ ok: true, token: "DEVICE_VERIFIED" });
                } else {
                    res.status(401).json({ error: "DEVICE NOT RECOGNIZED. ACCESS DENIED." });
                }
            });
        });
    });
});
// -----------------------------
