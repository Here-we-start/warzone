@@ .. @@
   // Manager endpoints
   static async getManagers() {
     return this.request('/api/managers');
   }

   static async createManager(manager: any) {
+    console.log(`🔍 [API] Creating manager:`, manager);
     return this.request('/api/managers', {
       method: 'POST',
       body: JSON.stringify(manager)
     });
   }

   static async updateManager(id: string, manager: any) {
+    console.log(`🔍 [API] Updating manager: ${id}`, manager);
     return this.request(`/api/managers/${id}`, {
       method: 'PUT',
       body: JSON.stringify(manager)
     });
   }

   static async deleteManager(id: string) {
+    console.log(`🔍 [API] Deleting manager: ${id}`);
     return this.request(`/api/managers/${id}`, {
       method: 'DELETE'
     });
   }
@@ .. @@
   // NUOVO: Synchronization wrapper for dual local + database storage con DEBUG
   static async syncOperation<T>(
     operation: {
       localUpdate: () => void;
       apiCall: () => Promise<any>;
       storageKey?: string;
       storageData?: any;
       operationName: string;
     }
   ): Promise<{ success: boolean; error?: string; details?: any }> {
     try {
       console.log(`🔍 [DEBUG] Starting sync operation: ${operation.operationName}`);
       
       // 1. Update local state immediately (for responsive UI)
       operation.localUpdate();
       console.log(`✅ [DEBUG] Local update completed for: ${operation.operationName}`);
       
       // 2. Update localStorage if needed
       if (operation.storageKey && operation.storageData) {
         localStorage.setItem(operation.storageKey, JSON.stringify(operation.storageData));
         console.log(`💾 [DEBUG] localStorage backup saved for: ${operation.storageKey}`);
+        
+        // Broadcast per sincronizzazione cross-device
+        if (typeof BroadcastChannel !== 'undefined') {
+          const channel = new BroadcastChannel('warzone-global-sync');
+          channel.postMessage({
+            type: 'data-update',
+            key: operation.storageKey,
+            value: operation.storageData,
+            timestamp: Date.now()
+          });
+          channel.close();
          console.log(`📡 [DEBUG] Broadcast sent for: ${operation.storageKey}`);
+        }
       }
       
       // 3. Sync with database with detailed debug
       try {
         console.log(`🌐 [DEBUG] Attempting database sync for: ${operation.operationName}`);
         console.log(`📡 [DEBUG] Data being sent:`, operation.storageData);
         
         const result = await operation.apiCall();
         console.log(`✅ [DEBUG] Database sync successful:`, result);
         
         console.log(`✅ ${operation.operationName} synced successfully`);
         return { success: true };
         
       } catch (dbError: any) {
         console.error(`❌ [DEBUG] Database sync failed for ${operation.operationName}:`, {
           error: dbError.message,
           status: dbError.status,
           stack: dbError.stack
         });

         // Log dettagliato dell'errore per debug
         if (dbError.response) {
           try {
             const errorText = await dbError.response.text();
             console.error(`📄 [DEBUG] Backend error response:`, errorText);
           } catch (e) {
             console.error(`📄 [DEBUG] Could not read error response`);
           }
         }
        
        // Trigger storage event per same-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
          key: operation.storageKey,
          newValue: JSON.stringify(operation.storageData),
          oldValue: localStorage.getItem(operation.storageKey)
        }));

         console.warn(`⚠️ ${operation.operationName} database sync failed:`, dbError);
         
          success: true, // Considera successo se salvato localmente
           success: false, 
           error: dbError.message || 'Database sync failed',
           details: {
             status: dbError.status,
             operation: operation.operationName,
             timestamp: new Date().toISOString()
           }
         };
       }
       
     } catch (error: any) {
       console.error(`💥 [DEBUG] Critical error in sync operation ${operation.operationName}:`, error);
       return { 
         error: error.message || 'Critical sync operation failed' 
       };
     }
   }

export default syncOperation
        // Anche se il database fallisce, i dati sono salvati localmente
        console.log(`💾 ${operation.operationName} saved locally, will work offline`);
        