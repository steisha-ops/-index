import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { AlertTriangle, Shield, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';
import TutorialOverlay from '../components/TutorialOverlay';
import { tutorialData } from '../lib/tutorialData';

// Утилита для дебаунса
const debounce = (func, delay) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
};

// ПРОИЗВОДИТЕЛЬНОСТЬ
const aggregateData = (data, maxPoints = 60) => {
    if (data.length <= maxPoints) return data;
    
    const step = Math.ceil(data.length / maxPoints);
    const aggregated = [];
    
    for (let i = 0; i < data.length; i += step) {
        const chunk = data.slice(i, i + step);
        const avgValue = chunk.reduce((sum, item) => sum + (Number(item.value) || 0), 0) / chunk.length;
        aggregated.push({
            ...chunk[Math.floor(chunk.length / 2)],
            value: Number(avgValue.toFixed(2))
        });
    }
    
    return aggregated;
};

// Utility для вибраций
const haptic = {
    light: () => navigator.vibrate && navigator.vibrate(10),
    medium: () => navigator.vibrate && navigator.vibrate(20),
    strong: () => navigator.vibrate && navigator.vibrate([30, 20, 30]),
    pattern: (pattern) => navigator.vibrate && navigator.vibrate(pattern),
};

// ЫSkeleton Loading  
const SkeletonLoader = memo(({ isBgDark }) => (
    <div className={`min-h-screen pt-16 pb-32 px-3 md:px-4 flex flex-col ${isBgDark ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
        {/* Title skeleton */}
        <motion.div 
            animate={{opacity: [0.5, 0.8, 0.5]}} 
            transition={{duration: 1.5, repeat: Infinity}}
            className="mb-8"
        >
            <div className={`h-8 md:h-12 rounded-2xl mb-2 ${isBgDark ? 'bg-white/10' : 'bg-white/40'}`}/>
            <div className={`h-4 md:h-6 rounded-2xl w-2/3 ${isBgDark ? 'bg-white/10' : 'bg-white/40'}`}/>
        </motion.div>

        {/* Risk card skeleton */}
        <motion.div 
            animate={{opacity: [0.5, 0.8, 0.5]}} 
            transition={{duration: 1.5, repeat: Infinity, delay: 0.1}}
            className={`rounded-[32px] p-6 mb-8 h-40 md:h-48 ${isBgDark ? 'bg-white/5' : 'bg-white/40'}`}
        />

        {/* Buttons skeleton */}
        <motion.div 
            animate={{opacity: [0.5, 0.8, 0.5]}} 
            transition={{duration: 1.5, repeat: Infinity, delay: 0.2}}
        >
            <div className="flex gap-2 mb-8">
                {[1,2,3,4].map(i => <div key={i} className={`flex-1 h-10 md:h-12 rounded-xl ${isBgDark ? 'bg-white/10' : 'bg-white/40'}`}/>)}
            </div>
        </motion.div>

        {/* Chart skeleton */}
        <motion.div 
            animate={{opacity: [0.5, 0.8, 0.5]}} 
            transition={{duration: 1.5, repeat: Infinity, delay: 0.3}}
            className={`rounded-[32px] mb-8 h-64 md:h-96 ${isBgDark ? 'bg-white/5' : 'bg-white/40'}`}
        />

        {/* Forecast skeleton */}
        <motion.div 
            animate={{opacity: [0.5, 0.8, 0.5]}} 
            transition={{duration: 1.5, repeat: Infinity, delay: 0.4}}
            className={`rounded-[32px] p-6 h-48 md:h-64 ${isBgDark ? 'bg-white/5' : 'bg-white/40'}`}
        />
    </div>
));
SkeletonLoader.displayName = 'SkeletonLoader';

// Кэширование результатов
let cachedChartData = null;
let cachedForecastData = null;

// Мемоированный компонент для карточки риска с ВИБРАЦИЯМИ и оптимизацией
const RiskCard = memo(({ riskLevel, lastVal, isBgDark }) => (
    <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        transition={{delay:0.1}}
        onMouseEnter={() => haptic.light()}
        onClick={() => haptic.strong()}
        className={`relative mb-8 rounded-[32px] p-6 md:p-8 backdrop-blur-2xl border cursor-pointer active:scale-95 transition-transform ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'} ${riskLevel.glow} overflow-hidden`}
    >
        <div className={`absolute -inset-1 rounded-[32px] bg-gradient-to-br ${riskLevel.color} opacity-20 blur-3xl -z-10`}></div>
        <div className="flex items-end justify-between relative z-10">
            <div>
                <p className={`text-xs md:text-sm font-bold uppercase opacity-60 mb-2 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Текущий риск-индекс</p>
                <motion.p 
                    key={lastVal}
                    initial={{scale:1.2, opacity:0}}
                    animate={{scale:1, opacity:1}}
                    transition={{duration: 0.4}}
                    className="text-4xl md:text-6xl font-black font-mono tracking-tighter mb-3"
                >
                    {lastVal}
                </motion.p>
                <div className={`inline-block px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-bold ${riskLevel.color} bg-gradient-to-r text-white shadow-lg`}>
                    {riskLevel.label}
                </div>
            </div>
            <motion.div 
                animate={{rotate: [0, 10, -10, 0]}}
                transition={{duration: 3, repeat: Infinity}}
                className={`w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${riskLevel.color} p-px shadow-2xl flex-shrink-0`}
            >
                <div className={`w-full h-full rounded-2xl ${isBgDark ? 'bg-black' : 'bg-white'} flex items-center justify-center`}>
                    <motion.div
                        animate={{scale: [1, 1.1, 1]}}
                        transition={{duration: 2, repeat: Infinity}}
                    >
                        <Zap size={40} className={`${riskLevel.textColor} md:w-14 md:h-14`}/>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    </motion.div>
), (prevProps, nextProps) => {
    return prevProps.lastVal === nextProps.lastVal && 
           prevProps.isBgDark === nextProps.isBgDark &&
           prevProps.riskLevel.label === nextProps.riskLevel.label;
});
RiskCard.displayName = 'RiskCard';

// Мемоированный компонент для кнопок фреймов
const TimeframeButtons = memo(({ timeframe, onChange, isBgDark }) => (
    <motion.div 
        initial={{opacity:0, y:10}}
        animate={{opacity:1, y:0}}
        transition={{delay:0.15}}
        className={`flex gap-2 md:gap-3 mb-8 p-2.5 md:p-3 rounded-2xl md:rounded-3xl backdrop-blur-xl border ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'} overflow-x-auto`}
    >
        {[7, 30, 90, 180].map(d => (
            <motion.button 
                key={d}
                whileTap={{scale:0.92}}
                onMouseDown={() => haptic.light()}
                onClick={() => { haptic.medium(); onChange(d); }}
                className={`py-3 md:py-3.5 px-4 md:px-6 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer active:scale-95 whitespace-nowrap flex-shrink-0 ${
                    timeframe === d 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 font-black'
                        : `${isBgDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-black'} hover:bg-white/10`
                }`}
            >
                {d === 180 ? 'ВСЕ' : `${d} дн.`}
            </motion.button>
        ))}
    </motion.div>
), (prevProps, nextProps) => {
    return prevProps.timeframe === nextProps.timeframe && 
           prevProps.isBgDark === nextProps.isBgDark;
});
TimeframeButtons.displayName = 'TimeframeButtons';

// Красивые иконки для дней недели
const DAY_ICONS = {
    'ПН': 'Sunrise', 'ВТ': 'Zap', 'СР': 'Cloud', 'ЧТ': 'CloudRain', 
    'ПТ': 'Trophy', 'СБ': 'Moon', 'ВС': 'Coffee'
};

// Мемоированный компонент для карточки прогноза с ВИБРАЦИЯМИ и оптимизацией
const ForecastCard = memo(({ item, index, getRiskColor }) => {
    const colors = useMemo(() => getRiskColor(item.risk), [item.risk, getRiskColor]);
    
    return (
        <motion.div
            initial={{opacity:0, x:-30}}
            animate={{opacity:1, x:0}}
            transition={{delay: 0.35 + index*0.05}}
            whileHover={{scale:1.02, translateY:-2}}
            whileTap={{scale: 0.98}}
            onMouseEnter={() => haptic.light()}
            onClick={() => haptic.medium()}
            className={`rounded-2xl p-3 md:p-4 backdrop-blur-xl border bg-gradient-to-br cursor-pointer active:scale-95 transition-all ${colors.bg} ${colors.border} ${colors.shadow}`}
        >
            <div className="flex flex-col md:flex-col items-center gap-2 md:gap-2 md:text-center">
                {/* День недели с иконкой */}
                <div className="text-2xl md:text-2xl">
                    {item.risk >= 8 ? '⚠️' : item.risk >= 5 ? '📊' : '✅'}
                </div>
                <p className="text-xs md:text-sm font-black">{item.day}</p>
                <p className="text-[10px] md:text-xs opacity-60">{item.label}</p>
                
                {/* Риск бар с анимацией */}
                <div className="w-full space-y-1 md:space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className={`text-[9px] md:text-xs font-bold ${colors.textClass}`}>РИСК</span>
                        <span className={`text-sm md:text-base font-black font-mono ${colors.textClass}`}>{item.risk}%</span>
                    </div>
                    <div className={`h-4 md:h-5 rounded-full relative overflow-hidden bg-white/10 border border-white/20`}>
                        <motion.div
                            initial={{width:0}}
                            animate={{width:`${item.risk}%`}}
                            transition={{delay: 0.4 + index*0.08, duration:0.8, ease:'easeOut'}}
                            className={`h-full rounded-full ${colors.bar} shadow-lg`}
                            style={{filter: `drop-shadow(0 0 12px ${colors.bar === 'bg-red-500' ? 'rgba(239,68,68,0.7)' : colors.bar === 'bg-orange-500' ? 'rgba(249,115,22,0.7)' : colors.bar === 'bg-yellow-500' ? 'rgba(234,179,8,0.5)' : 'rgba(34,197,94,0.5)'})`}}
                        ></motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    return prevProps.item.day === nextProps.item.day && 
           prevProps.item.risk === nextProps.item.risk &&
           prevProps.index === nextProps.index;
});
ForecastCard.displayName = 'ForecastCard';

// ОПРОИЗВОДИТЕЛЬНОСТЬ
const ChartComponent = memo(({ viewData, isBgDark }) => {
    const canvasRef = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    
    // ПРОИЗВОДИТЕЛЬНОСТЬ
    const aggregatedData = useMemo(() => 
        aggregateData(viewData, typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 60),
        [viewData]
    );
    
    // Обработка сенсорных жестов
    const handleTouchStart = (e) => {
        setTouchStart(e.touches?.[0]?.clientX);
    };
    
    return (
        <motion.div 
            ref={canvasRef}
            onTouchStart={handleTouchStart}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            transition={{delay: 0.2}}
            className={`rounded-[36px] backdrop-blur-3xl border shadow-2xl relative overflow-hidden mb-8 ${isBgDark ? 'bg-gradient-to-br from-white/8 via-white/5 to-white/3 border-white/15' : 'bg-gradient-to-br from-white/70 via-white/60 to-white/50 border-white/40'}`}
        >
            {/* Красивый gradient Иblur background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none rounded-[36px]">
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl bg-gradient-to-l from-blue-500 to-cyan-400 opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 opacity-20"></div>
            </div>

            {/* Chart content */}
            <div className="relative z-10 p-4 md:p-8">
                {/* Title */}
                <div className="mb-6">
                    <h3 className={`text-xl md:text-3xl font-black mb-2 ${isBgDark ? 'text-white' : 'text-black'}`}>Индекс Риска</h3>
                    <p className={`text-xs md:text-base ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Изменение за выбранный период</p>
                </div>

                {/* Big Chart */}
                <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 320 : 480}>
                    <AreaChart data={aggregatedData} margin={{top: 10, right: 15, bottom: 30, left: -10}}>
                        <defs>
                            {/* Beautiful gradient */}
                            <linearGradient id="gradientFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.6}/>
                                <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.3}/>
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05}/>
                            </linearGradient>
                            {/* Glow filter */}
                            <filter id="chartGlow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        
                        {/* Clean grid */}
                        <CartesianGrid 
                            strokeDasharray="0" 
                            stroke={isBgDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} 
                            vertical={false}
                        />
                        
                        {/* X Axis - красивые даты */}
                        <XAxis 
                            dataKey="date" 
                            tick={{fill: isBgDark ? '#9CA3AF' : '#6B7280', fontSize: window.innerWidth < 768 ? 11 : 12, fontWeight: 500}}
                            tickLine={false}
                            axisLine={false}
                            angle={window.innerWidth < 768 ? -45 : 0}
                            textAnchor={window.innerWidth < 768 ? 'end' : 'middle'}
                            height={window.innerWidth < 768 ? 60 : 40}
                            formatter={(date) => {
                                try {
                                    const d = new Date(date);
                                    return window.innerWidth < 768 
                                        ? d.toLocaleDateString('ru-RU', {month: 'numeric', day: 'numeric'})
                                        : d.toLocaleDateString('ru-RU', {month: 'short', day: 'numeric'});
                                } catch(e) {
                                    return date;
                                }
                            }}
                        />
                        
                        {/* Y Axis - с красивыми делениями */}
                        <YAxis 
                            tick={{fill: isBgDark ? '#9CA3AF' : '#6B7280', fontSize: window.innerWidth < 768 ? 11 : 12, fontWeight: 500}}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 10]}
                            tickFormatter={(value) => value.toFixed(0)}
                            width={window.innerWidth < 768 ? 30 : 40}
                        />
                        
                        {/* Beautiful Tooltip - как в Telegram Wallet */}
                        <Tooltip 
                            contentStyle={{
                                background: isBgDark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.95)',
                                border: `1.5px solid #3B82F6`,
                                borderRadius: '20px',
                                boxShadow: isBgDark 
                                    ? '0 20px 60px rgba(59,130,246,0.4), 0 0 40px rgba(59,130,246,0.2)' 
                                    : '0 20px 60px rgba(59,130,246,0.25), 0 0 40px rgba(59,130,246,0.15)',
                                backdropFilter: 'blur(30px)',
                                padding: '14px 18px',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif'
                            }}
                            itemStyle={{color: '#3B82F6', fontWeight: '600', fontSize: '13px'}}
                            labelStyle={{color: isBgDark ? '#64b5f6' : '#2196f3', fontSize: '12px', fontWeight: '650'}}
                            formatter={(value) => [value.toFixed(2), '📊']}
                            labelFormatter={(label) => {
                                try {
                                    return new Date(label).toLocaleDateString('ru-RU', {weekday: 'short', month: 'short', day: 'numeric'});
                                } catch(e) {
                                    return label;
                                }
                            }}
                            cursor={{stroke: '#3B82F6', strokeWidth: 1.5, opacity: 0.5}}
                        />
                        
                        {/* Reference Lines */}
                        <ReferenceLine 
                            y={4} 
                            stroke="#eab308" 
                            strokeDasharray="8 4" 
                            opacity={0.25}
                        />
                        <ReferenceLine 
                            y={7} 
                            stroke="#f97316" 
                            strokeDasharray="8 4" 
                            opacity={0.25}
                        />
                        
                        {/* Main Area Line */}
                        <Area 
                            type="natural" 
                            dataKey="value" 
                            stroke="#3B82F6" 
                            strokeWidth={3.5}
                            fill="url(#gradientFill)" 
                            animationDuration={300}
                            isAnimationActive={true}
                            filter="url(#chartGlow)"
                            dot={(props) => {
                                const {cx, cy, value} = props;
                                return (
                                    <circle 
                                        cx={cx} 
                                        cy={cy} 
                                        r={2.5} 
                                        fill="#3B82F6" 
                                        stroke="#fff" 
                                        strokeWidth={2}
                                        opacity={0.7}
                                    />
                                );
                            }}
                            activeDot={{
                                r: 5.5,
                                fill: '#3B82F6',
                                stroke: '#fff',
                                strokeWidth: 2.5,
                                filter: 'drop-shadow(0 0 15px rgba(59,130,246,0.6))'
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Info footer */}
                <motion.div 
                    initial={{opacity: 0, y: 10}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.4}}
                    className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${isBgDark ? 'bg-white/8 border border-white/10' : 'bg-black/5 border border-black/10'}`}
                >
                    <div className={`w-2.5 h-2.5 rounded-full ${isBgDark ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                    <span className={`text-sm font-medium ${isBgDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Всего точек: <span className="font-bold">{aggregatedData.length}</span> • 
                        Обновлено: <span className="font-bold">{new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</span>
                    </span>
                </motion.div>
            </div>
        </motion.div>
    );
}, (prevProps, nextProps) => {
    return prevProps.isBgDark === nextProps.isBgDark && 
           prevProps.viewData.length === nextProps.viewData.length &&
           prevProps.viewData[prevProps.viewData.length - 1]?.value === nextProps.viewData[nextProps.viewData.length - 1]?.value;
});
ChartComponent.displayName = 'ChartComponent';

const ChartPage = ({ theme = 'dark' }) => {
    const [fullData, setFullData] = useState([]);
    const [viewData, setViewData] = useState([]);
    const [timeframe, setTimeframe] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [forecastData, setForecastData] = useState([
        { day: 'ПН', risk: 45, label: 'Низкий' },
        { day: 'ВТ', risk: 62, label: 'Средний' },
        { day: 'СР', risk: 78, label: 'Высокий' },
        { day: 'ЧТ', risk: 85, label: 'Критический' },
        { day: 'ПТ', risk: 55, label: 'Средний' },
        { day: 'СБ', risk: 30, label: 'Низкий' },
        { day: 'ВС', risk: 20, label: 'Минимальный' },
    ]);

    // Мемоизированная версия filterData с дебаунсомаавыав
    const filterData = useCallback((data, days) => {
        setTimeframe(days);
        if(!data.length) return;
        setViewData(days === 180 ? data : data.slice(-days));
    }, []);

    // Оптимизированная загрузка данных
    useEffect(() => {
        const regionId = localStorage.getItem('user_region_id') || 1;
        
        // Загружаем данные параллельно через оптимизированный api с кэшем
        Promise.all([
            api.getRegionData(regionId),
            api.prefetch('/api/forecasts', 'short')
        ])
        .then(([regionData, forecasts]) => {
            if(regionData?.history) {
                // Преобразуем данные и убеждаемся, что значения это числа
                const processedData = (Array.isArray(regionData.history) ? regionData.history : [])
                    .map(item => ({
                        ...item,
                        value: Number(item.value) || 0,
                        date: item.date || new Date().toISOString()
                    }))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                
                setFullData(processedData);
                filterData(processedData, 30);
            }
            if (Array.isArray(forecasts) && forecasts.length > 0) {
                setForecastData(forecasts);
            }
        })
        .catch(e => console.error("Error loading chart data:", e))
        .finally(() => setIsLoading(false));
    }, [filterData]);

    const isBgDark = theme === 'dark';

    // Оптимизированные вычисления через useMemo
    const lastVal = useMemo(() => {
        return viewData.length ? Number(viewData[viewData.length - 1].value) || 0 : 0;
    }, [viewData]);

    const riskLevel = useMemo(() => 
        lastVal >= 9 ? { label: '🔴 КРИТИЧЕСКИЙ', color: 'from-red-600 to-red-700', glow: 'shadow-2xl shadow-red-500/50', textColor: 'text-red-500' } 
        : lastVal >= 7 ? { label: '🟠 ВЫСОКИЙ', color: 'from-orange-600 to-orange-700', glow: 'shadow-2xl shadow-orange-500/50', textColor: 'text-orange-500' }
        : lastVal >= 4 ? { label: '🟡 СРЕДНИЙ', color: 'from-yellow-600 to-yellow-700', glow: 'shadow-2xl shadow-yellow-500/30', textColor: 'text-yellow-500' }
        : { label: '🟢 НИЗКИЙ', color: 'from-green-600 to-green-700', glow: 'shadow-2xl shadow-green-500/30', textColor: 'text-green-500' }
    , [lastVal]);

    const getRiskColor = useCallback((risk) => {
        if (risk >= 70) return { 
            bg: 'from-red-500/20 to-red-600/10', 
            border: 'border-red-500/30', 
            shadow: 'shadow-lg shadow-red-500/30', 
            bar: 'bg-red-500',
            textClass: 'text-red-400'
        };
        if (risk >= 50) return { 
            bg: 'from-orange-500/20 to-orange-600/10', 
            border: 'border-orange-500/30', 
            shadow: 'shadow-lg shadow-orange-500/30', 
            bar: 'bg-orange-500',
            textClass: 'text-orange-400'
        };
        if (risk >= 30) return { 
            bg: 'from-yellow-500/20 to-yellow-600/10', 
            border: 'border-yellow-500/30', 
            shadow: 'shadow-lg shadow-yellow-500/20', 
            bar: 'bg-yellow-500',
            textClass: 'text-yellow-400'
        };
        return { 
            bg: 'from-green-500/20 to-green-600/10', 
            border: 'border-green-500/30', 
            shadow: 'shadow-lg shadow-green-500/20', 
            bar: 'bg-green-500',
            textClass: 'text-green-400'
        };
    }, []);

    if (isLoading) {
        return <SkeletonLoader isBgDark={isBgDark} />;
    }

    return (
        <motion.div 
            initial={{opacity:0}} 
            animate={{opacity:1}} 
            className={`min-h-screen pt-14 sm:pt-16 pb-32 px-3 sm:px-4 md:px-5 max-w-5xl mx-auto flex flex-col transition-colors duration-300 ${isBgDark ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}
        >
            <TutorialOverlay pageId="chart" tutorials={tutorialData.chart} theme={theme} />
            
            <motion.div 
                initial={{opacity:0, y:-20}} 
                animate={{opacity:1, y:0}} 
                className="mb-8 md:mb-12"
            >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2 md:mb-3">
                    Динамика Риска
                </h2>
                <p className={`text-sm sm:text-base md:text-lg font-medium ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Индекс риска на выбранный период • Обновляется в реальном времени
                </p>
            </motion.div>

            <RiskCard riskLevel={riskLevel} lastVal={lastVal} isBgDark={isBgDark} />
            <TimeframeButtons timeframe={timeframe} onChange={(days) => filterData(fullData, days)} isBgDark={isBgDark} />

            <ChartComponent viewData={viewData} isBgDark={isBgDark} />

            {/* FORECAST SECTION */}
            <motion.div
                initial={{opacity:0, y:20}}
                animate={{opacity:1, y:0}}
                transition={{delay:0.3}}
                className={`rounded-[32px] md:rounded-[40px] p-5 md:p-10 backdrop-blur-3xl border shadow-2xl relative overflow-hidden ${isBgDark ? 'bg-gradient-to-br from-white/8 via-white/5 to-white/3 border-white/15' : 'bg-gradient-to-br from-white/70 via-white/60 to-white/50 border-white/40'}`}
            >
                {/* Background gradient */}
                <div className="absolute inset-0 opacity-20 pointer-events-none rounded-[32px]">
                    <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl bg-gradient-to-l from-red-500 to-orange-400 opacity-40"></div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 md:gap-5 mb-6 md:mb-8">
                        <motion.div 
                            whileHover={{scale:1.05}}
                            className="p-2.5 md:p-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/40 flex-shrink-0"
                        >
                            <AlertTriangle size={24} className="text-white md:w-7 md:h-7"/>
                        </motion.div>
                        <div>
                            <h3 className="text-xl sm:text-2xl md:text-3xl font-black">Прогноз</h3>
                            <p className={`text-xs sm:text-sm mt-0.5 md:mt-1 font-medium ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Прогноз на неделю</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 md:gap-3 mb-6 md:mb-8">
                        {forecastData.map((item, i) => <ForecastCard key={item.day} item={item} index={i} getRiskColor={getRiskColor} />)}
                    </div>

                    <motion.div
                        initial={{opacity:0}}
                        animate={{opacity:1}}
                        transition={{delay:0.8}}
                        className={`p-4 md:p-6 rounded-2xl md:rounded-3xl flex gap-3 md:gap-4 bg-gradient-to-br border backdrop-blur-xl ${isBgDark ? 'from-yellow-900/20 to-orange-900/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20' : 'from-yellow-400/20 to-orange-400/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20'}`}
                    >
                        <Shield size={20} className="text-yellow-500 flex-shrink-0 mt-0.5 md:mt-1 drop-shadow-lg md:w-6 md:h-6"/>
                        <div>
                            <p className="text-sm md:text-base font-bold">Рекомендация</p>
                            <p className="text-xs md:text-sm opacity-80 mt-2">В дни высокого риска избегайте скопления людей и оставайтесь дома. Соблюдайте правила безопасности.</p>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ChartPage;
