import { useState, useEffect, memo, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, BarChart2, Map, Newspaper, Bell, X, FileText, ChevronLeft, User, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './lib/api';
import ConscienceCall from './components/ConscienceCall';

import HomePage from './pages/Home';

// Lazy load heavy pages
const ChartPage = lazy(() => import('./pages/Chart'));
const MapPage = lazy(() => import('./pages/Map'));
const NewsPage = lazy(() => import('./pages/News'));
const ReportPage = lazy(() => import('./pages/Report'));
const Admin = lazy(() => import('./pages/Mapsandchart config'));

// Loading fallback
const PageLoader = memo(() => (
    <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div animate={{rotate: 360}} transition={{duration: 2, repeat: Infinity}}>
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full"/>
        </motion.div>
    </div>
));
PageLoader.displayName = 'PageLoader';

// FIX: The entire App component was accidentally deleted. This restores it.
// This component now correctly handles routing and fetches necessary data.
function App() {
    return (
        <div className="h-screen w-screen flex flex-col transition-colors duration-500 overflow-hidden bg-black">
            <AppMain />
        </div>
    );
}

const AppMain = () => {
    const [pages, setPages] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [showConscienceCall, setShowConscienceCall] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'rose');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
        
        // Fetch dynamic pages
        api.getPages().then(setPages).catch(e => console.error("Failed to fetch pages", e));
    }, [theme]);

    const toggleTheme = () => {
        if (navigator.vibrate) navigator.vibrate(20);
        const themes = ['light', 'dark', 'rose'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };

    const handleActivateTheme = (newTheme) => {
        setTheme(newTheme);
    };

    const getBgClass = () => {
        if (theme === 'dark') return 'bg-black';
        if (theme === 'light') return 'bg-[#f2f2f7]';
        if (theme === 'rose') return 'bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50';
        return 'bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50';
    };

    return (
        <div className={`h-screen w-screen flex flex-col transition-colors duration-500 overflow-hidden ${getBgClass()}`}>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <AppContent pages={pages} theme={theme} toggleTheme={toggleTheme} onOpenConscienceCall={() => setShowConscienceCall(true)} />
            </div>
            
            {/* Fixed Navigation at bottom - скрыта когда открыта История Совести */}
            {!showConscienceCall && <FloatingNav pages={pages} theme={theme} />}

            {/* Conscience Call Modal */}
            <ConscienceCall 
                isOpen={showConscienceCall} 
                onClose={() => setShowConscienceCall(false)}
                onActivateTheme={handleActivateTheme}
            />
        </div>
    );
};

// Получаем location для проверки admin
const FloatingNav = memo(({ pages, theme }) => {
    const location = useLocation();
    const isAdmin = location.pathname.includes('admin');
    const [showIntro, setShowIntro] = useState(!localStorage.getItem('app_intro_shown'));
    
    // Слушаем пользовательское событие завершения интро
    useEffect(() => {
        const handleIntroComplete = () => {
            setShowIntro(false);
        };
        window.addEventListener('intro_completed', handleIntroComplete);
        return () => window.removeEventListener('intro_completed', handleIntroComplete);
    }, []);

    // Скрываем навигацию если показывается интро
    if (showIntro || isAdmin) return null;
    // Не показываем навигацию на админ странице
    if (isAdmin) return null;
    
    return (
        <motion.nav 
            initial={{opacity: 0, y: 100}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.3, duration: 0.6}}
            className="fixed inset-x-0 bottom-0 z-[10001] pointer-events-none"
            style={{height: 'auto'}}
        >
            {/* Background blur effect */}
            <div className={`absolute inset-0 pointer-events-none ${
                theme === 'dark' 
                    ? 'bg-gradient-to-t from-black via-black/80 to-transparent' 
                    : theme === 'light'
                    ? 'bg-gradient-to-t from-white via-white/80 to-transparent'
                    : 'bg-gradient-to-t from-pink-50 via-pink-50/80 to-transparent'
            }`} style={{height: '120px'}}></div>
            
            <div className="flex justify-center px-4 pb-6 pointer-events-auto relative z-10" style={{paddingBottom: `calc(1.5rem + env(safe-area-inset-bottom, 0))`}}>
                <motion.div 
                    className={`
                        flex items-center justify-between gap-1 px-4 py-4 rounded-3xl 
                        pointer-events-auto backdrop-blur-3xl border shadow-2xl
                        min-w-[340px] max-w-[400px] w-full
                        ${theme === 'dark' 
                            ? 'bg-black/75 border-white/20' 
                            : theme === 'light'
                            ? 'bg-white/85 border-white/40'
                            : 'bg-rose-200/60 border-pink-300/50 shadow-pink-300/20'
                        }
                    `}
                    whileHover={{y: -2}}
                    transition={{type: 'spring', stiffness: 400, damping: 25}}
                >
                    <NavBtn to="/" icon={<Home size={24}/>} active={location.pathname==='/'} theme={theme} />
                    <NavBtn to="/chart" icon={<BarChart2 size={24}/>} active={location.pathname==='/chart'} theme={theme} />
                    <NavBtn to="/map" icon={<Map size={24}/>} active={location.pathname==='/map'} theme={theme} />
                    <NavBtn to="/news" icon={<Newspaper size={24}/>} active={location.pathname==='/news'} theme={theme} />
                    {pages.filter(p=>!p.is_hidden).slice(0, 1).map(p=>(
                        <NavBtn key={p.id} to={`/${p.slug}`} icon={<FileText size={24}/>} active={location.pathname===`/${p.slug}`} theme={theme} />
                    ))}
                </motion.div>
            </div>
        </motion.nav>
    );
});
FloatingNav.displayName = 'FloatingNav';


