import { useState, useEffect } from 'react';

// Global storage hook that works across devices and IPs
export function useGlobalStorage<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online');

  // Storage keys for different data types
  const getStorageKey = (key: string) => `warzone_global_${key}`;
  const getBackupKey = (key: string) => `warzone_backup_${key}`;
  const getTimestampKey = (key: string) => `warzone_timestamp_${key}`;

  // Load data from multiple sources
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Try localStorage first
      const localData = localStorage.getItem(getStorageKey(key));
      if (localData) {
        const parsed = JSON.parse(localData);
        setData(parsed);
        console.log(`✅ Loaded ${key} from localStorage:`, parsed);
        return parsed;
      }

      // Try backup storage
      const backupData = localStorage.getItem(getBackupKey(key));
      if (backupData) {
        const parsed = JSON.parse(backupData);
        setData(parsed);
        // Restore to main storage
        localStorage.setItem(getStorageKey(key), backupData);
        console.log(`🔄 Restored ${key} from backup:`, parsed);
        return parsed;
      }

      // Try sessionStorage as fallback
      const sessionData = sessionStorage.getItem(getStorageKey(key));
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setData(parsed);
        // Copy to localStorage
        localStorage.setItem(getStorageKey(key), sessionData);
        console.log(`📱 Loaded ${key} from sessionStorage:`, parsed);
        return parsed;
      }

      console.log(`🆕 Initializing ${key} with default value:`, initialValue);
      setData(initialValue);
      return initialValue;
    } catch (error) {
      console.error(`❌ Error loading ${key}:`, error);
      setData(initialValue);
      return initialValue;
    } finally {
      setIsLoading(false);
    }
  };

  // Save data to multiple storage locations
  const saveData = async (value: T) => {
    try {
      const serialized = JSON.stringify(value);
      const timestamp = Date.now().toString();

      // Save to localStorage
      localStorage.setItem(getStorageKey(key), serialized);
      localStorage.setItem(getTimestampKey(key), timestamp);

      // Create backup
      const currentData = localStorage.getItem(getStorageKey(key));
      if (currentData) {
        localStorage.setItem(getBackupKey(key), currentData);
      }

      // Save to sessionStorage as additional backup
      sessionStorage.setItem(getStorageKey(key), serialized);

      // Try to save to IndexedDB for larger storage
      try {
        if ('indexedDB' in window) {
          const request = indexedDB.open('WarzoneDB', 1);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('tournaments')) {
              db.createObjectStore('tournaments', { keyPath: 'key' });
            }
          };
          request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['tournaments'], 'readwrite');
            const store = transaction.objectStore('tournaments');
            store.put({ key, value: serialized, timestamp });
          };
        }
      } catch (idbError) {
        console.warn('IndexedDB save failed:', idbError);
      }

      console.log(`💾 Saved ${key} globally:`, value);
      
      // Broadcast to other tabs/windows
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('warzone-global-sync');
        channel.postMessage({
          type: 'data-update',
          key,
          value,
          timestamp: Date.now()
        });
      }

      // Trigger storage event for same-tab updates
      window.dispatchEvent(new StorageEvent('storage', {
        key: getStorageKey(key),
        newValue: serialized,
        oldValue: JSON.stringify(data)
      }));

    } catch (error) {
      console.error(`❌ Error saving ${key}:`, error);
      // Try to recover from backup
      try {
        const backup = localStorage.getItem(getBackupKey(key));
        if (backup) {
          const backupData = JSON.parse(backup);
          setData(backupData);
          console.log(`🔄 Recovered ${key} from backup after save error`);
        }
      } catch (backupError) {
        console.error(`❌ Backup recovery failed for ${key}:`, backupError);
      }
    }
  };

  // Update data function
  const updateData = async (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(data) : value;
    setData(valueToStore);
    await saveData(valueToStore);
  };

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, [key]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey(key) && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setData(newValue);
          console.log(`🔄 Synced ${key} from storage event:`, newValue);
        } catch (error) {
          console.error(`❌ Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    // Listen for BroadcastChannel messages
    let channel: BroadcastChannel | null = null;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel('warzone-global-sync');
      channel.onmessage = (event) => {
        if (event.data.type === 'data-update' && event.data.key === key) {
          setData(event.data.value);
          console.log(`📡 Synced ${key} from broadcast:`, event.data.value);
        }
      };
    }

    // Monitor connection status
    const handleOnline = () => {
      setConnectionStatus('online');
      // Reload data when coming back online
      loadData();
    };
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection status
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    // Periodic data validation and sync
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        // Check if data is still valid
        try {
          const currentItem = localStorage.getItem(getStorageKey(key));
          if (!currentItem) {
            const backup = localStorage.getItem(getBackupKey(key));
            if (backup) {
              localStorage.setItem(getStorageKey(key), backup);
              const backupData = JSON.parse(backup);
              setData(backupData);
              console.log(`🔄 Auto-recovered ${key} from backup`);
            }
          }
        } catch (error) {
          console.error(`❌ Data validation failed for ${key}:`, error);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (channel) {
        channel.close();
      }
      clearInterval(syncInterval);
    };
  }, [key]);

  return [data, updateData, { isLoading, connectionStatus }] as const;
}

// Enhanced real-time data hook with global sync
export function useRealTimeGlobalData<T>(key: string, initialValue: T) {
  const [data, updateData, { isLoading, connectionStatus }] = useGlobalStorage(key, initialValue);

  // Enhanced update function with connection awareness
  const enhancedUpdate = async (value: T | ((val: T) => T)) => {
    if (connectionStatus === 'offline') {
      console.warn(`⚠️ Offline mode: ${key} will sync when connection is restored`);
    }

    await updateData(value);
  };

  return [data, enhancedUpdate, { isLoading, connectionStatus }] as const;
}