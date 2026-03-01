/**
 * Offline-first caching and sync system
 * Allows app to work without internet connection
 */

const DB_NAME = 'OblavOffline';
const DB_VERSION = 1;
const STORE_NAME = 'pages';
const SYNC_QUEUE_STORE = 'syncQueue';

let db = null;

/**
 * Initialize IndexedDB for offline storage
 */
export const initOfflineDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('❌ Failed to open IndexedDB');
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('✅ Offline DB initialized');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Store for caching page data
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'url' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }

            // Store for syncing actions when offline
            if (!database.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
                database.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
            }

            console.log('✅ Database schema created');
        };
    });
};

/**
 * Save response data for offline access
 */
export const cacheForOffline = async (url, data) => {
    if (!db) {
        console.warn('⚠️ Offline DB not ready');
        return;
    }

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry = {
            url,
            data,
            timestamp: Date.now()
        };

        const request = store.put(entry);

        request.onerror = () => {
            console.error('❌ Failed to cache for offline:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            console.log(`💾 Cached for offline: ${url}`);
            resolve(true);
        };
    });
};

/**
 * Retrieve offline cached data
 */
export const getOfflineData = async (url) => {
    if (!db) return null;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(url);

        request.onerror = () => {
            reject(request.error);
        };

        request.onsuccess = () => {
            if (request.result) {
                console.log(`📂 Retrieved from offline cache: ${url}`);
                resolve(request.result.data);
            } else {
                resolve(null);
            }
        };
    });
};

/**
 * Queue action for sync when online
 */
export const queueForSync = async (action, data) => {
    if (!db) return false;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
        const store = transaction.objectStore(SYNC_QUEUE_STORE);

        const entry = {
            action,
            data,
            timestamp: Date.now(),
            synced: false
        };

        const request = store.add(entry);

        request.onerror = () => {
            console.error('❌ Failed to queue for sync:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            console.log(`📤 Queued for sync: ${action}`);
            resolve(true);
        };
    });
};

/**
 * Get all pending sync actions
 */
export const getPendingSyncActions = async () => {
    if (!db) return [];

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SYNC_QUEUE_STORE], 'readonly');
        const store = transaction.objectStore(SYNC_QUEUE_STORE);
        const request = store.getAll();

        request.onerror = () => {
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
};

/**
 * Mark sync action as synced
 */
export const markAsSynced = async (id) => {
    if (!db) return false;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
        const store = transaction.objectStore(SYNC_QUEUE_STORE);
        const request = store.get(id);

        request.onsuccess = () => {
            const entry = request.result;
            if (entry) {
                entry.synced = true;
                store.put(entry);
            }
            resolve(true);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
};

/**
 * Clear all offline data
 */
export const clearOfflineDB = async () => {
    if (!db) return;

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME, SYNC_QUEUE_STORE], 'readwrite');

        transaction.objectStore(STORE_NAME).clear();
        transaction.objectStore(SYNC_QUEUE_STORE).clear();

        transaction.onerror = () => {
            reject(transaction.error);
        };

        transaction.oncomplete = () => {
            console.log('🧹 Offline database cleared');
            resolve(true);
        };
    });
};

/**
 * Get offline cache stats
 */
export const getOfflineStats = async () => {
    if (!db) return { cached: 0, syncing: 0, size: 0 };

    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME, SYNC_QUEUE_STORE], 'readonly');

        let cached = 0;
        let syncing = 0;
        let size = 0;

        const storeRequest = transaction.objectStore(STORE_NAME).getAll();
        storeRequest.onsuccess = () => {
            cached = storeRequest.result.length;
            size = JSON.stringify(storeRequest.result).length;
        };

        const syncRequest = transaction.objectStore(SYNC_QUEUE_STORE).getAll();
        syncRequest.onsuccess = () => {
            syncing = syncRequest.result.filter(r => !r.synced).length;
        };

        transaction.oncomplete = () => {
            resolve({ cached, syncing, size });
        };
    });
};

/**
 * Check if device is online
 */
export const isOnline = () => {
    return navigator.onLine;
};

/**
 * Listen to online/offline events
 */
export const addOnlineListener = (callback) => {
    window.addEventListener('online', () => {
        console.log('🌐 Device came online');
        callback(true);
    });

    window.addEventListener('offline', () => {
        console.log('📡 Device went offline');
        callback(false);
    });
};

/**
 * Sync pending actions when online
 */
export const syncPendingActions = async () => {
    if (!isOnline()) {
        console.log('⏳ Still offline, will sync later');
        return;
    }

    const actions = await getPendingSyncActions();
    const pending = actions.filter(a => !a.synced);

    console.log(`📤 Syncing ${pending.length} pending actions...`);

    for (const action of pending) {
        try {
            // Simulate sync - replace with actual API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            await markAsSynced(action.id);
            console.log(`✅ Synced: ${action.action}`);
        } catch (error) {
            console.error(`❌ Failed to sync ${action.action}:`, error);
        }
    }
};

export default {
    initOfflineDB,
    cacheForOffline,
    getOfflineData,
    queueForSync,
    getPendingSyncActions,
    markAsSynced,
    clearOfflineDB,
    getOfflineStats,
    isOnline,
    addOnlineListener,
    syncPendingActions
};
