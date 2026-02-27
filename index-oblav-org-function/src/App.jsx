import { useState, useEffect } from 'react';
import { Newspaper, Users, Trash2, Plus, RefreshCw, FileText, CheckCircle, Circle, Star, Flame } from 'lucide-react';

const API = "/api"; 
const req = async (u, m='GET', b) => {
    try {
        console.log(`📤 ${m} ${API}${u}`, b || '');
        const res = await fetch(API+u, {
            method: m, 
            headers: {'Content-Type':'application/json'},
            body: b ? JSON.stringify(b) : undefined
        });
        console.log(`📥 Response status:`, res.status);
        const data = await res.json();
        console.log(`📥 Response data:`, data);
        return data;
    } catch(e) { 
        console.error("❌ API Error:", e); 
        return {error: e.message}; 
    }
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${active ? 'bg-[#007AFF] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}>
        <Icon size={18} /> {label}
    </button>
);

export default function MacOSAdmin() {
    const [tab, setTab] = useState('news');
    const [authors, setAuthors] = useState([]);
    const [news, setNews] = useState([]);
    
    // FORMS
    const [newsForm, setNewsForm] = useState({author_id:'', text:'', image:'', btn_text:'', btn_link:'', tags:'', is_highlighted: false});
    const [authForm, setAuthForm] = useState({name:'', handle:'', avatar:'', bio:'', is_verified: false});

    useEffect(() => { refresh(); }, []);

    const refresh = async () => {
        const a = await req('/authors');
        console.log('Authors response:', a);
        setAuthors(Array.isArray(a) ? a : []);
        const n = await req('/news');
        console.log('News response:', n);
        setNews(Array.isArray(n) ? n : []);
    };

    // --- ACTIONS ---

    const handleCreateAuthor = async () => {
        if(!authForm.name) return alert("Введите имя!");
        // Принудительно приводим к Boolean для отправки, сервер сам разберется
        const payload = { ...authForm, is_verified: authForm.is_verified ? 1 : 0 };
        
        const res = await req('/authors', 'POST', payload);
        if(res.ok || res.id) {
            setAuthForm({name:'', handle:'', avatar:'', bio:'', is_verified: false});
            refresh();
            alert("✅ Автор создан!");
        } else {
            console.error("Author creation failed:", res);
            alert(`❌ Ошибка создания: ${res.error || 'Unknown error'}`);
        }
    };

    const handlePostNews = async () => {
        if(!newsForm.author_id) return alert("Выберите автора!");
        // Highlight тоже шлем как 1/0
        const payload = { ...newsForm, is_highlighted: newsForm.is_highlighted ? 1 : 0 };
        
        const res = await req('/news', 'POST', payload);
        if(res.ok || res.id) {
            setNewsForm({author_id:'', text:'', image:'', btn_text:'', btn_link:'', tags:'', is_highlighted: false});
            refresh();
            alert("✅ Опубликовано!");
        } else {
            console.error("News posting failed:", res);
            alert(`❌ Ошибка публикации: ${res.error || 'Unknown error'}`);
        }
    };

    const deleteItem = async (type, id) => {
        if(confirm("Удалить навсегда?")) {
            const res = await req(`/${type}/${id}`, 'DELETE');
            if(res.ok) {
                refresh();
                alert("✅ Удалено");
            } else {
                alert(`❌ Ошибка удаления: ${res.error || 'Unknown error'}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#000] flex items-center justify-center p-4 font-sans text-white bg-[url('https://4kwallpapers.com/images/wallpapers/macos-monterey-stock-black-dark-mode-layers-5k-4480x2520-5889.jpg')] bg-cover">
            <div className="w-full max-w-[1200px] h-[85vh] bg-[#1e1e1e]/90 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-12 bg-[#252526] border-b border-black/20 flex items-center px-4 gap-4 shrink-0">
                    <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-[#FF5F57]"/><div className="w-3 h-3 rounded-full bg-[#FEBC2E]"/><div className="w-3 h-3 rounded-full bg-[#28C840]"/></div>
                    <div className="text-gray-400 text-xs font-bold">Admin Center V15</div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-64 bg-[#252526]/50 backdrop-blur-md border-r border-white/5 flex flex-col p-4 gap-1">
                        <div className="text-[10px] text-gray-500 font-bold mb-2 px-3 uppercase tracking-widest">Content</div>
                        <SidebarItem icon={Newspaper} label="Новости (Лента)" active={tab==='news'} onClick={()=>setTab('news')} />
                        <SidebarItem icon={Users} label="Авторы (Профили)" active={tab==='authors'} onClick={()=>setTab('authors')} />
                        <button onClick={refresh} className="mt-auto flex items-center gap-2 text-xs text-gray-500 hover:text-white px-3"><RefreshCw size={12}/> Sync Data</button>
                    </div>

                    <div className="flex-1 bg-[#1e1e1e] flex overflow-hidden">
                        
                        {/* --- AUTHORS TAB --- */}
                        {tab === 'authors' && (
                            <div className="flex w-full h-full">
                                <div className="flex-1 p-8 overflow-y-auto border-r border-white/5">
                                    <h2 className="text-2xl font-bold mb-6 text-white flex gap-2"><Users className="text-green-500"/> Все Авторы</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {authors.map(a => (
                                            <div key={a.id} className="bg-[#2c2c2e] p-4 rounded-xl border border-white/5 flex items-center gap-4 relative group hover:border-white/20 transition">
                                                <img src={a.avatar || 'https://via.placeholder.com/50'} className="w-12 h-12 rounded-full bg-black/50 object-cover"/>
                                                <div className="overflow-hidden">
                                                    <div className="font-bold text-white flex items-center gap-1">
                                                        {a.name}
                                                        {a.is_verified==1 && <CheckCircle size={14} className="text-blue-500 fill-blue-500/20"/>}
                                                    </div>
                                                    <div className="text-xs text-gray-500">@{a.handle}</div>
                                                </div>
                                                <button onClick={()=>deleteItem('authors', a.id)} className="absolute top-3 right-3 text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="w-[350px] bg-[#202020] p-6 border-l border-white/5 overflow-y-auto">
                                    <h3 className="font-bold text-white mb-6 flex items-center gap-2"><Plus size={18} className="text-green-500"/> Новый Автор</h3>
                                    <div className="space-y-4">
                                        <input value={authForm.name} onChange={e=>setAuthForm({...authForm, name:e.target.value})} className="mac-input" placeholder="Имя (Display Name)"/>
                                        <input value={authForm.handle} onChange={e=>setAuthForm({...authForm, handle:e.target.value})} className="mac-input" placeholder="@username"/>
                                        <input value={authForm.avatar} onChange={e=>setAuthForm({...authForm, avatar:e.target.value})} className="mac-input" placeholder="https://image.url..."/>
                                        
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Биография</label>
                                            <textarea value={authForm.bio} onChange={e=>setAuthForm({...authForm, bio:e.target.value})} className="mac-input h-32 resize-none" placeholder="Описание профиля..."/>
                                        </div>

                                        {/* SAFE CHECKBOX */}
                                        <div 
                                            className="flex items-center gap-3 p-3 bg-[#252526] rounded-lg cursor-pointer border border-transparent hover:border-blue-500/50 transition"
                                            onClick={() => setAuthForm(prev => ({...prev, is_verified: !prev.is_verified}))}
                                        >
                                            {authForm.is_verified ? <CheckCircle className="text-blue-500"/> : <Circle className="text-gray-600"/>}
                                            <span className={authForm.is_verified ? "text-white" : "text-gray-500"}>Галочка (Verified)</span>
                                        </div>

                                        <button onClick={handleCreateAuthor} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-lg font-bold text-sm shadow-lg mt-2">Создать Профиль</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- NEWS TAB --- */}
                        {tab === 'news' && (
                            <div className="flex w-full h-full">
                                <div className="flex-1 p-8 overflow-y-auto border-r border-white/5">
                                    <h2 className="text-2xl font-bold mb-6 text-white flex gap-2"><Newspaper className="text-blue-500"/> Лента</h2>
                                    <div className="space-y-3">
                                        {news.map(n => (
                                            <div key={n.id} className={`bg-[#2c2c2e] p-4 rounded-xl border flex justify-between items-start ${n.is_highlighted ? 'border-yellow-500/50 shadow-lg shadow-yellow-900/20' : 'border-white/5'}`}>
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0"><img src={n.avatar} className="w-full h-full object-cover"/></div>
                                                    <div>
                                                        <div className="font-bold text-sm flex items-center gap-2">
                                                            {n.name}
                                                            {n.is_highlighted==1 && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 rounded-full border border-yellow-500/30">HOT</span>}
                                                        </div>
                                                        <div className="text-xs text-gray-400 line-clamp-2 mt-1">{n.text}</div>
                                                    </div>
                                                </div>
                                                <button onClick={()=>deleteItem('news', n.id)} className="text-red-500 hover:bg-white/10 p-2 rounded"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-[350px] bg-[#202020] p-6 border-l border-white/5 overflow-y-auto">
                                    <h3 className="font-bold text-white mb-6">Создать Новость</h3>
                                    <div className="space-y-4">
                                        <select value={newsForm.author_id} onChange={e=>setNewsForm({...newsForm, author_id:e.target.value})} className="mac-input">
                                            <option value="">Выберите автора...</option>
                                            {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                        </select>
                                        <textarea value={newsForm.text} onChange={e=>setNewsForm({...newsForm, text:e.target.value})} className="mac-input h-24 resize-none" placeholder="Текст новости..."/>
                                        <input value={newsForm.image} onChange={e=>setNewsForm({...newsForm, image:e.target.value})} className="mac-input" placeholder="Фото URL"/>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <input value={newsForm.btn_text} onChange={e=>setNewsForm({...newsForm, btn_text:e.target.value})} className="mac-input" placeholder="Текст кнопки"/>
                                            <input value={newsForm.btn_link} onChange={e=>setNewsForm({...newsForm, btn_link:e.target.value})} className="mac-input" placeholder="Ссылка кнопки"/>
                                        </div>

                                        <input value={newsForm.tags} onChange={e=>setNewsForm({...newsForm, tags:e.target.value})} className="mac-input" placeholder="Теги (через запятую)"/>

                                        {/* HOT CHECKBOX */}
                                        <div 
                                            className="flex items-center gap-3 p-3 bg-[#252526] rounded-lg cursor-pointer border border-transparent hover:border-yellow-500/50 transition"
                                            onClick={() => setNewsForm(prev => ({...prev, is_highlighted: !prev.is_highlighted}))}
                                        >
                                            {newsForm.is_highlighted ? <Flame className="text-yellow-500 fill-yellow-500/20"/> : <Circle className="text-gray-600"/>}
                                            <span className={newsForm.is_highlighted ? "text-yellow-500 font-bold" : "text-gray-500"}>Важная новость (HOT)</span>
                                        </div>

                                        <button onClick={handlePostNews} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-sm shadow-lg">Опубликовать</button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
