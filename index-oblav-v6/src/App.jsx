import { useState, useEffect, memo, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, BarChart2, Map, Newspaper, Bell, X, FileText, ChevronLeft, User, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './lib/api';

import HomePage from './pages/Home';
import ChartPage from './pages/Chart';
import MapPage from './pages/Map';
import NewsPage from './pages/News';
import ReportPage from './pages/Report';
import Admin from './pages/Mapsandchart config';

// FIX: The entire App component was accidentally deleted. This restores it.
// This component now correctly handles routing and fetches necessary data.
const App = () => {
    const [pages, setPages] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
        
        // Fetch dynamic pages
        api.getPages().then(setPages).catch(e => console.error("Failed to fetch pages", e));
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

    return (
        <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
            <AppContent pages={pages} theme={theme} toggleTheme={toggleTheme} />
        </div>
    );
};


const AppContent = ({ pages, theme, toggleTheme }) => {
    const location = useLocation();
    const isAdmin = location.pathname.includes('admin');

    return (
        <>
            {/* Main content area */}
            <div className="relative z-10">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<HomePage theme={theme} toggleTheme={toggleTheme} />} />
                        <Route path="/chart" element={<ChartPage theme={theme} />} />
                        <Route path="/map" element={<MapPage theme={theme} />} />
                        <Route path="/news" element={<NewsPage theme={theme} />} />
                        <Route path="/report" element={<ReportPage theme={theme} />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/author/:id" element={<AuthorProfile theme={theme} />} />
                        {pages.map(p => (
                            <Route key={p.id} path={`/${p.slug}`} element={<CustomPage theme={theme} title={p.title} content={p.content} />} />
                        ))}
                    </Routes>
                </AnimatePresence>
            </div>

            {/* Bottom navigation bar, appears only on non-admin pages */}
            {!isAdmin && (
                <nav className="fixed bottom-0 left-0 right-0 z-[10001] p-4 pb-5 pointer-events-none safe-area-bottom">
                    <div className="glass-card h-20 flex items-center justify-around px-2 rounded-[32px] pointer-events-auto border-white/5 shadow-2xl max-w-md mx-auto">
                        <NavBtn to="/" icon={<Home size={24}/>} active={location.pathname==='/'} theme={theme} />
                        <NavBtn to="/chart" icon={<BarChart2 size={24}/>} active={location.pathname==='/chart'} theme={theme} />
                        <NavBtn to="/map" icon={<Map size={24}/>} active={location.pathname==='/map'} theme={theme} />
                        <NavBtn to="/news" icon={<Newspaper size={24}/>} active={location.pathname==='/news'} theme={theme} />
                        {pages.filter(p=>!p.is_hidden).map(p=>(<NavBtn key={p.id} to={`/${p.slug}`} icon={<FileText size={24}/>} active={location.pathname===`/${p.slug}`} theme={theme} />))}
                    </div>
                </nav>
            )}
        </>
    );
};

// --- DYNAMIC & DETAIL PAGES ---

const CustomPage = memo(({ title, content, theme }) => {
    return (
        <div className={`min-h-screen pt-24 pb-32 p-6 ${theme==='dark'?'text-white':'text-black'}`}>
           {content.trim().startsWith('<') 
                ? <div dangerouslySetInnerHTML={{__html:content}}/> 
                : <div className="glass-card p-6"><h1 className="text-3xl font-black mb-4">{title}</h1><div className="whitespace-pre-wrap text-sm opacity-80">{content}</div></div>
           }
        </div>
    );
});

const AuthorProfile = memo(({ theme }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.getAuthor(id)
            .then(setData)
            .catch(e => {
                console.error("Failed to fetch author", e);
                setError(e);
            });
    }, [id]);

    if (error || !data || !data.author) return (
        <div className={`flex items-center justify-center h-screen text-center ${theme==='dark'?'text-white':'text-black'}`}>
            <div><p className="text-lg">Автор не найден</p></div>
        </div>
    );

    const { author, news } = data;
    const isBgDark = theme === 'dark';
    
    return (
        <div className={`min-h-screen pb-32 ${isBgDark ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
            {/* HEADER GRADIENT */}
            <div className="relative h-56 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${author.is_verified ? 'from-blue-600 via-purple-600 to-pink-500' : 'from-blue-500 via-cyan-400 to-blue-600'}`}></div>
                <div className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1200 120%22><path d=%22M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z%22 fill=%22%23000%22 opacity=%220.1%22></path></svg>')] bg-repeat-x"></div>
                
                {/* BACK BUTTON */}
                <motion.button 
                    whileTap={{scale:0.9}}
                    onClick={()=>navigate(-1)} 
                    className={`absolute top-6 left-6 z-20 p-3 rounded-full backdrop-blur-md border transition ${isBgDark ? 'bg-black/30 border-white/20 text-white hover:bg-black/50' : 'bg-white/30 border-white/40 text-white hover:bg-white/50'}`}
                >
                    <ChevronLeft size={24}/>
                </motion.button>
            </div>

            {/* PROFILE CARD */}
            <div className={`px-4 -mt-24 relative z-10 max-w-2xl mx-auto`}>
                <motion.div 
                    initial={{opacity:0, y:20}} 
                    animate={{opacity:1, y:0}}
                    className={`rounded-[32px] p-8 shadow-2xl backdrop-blur-xl border ${isBgDark ? 'bg-[#1a1a1a]/90 border-white/10' : 'bg-white/90 border-black/5'}`}
                >
                    {/* AVATAR */}
                    <div className="flex flex-col items-center mb-6">
                        <motion.div 
                            whileHover={{scale:1.05}}
                            className="relative mb-4"
                        >
                            <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl">
                                <div className={`w-full h-full rounded-full ${isBgDark ? 'bg-black' : 'bg-white'} p-1 overflow-hidden`}>
                                    {author.avatar && <img src={author.avatar} className="w-full h-full object-cover rounded-full"/>}
                                </div>
                            </div>
                            {author.is_verified && (
                                <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2 shadow-lg border-4 border-white">
                                    <CheckCircle size={20} className="text-white fill-white"/>
                                </div>
                            )}
                        </motion.div>

                        {/* NAME */}
                        <h1 className={`text-4xl font-black text-center mt-4 ${isBgDark ? 'text-white' : 'text-black'}`}>
                            {author.name || 'Без имени'}
                        </h1>
                        
                        {/* HANDLE */}
                        <p className={`text-lg font-mono ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            @{author.handle || 'unknown'}
                        </p>

                        {/* BIO */}
                        {author.bio && (
                            <motion.div 
                                initial={{opacity:0}}
                                animate={{opacity:1}}
                                transition={{delay:0.2}}
                                className={`mt-6 text-center text-sm leading-relaxed max-w-xs ${isBgDark ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                {author.bio}
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* NEWS SECTION */}
                <div className="mt-12">
                    <h2 className={`text-2xl font-black mb-6 ${isBgDark ? 'text-white' : 'text-black'}`}>
                        📰 НОВОСТИ
                    </h2>
                    
                    {news && news.length > 0 ? (
                        <div className="space-y-4">
                            {news.map((n, i) => (
                                <motion.div
                                    initial={{opacity:0, y:20}}
                                    animate={{opacity:1, y:0}}
                                    transition={{delay: i*0.1}}
                                    key={n.id}
                                    className={`rounded-2xl p-6 backdrop-blur-xl border shadow-lg hover:shadow-xl transition ${
                                        n.is_highlighted 
                                            ? `${isBgDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-100/50 border-yellow-400/50'} border-l-4 border-l-yellow-500`
                                            : `${isBgDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`
                                    }`}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        {n.is_highlighted && <span className="text-2xl">⭐</span>}
                                        <div className="flex-1">
                                            <p className={`text-xs font-bold uppercase tracking-widest ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {new Date(n.date).toLocaleDateString('ru-RU', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <p className={`text-sm leading-relaxed mb-4 ${isBgDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {n.text}
                                    </p>
                                    
                                    {n.image && (
                                        <img src={n.image} className="w-full rounded-xl mb-4 border border-white/10 object-cover max-h-48"/>
                                    )}
                                    
                                    {n.btn_text && (
                                        <motion.button
                                            whileTap={{scale:0.98}}
                                            onClick={() => {
                                                if(n.btn_link) {
                                                    if(n.btn_link.startsWith('/')) navigate(n.btn_link);
                                                    else window.open(n.btn_link, '_blank');
                                                }
                                            }}
                                            className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-lg transition"
                                        >
                                            {n.btn_text}
                                        </motion.button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className={`text-center py-12 ${isBgDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <p className="text-lg">Нет новостей</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const NavBtn = memo(({to, icon, active, theme}) => {
    const navigate = useNavigate();
    return (
        <button onClick={()=>navigate(to)} className={`p-4 h-16 w-16 flex items-center justify-center rounded-2xl transition-all duration-300 ${active ? (theme==='dark'?'bg-white text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-[var(--text-primary)]'}`}>
            {icon}
        </button>
    );
});

export default App;
