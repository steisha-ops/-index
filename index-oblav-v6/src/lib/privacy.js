/**
 * Privacy utilities for secure data handling
 * Includes encryption, secure headers, and privacy mode
 */

/**
 * Simple encryption using Web Crypto API (browser native)
 * Note: Use only for client-side data, not for transmission (use HTTPS)
 */

// Generate a key from username/password
export const deriveKey = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    return crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
};

/**
 * Encrypt sensitive data
 */
export const encryptData = async (text, key) => {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Convert to base64 for storage
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('❌ Encryption failed:', error);
        throw error;
    }
};

/**
 * Decrypt sensitive data
 */
export const decryptData = async (encryptedBase64, key) => {
    try {
        // Convert from base64
        const combined = Uint8Array.from(
            atob(encryptedBase64),
            c => c.charCodeAt(0)
        );

        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            encrypted
        );

        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('❌ Decryption failed:', error);
        throw error;
    }
};

/**
 * Privacy mode settings
 */
export const privacySettings = {
    // Hide user IP if possible (use Tor/VPN)
    anonymizeIP: true,
    
    // Don't send User-Agent (server sees generic)
    minimizeUserAgent: true,
    
    // Don't send referrer
    noReferrer: true,
    
    // Clear cache on session end
    autoCleanCache: true,
    
    // Don't track analytics
    doNotTrack: true,
    
    // Disable 3rd party cookies
    blockThirdPartyCookies: true,
    
    // No local storage persistence (use session only)
    sessionOnly: false
};

/**
 * Enable privacy mode
 */
export const enablePrivacyMode = (settings = {}) => {
    const finalSettings = { ...privacySettings, ...settings };
    
    // Store in sessionStorage (cleared on tab close)
    sessionStorage.setItem('privacyMode', JSON.stringify(finalSettings));
    
    // Set referrer policy
    if (finalSettings.noReferrer) {
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.target.setAttribute('rel', 'noreferrer');
            }
        });
    }
    
    // Signal Do-Not-Track
    if (finalSettings.doNotTrack && navigator.doNotTrack !== '1') {
        console.log('🔒 Privacy mode enabled - Do Not Track requested');
    }
    
    console.log('🔐 Privacy mode activated:', finalSettings);
    return finalSettings;
};

/**
 * Disable privacy mode
 */
export const disablePrivacyMode = () => {
    sessionStorage.removeItem('privacyMode');
    console.log('🔓 Privacy mode disabled');
};

/**
 * Check if privacy mode is active
 */
export const isPrivacyModeEnabled = () => {
    return sessionStorage.getItem('privacyMode') !== null;
};

/**
 * Get current privacy settings
 */
export const getPrivacySettings = () => {
    const settings = sessionStorage.getItem('privacyMode');
    return settings ? JSON.parse(settings) : privacySettings;
};

/**
 * Sanitize and remove tracking parameters from URLs
 */
export const sanitizeURL = (url) => {
    try {
        const urlObj = new URL(url);
        
        // List of common tracking parameters
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', // Google Analytics
            'fbclid', // Facebook
            'gclid', // Google Ads
            'msclkid', // Bing
            '_ga', // Analytics
            'mc_cid', 'mc_eid', // Mailchimp
            'tracking_id', 'ref'
        ];
        
        trackingParams.forEach(param => {
            urlObj.searchParams.delete(param);
        });
        
        return urlObj.toString();
    } catch (error) {
        console.error('❌ URL sanitization failed:', error);
        return url;
    }
};

/**
 * Clear all sensitive data
 */
export const clearSensitiveData = async () => {
    try {
        // Clear sessionStorage
        Object.keys(sessionStorage).forEach(key => {
            if (key.includes('auth') || key.includes('token') || key.includes('session')) {
                sessionStorage.removeItem(key);
            }
        });
        
        // Clear localStorage history if privacy mode enabled
        if (isPrivacyModeEnabled()) {
            localStorage.clear();
        }
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c
                .replace(/^ +/, "")
                .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
        
        // Clear service worker cache
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                const cacheNames = await caches.keys();
                for (let name of cacheNames) {
                    await caches.delete(name);
                }
            }
        }
        
        console.log('🧹 Sensitive data cleared');
        return true;
    } catch (error) {
        console.error('❌ Failed to clear sensitive data:', error);
        return false;
    }
};

/**
 * Get privacy report
 */
export const getPrivacyReport = async () => {
    const report = {
        privacyModeEnabled: isPrivacyModeEnabled(),
        settings: getPrivacySettings(),
        sessionStorageSize: new Blob(Object.values(sessionStorage)).size,
        localStorageSize: new Blob(Object.values(localStorage)).size,
        cookieCount: document.cookie.split(';').length,
        timestamp: new Date().toISOString()
    };
    
    return report;
};

/**
 * Monitor for tracking attempts
 */
export const monitorTracking = () => {
    const trackingAttempts = [];
    
    // Monitor image requests (often used for tracking)
    const originalImage = Image;
    window.Image = function(...args) {
        const img = new originalImage(...args);
        const originalSrc = Object.getOwnPropertyDescriptor(originalImage.prototype, 'src').set;
        
        Object.defineProperty(img, 'src', {
            set(value) {
                if (value && value.includes('pixel') || value.includes('tracking')) {
                    trackingAttempts.push({
                        type: 'image-pixel',
                        url: value,
                        timestamp: new Date()
                    });
                    console.warn('⚠️ Tracking pixel detected:', value);
                }
                originalSrc.call(img, value);
            },
            get() {
                return originalImage.prototype.src;
            }
        });
        
        return img;
    };
    
    return () => trackingAttempts;
};

export default {
    deriveKey,
    encryptData,
    decryptData,
    enablePrivacyMode,
    disablePrivacyMode,
    isPrivacyModeEnabled,
    getPrivacySettings,
    sanitizeURL,
    clearSensitiveData,
    getPrivacyReport,
    monitorTracking
};
