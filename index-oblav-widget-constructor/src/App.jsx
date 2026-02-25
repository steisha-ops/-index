import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { LayoutTemplate, Trash2, Plus, Zap, Info, ShieldAlert, Link, Star, AlertTriangle, ArrowRight, Clock, Image as ImgIcon, Moon, Sun, Combine, Palette, SlidersHorizontal } from 'lucide-react';

const Icons = { Zap, Info, Shield: ShieldAlert, Link, Star, AlertTriangle, Clock, Moon, Sun };

// --- PREVIEW COMPONENT (To match Main App) ---
const WidgetPreview = ({ w, subW }) => {
    const Ico = Icons[w.icon] || Info;
    
    const getGlow = (c) => {
        if(c==='red') return 'border-red-500/30 text-red-400 shadow-[0_0_30px_-5px_rgba(239,68,68,0.4)] bg-red-900/10';
        if(c==='green') return 'border-green-500/30 text-green-400 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)] bg-green-900/10';
        if(c==='yellow') return 'border-yellow-500/30 text-yellow-400 shadow-[0_0_30px_-5px_rgba(234,179,8,0.4)] bg-yellow-900/10';
        return 'border-blue-500/30 text-blue-400 shadow-[0_0_30px_-5px_rgba(59,130,246,0.4)] bg-blue-900/10';
    };

    const shadowClass = {
        'none': 'shadow-none',
        'sm': 'shadow-sm',
        'md': 'shadow-md',
        'lg': 'shadow-lg',
        'xl': 'shadow-xl',
        '2xl': 'shadow-2xl',
    }[w.shadow] || 'shadow-lg';


    if (w.type === 'clock') {
        return (
            <div className={`w-full bg-[#0a0a0a] border border-blue-500/30 p-6 flex flex-col justify-center items-center h-40 rounded-[32px] ${shadowClass}`}>
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Clock size={12}/> MSK</span>
                <div className="text-4xl font-mono font-black text-white tracking-widest">12:00</div>
            </div>
        );
    }

    if (w.type === 'image') {
        return (
            <div className={`w-full relative overflow-hidden rounded-[32px] h-40 border border-white/10 ${shadowClass}`}>
                {w.image ? <img src={w.image} className="absolute inset-0 w-full h-full object-cover opacity-80"/> : <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-xs text-gray-500">No Image</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"/>
                <div className="absolute bottom-5 left-5 right-5"><h3 className="font-bold text-white text-xl shadow-black drop-shadow-md">{w.title}</h3></div>
                 {w.indicator && <div className="absolute top-3 right-3 bg-black/50 text-white text-[9px] font-bold uppercase px-2 py-1 rounded-full backdrop-blur-sm border border-white/10">{w.indicator}</div>}
            </div>
        );
    }

    if (w.type === 'group') {
        return (
            <div className="w-full grid grid-cols-2 gap-3">
                {[0, 1].map(i => {
                    const s = subW[i];
                    const SIco = Icons[s.icon] || Info;
                    return (
                        <div key={i} className={`p-4 rounded-[24px] border flex flex-col justify-between h-40 ${getGlow(s.color)}`}>
                            <div className="flex justify-between"><SIco size={24}/></div>
                            <div><div className="font-bold text-sm">{s.title}</div><div className="text-[10px] opacity-70">{s.text}</div></div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`p-6 rounded-[32px] border flex flex-col justify-between h-40 relative overflow-hidden ${getGlow(w.color)} ${shadowClass} ${w.is_wide?'w-full':'w-[150px]'}`}>
            <div className="flex justify-between items-start z-10">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5"><Ico size={28}/></div>
                <div className="flex items-center gap-2">
                    {w.indicator && <div className="bg-white/10 text-white text-[9px] font-bold uppercase px-2 py-1 rounded-full">{w.indicator}</div>}
                    {w.link && <ArrowRight size={16} className="opacity-40"/>}
                </div>
            </div>
            <div className="z-10 mt-auto"><h3 className="font-bold text-lg leading-tight mb-1">{w.title}</h3><p className="text-[11px] opacity-70 font-medium uppercase tracking-wide">{w.text}</p></div>
        </div>
    );
};

export default function WidgetBuilder() {
    const [widgets, setWidgets] = useState([]);
    const [pages, setPages] = useState([]);
    const [popups, setPopups] = useState([]);
    
    // STATE
    const [editorTab, setEditorTab] = useState('visual');
    const [type, setType] = useState('standard');
    const [w, setW] = useState({ title: 'Заголовок', text: 'Текст', color: 'blue', icon: 'Zap', link: '', image: '', is_wide: false, indicator: '', shadow: 'lg', vibration: 'none' });
    const [subW, setSubW] = useState([
        {title:'Left', text:'Desc', color:'blue', icon:'Info', link:''},
        {title:'Right', text:'Desc', color:'red', icon:'Zap', link:''}
    ]);

    useEffect(() => { refresh(); }, []);

    const refresh = async () => {
        setWidgets(await api.getWidgets());
        setPages(await api.getPages());
        setPopups(await api.getPopups());
    };

    const create = async () => {
        const payload = { ...w, type };
        if(type === 'group') payload.sub_widgets = subW;
        if(type === 'clock') payload.is_wide = false;
        await api.addWidget(payload);
        refresh();
    };

    // Helper
    const LinkSelector = ({ value, onChange }) => (
        <select value={value} onChange={onChange} className="input-field py-2 text-xs">
            <option value="">Нет действия</option>
            <optgroup label="Страницы">{pages.map(p=><option key={p.id} value={`/${p.slug}`}>Page: {p.title}</option>)}</optgroup>
            <optgroup label="Popups">{popups.map(p=><option key={p.id} value={`popup:${p.id}`}>Popup: {p.title}</option>)}</optgroup>
        </select>
    );

    const renderWidgetIcon = (widget) => {
        if (widget.type === 'clock') return '⏰';
        if (widget.type === 'image') return '🖼️';
        if (widget.type === 'group') return '🔲';
        const Icon = Icons[widget.icon];
        return Icon ? <Icon size={24} /> : '⚡';
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans flex gap-10">
            
            {/* LEFT: EDITOR */}
            <div className="w-[400px] bg-[#111] border border-[#333] rounded-3xl p-8 h-fit max-h-[90vh] overflow-y-auto shadow-2xl">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-blue-400"><Combine size={28}/> TapEngine (тест)</h2>
                <div className="text-sm text-gray-500 mb-6">Визуальный конструктор виджетов</div>

                <div className="flex gap-2 mb-4 bg-[#222] p-1.5 rounded-xl">
                    <button onClick={()=>setEditorTab('visual')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition ${editorTab==='visual'?'bg-blue-600 text-white shadow-lg':'text-gray-500 hover:text-white'}`}><Palette size={14}/>Визуал</button>
                    <button onClick={()=>setEditorTab('logic')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-2 transition ${editorTab==='logic'?'bg-purple-600 text-white shadow-lg':'text-gray-500 hover:text-white'}`}><SlidersHorizontal size={14}/>Логика</button>
                </div>
                
                {editorTab === 'visual' && (
                <>
                    <div className="flex gap-2 mb-8 bg-[#1a1a1a] p-1.5 rounded-xl border border-[#333]">
                        {['standard', 'image', 'clock', 'group'].map(t => (
                            <button key={t} onClick={()=>setType(t)} className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase transition ${type===t?'bg-[#333] text-white shadow-md':'text-gray-500 hover:text-white'}`}>{t}</button>
                        ))}
                    </div>
                    
                    <div className="space-y-5">
                        {type !== 'group' && type !== 'clock' && (
                            <>
                                <div><label className="label">Заголовок</label><input value={w.title} onChange={e=>setW({...w, title:e.target.value})} className="input-field" placeholder="Title"/></div>
                                {type === 'standard' && <div><label className="label">Текст</label><textarea value={w.text} onChange={e=>setW({...w, text:e.target.value})} className="input-field h-24 resize-none" placeholder="Description"/></div>}
                                {type === 'image' && <div><label className="label">Фото</label><input value={w.image} onChange={e=>setW({...w, image:e.target.value})} className="input-field" placeholder="https://..."/></div>}
                            </>
                        )}

                        {type === 'standard' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label">Цвет (Neon)</label><select value={w.color} onChange={e=>setW({...w, color:e.target.value})} className="input-field"><option value="blue">Blue</option><option value="red">Red</option><option value="green">Green</option><option value="yellow">Yellow</option></select></div>
                                <div><label className="label">Иконка</label><select value={w.icon} onChange={e=>setW({...w, icon:e.target.value})} className="input-field">{Object.keys(Icons).map(i=><option key={i} value={i}>{i}</option>)}</select></div>
                            </div>
                        )}
                        
                        <div className="border-t border-dashed border-gray-700 my-4"></div>

                        <div><label className="label">Индикатор</label><input value={w.indicator} onChange={e=>setW({...w, indicator:e.target.value})} className="input-field" placeholder="PRO, NEW, ..."/></div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="label">Тень</label><select value={w.shadow} onChange={e=>setW({...w, shadow:e.target.value})} className="input-field"><option value="none">None</option><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option><option value="xl">X-Large</option><option value="2xl">2X-Large</option></select></div>
                            <div><label className="label">Вибрация</label><select value={w.vibration} onChange={e=>setW({...w, vibration:e.target.value})} className="input-field"><option value="none">None</option><option value="light">Light</option><option value="medium">Medium</option><option value="heavy">Heavy</option></select></div>
                        </div>


                        {(type === 'standard' || type === 'image') && (
                            <div><label className="label">Действие</label><LinkSelector value={w.link} onChange={e=>setW({...w, link:e.target.value})} /></div>
                        )}

                        {type === 'group' && (
                            <div className="space-y-6 border-t border-[#333] pt-6">
                                {[0, 1].map(i => (
                                    <div key={i} className="bg-[#1a1a1a] p-4 rounded-xl border border-[#333] space-y-3">
                                        <div className="label text-blue-400">Виджет #{i+1}</div>
                                        <input value={subW[i].title} onChange={e=>{const n=[...subW];n[i].title=e.target.value;setSubW(n)}} className="input-field" placeholder="Title"/>
                                        <input value={subW[i].text} onChange={e=>{const n=[...subW];n[i].text=e.target.value;setSubW(n)}} className="input-field" placeholder="Text"/>
                                        <div className="flex gap-2">
                                            <select value={subW[i].color} onChange={e=>{const n=[...subW];n[i].color=e.target.value;setSubW(n)}} className="input-field"><option value="blue">Blue</option><option value="red">Red</option><option value="green">Green</option></select>
                                            <select value={subW[i].icon} onChange={e=>{const n=[...subW];n[i].icon=e.target.value;setSubW(n)}} className="input-field">{Object.keys(Icons).map(k=><option key={k} value={k}>{k}</option>)}</select>
                                        </div>
                                        <LinkSelector value={subW[i].link} onChange={e=>{const n=[...subW];n[i].link=e.target.value;setSubW(n)}} />
                                    </div>
                                ))}
                            </div>
                        )}

                        {type !== 'group' && (
                            <label className="flex items-center gap-3 p-3 bg-[#222] rounded-xl cursor-pointer hover:bg-[#2a2a2a] transition">
                                <input type="checkbox" checked={w.is_wide} onChange={e=>setW({...w, is_wide:e.target.checked})} className="w-5 h-5 rounded bg-[#333] border-none accent-blue-600"/>
                                <span className="text-sm font-bold text-gray-300">На всю ширину (Wide Mode)</span>
                            </label>
                        )}

                        <button onClick={create} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-sm shadow-lg shadow-blue-900/30 mt-4 active:scale-95 transition">СОЗДАТЬ ВИДЖЕТ</button>
                    </div>
                </>
                )}

                {editorTab === 'logic' && (
                    <div className="text-center py-20 px-4 border border-dashed border-gray-700 rounded-2xl">
                        <SlidersHorizontal className="mx-auto text-gray-600 mb-4" size={40}/>
                        <h3 className="font-bold text-lg text-gray-400">Блочный редактор</h3>
                        <p className="text-sm text-gray-600 mt-1">Скоро здесь можно будет создавать сложную логику для виджетов.</p>
                    </div>
                )}
            </div>

            {/* MIDDLE: LIVE PREVIEW */}
            <div className="w-[360px] flex justify-center pt-10">
                <div className="bg-[#050505] border-[12px] border-[#222] rounded-[50px] w-full h-[700px] relative shadow-2xl overflow-hidden flex flex-col">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-[#222] rounded-b-2xl z-20"></div>
                    <div className="flex-1 bg-[#000] pt-16 px-5 overflow-y-auto no-scrollbar">
                        <div className="text-[10px] font-bold text-gray-600 text-center uppercase tracking-[0.2em] mb-6">iPhone 15 Pro • TapEngine</div>
                        <WidgetPreview w={{...w, type}} subW={subW} />
                        
                        {/* Fake Content Background */}
                        <div className="mt-6 opacity-20 space-y-4 pointer-events-none grayscale">
                            <div className="h-24 bg-white/10 rounded-[24px]"></div>
                            <div className="h-40 bg-white/10 rounded-[24px]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: LIST */}
            <div className="flex-1 pl-10">
                <h3 className="text-gray-500 font-bold mb-6 uppercase text-xs tracking-widest">Активные Виджеты</h3>
                <div className="grid grid-cols-1 gap-4 max-h-[85vh] overflow-y-auto pr-2">
                    {widgets.map(wd => (
                        <div key={wd.id} className="bg-[#111] p-5 rounded-2xl border border-[#333] flex justify-between items-center group hover:border-[#555] transition">
                            <div className="flex items-center gap-4">
                                <div className="text-2xl bg-[#222] w-12 h-12 flex items-center justify-center rounded-xl">
                                   {renderWidgetIcon(wd)}
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm">{wd.title || wd.type.toUpperCase()}</div>
                                    <div className="text-xs text-gray-500 mt-1 font-mono uppercase">{wd.type} • {wd.is_wide ? 'WIDE' : 'SMALL'}</div>
                                </div>
                            </div>
                            <button onClick={()=>api.delWidget(wd.id).then(refresh)} className="text-gray-600 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition"><Trash2 size={18}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
