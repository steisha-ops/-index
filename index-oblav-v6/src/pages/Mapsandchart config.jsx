//неактив тест 
import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDdiE5mKLaeTwR58iHtxMVusmcdGltazzI'; 

const mapStyles = {
    width: '100%',
    height: '100%',
    borderRadius: '10px',
};

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
    { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
    { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
    { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

const Admin = () => {
    const [tab, setTab] = useState('dash');
    const [index, setIndex] = useState(3.0);
    const [region, setRegion] = useState('Москва');
    const [history, setHistory] = useState([]);
    const [buttons, setButtons] = useState([]);
    const [reports, setReports] = useState([]);
    const [markers, setMarkers] = useState([]);
    const [center, setCenter] = useState({ lat: 55.75, lng: 37.61 });
    
    // Forms
    const [newAuth, setNewAuth] = useState({name:'', handle:'', avatar:'', is_verified: false});
    const [newNews, setNewNews] = useState({author_id:'', text:'', image:''});
    const [authors, setAuthors] = useState([]);
    const [newBtn, setNewBtn] = useState({label:'', icon:'Info', link:''});

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script-admin',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY
    });

    useEffect(() => { refresh(); }, []);

    const refresh = () => {
        api.getSettings().then(s => { setIndex(s.index); setRegion(s.region); });
        api.getHistory().then(setHistory);
        api.getAuthors().then(setAuthors);
        api.getButtons().then(setButtons);
        api.getReports().then(setReports);
        api.getMarkers().then(setMarkers);
    };

    const saveSettings = async () => {
        await api.saveSetting('index', index);
        await api.saveSetting('region', region);
        // Очищаем кэш чтобы свежие данные загрузились
        api.clearCache();
        // Перезагружаем данные
        await refresh();
        alert('✅ Сохранено');
    };

    const editHistory = (date) => {
        const val = prompt('Новое значение для ' + date);
        if(val && !isNaN(parseFloat(val))) {
            api.updateHistory(date, val).then(() => refresh()).catch(err => alert('❌ Ошибка: ' + err));
        } else if(val) {
            alert('❌ Введите число');
        }
    };
    
    const deleteMarker = (id) => {
        if(window.confirm('Удалить метку?')) {
            api.deleteMarker(id).then(refresh);
        }
    };

    const handleMapClick = (e) => {
        const desc = prompt('Описание:');
        if (desc) {
            api.addMarker({ lat: e.latLng.lat(), lng: e.latLng.lng(), desc }).then(refresh);
        }
    };

    const mapOptions = useMemo(() => ({ 
        disableDefaultUI: true, 
        styles: darkMapStyle 
    }), []);
    
    const markersMemo = useMemo(() => markers.map(m => (
        <MarkerF key={m.id} position={{ lat: m.lat, lng: m.lng }} />
    )), [markers]);

    const renderContent = () => {
        if (tab === 'map') {
            if (loadError) return <div className="text-red-500">Ошибка загрузки карты.</div>
            if (GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') return (
                <div className="flex items-center justify-center h-full bg-gray-800 rounded-lg">
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold mb-4">Требуется API Ключ Google Карт</h2>
                        <p>Вставьте ключ в <code>src/pages/Admin.jsx</code></p>
                    </div>
                </div>
            )
            if (!isLoaded) return <div>Загрузка карты...</div>;
            
            return (
                <div className="h-full flex flex-col">
                    <div className="h-full relative">
                        <GoogleMap
                            mapContainerStyle={mapStyles}
                            center={center}
                            zoom={10}
                            options={mapOptions}
                            onClick={handleMapClick}
                        >
                            {markersMemo}
                        </GoogleMap>
                        <div className="absolute top-4 right-4 bg-black/70 p-4 rounded-lg z-10 w-64 backdrop-blur-sm border border-white/10">
                            <h3 className="font-bold mb-2 text-white">Метки</h3>
                            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                                {markers.length > 0 ? markers.map(m => (
                                    <div key={m.id} className="flex justify-between items-center bg-white/10 p-2 rounded text-xs text-white">
                                        <span>{m.desc}</span>
                                        <button onClick={() => deleteMarker(m.id)} className="text-red-500 hover:text-red-400 ml-2 shrink-0">Delete</button>
                                    </div>
                                )) : <div className="text-xs text-gray-400">Кликните на карту, чтобы добавить метку.</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        switch (tab) {
            case 'dash':
                return (
                    <div className="max-w-md space-y-6">
                        <h2 className="text-2xl font-bold">Главная</h2>
                        <div className="bg-[#2c2c2e] p-5 rounded-xl">
                            <label className="block text-gray-400 mb-2">Индекс: {Number(index).toFixed(1)}</label>
                            <input type="range" min="1" max="11" step="0.1" value={index} onChange={e=>setIndex(parseFloat(e.target.value))} className="w-full mb-4"/>
                            <label className="block text-gray-400 mb-2">Регион</label>
                            <input value={region} onChange={e=>setRegion(e.target.value)} className="w-full bg-black/30 p-2 rounded mb-4"/>
                            <button onClick={saveSettings} className="bg-blue-600 px-4 py-2 rounded">Сохранить</button>
                        </div>
                    </div>
                );
            case 'hist':
                return (
                    <div>
                         <h2 className="text-2xl font-bold mb-4">Редактор Истории (180 дней)</h2>
                         <div className="grid grid-cols-1 gap-1">
                            {history.map(h => (
                                <div key={h.date} onClick={()=>editHistory(h.date)} className="flex justify-between p-2 bg-[#2c2c2e] hover:bg-[#3c3c3e] cursor-pointer rounded border border-white/5">
                                    <span>{h.date}</span>
                                    <span className="font-mono text-green-400">{h.value}</span>
                                </div>
                            ))}
                         </div>
                    </div>
                );
            case 'news':
                return (
                     <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[#2c2c2e] p-4 rounded-xl space-y-3">
                            <h3 className="font-bold">1. Создать Автора</h3>
                            <input placeholder="Имя" value={newAuth.name} onChange={e=>setNewAuth({...newAuth, name:e.target.value})} className="w-full bg-black/30 p-2 rounded"/>
                            <input placeholder="@handle" value={newAuth.handle} onChange={e=>setNewAuth({...newAuth, handle:e.target.value})} className="w-full bg-black/30 p-2 rounded"/>
                            <input placeholder="Avatar URL" value={newAuth.avatar} onChange={e=>setNewAuth({...newAuth, avatar:e.target.value})} className="w-full bg-black/30 p-2 rounded"/>
                            <label><input type="checkbox" checked={newAuth.is_verified} onChange={e=>setNewAuth({...newAuth, is_verified:e.target.checked})}/> Verified</label>
                            <button onClick={()=>{api.createAuthor(newAuth).then(refresh)}} className="bg-blue-600 w-full py-2 rounded">Создать</button>
                        </div>
                        <div className="bg-[#2c2c2e] p-4 rounded-xl space-y-3">
                            <h3 className="font-bold">2. Пост</h3>
                            <select onChange={e=>setNewNews({...newNews, author_id:e.target.value})} className="w-full bg-black/30 p-2 rounded">
                                <option>Автор...</option>
                                {authors.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <textarea placeholder="Текст" value={newNews.text} onChange={e=>setNewNews({...newNews, text:e.target.value})} className="w-full bg-black/30 p-2 rounded"/>
                            <input placeholder="Image URL" value={newNews.image} onChange={e=>setNewNews({...newNews, image:e.target.value})} className="w-full bg-black/30 p-2 rounded"/>
                            <button onClick={()=>{api.postNews(newNews).then(refresh)}} className="bg-green-600 w-full py-2 rounded">Опубликовать</button>
                        </div>
                    </div>
                );
            case 'btns':
                 return (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">Кнопки на главной</h2>
                        <div className="bg-[#2c2c2e] p-4 rounded mb-4 flex gap-2">
                             <input placeholder="Название" value={newBtn.label} onChange={e=>setNewBtn({...newBtn, label:e.target.value})} className="bg-black/30 p-2 rounded"/>
                             <select value={newBtn.icon} onChange={e=>setNewBtn({...newBtn, icon:e.target.value})} className="bg-black/30 p-2 rounded">
                                <option value="Info">Info</option><option value="Shield">Shield</option><option value="Zap">Zap</option><option value="Link">Link</option>
                             </select>
                             <input placeholder="Ссылка" value={newBtn.link} onChange={e=>setNewBtn({...newBtn, link:e.target.value})} className="bg-black/30 p-2 rounded flex-1"/>
                             <button onClick={()=>{api.addButton(newBtn).then(refresh)}} className="bg-blue-600 px-4 rounded">Add</button>
                        </div>
                        <div className="space-y-2">
                            {buttons.map(b => (
                                <div key={b.id} className="flex justify-between bg-[#2c2c2e] p-3 rounded">
                                    <span>{b.label} ({b.icon})</span>
                                    <button onClick={()=>{api.deleteButton(b.id).then(refresh)}} className="text-red-500">Del</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'rep':
                return (
                    <div className="space-y-4">
                        {reports.map(r => (
                            <div key={r.id} className="bg-[#2c2c2e] p-4 rounded border border-white/5">
                                <div className="text-xs text-gray-500">{r.date}</div>
                                <p>{r.text}</p>
                                {r.image && <img src={r.image} className="max-h-40 mt-2"/>}
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full h-screen bg-gray-900 text-white font-sans flex text-sm">
            <div className="w-60 bg-[#252526] border-r border-white/5 flex flex-col p-4 gap-1 pt-10">
                <div className="text-xs text-gray-500 font-bold mb-2">ADMIN PANEL v6</div>
                <Btn label="Dashboard" active={tab==='dash'} onClick={()=>setTab('dash')}/>
                <Btn label="Editor: History" active={tab==='hist'} onClick={()=>setTab('hist')}/>
                <Btn label="Editor: News" active={tab==='news'} onClick={()=>setTab('news')}/>
                <Btn label="Editor: Buttons" active={tab==='btns'} onClick={()=>setTab('btns')}/>
                <Btn label="Map & Markers" active={tab==='map'} onClick={()=>setTab('map')}/>
                <Btn label="Reports" active={tab==='rep'} onClick={()=>setTab('rep')}/>
            </div>
            <div className="flex-1 bg-[#1e1e1e] p-8 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

const Btn = ({label, active, onClick}) => <button onClick={onClick} className={`w-full text-left px-3 py-2 rounded ${active?'bg-blue-600':'hover:bg-white/5 text-gray-400'}`}>{label}</button>;

export default Admin;
