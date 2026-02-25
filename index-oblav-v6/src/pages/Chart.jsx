import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ChartPage = () => {
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

    return (
        <div className="h-screen pt-16 pb-32 px-5 flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] font-sans max-w-md mx-auto transition-colors duration-500">
            <div className="mb-6">
                <h2 className="text-3xl font-black tracking-tighter">ДИНАМИКА</h2>
                <div className="flex items-center gap-4 mt-2">
                    <div>
                        <div className="text-xs text-[var(--text-dim)] uppercase font-bold">AVG</div>
                        <div className="text-2xl font-mono font-bold text-green-500">{avg}</div>
                    </div>
                    <div className="h-8 w-px bg-[var(--border)]"></div>
                    <div>
                        <div className="text-xs text-[var(--text-dim)] uppercase font-bold">MIN</div>
                        <div className="text-xl font-mono font-bold text-[var(--text-primary)]">{min}</div>
                    </div>
                    <div>
                        <div className="text-xs text-[var(--text-dim)] uppercase font-bold">MAX</div>
                        <div className="text-xl font-mono font-bold text-[var(--text-primary)]">{max}</div>
                    </div>
                </div>
            </div>

            <div className="flex bg-[var(--glass)] p-1 rounded-2xl mb-6 border border-[var(--border)] shadow-sm">
                {[7, 30, 90, 180].map(d => (
                    <button 
                        key={d} 
                        onClick={() => filterData(fullData, d)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${timeframe === d ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-primary)]'}`}
                    >
                        {d === 180 ? 'ALL' : `${d}D`}
                    </button>
                ))}
            </div>

            <div className="flex-1 glass-card p-2 relative overflow-hidden shadow-2xl">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewData}>
                        <defs>
                            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34C759" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#34C759" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <Tooltip 
                            contentStyle={{background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'16px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}} 
                            itemStyle={{color: '#34C759', fontWeight: 'bold'}} 
                            labelStyle={{color:'var(--text-dim)', fontSize:'10px'}}
                            labelFormatter={(l) => new Date(l).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="value" stroke="#34C759" strokeWidth={3} fill="url(#g)" animationDuration={800} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
export default ChartPage;
