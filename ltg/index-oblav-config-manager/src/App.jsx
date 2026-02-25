
import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { Globe, BarChart3, Layout, MessageSquare, Trash2, Plus, Monitor, FileCode, Bell, Map as MapIcon, Send, Calendar, X, RefreshCw, Sun, Moon } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25,41], iconAnchor: [12,41] });
L.Marker.prototype.options.icon = DefaultIcon;

const AddMarkerClick = ({ onAdd }) => { useMapEvents({ click: (e) => { const desc = prompt("Метка:"); if(desc) onAdd({ lat: e.latlng.lat, lng: e.latlng.lng, desc }); } }); return null; };

// LOGIN
const Login = ({ onSuccess }) => {
    const [pass, setPass] = useState('');
    const [status, setStatus] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        const res = await api.login(pass);
        if(res.ok) onSuccess();
        else setStatus('Неверный пароль (попробуй admin)');
    };
    return (
        <div className="h-screen bg-black flex items-center justify-center font-sans text-white">
            <div className="w-80 bg-[#111] p-8 rounded-2xl border border-[#333] text-center">
                <h2 className="text-xl font-bold mb-4">Secure Access</h2>
                <form onSubmit={submit}>
                    <input type="password" value={pass} onChange={e=>setPass(e.target.value)} className="w-full bg-[#222] border border-[#444] p-2 rounded text-white mb-4 text-center" placeholder="Password"/>
                    <button className="w-full bg-red-600 font-bold py-2 rounded">LOGIN</button>
                </form>
                {status && <div className="text-red-500 text-xs mt-2">{status}</div>}
            </div>
        </div>
    );
};

export default function ConfigManager() {
    const [auth, setAuth] = useState(true);
    if(!auth) return <Login onSuccess={()=>setAuth(true)}/>;
    return (<div className="h-screen w-full bg-black flex items-center justify-center p-4 text-white font-sans"><ConfigWindow /></div>);
}

