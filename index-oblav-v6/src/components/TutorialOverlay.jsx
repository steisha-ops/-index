import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Lightbulb } from 'lucide-react';

/**
 * Tutorial overlay component optimized for Telegram mini app
 * Shows compact tips at the top of the page
 * @param {string} pageId - Unique ID for the page
 * @param {array} tutorials - Array of tutorial steps
 * @param {string} theme - Current theme (dark/light/rose)
 */
const TutorialOverlay = memo(({ pageId, tutorials, theme, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Check if user already saw tutorial for this page
    useEffect(() => {
        const seen = localStorage.getItem(`tutorial_${pageId}_seen`);
        if (seen) {
            setIsVisible(false);
        }
    }, [pageId]);

    if (!isVisible || !tutorials || tutorials.length === 0) return null;

    const tutorial = tutorials[currentStep];

    const handleNext = () => {
        if (currentStep < tutorials.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        localStorage.setItem(`tutorial_${pageId}_seen`, 'true');
        setIsVisible(false);
        onComplete?.();
    };

    const handleSkip = () => {
        localStorage.setItem(`tutorial_${pageId}_seen`, 'true');
        setIsVisible(false);
    };

    const getBgClasses = () => {
        if (theme === 'dark') return 'bg-gradient-to-r from-blue-950 to-blue-900 border-blue-800/50';
        if (theme === 'light') return 'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300/50';
        return 'bg-gradient-to-r from-pink-950 to-rose-900 border-pink-800/50';
    };

    const getTextClasses = () => {
        if (theme === 'dark') return 'text-white';
        if (theme === 'light') return 'text-gray-900';
        return 'text-white';
    };

    const getDimTextClasses = () => {
        if (theme === 'dark') return 'text-blue-200/70';
        if (theme === 'light') return 'text-blue-700/70';
        return 'text-pink-200/70';
    };

    const getButtonClasses = () => {
        if (theme === 'dark') return 'bg-blue-600 hover:bg-blue-700 text-white';
        if (theme === 'light') return 'bg-blue-500 hover:bg-blue-600 text-white';
        return 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`fixed top-14 left-0 right-0 z-[4999] mx-3 mt-2 rounded-2xl backdrop-blur-xl border shadow-lg ${getBgClasses()}`}
                style={{ maxWidth: 'calc(100% - 24px)' }}
            >
                <div className="p-3 sm:p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="shrink-0"
                            >
                                <Lightbulb size={18} className={theme === 'dark' ? 'text-yellow-300' : theme === 'light' ? 'text-yellow-600' : 'text-yellow-200'} />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-black text-sm sm:text-base ${getTextClasses()} truncate`}>
                                    {tutorial.title}
                                </h3>
                                <p className={`text-[11px] sm:text-xs ${getDimTextClasses()}`}>
                                    {currentStep + 1}/{tutorials.length}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleSkip}
                            className={`shrink-0 p-1 rounded-lg transition-all ${
                                theme === 'dark' ? 'hover:bg-white/10' : theme === 'light' ? 'hover:bg-blue-200/50' : 'hover:bg-white/10'
                            }`}
                            style={{ pointerEvents: 'auto' }}
                        >
                            <X size={16} className={getDimTextClasses()} />
                        </motion.button>
                    </div>

                    {/* Content */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className={`text-xs sm:text-sm leading-snug mb-3 ${getDimTextClasses()}`}
                    >
                        {tutorial.description}
                    </motion.p>

                    {/* Tips */}
                    {tutorial.tips && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.15 }}
                            className="space-y-1 mb-3"
                        >
                            {tutorial.tips.slice(0, 2).map((tip, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-1.5 text-[11px] sm:text-xs ${getDimTextClasses()}`}
                                >
                                    <span className={`font-bold text-xs shrink-0 mt-0.5 ${
                                        theme === 'dark' ? 'text-blue-300' : theme === 'light' ? 'text-blue-600' : 'text-pink-300'
                                    }`}>
                                        •
                                    </span>
                                    <span className="leading-tight">{tip}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/10">
                        {/* Progress dots - compact */}
                        <div className="flex items-center gap-1">
                            {tutorials.map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: i === currentStep ? 1.1 : 0.8,
                                        opacity: i <= currentStep ? 1 : 0.4
                                    }}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                                        i <= currentStep
                                            ? theme === 'dark' ? 'bg-blue-300' : theme === 'light' ? 'bg-blue-600' : 'bg-pink-300'
                                            : theme === 'dark' ? 'bg-blue-700/50' : theme === 'light' ? 'bg-blue-300/50' : 'bg-pink-700/50'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSkip}
                                className="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all opacity-70 hover:opacity-100"
                                style={{ pointerEvents: 'auto' }}
                            >
                                Пропуск
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleNext}
                                className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 transition-all ${getButtonClasses()}`}
                                style={{ pointerEvents: 'auto' }}
                            >
                                {currentStep === tutorials.length - 1 ? 'Готово' : 'Далее'}
                                {currentStep < tutorials.length - 1 && <ChevronRight size={12} />}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
});

TutorialOverlay.displayName = 'TutorialOverlay';

export default TutorialOverlay;
