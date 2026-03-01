import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPin, BarChart3, Bell, Sparkles, ArrowRight, CheckCircle, User } from 'lucide-react';

const slideVariants = {
    enter: (direction) => ({
        y: direction > 0 ? 1000 : -1000,
        opacity: 0
    }),
    center: {
        zIndex: 1,
        y: 0,
        opacity: 1
    },
    exit: (direction) => ({
        zIndex: 0,
        y: direction < 0 ? 1000 : -1000,
        opacity: 0
    })
};

const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            delay: i * 0.15 + 0.2,
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    })
};

// Vibration feedback
const haptic = {
    light: () => navigator.vibrate && navigator.vibrate(10),
    medium: () => navigator.vibrate && navigator.vibrate(20),
    strong: () => navigator.vibrate && navigator.vibrate([30, 20, 30]),
    success: () => navigator.vibrate && navigator.vibrate([20, 30, 20, 30, 60]),
};

// Constants
const FEATURES = ['✓ Мониторинг риска', '✓ Геолокация', '✓ Аналитика', '✓ Уведомления'];
const RISK_LEVELS = [
    { val: '0-3', color: 'bg-emerald-500/20 border-emerald-500/50', emoji: '✅' },
    { val: '4-6', color: 'bg-amber-500/20 border-amber-500/50', emoji: '⚠️' },
    { val: '7-8', color: 'bg-orange-500/20 border-orange-500/50', emoji: '🟠' },
    { val: '9-10', color: 'bg-red-500/20 border-red-500/50', emoji: '🔴' }
];
const DEMO_CITIES = ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск'];

