
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import basicAuth from 'express-basic-auth';

const app = express();
// Указываем отдельный порт для DB Guard, чтобы он не мешал основному приложению
const PORT = 3002;

// --- СИСТЕМА БЕЗОПАСНОСТИ ---
// Пароль можно будет поменять в переменных окружения для большей безопасности
const DB_GUARD_PASSWORD = process.env.DB_GUARD_PASSWORD || 'Obladb@Guard2024';

// Используем базовую аутентификацию: при первом входе браузер запросит логин и пароль.
// Логин: admin, Пароль: Obladb@Guard2024
app.use(basicAuth({
    users: { 'admin': DB_GUARD_PASSWORD },
    challenge: true,
    realm: 'DBGuard Secure Area',
}));

// --- МИДЛВЭРЫ ---
app.use(cors());
app.use(bodyParser.json());

// --- ПОДКЛЮЧЕНИЕ К ЕДИНОЙ БАЗЕ ДАННЫХ ---
// Сервер DB Guard будет смотреть в папку основного приложения и использовать ту же самую базу данных.
const dbPath = join(dirname(fileURLToPath(import.meta.url)), '../index-oblav-v6/server/database.sqlite');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error("❌ [DB Guard] Ошибка подключения к базе данных:", err.message);
    } else {
        console.log("✅ [DB Guard] База данных успешно подключена.");
    }
});

// --- API ДЛЯ РАБОТЫ С РЕПОРТАМИ ---

// Эндпоинт для получения всех репортов
app.get('/api/reports', (req, res) => {
    db.all("SELECT * FROM reports ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// Эндпоинт для удаления репорта
app.delete('/api/reports/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM reports WHERE id = ?", [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        res.json({ ok: true });
    });
});

// --- API ДЛЯ МОНИТОРИНГА ---

// Эндпоинт для получения статистики (CPU/RAM)
app.get('/api/stats', (req, res) => {
    try {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramUsage = Math.round((usedMem / totalMem) * 100);

        const cpus = os.cpus();
        const total = cpus.map(cpu => Object.values(cpu.times).reduce((acc, time) => acc + time, 0)).reduce((acc, total) => acc + total, 0);
        const idle = cpus.map(cpu => cpu.times.idle).reduce((acc, time) => acc + time, 0);
        const cpuUsage = 100 - Math.round((idle / total) * 100);

        res.json({
            cpu: cpuUsage,
            ram: ramUsage
        });
    } catch (e) {
        res.status(500).json({error: 'Could not get stats'});
    }
});

// --- ЗАПУСК СЕРВЕРА DB GUARD ---
app.listen(PORT, () => {
    console.log(`🛡️  DB Guard сервер запущен на порту ${PORT}`);
    console.log(`🔑 Логин: admin, Пароль: ${DB_GUARD_PASSWORD}`);
});
