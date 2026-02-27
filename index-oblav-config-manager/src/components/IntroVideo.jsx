import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function IntroVideo({ onComplete }) {
    const [showIntro, setShowIntro] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIntro(false);
            onComplete();
        }, 5000); // 5 секунд

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!showIntro) return null;

    const textVariants = {
        hidden: { opacity: 0, scale: 0.5 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3,
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
            {/* Видео фон (когда будет добавлено) */}
            <video
                autoPlay
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                style={{ filter: 'brightness(0.5)' }}
            >
                {/* Видео находится в папке public/videos */}
                <source src="/videos/intro.mp4" type="video/mp4" />
            </video>

            {/* Анимированная надпись */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative z-10 flex flex-col items-center gap-6"
            >
                <motion.h1
                    variants={textVariants}
                    className="text-6xl md:text-8xl font-black text-white tracking-widest"
                    style={{
                        textShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(99, 102, 241, 0.6)',
                        letterSpacing: '0.15em'
                    }}
                >
                    Индекс
                </motion.h1>

                <motion.h1
                    variants={textVariants}
                    className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 tracking-widest"
                    style={{
                        textShadow: '0 0 30px rgba(139, 92, 246, 0.8)',
                        letterSpacing: '0.15em'
                    }}
                >
                    Облав
                </motion.h1>

                {/* Анимированная линия */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-56"
                />

                {/* Подсвеченный текст */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1 }}
                    className="text-blue-300/80 text-sm tracking-widest uppercase font-semibold"
                >
                    Загрузка...
                </motion.p>
            </motion.div>

            {/* Прогресс-бар */}
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"
            />
        </div>
    );
}
