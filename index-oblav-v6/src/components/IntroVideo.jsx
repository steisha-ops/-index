import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IntroVideo({ onComplete }) {
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIntro(false);
            onComplete();
        }, 5000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    const textVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { 
                duration: 1.2, 
                delay: i * 0.3 + 0.2,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        })
    };

    const lineVariants = {
        hidden: { scaleX: 0, opacity: 0 },
        visible: {
            scaleX: 1,
            opacity: 1,
            transition: {
                duration: 1,
                delay: 0.9,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    return (
        <AnimatePresence>
            {showIntro && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
                >
                    {/* Видео фон */}
                    <video
                        autoPlay
                        muted
                        playsInline
                        preload="auto"
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src="/videos/intro.mp4" type="video/mp4" />
                    </video>

                    {/* Градиент для читаемости текста */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black/80" />

                    {/* Текст сверху видео */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, transition: { duration: 0.6 } }}
                        className="relative z-10 flex flex-col items-center justify-center gap-0 px-4 whitespace-nowrap"
                    >
                        <motion.h1
                            custom={0}
                            variants={textVariants}
                            className="text-7xl md:text-[120px] font-black tracking-tight text-white leading-none"
                            style={{
                                letterSpacing: '-0.03em',
                                textShadow: '0 6px 20px rgba(0, 0, 0, 0.6)'
                            }}
                        >
                            Индекс
                        </motion.h1>

                        <motion.h1
                            custom={1}
                            variants={textVariants}
                            className="text-7xl md:text-[120px] font-black tracking-tight text-white leading-none"
                            style={{
                                letterSpacing: '-0.03em',
                                textShadow: '0 6px 20px rgba(0, 0, 0, 0.6)'
                            }}
                        >
                            Облав
                        </motion.h1>

                        <motion.div
                            variants={lineVariants}
                            className="h-1.5 w-48 bg-white/80 mt-12 rounded-full"
                        />
                    </motion.div>

                    {/* Затухание в конце */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 1 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="absolute inset-0 bg-black pointer-events-none z-40"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