// SLIDE 1: WELCOME
const Slide1 = ({ next }) => (
    <motion.div
        key="slide1"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
    >
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-28 h-28 rounded-full glass-card bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl"
            >
                <ShieldAlert size={56} className="text-white" />
            </motion.div>

            <motion.div
                initial="hidden"
                animate="visible"
                className="text-center space-y-3"
            >
                <motion.h1
                    custom={0}
                    variants={textVariants}
                    className="text-6xl md:text-7xl font-black tracking-tight text-white leading-tight"
                    style={{ letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
                >
                    Добро
                </motion.h1>
                <motion.h1
                    custom={1}
                    variants={textVariants}
                    className="text-6xl md:text-7xl font-black tracking-tight text-white leading-tight"
                    style={{ letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' }}
                >
                    пожаловать
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={textVariants}
                    className="text-lg text-white/70 font-medium pt-4"
                >
                    Глаз в небе. Защита на земле.
                </motion.p>
            </motion.div>
        </div>

        <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={() => haptic.medium()}
            onClick={next}
            className="w-full max-w-md py-4 rounded-2xl glass-card bg-white/20 backdrop-blur-xl border border-white/30 text-white font-bold text-lg flex items-center justify-center gap-3 hover:bg-white/30 transition"
        >
            Начнём <ArrowRight size={20} />
        </motion.button>
    </motion.div>
);

// SLIDE 2: RISK INDEX
const Slide2 = ({ next, prev }) => (
    <motion.div
        key="slide2"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
    >
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-32 h-32 rounded-full glass-card bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl"
            >
                <div className="text-6xl font-black text-white">7.2</div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" className="text-center space-y-3">
                <motion.h2
                    custom={0}
                    variants={textVariants}
                    className="text-6xl md:text-7xl font-black text-white"
                    style={{ letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                    Индекс Риска
                </motion.h2>
                <motion.p custom={1} variants={textVariants} className="text-white/70 font-medium leading-relaxed">
                    Отслеживай уровень риска в реальном времени
                </motion.p>
            </motion.div>
        </div>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="w-full max-w-md flex gap-3"
        >
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={prev}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition"
            >
                Назад
            </motion.button>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/20 border border-white/30 text-white font-bold hover:bg-white/30 transition"
            >
                Дальше
            </motion.button>
        </motion.div>
    </motion.div>
);

// SLIDE 3: LOCATION
const Slide3 = ({ next, prev }) => (
    <motion.div
        key="slide3"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
    >
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-32 h-32 rounded-full glass-card bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl"
            >
                <MapPin size={64} className="text-white" />
            </motion.div>

            <motion.div initial="hidden" animate="visible" className="text-center space-y-3">
                <motion.h2
                    custom={0}
                    variants={textVariants}
                    className="text-6xl md:text-7xl font-black text-white"
                    style={{ letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                    Локация
                </motion.h2>
                <motion.p custom={1} variants={textVariants} className="text-white/70 font-medium leading-relaxed">
                    Выбери свой регион и отслеживай данные для твоей области
                </motion.p>
            </motion.div>
        </div>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="w-full max-w-md flex gap-3"
        >
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={prev}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition"
            >
                Назад
            </motion.button>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/20 border border-white/30 text-white font-bold hover:bg-white/30 transition"
            >
                Дальше
            </motion.button>
        </motion.div>
    </motion.div>
);

// SLIDE 4: ANALYTICS
const Slide4 = ({ next, prev }) => (
    <motion.div
        key="slide4"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
    >
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-32 h-32 rounded-full glass-card bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl"
            >
                <BarChart3 size={64} className="text-white" />
            </motion.div>

            <motion.div initial="hidden" animate="visible" className="text-center space-y-3">
                <motion.h2
                    custom={0}
                    variants={textVariants}
                    className="text-6xl md:text-7xl font-black text-white"
                    style={{ letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                    Аналитика
                </motion.h2>
                <motion.p custom={1} variants={textVariants} className="text-white/70 font-medium leading-relaxed">
                    Графики и диаграммы для полного анализа данных
                </motion.p>
            </motion.div>
        </div>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="w-full max-w-md flex gap-3"
        >
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={prev}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition"
            >
                Назад
            </motion.button>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/20 border border-white/30 text-white font-bold hover:bg-white/30 transition"
            >
                Дальше
            </motion.button>
        </motion.div>
    </motion.div>
);

// SLIDE 5: NOTIFICATIONS
const Slide5 = ({ next, prev }) => (
    <motion.div
        key="slide5"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12"
    >
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 max-w-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-32 h-32 rounded-full glass-card bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl"
            >
                <Bell size={64} className="text-white" />
            </motion.div>

            <motion.div initial="hidden" animate="visible" className="text-center space-y-3">
                <motion.h2
                    custom={0}
                    variants={textVariants}
                    className="text-6xl md:text-7xl font-black text-white"
                    style={{ letterSpacing: '-0.02em', textShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                >
                    Уведомления
                </motion.h2>
                <motion.p custom={1} variants={textVariants} className="text-white/70 font-medium leading-relaxed">
                    Получай оповещения об важных изменениях в реальном времени
                </motion.p>
            </motion.div>
        </div>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="w-full max-w-md flex gap-3"
        >
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={prev}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/10 border border-white/20 text-white font-bold hover:bg-white/20 transition"
            >
                Назад
            </motion.button>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="flex-1 py-4 rounded-2xl glass-card bg-white/20 border border-white/30 text-white font-bold hover:bg-white/30 transition"
            >
                Дальше
            </motion.button>
        </motion.div>
    </motion.div>
);

const Slide6 = ({ next, prev, authors = [] }) => {
    const displayAuthors = authors.length > 0 ? authors.slice(0, 4) : [];

    return (
        <motion.div
            key="slide6"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={1}
            transition={{duration: 0.3, ease: "easeOut"}}
            className="relative z-10 min-h-screen flex flex-col items-center justify-between px-6 py-8 overflow-y-auto"
        >
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.2, duration: 0.5}}
                    className="text-center space-y-2"
                >
                    <h2 className="text-4xl font-black text-white">Авторы контента</h2>
                    <p className="text-gray-300 font-medium">Создатели этой платформы</p>
                </motion.div>

                {/* Authors grid */}
                <motion.div
                    className="grid grid-cols-2 gap-5 mt-8 max-w-lg w-full"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.4, duration: 0.5}}
                >
                    {displayAuthors.map((author, i) => (
                        <motion.div
                            key={author.id || i}
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{opacity: 1, scale: 1}}
                            transition={{
                                delay: 0.5 + i * 0.1,
                                duration: 0.4,
                                ease: "easeOut"
                            }}
                            whileHover={{scale: 1.02}}
                            onHoverStart={() => haptic.light()}
                            className="flex flex-col items-center space-y-4 p-6 rounded-[28px] glass-card border border-white/20"
                        >
                            <div className="w-24 h-24 rounded-full glass-card border border-purple-500/30 flex items-center justify-center text-xl shadow-lg shadow-purple-500/20 overflow-hidden flex-shrink-0">
                                {author.avatar ? (
                                    <img src={author.avatar} className="w-full h-full object-cover" alt={author.name} />
                                ) : (
                                    <span className="text-3xl">👤</span>
                                )}
                            </div>
                            <div className="text-center w-full min-h-12 flex flex-col justify-center">
                                <div className="font-bold text-sm leading-tight truncate px-1 text-white">{author.name || 'Автор'}</div>
                                {author.handle && (
                                    <div className="text-[11px] text-gray-400 uppercase tracking-wider truncate px-1 mt-1">@{author.handle}</div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Team badge */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.9, duration: 0.5}}
                    className="mt-8 p-4 rounded-2xl glass-card border border-purple-500/30 text-center max-w-sm"
                >
                    <p className="text-sm font-semibold text-purple-200">
                        ✨ Создано командой людей, которые верят в безопасность
                    </p>
                </motion.div>
            </div>

            <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 1.0, duration: 0.4}}
                className="w-full space-y-3"
            >
                <motion.button
                    whileTap={{scale: 0.95}}
                    onMouseDown={() => haptic.medium()}
                    onClick={next}
                    className="w-full py-4 rounded-[28px] glass-card bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-3 border-indigo-400/50"
                >
                    Вперёд! <ArrowRight size={20} />
                </motion.button>
                <motion.button
                    whileTap={{scale: 0.95}}
                    onMouseDown={() => haptic.light()}
                    onClick={prev}
                    className="w-full py-3 rounded-[28px] glass-card text-white font-semibold border border-white/20 hover:bg-white/10 transition-colors"
                >
                    Назад
                </motion.button>
            </motion.div>
        </motion.div>
    );
};

// SLIDE 7: FINAL
const Slide7 = ({ complete }) => (
    <motion.div
        key="slide7"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{duration: 0.3, ease: "easeOut"}}
        className="relative z-10 min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-y-auto"
    >
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="w-40 h-40 rounded-full glass-card border-2 border-cyan-400/50 flex items-center justify-center">
                <CheckCircle size={80} className="text-cyan-400" />
            </div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.3, duration: 0.5}}
                className="text-center space-y-4 max-w-sm"
            >
                <h2 className="text-4xl font-black text-white">Готово!</h2>
                <motion.p 
                    className="text-gray-300 font-medium leading-relaxed"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.5, duration: 0.5}}
                >
                    Теперь в твоей руке глаз в небе. Защита активирована!
                </motion.p>

                {/* Features check */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.7, duration: 0.5}}
                    className="space-y-2 mt-6 text-left"
                >
                    {FEATURES.map((feat, i) => (
                        <motion.div
                            key={i}
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            transition={{delay: 0.9 + i * 0.08, duration: 0.4}}
                            className="text-sm font-semibold text-cyan-400"
                        >
                            {feat}
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </div>

        <motion.button
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 1.3, duration: 0.4}}
            whileTap={{scale: 0.95}}
            onMouseDown={() => haptic.success()}
            onClick={complete}
            className="w-full py-4 rounded-[28px] glass-card bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-black text-lg flex items-center justify-center gap-3 border-cyan-400/50"
        >
            <Sparkles size={20} /> Вперёд в приложение!
        </motion.button>
    </motion.div>
);

// ============================================
// MAIN EXPORT
// ============================================

/**
 * IntroOnboarding - Main Component
 * @param {Function} onComplete - Callback executed when user completes onboarding
 * @param {Array} authors - Array of content creator objects to display
 * 
 * Renders a 7-slide onboarding experience with:
 * - Slide 1: Welcome introduction
 * - Slide 2: Risk index system explanation
 * - Slide 3: Location/region selection
 * - Slide 4: Analytics and charts overview
 * - Slide 5: Notification system details
 * - Slide 6: Content creators showcase
 * - Slide 7: Completion screen
 *
 * The background for the whole modal now cycles through three video clips
 * located in `public/videos` named `intro1.mp4`, `intro2.mp4` and
 * `intro3.mp4`. Videos have automatic fallback to animated gradient if they
 * fail to load on mobile devices. A dark gradient overlay keeps the slide 
 * text readable. When onboarding finishes the container fades away before 
 * `onComplete` is called to produce a smooth transition into the app.
 *
 * @returns {JSX.Element} Full-screen onboarding modal
 */
export default function IntroOnboarding({ onComplete, authors = [] }) {
    const [slide, setSlide] = useState(0);
    const [direction, setDirection] = useState(1);
    const [leaving, setLeaving] = useState(false);   // used for fade-out when finishing
    const [bgIndex, setBgIndex] = useState(0);       // which background clip is showing
    const [videoReady, setVideoReady] = useState(false); // track if video has loaded

    // list of videos that should be placed in /public/videos directory
    const BACKGROUND_VIDEOS = [
        '/videos/intro1.mp4',
        '/videos/intro2.mp4',
        '/videos/intro3.mp4'
    ];

    // Prevent body scroll during introduction
    // Restores scroll on unmount
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        };
    }, []);

    // cycle background clips every 8 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex(i => (i + 1) % BACKGROUND_VIDEOS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    // navigation helpers unchanged...

    // wrapper that fades to black then invokes user's callback
    const finish = () => {
        haptic.success();  // Vibration feedback on completion
        setLeaving(true);
    };

    // Navigate to next slide or complete onboarding
    const handleNext = () => {
        if (slide < 6) {
            setDirection(1);
            setSlide(s => s + 1);
        } else {
            // trigger exit animation
            finish();
        }
    };

    // Navigate to previous slide
    const handlePrev = () => {
        if (slide > 0) {
            setDirection(-1);
            setSlide(s => s - 1);
        }
    };

    // Slide components array
    const slides = [
        <Slide1 key="s1" next={handleNext} />,
        <Slide2 key="s2" next={handleNext} prev={handlePrev} />,
        <Slide3 key="s3" next={handleNext} prev={handlePrev} />,
        <Slide4 key="s4" next={handleNext} prev={handlePrev} />,
        <Slide5 key="s5" next={handleNext} prev={handlePrev} />,
        <Slide6 key="s6" next={handleNext} prev={handlePrev} authors={authors} />,
        <Slide7 key="s7" complete={finish} />,
    ];

    return (
        <motion.div
            className="fixed inset-0 z-[30000] overflow-hidden bg-black"
            initial={{opacity: 1}}
            animate={leaving ? {opacity: 0} : {opacity: 1}}
            transition={{duration: 0.5}}
            onAnimationComplete={() => {
                if (leaving) {
                    onComplete?.();
                }
            }}
        >
            {/* background video stack */}
            <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
                {/* solid black fallback */}
                <div className="absolute inset-0 bg-black" />
                
                {/* Animated gradient fallback for when videos don't load */}
                <motion.div
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)',
                            'radial-gradient(circle at 50% 100%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
                            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
                        ]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: 'linear'
                    }}
                    className="absolute inset-0"
                />
                
                {/* video layer */}
                <AnimatePresence mode="wait">
                    <motion.video
                        key={bgIndex}
                        autoPlay
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={{opacity: 0}}
                        animate={{opacity: videoReady ? 1 : 0}}
                        exit={{opacity: 0}}
                        transition={{duration: 1}}
                        onCanPlay={() => setVideoReady(true)}
                        onError={() => {
                            console.warn('Video failed to load:', BACKGROUND_VIDEOS[bgIndex]);
                            setVideoReady(false);
                        }}
                        onLoadedMetadata={() => setVideoReady(true)}
                    >
                        <source src={BACKGROUND_VIDEOS[bgIndex]} type="video/mp4" />
                    </motion.video>
                </AnimatePresence>
                
                {/* dark gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80" />
            </div>

            {/* Slides Container with Transitions */}
            <AnimatePresence mode="wait" custom={direction}>
                {slides[slide]}
            </AnimatePresence>

            {/* Progress Bar */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 origin-left z-50"
                initial={{scaleX: 0}}
                animate={{scaleX: (slide + 1) / 7}}
                transition={{duration: 0.4}}
            />

            {/* Step Counter */}
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="fixed bottom-8 right-8 flex items-center gap-3 text-sm text-gray-400 font-semibold"
            >
                <span className="text-white font-bold">{slide + 1}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span className="text-gray-400">7</span>
            </motion.div>
        </motion.div>
    );
}
