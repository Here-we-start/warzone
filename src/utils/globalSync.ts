@@ .. @@
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
       
+      // Trigger storage event per cross-tab sync
+      window.dispatchEvent(new StorageEvent('storage', {
+        key,
+        newValue: serialized,
+        oldValue: localStorage.getItem(key)
+      }));
+      
       console.log(`💾 Dati salvati: ${key}`);
       return true;
     } catch (error) {
       console.error(`❌ Errore salvataggio ${key}:`, error);
       return false;
     }
   }