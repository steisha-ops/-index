import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, CheckCircle, Tag } from 'lucide-react';

const NewsPage = () => {
    const [feed, setFeed] = useState([]);
    const [authors, setAuthors] = useState([]);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => { 
        api.getNews().then(setFeed);
        api.getAuthors().then(setAuthors);
    }, []);

    const filtered = useMemo(() => feed.filter(n => n.text.toLowerCase().includes(search.toLowerCase()) || (n.name && n.name.toLowerCase().includes(search.toLowerCase()))), [feed, search]);

    return (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="min-h-screen bg-[var(--bg-main)] pt-14 pb-28 px-4 font-sans text-[var(--text-primary)] transition-colors duration-500">
            
            <div className="flex justify-between items-end mb-6">
                <h1 className="text-3xl font-black tracking-tighter">ЛЕНТА</h1>
                <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-red-500/20">
                    <Flame size={12} className="fill-red-500 animate-pulse"/> LIVE
                </div>
            </div>

            {/* STORIES */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6 pb-2">
                {authors.map(a => (
                    <div key={a.id} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group" onClick={()=>navigate(`/author/${a.id}`)}>
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-purple-500 shadow-lg">
                            <div className="w-full h-full rounded-full bg-[var(--bg-card)] p-[3px] overflow-hidden">
                                <img src={a.avatar} className="w-full h-full rounded-full object-cover"/>
                            </div>
                        </div>
                        <span className="text-[10px] text-[var(--text-dim)] truncate w-16 text-center font-medium">{a.name}</span>
                    </div>
                ))}
            </div>

            {/* SEARCH */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18}/>
                <input 
                    value={search} 
                    onChange={e=>setSearch(e.target.value)} 
                    placeholder="Поиск..." 
                    className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-[20px] py-3 pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none focus:border-blue-500/50 transition shadow-sm"
                />
            </div>

            {/* FEED */}
            <div className="space-y-4">
                {filtered.map((post, i) => (
                    <motion.div 
                        initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: i*0.05}}
                        key={post.id} 
                        className={`p-5 rounded-[24px] shadow-lg relative overflow-hidden group border transition-all glass-card ${post.is_highlighted ? 'border-l-4 border-l-yellow-500' : ''}`}
                        onClick={()=>navigate(`/author/${post.author_id}`)}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <img src={post.avatar} className="w-10 h-10 rounded-full object-cover border border-[var(--border)]"/>
                            <div>
                                <div className="flex items-center gap-1">
                                    <span className={`font-bold text-sm ${post.is_highlighted ? 'text-yellow-500' : 'text-[var(--text-primary)]'}`}>{post.name}</span>
                                    {post.is_verified==1 && <CheckCircle size={12} className="text-blue-500 fill-blue-500/20"/>}
                                </div>
                                <div className="text-[10px] text-[var(--text-dim)] font-mono">@{post.handle}</div>
                            </div>
                            <div className="ml-auto text-[10px] text-[var(--text-dim)]">{new Date(post.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                        </div>
                        
                        <p className="text-sm leading-relaxed text-[var(--text-primary)] mb-3">{post.text}</p>
                        
                        {post.image && <img src={post.image} className="mt-3 rounded-xl w-full border border-[var(--border)] object-cover max-h-64"/>}
                        {post.btn_text && <button onClick={(e) => {e.stopPropagation(); if(post.btn_link) {if(post.btn_link.startsWith('/')) navigate(post.btn_link); else window.open(post.btn_link, '_blank');}}} className="mt-4 w-full bg-blue-500/10 text-blue-500 font-bold py-2 rounded-xl text-xs uppercase hover:bg-blue-500 hover:text-white transition">{post.btn_text}</button>}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};
export default NewsPage;
