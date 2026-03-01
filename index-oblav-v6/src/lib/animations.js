/**
 * Optimized animations for smooth performance on weak devices
 * Uses transform and opacity only - fastest GPU properties
 * Simpler easing, reduced duration for mobile
 */

// Detect if device is weak (low memory, slow CPU)
const isWeakDevice = () => {
    if (typeof navigator === 'undefined') return false;
    const ram = navigator.deviceMemory;
    return ram && ram <= 4; // Devices with 4GB or less RAM
};

const WEAK_DEVICE = isWeakDevice();

// Enhanced page transitions - optimized for mobile
export const pageTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: {
        duration: WEAK_DEVICE ? 0.3 : 0.4,
        ease: 'easeOut'
    }
};

// Smooth slide animation for modals
export const slideUpTransition = {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
    transition: {
        type: WEAK_DEVICE ? 'tween' : 'spring',
        damping: 30,
        stiffness: 250,
        duration: 0.3
    }
};

// Fade transition - simplest and fastest
export const fadeTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: WEAK_DEVICE ? 0.2 : 0.3 }
};

// Scale animation - subtle and smooth
export const scaleTransition = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: WEAK_DEVICE ? 0.25 : 0.35 }
};

// Tap feedback - instant
export const tapScale = WEAK_DEVICE ? { scale: 0.97 } : { scale: 0.96 };

// Hover feedback - smooth but simple
export const hoverScale = WEAK_DEVICE ? { scale: 1.02 } : { scale: 1.05 };

// Button tap animation
export const tapMotion = {
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 }
};

// Card entrance stagger
export const staggerContainer = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: {
            staggerChildren: WEAK_DEVICE ? 0.05 : 0.08,
            delayChildren: 0,
        }
    }
};

export const staggerItem = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: {
        duration: WEAK_DEVICE ? 0.25 : 0.4,
        ease: 'easeOut'
    }
};

// List item animation
export const listItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i) => {
        const speed = WEAK_DEVICE ? 0.03 : 0.06;
        return {
            opacity: 1,
            x: 0,
            transition: {
                delay: i * speed,
                duration: WEAK_DEVICE ? 0.2 : 0.3,
                ease: 'easeOut'
            }
        };
    }
};

// Pulse animation - subtle
export const pulseSimple = {
    animate: {
        opacity: [1, 0.7, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
        }
    }
};

// Smooth color transitions
export const colorTransition = 'transition-colors duration-300';

// Loading spinner - optimized
export const spinnerVariants = {
    animate: {
        rotate: 360,
        transition: {
            duration: WEAK_DEVICE ? 1.5 : 2,
            repeat: Infinity,
            ease: 'linear'
        }
    }
};

// Get reduced motion preference
export const prefersReducedMotion = () => {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
};

// Apply reduced motion
export const getTransitionWithReducedMotion = (fullTransition, reducedTransition) => {
    return prefersReducedMotion() ? reducedTransition : fullTransition;
};

// Optimized menu animation
export const menuItemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i) => ({
        opacity: 1,
        scale: 1,
        transition: {
            delay: i * (WEAK_DEVICE ? 0.04 : 0.07),
            duration: WEAK_DEVICE ? 0.2 : 0.3,
            ease: 'easeOut'
        }
    })
};

// Chart animation - simplified
export const chartVariants = {
    animate: {
        transition: {
            duration: WEAK_DEVICE ? 0.5 : 0.8,
            ease: 'easeOut'
        }
    }
};

export default {
    isWeakDevice: WEAK_DEVICE,
    pageTransition,
    slideUpTransition,
    fadeTransition,
    scaleTransition,
    tapScale,
    hoverScale,
    tapMotion,
    staggerContainer,
    staggerItem,
    listItemVariants,
    pulseSimple,
    colorTransition,
    spinnerVariants,
    prefersReducedMotion,
    getTransitionWithReducedMotion,
    menuItemVariants,
    chartVariants
};
