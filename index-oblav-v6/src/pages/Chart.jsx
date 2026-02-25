import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { AlertTriangle, Shield, Activity, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

// Utility для вибраций
const haptic = {
    light: () => navigator.vibrate && navigator.vibrate(10),
    medium: () => navigator.vibrate && navigator.vibrate(20),
    strong: () => navigator.vibrate && navigator.vibrate([30, 20, 30]),
    pattern: (pattern) => navigator.vibrate && navigator.vibrate(pattern),
};

// Skeleton Loading компонент для быстрого отображения
const SkeletonLoader = memo(({ isBgDark }) => (
    <div className={`min-h-screen pt-16 pb-32 px-4 flex flex-col ${isBgDark ? 'bg-black' : 'bg-[#f2f2f7]'}`}>
        {/* Title skeleton */}
        <motion.div animate={{opacity: [0.5, 0.8, 0.5]}} transition={{duration: 1.5, repeat: Infinity}}>
            <div className={`h-12 rounded-2xl mb-2 ${isBgDark ? 'bg-white/10' : 'bg-white/40'}`}/>
            <div className={`h-6 rounded-2xl w-2/3 mb-8 ${isBgDark ? 'bg-white/10' : 'bg-white/40'}`}/>
        </motion.div>

        {/* Risk card skeleton */}
        <motion.div animate={{opacity: [0.5, 0.8, 0.5]}} transition={{duration: 1.5, repeat: Infinity, delay: 0.1}}>
            <div className={`rounded-[32px] p-8 mb-8 h-48 ${isBgDark ? 'bg-white/5' : 'bg-white/40'}`}/>
        </motion.div>

        {/* Buttons skeleton */}
        <motion.div animate={{opacity: [0.5, 0.8, 0.5]}} transition={{duration: 1.5, repeat: Infinity, delay: 0.2}}>
            <div className="flex gap-3 mb-8">
                {[1,2,3,4].map(i => <div key={i} className={`flex-1 h-12 rounded-xl ${isBgDark ? 'bg-white/10' : 'bg-white/40'}`}/>)}
            </div>
        </motion.div>

        {/* Chart skeleton */}
        <motion.div animate={{opacity: [0.5, 0.8, 0.5]}} transition={{duration: 1.5, repeat: Infinity, delay: 0.3}}>
            <div className={`rounded-[32px] mb-8 h-96 ${isBgDark ? 'bg-white/5' : 'bg-white/40'}`}/>
        </motion.div>

        {/* Forecast skeleton */}
        <motion.div animate={{opacity: [0.5, 0.8, 0.5]}} transition={{duration: 1.5, repeat: Infinity, delay: 0.4}}>
            <div className={`rounded-[32px] p-6 h-64 ${isBgDark ? 'bg-white/5' : 'bg-white/40'}`}/>
        </motion.div>
    </div>
));
SkeletonLoader.displayName = 'SkeletonLoader';

// Кэширование результатов
let cachedChartData = null;
let cachedForecastData = null;

// Мемоированный компонент для карточки риска с ВИБРАЦИЯМИ
const RiskCard = memo(({ riskLevel, lastVal, isBgDark }) => (
    <motion.div
        initial={{opacity:0, y:20}}
        animate={{opacity:1, y:0}}
        transition={{delay:0.1}}
        onMouseEnter={() => haptic.light()}
        onClick={() => haptic.strong()}
        className={`relative mb-8 rounded-[32px] p-8 backdrop-blur-2xl border cursor-pointer active:scale-95 transition-transform ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'} ${riskLevel.glow} overflow-hidden`}
    >
        <div className={`absolute -inset-1 rounded-[32px] bg-gradient-to-br ${riskLevel.color} opacity-20 blur-3xl -z-10`}></div>
        <div className="flex items-end justify-between relative z-10">
            <div>
                <p className={`text-sm font-bold uppercase opacity-60 mb-2 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Текущий риск-индекс</p>
                <motion.p 
                    key={lastVal}
                    initial={{scale:1.2, opacity:0}}
                    animate={{scale:1, opacity:1}}
                    transition={{duration: 0.4}}
                    className="text-6xl font-black font-mono tracking-tighter mb-3"
                >
                    {lastVal}
                </motion.p>
                <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${riskLevel.color} bg-gradient-to-r text-white shadow-lg`}>
                    {riskLevel.label}
                </div>
            </div>
            <motion.div 
                animate={{rotate: [0, 10, -10, 0]}}
                transition={{duration: 3, repeat: Infinity}}
                className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${riskLevel.color} p-px shadow-2xl`}
            >
                <div className={`w-full h-full rounded-2xl ${isBgDark ? 'bg-black' : 'bg-white'} flex items-center justify-center`}>
                    <motion.div
                        animate={{scale: [1, 1.1, 1]}}
                        transition={{duration: 2, repeat: Infinity}}
                    >
                        <Zap size={56} className={riskLevel.textColor}/>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    </motion.div>
));
RiskCard.displayName = 'RiskCard';

// Мемоированный компонент для кнопок фреймов
const TimeframeButtons = memo(({ timeframe, onChange, isBgDark }) => (
    <div className={`flex gap-3 mb-8 p-2 rounded-2xl backdrop-blur-xl border ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'}`}>
        {[7, 30, 90, 180].map(d => (
            <motion.button 
                key={d}
                whileTap={{scale:0.92}}
                onMouseDown={() => haptic.light()}
                onClick={() => { haptic.medium(); onChange(d); }}
                className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all duration-300 cursor-pointer active:scale-95 ${
                    timeframe === d 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : `${isBgDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-black'} hover:bg-white/10`
                }`}
            >
                {d === 180 ? 'ALL' : `${d}D`}
            </motion.button>
        ))}
    </div>
));
TimeframeButtons.displayName = 'TimeframeButtons';

// Красивые дни недели с эмодзи
const DAY_EMOJIS = {
    'ПН': '🌅', 'ВТ': '⚡', 'СР': '🌤️', 'ЧТ': '⛈️', 
    'ПТ': '🎉', 'СБ': '🌙', 'ВС': '😴'
};

// Мемоированный компонент для карточки прогноза с ВИБРАЦИЯМИ
const ForecastCard = memo(({ item, index, getRiskColor }) => {
    const colors = getRiskColor(item.risk);
    
    return (
        <motion.div
            key={item.day}
            initial={{opacity:0, x:-30}}
            animate={{opacity:1, x:0}}
            transition={{delay: 0.35 + index*0.06}}
            whileHover={{scale:1.02, translateY:-2}}
            onMouseEnter={() => haptic.light()}
            onClick={() => haptic.medium()}
            className={`rounded-2xl p-4 backdrop-blur-xl border bg-gradient-to-br cursor-pointer active:scale-95 ${colors.bg} ${colors.border} ${colors.shadow} transition-all`}
        >
            <div className="flex items-center gap-4">
                {/* День недели с красивым эмодзи */}
                <div className="text-center min-w-[70px] p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <p className="text-3xl mb-1">{DAY_EMOJIS[item.day]}</p>
                    <p className="text-sm font-black">{item.day}</p>
                    <p className="text-xs opacity-60 mt-1">{item.label}</p>
                </div>
                
                {/* Риск бар с анимацией */}
                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${colors.textClass}`}>РИСК</span>
                        <span className={`text-lg font-black font-mono ${colors.textClass}`}>{item.risk}%</span>
                    </div>
                    <div className={`h-6 rounded-full relative overflow-hidden bg-white/10 border border-white/20`}>
                        <motion.div
                            initial={{width:0}}
                            animate={{width:`${item.risk}%`}}
                            transition={{delay: 0.4 + index*0.08, duration:1, ease:'easeOut'}}
                            className={`h-full rounded-full ${colors.bar} shadow-lg`}
                            style={{filter: `drop-shadow(0 0 12px ${colors.bar === 'bg-red-500' ? 'rgba(239,68,68,0.7)' : colors.bar === 'bg-orange-500' ? 'rgba(249,115,22,0.7)' : colors.bar === 'bg-yellow-500' ? 'rgba(234,179,8,0.5)' : 'rgba(34,197,94,0.5)'})`}}
                        ></motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
});
ForecastCard.displayName = 'ForecastCard';

// Оптимизированный граф компонент
const ChartComponent = memo(({ viewData, isBgDark }) => (
    <div className={`rounded-[32px] p-6 backdrop-blur-2xl border shadow-2xl shadow-blue-500/20 relative overflow-hidden mb-8 ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'}`}>
        <div className="absolute inset-0 opacity-40 pointer-events-none rounded-[32px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-30"></div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={viewData} margin={{top:20, right:30, bottom:60, left:60}}>
                <defs>
                    <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isBgDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} vertical={true}/>
                <XAxis 
                    dataKey="date" 
                    tick={{fill: isBgDark ? '#999' : '#666', fontSize: 12, fontWeight: 500}}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    formatter={(date) => {
                        try {
                            return new Date(date).toLocaleDateString('ru-RU', {month: 'short', day: 'numeric'});
                        } catch(e) {
                            return date;
                        }
                    }}
                    stroke={isBgDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                />
                <YAxis 
                    tick={{fill: isBgDark ? '#999' : '#666', fontSize: 12, fontWeight: 500}}
                    label={{ value: '📊 Индекс Риска', angle: -90, position: 'insideLeft', style: {fill: isBgDark ? '#ccc' : '#333'} }}
                    stroke={isBgDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    domain={[0, 10]}
                />
                <Tooltip 
                    contentStyle={{background: isBgDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.98)', border: `2px solid #3B82F6`, borderRadius: '20px', boxShadow: isBgDark ? '0 10px 40px rgba(59,130,246,0.3)' : '0 10px 40px rgba(59,130,246,0.2)', backdropFilter: 'blur(20px)', padding: '12px 16px'}}
                    itemStyle={{color: '#3B82F6', fontWeight: 'bold', fontSize: '14px'}}
                    labelStyle={{color: isBgDark ? '#64b5f6' : '#2196f3', fontSize: '13px', fontWeight: '700'}}
                    formatter={(value) => [value.toFixed(2), '📈 Значение']}
                    labelFormatter={(label) => {
                        try {
                            return `📅 ${new Date(label).toLocaleDateString('ru-RU', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}`;
                        } catch(e) {
                            return label;
                        }
                    }}
                />
                <Legend 
                    wrapperStyle={{paddingTop: '20px'}}
                    formatter={() => '🚀 Динамика Индекса Риска'}
                    iconType='line'
                />
                <ReferenceLine 
                    y={4} 
                    stroke="#eab308" 
                    strokeDasharray="5 5" 
                    label={{value: '⚠️ Средний', position: 'right', fill: '#eab308', fontSize: 12, fontWeight: 'bold'}}
                    opacity={0.3}
                />
                <ReferenceLine 
                    y={7} 
                    stroke="#f97316" 
                    strokeDasharray="5 5" 
                    label={{value: '🌪️ Высокий', position: 'right', fill: '#f97316', fontSize: 12, fontWeight: 'bold'}}
                    opacity={0.3}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    fill="url(#glowGradient)" 
                    animationDuration={600}
                    isAnimationActive={true}
                    filter="url(#glow)"
                    dot={{fill: '#3B82F6', r: 4, stroke: '#fff', strokeWidth: 2}}
                    activeDot={{r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2}}
                />
            </AreaChart>
        </ResponsiveContainer>

        <div className={`mt-6 p-4 rounded-2xl ${isBgDark ? 'bg-white/5 border border-white/10' : 'bg-white/60 border border-white/40'} flex items-center gap-3 text-sm`}>
            <Activity size={18} className="text-blue-500 flex-shrink-0"/>
            <span>{viewData.length} дней данных • Обновлено: {new Date().toLocaleTimeString('ru-RU')}</span>
        </div>
    </div>
));
ChartComponent.displayName = 'ChartComponent';

const ChartPage = ({ theme = 'dark' }) => {
    const [fullData, setFullData] = useState([]);
    const [viewData, setViewData] = useState([]);
    const [timeframe, setTimeframe] = useState(30);
    const [isLoading, setIsLoading] = useState(true);
    const [forecastData, setForecastData] = useState([
        { day: 'ПН', risk: 45, label: 'Низкий', icon: '✅' },
        { day: 'ВТ', risk: 62, label: 'Средний', icon: '⚠️' },
        { day: 'СР', risk: 78, label: 'Высокий', icon: '⛔' },
        { day: 'ЧТ', risk: 85, label: 'Критический', icon: '🔴' },
        { day: 'ПТ', risk: 55, label: 'Средний', icon: '⚠️' },
        { day: 'СБ', risk: 30, label: 'Низкий', icon: '✅' },
        { day: 'ВС', risk: 20, label: 'Минимальный', icon: '✅' },
    ]);

    useEffect(() => {
        const regionId = localStorage.getItem('user_region_id') || 1;
        
        // Загружаем данные параллельно через оптимизированный api с кэшем
        Promise.all([
            api.getRegionData(regionId),
            api.prefetch('/api/forecasts', 'short')
        ])
        .then(([regionData, forecasts]) => {
            if(regionData?.history) {
                setFullData(regionData.history);
                filterData(regionData.history, 30);
            }
            if (Array.isArray(forecasts) && forecasts.length > 0) {
                setForecastData(forecasts);
            }
        })
        .catch(e => console.error("Error loading chart data:", e))
        .finally(() => setIsLoading(false));
    }, []);

    const filterData = useCallback((data, days) => {
        setTimeframe(days);
        if(!data.length) return;
        setViewData(days === 180 ? data : data.slice(-days));
    }, []);

    // Оптимизированные вычисления через useMemo
    const lastVal = useMemo(() => viewData.length ? Number(viewData[viewData.length - 1].value) : 0, [viewData]);

    const isBgDark = theme === 'dark';

    const riskLevel = useMemo(() => 
        lastVal >= 9 ? { label: '🔴 КРИТИЧЕСКИЙ', color: 'from-red-600 to-red-700', glow: 'shadow-2xl shadow-red-500/50', textColor: 'text-red-500' } 
        : lastVal >= 7 ? { label: '🟠 ВЫСОКИЙ', color: 'from-orange-600 to-orange-700', glow: 'shadow-2xl shadow-orange-500/50', textColor: 'text-orange-500' }
        : lastVal >= 4 ? { label: '🟡 СРЕДНИЙ', color: 'from-yellow-600 to-yellow-700', glow: 'shadow-2xl shadow-yellow-500/30', textColor: 'text-yellow-500' }
        : { label: '🟢 НИЗКИЙ', color: 'from-green-600 to-green-700', glow: 'shadow-2xl shadow-green-500/30', textColor: 'text-green-500' }
    , [lastVal]);

    const getRiskColor = useCallback((risk) => 
        risk >= 70 ? { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', shadow: 'shadow-lg shadow-red-500/30', bar: 'bg-red-500' }
        : risk >= 50 ? { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', shadow: 'shadow-lg shadow-orange-500/30', bar: 'bg-orange-500' }
        : risk >= 30 ? { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', shadow: 'shadow-lg shadow-yellow-500/20', bar: 'bg-yellow-500' }
        : { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', shadow: 'shadow-lg shadow-green-500/20', bar: 'bg-green-500' }
    , []);

    if (isLoading) {
        return <SkeletonLoader isBgDark={isBgDark} />;
    }

    return (
        <div className={`min-h-screen pt-16 pb-32 px-4 flex flex-col transition-colors duration-500 font-sans ${isBgDark ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}>
            
            <motion.div 
                initial={{opacity:0, y:-20}} 
                animate={{opacity:1, y:0}} 
                className="mb-8"
                onClick={() => haptic.light()}
            >
                <motion.h2 
                    animate={{backgroundPosition: ['200% 0%', '0% 0%']}}
                    transition={{duration: 3, repeat: Infinity}}
                    className="text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
                >
                    📊 ДИНАМИКА РИСКА
                </motion.h2>
                <p className={`text-base font-semibold ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Индекс риска поведения гражданского населения | Обновляется в реальном времени ⚡</p>
            </motion.div>

            <RiskCard riskLevel={riskLevel} lastVal={lastVal} isBgDark={isBgDark} />
            <TimeframeButtons timeframe={timeframe} onChange={(days) => filterData(fullData, days)} isBgDark={isBgDark} />

            <motion.div 
                initial={{opacity:0, y:20}} 
                animate={{opacity:1, y:0}}
                transition={{delay:0.2}}
            >
                <ChartComponent viewData={viewData} isBgDark={isBgDark} />
            </motion.div>

            {/* FORECAST - OPTIMIZED */}
            <motion.div
                initial={{opacity:0, y:20}}
                animate={{opacity:1, y:0}}
                transition={{delay:0.3}}
                onClick={() => haptic.light()}
                className={`rounded-[32px] p-6 backdrop-blur-2xl border shadow-2xl shadow-red-500/20 relative cursor-pointer active:scale-95 transition-transform ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'}`}
            >
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-red-500/20 to-orange-500/10 opacity-30 blur-3xl -z-10"></div>

                <div className="flex items-center gap-4 mb-6">
                    <motion.div 
                        whileHover={{scale:1.05}}
                        onMouseDown={() => haptic.medium()}
                        className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/40 cursor-pointer"
                    >
                        <AlertTriangle size={28} className="text-white"/>
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-black">🎖️ ПРОГНОЗ ОБЛАВ</h3>
                        <p className={`text-xs mt-1 font-semibold ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>📅 Прогноз для гражданского населения на неделю</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                    {forecastData.map((item, i) => <ForecastCard key={item.day} item={item} index={i} getRiskColor={getRiskColor} />)}
                </div>

                <motion.div
                    initial={{opacity:0}}
                    animate={{opacity:1}}
                    transition={{delay:0.8}}
                    onMouseEnter={() => haptic.light()}
                    onClick={() => haptic.medium()}
                    className={`p-4 rounded-2xl flex gap-3 bg-gradient-to-br border backdrop-blur-xl cursor-pointer active:scale-95 transition-transform ${isBgDark ? 'from-yellow-900/20 to-orange-900/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20' : 'from-yellow-400/20 to-orange-400/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20'}`}
                >
                    <Shield size={20} className="text-yellow-500 flex-shrink-0 mt-0.5 drop-shadow-lg"/>
                    <div>
                        <p className="text-sm font-black">💡 Рекомендация</p>
                        <p className="text-xs opacity-80 mt-1">В дни высокого риска избегайте скопления людей и оставайтесь дома, если есть возможность.</p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ChartPage;
