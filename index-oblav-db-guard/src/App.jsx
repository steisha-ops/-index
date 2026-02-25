
import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { ShieldCheck, Activity, Database, FileSpreadsheet, Trash2, Image, Server, HardDrive, Cpu } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Компонент страницы входа больше не нужен, так как аутентификация обрабатывается сервером и браузером.

export default function DBGuard() {
    // Теперь мы просто отображаем основную панель управления.
    // Если пользователь не аутентифицирован, сервер вернет ошибку 401,
    // и api.js покажет соответствующее сообщение.
    return <Dashboard />;
}

const Dashboard = () => {
    const [tab, setTab] = useState('reports'); // Вкладка "Репорты" будет открываться по умолчанию
    const [stats, setStats] = useState({cpu:0, ram:0});
    const [reports, setReports] = useState([]);
    const [graph, setGraph] = useState([]);

    // Загрузка статистики для мониторинга
    useEffect(() => {
        const i = setInterval(async () => {
            const s = await api.getStats();
            if(s.cpu) {
                setStats(s);
                setGraph(p => [...p.slice(-20), {val: s.cpu}]);
            }
        }, 2000);
        // Загружаем репорты при первой загрузке
        loadReports();
        return () => clearInterval(i);
    }, []);

    // Функция загрузки репортов
    const loadReports = async () => {
        const d = await api.getReports();
        setReports(Array.isArray(d) ? d : []);
    };

    // Функция удаления репорта
    const handleDelete = async (id) => {
        if(confirm(`Вы уверены, что хотите удалить репорт #${id}?`)) { 
            await api.deleteReport(id); 
            loadReports(); // Перезагружаем список после удаления
        }
    };

    return (
        <div className="h-screen w-full bg-[#050505] p-6 text-white font-sans flex gap-6">
            {/* Боковая панель навигации */}
            <div className="w-64 bg-[#111] border border-[#222] rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 p-3 border-b border-b-white/10">
                    <ShieldCheck className="text-red-500"/>
                    <div className="font-bold text-lg">DB Guard</div>
                </div>
                <button onClick={()=>{setTab('reports'); loadReports();}} className={`p-3 rounded-xl flex gap-3 ${tab==='reports'?'bg-red-600':'bg-[#222]'}`}><Database/> Reports</button>
                <button onClick={()=>setTab('monitor')} className={`p-3 rounded-xl flex gap-3 ${tab==='monitor'?'bg-red-600':'bg-[#222]'}`}><Activity/> Monitor</button>
            </div>

            {/* Основное содержимое */}
            <div className="flex-1 bg-[#111] border border-[#222] rounded-2xl p-8 overflow-y-auto">
                {tab === 'monitor' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold mb-4">System Monitor</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333]"><div className="text-gray-400 font-bold mb-2 flex items-center gap-2"><Cpu size={18}/> CPU</div><div className="text-4xl font-mono">{stats.cpu}%</div></div>
                            <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333]"><div className="text-gray-400 font-bold mb-2 flex items-center gap-2"><HardDrive size={18}/> RAM</div><div className="text-4xl font-mono text-red-400">{stats.ram}%</div></div>
                        </div>
                        <div className="h-64 bg-[#151515] rounded-xl border border-[#333] p-4">
                            <ResponsiveContainer width="100%" height="100%"><AreaChart data={graph}><Area type="monotone" dataKey="val" stroke="#f87171" fill="#f87171" fillOpacity={0.2}/></AreaChart></ResponsiveContainer>
                        </div>
                    </div>
                )}

                {tab === 'reports' && (
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Reports</h2>
                            {/* Кнопка скачивания репортов */}
                            <button onClick={()=>api.downloadExcel(reports)} className="bg-green-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><FileSpreadsheet size={16}/> Скачать .CSV</button>
                        </div>
                        <div className="flex-1 overflow-auto bg-[#1a1a1a] rounded-xl border border-[#333]">
                            <table className="w-full text-left text-sm text-gray-300">
                                <thead className="bg-[#222] sticky top-0"><tr><th className="p-4">ID</th><th className="p-4">Дата</th><th className="p-4">Сообщение</th><th className="p-4">Фото</th><th className="p-4"></th></tr></thead>
                                <tbody>
                                    {reports.map(r => (
                                        <tr key={r.id} className="border-b border-[#222] hover:bg-[#252525]">
                                            <td className="p-4 text-red-400 font-mono">{r.id}</td>
                                            <td className="p-4 text-xs">{new Date(r.date).toLocaleString()}</td>
                                            <td className="p-4 truncate max-w-xs">{r.text}</td>
                                            <td className="p-4">
                                                {r.image ? (
                                                    <a href={r.image} target="_blank" rel="noopener noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-white/20 hover:scale-150 transition z-10 relative bg-black">
                                                        <img src={r.image} alt={`Report ${r.id}`} className="w-full h-full object-cover"/>
                                                    </a>
                                                ) : <div className="w-16 h-16 rounded-lg bg-[#222] flex items-center justify-center text-gray-600"><Image size={20}/></div>}
                                            </td>
                                            <td className="p-4 text-right"><button onClick={()=>handleDelete(r.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {reports.length === 0 && <div className="p-8 text-center text-gray-500">Новых репортов нет.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
