import { useState, useEffect, memo, Suspense, lazy, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, BarChart2, Map, Newspaper, Bell, X, FileText, ChevronLeft, User, CheckCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './lib/api';
import { pageTransition, fadeTransition } from './lib/animations';
import { initOfflineDB, addOnlineListener } from './lib/offline';
import { enablePrivacyMode } from './lib/privacy';
import ConscienceCall from './components/ConscienceCall';
import IntroVideo from './components/IntroVideo';

// Lazy load all pages for better performance
const HomePage = lazy(() => import('./pages/Home'));
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

// Page transition wrapper for smooth animations
const PageTransitionWrapper = memo(({ children }) => (
    <motion.div
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        transition={pageTransition.transition}
    >
        {children}
    </motion.div>
));
PageTransitionWrapper.displayName = 'PageTransitionWrapper';

// FIX: The entire App component was accidentally deleted. This restores it.
// This component now correctly handles routing and fetches necessary data.
function App() {
    const [showIntro, setShowIntro] = useState(true);

    return (
        <div className="h-screen w-screen flex flex-col transition-colors duration-500 overflow-hidden bg-black">
            {showIntro && <IntroVideo onComplete={() => setShowIntro(false)} />}
            {!showIntro && <AppMain />}
        </div>
    );
}

const AppMain = () => {
    const [pages, setPages] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
    const [showConscienceCall, setShowConscienceCall] = useState(false);
    const [showRegionModal, setShowRegionModal] = useState(false);
    const [regionsList, setRegionsList] = useState([]);
    const [currentRegion, setCurrentRegion] = useState({ name: 'Загрузка...', current_index: 3.0 });

    // Initialize offline mode and sync on connection
    useEffect(() => {
        const initOfflineMode = async () => {
            try {
                // Enable privacy mode by default
                enablePrivacyMode({
                    noReferrer: true,
                    doNotTrack: true,
                    blockThirdPartyCookies: true,
                    sessionOnly: true
                });
                console.log('🔐 Privacy mode enabled by default');

                await initOfflineDB();
                console.log('✅ Offline mode initialized');
            } catch (error) {
                console.error('❌ Failed to init offline mode:', error);
            }
        };

        initOfflineMode();
        addOnlineListener((isOnline) => {
            if (isOnline) {
                console.log('📡 Device online - syncing data...');
            } else {
                console.log('📡 Device offline - using cached data');
            }
        });
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'rose');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
        
        // Fetch dynamic pages and regions
        api.getPages().then(setPages).catch(e => console.error("Failed to fetch pages", e));
        api.getRegions().then(list => {
            if (list?.length) {
                setRegionsList(list);
                const saved = localStorage.getItem('user_region_id');
                const region = list.find(r => String(r.id) === String(saved)) || list[0];
                setCurrentRegion(region);
                localStorage.setItem('user_region_id', region.id);
            }
        }).catch(e => console.error("Failed to fetch regions", e));
    }, [theme]);

    const selectRegion = (reg) => {
        if (!reg) return;
        setCurrentRegion(reg);
        localStorage.setItem('user_region_id', reg.id);
        localStorage.setItem('user_region_data', JSON.stringify({lat: reg.lat, lng: reg.lng, zoom: reg.zoom}));
        setShowRegionModal(false);
    };

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
                <AppContent 
                    pages={pages} 
                    theme={theme} 
                    toggleTheme={toggleTheme} 
                    onOpenConscienceCall={() => setShowConscienceCall(true)}
                    showRegionModal={showRegionModal}
                    setShowRegionModal={setShowRegionModal}
                    regionsList={regionsList}
                    currentRegion={currentRegion}
                    selectRegion={selectRegion}
                />
            </div>
            
            {/* Fixed Navigation at bottom - скрыта когда открыта История Совести */}
            {!showConscienceCall && <FloatingNav pages={pages} theme={theme} />}

            {/* Region Selection Modal - Fixed on viewport */}
            <AnimatePresence>
                {showRegionModal && (
                    <motion.div 
                        initial={{opacity: 0}} 
                        animate={{opacity: 1}} 
                        exit={{opacity: 0}} 
                        className="fixed inset-0 z-[10002] bg-black/60 backdrop-blur-xl flex items-end justify-center pointer-events-auto"
                        onClick={() => setShowRegionModal(false)}
                    >
                        <motion.div 
                            initial={{y: "100%"}} 
                            animate={{y: 0}} 
                            exit={{y: "100%"}} 
                            transition={{type: 'spring', damping: 30, stiffness: 250}} 
                            className="w-full max-w-md bg-[var(--bg-card)] border-t border-[var(--border)] rounded-t-[40px] p-8 pb-32 shadow-2xl safe-area-bottom z-[10001] max-h-[90vh] flex flex-col" 
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-3xl font-black text-[var(--text-primary)] mb-8 px-2 tracking-tight flex-shrink-0">Выберите город</h3>
                            <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                                {regionsList.map(r => (
                                    <button 
                                        key={r.id} 
                                        onClick={() => selectRegion(r)} 
                                        className={`w-full text-left p-5 rounded-[28px] border transition-all duration-300 flex justify-between items-center group ${
                                            currentRegion?.id === r?.id 
                                                ? 'bg-blue-600 border-transparent text-white shadow-lg' 
                                                : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-dim)] hover:border-white/20'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-bold text-lg">{r?.name}</div>
                                            <div className={`text-xs mt-1 font-mono ${currentRegion?.id === r?.id ? 'text-blue-200' : 'opacity-70'}`}>
                                                ИНДЕКС: {r?.current_index?.toFixed(2)}
                                            </div>
                                        </div>
                                        {currentRegion?.id === r?.id && (
                                            <div className="bg-white/20 p-1.5 rounded-full">
                                                <CheckCircle size={20} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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


const AppContent = memo(({ pages, theme, toggleTheme, onOpenConscienceCall, showRegionModal, setShowRegionModal, regionsList, currentRegion, selectRegion }) => {
    const location = useLocation();
    const isAdmin = location.pathname.includes('admin');

    return (
        <>
            {/* Main content area with padding for fixed nav */}
            <div className="relative z-10 pb-28">
                <AnimatePresence mode="wait">
                    <Routes location={location} key={location.pathname}>
                        <Route path="/" element={<PageTransitionWrapper><HomePage theme={theme} toggleTheme={toggleTheme} onOpenConscienceCall={onOpenConscienceCall} showRegionModal={showRegionModal} setShowRegionModal={setShowRegionModal} regionsList={regionsList} currentRegion={currentRegion} selectRegion={selectRegion} /></PageTransitionWrapper>} />
                        <Route path="/chart" element={<PageTransitionWrapper><Suspense fallback={<PageLoader />}><ChartPage theme={theme} /></Suspense></PageTransitionWrapper>} />
                        <Route path="/map" element={<PageTransitionWrapper><Suspense fallback={<PageLoader />}><MapPage theme={theme} /></Suspense></PageTransitionWrapper>} />
                        <Route path="/news" element={<PageTransitionWrapper><Suspense fallback={<PageLoader />}><NewsPage theme={theme} /></Suspense></PageTransitionWrapper>} />
                        <Route path="/report" element={<PageTransitionWrapper><Suspense fallback={<PageLoader />}><ReportPage theme={theme} /></Suspense></PageTransitionWrapper>} />
                        <Route path="/admin" element={<PageTransitionWrapper><Suspense fallback={<PageLoader />}><Admin /></Suspense></PageTransitionWrapper>} />
                        <Route path="/author/:id" element={<PageTransitionWrapper><AuthorProfile theme={theme} /></PageTransitionWrapper>} />
                        {pages.map(p => (
                            <Route key={p.id} path={`/${p.slug}`} element={<PageTransitionWrapper><CustomPage theme={theme} title={p.title} content={p.content} /></PageTransitionWrapper>} />
                        ))}
                        {/* Fallback route */}
                        <Route path="*" element={<PageTransitionWrapper><NotFound theme={theme} /></PageTransitionWrapper>} />
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
    const [activeTab, setActiveTab] = useState('news');

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
    const newsCount = news ? news.length : 0;
    
    return (
        <div className={`min-h-screen pb-32 ${isBgDark ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
            {/* HEADER GRADIENT WITH ANIMATED LINES */}
            <div className="relative h-64 overflow-hidden">
                <motion.div 
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 1}}
                    className={`absolute inset-0 bg-gradient-to-br ${author.is_verified ? 'from-indigo-600 via-purple-600 to-pink-500' : 'from-blue-500 via-cyan-400 to-blue-600'}`}
                />
                
                {/* Animated background elements */}
                <motion.div 
                    animate={{rotate: 360}}
                    transition={{duration: 20, repeat: Infinity, ease: "linear"}}
                    className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 border-2 border-white/30"
                />
                <motion.div 
                    animate={{rotate: -360}}
                    transition={{duration: 30, repeat: Infinity, ease: "linear"}}
                    className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-10 border-2 border-white/20"
                />
                
                {/* BACK BUTTON */}
                <motion.button 
                    whileTap={{scale:0.9}}
                    whileHover={{scale: 1.1}}
                    onClick={()=>navigate(-1)} 
                    className={`absolute top-6 left-6 z-20 p-3 rounded-full backdrop-blur-md border transition ${isBgDark ? 'bg-black/40 border-white/30 text-white hover:bg-black/60' : 'bg-white/40 border-white/50 text-white hover:bg-white/60'}`}
                >
                    <ChevronLeft size={24}/>
                </motion.button>
            </div>

            {/* PROFILE CARD - PREMIUM STYLE */}
            <div className={`px-4 -mt-32 relative z-10 max-w-3xl mx-auto`}>
                <motion.div 
                    initial={{opacity:0, y:30}} 
                    animate={{opacity:1, y:0}}
                    transition={{duration: 0.6}}
                    className={`rounded-[32px] p-8 shadow-2xl backdrop-blur-xl border overflow-hidden ${isBgDark ? 'bg-[#1a1a1a]/95 border-white/10' : 'bg-white/95 border-black/5'}`}
                >
                    {/* Colorful top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"/>
                    
                    {/* AVATAR SECTION */}
                    <div className="flex flex-col items-center mb-8">
                        <motion.div 
                            whileHover={{scale:1.08, rotate: 2}}
                            whileTap={{scale: 0.95}}
                            className="relative mb-4 cursor-pointer"
                        >
                            <div className="w-44 h-44 rounded-full p-1 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl animate-pulse">
                                <div className={`w-full h-full rounded-full ${isBgDark ? 'bg-black' : 'bg-white'} p-1 overflow-hidden`}>
                                    {author.avatar && <img src={author.avatar} className="w-full h-full object-cover rounded-full"/>}
                                </div>
                            </div>
                            {author.is_verified && (
                                <motion.div 
                                    animate={{scale: [1, 1.2, 1]}}
                                    transition={{duration: 2, repeat: Infinity}}
                                    className="absolute bottom-0 right-0 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full p-2.5 shadow-lg border-4 border-white"
                                >
                                    <CheckCircle size={24} className="text-white fill-white"/>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* NAME & HANDLE */}
                        <motion.div initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.2}}>
                            <h1 className={`text-5xl font-black text-center mt-6 bg-gradient-to-r ${author.is_verified ? 'from-blue-500 to-purple-600' : 'from-blue-400 to-cyan-500'} bg-clip-text text-transparent`}>
                                {author.name || 'Без имени'}
                            </h1>
                            
                            <p className={`text-xl font-mono mt-2 text-center ${isBgDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                @{author.handle || 'unknown'}
                            </p>
                        </motion.div>

                        {/* BIO */}
                        {author.bio && (
                            <motion.div 
                                initial={{opacity:0}}
                                animate={{opacity:1}}
                                transition={{delay:0.3}}
                                className={`mt-6 text-center text-sm leading-relaxed max-w-sm px-4 py-3 rounded-xl ${isBgDark ? 'bg-white/5 text-gray-300' : 'bg-black/5 text-gray-700'}`}
                            >
                                {author.bio}
                            </motion.div>
                        )}

                        {/* STATS */}
                        <motion.div 
                            initial={{opacity:0, y: 20}}
                            animate={{opacity:1, y: 0}}
                            transition={{delay:0.4}}
                            className="grid grid-cols-3 gap-4 mt-8 w-full"
                        >
                            <div className={`rounded-2xl p-4 text-center backdrop-blur-sm border ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                <div className="text-2xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                                    {newsCount}
                                </div>
                                <p className={`text-xs font-bold uppercase mt-1 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Новостей
                                </p>
                            </div>
                            
                            <div className={`rounded-2xl p-4 text-center backdrop-blur-sm border ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                <div className="text-2xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                    {author.is_verified ? '✓' : '◉'}
                                </div>
                                <p className={`text-xs font-bold uppercase mt-1 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {author.is_verified ? 'Верифиро' : 'Автор'}
                                </p>
                            </div>

                            <div className={`rounded-2xl p-4 text-center backdrop-blur-sm border ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'}`}>
                                <div className="text-2xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                                    ★5.0
                                </div>
                                <p className={`text-xs font-bold uppercase mt-1 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Рейтинг
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* NEWS SECTION WITH TABS */}
                <motion.div 
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.5}}
                    className="mt-12"
                >
                    {/* TABS WITH UNDERLINE */}
                    <div className="flex gap-6 mb-8 border-b border-white/10 pb-4">
                        {['news', 'video', 'widgets'].map((tab) => (
                            <motion.button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                whileTap={{scale: 0.96}}
                                className={`relative font-bold text-lg transition ${
                                    activeTab === tab
                                        ? isBgDark ? 'text-white' : 'text-black'
                                        : isBgDark ? 'text-gray-500' : 'text-gray-400'
                                }`}
                            >
                                {tab === 'news' ? '📰 Новости' : tab === 'video' ? '▶️ Видео' : '✨ Виджеты'}
                                {activeTab === tab && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"
                                        transition={{type: 'spring', stiffness: 380, damping: 30}}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    {/* NEWS TAB */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'news' && (
                            <motion.div
                                key="news"
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -20}}
                                transition={{duration: 0.3}}
                            >
                                {news && news.length > 0 ? (
                                    <div className="space-y-4">
                                        {news.map((n, i) => (
                                            <motion.div
                                                key={n.id}
                                                initial={{opacity:0, y:20}}
                                                animate={{opacity:1, y:0}}
                                                transition={{delay: i*0.1}}
                                                whileHover={{y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)'}}
                                                className={`rounded-2xl p-6 backdrop-blur-xl border shadow-lg transition cursor-pointer group ${
                                                    n.is_highlighted 
                                                        ? `${isBgDark ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/40' : 'bg-gradient-to-r from-yellow-100/60 to-orange-100/60 border-yellow-400/60'} border-l-4 border-l-yellow-500`
                                                        : `${isBgDark ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]' : 'bg-black/5 border-black/10 hover:bg-black/[0.08]'}`
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 mb-3">
                                                    {n.is_highlighted && <motion.span animate={{rotate: [0, 10, 0]}} transition={{duration: 2, repeat: Infinity}} className="text-2xl">⭐</motion.span>}
                                                    <div className="flex-1">
                                                        <p className={`text-xs font-bold uppercase tracking-widest ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {new Date(n.date).toLocaleDateString('ru-RU', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <p className={`text-sm leading-relaxed mb-4 ${isBgDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-800 group-hover:text-black'} transition`}>
                                                    {n.text}
                                                </p>
                                                
                                                {n.image && (
                                                    <motion.img 
                                                        whileHover={{scale: 1.02}}
                                                        src={n.image} 
                                                        className="w-full rounded-xl mb-4 border border-white/10 object-cover max-h-48 transition"
                                                    />
                                                )}
                                                
                                                {n.btn_text && (
                                                    <motion.button
                                                        whileTap={{scale:0.98}}
                                                        whileHover={{scale: 1.02}}
                                                        onClick={() => {
                                                            if(n.btn_link) {
                                                                if(n.btn_link.startsWith('/')) navigate(n.btn_link);
                                                                else window.open(n.btn_link, '_blank');
                                                            }
                                                        }}
                                                        className="w-full py-3 rounded-lg font-bold text-sm uppercase tracking-wide bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white transition"
                                                    >
                                                        {n.btn_text} →
                                                    </motion.button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className={`text-center py-16 ${isBgDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <p className="text-2xl font-bold mb-2">📭</p>
                                        <p className="text-lg">Нет новостей</p>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* VIDEO TAB */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'video' && (
                            <motion.div
                                key="video"
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -20}}
                                transition={{duration: 0.3}}
                            >
                                <motion.div 
                                    animate={{y: [0, -10, 0]}}
                                    transition={{duration: 3, repeat: Infinity}}
                                    className={`rounded-2xl p-16 backdrop-blur-xl border text-center ${isBgDark ? 'bg-gradient-to-br from-white/8 to-white/3 border-white/10' : 'bg-gradient-to-br from-black/8 to-black/3 border-black/10'}`}
                                >
                                    <motion.p animate={{scale: [1, 1.1, 1]}} transition={{duration: 2, repeat: Infinity}} className="text-5xl mb-4">
                                        🎬
                                    </motion.p>
                                    <p className={`text-2xl font-bold ${isBgDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Скоро...
                                    </p>
                                    <p className={`text-sm mt-2 ${isBgDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                        Видео-контент готовится
                                    </p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* WIDGETS TAB */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'widgets' && (
                            <motion.div
                                key="widgets"
                                initial={{opacity: 0, y: 20}}
                                animate={{opacity: 1, y: 0}}
                                exit={{opacity: 0, y: -20}}
                                transition={{duration: 0.3}}
                                className="flex items-center justify-center min-h-[400px]"
                            >
                                <motion.div
                                    initial={{scale: 0.8, opacity: 0}}
                                    animate={{scale: 1, opacity: 1}}
                                    transition={{delay: 0.1, duration: 0.4}}
                                    className="w-full max-w-2xl"
                                >
                                    <div className="relative">
                                        {/* Animated Background */}
                                        <motion.div
                                            animate={{
                                                rotate: 360,
                                                scale: [1, 1.1, 1]
                                            }}
                                            transition={{
                                                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                                                scale: { duration: 3, repeat: Infinity }
                                            }}
                                            className={`absolute inset-0 rounded-3xl opacity-20 blur-2xl ${isBgDark ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500' : 'bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400'}`}
                                        />
                                        
                                        <motion.div
                                            initial={{opacity: 0, y: 20}}
                                            animate={{opacity: 1, y: 0}}
                                            transition={{delay: 0.2}}
                                            className={`relative rounded-3xl p-12 border text-center backdrop-blur-xl ${isBgDark ? 'bg-white/8 border-white/10' : 'bg-black/8 border-black/10'}`}
                                        >
                                            {/* Floating Icons */}
                                            <motion.div
                                                animate={{y: [-10, 10, -10]}}
                                                transition={{duration: 3, repeat: Infinity}}
                                                className="mb-6 flex justify-center gap-4 text-5xl"
                                            >
                                                <motion.span
                                                    whileHover={{scale: 1.1, rotate: 15}}
                                                >
                                                    ✨
                                                </motion.span>
                                                <motion.span
                                                    animate={{rotate: 360}}
                                                    transition={{duration: 4, repeat: Infinity, ease: 'linear'}}
                                                >
                                                    ⚡
                                                </motion.span>
                                                <motion.span
                                                    animate={{y: [10, -10, 10]}}
                                                    transition={{duration: 3, repeat: Infinity}}
                                                >
                                                    🚀
                                                </motion.span>
                                            </motion.div>

                                            <h3 className={`text-4xl font-black mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent`}>
                                                Скоро!
                                            </h3>

                                            <p className={`text-lg mb-6 leading-relaxed ${isBgDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Система управления виджетами находится в разработке. Скоро вы сможете создавать и настраивать собственные виджеты.
                                            </p>

                                            <motion.div
                                                initial={{opacity: 0, scale: 0.8}}
                                                animate={{opacity: 1, scale: 1}}
                                                transition={{delay: 0.5}}
                                                className="flex flex-col sm:flex-row items-center justify-center gap-3"
                                            >
                                                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${isBgDark ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300' : 'bg-purple-500/20 border border-purple-500/40 text-purple-600'}`}>
                                                    ✨ Новые возможности
                                                </div>
                                                <div className={`px-4 py-2 rounded-xl font-bold text-sm ${isBgDark ? 'bg-cyan-500/30 border border-cyan-500/50 text-cyan-300' : 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-600'}`}>
                                                    ⚡ Улучшенный функционал
                                                </div>
                                            </motion.div>

                                            {/* Animated Progress Bar */}
                                            <motion.div
                                                initial={{opacity: 0}}
                                                animate={{opacity: 1}}
                                                transition={{delay: 0.6}}
                                                className="mt-8"
                                            >
                                                <p className={`text-xs mb-2 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>В разработке</p>
                                                <div className={`h-2 rounded-full overflow-hidden border ${isBgDark ? 'bg-gray-700/50 border-gray-600/50' : 'bg-gray-300/50 border-gray-400/50'}`}>
                                                    <motion.div
                                                        initial={{width: 0}}
                                                        animate={{width: '65%'}}
                                                        transition={{delay: 0.8, duration: 1.5, ease: 'easeOut'}}
                                                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500"
                                                    />
                                                </div>
                                            </motion.div>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
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
