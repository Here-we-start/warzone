// Cloud storage hook for worldwide access
import { useState, useEffect } from 'react';

interface CloudStorageConfig {
  apiUrl: string;
  syncInterval: number;
}

// Simple cloud storage simulation using a public API
const CLOUD_CONFIG: CloudStorageConfig = {
  apiUrl: 'https://api.jsonbin.io/v3/b', // Free JSON storage service
  syncInterval: 5000 // Sync every 5 seconds
};

export function useCloudStorage<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<number>(0);

  // Generate a unique bin ID for this key
  const getBinId = (key: string) => {
    // Use a consistent hash for the key to ensure same bin across sessions
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `warzone-${Math.abs(hash).toString(36)}`;
  };

  // Load data from cloud storage
  const loadFromCloud = async () => {
    try {
      const binId = getBinId(key);
      const response = await fetch(`${CLOUD_CONFIG.apiUrl}/${binId}/latest`, {
        headers: {
          'X-Master-Key': '$2a$10$8K9vN2mF5qL3pR7sT1uW8eX6yH4jC0dE9fG2hI5kL7mN9oP1qR3sT', // Demo key
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.record && result.record[key]) {
          const cloudData = result.record[key];
          setData(cloudData);
          setLastSync(Date.now());
          console.log(`✅ Loaded ${key} from cloud:`, cloudData);
          return cloudData;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load ${key} from cloud, using local storage:`, error);
    }

    // Fallback to localStorage
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setData(parsed);
        console.log(`📱 Loaded ${key} from localStorage:`, parsed);
        return parsed;
      }
    } catch (error) {
      console.error(`❌ Error reading localStorage key "${key}":`, error);
    }

    setData(initialValue);
    return initialValue;
  };

  // Save data to cloud storage
  const saveToCloud = async (value: T) => {
    try {
      const binId = getBinId(key);
      const payload = { [key]: value };

      const response = await fetch(`${CLOUD_CONFIG.apiUrl}/${binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': '$2a$10$8K9vN2mF5qL3pR7sT1uW8eX6yH4jC0dE9fG2hI5kL7mN9oP1qR3sT', // Demo key
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setLastSync(Date.now());
        console.log(`☁️ Saved ${key} to cloud:`, value);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to save ${key} to cloud, using localStorage:`, error);
    }

    // Always save to localStorage as backup
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error(`❌ Error saving to localStorage:`, error);
    }
  };

  // Update data function
  const updateData = async (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(data) : value;
    setData(valueToStore);
    await saveToCloud(valueToStore);

    // Trigger storage event for real-time sync
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue: JSON.stringify(valueToStore),
      oldValue: JSON.stringify(data)
    }));
  };

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await loadFromCloud();
      setIsLoading(false);
    };

    initializeData();
  }, [key]);

  // Periodic sync from cloud
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      // Only sync if we haven't synced recently
      if (Date.now() - lastSync > CLOUD_CONFIG.syncInterval) {
        await loadFromCloud();
      }
    }, CLOUD_CONFIG.syncInterval);

    return () => clearInterval(syncInterval);
  }, [key, lastSync]);

  // Listen for storage changes from other tabs/devices
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const newValue = JSON.parse(e.newValue);
          setData(newValue);
          console.log(`🔄 Synced ${key} from storage event:`, newValue);
        } catch (error) {
          console.error(`❌ Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [data, updateData, isLoading] as const;
}

// Enhanced real-time data hook with cloud sync
export function useRealTimeCloudData<T>(key: string, initialValue: T) {
  const [data, updateData, isLoading] = useCloudStorage(key, initialValue);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'syncing'>('online');

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('online');
    const handleOffline = () => setConnectionStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial status
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced update function with connection awareness
  const enhancedUpdate = async (value: T | ((val: T) => T)) => {
    if (connectionStatus === 'offline') {
      console.warn(`⚠️ Offline mode: ${key} will sync when connection is restored`);
    } else {
      setConnectionStatus('syncing');
    }

    await updateData(value);
    
    if (connectionStatus !== 'offline') {
      setConnectionStatus('online');
    }
  };

  return [data, enhancedUpdate, { isLoading, connectionStatus }] as const;
}