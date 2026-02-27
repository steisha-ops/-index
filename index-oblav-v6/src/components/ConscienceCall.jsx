import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

/**
 * ПРИЗЫВ К СОВЕСТИ - Instagram Stories Style
 * История совести с красивым слайдером и полноэкранными фото
 */
const ConscienceCall = ({ isOpen, onClose, onActivateTheme }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [conscienceHistory, setConscienceHistory] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loading, setLoading] = useState(true);
    const [buttonEnabled, setButtonEnabled] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadConscienceHistory();
            loadButtonStatus();
        }
    }, [isOpen]);

    const loadButtonStatus = async () => {
        try {
            const res = await api.getConscienceButtonStatus();
            setButtonEnabled(res.enabled);
        } catch (e) {
            console.error("Error loading button status:", e);
            setButtonEnabled(true); // Default to enabled
        }
    };

    const loadConscienceHistory = async () => {
        try {
            setLoading(true);
            const data = await api.getConscienceHistory();
            if (Array.isArray(data)) {
                setConscienceHistory(data.sort((a, b) => a._order - b._order));
                setCurrentSlide(0);
            }
        } catch (e) {
            console.error("Error loading conscience history:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    const nextSlide = () => {
        if (conscienceHistory.length > 0) {
            setCurrentSlide((prev) => (prev + 1) % conscienceHistory.length);
        }
    };

    const prevSlide = () => {
        if (conscienceHistory.length > 0) {
            setCurrentSlide((prev) => (prev - 1 + conscienceHistory.length) % conscienceHistory.length);
        }
    };

    if (!isOpen) return null;

    const currentEntry = conscienceHistory[currentSlide];
    const hasImage = currentEntry?.image && currentEntry.image.startsWith('data:');

    return (
        <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            {loading ? (
                /* Loading State */
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center">
                    <div className="inline-block animate-spin">
                        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full"></div>
                    </div>
                </div>
            ) : conscienceHistory.length === 0 ? (
                /* Empty State */
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center flex-col gap-4">
                    <button
                        onClick={handleClose}
                        className="fixed top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center hover:bg-white/60"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                    <h2 className="text-2xl font-bold text-white">История в разработке</h2>
                    <p className="text-gray-300">Записи появятся вскоре</p>
                </div>
            ) : (
                /* Story Slider */
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                    >
                        {/* Background with Image or Gradient */}
                        {hasImage ? (
                            <div className="absolute inset-0 overflow-hidden">
                                <img
                                    src={currentEntry.image}
                                    alt="story"
                                    className="w-full h-full object-cover"
                                />
                                {/* Dark overlay for text readability */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-600 via-rose-500 to-orange-500">
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                                </div>
                            </div>
                        )}

                        {/* Top Bar - Close & Progress */}
                        <div className="absolute top-0 left-0 right-0 z-10 p-4">
                            <div className="flex items-center justify-between">
                                {/* Progress Bar */}
                                <div className="flex gap-1 flex-1">
                                    {conscienceHistory.map((_, idx) => (
                                        <motion.div
                                            key={idx}
                                            className={`h-1 flex-1 rounded-full transition-all ${
                                                idx === currentSlide ? 'bg-white' : 'bg-white/40'
                                            }`}
                                            layoutId={`progress-${idx}`}
                                        />
                                    ))}
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={handleClose}
                                    className="ml-3 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md border border-white/60 flex items-center justify-center hover:bg-white/50 transition active:scale-90"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content - Bottom */}
                        <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-white">
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="w-full max-w-md text-center space-y-4"
                            >
                                {/* Icon */}
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-6xl"
                                >
                                    {currentEntry?.icon || '🕊️'}
                                </motion.div>

                                {/* Title */}
                                <h2 className="text-3xl font-black tracking-tight drop-shadow-lg">
                                    {currentEntry?.title}
                                </h2>

                                {/* Description */}
                                {currentEntry?.text && (
                                    <p className="text-base leading-relaxed drop-shadow-md font-medium">
                                        {currentEntry.text}
                                    </p>
                                )}

                                {/* Show CTA buttons only on last slide */}
                                {currentSlide === conscienceHistory.length - 1 && (
                                    <>
                                        {/* Activate Theme Button */}
                                        {buttonEnabled && (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    onActivateTheme && onActivateTheme('rose');
                                                    handleClose();
                                                }}
                                                className="w-full bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95 mt-4"
                                            >
                                                🌹 Активировать Розовую Тему
                                            </motion.button>
                                        )}

                                        {/* Group Link Button */}
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                window.open('https://t.me/conscience_call', '_blank');
                                                handleClose();
                                            }}
                                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-95"
                                        >
                                            📱 Присоединиться к Группе
                                        </motion.button>
                                    </>
                                )}

                                {/* Story Counter */}

                                {/* Story Counter */}
                                <div className="text-xs text-white/70 font-semibold pt-2">
                                    {currentSlide + 1} / {conscienceHistory.length}
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation Arrows */}
                        {conscienceHistory.length > 1 && (
                            <>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={prevSlide}
                                    className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center hover:bg-white/30 transition active:scale-75"
                                >
                                    <ChevronLeft className="w-6 h-6 text-white" />
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={nextSlide}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center hover:bg-white/30 transition active:scale-75"
                                >
                                    <ChevronRight className="w-6 h-6 text-white" />
                                </motion.button>
                            </>
                        )}

                        {/* Auto-advance Timer */}
                        <motion.div
                            initial={{ scaleX: 1 }}
                            animate={{ scaleX: 0 }}
                            transition={{ duration: 8 }}
                            onAnimationComplete={nextSlide}
                            className="absolute top-5 left-4 right-12 h-1 bg-white rounded-full origin-left opacity-50"
                        />
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default ConscienceCall;
