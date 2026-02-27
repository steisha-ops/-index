
import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { Globe, BarChart3, Layout, MessageSquare, Trash2, Plus, Monitor, FileCode, Bell, Map as MapIcon, Send, Calendar, X, RefreshCw, Sun, Moon, Edit, Heart, Image as ImgIcon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Tma from './components/Tma'; // Импорт нового компонента
import ImageEditor from './components/ImageEditor';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25,41], iconAnchor: [12,41] });
L.Marker.prototype.options.icon = DefaultIcon;

const AddMarkerClick = ({ onAdd }) => { useMapEvents({ click: (e) => { const desc = prompt("Метка:"); if(desc) onAdd({ lat: e.latlng.lat, lng: e.latlng.lng, desc }); } }); return null; };

// LOGIN - Auto-login enabled
const Login = ({ onSuccess }) => {
    useEffect(() => {
        onSuccess();
    }, [onSuccess]);
    return null;
};

export default function ConfigManager() {
    const [auth, setAuth] = useState(true);
    if(!auth) return <Login onSuccess={()=>setAuth(true)}/>;
    return (
        <div className="h-screen w-full bg-black flex items-center justify-center p-4 text-white font-sans">
            <ConfigWindow onLogout={()=>setAuth(false)} />
        </div>
    );
}

