import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, CheckCircle, Share2, Bookmark, Copy, Flag, ExternalLink } from 'lucide-react';
import TutorialOverlay from '../components/TutorialOverlay';
import { tutorialData } from '../lib/tutorialData';

const FeedCard = memo(({ post, i, navigate }) => {
    const [bookmarked, setBookmarked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const timeStr = new Date(post.date).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
    const dateStr = new Date(post.date).toLocaleDateString('ru-RU', {month: 'short', day: 'numeric'});
    const postLink = `${window.location.origin}${window.location.pathname}#post-${post.id}`;

    const handleBookmark = (e) => {
        e.stopPropagation();
        setBookmarked(!bookmarked);
    };

    const handleShare = (e) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: post.name,
                text: post.text,
                url: postLink
            }).catch(err => console.log('Share failed:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(postLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyLink = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(postLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleReport = (e) => {
        e.stopPropagation();
        alert(`Жалоба на пост от ${post.name} успешно отправлена`);
        setShowMenu(false);
    };

    return (
        <motion.div 
            initial={{opacity:0, y:20}} 
            animate={{opacity:1, y:0}} 
            transition={{delay: i*0.05}}
            whileHover={{y: -2}}
            key={post.id} 
            className={`overflow-hidden border border-[var(--border)] rounded-[28px] backdrop-blur-xl transition-all group ${post.is_highlighted ? 'bg-gradient-to-br from-yellow-500/15 to-orange-500/5 border-yellow-500/30 shadow-lg shadow-yellow-500/20' : 'bg-gradient-to-br from-white/8 to-white/3 hover:from-white/12 hover:to-white/5 shadow-lg shadow-black/20'}`}
        >
            {/* Header with author info */}
            <div className="px-5 pt-4 pb-3 border-b border-[var(--border)]">
                <div className="flex items-start justify-between gap-3">
                    <div onClick={()=>navigate(`/author/${post.author_id}`)} className="flex items-center gap-3 flex-1 cursor-pointer group/header">
                        <div className={`w-12 h-12 rounded-full p-[2px] bg-gradient-to-br flex-shrink-0 transition-transform ${post.is_highlighted ? 'from-yellow-500 to-orange-500' : 'from-blue-500 to-cyan-500'} shadow-lg group-hover/header:scale-110`}>
                            <img src={post.avatar} className="w-full h-full rounded-full object-cover bg-[var(--bg-card)]"/>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className={`font-bold text-sm truncate ${post.is_highlighted ? 'text-yellow-400' : 'text-[var(--text-primary)]'}`}>{post.name}</h3>
                                {post.is_verified==1 && <CheckCircle size={14} className="text-blue-500 fill-blue-500/30 flex-shrink-0"/>}
                            </div>
                            <p className="text-xs text-[var(--text-dim)] font-mono truncate">@{post.handle}</p>
                        </div>
                    </div>
                    <div className="relative">
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 rounded-full hover:bg-white/10 transition active:scale-95 text-[var(--text-dim)]"
                        >
                            <span className="text-2xl">•••</span>
                        </button>
                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 mt-2 w-48 rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                                >
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-sm hover:bg-white/10 transition text-[var(--text-primary)]"
                                    >
                                        <Copy size={16}/> Скопировать ссылку
                                    </button>
                                    <button
                                        onClick={handleReport}
                                        className="w-full px-4 py-3 flex items-center gap-3 text-sm hover:bg-red-500/10 transition text-red-400"
                                    >
                                        <Flag size={16}/> Пожаловаться
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <p className="text-xs text-[var(--text-dim)] mt-2 font-medium">{timeStr} · {dateStr}</p>
            </div>

            {/* Content */}
            <div className="px-5 pt-4 pb-3">
                <p className="text-sm sm:text-base leading-relaxed text-[var(--text-primary)] mb-3 break-words">{post.text}</p>
                
                {/* Image */}
                {post.image && (
                    <motion.img 
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        src={post.image} 
                        className="mt-3 rounded-[20px] w-full border border-[var(--border)] object-cover max-h-72 cursor-pointer hover:opacity-90 transition"
                        onClick={(e) => {e.stopPropagation();}}
                    />
                )}

                {/* Action Button */}
                {post.btn_text && (
                    <motion.button 
                        whileTap={{scale: 0.95}}
                        onClick={(e) => {e.stopPropagation(); if(post.btn_link) {if(post.btn_link.startsWith('/')) navigate(post.btn_link); else window.open(post.btn_link, '_blank');}}} 
                        className="mt-4 w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-[16px] text-xs uppercase hover:shadow-lg hover:shadow-blue-500/50 transition active:scale-95"
                    >
                        {post.btn_text}
                    </motion.button>
                )}
            </div>

            {/* Actions Footer - Clean and Simple */}
            <div className="px-5 py-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                <div className="flex gap-2">
                    <motion.button 
                        whileTap={{scale: 0.9}}
                        onClick={handleBookmark}
                        className={`p-2.5 rounded-xl transition ${bookmarked ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-white/10 text-[var(--text-dim)]'}`}
                        title="Добавить в закладки"
                    >
                        <Bookmark size={20} className={bookmarked ? 'fill-cyan-400' : ''} />
                    </motion.button>
                </div>
                <motion.button 
                    whileTap={{scale: 0.9}}
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-[16px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-cyan-400 font-bold transition group"
                    title="Поделиться"
                >
                    <Share2 size={20}/>
                    <span className="text-sm">Поделиться</span>
                </motion.button>
                {copied && (
                    <motion.span 
                        initial={{opacity: 0}} 
                        animate={{opacity: 1}} 
                        exit={{opacity: 0}}
                        className="text-xs text-green-400 font-medium absolute"
                    >
                        ✓ Скопировано
                    </motion.span>
                )}
            </div>
        </motion.div>
    );
});
FeedCard.displayName = 'FeedCard';

const AuthorStory = memo(({ author, navigate }) => (
    <motion.div 
        whileHover={{scale: 1.05}}
        whileTap={{scale: 0.95}}
        key={author.id} 
        onClick={()=>navigate(`/author/${author.id}`)}
        className="flex flex-col items-center gap-2.5 shrink-0 cursor-pointer group"
    >
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-xl group-hover:shadow-cyan-500/50 transition">
            <div className="w-full h-full rounded-full bg-[var(--bg-card)] p-[3px] overflow-hidden ring-2 ring-[var(--border)]">
                <img src={author.avatar} className="w-full h-full rounded-full object-cover"/>
            </div>
        </div>
        <p className="text-xs sm:text-sm text-[var(--text-dim)] truncate max-w-20 text-center font-semibold group-hover:text-[var(--text-primary)] transition">{author.name}</p>
    </motion.div>
));
AuthorStory.displayName = 'AuthorStory';

const NewsPage = ({ theme = 'dark' }) => {
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
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="min-h-screen bg-[var(--bg-main)] pt-14 pb-28 px-3 sm:px-4 font-sans text-[var(--text-primary)] transition-colors duration-500">
            <TutorialOverlay pageId="news" tutorials={tutorialData.news} theme={theme} />
            
            {/* Header */}
            <div className="max-w-2xl mx-auto mb-6">
                <div className="flex justify-between items-end gap-4">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">ЛЕНТА</h1>
                    <motion.div 
                        animate={{scale: [1, 1.1, 1]}}
                        transition={{duration: 2, repeat: Infinity}}
                        className="bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-400 px-4 py-2 rounded-full text-[11px] font-bold flex items-center gap-2 border border-red-500/30 backdrop-blur-md"
                    >
                        <Flame size={14} className="fill-red-500 animate-pulse"/> LIVE
                    </motion.div>
                </div>
            </div>

            {/* Stories */}
            <div className="max-w-2xl mx-auto">
                <div className="flex gap-3 overflow-x-auto scroll-smooth pb-3 mb-8 px-0.5">
                    {authors.slice(0, 10).map(a => <AuthorStory key={a.id} author={a} navigate={navigate} />)}
                </div>
            </div>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-8">
                <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={20}/>
                    <input 
                        value={search} 
                        onChange={e=>setSearch(e.target.value)} 
                        placeholder="Поиск..." 
                        className="w-full bg-[var(--glass)] border border-[var(--border)] rounded-[24px] py-3.5 px-5 pl-14 text-base text-[var(--text-primary)] placeholder-[var(--text-dim)] outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition shadow-md"
                    />
                </div>
            </div>

            {/* Feed */}
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
                {filtered.length > 0 ? (
                    filtered.map((post, i) => (
                        <FeedCard key={post.id} post={post} i={i} navigate={navigate} />
                    ))
                ) : (
                    <motion.div 
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        className="text-center py-16"
                    >
                        <p className="text-[var(--text-dim)] text-base">Ничего не найдено</p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};
export default NewsPage;
