import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ShieldAlert, Zap, MapPin, BarChart3, Bell, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

const haptic = {
    light: () => navigator.vibrate && navigator.vibrate(10),
    medium: () => navigator.vibrate && navigator.vibrate(20),
    strong: () => navigator.vibrate && navigator.vibrate([30, 20, 30]),
    // Duolingo-style vibration (quick rhythmic pattern)
    duolingo: () => navigator.vibrate && navigator.vibrate([15, 10, 15, 10, 15, 10, 20]),
    success: () => navigator.vibrate && navigator.vibrate([20, 30, 20, 30, 60]),
};

// SLIDE-SPECIFIC ANIMATIONS
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

const floatingAnimation = {
    y: [0, -20, 0],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

// SLIDE 1: WELCOME
const Slide1 = ({ next }) => (
    <motion.div
        key="slide1"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{duration: 0.3, ease: "easeOut"}}
        className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-y-auto"
    >
        {/* Top gradient blur */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
                className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl bg-gradient-to-l from-blue-500 to-cyan-400 opacity-20"
                animate={{scale: [1, 1.2, 1], rotate: [0, 90, 180]}}
                transition={{duration: 20, repeat: Infinity}}
            />
            <motion.div 
                className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl bg-gradient-to-r from-purple-600 to-pink-500 opacity-15"
                animate={{scale: [1.2, 1, 1.2], rotate: [180, 90, 0]}}
                transition={{duration: 20, repeat: Infinity}}
            />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
            {/* ОГНЕННАЯ ИКОНКА */}
            <motion.div
                animate={{scale: [1, 1.1, 1]}}
                transition={{duration: 2, repeat: Infinity}}
                className="relative"
            >
                <motion.div
                    animate={floatingAnimation}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/50"
                >
                    <ShieldAlert size={56} className="text-white" />
                </motion.div>
                
                {/* Orbiting circles */}
                <motion.div
                    animate={{rotate: 360}}
                    transition={{duration: 8, repeat: Infinity, linear: true}}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-400 border-r-cyan-400"
                />
            </motion.div>

            {/* TEXT */}
            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.15, duration: 0.4}}
                className="text-center space-y-4"
            >
                <h1 className="text-5xl md:text-6xl font-black tracking-tighter">
                    <motion.span
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        transition={{delay: 0.25}}
                    >
                        Добро
                    </motion.span>
                    <br />
                    <motion.span
                        initial={{y: 20, opacity: 0}}
                        animate={{y: 0, opacity: 1}}
                        transition={{delay: 0.35}}
                        className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent"
                    >
                        пожаловать
                    </motion.span>
                </h1>
                <motion.p
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.5}}
                    className="text-lg text-gray-400 font-medium"
                >
                    Глаз в небе. Защита на земле.
                </motion.p>
            </motion.div>
        </div>

        {/* BOTTOM BUTTON */}
        <motion.button
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.65}}
            whileTap={{scale: 0.95}}
            onMouseDown={() => haptic.medium()}
            onClick={next}
            className="w-full py-4 rounded-[28px] bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/50 hover:shadow-blue-600/60 transition-shadow"
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
        transition={{duration: 0.3, ease: "easeOut"}}
        className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-y-auto"
    >
        {/* Background animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
                className="absolute top-1/4 right-0 w-96 h-96 rounded-full blur-3xl bg-gradient-to-l from-red-500 to-orange-400 opacity-15"
                animate={{y: [0, 40, 0]}}
                transition={{duration: 6, repeat: Infinity}}
            />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
            {/* NUMBER ANIMATION */}
            <motion.div
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{type: "spring", stiffness: 100, damping: 15}}
                className="relative"
            >
                <motion.div
                    animate={{rotate: 360}}
                    transition={{duration: 10, repeat: Infinity, linear: true}}
                    className="absolute inset-0 rounded-full border-2 border-transparent border-t-orange-400 border-r-red-400"
                    style={{width: '160px', height: '160px'}}
                />
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
                    <motion.div
                        animate={{scale: [1, 1.15, 1]}}
                        transition={{duration: 2, repeat: Infinity}}
                        className="text-5xl font-black text-red-400"
                    >
                        7.2
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.4}}
                className="text-center space-y-4 max-w-sm"
            >
                <h2 className="text-4xl font-black">Индекс Риска</h2>
                <p className="text-gray-400 font-medium leading-relaxed">
                    Отслеживай уровень риска в реальном времени. От низкого до критического — всегда под контролем.
                </p>
                
                {/* Risk levels */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.3}}
                    className="grid grid-cols-4 gap-2 mt-6"
                >
                    {[
                        {val: '0-3', color: 'emerald', emoji: '✅'},
                        {val: '4-6', color: 'amber', emoji: '⚠️'},
                        {val: '7-8', color: 'orange', emoji: '🟠'},
                        {val: '9-10', color: 'red', emoji: '🔴'}
                    ].map((level, i) => (
                        <motion.div
                            key={i}
                            initial={{scale: 0, rotate: -180}}
                            animate={{scale: 1, rotate: 0}}
                            transition={{delay: 0.4 + i * 0.06, type: "spring"}}
                            className={`p-3 rounded-2xl bg-${level.color}-500/20 border border-${level.color}-500/50 text-center`}
                        >
                            <div className="text-2xl mb-1">{level.emoji}</div>
                            <div className="text-xs font-bold text-gray-300">{level.val}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </div>

        {/* BOTTOM BUTTONS */}
        <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.65}}
            className="w-full space-y-3"
        >
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="w-full py-4 rounded-[28px] bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-red-600/50 transition-shadow"
            >
                Понял <ArrowRight size={20} />
            </motion.button>
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.light()}
                onClick={prev}
                className="w-full py-3 rounded-[28px] bg-white/10 text-white font-semibold text-base border border-white/20 hover:bg-white/20 transition-colors"
            >
                Назад
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
        transition={{duration: 0.3, ease: "easeOut"}}
        className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-y-auto"
    >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
                className="absolute top-1/3 left-0 w-80 h-80 rounded-full blur-3xl bg-gradient-to-r from-green-500 to-emerald-400 opacity-15"
                animate={{x: [0, 30, 0]}}
                transition={{duration: 6, repeat: Infinity}}
            />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
            {/* MAP ICON */}
            <motion.div
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{type: "spring", stiffness: 100}}
            >
                <motion.div
                    animate={floatingAnimation}
                    className="relative"
                >
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center shadow-2xl shadow-green-500/50">
                        <MapPin size={56} className="text-white" />
                    </div>
                    <motion.div
                        animate={{scale: [1, 1.4, 1]}}
                        transition={{duration: 1.5, repeat: Infinity}}
                        className="absolute inset-0 rounded-full border-2 border-green-400/30"
                    />
                    <motion.div
                        animate={{scale: [1, 1.8, 1]}}
                        transition={{duration: 1.5, repeat: Infinity, delay: 0.3}}
                        className="absolute inset-0 rounded-full border-2 border-green-400/10"
                    />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.2}}
                className="text-center space-y-4 max-w-sm"
            >
                <h2 className="text-4xl font-black">Выбери город</h2>
                <p className="text-gray-400 font-medium leading-relaxed">
                    Отслеживай ситуацию в выбранном регионе. Данные обновляются в реальном времени.
                </p>

                {/* City cards preview */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.3}}
                    className="space-y-2 mt-6"
                >
                    {['Москва', 'Петербург', 'Казань'].map((city, i) => (
                        <motion.div
                            key={i}
                            initial={{x: -50, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{delay: 0.4 + i * 0.06}}
                            className="p-3 rounded-xl bg-white/5 border border-green-500/20 text-left"
                        >
                            <div className="font-bold text-sm">{city}</div>
                            <div className="text-xs text-gray-500">ИНДЕКС: {(3 + i * 0.5).toFixed(2)}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.div>
        </div>

        <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.65}}
            className="w-full space-y-3"
        >
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="w-full py-4 rounded-[28px] bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-green-600/50 transition-shadow"
            >
                Далее <ArrowRight size={20} />
            </motion.button>
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.light()}
                onClick={prev}
                className="w-full py-3 rounded-[28px] bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
            >
                Назад
            </motion.button>
        </motion.div>
    </motion.div>
);

