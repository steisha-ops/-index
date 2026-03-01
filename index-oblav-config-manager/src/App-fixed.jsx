import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { Monitor, RefreshCw, Edit, Heart, Layout, Globe, BarChart3, Map as MapIcon, Bell, FileCode } from 'lucide-react';
import IntroVideo from './components/IntroVideo';
import Tma from './components/Tma';

export default function ConfigManager() {
    const [auth, setAuth] = useState(true);
    const [showIntro, setShowIntro] = useState(true);
    
    if (!auth) return null;
    
    return (
        <div className="h-screen w-full bg-black flex items-center justify-center p-4 text-white font-sans">
            {showIntro && <IntroVideo onComplete={() => setShowIntro(false)} />}
            {!showIntro && <ConfigWindow onLogout={() => setAuth(false)} />}
        </div>
    );
}

const ConfigWindow = ({ onLogout }) => {
    const [tab, setTab] = useState('tma');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // Основные данные
    const [regions, setRegions] = useState([]);
    const [buttons, setButtons] = useState([]);
    const [popups, setPopups] = useState([]);
    const [pages, setPages] = useState([]);
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        refresh();
    }, []);

    const showMessage = (msg, isError = false) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    const refresh = async () => {
        try {
            setLoading(true);
            
            // Загружаем все данные параллельно
            const [rList, btnsList, popupsList, pagesList, markersList] = await Promise.all([
                api.getRegions().catch(() => []),
                api.getButtons().catch(() => []),
                api.getPopups().catch(() => []),
                api.getPages().catch(() => []),
                api.getMarkers().catch(() => [])
            ]);
            
            if (Array.isArray(rList)) setRegions(rList);
            if (Array.isArray(btnsList)) setButtons(btnsList);
            if (Array.isArray(popupsList)) setPopups(popupsList);
            if (Array.isArray(pagesList)) setPages(pagesList);
            if (Array.isArray(markersList)) setMarkers(markersList);
            
            showMessage('✅ Данные загружены');
        } catch (e) {
            console.error('❌ Ошибка загрузки:', e);
            showMessage('❌ Ошибка загрузки: ' + (e?.message || 'неизвестная ошибка'), true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-7xl h-[90vh] bg-[#111] border border-[#333] rounded-xl flex flex-col shadow-2xl overflow-hidden">
            {/* Сообщение */}
            {message && (
                <div className={`px-6 py-3 text-sm font-bold border-b border-[#333] ${
                    message.startsWith('✅') 
                        ? 'bg-green-900/30 text-green-300 border-green-500/30' 
                        : 'bg-red-900/30 text-red-300 border-red-500/30'
                }`}>
                    {message}
                </div>
            )}
            
            {/* Заголовок */}
            <div className="h-16 bg-[#1a1a1a] border-b border-[#333] flex items-center px-6 justify-between flex-shrink-0">
                <div className="font-bold text-gray-200 text-lg flex items-center gap-2">
                    <Monitor className="text-blue-500" size={24} /> 
                    Config Manager
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={refresh} 
                        disabled={loading} 
                        className="bg-blue-600/30 text-blue-400 px-4 py-2 rounded border border-blue-500/50 hover:bg-blue-600/50 text-sm font-bold transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className="inline mr-1" /> Обновить
                    </button>
                    <button 
                        onClick={onLogout} 
                        className="bg-red-600/30 text-red-400 px-4 py-2 rounded border border-red-500/50 hover:bg-red-600/50 text-sm font-bold transition"
                    >
                        Выход
                    </button>
                </div>
            </div>

            {/* Основной контент */}
            <div className="flex flex-1 overflow-hidden">
                {/* Боковое меню */}
                <div className="w-56 bg-[#161616] border-r border-[#333] p-4 flex flex-col gap-2 overflow-y-auto">
                    <TabBtn icon={Edit} label="ТМА" active={tab === 'tma'} onClick={() => setTab('tma')} />
                    <TabBtn icon={Heart} label="События" active={tab === 'conscience'} onClick={() => setTab('conscience')} />
                    <TabBtn icon={Layout} label="Контент" active={tab === 'content'} onClick={() => setTab('content')} />
                    <TabBtn icon={Globe} label="Города" active={tab === 'regions'} onClick={() => setTab('regions')} />
                    <TabBtn icon={BarChart3} label="График" active={tab === 'graph'} onClick={() => setTab('graph')} />
                    <TabBtn icon={MapIcon} label="Карта" active={tab === 'map'} onClick={() => setTab('map')} />
                    <TabBtn icon={Bell} label="Push" active={tab === 'notify'} onClick={() => setTab('notify')} />
                    <TabBtn icon={FileCode} label="Pages" active={tab === 'pages'} onClick={() => setTab('pages')} />
                </div>

                {/* Контент табов */}
                <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin text-blue-500 mb-4">⏳</div>
                                <p className="text-gray-400">Загрузка...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {tab === 'tma' && <Tma />}
                            {tab === 'conscience' && <div className="text-gray-400 text-center py-12">События (в разработке)</div>}
                            {tab === 'content' && <div className="text-gray-400 text-center py-12">Контент (в разработке)</div>}
                            {tab === 'regions' && <div className="text-gray-400 text-center py-12">Регионы: {regions.length} найдено</div>}
                            {tab === 'graph' && <div className="text-gray-400 text-center py-12">График (в разработке)</div>}
                            {tab === 'map' && <div className="text-gray-400 text-center py-12">Карта (в разработке)</div>}
                            {tab === 'notify' && <div className="text-gray-400 text-center py-12">Push уведомления (в разработке)</div>}
                            {tab === 'pages' && <div className="text-gray-400 text-center py-12">Страницы: {pages.length} найдено</div>}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const TabBtn = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition ${
            active 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-[#222] hover:text-white'
        }`}
    >
        <Icon size={20} /> {label}
    </button>
);
