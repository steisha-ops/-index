import { useState, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, Info, MapPin, X, Settings, Megaphone, Zap, Link, Star, AlertTriangle, Clock, Image as ImgIcon, Menu, CheckCircle, Flame, Heart, LogOut } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import IntroOnboarding from '../components/IntroOnboarding';
import TutorialOverlay from '../components/TutorialOverlay';
import { tutorialData } from '../lib/tutorialData';

// --- WIDGETS ---
const Icons = { Zap, Info, Shield: ShieldAlert, Link, Star, AlertTriangle, Clock };

const StandardWidget = memo(({ w, onClick, className }) => {
    const Ico = Icons[w.icon] || Info;
    return (
        <motion.div 
            whileTap={{ scale: 0.98 }} 
            onClick={onClick} 
            className={`glass-card p-6 flex flex-col justify-between h-44 cursor-pointer relative overflow-hidden ${className}`}
        >
            <div className="flex justify-between items-start z-10">
                <div className={`p-3 rounded-2xl border border-[var(--border)]`} style={{backgroundColor: 'var(--bg-card)'}}><Ico size={28}/></div>
                {w.link && <ArrowRight size={16} className="opacity-40"/>}
            </div>
            <div className="z-10 mt-auto">
                <h3 className="font-bold text-lg leading-tight mb-1 tracking-tight text-[var(--text-primary)]">{w.title}</h3>
                <p className="text-[11px] opacity-70 font-medium uppercase tracking-wide text-[var(--text-dim)]">{w.text}</p>
            </div>
        </motion.div>
    );
});
StandardWidget.displayName = 'StandardWidget';

const ImageWidget = memo(({ w, onClick, className }) => (
    <motion.div 
        whileTap={{scale:0.98}} 
        onClick={onClick} 
        className={`glass-card relative overflow-hidden h-44 cursor-pointer group p-0 ${className}`}
    >
        <img src={w.image} className="absolute inset-0 w-full h-full object-cover opacity-80 transition duration-500 group-hover:scale-105"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"/>
        <div className="absolute bottom-5 left-5 right-5">
            <h3 className="font-bold text-white text-xl shadow-black drop-shadow-lg">{w.title}</h3>
        </div>
    </motion.div>
));
ImageWidget.displayName = 'ImageWidget';