// SLIDE 4: CHARTS
const Slide4 = ({ next, prev }) => (
    <motion.div
        key="slide4"
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        custom={1}
        transition={{duration: 0.3, ease: "easeOut"}}
        className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-y-auto"
    >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
                className="absolute top-1/4 -right-40 w-80 h-80 rounded-full blur-3xl bg-gradient-to-l from-purple-500 to-pink-400 opacity-15"
                animate={{rotate: 360}}
                transition={{duration: 20, repeat: Infinity, linear: true}}
            />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
            {/* CHART ICON */}
            <motion.div
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{type: "spring", stiffness: 100}}
            >
                <motion.div
                    animate={floatingAnimation}
                    className="w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center shadow-2xl shadow-purple-500/50"
                >
                    <BarChart3 size={56} className="text-white" />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.2}}
                className="text-center space-y-4 max-w-sm"
            >
                <h2 className="text-4xl font-black">Графики Риска</h2>
                <p className="text-gray-400 font-medium leading-relaxed">
                    Красивые графики показывают тренды и помогают предвидеть риски. Анализируй по дням, месяцам или всё время.
                </p>

                {/* Chart preview */}
                <motion.div
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{delay: 0.3}}
                    className="mt-6 p-4 rounded-2xl bg-white/5 border border-purple-500/20"
                >
                    <div className="flex items-end gap-2 h-24 justify-center">
                        {[2, 4, 3, 5, 4, 6, 5].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{height: 0}}
                                animate={{height: `${h * 12}px`}}
                                transition={{delay: 0.4 + i * 0.06, type: "spring"}}
                                className="w-3 rounded-t-lg bg-gradient-to-t from-purple-500 to-pink-400"
                            />
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>

        <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.65}}
            className="w-full space-y-3"
        >
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="w-full py-4 rounded-[28px] bg-gradient-to-r from-purple-500 to-pink-400 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-pink-600/50 transition-shadow"
            >
                Продолжить <ArrowRight size={20} />
            </motion.button>
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.light()}
                onClick={prev}
                className="w-full py-3 rounded-[28px] bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
            >
                Назад
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
        transition={{duration: 0.3, ease: "easeOut"}}
        className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-y-auto"
    >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl bg-gradient-to-t from-yellow-500 to-orange-400 opacity-15"
                animate={{scale: [1, 1.2, 1]}}
                transition={{duration: 6, repeat: Infinity}}
            />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
            {/* BELL ICON */}
            <motion.div
                initial={{scale: 0, rotate: -180}}
                animate={{scale: 1, rotate: 0}}
                transition={{type: "spring", stiffness: 100, damping: 15}}
            >
                <motion.div
                    animate={{y: [0, -8, 0]}}
                    transition={{duration: 0.5, repeat: Infinity, delay: 2}}
                    className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-yellow-500/50"
                >
                    <Bell size={56} className="text-white" />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.2}}
                className="text-center space-y-4 max-w-sm"
            >
                <h2 className="text-4xl font-black">Уведомления</h2>
                <p className="text-gray-400 font-medium leading-relaxed">
                    Получай мгновенные оповещения при изменении риска. Никогда не пропускай важное!
                </p>

                {/* Notification preview */}
                <motion.div
                    initial={{opacity: 0, x: -50}}
                    animate={{opacity: 1, x: 0}}
                    transition={{delay: 0.3}}
                    className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
                >
                    <div className="flex items-center gap-3 text-left">
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div>
                            <div className="font-bold text-sm">Риск возрос!</div>
                            <div className="text-xs text-gray-400">Индекс: 7.2 → 8.1</div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>

        <motion.div
            initial={{y: 20, opacity: 0}}
            animate={{y: 0, opacity: 1}}
            transition={{delay: 0.65}}
            className="w-full space-y-3"
        >
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.medium()}
                onClick={next}
                className="w-full py-4 rounded-[28px] bg-gradient-to-r from-yellow-500 to-orange-400 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-orange-600/50 transition-shadow"
            >
                Далее <ArrowRight size={20} />
            </motion.button>
            <motion.button
                whileTap={{scale: 0.95}}
                onMouseDown={() => haptic.light()}
                onClick={prev}
                className="w-full py-3 rounded-[28px] bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
            >
                Назад
            </motion.button>
        </motion.div>
    </motion.div>
);