const AppContent = memo(({ pages, theme, toggleTheme, onOpenConscienceCall }) => {
    const location = useLocation();
    const isAdmin = location.pathname.includes('admin');

    return (
        <>
            {/* Main content area with padding for fixed nav */}
            <div className="relative z-10 pb-28">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<HomePage theme={theme} toggleTheme={toggleTheme} onOpenConscienceCall={onOpenConscienceCall} />} />
                        <Route path="/chart" element={<Suspense fallback={<PageLoader />}><ChartPage theme={theme} /></Suspense>} />
                        <Route path="/map" element={<Suspense fallback={<PageLoader />}><MapPage theme={theme} /></Suspense>} />
                        <Route path="/news" element={<Suspense fallback={<PageLoader />}><NewsPage theme={theme} /></Suspense>} />
                        <Route path="/report" element={<Suspense fallback={<PageLoader />}><ReportPage theme={theme} /></Suspense>} />
                        <Route path="/admin" element={<Suspense fallback={<PageLoader />}><Admin /></Suspense>} />
                        <Route path="/author/:id" element={<AuthorProfile theme={theme} />} />
                        {pages.map(p => (
                            <Route key={p.id} path={`/${p.slug}`} element={<CustomPage theme={theme} title={p.title} content={p.content} />} />
                        ))}
                        {/* Fallback route */}
                        <Route path="*" element={<NotFound theme={theme} />} />
                    </Routes>
                </AnimatePresence>
            </div>
        </>
    );
}, (prevProps, nextProps) => {
    return prevProps.theme === nextProps.theme && 
           prevProps.pages.length === nextProps.pages.length &&
           prevProps.onOpenConscienceCall === nextProps.onOpenConscienceCall;
});
AppContent.displayName = 'AppContent';

// --- DYNAMIC & DETAIL PAGES ---

const NotFound = memo(({ theme }) => {
    const navigate = useNavigate();
    return (
        <motion.div 
            initial={{opacity:0, y:20}}
            animate={{opacity:1, y:0}}
            className={`min-h-screen flex flex-col items-center justify-center pt-24 pb-32 p-6 max-w-2xl mx-auto text-center`}
        >
            <div className="text-6xl font-black mb-4">404</div>
            <h1 className="text-3xl font-black mb-3 text-[var(--text-primary)]">Страница не найдена</h1>
            <p className="text-[var(--text-dim)] mb-8">Пожалуйста, вернитесь на главную</p>
            <motion.button
                whileTap={{scale:0.95}}
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold"
            >
                На главную
            </motion.button>
        </motion.div>
    );
});
NotFound.displayName = 'NotFound';

const CustomPage = memo(({ title, content, theme }) => {
    return (
        <motion.div 
            initial={{opacity:0, y:20}}
            animate={{opacity:1, y:0}}
            className={`min-h-screen pt-24 pb-32 p-6 max-w-2xl mx-auto ${theme==='dark'?'bg-black text-white':'bg-[#f2f2f7] text-black'}`}
        >
            <h1 className="text-4xl font-black mb-6 text-[var(--text-primary)]">{title}</h1>
            {content && content.trim().startsWith('<') 
                ? <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html:content}}/> 
                : <div className="glass-card p-8"><div className="whitespace-pre-wrap text-base opacity-90 leading-relaxed">{content}</div></div>
            }
        </motion.div>
    );
});
CustomPage.displayName = 'CustomPage';

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
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-400/20'}`}>
                            <Newspaper size={24} className="text-blue-500"/>
                        </div>
                        <h2 className={`text-2xl font-black ${isBgDark ? 'text-white' : 'text-black'}`}>
                            НОВОСТИ
                        </h2>
                    </div>
                    
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
    
    // Haptic feedback function
    const hapticFeedback = () => {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            // Telegram-style vibration pattern: short burst
            window.navigator.vibrate([8, 4, 8]);
        }
    };
    
    const handleClick = () => {
        hapticFeedback();
        navigate(to);
    };
    
    return (
        <motion.button 
            onClick={handleClick}
            onMouseDown={hapticFeedback}
            whileHover={{scale: 1.15, y: -3}}
            whileTap={{scale: 0.88}}
            className={`
                relative p-3 h-14 w-14 flex items-center justify-center rounded-2xl 
                transition-all duration-300 font-semibold text-sm
                ${active 
                    ? theme === 'dark'
                        ? 'bg-white/90 text-black shadow-xl'
                        : theme === 'light'
                        ? 'bg-black/90 text-white shadow-xl'
                        : 'bg-gradient-to-br from-pink-400 to-rose-300 text-white shadow-xl shadow-pink-400/40'
                    : theme === 'dark'
                        ? 'text-white/50 hover:text-white/90 hover:bg-white/10'
                        : theme === 'light'
                        ? 'text-black/50 hover:text-black/90 hover:bg-black/10'
                        : 'text-pink-600/60 hover:text-pink-600/90 hover:bg-pink-300/25'
                }
            `}
        >
            {active && (
                <motion.div 
                    layoutId="activeNav"
                    className={`absolute inset-0 rounded-2xl -z-10 ${
                        theme === 'dark' 
                            ? 'bg-gradient-to-br from-blue-400 to-cyan-400' 
                            : theme === 'light'
                            ? 'bg-gradient-to-br from-blue-600 to-cyan-600'
                            : 'bg-gradient-to-br from-pink-400 to-rose-300'
                    }`}
                    transition={{type: 'spring', stiffness: 380, damping: 30}}
                />
            )}
            {icon}
        </motion.button>
    );
});
NavBtn.displayName = 'NavBtn';

export default App;