const ConfigWindow = () => {
    const [tab, setTab] = useState('content'); // Start here
    
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

    useEffect(() => { refresh(); }, []);

    const refresh = async () => {
        try {
            const rList = await api.getRegions() || [];
            setRegions(rList);
            if (rList.length > 0) {
                const target = selectedRegionId || rList[0].id;
                loadRegionData(target);
            }
            setButtons(await api.getButtons() || []);
            setPopups(await api.getPopups() || []);
            setPages(await api.getPages() || []);
            setMarkers(await api.getMarkers() || []);
        } catch(e){}
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
    const handleSaveIndex = async () => { await api.updateRegionIndex(selectedRegionId, selectedIndex); alert('Saved'); };
    const handleHistoryEdit = async (d, v) => { const n = prompt('', v); if(n) { await api.updateRegionHistory(selectedRegionId, d, n); loadRegionData(selectedRegionId); } };
    const handleDeleteDay = async (e, date) => { e.stopPropagation(); if(confirm(`Del ${date}?`)) { await api.deleteHistoryDay(selectedRegionId, date); loadRegionData(selectedRegionId); } };
    const handleAddDay = async () => { if(!newDate.date) return; await api.updateRegionHistory(selectedRegionId, newDate.date, newDate.value); loadRegionData(selectedRegionId); };
    const handleShiftDay = async () => { if(confirm("Shift?")) { await api.shiftDay(selectedRegionId); loadRegionData(selectedRegionId); } };
    const handleCreateRegion = async () => { if(!newReg.name)return; await api.addRegion(newReg); refresh(); };
    const createPopup = async () => { await api.addPopup(newPopup); refresh(); };
    const createPage = async () => { await api.addPage(newPage); refresh(); };
    const handleAddMarker = async (d) => { await api.addMarker(d); refresh(); };
    const handleSendNotif = async () => { if(!notif.title) return; await api.sendNotification(notif); alert("Sent"); };
    
    // --- CREATE BUTTON (С типом THEME) ---
    const createButton = async () => { 
        let l=newBtn.value; 
        if(newBtn.type==='popup') l=`popup:${l}`; 
        if(newBtn.type==='page') l=`/${l}`;
        
        // Магия для смены темы
        if(newBtn.type==='theme') {
            l='action:theme_toggle';
            // Если иконка не задана, ставим Солнце/Луну
            if(!newBtn.icon) newBtn.icon = 'Sun'; 
            if(!newBtn.label) newBtn.label = 'Тема';
        }

        await api.addButton({label:newBtn.label,icon:newBtn.icon||'Info',link:l||'#'}); 
        refresh(); 
    };

    const delBtn = (id) => { if(confirm("Del?")) api.deleteButton(id).then(refresh); };
    const delPop = (id) => { if(confirm("Del?")) api.deletePopup(id).then(refresh); };
    const delPage = (id) => { if(confirm("Del?")) api.deletePage(id).then(refresh); };
    const delReg = (id) => { if(confirm("Del?")) api.deleteRegion(id).then(refresh); };
    const delMark = (id) => { if(confirm("Del?")) api.deleteMarker(id).then(refresh); };

    const currentRegionName = regions.find(r => r.id == selectedRegionId)?.name || '...';

    return (
        <div className="w-full max-w-7xl h-[90vh] bg-[#111] border border-[#333] rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <div className="h-16 bg-[#1a1a1a] border-b border-[#333] flex items-center px-6 shrink-0 justify-between">
                <div className="font-bold text-gray-200 text-lg flex items-center gap-2"><Monitor className="text-blue-500"/> Config Manager V29</div>
                <div className="flex gap-2">
                    <select value={selectedRegionId||''} onChange={(e)=>loadRegionData(e.target.value)} className="bg-[#333] text-white rounded px-2 py-1 outline-none text-sm border border-[#444]">
                        {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <button onClick={refresh} className="text-blue-400 text-xs">Sync</button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 bg-[#161616] border-r border-[#333] p-4 flex flex-col gap-2 overflow-y-auto">
                    <TabBtn icon={Layout} label="Контент" active={tab==='content'} onClick={()=>setTab('content')} />
                    <TabBtn icon={Globe} label="Регионы" active={tab==='regions'} onClick={()=>setTab('regions')} />
                    <TabBtn icon={BarChart3} label="График" active={tab==='graph'} onClick={()=>setTab('graph')} />
                    <TabBtn icon={MapIcon} label="Карта" active={tab==='map'} onClick={()=>setTab('map')} />
                    <TabBtn icon={Bell} label="Push" active={tab==='notify'} onClick={()=>setTab('notify')} />
                    <TabBtn icon={FileCode} label="Страницы" active={tab==='pages'} onClick={()=>setTab('pages')} />
                </div>

                <div className="flex-1 bg-[#000] p-8 overflow-y-auto relative">
                    
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
                    {tab === 'regions' && <div className="flex gap-8 items-start"><div className="flex-1 space-y-6"><div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#333]"><h2 className="text-xl font-bold mb-4">Индекс: {currentRegionName}</h2><div className="flex items-center gap-4"><input type="range" min="1" max="11" step="0.1" value={selectedIndex} onChange={e=>setSelectedIndex(e.target.value)} className="w-full accent-blue-500"/><span className="text-4xl font-mono text-blue-500 font-bold w-24 text-right">{Number(selectedIndex).toFixed(1)}</span><button onClick={handleSaveIndex} className="bg-blue-600 px-4 py-2 rounded font-bold">Save</button></div></div><div className="grid grid-cols-2 gap-3">{regions.map(r => (<div key={r.id} className={`bg-[#111] border border-[#333] p-3 rounded flex justify-between items-center ${r.id==selectedRegionId?'border-blue-500/50':''}`}><div><div className="font-bold">{r.name}</div><div className="text-xs text-gray-500">Idx: {r.current_index}</div></div><button onClick={()=>delReg(r.id)} className="text-red-500 p-2"><Trash2 size={16}/></button></div>))}</div></div><div className="w-80 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]"><h3 className="font-bold mb-4 text-green-400">Новый Город</h3><input value={newReg.name} onChange={e=>setNewReg({...newReg, name:e.target.value})} placeholder="Название" className="input-field mb-2"/><div className="grid grid-cols-2 gap-2 mb-2"><input value={newReg.lat} onChange={e=>setNewReg({...newReg, lat:e.target.value})} placeholder="Lat" className="input-field"/><input value={newReg.lng} onChange={e=>setNewReg({...newReg, lng:e.target.value})} placeholder="Lng" className="input-field"/></div><input value={newReg.zoom} onChange={e=>setNewReg({...newReg, zoom:e.target.value})} placeholder="Zoom" className="input-field mb-2"/><button onClick={handleCreateRegion} className="btn-primary w-full bg-green-600">Создать</button></div></div>}
                    {tab === 'graph' && <div><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">График: {currentRegionName}</h2><button onClick={handleShiftDay} className="bg-yellow-600/20 text-yellow-500 px-4 py-2 rounded border border-yellow-600/30">Сдвинуть День (+1)</button></div><div className="grid grid-cols-8 gap-2">{selectedHistory.map(h => (<div key={h.date} onClick={()=>handleHistoryEdit(h.date, h.value)} className="bg-[#111] border border-[#333] p-2 rounded text-center cursor-pointer hover:bg-[#222] relative group"><div className="text-[10px] text-gray-500">{h.date}</div><div className="font-bold text-green-400">{Number(h.value).toFixed(1)}</div><button onClick={(e)=>handleDeleteDay(e, h.date)} className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"><X size={10}/></button></div>))}</div><div className="w-64 bg-[#1a1a1a] p-5 rounded-xl border border-[#333] mt-4"><h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={16} className="text-blue-400"/> Добавить День</h3><input type="date" value={newDate.date} onChange={e=>setNewDate({...newDate, date:e.target.value})} className="input-field mb-2"/><input type="number" step="0.1" value={newDate.value} onChange={e=>setNewDate({...newDate, value:e.target.value})} className="input-field mb-2"/><button onClick={handleAddDay} className="btn-primary w-full text-xs">Добавить</button></div></div>}
                    {tab === 'map' && <div className="h-full relative rounded-xl overflow-hidden border border-[#333]"><MapContainer center={[55.75, 37.61]} zoom={10} style={{height:'100%', width:'100%', filter:'invert(1)'}}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><AddMarkerClick onAdd={handleAddMarker}/>{markers.map(m=><Marker key={m.id} position={[m.lat,m.lng]}><Popup>{m.desc}</Popup></Marker>)}</MapContainer><div className="absolute top-4 right-4 bg-black/80 p-4 rounded-xl border border-white/20 backdrop-blur max-w-xs z-[1000]"><h3 className="font-bold mb-2">Метки</h3><div className="space-y-2 max-h-60 overflow-y-auto">{markers.map(m=><div key={m.id} className="flex justify-between items-center bg-white/10 p-2 rounded text-xs"><span>{m.desc}</span><button onClick={()=>delMark(m.id)} className="text-red-500 ml-2"><Trash2 size={14}/></button></div>)}</div></div></div>}
                    {tab === 'notify' && <div className="p-10 max-w-lg mx-auto"><div className="bg-[#1a1a1a] p-6 rounded-2xl border border-[#333] space-y-4"><h2 className="text-xl font-bold flex gap-2"><Bell/> Push</h2><input value={notif.title} onChange={e=>setNotif({...notif, title:e.target.value})} className="input-field" placeholder="Title"/><textarea value={notif.body} onChange={e=>setNotif({...notif, body:e.target.value})} className="input-field h-24" placeholder="Body"/><button onClick={handleSendNotif} className="btn-primary w-full">Send</button></div></div>}
                    {tab === 'pages' && <div className="flex gap-8 items-start"><div className="flex-1 space-y-2">{pages.map(p => (<div key={p.id} className="bg-[#111] p-3 rounded border border-[#333] flex justify-between"><span>{p.title} <span className="text-blue-400 text-xs">/{p.slug}</span></span><button onClick={()=>delPage(p.id)} className="text-red-500"><Trash2 size={16}/></button></div>))}</div><div className="w-96 bg-[#1a1a1a] p-6 rounded-xl border border-[#333]"><h3 className="font-bold mb-4">HTML Page</h3><input value={newPage.slug} onChange={e=>setNewPage({...newPage, slug:e.target.value})} placeholder="Slug" className="input-field mb-2"/><input value={newPage.title} onChange={e=>setNewPage({...newPage, title:e.target.value})} placeholder="Title" className="input-field mb-2"/><textarea value={newPage.content} onChange={e=>setNewPage({...newPage, content:e.target.value})} placeholder="HTML..." className="input-field h-40 mb-2 font-mono text-xs text-green-400 resize-none bg-[#0a0a0a]"/><div className="flex items-center gap-2 mb-4"><input type="checkbox" checked={newPage.is_hidden} onChange={e=>setNewPage({...newPage, is_hidden:e.target.checked})}/><span className="text-sm text-gray-400">Скрытая</span></div><button onClick={createPage} className="btn-primary w-full">Save</button></div></div>}

                </div>
            </div>
        </div>
    );
};

const TabBtn = ({icon: Icon, label, active, onClick}) => (<button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-[#222] hover:text-white'}`}><Icon size={20}/> {label}</button>);
