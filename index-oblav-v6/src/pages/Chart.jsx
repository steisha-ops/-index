import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { AlertTriangle, Shield, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const ChartPage = ({ theme = 'dark' }) => {
    const [fullData, setFullData] = useState([]);
    const [viewData, setViewData] = useState([]);
    const [timeframe, setTimeframe] = useState(30);

    useEffect(() => {
        const id = localStorage.getItem('user_region_id') || 1;
        fetch(`/api/region_data/${id}`).then(r=>r.json()).then(d => {
            if(d.history) {
                setFullData(d.history);
                filterData(d.history, 30);
            }
        });
    }, []);

    const filterData = (data, days) => {
        setTimeframe(days);
        if(!data.length) return;
        setViewData(days === 180 ? data : data.slice(-days));
    };

    const avg = viewData.length ? (viewData.reduce((a,b)=>a+Number(b.value),0)/viewData.length).toFixed(1) : 0;
    const min = viewData.length ? Math.min(...viewData.map(d=>d.value)).toFixed(1) : 0;
    const max = viewData.length ? Math.max(...viewData.map(d=>d.value)).toFixed(1) : 0;
    const lastVal = viewData.length ? viewData[viewData.length - 1].value : 0;

    // Прогноз облав с более реалистичными данными
    const forecastData = [
        { day: 'ПН', risk: 45, label: 'Низкий', icon: '✅' },
        { day: 'ВТ', risk: 62, label: 'Средний', icon: '⚠️' },
        { day: 'СР', risk: 78, label: 'Высокий', icon: '⛔' },
        { day: 'ЧТ', risk: 85, label: 'Критический', icon: '🔴' },
        { day: 'ПТ', risk: 55, label: 'Средний', icon: '⚠️' },
        { day: 'СБ', risk: 30, label: 'Низкий', icon: '✅' },
        { day: 'ВС', risk: 20, label: 'Минимальный', icon: '✅' },
    ];

    const isBgDark = theme === 'dark';
    const riskLevel = lastVal >= 9 ? { label: '🔴 КРИТИЧЕСКИЙ', color: 'from-red-600 to-red-700', glow: 'shadow-2xl shadow-red-500/50', textColor: 'text-red-500' } 
                    : lastVal >= 7 ? { label: '🟠 ВЫСОКИЙ', color: 'from-orange-600 to-orange-700', glow: 'shadow-2xl shadow-orange-500/50', textColor: 'text-orange-500' }
                    : lastVal >= 4 ? { label: '🟡 СРЕДНИЙ', color: 'from-yellow-600 to-yellow-700', glow: 'shadow-2xl shadow-yellow-500/30', textColor: 'text-yellow-500' }
                    : { label: '🟢 НИЗКИЙ', color: 'from-green-600 to-green-700', glow: 'shadow-2xl shadow-green-500/30', textColor: 'text-green-500' };

    const getRiskColor = (risk) => 
        risk >= 70 ? { bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', shadow: 'shadow-lg shadow-red-500/30', bar: 'bg-red-500' }
        : risk >= 50 ? { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', shadow: 'shadow-lg shadow-orange-500/30', bar: 'bg-orange-500' }
        : risk >= 30 ? { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', shadow: 'shadow-lg shadow-yellow-500/20', bar: 'bg-yellow-500' }
        : { bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', shadow: 'shadow-lg shadow-green-500/20', bar: 'bg-green-500' };

    return (
        <div className={`min-h-screen pt-16 pb-32 px-4 flex flex-col transition-colors duration-500 font-sans ${isBgDark ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'}`}>
            
            {/* HEADER */}
            <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="mb-8">
                <h2 className="text-4xl font-black tracking-tighter mb-2">📊 ДИНАМИКА</h2>
                <p className={`text-sm ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Индекс риска в реальном времени</p>
            </motion.div>

            {/* MAIN RISK CARD - Apple Style */}
            <motion.div
                initial={{opacity:0, y:20}}
                animate={{opacity:1, y:0}}
                transition={{delay:0.1}}
                className={`relative mb-8 rounded-[32px] p-8 backdrop-blur-2xl border ${
                    isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'
                } ${riskLevel.glow} overflow-hidden`}
            >
                {/* COLORED GLOW BACKGROUND */}
                <div className={`absolute -inset-1 rounded-[32px] bg-gradient-to-br ${riskLevel.color} opacity-20 blur-3xl -z-10`}></div>
                
                <div className="flex items-end justify-between relative z-10">
                    <div>
                        <p className={`text-sm font-bold uppercase opacity-60 mb-2 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Текущий риск-индекс</p>
                        <p className="text-6xl font-black font-mono tracking-tighter mb-3">{lastVal}</p>
                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${riskLevel.color} bg-gradient-to-r text-white`}>
                            {riskLevel.label}
                        </div>
                    </div>
                    <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${riskLevel.color} p-px`}>
                        <div className={`w-full h-full rounded-2xl ${isBgDark ? 'bg-black' : 'bg-white'} flex items-center justify-center`}>
                            <Activity size={56} className={riskLevel.textColor}/>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* TIMEFRAME BUTTONS - Apple Style */}
            <div className={`flex gap-3 mb-8 p-2 rounded-2xl backdrop-blur-xl border ${isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'}`}>
                {[7, 30, 90, 180].map(d => (
                    <motion.button 
                        key={d}
                        whileTap={{scale:0.95}}
                        onClick={() => filterData(fullData, d)}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all duration-300 ${
                            timeframe === d 
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                                : `${isBgDark ? 'text-gray-400 hover:text-white' : 'text-gray-700 hover:text-black'} hover:bg-white/10`
                        }`}
                    >
                        {d === 180 ? 'ALL' : `${d}D`}
                    </motion.button>
                ))}
            </div>

            {/* GRAPH CARD - Apple Style */}
            <motion.div 
                initial={{opacity:0, y:20}} 
                animate={{opacity:1, y:0}}
                transition={{delay:0.2}}
                className={`h-72 rounded-[32px] p-6 backdrop-blur-2xl border shadow-2xl shadow-blue-500/20 relative overflow-hidden mb-8 ${
                    isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'
                }`}
            >
                {/* GLOW EFFECT */}
                <div className="absolute inset-0 opacity-40 pointer-events-none rounded-[32px]">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-30"></div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewData}>
                        <defs>
                            <linearGradient id="glowGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={isBgDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                            vertical={false}
                        />
                        <XAxis dataKey="date" hide />
                        <Tooltip 
                            contentStyle={{
                                background: isBgDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
                                border: `1px solid ${isBgDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                                borderRadius: '20px',
                                boxShadow: isBgDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)',
                                backdropFilter: 'blur(20px)'
                            }} 
                            itemStyle={{color: '#3B82F6', fontWeight: 'bold', fontSize: '14px'}} 
                            labelStyle={{color: isBgDark ? '#999' : '#666', fontSize: '12px', fontWeight: '600'}}
                            labelFormatter={(l) => new Date(l).toLocaleDateString('ru-RU')}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3B82F6" 
                            strokeWidth={3.5} 
                            fill="url(#glowGradient)" 
                            animationDuration={800}
                            filter="url(#glow)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            {/* FORECAST FOR CONSCRIPTS - Apple Style */}
            <motion.div
                initial={{opacity:0, y:20}}
                animate={{opacity:1, y:0}}
                transition={{delay:0.3}}
                className={`rounded-[32px] p-6 backdrop-blur-2xl border shadow-2xl shadow-red-500/20 ${
                    isBgDark ? 'bg-white/5 border-white/10' : 'bg-white/40 border-white/60'
                }`}
            >
                {/* GLOW BACKGROUND */}
                <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-red-500/20 to-orange-500/10 opacity-30 blur-3xl -z-10"></div>

                <div className="flex items-center gap-4 mb-6">
                    <motion.div 
                        whileHover={{scale:1.05}}
                        className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/40"
                    >
                        <AlertTriangle size={28} className="text-white"/>
                    </motion.div>
                    <div>
                        <h3 className="text-2xl font-black">🎖️ ПРОГНОЗ ОБЛАВ</h3>
                        <p className={`text-xs mt-1 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>Прогноз для призывников на неделю</p>
                    </div>
                </div>

                {/* DAILY FORECAST CARDS */}
                <div className="space-y-3">
                    {forecastData.map((item, i) => {
                        const colors = getRiskColor(item.risk);
                        return (
                            <motion.div
                                key={item.day}
                                initial={{opacity:0, x:-30}}
                                animate={{opacity:1, x:0}}
                                transition={{delay: 0.35 + i*0.06}}
                                whileHover={{scale:1.02, translateY:-2}}
                                className={`rounded-2xl p-4 backdrop-blur-xl border bg-gradient-to-br ${colors.bg} ${colors.border} ${colors.shadow} transition-all`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-center min-w-max">
                                        <p className="text-2xl">{item.icon}</p>
                                        <p className="text-sm font-black mt-1">{item.day}</p>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className={`h-8 rounded-full relative overflow-hidden ${isBgDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                            <motion.div
                                                initial={{width:0}}
                                                animate={{width:`${item.risk}%`}}
                                                transition={{delay: 0.4 + i*0.08, duration:1, ease:'easeOut'}}
                                                className={`h-full rounded-full ${colors.bar} shadow-lg`}
                                                style={{filter: `drop-shadow(0 0 8px ${colors.bar === 'bg-red-500' ? 'rgba(239,68,68,0.6)' : colors.bar === 'bg-orange-500' ? 'rgba(249,115,22,0.6)' : colors.bar === 'bg-yellow-500' ? 'rgba(234,179,8,0.4)' : 'rgba(34,197,94,0.4)'})`}}
                                            ></motion.div>
                                        </div>
                                    </div>

                                    <div className="text-right min-w-max">
                                        <p className="text-xl font-mono font-black text-blue-500">{item.risk}%</p>
                                        <p className={`text-[11px] font-bold mt-1 ${isBgDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.label}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* WARNING MESSAGE */}
                <motion.div
                    initial={{opacity:0}}
                    animate={{opacity:1}}
                    transition={{delay:0.8}}
                    className={`mt-6 p-4 rounded-2xl flex gap-3 bg-gradient-to-br border backdrop-blur-xl ${
                        isBgDark 
                            ? 'from-yellow-900/20 to-orange-900/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20' 
                            : 'from-yellow-400/20 to-orange-400/10 border-yellow-500/30 shadow-lg shadow-yellow-500/20'
                    }`}
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
