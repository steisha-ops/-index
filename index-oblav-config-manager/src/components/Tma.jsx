
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Save, Plus, Trash2, RefreshCw, Calendar, Box } from 'lucide-react';

const Tma = () => {
    const [activeTab, setActiveTab] = useState('graphs');
    const [regions, setRegions] = useState([]);
    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(3.0);
    const [history, setHistory] = useState([]);
    const [newDate, setNewDate] = useState({ date: '', value: '3.0' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [widgets, setWidgets] = useState([]);
    const [newWidget, setNewWidget] = useState({ type: 'info', title: '', text: '', color: 'blue', icon: 'Box', is_wide: 0 });
    const [forecasts, setForecasts] = useState([
        { day: 'ПН', risk: 45, label: 'Низкий', icon: '✅' },
        { day: 'ВТ', risk: 62, label: 'Средний', icon: '⚠️' },
        { day: 'СР', risk: 78, label: 'Высокий', icon: '⛔' },
        { day: 'ЧТ', risk: 85, label: 'Критический', icon: '🔴' },
        { day: 'ПТ', risk: 55, label: 'Средний', icon: '⚠️' },
        { day: 'СБ', risk: 30, label: 'Низкий', icon: '✅' },
        { day: 'ВС', risk: 20, label: 'Минимальный', icon: '✅' },
    ]);
    const [editingForecast, setEditingForecast] = useState(null);

    useEffect(() => {
        loadRegions();
        loadWidgets();
        loadForecasts();
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

    const loadWidgets = async () => {
        const w = await api.getWidgets() || [];
        setWidgets(w);
    };

    const loadForecasts = async () => {
        const f = await api.getForecasts() || [];
        if (Array.isArray(f) && f.length > 0) {
            setForecasts(f);
        }
    };

    const handleAddWidget = async () => {
        if (!newWidget.title) {
            setMessage('❌ Заполни название');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        setLoading(true);
        await api.createWidget(newWidget);
        setNewWidget({ type: 'info', title: '', text: '', color: 'blue', icon: 'Box', is_wide: 0 });
        await loadWidgets();
        setMessage('✅ Виджет добавлен');
        setTimeout(() => setMessage(''), 2000);
        setLoading(false);
    };

    const handleDeleteWidget = async (id) => {
        if (!confirm('Удалить виджет?')) return;
        setLoading(true);
        await api.deleteWidget(id);
        await loadWidgets();
        setMessage('✅ Виджет удалён');
        setTimeout(() => setMessage(''), 2000);
        setLoading(false);
    };

    const handleSaveForecasts = async () => {
        setLoading(true);
        setMessage('⏳ Сохранение...');
        try {
            const result = await api.saveForecasts(forecasts);
            if (result.ok) {
                setMessage('✅ Прогнозы сохранены');
                // Инвалидируем кеш прогнозов в localStorage
                localStorage.removeItem('forecasts_cache');
                localStorage.removeItem('forecasts_cache_time');
            } else {
                setMessage('❌ Ошибка сохранения');
            }
        } catch (e) {
            setMessage('❌ Ошибка сохранения');
        }
        setTimeout(() => setMessage(''), 2000);
        setLoading(false);
    };

    const handleUpdateForecast = (index, field, value) => {
        const updated = [...forecasts];
        updated[index] = { ...updated[index], [field]: isNaN(value) ? value : Number(value) };
        setForecasts(updated);
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
                <button className={`py-2 px-4 rounded font-bold text-sm transition ${activeTab === 'forecasts' ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('forecasts')}>🎖️ Прогнозы</button>
                <button className={`py-2 px-4 rounded font-bold text-sm transition ${activeTab === 'widgets' ? 'bg-blue-600 text-white' : 'bg-[#222] text-gray-400 hover:text-white'}`} onClick={() => setActiveTab('widgets')}>📦 Виджеты</button>
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

            {activeTab === 'forecasts' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">🎖️ Редактор Прогнозов</h2>
                        <p className="text-sm text-gray-400">Управление прогнозами облав по дням недели</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {forecasts.map((forecast, index) => (
                            <div key={forecast.day} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 space-y-3 hover:border-blue-500/50 transition">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">{forecast.icon}</div>
                                    <div className="text-xl font-bold text-blue-400">{forecast.day}</div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">РИСК (%)</label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value={forecast.risk} 
                                            onChange={(e) => handleUpdateForecast(index, 'risk', e.target.value)}
                                            disabled={loading}
                                            className="w-full h-2 rounded-lg accent-red-500 cursor-pointer"
                                        />
                                        <div className="text-center text-lg font-bold text-red-500 mt-1">{forecast.risk}%</div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">УРОВЕНЬ</label>
                                        <select 
                                            value={forecast.label} 
                                            onChange={(e) => handleUpdateForecast(index, 'label', e.target.value)}
                                            disabled={loading}
                                            className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-2 font-bold text-sm focus:outline-none focus:border-blue-500"
                                        >
                                            <option>Минимальный</option>
                                            <option>Низкий</option>
                                            <option>Средний</option>
                                            <option>Высокий</option>
                                            <option>Критический</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 font-bold block mb-1">ИКОНКА</label>
                                        <input 
                                            type="text" 
                                            value={forecast.icon} 
                                            onChange={(e) => handleUpdateForecast(index, 'icon', e.target.value)}
                                            disabled={loading}
                                            className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-2 font-bold text-center focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={handleSaveForecasts} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                        <Save size={18}/>
                        {loading ? 'Сохранение...' : 'Сохранить прогнозы'}
                    </button>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
                        💡 Совет: Установите риск в процентах для каждого дня. Уровень - это описание, иконка будет отображаться в интерфейсе.
                    </div>
                </div>
            )}

            {activeTab === 'widgets' && (
                <div className="space-y-6">
                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2"><Box className="text-purple-500"/> Добавить Виджет</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">ТИП</label>
                                <select value={newWidget.type} onChange={(e) => setNewWidget({...newWidget, type: e.target.value})} disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500">
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="success">Success</option>
                                    <option value="alert">Alert</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">НАЗВАНИЕ</label>
                                <input type="text" value={newWidget.title} onChange={(e) => setNewWidget({...newWidget, title: e.target.value})} placeholder="Название..." disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500 placeholder-gray-600" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-bold mb-2 block">ТЕКСТ</label>
                            <textarea value={newWidget.text} onChange={(e) => setNewWidget({...newWidget, text: e.target.value})} placeholder="Описание..." disabled={loading} rows="3" className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500 placeholder-gray-600 resize-none" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">ЦВЕТ</label>
                                <select value={newWidget.color} onChange={(e) => setNewWidget({...newWidget, color: e.target.value})} disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500">
                                    <option value="blue">Blue</option>
                                    <option value="red">Red</option>
                                    <option value="green">Green</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="purple">Purple</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">ИКОНКА</label>
                                <input type="text" value={newWidget.icon} onChange={(e) => setNewWidget({...newWidget, icon: e.target.value})} placeholder="Icon name" disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500 placeholder-gray-600" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold mb-2 block">ШИРОКИЙ</label>
                                <select value={newWidget.is_wide} onChange={(e) => setNewWidget({...newWidget, is_wide: parseInt(e.target.value)})} disabled={loading} className="w-full bg-[#222] border border-[#444] text-white rounded-lg p-3 font-bold focus:outline-none focus:border-blue-500">
                                    <option value="0">Нет</option>
                                    <option value="1">Да</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={handleAddWidget} disabled={loading || !newWidget.title} className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                            <Plus size={18}/>
                            {loading ? 'Добавление...' : 'Добавить Виджет'}
                        </button>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Виджеты ({widgets.length})</h3>
                            <button onClick={loadWidgets} disabled={loading} className="bg-blue-600/30 text-blue-400 px-3 py-2 rounded border border-blue-500/50 hover:bg-blue-600/50 transition text-xs font-bold"><RefreshCw size={14}/></button>
                        </div>
                        {widgets.length === 0 ? (
                            <div className="text-gray-500 text-center py-12">Нет виджетов</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {widgets.map(w => (
                                    <div key={w.id} className={`bg-[#111] border border-[#333] p-4 rounded-lg group relative ${w.is_wide ? 'md:col-span-2' : ''}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase font-bold">{w.type}</div>
                                                <div className="text-xl font-bold text-white mt-1">{w.title}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded font-bold text-white ${w.color === 'blue' ? 'bg-blue-600' : w.color === 'red' ? 'bg-red-600' : w.color === 'green' ? 'bg-green-600' : w.color === 'yellow' ? 'bg-yellow-600' : 'bg-purple-600'}`}>
                                                {w.color}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400 mb-3 line-clamp-2">{w.text || 'Нет описания'}</div>
                                        <div className="flex gap-2 items-center text-xs text-gray-500">
                                            <span>ID: {w.id}</span>
                                            <span>•</span>
                                            <span>{w.is_wide ? 'Широкий' : 'Обычный'}</span>
                                        </div>
                                        <button onClick={() => handleDeleteWidget(w.id)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-700">
                                            <Trash2 size={14}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tma;
