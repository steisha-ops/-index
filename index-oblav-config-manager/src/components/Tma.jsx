
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Save, Plus, Trash2, RefreshCw, Calendar } from 'lucide-react';

const Tma = () => {
    const [activeTab, setActiveTab] = useState('graphs');
    const [regions, setRegions] = useState([]);
    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(3.0);
    const [history, setHistory] = useState([]);
    const [newDate, setNewDate] = useState({ date: '', value: '3.0' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadRegions();
    }, []);

    const loadRegions = async () => {
        setLoading(true);
        const rList = await api.getRegions() || [];
        setRegions(rList);
        if (rList.length > 0 && !selectedRegionId) {
            loadRegionData(rList[0].id);
        }
        setLoading(false);
    };

    const loadRegionData = async (id) => {
        if (!id) return;
        setSelectedRegionId(id);
        const data = await api.getRegionData(id);
        if (data.region) setSelectedIndex(Number(data.region.current_index).toFixed(1));
        if (Array.isArray(data.history)) setHistory(data.history.sort((a, b) => new Date(a.date) - new Date(b.date)));
        else setHistory([]);
    };

    const handleSaveIndex = async () => {
        if (!selectedRegionId) return;
        setLoading(true);
        await api.updateRegionIndex(selectedRegionId, selectedIndex);
        await loadRegionData(selectedRegionId);
        setMessage('✅ Индекс сохранён');
        setTimeout(() => setMessage(''), 2000);
        setLoading(false);
    };

    const handleAddDay = async () => {
        if (!newDate.date || !selectedRegionId) return;
        setLoading(true);
        await api.updateRegionHistory(selectedRegionId, newDate.date, newDate.value);
        setNewDate({ date: '', value: '3.0' });
        await loadRegionData(selectedRegionId);
        setMessage('✅ День добавлен');
        setTimeout(() => setMessage(''), 2000);
        setLoading(false);
    };

    const handleEditDay = async (date, value) => {
        const n = prompt('Новое значение:', value);
        if (n !== null && n !== value) {
            setLoading(true);
            await api.updateRegionHistory(selectedRegionId, date, n);
            await loadRegionData(selectedRegionId);
            setMessage('✅ День обновлён');
            setTimeout(() => setMessage(''), 2000);
            setLoading(false);
        }
    };

    const handleDeleteDay = async (date) => {
        if (!confirm(`Удалить ${date}?`)) return;
        setLoading(true);
        await api.deleteHistoryDay(selectedRegionId, date);
        await loadRegionData(selectedRegionId);
        setMessage('✅ День удалён');
        setTimeout(() => setMessage(''), 2000);
        setLoading(false);
    };

    const handleShiftDay = async () => {
        if (!confirm('Сдвинуть все дни на +1?')) return;
        setLoading(true);
        await api.shiftDay(selectedRegionId);
        await loadRegionData(selectedRegionId);
        setMessage('✅ День сдвинут');
        setTimeout(() => setMessage(''), 2000);
        setLoading(false);
    };

    const currentRegionName = regions.find(r => r.id == selectedRegionId)?.name || '...';

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="text-blue-500"/>
                ТМА: Управление Графиками
            </h1>
            
            <div className="flex gap-2 p-3 bg-[#1a1a1a] rounded-lg border border-[#333]">
                <button className={`py-2 px-4 rounded font-bold text-sm transition ${activeTab === 'graphs' ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('graphs')}>📊 Графики</button>
                <button className={`py-2 px-4 rounded font-bold text-sm transition ${activeTab === 'news' ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('news')}>📰 Новости</button>
                <button className={`py-2 px-4 rounded font-bold text-sm transition ${activeTab === 'authors' ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('authors')}>👤 Авторы</button>
            </div>

            {message && <div className={`p-3 rounded-lg border text-sm font-bold ${message.startsWith('✅') ? 'bg-green-900/30 border-green-500 text-green-300' : 'bg-red-900/30 border-red-500 text-red-300'}`}>{message}</div>}

            {activeTab === 'graphs' && (
                <div className="space-y-6">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs text-gray-400 font-bold mb-2 block">РЕГИОН</label>
                            <select value={selectedRegionId||''} onChange={(e) => loadRegionData(e.target.value)} disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500">
                                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <button onClick={loadRegions} disabled={loading} className="bg-blue-600/30 text-blue-400 px-4 py-3 rounded-lg border border-blue-500/50 hover:bg-blue-600/50 transition"><RefreshCw size={18}/></button>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Индекс: {currentRegionName}</h2>
                            <span className="text-4xl font-mono text-blue-500 font-bold">{Number(selectedIndex).toFixed(1)}</span>
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs text-gray-400 font-bold block">Слайдер (1-11)</label>
                            <input type="range" min="1" max="11" step="0.1" value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value).toFixed(1))} disabled={loading} className="w-full h-3 rounded-lg accent-blue-500 cursor-pointer" />
                        </div>
                        <button onClick={handleSaveIndex} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                            <Save size={18}/>
                            {loading ? 'Сохранение...' : 'Сохранить Индекс'}
                        </button>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Plus size={18} className="text-green-500"/> Добавить День</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">ДАТА</label>
                                <input type="date" value={newDate.date} onChange={(e) => setNewDate({...newDate, date:e.target.value})} disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">ЗНАЧЕНИЕ</label>
                                <input type="number" step="0.1" min="1" max="11" value={newDate.value} onChange={(e) => setNewDate({...newDate, value:e.target.value})} disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        <button onClick={handleAddDay} disabled={loading || !newDate.date} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                            <Plus size={18}/>
                            {loading ? 'Добавление...' : 'Добавить'}
                        </button>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">История дней ({history.length})</h3>
                            <button onClick={handleShiftDay} disabled={loading || !history.length} className="bg-yellow-600/30 text-yellow-500 px-3 py-2 rounded border border-yellow-600/50 hover:bg-yellow-600/50 transition text-xs font-bold">Сдвинуть +1</button>
                        </div>
                        {history.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">Нет данных</div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                                {history.map(h => (
                                    <div key={h.date} onClick={() => handleEditDay(h.date, h.value)} className="bg-[#111] border border-[#333] p-3 rounded-lg cursor-pointer hover:bg-[#222] hover:border-blue-500/50 transition group relative">
                                        <div className="text-[11px] text-gray-500 uppercase font-bold mb-2">{h.date}</div>
                                        <div className="text-2xl font-mono font-bold text-green-400">{Number(h.value).toFixed(1)}</div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteDay(h.date); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><Trash2 size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'news' && <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center text-gray-500">📰 Управление новостями (в разработке)</div>}
            {activeTab === 'authors' && <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center text-gray-500">👤 Управление авторами (в разработке)</div>}
        </div>
    );
};

export default Tma;
