import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { clearSensitiveData, enablePrivacyMode } from '../lib/privacy';

/**
 * Security button - Quick access to security features
 * On click: enables offline mode, clears cookies, opens distraction page
 */
export const useSecurityButton = () => {
    const handleSecurityClick = async () => {
        try {
            // 1. Enable privacy/offline mode
            enablePrivacyMode();
            console.log('🔐 Security mode activated');

            // 2. Clear sensitive data
            await clearSensitiveData();
            console.log('🧹 Data cleared');

            // 3. Open distraction/decoy page in new tab
            window.open('https://www.duma.gov.ru', '_blank');
            
            // Show subtle feedback (vibration if available)
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }
        } catch (error) {
            console.error('❌ Security button error:', error);
        }
    };

    return handleSecurityClick;
};

export const SecurityButton = React.memo(() => {
    const handleClick = useSecurityButton();

    return (
        <motion.button
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg"
            title="🔐 Безопасность"
        >
            <Shield size={24} />
        </motion.button>
    );
});

SecurityButton.displayName = 'SecurityButton';

export default useSecurityButton;
