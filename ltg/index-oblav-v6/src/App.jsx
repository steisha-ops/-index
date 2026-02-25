import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Home, BarChart2, Map, Newspaper, Bell, X, FileText, ChevronLeft, User, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './lib/api';

import HomePage from './pages/Home';
import ChartPage from './pages/Chart';
import MapPage from './pages/Map';
import NewsPage from './pages/News';
import ReportPage from './pages/Report';
import Admin from './pages/Admin';

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
                <nav className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-5 pointer-events-none safe-area-bottom">
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

const CustomPage = ({ title, content, theme }) => {
    return (
        <div className={`min-h-screen pt-24 pb-32 p-6 ${theme==='dark'?'text-white':'text-black'}`}>
           {content.trim().startsWith('<') 
                ? <div dangerouslySetInnerHTML={{__html:content}}/> 
                : <div className="glass-card p-6"><h1 className="text-3xl font-black mb-4">{title}</h1><div className="whitespace-pre-wrap text-sm opacity-80">{content}</div></div>
           }
        </div>
    );
};

const AuthorProfile = ({ theme }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);

    useEffect(() => {
        api.getAuthor(id).then(setData).catch(e => console.error("Failed to fetch author", e));
    }, [id]);

    if (!data) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;

    const { author, news } = data;
    return (
        <div className={`min-h-screen pb-32 ${theme==='dark'?'text-white':'text-black'}`}>
            <div className="h-48 bg-gradient-to-b from-blue-600 to-transparent relative">
                <button onClick={()=>navigate(-1)} className="absolute top-16 left-6 p-3 bg-black/20 backdrop-blur rounded-full text-white"><ChevronLeft/></button>
            </div>
            <div className="px-6 -mt-16 relative z-10">
                <div className="w-32 h-32 rounded-full border-4 border-[var(--bg-main)] shadow-2xl overflow-hidden bg-gray-200">
                    <img src={author.avatar} className="w-full h-full object-cover"/>
                </div>
                <h1 className="text-3xl font-black mt-4">{author.name}</h1>
                <p className="opacity-50">@{author.handle}</p>
                <div className="mt-6 glass-card p-6 text-sm opacity-80">{author.bio}</div>
                <div className="mt-8 space-y-4">
                    {news.map(n=>(<div key={n.id} className="glass-card p-5"><p className="text-sm">{n.text}</p></div>))}
                </div>
            </div>
        </div>
    );
};

const NavBtn = ({to, icon, active, theme}) => {
    const navigate = useNavigate();
    return (
        <button onClick={()=>navigate(to)} className={`p-4 h-16 w-16 flex items-center justify-center rounded-2xl transition-all duration-300 ${active ? (theme==='dark'?'bg-white text-black shadow-lg':'bg-black text-white shadow-lg') : 'text-gray-400 hover:text-[var(--text-primary)]'}`}>
            {icon}
        </button>
    );
}

export default App;
