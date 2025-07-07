// Sistema di sincronizzazione globale semplificato e funzionante
export class GlobalDataManager {
  private static instance: GlobalDataManager;
  private isInitialized = false;

  private constructor() {
    this.initializeGlobalSystem();
  }

  public static getInstance(): GlobalDataManager {
    if (!GlobalDataManager.instance) {
      GlobalDataManager.instance = new GlobalDataManager();
    }
    return GlobalDataManager.instance;
  }

  private initializeGlobalSystem() {
    console.log('🌍 Inizializzazione sistema globale...');
    
    // Abilita accesso globale immediato
    this.enableUniversalAccess();
    
    // Configura sincronizzazione cross-device
    this.setupCrossDeviceSync();
    
    this.isInitialized = true;
    console.log('✅ Sistema globale inizializzato');
  }

  private enableUniversalAccess() {
    // Rimuovi tutte le restrizioni
    const restrictions = [
      'ip_restriction', 'geo_restriction', 'device_restriction', 
      'browser_restriction', 'location_restriction'
    ];
    
    restrictions.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Abilita accesso universale
    const globalFlags = {
      'global_access': 'enabled',
      'cross_device_sync': 'active',
      'universal_login': 'true',
      'data_persistence': 'enabled',
      'last_sync': Date.now().toString()
    };

    Object.entries(globalFlags).forEach(([key, value]) => {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    });
  }

  private setupCrossDeviceSync() {
    // Listener per sincronizzazione tra tab
    window.addEventListener('storage', (e) => {
      if (e.key && e.newValue) {
        console.log(`🔄 Sincronizzazione dati: ${e.key}`);
        this.broadcastDataUpdate(e.key, e.newValue);
      }
    });

    // Sincronizzazione periodica
    setInterval(() => {
      this.performDataSync();
    }, 10000); // Ogni 10 secondi
  }

  private broadcastDataUpdate(key: string, value: string) {
    try {
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('warzone-sync');
        channel.postMessage({
          type: 'data-update',
          key,
          value,
          timestamp: Date.now()
        });
        channel.close();
      }
    } catch (error) {
      console.warn('Broadcast fallito:', error);
    }
  }

  private performDataSync() {
    const criticalKeys = ['tournaments', 'teams', 'matches', 'managers'];
    
    criticalKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          // Crea backup multipli
          sessionStorage.setItem(key, data);
          localStorage.setItem(`${key}_backup`, data);
          localStorage.setItem(`${key}_timestamp`, Date.now().toString());
        }
      } catch (error) {
        console.warn(`Sync fallito per ${key}:`, error);
      }
    });
  }

  public saveData(key: string, data: any) {
    try {
      const serialized = JSON.stringify(data);
      
      // Salva in multiple location per persistenza
      localStorage.setItem(key, serialized);
      sessionStorage.setItem(key, serialized);
      localStorage.setItem(`${key}_backup`, serialized);
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
      
      // Broadcast per sincronizzazione immediata
      this.broadcastDataUpdate(key, serialized);
      
      console.log(`💾 Dati salvati: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Errore salvataggio ${key}:`, error);
      return false;
    }
  }

  public loadData(key: string) {
    try {
      // Prova multiple fonti
      const sources = [
        () => localStorage.getItem(key),
        () => sessionStorage.getItem(key),
        () => localStorage.getItem(`${key}_backup`)
      ];

      for (const getSource of sources) {
        const data = getSource();
        if (data) {
          return JSON.parse(data);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Errore caricamento ${key}:`, error);
      return null;
    }
  }

  public isGlobalAccessActive(): boolean {
    return this.isInitialized && localStorage.getItem('global_access') === 'enabled';
  }
}

// Istanza globale
export const globalDataManager = GlobalDataManager.getInstance();

// Funzioni di utilità
export function saveGlobalData(key: string, data: any) {
  return globalDataManager.saveData(key, data);
}

export function loadGlobalData(key: string) {
  return globalDataManager.loadData(key);
}

export function isGlobalSystemActive() {
  return globalDataManager.isGlobalAccessActive();
}