// SLIDE 6: AUTHORS (новый опасный слайд)
const Slide6 = ({ next, prev, authors = [] }) => {
    // Если авторы есть - используем их, иначе пустой массив
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
            className="min-h-screen flex flex-col items-center justify-between px-6 py-8 overflow-y-auto"
        >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div 
                    className="absolute top-1/3 right-0 w-80 h-80 rounded-full blur-3xl bg-gradient-to-l from-indigo-500 to-purple-500 opacity-20"
                    animate={{y: [0, 40, 0]}}
                    transition={{duration: 6, repeat: Infinity}}
                />
                <motion.div 
                    className="absolute bottom-1/4 left-0 w-80 h-80 rounded-full blur-3xl bg-gradient-to-r from-pink-500 to-rose-500 opacity-15"
                    animate={{y: [0, -40, 0]}}
                    transition={{duration: 6, repeat: Infinity}}
                />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{delay: 0.3}}
                    className="text-center space-y-2"
                >
                    <h2 className="text-4xl font-black">Авторы контента</h2>
                    <p className="text-gray-400 font-medium">Создатели этой платформы</p>
                </motion.div>

                {/* Authors grid */}
                <motion.div
                    className="grid grid-cols-2 gap-5 mt-8 max-w-lg w-full"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.5}}
                >
                    {displayAuthors.map((author, i) => (
                        <motion.div
                            key={author.id || i}
                            initial={{scale: 0, rotate: -180}}
                            animate={{scale: 1, rotate: 0}}
                            transition={{
                                delay: 0.7 + i * 0.1,
                                type: "spring",
                                stiffness: 100,
                                damping: 12
                            }}
                            whileHover={{scale: 1.08, y: -5}}
                            onHoverStart={() => haptic.light()}
                            className="flex flex-col items-center space-y-4 p-6 rounded-[28px] bg-gradient-to-br from-white/10 to-white/5 border border-white/20 backdrop-blur-xl hover:border-white/40 transition-colors cursor-pointer"
                        >
                            <motion.div
                                animate={{scale: [1, 1.1, 1]}}
                                transition={{duration: 2, repeat: Infinity, delay: i * 0.2}}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-xl shadow-xl shadow-purple-500/40 overflow-hidden flex-shrink-0"
                            >
                                {author.avatar ? (
                                    <img src={author.avatar} className="w-full h-full object-cover" alt={author.name} />
                                ) : (
                                    <span className="text-3xl">👤</span>
                                )}
                            </motion.div>
                            <div className="text-center w-full min-h-12 flex flex-col justify-center">
                                <div className="font-bold text-sm leading-tight truncate px-1">{author.name || 'Автор'}</div>
                                {author.handle && (
                                    <div className="text-[11px] text-gray-500 uppercase tracking-wider truncate px-1 mt-1">@{author.handle}</div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Team badge */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 1.2}}
                    className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-center max-w-sm"
                >
                    <p className="text-sm font-semibold text-purple-300">
                        ✨ Создано командой людей, которые верят в безопасность
                    </p>
                </motion.div>
            </div>

            <motion.div
                initial={{y: 20, opacity: 0}}
                animate={{y: 0, opacity: 1}}
                transition={{delay: 1.4}}
                className="w-full space-y-3"
            >
                <motion.button
                    whileTap={{scale: 0.95}}
                    onMouseDown={() => haptic.duolingo()}
                    onClick={next}
                    className="w-full py-4 rounded-[28px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:shadow-purple-600/60 transition-shadow"
                >
                    Вперёд! <ArrowRight size={20} />
                </motion.button>
                <motion.button
                    whileTap={{scale: 0.95}}
                    onMouseDown={() => haptic.light()}
                    onClick={prev}
                    className="w-full py-3 rounded-[28px] bg-white/10 text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
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
        className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-y-auto"
    >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
                className="absolute top-1/4 right-0 w-96 h-96 rounded-full blur-3xl bg-gradient-to-l from-cyan-500 to-blue-500 opacity-20"
                animate={{rotate: 360}}
                transition={{duration: 20, repeat: Infinity, linear: true}}
            />
            <motion.div 
                className="absolute bottom-1/4 left-0 w-80 h-80 rounded-full blur-3xl bg-gradient-to-r from-purple-600 to-pink-500 opacity-15"
                animate={{rotate: -360}}
                transition={{duration: 20, repeat: Infinity, linear: true}}
            />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-8">
            {/* CHECK RING */}
            <motion.div
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{type: "spring", stiffness: 100, damping: 10}}
                className="relative"
            >
                <motion.svg
                    className="w-40 h-40"
                    viewBox="0 0 160 160"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.3}}
                >
                    <circle cx="80" cy="80" r="75" fill="none" stroke="url(#grad)" strokeWidth="2" opacity="0.5" />
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#06B6D4" />
                            <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                    </defs>
                </motion.svg>
                <motion.div
                    initial={{scale: 0}}
                    animate={{scale: 1}}
                    transition={{delay: 0.5, type: "spring"}}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <CheckCircle size={80} className="text-cyan-400" fill="currentColor" />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{delay: 0.7}}
                className="text-center space-y-4 max-w-sm"
            >
                <motion.h2 
                    className="text-4xl font-black"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.9}}
                >
                    Готово!
                </motion.h2>
                <motion.p 
                    className="text-gray-400 font-medium leading-relaxed"
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 1.1}}
                >
                    Теперь в твоей руке глаз в небе. Защита активирована!
                </motion.p>

                {/* Features check */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.65}}
                    className="space-y-2 mt-6 text-left"
                >
                    {['✓ Мониторинг риска', '✓ Геолокация', '✓ Аналитика', '✓ Уведомления'].map((feat, i) => (
                        <motion.div
                            key={i}
                            initial={{x: -30, opacity: 0}}
                            animate={{x: 0, opacity: 1}}
                            transition={{delay: 1.5 + i * 0.1}}
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
            transition={{delay: 1.9}}
            whileTap={{scale: 0.95}}
            onMouseDown={() => {haptic.success(); setTimeout(complete, 100);}}
            className="w-full py-4 rounded-[28px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/60 hover:shadow-blue-600/70 transition-shadow"
        >
            <Sparkles size={20} /> Вперёд в приложение!
        </motion.button>
    </motion.div>
);

// MAIN COMPONENT
export default function IntroOnboarding({ onComplete, authors = [] }) {
    const [slide, setSlide] = useState(0);
    const [direction, setDirection] = useState(1);

    // Блокируем скролл основной страницы во время интро
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        };
    }, []);

    const handleNext = () => {
        if (slide < 6) {
            setDirection(1);
            setSlide(s => s + 1);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (slide > 0) {
            setDirection(-1);
            setSlide(s => s - 1);
        }
    };

    const slides = [
        <Slide1 key="s1" next={handleNext} />,
        <Slide2 key="s2" next={handleNext} prev={handlePrev} />,
        <Slide3 key="s3" next={handleNext} prev={handlePrev} />,
        <Slide4 key="s4" next={handleNext} prev={handlePrev} />,
        <Slide5 key="s5" next={handleNext} prev={handlePrev} />,
        <Slide6 key="s6" next={handleNext} prev={handlePrev} authors={authors} />,
        <Slide7 key="s7" complete={onComplete} />,
    ];

    return (
        <div className="fixed inset-0 z-[30000] bg-gradient-to-br from-black via-slate-900 to-black overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
                {slides[slide]}
            </AnimatePresence>

            {/* Progress indicator */}
            <motion.div
                className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 origin-left z-50"
                initial={{scaleX: 0}}
                animate={{scaleX: (slide + 1) / 7}}
                transition={{duration: 0.4}}
            />

            {/* Step counter */}
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                className="fixed bottom-8 right-8 flex items-center gap-3 text-sm text-gray-400 font-semibold"
            >
                <span>{slide + 1}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span>7</span>
            </motion.div>
        </div>
    );
}