const ConfigWindow = ({ onLogout }) => {
    const [tab, setTab] = useState('tma'); // Start here
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // DATA
    const [regions, setRegions] = useState([]);
    const [selectedRegionId, setSelectedRegionId] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(3.0);
    const [selectedHistory, setSelectedHistory] = useState([]);
    const [buttons, setButtons] = useState([]);
    const [popups, setPopups] = useState([]);
    const [pages, setPages] = useState([]);
    const [markers, setMarkers] = useState([]);

    // FORMS
    const [newReg, setNewReg] = useState({name:'', lat:'55.75', lng:'37.61', zoom:'11'});
    const [newPopup, setNewPopup] = useState({title:'', text:'', image:''});
    const [newBtn, setNewBtn] = useState({label:'', icon:'', type:'link', value:''});
    const [newPage, setNewPage] = useState({slug:'', title:'', content:'', is_hidden: false});
    const [notif, setNotif] = useState({title:'', body:'', type:'info'});
    const [newDate, setNewDate] = useState({date: '', value: '3.0'});
    const [conscienceHistory, setConscienceHistory] = useState([]);
    const [newConscienceEntry, setNewConscienceEntry] = useState({title:'', text:'', icon:'', image:'', _order: 0});
    const [conscienceButtonEnabled, setConscienceButtonEnabled] = useState(true);
    const [showImageEditor, setShowImageEditor] = useState(false);
    const [editingImageUrl, setEditingImageUrl] = useState('');
    const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

    useEffect(() => { refresh(); }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (regionDropdownOpen && e.target.closest) {
                const dropdown = document.querySelector('[data-dropdown="regions"]');
                if (!e.target.closest('[data-dropdown="regions"]')) {
                    setRegionDropdownOpen(false);
                }
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [regionDropdownOpen]);

    const showMessage = (msg, isError = false) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const refresh = async () => {
        try {
            setLoading(true);
            const rList = await api.getRegions() || [];
            setRegions(rList);
            if (rList.length > 0) {
                const target = selectedRegionId || rList[0].id;
                loadRegionData(target);
            }
            const btnsList = await api.getButtons() || [];
            if (!btnsList.error) setButtons(btnsList);
            
            const popupsList = await api.getPopups() || [];
            if (!popupsList.error) setPopups(popupsList);
            
            const pagesList = await api.getPages() || [];
            if (!pagesList.error) setPages(pagesList);
            
            const markersList = await api.getMarkers() || [];
            if (!markersList.error) setMarkers(markersList);
        } catch(e) {
            showMessage(`❌ Ошибка загрузки данных: ${e.message}`, true);
        } finally {
            setLoading(false);
        }
    };

    const loadRegionData = async (id) => {
        if(!id) return;
        setSelectedRegionId(id);
        const data = await api.getRegionData(id);
        if (data.region) setSelectedIndex(data.region.current_index);
        if (Array.isArray(data.history)) setSelectedHistory(data.history.sort((a,b)=>new Date(a.date)-new Date(b.date)));
        else setSelectedHistory([]);
    };

    // ACTIONS
    const handleSaveIndex = async () => { 
        if(!selectedRegionId) return alert("Выберите регион!");
        
        console.log(`💾 Saving index: ${selectedIndex}`);
        const res = await api.updateRegionIndex(selectedRegionId, selectedIndex); 
        
        if(res.ok) {
            console.log(`✅ Save successful`);
            // Используем данные прямо из ответа сервера - они уже свежие!
            if (res.region) {
                console.log(`🔄 Updating state with fresh data from server:`, res.region);
                setSelectedIndex(res.region.current_index);
            }
            if (res.history) {
                console.log(`🔄 Updating history with ${res.history.length} items`);
                setSelectedHistory(res.history.sort((a,b)=>new Date(a.date)-new Date(b.date)));
            }
            alert('✅ Индекс сохранён');
        } else {
            alert(`❌ Ошибка: ${res.error || 'Unknown'}`);
        }
    };
    const handleHistoryEdit = async (d, v) => { 
        const n = prompt('Введите новое значение:', v); 
        if(n && !isNaN(parseFloat(n))) { 
            const res = await api.updateRegionHistory(selectedRegionId, d, n); 
            if(res.ok) {
                // Обновляем состояние со свежими данными из сервера
                if (res.history) {
                    setSelectedHistory(res.history.sort((a,b)=>new Date(a.date)-new Date(b.date)));
                } else {
                    await loadRegionData(selectedRegionId);
                }
                alert("✅ Значение обновлено");
            } else {
                alert(`❌ Ошибка: ${res.error || 'Unknown'}`);
            }
        } else if(n) {
            alert("❌ Введите число");
        }
    };
    const handleDeleteDay = async (e, date) => { 
        e.stopPropagation(); 
        if(confirm(`Удалить ${date}?`)) { 
            const res = await api.deleteHistoryDay(selectedRegionId, date); 
            if(res.ok) {
                if (res.history) {
                    setSelectedHistory(res.history.sort((a,b)=>new Date(a.date)-new Date(b.date)));
                } else {
                    await loadRegionData(selectedRegionId);
                }
                alert("✅ День удален");
            } else {
                alert(`❌ Ошибка: ${res.error || 'Unknown'}`);
            }
        } 
    };
    const handleAddDay = async () => { 
        if(!newDate.date) return alert("Выберите дату!");
        if(!newDate.value || isNaN(parseFloat(newDate.value))) return alert("Введите число!");
        const res = await api.updateRegionHistory(selectedRegionId, newDate.date, newDate.value); 
        if(res.ok) {
            setNewDate({date: '', value: '3.0'});
            await loadRegionData(selectedRegionId);
            alert("✅ День добавлен");
        } else {
            alert(`❌ Ошибка: ${res.error || 'Unknown'}`);
        }
    };
    const handleShiftDay = async () => { 
        if(confirm("Сдвинуть дни? (удалит первый, добавит новый последний)")) { 
            const res = await api.shiftDay(selectedRegionId); 
            if(res.ok) {
                loadRegionData(selectedRegionId);
                alert("✅ График сдвинут");
            } else {
                alert(`❌ Ошибка: ${res.error || 'Unknown'}`);
            }
        }
    };
    const handleCreateRegion = async () => { 
        if(!newReg.name) {
            showMessage("❌ Введите название региона!", true);
            return;
        }
        setLoading(true);
        const res = await api.addRegion(newReg); 
        if(res.ok) {
            setNewReg({name:'', lat:'55.75', lng:'37.61', zoom:'11'});
            refresh();
            showMessage("✅ Регион создан!");
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown error'}`, true);
        }
        setLoading(false);
    };
    const createPopup = async () => { 
        if(!newPopup.title) {
            showMessage("❌ Введите название popup!", true);
            return;
        }
        setLoading(true);
        const popupData = {title:newPopup.title, text:newPopup.text||'', image:newPopup.image||''};
        const res = await api.addPopup(popupData); 
        if(res.ok) {
            // Сразу добавляем попап в состояние
            setPopups([...popups, {id: res.id, ...popupData}]);
            setNewPopup({title:'', text:'', image:''});
            showMessage("✅ Popup создан!");
            // Затем загружаем полный список с сервера
            const popupsList = await api.getPopups();
            if (popupsList && !popupsList.error) setPopups(popupsList);
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown error'}`, true);
        }
        setLoading(false);
    };
    const createPage = async () => { 
        if(!newPage.slug || !newPage.title) {
            showMessage("❌ Введите slug и title!", true);
            return;
        }
        setLoading(true);
        const pageData = {slug:newPage.slug, title:newPage.title, content:newPage.content||'', is_hidden: newPage.is_hidden ? 1 : 0};
        const res = await api.addPage(pageData); 
        if(res.ok) {
            // Сразу добавляем страницу в состояние
            setPages([...pages, {id: res.id, ...pageData}]);
            setNewPage({slug:'', title:'', content:'', is_hidden: false});
            showMessage("✅ Страница создана!");
            // Затем загружаем полный список с сервера
            const pagesList = await api.getPages();
            if (pagesList && !pagesList.error) setPages(pagesList);
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown error'}`, true);
        }
        setLoading(false);
    };
    const handleAddMarker = async (d) => { 
        setLoading(true);
        const res = await api.addMarker(d); 
        if(res.ok) {
            refresh();
            showMessage("✅ Метка добавлена!");
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown error'}`, true);
        }
        setLoading(false);
    };
    const handleSendNotif = async () => { 
        if(!notif.title) {
            showMessage("❌ Введите заголовок!", true);
            return;
        }
        setLoading(true);
        const res = await api.sendNotification(notif); 
        if(res.ok) {
            setNotif({title:'', body:'', type:'info'});
            showMessage("✅ Уведомление отправлено!");
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown error'}`, true);
        }
        setLoading(false);
    };
    
    // --- CREATE BUTTON (С типом THEME) ---
    const createButton = async () => { 
        if(!newBtn.label) {
            showMessage("❌ Введите название кнопки!", true);
            return;
        }
        
        let l=newBtn.value; 
        if(newBtn.type==='popup') {
            if(!l) {
                showMessage("❌ Выберите popup!", true);
                return;
            }
            l=`popup:${l}`; 
        }
        if(newBtn.type==='page') {
            if(!l) {
                showMessage("❌ Выберите страницу!", true);
                return;
            }
            l=`/${l}`;
        }
        
        // Магия для смены темы
        if(newBtn.type==='theme') {
            l='action:theme_toggle';
            // Если иконка не задана, ставим Солнце/Луну
            if(!newBtn.icon) newBtn.icon = 'Sun'; 
            if(!newBtn.label) newBtn.label = 'Тема';
        }
        
        if(newBtn.type==='link' && !l) {
            showMessage("❌ Введите URL!", true);
            return;
        }

        setLoading(true);
        const btnData = {label:newBtn.label, icon:newBtn.icon||'Info', link:l||'#'};
        const res = await api.addButton(btnData); 
        if(res.ok) {
            // Сразу добавляем кнопку в состояние
            setButtons([...buttons, {id: res.id, ...btnData}]);
            setNewBtn({label:'', icon:'', type:'link', value:''});
            showMessage("✅ Кнопка добавлена!");
            // Затем загружаем полный список с сервера
            const btnsList = await api.getButtons();
            if (btnsList && !btnsList.error) setButtons(btnsList);
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown error'}`, true);
        }
        setLoading(false);
    };

    const delBtn = (id) => { 
        if(confirm("Удалить кнопку? Это действие нельзя будет отменить.")) {
            setLoading(true);
            api.deleteButton(id).then(res => {
                if(res.ok) {
                    refresh();
                    showMessage("✅ Кнопка удалена");
                } else {
                    showMessage(`❌ Ошибка: ${res.error || 'Unknown'}`, true);
                }
                setLoading(false);
            });
        }
    };
    const delPop = (id) => { 
        if(confirm("Удалить popup? Это действие нельзя будет отменить.")) {
            setLoading(true);
            api.deletePopup(id).then(res => {
                if(res.ok) {
                    refresh();
                    showMessage("✅ Popup удалён");
                } else {
                    showMessage(`❌ Ошибка: ${res.error || 'Unknown'}`, true);
                }
                setLoading(false);
            });
        }
    };
    const delPage = (id) => { 
        if(confirm("Удалить страницу? Это действие нельзя будет отменить.")) {
            setLoading(true);
            api.deletePage(id).then(res => {
                if(res.ok) {
                    refresh();
                    showMessage("✅ Страница удалена");
                } else {
                    showMessage(`❌ Ошибка: ${res.error || 'Unknown'}`, true);
                }
                setLoading(false);
            });
        }
    };
    const delReg = (id) => { 
        if(confirm("Удалить регион? Это удалит все данные для этого региона!")) {
            setLoading(true);
            api.deleteRegion(id).then(res => {
                if(res.ok) {
                    refresh();
                    showMessage("✅ Регион удален");
                } else {
                    showMessage(`❌ Ошибка: ${res.error || 'Unknown'}`, true);
                }
                setLoading(false);
            });
        }
    };
    const delMark = (id) => { 
        if(confirm("Удалить метку?")) {
            setLoading(true);
            api.deleteMarker(id).then(res => {
                if(res.ok) {
                    refresh();
                    showMessage("✅ Метка удалена");
                } else {
                    showMessage(`❌ Ошибка: ${res.error || 'Unknown'}`, true);
                }
                setLoading(false);
            });
        }
    };

    // ИСТОРИЯ СОВЕСТИ 
    const loadConscienceHistory = async () => {
        const res = await api.getConscienceHistory();
        if (Array.isArray(res)) {
            setConscienceHistory(res.sort((a, b) => a._order - b._order));
        }
    };

    const loadConscienceButtonStatus = async () => {
        const res = await api.getConscienceButtonStatus();
        if (res.enabled !== undefined) {
            setConscienceButtonEnabled(res.enabled);
        }
    };

    const toggleConscienceButton = async (enabled) => {
        setLoading(true);
        const res = await api.toggleConscienceButton(enabled);
        if (res.ok) {
            setConscienceButtonEnabled(enabled);
            showMessage(`✅ Кнопка ${enabled ? 'включена' : 'отключена'}!`);
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown'}`, true);
        }
        setLoading(false);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Проверка размера (макс 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage("❌ Файл слишком большой (макс 5MB)", true);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result;
            if (typeof base64 === 'string') {
                setNewConscienceEntry({...newConscienceEntry, image: base64});
                showMessage("✅ Фото загружено!");
            }
        };
        reader.readAsDataURL(file);
    };

    const createConscienceEntry = async () => {
        if(!newConscienceEntry.title) {
            showMessage("❌ Введите название записи!", true);
            return;
        }
        setLoading(true);
        const entry = {
            title: newConscienceEntry.title,
            text: newConscienceEntry.text || '',
            icon: newConscienceEntry.icon || '🕊️',
            image: newConscienceEntry.image || '',
            _order: conscienceHistory.length
        };
        const res = await api.addConscienceEntry(entry);
        if(res.ok) {
            setNewConscienceEntry({title:'', text:'', icon:'', image:'', _order: 0});
            await loadConscienceHistory();
            showMessage("✅ Запись добавлена!");
        } else {
            showMessage(`❌ Ошибка: ${res.error || 'Unknown error'}`, true);
        }
        setLoading(false);
    };

    const deleteConscienceEntry = (id) => {
        if(confirm("Удалить запись из истории?")) {
            setLoading(true);
            api.deleteConscienceEntry(id).then(res => {
                if(res.ok) {
                    loadConscienceHistory();
                    showMessage("✅ Запись удалена");
                } else {
                    showMessage(`❌ Ошибка: ${res.error || 'Unknown'}`, true);
                }
                setLoading(false);
            });
        }
    };

    // Загружаем историю совести при монтировании компонента
    useEffect(() => {
        loadConscienceHistory();
        loadConscienceButtonStatus();
    }, []);

    const currentRegionName = regions.find(r => r.id == selectedRegionId)?.name || '...';

    return (
        <div className="w-full max-w-7xl h-[90vh] bg-[#111] border border-[#333] rounded-xl flex flex-col shadow-2xl overflow-hidden">
            {message && (
                <div className={`px-6 py-3 text-sm font-bold border-b border-[#333] ${
                    message.startsWith('✅') 
                        ? 'bg-green-900/30 text-green-300 border-green-500/30' 
                        : 'bg-red-900/30 text-red-300 border-red-500/30'
                }`}>
                    {message}
                </div>
            )}
            <div className="h-16 bg-[#1a1a1a] border-b border-[#333] flex items-center px-6 shrink-0 justify-between relative z-40">
                <div className="font-bold text-gray-200 text-lg flex items-center gap-2"><Monitor className="text-blue-500"/> Config Manager V29</div>
                <div className="flex gap-2 items-center relative">
                    {/* Custom Dropdown для регионов */}
                    <div className="relative" data-dropdown="regions">
                        <button 
                            onClick={() => setRegionDropdownOpen(!regionDropdownOpen)}
                            className="bg-[#333] hover:bg-[#444] text-white rounded px-3 py-1 outline-none text-sm border border-[#444] transition z-50 relative"
                        >
                            {regions.find(r => r.id == selectedRegionId)?.name || 'Выберите регион'} ▼
                        </button>
                        
                        {regionDropdownOpen && (
                            <>
                                {/* Backdrop */}
                                <div 
                                    className="fixed inset-0 bg-black/60 z-[99] flex items-center justify-center"
                                    onClick={() => setRegionDropdownOpen(false)}
                                >
                                    {/* Модальное окно - в центре экрана */}
                                    <div 
                                        className="bg-[#1a1a1a] rounded-2xl border border-pink-500/30 shadow-2xl z-[100] w-96 max-h-[80vh] overflow-hidden flex flex-col"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Header */}
                                        <div className="h-14 bg-gradient-to-r from-pink-600/20 to-blue-600/20 border-b border-[#444] flex items-center justify-between px-5 flex-shrink-0">
                                            <h3 className="text-base font-bold text-pink-400">📍 Выберите регион</h3>
                                            <button
                                                onClick={() => setRegionDropdownOpen(false)}
                                                className="text-gray-400 hover:text-white transition text-xl"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        
                                        {/* Список регионов */}
                                        <div className="flex-1 overflow-y-auto">
                                            {regions.map((r, idx) => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => {
                                                        loadRegionData(r.id);
                                                        setRegionDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-5 py-3 transition border-b border-[#333] hover:bg-[#222] flex items-center gap-3 ${
                                                        selectedRegionId == r.id 
                                                            ? 'bg-pink-600/20 text-pink-300 font-bold border-l-4 border-l-pink-500' 
                                                            : 'text-gray-300'
                                                    }`}
                                                >
                                                    <span className="text-lg">{idx === 0 ? '🏙️' : idx === 1 ? '🌆' : '🗺️'}</span>
                                                    <span className="flex-1">{r.name}</span>
                                                    {selectedRegionId == r.id && <span className="text-pink-400 text-lg">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="h-11 bg-[#111] border-t border-[#444] flex items-center px-5 flex-shrink-0">
                                            <span className="text-xs text-gray-500">Всего регионов: {regions.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <button onClick={refresh} disabled={loading} className="bg-blue-600/30 text-blue-400 px-3 py-1 rounded border border-blue-500/50 hover:bg-blue-600/50 text-xs font-bold transition disabled:opacity-50 relative z-30"><RefreshCw size={14}/></button>
                    <button onClick={onLogout} className="bg-red-600/30 text-red-400 px-3 py-1 rounded border border-red-500/50 hover:bg-red-600/50 text-xs font-bold transition relative z-30">Выход</button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className={`w-64 bg-[#161616] border-r border-[#333] p-4 flex flex-col gap-2 overflow-y-auto transition-all duration-300 ${
                    tab === 'conscience' ? 'hidden' : ''
                }`}>
                    <TabBtn icon={Edit} label="ТМА" active={tab==='tma'} onClick={()=>setTab('tma')} />
                    <TabBtn icon={Heart} label="События" active={tab==='conscience'} onClick={()=>{setTab('conscience'); loadConscienceHistory();}} />
                    <TabBtn icon={Layout} label="Контент" active={tab==='content'} onClick={()=>setTab('content')} />
                    <TabBtn icon={Globe} label="Регионы" active={tab==='regions'} onClick={()=>setTab('regions')} />
                    <TabBtn icon={BarChart3} label="График" active={tab==='graph'} onClick={()=>setTab('graph')} />
                    <TabBtn icon={MapIcon} label="Карта" active={tab==='map'} onClick={()=>setTab('map')} />
                    <TabBtn icon={Bell} label="Push" active={tab==='notify'} onClick={()=>setTab('notify')} />
                    <TabBtn icon={FileCode} label="Страницы" active={tab==='pages'} onClick={()=>setTab('pages')} />
                </div>

                <div className="flex-1 bg-[#000] p-8 overflow-y-auto relative">
                    
                    {tab === 'tma' && <Tma/>}

                    {tab === 'conscience' && (
                        <div className="flex gap-8 items-start w-full h-full flex-col">
                            {/* Close Button */}
                            <button 
                                onClick={() => setTab('tma')}
                                className="self-start px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition flex items-center gap-2"
                            >
                                ← Назад
                            </button>

                            <div className="flex gap-8 items-start flex-1 w-full overflow-hidden">
                            {/* История */}
                            <div className="flex-1 space-y-6 overflow-y-auto pr-4">
                                <h2 className="text-xl font-bold text-pink-400 mb-4">События Совести</h2>
                                
                                {/* Toggle Button */}
                                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-pink-500/30 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-pink-300 mb-1">Розовая тема кнопка</div>
                                        <div className="text-xs text-gray-400">Показывать в слайдере</div>
                                    </div>
                                    <button 
                                        onClick={() => toggleConscienceButton(!conscienceButtonEnabled)} 
                                        disabled={loading} 
                                        className={`px-4 py-2 rounded font-bold text-sm transition ${
                                            conscienceButtonEnabled 
                                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                                        }`}
                                    >
                                        {conscienceButtonEnabled ? '✓ Включена' : '✗ Отключена'}
                                    </button>
                                </div>

                                {/* История элементов */}
                                <div className="grid grid-cols-1 gap-4">
                                    {conscienceHistory && conscienceHistory.length > 0 ? (
                                        conscienceHistory.map((entry) => (
                                            <div key={entry.id} className="bg-[#111] rounded border border-[#333] hover:border-pink-500/50 transition overflow-hidden">
                                                {/* Фото вверху большое */}
                                                {entry.image && (
                                                    <div className="w-full h-40 overflow-hidden">
                                                        <img src={entry.image} alt="story" className="w-full h-full object-cover hover:scale-110 transition"/>
                                                    </div>
                                                )}
                                                
                                                {/* Информация */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-3xl">{entry.icon || '🕊️'}</span>
                                                                <div className="font-bold text-pink-300">{entry.title}</div>
                                                            </div>
                                                            <p className="text-xs text-gray-400 line-clamp-2">{entry.text}</p>
                                                            <div className="text-xs text-gray-600 mt-2">№{entry._order + 1}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => deleteConscienceEntry(entry.id)} 
                                                            className="text-red-500 hover:text-red-400 flex-shrink-0 mt-1"
                                                        >
                                                            <Trash2 size={18}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">Нет событий. Добавьте первое событие →</div>
                                    )}
                                </div>
                            </div>

                            {/* Форма добавления */}
                            <div className="w-80 space-y-4 overflow-y-auto pr-2 max-h-[calc(100vh-200px)]">
                                <div className="bg-[#1a1a1a] p-5 rounded-xl border border-pink-500/50 space-y-4">
                                    <h3 className="font-bold text-pink-400 flex items-center gap-2"><Heart size={18}/> Новое Событие</h3>
                                    
                                    {/* Редактор текста */}
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Иконка:</label>
                                        <input 
                                            value={newConscienceEntry.icon} 
                                            onChange={e => setNewConscienceEntry({...newConscienceEntry, icon: e.target.value})} 
                                            className="input-field text-sm" 
                                            placeholder="🕊️, ⚖️, 🤝..."
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Название:</label>
                                        <input 
                                            value={newConscienceEntry.title} 
                                            onChange={e => setNewConscienceEntry({...newConscienceEntry, title: e.target.value})} 
                                            className="input-field text-sm" 
                                            placeholder="Название события"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Описание:</label>
                                        <textarea 
                                            value={newConscienceEntry.text} 
                                            onChange={e => setNewConscienceEntry({...newConscienceEntry, text: e.target.value})} 
                                            className="input-field text-sm h-20 resize-none" 
                                            placeholder="Описание события"
                                        />
                                    </div>

                                    {/* Управление фото */}
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-2 font-bold">ФОТО СОБЫТИЯ:</label>
                                        
                                        {!newConscienceEntry.image ? (
                                            <div
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = (e) => handleImageUpload(e);
                                                    input.click();
                                                }}
                                                className="w-full h-32 rounded-lg border-2 border-dashed border-pink-500/50 flex items-center justify-center bg-[#111] hover:bg-[#1a1a1a] transition cursor-pointer"
                                            >
                                                <div className="text-center">
                                                    <ImgIcon size={32} className="mx-auto text-pink-500/50 mb-2"/>
                                                    <p className="text-xs text-gray-500 font-semibold">Нажми чтобы загрузить</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-400 font-bold">🖼️ Твое фото:</p>
                                                
                                                {/* Превью - кликабельно для редактора */}
                                                <div 
                                                    onClick={() => {
                                                        setEditingImageUrl(newConscienceEntry.image);
                                                        setShowImageEditor(true);
                                                    }}
                                                    className="bg-black rounded-lg border border-pink-500/50 overflow-hidden cursor-pointer hover:border-pink-400 transition group relative"
                                                >
                                                    <img 
                                                        src={newConscienceEntry.image} 
                                                        alt="preview" 
                                                        className="w-full h-auto object-contain max-h-64"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                                                        <span className="text-white font-bold opacity-0 group-hover:opacity-100 transition">✏️ Редактировать</span>
                                                    </div>
                                                </div>

                                                {/* Кнопки управления */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'image/*';
                                                            input.onchange = (e) => handleImageUpload(e);
                                                            input.click();
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-bold transition"
                                                    >
                                                        🔄 Заменить
                                                    </button>
                                                    <button
                                                        onClick={() => setNewConscienceEntry({...newConscienceEntry, image: ''})}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-bold transition"
                                                    >
                                                        ✕ Удалить
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Кнопка добавления */}
                                    <button 
                                        onClick={createConscienceEntry} 
                                        disabled={loading || !newConscienceEntry.title}
                                        className="btn-primary w-full text-sm bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2"
                                    >
                                        ✓ Добавить Событие
                                    </button>
                                </div>

                                <div className="text-xs text-gray-500 p-3 bg-[#1a1a1a] rounded border border-[#333]">
                                    💡 События показываются слайдером в приложении
                                </div>
                            </div>
                            </div>
                        </div>
                    )}

                    {tab === 'content' && <div className="flex gap-8 items-start"><div className="flex-1 space-y-6"><div><h3 className="font-bold mb-2 text-gray-400">Popups</h3><div className="grid grid-cols-2 gap-3">{popups.map(p => (<div key={p.id} className="bg-[#111] p-3 rounded border border-[#333] relative"><div className="font-bold">{p.title}</div><div className="text-xs text-gray-500 truncate">{p.text}</div><button onClick={()=>delPop(p.id)} className="absolute top-2 right-2 text-red-500"><Trash2 size={14}/></button></div>))}</div></div><div><h3 className="font-bold mb-2 text-gray-400">Buttons</h3><div className="space-y-2">{buttons.map(b => (<div key={b.id} className="bg-[#111] p-3 rounded border border-[#333] flex justify-between"><span>{b.label} <span className="text-gray-500 text-xs">({b.link})</span></span><button onClick={()=>delBtn(b.id)} className="text-red-500"><Trash2 size={16}/></button></div>))}</div></div></div><div className="w-80 space-y-6"><div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333]"><h3 className="font-bold mb-2 text-blue-400">Popup</h3><input value={newPopup.title} onChange={e=>setNewPopup({...newPopup, title:e.target.value})} className="input-field mb-2" placeholder="Title"/><textarea value={newPopup.text} onChange={e=>setNewPopup({...newPopup, text:e.target.value})} className="input-field mb-2 h-20" placeholder="Text"/><input value={newPopup.image} onChange={e=>setNewPopup({...newPopup, image:e.target.value})} className="input-field mb-2" placeholder="Img URL"/><button onClick={createPopup} className="btn-primary w-full text-xs">Create</button></div>
                    <div className="bg-[#1a1a1a] p-5 rounded-xl border border-[#333]">
                        <h3 className="font-bold mb-2 text-green-400">Кнопка / Виджет</h3>
                        <input value={newBtn.label} onChange={e=>setNewBtn({...newBtn, label:e.target.value})} className="input-field mb-2" placeholder="Название"/>
                        <input value={newBtn.icon} onChange={e=>setNewBtn({...newBtn, icon:e.target.value})} className="input-field mb-2" placeholder="Иконка"/>
                        
                        <div className="flex gap-1 mb-2 bg-[#222] p-1 rounded overflow-x-auto">
                            <button onClick={()=>setNewBtn({...newBtn, type:'link'})} className={`flex-1 text-[10px] py-1 rounded ${newBtn.type==='link'?'bg-blue-600':''}`}>Link</button>
                            <button onClick={()=>setNewBtn({...newBtn, type:'popup'})} className={`flex-1 text-[10px] py-1 rounded ${newBtn.type==='popup'?'bg-blue-600':''}`}>Pop</button>
                            <button onClick={()=>setNewBtn({...newBtn, type:'page'})} className={`flex-1 text-[10px] py-1 rounded ${newBtn.type==='page'?'bg-blue-600':''}`}>Page</button>
                            {/* NEW THEME BUTTON */}
                            <button onClick={()=>setNewBtn({...newBtn, type:'theme'})} className={`flex-1 text-[10px] py-1 rounded ${newBtn.type==='theme'?'bg-purple-600':''}`}>Theme</button>
                        </div>
                        
                        {newBtn.type==='link'&&<input value={newBtn.value} onChange={e=>setNewBtn({...newBtn, value:e.target.value})} className="input-field mb-2" placeholder="URL..."/>}
                        {newBtn.type==='popup'&&<select value={newBtn.value} onChange={e=>setNewBtn({...newBtn, value:e.target.value})} className="input-field mb-2"><option value="">Select</option>{popups.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>}
                        {newBtn.type==='page'&&<select value={newBtn.value} onChange={e=>setNewBtn({...newBtn, value:e.target.value})} className="input-field mb-2"><option value="">Select</option>{pages.map(p=><option key={p.id} value={p.slug}>{p.title}</option>)}</select>}
                        {newBtn.type==='theme'&&<div className="text-xs text-gray-500 mb-2">Создаст кнопку переключения темы.</div>}
                        
                        <button onClick={createButton} className="btn-primary w-full text-xs">Добавить</button>
                    </div>
                    </div></div>}

                    {/* (Other tabs are kept same) */}
                    {tab === 'regions' && <div className="flex gap-8 items-start"><div className="flex-1 space-y-6"><div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]"><h2 className="text-xl font-bold mb-4">Индекс: {currentRegionName}</h2><div className="flex items-center gap-4"><input type="range" min="1" max="11" step="0.1" value={selectedIndex} onChange={e=>setSelectedIndex(parseFloat(e.target.value))} className="w-full accent-blue-500"/><span className="text-4xl font-mono text-blue-500 font-bold w-24 text-right">{Number(selectedIndex).toFixed(1)}</span><button onClick={handleSaveIndex} className="bg-blue-600 px-4 py-2 rounded font-bold">Save</button></div></div><div className="grid grid-cols-2 gap-3">{regions.map(r => (<div key={r.id} className={`bg-[#111] border border-[#333] p-3 rounded flex justify-between items-center ${r.id==selectedRegionId?'border-blue-500/50':''}`}><div><div className="font-bold">{r.name}</div><div className="text-xs text-gray-500">Idx: {r.current_index}</div></div><button onClick={()=>delReg(r.id)} className="text-red-500 p-2"><Trash2 size={16}/></button></div>))}</div></div><div className="w-80 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]"><h3 className="font-bold mb-4 text-green-400">Новый Город</h3><input value={newReg.name} onChange={e=>setNewReg({...newReg, name:e.target.value})} placeholder="Название" className="input-field mb-2"/><div className="grid grid-cols-2 gap-2 mb-2"><input value={newReg.lat} onChange={e=>setNewReg({...newReg, lat:e.target.value})} placeholder="Lat" className="input-field"/><input value={newReg.lng} onChange={e=>setNewReg({...newReg, lng:e.target.value})} placeholder="Lng" className="input-field"/></div><input value={newReg.zoom} onChange={e=>setNewReg({...newReg, zoom:e.target.value})} placeholder="Zoom" className="input-field mb-2"/><button onClick={handleCreateRegion} className="btn-primary w-full bg-green-600">Создать</button></div></div>}
                    {tab === 'graph' && <div><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">График: {currentRegionName}</h2><button onClick={handleShiftDay} className="bg-yellow-600/20 text-yellow-500 px-4 py-2 rounded border border-yellow-600/30">Сдвинуть День (+1)</button></div><div className="grid grid-cols-8 gap-2">{selectedHistory.map(h => (<div key={h.date} onClick={()=>handleHistoryEdit(h.date, h.value)} className="bg-[#111] border border-[#333] p-2 rounded text-center cursor-pointer hover:bg-[#222] relative group"><div className="text-[10px] text-gray-500">{h.date}</div><div className="font-bold text-green-400">{Number(h.value).toFixed(1)}</div><button onClick={(e)=>handleDeleteDay(e, h.date)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"><X size={10}/></button></div>))}</div><div className="w-64 bg-[#1a1a1a] p-5 rounded-xl border border-[#333] mt-4"><h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={16} className="text-blue-400"/> Добавить День</h3><input type="date" value={newDate.date} onChange={e=>setNewDate({...newDate, date:e.target.value})} className="input-field mb-2"/><input type="number" step="0.1" value={newDate.value} onChange={e=>setNewDate({...newDate, value:e.target.value})} className="input-field mb-2"/><button onClick={handleAddDay} className="btn-primary w-full text-xs">Добавить</button></div></div>}
                    {tab === 'map' && <div className="h-full relative rounded-xl overflow-hidden border border-[#333]"><MapContainer center={[55.75, 37.61]} zoom={10} style={{height:'100%', width:'100%', filter:'invert(1)'}}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><AddMarkerClick onAdd={handleAddMarker}/>{markers.map(m=><Marker key={m.id} position={[m.lat,m.lng]}><Popup>{m.desc}</Popup></Marker>)}</MapContainer><div className="absolute top-4 right-4 bg-black/80 p-4 rounded-xl border border-white/20 backdrop-blur max-w-xs z-[1000]"><h3 className="font-bold mb-2">Метки</h3><div className="space-y-2 max-h-60 overflow-y-auto">{markers.map(m=><div key={m.id} className="flex justify-between items-center bg-white/10 p-2 rounded text-xs"><span>{m.desc}</span><button onClick={()=>delMark(m.id)} className="text-red-500 ml-2"><Trash2 size={14}/></button></div>)}</div></div></div>}
                    {tab === 'notify' && <div className="p-10 max-w-lg mx-auto"><div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4"><h2 className="text-xl font-bold flex gap-2"><Bell/> Push</h2><input value={notif.title} onChange={e=>setNotif({...notif, title:e.target.value})} className="input-field" placeholder="Title"/><textarea value={notif.body} onChange={e=>setNotif({...notif, body:e.target.value})} className="input-field h-24" placeholder="Body"/><button onClick={handleSendNotif} className="btn-primary w-full">Send</button></div></div>}
                    {tab === 'pages' && <div className="flex gap-8 items-start"><div className="flex-1 space-y-2">{pages.map(p => (<div key={p.id} className="bg-[#111] p-3 rounded border border-[#333] flex justify-between"><span>{p.title} <span className="text-blue-400 text-xs">/{p.slug}</span></span><button onClick={()=>delPage(p.id)} className="text-red-500"><Trash2 size={16}/></button></div>))}</div><div className="w-96 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]"><h3 className="font-bold mb-4">HTML Page</h3><input value={newPage.slug} onChange={e=>setNewPage({...newPage, slug:e.target.value})} placeholder="Slug" className="input-field mb-2"/><input value={newPage.title} onChange={e=>setNewPage({...newPage, title:e.target.value})} placeholder="Title" className="input-field mb-2"/><textarea value={newPage.content} onChange={e=>setNewPage({...newPage, content:e.target.value})} placeholder="HTML..." className="input-field h-40 mb-2 font-mono text-xs text-green-400 resize-none bg-[#0a0a0a]"/><div className="flex items-center gap-2 mb-4"><input type="checkbox" checked={newPage.is_hidden} onChange={e=>setNewPage({...newPage, is_hidden:e.target.checked})}/><span className="text-sm text-gray-400">Скрытая</span></div><button onClick={createPage} className="btn-primary w-full">Save</button></div></div>}

                    {/* Редактор фото модальное окно */}
                    {showImageEditor && (
                        <ImageEditor 
                            imageUrl={editingImageUrl}
                            onSave={(editedImage) => {
                                setNewConscienceEntry({...newConscienceEntry, image: editedImage});
                                setShowImageEditor(false);
                                setEditingImageUrl('');
                            }}
                            onCancel={() => {
                                setShowImageEditor(false);
                                setEditingImageUrl('');
                            }}
                        />
                    )}

                </div>
            </div>
        </div>
    );
};

const TabBtn = ({icon: Icon, label, active, onClick}) => (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}><Icon size={20}/> {label}</button>);
