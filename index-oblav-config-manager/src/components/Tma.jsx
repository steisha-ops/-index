
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Save, Plus, Trash2, RefreshCw, Calendar, Box } from 'lucide-react';

const Tma = () => {
    const [activeTab, setActiveTab] = useState('graphs');
    const [regions, setRegions] = useState([]);
    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(Number(3.0));
    const [displayIndex, setDisplayIndex] = useState('3.0'); // Текущее значение индекса в БД
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
        // Добавляем nocache параметр чтобы избежать кешированных данных
        const data = await api.getRegionData(id, true);
        if (data.region) {
            const indexNum = Number(data.region.current_index);
            setSelectedIndex(indexNum);
            setDisplayIndex(indexNum.toFixed(1));
            console.log(`✅ [TMAJS] Region ${id} loaded: index=${indexNum.toFixed(1)}`);
        }
        if (Array.isArray(data.history)) {
            const sortedHistory = data.history.sort((a, b) => new Date(a.date) - new Date(b.date));
            setHistory(sortedHistory);
            console.log(`✅ [TMAJS] Region ${id} history loaded: ${sortedHistory.length} items`);
        }
        else setHistory([]);
    };

    const handleSaveIndex = async () => {
        if (!selectedRegionId) {
            setMessage('❌ Выберите регион!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        
        // Валидация значения - selectedIndex это число
        let numValue = Number(selectedIndex);
        if (isNaN(numValue) || numValue < 1 || numValue > 11) {
            setMessage('❌ Значение от 1 до 11!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        
        // Нормализуем с точностью 1 знак
        numValue = Math.round(numValue * 10) / 10;
        
        setLoading(true);
        setMessage(`⏳ Сохранение индекса: ${numValue.toFixed(1)}...`);
        try {
            console.log(`🔄 [TMAJS SAVE] Saving index ${selectedRegionId} to ${numValue}`);
            const result = await api.updateRegionIndex(selectedRegionId, numValue);
            if (result.ok) {
                console.log(`✅ [TMAJS SAVE] Server confirmed update`, result);
                // НЕ полагаемся на локальное состояние - перезагружаем со сервера!
                // Добавляем небольшую задержку чтобы убедиться что БД обновилась
                await new Promise(r => setTimeout(r, 100));
                await loadRegionData(selectedRegionId);
                setMessage(`✅ Индекс сохранён: ${numValue.toFixed(1)}`);
            } else {
                setMessage(`❌ ${result.error || 'Ошибка сохранения'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
    };

    const handleAddDay = async () => {
        if (!newDate.date) {
            setMessage('❌ Выберите дату!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        if (!selectedRegionId) {
            setMessage('❌ Выберите регион!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        
        const numValue = Number(newDate.value);
        if (isNaN(numValue) || numValue < 1 || numValue > 11) {
            setMessage('❌ Значение от 1 до 11!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        
        // Проверка, что дата не в будущем
        const selectedDate = new Date(newDate.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
            setMessage('❌ Нельзя добавлять будущие дни!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        
        setLoading(true);
        setMessage('⏳ Добавление дня...');
        try {
            const result = await api.updateRegionHistory(selectedRegionId, newDate.date, numValue);
            if (result.ok) {
                // Сразу очищаем форму
                setNewDate({ date: '', value: '3.0' });
                // Затем загружаем обновленные данные
                await loadRegionData(selectedRegionId);
                setMessage('✅ День добавлен успешно');
            } else {
                setMessage(`❌ ${result.error || 'Ошибка добавления'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
    };

    const handleEditDay = async (date, value) => {
        const n = prompt('Введите новое значение (1-11):', value);
        if (n === null) return;
        
        const numValue = Number(n);
        if (isNaN(numValue) || numValue < 1 || numValue > 11) {
            setMessage('❌ Значение должно быть от 1 до 11!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        
        setLoading(true);
        setMessage('⏳ Обновление дня...');
        try {
            console.log(`🔄 [TMAJS EDIT] Updating day ${date}: ${value} → ${numValue}`);
            const result = await api.updateRegionHistory(selectedRegionId, date, numValue);
            if (result.ok) {
                // Сразу обновляем локально
                const updatedHistory = history.map(h => 
                    h.date === date ? {...h, value: numValue} : h
                );
                setHistory(updatedHistory);
                console.log(`✅ [TMAJS EDIT] Day ${date} updated in state to ${numValue}`);
                // Затем загружаем полные данные со сервера
                await loadRegionData(selectedRegionId);
                setMessage('✅ День обновлён успешно');
            } else {
                setMessage(`❌ ${result.error || 'Ошибка обновления'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
    };

    const handleDeleteDay = async (date) => {
        if (!confirm(`Удалить данные за ${date}? Это действие нельзя будет отменить.`)) return;
        setLoading(true);
        setMessage('⏳ Удаление дня...');
        try {
            const result = await api.deleteHistoryDay(selectedRegionId, date);
            if (result.ok) {
                // Сразу удаляем из состояния
                const updatedHistory = history.filter(h => h.date !== date);
                setHistory(updatedHistory);
                console.log(`✅ [TMAJS EDIT] Day ${date} deleted from state`);
                // Затем загружаем полные данные со сервера
                await loadRegionData(selectedRegionId);
                setMessage('✅ День удалён успешно');
            } else {
                setMessage(`❌ ${result.error || 'Ошибка удаления'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
    };

    const handleShiftDay = async () => {
        if (!confirm('Сдвинуть все дни на +1? Первый день будет удалён, и добавится новый последний день с последним значением.')) return;
        setLoading(true);
        setMessage('⏳ Сдвигание дней...');
        try {
            const result = await api.shiftDay(selectedRegionId);
            if (result.ok) {
                // Сразу загружаем новые данные
                await loadRegionData(selectedRegionId);
                setMessage('✅ Дни сдвинуты успешно');
            } else {
                setMessage(`❌ ${result.error || 'Ошибка сдвига'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
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
        if (!newWidget.title.trim()) {
            setMessage('❌ Заполните название виджета!');
            setTimeout(() => setMessage(''), 2000);
            return;
        }
        setLoading(true);
        setMessage('⏳ Добавление виджета...');
        try {
            const result = await api.createWidget(newWidget);
            if (result.ok) {
                setNewWidget({ type: 'info', title: '', text: '', color: 'blue', icon: 'Box', is_wide: 0 });
                await loadWidgets();
                setMessage('✅ Виджет добавлен успешно');
            } else {
                setMessage(`❌ ${result.error || 'Ошибка добавления'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
    };

    const handleDeleteWidget = async (id) => {
        if (!confirm('Удалить виджет? Это действие нельзя будет отменить.')) return;
        setLoading(true);
        setMessage('⏳ Удаление виджета...');
        try {
            const result = await api.deleteWidget(id);
            if (result.ok) {
                await loadWidgets();
                setMessage('✅ Виджет удалён успешно');
            } else {
                setMessage(`❌ ${result.error || 'Ошибка удаления'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
    };

    const handleSaveForecasts = async () => {
        setLoading(true);
        setMessage('⏳ Сохранение прогнозов...');
        try {
            const result = await api.saveForecasts(forecasts);
            if (result.ok) {
                setMessage('✅ Прогнозы сохранены успешно');
                // Очищаем локальный кэш
                localStorage.removeItem('forecasts_cache');
                localStorage.removeItem('forecasts_cache_time');
                // Перезагружаем прогнозы со сервера
                await loadForecasts();
            } else {
                setMessage(`❌ ${result.error || 'Ошибка сохранения'}`);
            }
        } catch (e) {
            setMessage(`❌ Ошибка: ${e.message}`);
        }
        setTimeout(() => setMessage(''), 3000);
        setLoading(false);
    };

    const handleUpdateForecast = (index, field, value) => {
        const updated = [...forecasts];
        updated[index] = { ...updated[index], [field]: isNaN(value) ? value : Number(value) };
        setForecasts(updated);
    };

    const currentRegionName = regions.find(r => r.id == selectedRegionId)?.name || '...';

    // Функция форматирования даты из ISO (2024-03-01) в DD.MM.YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <TrendingUp className="text-blue-500"/>
                    ТМА: Управление Графиками
                </h1>
                <div className="flex gap-2">
                    <button 
                        onClick={() => loadRegionData(selectedRegionId)} 
                        disabled={loading || !selectedRegionId}
                        title="Загрузить свежие данные индекса и графика"
                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={18}/>
                        Обновить
                    </button>
                </div>
            </div>
            
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
                        
                        {/* Шкала риска */}
                        <div className="bg-[#111] rounded-lg p-4 border border-[#444]">
                            <div className="text-xs text-gray-400 font-bold mb-2">УРОВЕНЬ РИСКА</div>
                            <div className="flex gap-1 mb-3">
                                <div className={`flex-1 h-2 rounded-lg transition ${Number(selectedIndex) <= 2 ? 'bg-green-500' : 'bg-green-900/30'}`} title="Низкий (1-2)"/>
                                <div className={`flex-1 h-2 rounded-lg transition ${Number(selectedIndex) > 2 && Number(selectedIndex) <= 4 ? 'bg-green-400' : 'bg-green-900/20'}`} title="Низко-средний (2-4)"/>
                                <div className={`flex-1 h-2 rounded-lg transition ${Number(selectedIndex) > 4 && Number(selectedIndex) <= 6 ? 'bg-yellow-500' : 'bg-yellow-900/20'}`} title="Средний (4-6)"/>
                                <div className={`flex-1 h-2 rounded-lg transition ${Number(selectedIndex) > 6 && Number(selectedIndex) <= 8 ? 'bg-orange-500' : 'bg-orange-900/20'}`} title="Высокий (6-8)"/>
                                <div className={`flex-1 h-2 rounded-lg transition ${Number(selectedIndex) > 8 ? 'bg-red-500' : 'bg-red-900/20'}`} title="Критический (8-11)"/>
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                                <div>{Number(selectedIndex) <= 2 ? '✅ Низкий риск' : Number(selectedIndex) <= 4 ? '✅ Низко-средний' : Number(selectedIndex) <= 6 ? '⚠️ Средний' : Number(selectedIndex) <= 8 ? '⚠️ Высокий' : '🔴 Критический'}</div>
                                <div className="text-[10px] text-gray-500 mt-2">Пожалуйста, проверьте корректность значения перед сохранением</div>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-xs text-gray-400 font-bold block">Слайдер управления (1-11)</label>
                            <input 
                                type="range" 
                                min="1" 
                                max="11" 
                                step="0.1" 
                                value={selectedIndex} 
                                onChange={(e) => setSelectedIndex(Number(e.target.value).toFixed(1))} 
                                disabled={loading} 
                                className="w-full h-3 rounded-lg accent-blue-500 cursor-pointer transition" 
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 px-1">
                                <span>1 (мин)</span>
                                <span>6 (сред)</span>
                                <span>11 (макс)</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleSaveIndex} 
                            disabled={loading} 
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18}/>
                            {loading ? 'Сохранение...' : 'Сохранить Индекс'}
                        </button>
                    </div>

                    <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Plus size={18} className="text-green-500"/> Добавить День</h3>
                        {history.length > 0 && (
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
                                📅 Доступный диапазон: {formatDate(history[0].date)} - {formatDate(history[history.length - 1].date)} (сегодня)
                            </div>
                        )}
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
                            <div className="flex gap-2">
                                <button 
                                    onClick={handleShiftDay} 
                                    disabled={loading || !history.length} 
                                    className="bg-yellow-600/30 text-yellow-500 px-3 py-2 rounded border border-yellow-600/50 hover:bg-yellow-600/50 transition text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Сдвинуть: удалить первый день, добавить новый последний с тем же значением"
                                >
                                    Сдвинуть +1
                                </button>
                            </div>
                        </div>
                        <div className="bg-[#111] rounded-lg p-3 border border-[#444]">
                            <div className="text-xs text-gray-400">
                                <div>📌 Кликните на день для редактирования значения</div>
                                <div>🗑️ Наведитесь для удаления дня</div>
                            </div>
                        </div>
                        {history.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                <div>нет данных</div>
                                <div className="text-xs mt-2">Добавьте первый день используя форму выше</div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                                {history.map((h, idx) => (
                                    <div 
                                        key={h.date} 
                                        onClick={() => handleEditDay(h.date, h.value)} 
                                        className="bg-[#111] border border-[#333] p-3 rounded-lg cursor-pointer hover:bg-[#222] hover:border-blue-500/50 transition group relative"
                                        title={`День ${idx + 1}: ${formatDate(h.date)}`}
                                    >
                                        <div className="text-[11px] text-gray-500 uppercase font-bold mb-2">{formatDate(h.date)}</div>
                                        <div className={`text-2xl font-mono font-bold ${
                                            Number(h.value) <= 2 ? 'text-green-400' : 
                                            Number(h.value) <= 4 ? 'text-green-300' : 
                                            Number(h.value) <= 6 ? 'text-yellow-400' : 
                                            Number(h.value) <= 8 ? 'text-orange-400' : 
                                            'text-red-400'
                                        }`}>
                                            {Number(h.value).toFixed(1)}
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteDay(h.date); }} 
                                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-red-700"
                                            title="Удалить этот день"
                                        >
                                            <Trash2 size={12}/>
                                        </button>
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
