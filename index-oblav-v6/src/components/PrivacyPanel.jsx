import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Wifi, WifiOff, Eye, EyeOff, Database, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { isOnline, addOnlineListener, getOfflineStats, syncPendingActions } from '../lib/offline';
import { 
    enablePrivacyMode, 
    disablePrivacyMode, 
    isPrivacyModeEnabled, 
    getPrivacySettings,
    getPrivacyReport,
    clearSensitiveData
} from '../lib/privacy';

const PrivacyPanel = ({ theme = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [online, setOnline] = useState(isOnline());
    const [privacyMode, setPrivacyMode] = useState(isPrivacyModeEnabled());
    const [offlineStats, setOfflineStats] = useState({ cached: 0, syncing: 0, size: 0 });
    const [privacyReport, setPrivacyReport] = useState(null);
    const [showAlert, setShowAlert] = useState(null);

    const themeClasses = {
        dark: {
            bg: 'bg-slate-900 border-slate-700',
            text: 'text-white',
            panel: 'bg-slate-800',
            button: 'bg-blue-600 hover:bg-blue-700',
            toggle: 'bg-slate-700',
            success: 'text-green-400',
            warning: 'text-yellow-400'
        },
        light: {
            bg: 'bg-white border-gray-300',
            text: 'text-gray-900',
            panel: 'bg-gray-50',
            button: 'bg-blue-500 hover:bg-blue-600',
            toggle: 'bg-gray-200',
            success: 'text-green-600',
            warning: 'text-yellow-600'
        },
        rose: {
            bg: 'bg-rose-950 border-rose-700',
            text: 'text-rose-50',
            panel: 'bg-rose-900',
            button: 'bg-rose-600 hover:bg-rose-700',
            toggle: 'bg-rose-700',
            success: 'text-rose-300',
            warning: 'text-yellow-300'
        }
    };

    const colors = themeClasses[theme];

    useEffect(() => {
        addOnlineListener(setOnline);
    }, []);

    useEffect(() => {
        const updateStats = async () => {
            const stats = await getOfflineStats();
            setOfflineStats(stats);
        };

        updateStats();
        const interval = setInterval(updateStats, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const updateReport = async () => {
            const report = await getPrivacyReport();
            setPrivacyReport(report);
        };

        if (isOpen) {
            updateReport();
        }
    }, [isOpen]);

    const handlePrivacyToggle = async () => {
        if (!privacyMode) {
            enablePrivacyMode();
            setPrivacyMode(true);
            setShowAlert({ type: 'success', message: '🔐 Приватный режим включён' });
        } else {
            disablePrivacyMode();
            setPrivacyMode(false);
            setShowAlert({ type: 'info', message: '🔓 Приватный режим отключён' });
        }
        setTimeout(() => setShowAlert(null), 3000);
    };

    const handleSync = async () => {
        if (online) {
            await syncPendingActions();
            const stats = await getOfflineStats();
            setOfflineStats(stats);
            setShowAlert({ type: 'success', message: '✅ Синхронизация завершена' });
            setTimeout(() => setShowAlert(null), 3000);
        }
    };

    const handleClearData = async () => {
        if (window.confirm('Вы уверены? Это удалит всё кэшированные данные.')) {
            await clearSensitiveData();
            setShowAlert({ type: 'success', message: '🧹 Данные очищены' });
            setTimeout(() => setShowAlert(null), 3000);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className={`fixed bottom-20 right-4 z-50 ${colors.text}`}>
            {/* Main Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`${colors.button} rounded-full p-3 shadow-lg text-white flex items-center gap-2 transition-all`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <Shield size={20} />
                <span className="text-xs font-semibold hidden sm:inline">
                    {online ? '🌐' : '📡'} {privacyMode ? '🔐' : ''}
                </span>
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`absolute bottom-16 right-0 w-80 ${colors.panel} border ${colors.bg} rounded-xl shadow-xl p-4 space-y-3`}
                    >
                        {/* Status */}
                        <div className="space-y-3">
                            {/* Online Status */}
                            <div className={`flex items-center justify-between p-3 rounded-lg ${colors.toggle}`}>
                                <div className="flex items-center gap-2">
                                    {online ? (
                                        <Wifi className={colors.success} size={18} />
                                    ) : (
                                        <WifiOff className={colors.warning} size={18} />
                                    )}
                                    <span className="text-sm font-medium">
                                        {online ? 'Онлайн' : 'Офлайн'}
                                    </span>
                                </div>
                                <span className={`text-xs ${online ? colors.success : colors.warning}`}>
                                    {online ? '✓ Соединение' : '✗ Нет сети'}
                                </span>
                            </div>

                            {/* Privacy Mode */}
                            <div className={`flex items-center justify-between p-3 rounded-lg ${colors.toggle}`}>
                                <div className="flex items-center gap-2">
                                    {privacyMode ? (
                                        <Eye className={colors.success} size={18} />
                                    ) : (
                                        <EyeOff size={18} />
                                    )}
                                    <span className="text-sm font-medium">Приватный режим</span>
                                </div>
                                <motion.button
                                    onClick={handlePrivacyToggle}
                                    className={`relative w-12 h-6 rounded-full transition-all ${
                                        privacyMode ? 'bg-green-500' : colors.toggle
                                    }`}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <motion.div
                                        className="absolute w-5 h-5 bg-white rounded-full"
                                        animate={{ x: privacyMode ? 22 : 2 }}
                                    />
                                </motion.button>
                            </div>
                        </div>

                        {/* Offline Stats */}
                        <div className="border-t border-gray-600 pt-3">
                            <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                                <Database size={16} />
                                Кэш офлайн
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className={`p-2 rounded ${colors.toggle}`}>
                                    <div className={colors.success}>{offlineStats.cached}</div>
                                    <div className="text-gray-400">Страниц</div>
                                </div>
                                <div className={`p-2 rounded ${colors.toggle}`}>
                                    <div className={colors.warning}>{offlineStats.syncing}</div>
                                    <div className="text-gray-400">К синку</div>
                                </div>
                                <div className={`p-2 rounded ${colors.toggle}`}>
                                    <div className="text-blue-400">{formatSize(offlineStats.size)}</div>
                                    <div className="text-gray-400">Размер</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-gray-600 pt-3 space-y-2">
                            {online && offlineStats.syncing > 0 && (
                                <motion.button
                                    onClick={handleSync}
                                    className={`w-full ${colors.button} text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <CheckCircle size={14} />
                                    Синхронизировать
                                </motion.button>
                            )}

                            <motion.button
                                onClick={handleClearData}
                                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Trash2 size={14} />
                                Очистить данные
                            </motion.button>
                        </div>

                        {/* Privacy Report (if available) */}
                        {privacyReport && (
                            <div className="border-t border-gray-600 pt-3 text-xs space-y-1">
                                <div className="font-semibold mb-2">Отчёт приватности</div>
                                <div className="space-y-1 text-gray-400">
                                    <div>📦 LocalStorage: {formatSize(privacyReport.localStorageSize)}</div>
                                    <div>🍪 Cookies: {privacyReport.cookieCount}</div>
                                    <div className="text-[10px]">{privacyReport.timestamp}</div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alert */}
            <AnimatePresence>
                {showAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute -top-12 right-0 p-2 rounded-lg text-xs font-semibold text-white ${
                            showAlert.type === 'success' ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                    >
                        {showAlert.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PrivacyPanel;