const ClockWidget = memo(({ w, className }) => {
    const [t, sT] = useState(new Date());
    useEffect(() => { const i = setInterval(() => sT(new Date()), 1000); return () => clearInterval(i); }, []);
    const m = new Date(t.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
    return (
        <div className={`glass-card p-6 flex flex-col justify-center items-center h-44 ${className}`}>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2"><Clock size={12}/> MSK</span>
            <div className="text-5xl font-mono font-black text-[var(--text-primary)] tracking-widest">{m.getHours().toString().padStart(2,'0')}:{m.getMinutes().toString().padStart(2,'0')}</div>
        </div>
    );
});
ClockWidget.displayName = 'ClockWidget';

// --- PAGE COMPONENTS ---

const MenuButton = memo(({ b, onClick, onHover }) => {
    const isUrl = b.icon && (b.icon.startsWith('http') || b.icon.startsWith('data:'));
    const Ico = !isUrl ? (Icons[b.icon] || Info) : null;
    return (
        <motion.button 
            whileTap={{scale:0.98}} 
            onClick={onClick}
            onMouseEnter={onHover}
            className="glass-card p-4 flex items-center gap-3 w-full text-left"
        >
            <div className="bg-[var(--bg-main)] p-2.5 rounded-xl text-blue-500 shadow-inner">
                <div className="w-6 h-6 flex items-center justify-center">
                    {isUrl ? <img src={b.icon} className="w-5 h-5 object-contain"/> : <Ico size={20}/>}
                </div>
            </div>
            <span className="text-sm font-bold text-[var(--text-primary)] leading-tight">{b.label}</span>
        </motion.button>
    );
});
MenuButton.displayName = 'MenuButton';

const Home = ({ theme, toggleTheme, onOpenConscienceCall, showRegionModal, setShowRegionModal, regionsList, currentRegion, selectRegion }) => {
  const [ticker, setTicker] = useState(3.0);
  const [news, setNews] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [buttons, setButtons] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [popups, setPopups] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [isNoWeapons, setIsNoWeapons] = useState(false);
  const [isEditingWidgets, setIsEditingWidgets] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [widgetOrder, setWidgetOrder] = useState([]);
  const navigate = useNavigate();


  // ПРОВЕРЬ!
  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('app_intro_shown');
    setShowIntro(isFirstVisit);
  }, []);

  // ✨ Function to reload widgets (called when admin changes widgets)
  const reloadWidgets = useCallback(async () => {
    console.log('🔄 Reloading widgets...');
    try {
      const w = await api.getWidgets();
      console.log('🎨 Widgets reloaded:', w?.length);
      if (Array.isArray(w)) {
        setWidgets(w);
        const userId = localStorage.getItem('user_id') || 'default';
        const res = await api.getWidgetLayout(userId);
        if (res?.order && Array.isArray(res.order)) {
          setWidgetOrder(res.order);
        } else {
          setWidgetOrder(w.map(wid => wid.id));
        }
      }
    } catch (e) {
      console.error('❌ Failed to reload widgets:', e);
    }
  }, []);

  useEffect(() => {
    // Listen for widget updates from config-manager
    window.addEventListener('widgets_updated', reloadWidgets);
    return () => window.removeEventListener('widgets_updated', reloadWidgets);
  }, [reloadWidgets]);

  useEffect(() => {
    const load = async () => {
        try {
            console.log('📡 [Home] Loading widgets...');
            api.getNews().then(n => {
                console.log('📰 News loaded:', n?.length);
                setNews(n?.slice(0,2) || []);
            });
            api.getButtons().then(b => {
                console.log('🔘 Buttons loaded:', b?.length);
                setButtons(b || []);
            });
            
            // WIDGETS - ГЛАВНОЕ!
            api.getWidgets().then(w => {
                console.log('🎨 Widgets loaded from server:', w);
                console.log('   Widget count:', Array.isArray(w) ? w.length : 'NOT ARRAY');
                if (!Array.isArray(w)) {
                    console.error('❌ Widgets is not an array:', w);
                    setWidgets([]);
                    return;
                }
                
                setWidgets(w);
                // Load saved widget order
                const userId = localStorage.getItem('user_id') || 'default';
                api.getWidgetLayout(userId).then(res => {
                    console.log('🎯 Widget layout result:', res);
                    if (res?.order && Array.isArray(res.order)) {
                        console.log('✅ Using saved order:', res.order);
                        setWidgetOrder(res.order);
                    } else {
                        console.log('📝 Creating new order from widgets');
                        const newOrder = w.map(wid => wid.id);
                        console.log('   New order:', newOrder);
                        setWidgetOrder(newOrder);
                    }
                });
            }).catch(e => {
                console.error('❌ Failed to load widgets:', e);
                setWidgets([]);
            });
            
            api.getPopups().then(p => {
                console.log('💬 Popups loaded:', p?.length);
                setPopups(p || []);
            });
            api.getAuthors().then(a => {
                console.log('👥 Authors loaded:', a?.length);
                setAuthors(a || []);
            });
        } catch(e){ console.error("Error loading initial data:", e); }
    };
    load();
    const i = setInterval(() => {
        const id = localStorage.getItem('user_region_id');
        if(id) api.getRegionData(id).then(d => {
            if(d.region) setTicker(d.region.current_index)
        });
    }, 3000);
    return () => clearInterval(i);
  }, []);

  // интро
  const handleIntroComplete = useCallback(() => {
    localStorage.setItem('app_intro_shown', 'true');
    setShowIntro(false);
    window.dispatchEvent(new Event('intro_completed'));
  }, []);

  const handleLogout = useCallback(() => {
    if (confirm('Вернуться к приветствию?')) {
      localStorage.removeItem('app_intro_shown');
      setShowIntro(true);
      window.dispatchEvent(new Event('intro_starting'));
    }
  }, []);
  
  const handleLink = useCallback((link) => {
      if(!link) return;
      if(link === 'action:theme_toggle') toggleTheme();
      else if(link.startsWith('popup:')) {
          const id = link.split(':')[1];
          const found = popups.find(p => String(p.id) === String(id));
          if(found) setActivePopup(found);
      }
      else if(link.startsWith('/')) navigate(link);
      else window.open(link, '_blank');
  }, [toggleTheme, popups, navigate]);
  
  // Prefetch Chart data
  const prefetchChartData = useCallback(() => {
      const regionId = localStorage.getItem('user_region_id') || 1;
      api.prefetch(`/api/region_data/${regionId}`, 'short');
      api.prefetch('/api/forecasts', 'short');
  }, []);

  // WIDGET MANAGEMENT
  const saveWidgetOrder = useCallback(async () => {
    try {
      const userId = localStorage.getItem('user_id') || 'default';
      const result = await api.saveWidgetLayout(userId, widgetOrder);
      if (result?.ok) {
        console.log('✅ Widget layout saved');
        setIsEditingWidgets(false);
      }
    } catch(e) {
      console.error('❌ Failed to save widget layout:', e);
    }
  }, [widgetOrder]);

  const handleWidgetDragStart = useCallback((e, widgetId) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleWidgetDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleWidgetDrop = useCallback((e, targetId) => {
    e.preventDefault();
    setDraggedWidget(prev => {
      if (!prev || prev === targetId) return null;

      const draggedIdx = widgetOrder.indexOf(prev);
      const targetIdx = widgetOrder.indexOf(targetId);
      
      if (draggedIdx > -1 && targetIdx > -1) {
        const newOrder = [...widgetOrder];
        [newOrder[draggedIdx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[draggedIdx]];
        setWidgetOrder(newOrder);
      }
      
      return null;
    });
  }, [widgetOrder]);

  const cancelEditingWidgets = useCallback(() => {
    setIsEditingWidgets(false);
    const userId = localStorage.getItem('user_id') || 'default';
    api.getWidgetLayout(userId).then(res => {
      if (res?.order && Array.isArray(res.order)) {
        setWidgetOrder(res.order);
      }
    });
  }, []);
  
  const riskProfile = ticker >= 9 ? { t: 'text-red-400', b: 'rgb(var(--risk-red))', g: 'glow-red' } 
                      : ticker >= 7 ? { t: 'text-orange-400', b: 'rgb(var(--risk-orange))', g: 'glow-orange' } 
                      : ticker >= 4 ? { t: 'text-yellow-400', b: 'rgb(var(--risk-yellow))', g: 'glow-yellow' } 
                      : { t: 'text-green-400', b: 'rgb(var(--risk-green))', g: 'glow-green' };

  // ----_ REPAIRED WIDGET RENDERING LOGIC п=---
  const renderWidget = (w) => {
      const glowClassName = riskProfile.g;
      const props = { key: w.id, w, onClick: () => handleLink(w.link) };

      if (w.type === 'group') {
          let subWidgets = [];
          try { subWidgets = JSON.parse(w.sub_widgets); } catch (e) {}
          return (
              <div className="col-span-2 grid grid-cols-2 gap-4">
                  {subWidgets.map(sub => {
                      const subProps = { key: sub.id, w: sub, onClick: () => handleLink(sub.link), className: glowClassName };
                      if (sub.type === 'image') return <ImageWidget {...subProps} />;
                      return <StandardWidget {...subProps} />;
                  })}
              </div>
          );
      }

      const className = `${w.is_wide ? 'col-span-2' : ''} ${glowClassName}`;
      
      if (w.type === 'image') return <ImageWidget {...props} className={className} />;
      if (w.type === 'clock') return <ClockWidget {...props} className={`${w.is_wide ? 'col-span-2' : ''} glow-blue`} />;
      
      return <StandardWidget {...props} className={className} />;
  };

  return (
    <>
      <AnimatePresence>
        {showIntro && <IntroOnboarding onComplete={handleIntroComplete} authors={authors} />}
      </AnimatePresence>

      <TutorialOverlay pageId="home" tutorials={tutorialData.home} theme={theme} />

      <motion.div initial={{opacity:0}} animate={{opacity:1}} className="px-5 pt-14 pb-8 space-y-8 max-w-4xl mx-auto">
      <header className="flex justify-between items-center">
          <div className="flex-1">
              <motion.h1 
                onClick={() => setIsNoWeapons(!isNoWeapons)}
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                className={`text-xl font-black tracking-widest cursor-pointer transition-all duration-500 select-none ${
                  isNoWeapons 
                    ? 'text-red-600 drop-shadow-lg' 
                    : 'text-[var(--text-primary)]'
                }`}
              >
                <motion.span
                  key={isNoWeapons ? 'noweapons' : 'index'}
                  initial={{opacity: 0, y: -10}}
                  animate={{opacity: 1, y: 0}}
                  exit={{opacity: 0, y: 10}}
                  transition={{duration: 0.4}}
                >
                  {isNoWeapons ? '🕊️ НЕТ ОРУЖИЮ' : 'ИНДЕКС ОБЛАВ'}
                </motion.span>
              </motion.h1>
              <div onClick={()=>setShowRegionModal(true)} className="flex items-center gap-2 mt-1 cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                  <MapPin size={12} className="text-blue-500"/>
                  <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wide">{currentRegion.name}</span>
                  <span className="text-[10px] text-blue-500">▼</span>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <motion.button
                whileTap={{scale: 0.9}}
                onClick={() => setIsEditingWidgets(!isEditingWidgets)}
                className={`w-12 h-12 glass-card rounded-2xl flex items-center justify-center transition-colors group ${isEditingWidgets ? 'bg-blue-500/20' : 'hover:bg-blue-500/10'}`}
                title="Редактировать виджеты"
              >
                <Menu size={20} className={isEditingWidgets ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'}/>
              </motion.button>
              <motion.button
                whileTap={{scale: 0.9}}
                onClick={handleLogout}
                className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center hover:bg-red-500/20 transition-colors group"
                title="Вернуться к приветствию"
              >
                <LogOut size={20} className="text-red-500 group-hover:text-red-600 transition-colors" />
              </motion.button>
              <div className={`w-14 h-14 glass-card rounded-2xl flex items-center justify-center ${riskProfile.g}`}>
                  <ShieldAlert size={24} className={riskProfile.t}/>
              </div>
          </div>
      </header>
      
      <div className={`glass-card p-8 relative overflow-hidden transition-all duration-1000 ${riskProfile.g}`}>
        <div className="flex justify-between items-end relative z-10">
            <div>
                <h2 className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-[0.3em] mb-4">УРОВЕНЬ РИСКА</h2>
                <div className={`text-8xl font-black tracking-tighter transition-colors duration-700 ${riskProfile.t}`}>{Number(ticker).toFixed(2)}</div>
            </div>
            <div className="text-[10px] font-bold text-[var(--text-dim)] mb-6 bg-[var(--bg-main)] px-4 py-2 rounded-full border border-[var(--border)]">БАЛЛОВ</div>
        </div>
        <div className="mt-8 h-4 w-full bg-black/20 rounded-full overflow-hidden shadow-inner">
            <motion.div className="h-full rounded-full transition-colors duration-700" animate={{ width: `${(Math.min(ticker,11)/11)*100}%` }} transition={{ duration: 1.5, ease: "easeInOut" }} style={{ backgroundColor: riskProfile.b }} />
        </div>
      </div>
      
      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-3 -mx-5 px-5">{authors.map(a => (
          <div key={a.id} className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group" onClick={()=>navigate(`/author/${a.id}`)}>
              <div className="w-[70px] h-[70px] rounded-full p-1 bg-gradient-to-tr from-blue-600 via-purple-500 to-pink-500 shadow-lg group-hover:scale-105 transition-transform">
                  <div className="w-full h-full rounded-full bg-[var(--bg-card)] p-0.5 overflow-hidden">
                      <img src={a.avatar} className="w-full h-full rounded-full object-cover"/>
                  </div>
              </div>
              <span className="text-xs text-[var(--text-dim)] font-bold tracking-wide truncate w-20 text-center group-hover:text-[var(--text-primary)] transition-colors">{a.name}</span>
          </div>
      ))}</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets && widgets.length > 0 ? (
          widgetOrder && widgetOrder.length > 0 
            ? widgetOrder.map(widgetId => {
                const w = widgets.find(wid => wid.id === widgetId);
                if (!w) {
                  console.warn(`⚠️ Widget ${widgetId} not found in widgets array`);
                  return null;
                }
                
                if (isEditingWidgets) {
                  return (
                    <motion.div
                      key={w.id}
                      draggable
                      onDragStart={(e) => handleWidgetDragStart(e, w.id)}
                      onDragOver={handleWidgetDragOver}
                      onDrop={(e) => handleWidgetDrop(e, w.id)}
                      className={`cursor-move opacity-75 ring-2 ring-blue-500/50 rounded-xl overflow-hidden ${draggedWidget === w.id ? 'opacity-50' : ''}`}
                    >
                      {renderWidget(w)}
                    </motion.div>
                  );
                }
                
                return renderWidget(w);
              })
            : widgets.map(w => {
                console.log('🎨 Rendering widget:', w.id, w.title);
                if (isEditingWidgets) {
                  return (
                    <motion.div
                      key={w.id}
                      draggable
                      onDragStart={(e) => handleWidgetDragStart(e, w.id)}
                      onDragOver={handleWidgetDragOver}
                      onDrop={(e) => handleWidgetDrop(e, w.id)}
                      className={`cursor-move opacity-75 ring-2 ring-blue-500/50 rounded-xl overflow-hidden ${draggedWidget === w.id ? 'opacity-50' : ''}`}
                    >
                      {renderWidget(w)}
                    </motion.div>
                  );
                }
                return renderWidget(w);
              })
        ) : (
          <div className="col-span-2 py-12 text-center text-gray-500">
            <p>📦 Нет виджетов</p>
            <p className="text-xs mt-2 text-gray-600">Добавьте виджеты в Config Manager</p>
          </div>
        )}
      </div>

      {isEditingWidgets && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="flex gap-3 mt-4"
        >
          <motion.button
            whileTap={{scale: 0.95}}
            onClick={saveWidgetOrder}
            className="flex-1 py-3 rounded-2xl glass-card bg-green-500/20 border border-green-500/50 text-green-400 font-bold hover:bg-green-500/30 transition"
          >
            ✓ Сохранить
          </motion.button>
          <motion.button
            whileTap={{scale: 0.95}}
            onClick={cancelEditingWidgets}
            className="flex-1 py-3 rounded-2xl glass-card bg-red-500/20 border border-red-500/50 text-red-400 font-bold hover:bg-red-500/30 transition"
          >
            ✕ Отмена
          </motion.button>
        </motion.div>
      )}
      
      <div>
        <div className="flex justify-between px-2 mb-4 items-center">
            <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Лента</span>
            <button onClick={()=>navigate('/news')} className="bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-dim)] border border-[var(--border)] transition">ВСЕ</button>
        </div>
        <div className="flex flex-col gap-4">{news.map(n => (
            <motion.div whileTap={{scale:0.98}} key={n.id} className={`glass-card p-6 cursor-pointer border ${n.is_highlighted?'border-l-4 border-l-yellow-500':''}`} onClick={()=>navigate(`/author/${n.author_id}`)}>
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <img src={n.avatar} className="w-12 h-12 rounded-full bg-gray-500 object-cover shadow-md"/>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-bold text-base text-[var(--text-primary)]">{n.name}</span>
                            {n.is_verified==1 && <CheckCircle size={14} className="text-blue-500 fill-blue-500/20"/>}
                        </div>
                        <div className="text-[11px] text-[var(--text-dim)] font-mono tracking-wide">@{n.handle}</div>
                    </div>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-dim)] line-clamp-3 mb-4">{n.text}</p>
                {n.btn_text && <button onClick={(e) => {e.stopPropagation(); if(n.btn_link) {if(n.btn_link.startsWith('/')) navigate(n.btn_link); else window.open(n.btn_link, '_blank');}}} className="w-full text-sm font-bold text-blue-400 bg-blue-500/10 px-4 py-3 rounded-xl text-center uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-colors">{n.btn_text}</button>}
            </motion.div>
        ))}</div>
      </div>
      
      <motion.button 
        whileTap={{scale:0.97}} 
        onClick={() => onOpenConscienceCall && onOpenConscienceCall()}
        className={`w-full py-6 rounded-[32px] flex flex-col items-center justify-center gap-2 text-white shadow-lg shadow-pink-500/30 transition-all duration-300 hover:scale-[1.02] font-bold backdrop-blur-sm border-2 ${
          'bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 border-pink-300/50 hover:shadow-xl hover:shadow-pink-500/50'
        }`}
      >
          <div className="flex items-center gap-3">
              <Heart size={24} className="animate-pulse drop-shadow-lg" />
              <span className="font-black tracking-[0.2em] text-base drop-shadow-lg">ПРИЗЫВ К СОВЕСТИ</span>
          </div>
          <span className="text-[11px] text-white/80 font-bold uppercase tracking-widest drop-shadow-lg">Альтернативная гражданская служба</span>
      </motion.button>
      
      <motion.button whileTap={{scale:0.97}} onClick={()=>navigate('/report')} className="w-full py-6 rounded-[32px] flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-red-500/40 transition-shadow backdrop-blur-sm border-2 border-red-300/50">
          <div className="flex items-center gap-3">
              <Megaphone size={24} className="group-hover:animate-bounce" />
              <span className="font-black tracking-[0.2em] text-sm">СООБЩИТЬ ОБ ОБЛАВЕ</span>
          </div>
          <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Безопасная линия 24/7</span>
      </motion.button>
      
      <div className="grid grid-cols-2 gap-4 mt-6">
          {buttons.map(b => (
              <MenuButton 
                  key={b.id} 
                  b={b} 
                  onClick={() => handleLink(b.link)}
                  onHover={() => b.link === '/chart' && prefetchChartData()}
              />
          ))}
      </div>
      
      <AnimatePresence>
        {activePopup && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className={`fixed inset-0 z-[20000] flex items-center justify-center p-6 pointer-events-auto ${theme === 'light' ? 'bg-black/50 backdrop-blur-lg' : 'bg-black/80 backdrop-blur-lg'}`} onClick={()=>setActivePopup(null)}>
                <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} transition={{type:'spring', damping:20, stiffness:200}} className={`w-full max-w-sm p-0 overflow-hidden shadow-2xl rounded-3xl border ${theme === 'light' ? 'bg-white text-black border-gray-200' : 'glass-card border-white/10'}`} onClick={e=>e.stopPropagation()}>
                    {activePopup.image && <div className="h-48 w-full relative"><img src={activePopup.image} className="w-full h-full object-cover"/></div>}
                    <div className="p-8 text-center">
                        <h3 className={`text-2xl font-black mb-3 ${theme === 'light' ? 'text-black' : 'text-[var(--text-primary)]'}`}>{activePopup.title}</h3>
                        <p className={`text-sm mb-8 leading-relaxed font-medium ${theme === 'light' ? 'text-gray-600' : 'text-[var(--text-dim)]'}`}>{activePopup.text}</p>
                        <button onClick={()=>setActivePopup(null)} className={`w-full py-4 rounded-2xl font-bold text-lg transition-colors ${theme === 'light' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-[var(--text-primary)] text-[var(--bg-main)] hover:opacity-90'}`}>OK</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  );
};
export default Home;
