@@ .. @@
   const createManager = () => {
     if (!managerName.trim()) return;

     const code = generateUniqueManagerCode(managers);
     const newManager: Manager = {
       id: `mgr-${Date.now()}`,
       name: managerName.trim(),
       code,
       permissions: ['scores', 'pending', 'adjustments', 'multipliers'],
       createdAt: Date.now(),
       createdBy: 'admin',
       isActive: true
     };

-    setManagers(prev => ({ ...prev, [code]: newManager }));
-    setManagerName('');
-    setShowManagerCode({ name: managerName.trim(), code });
-
-    // Log action
-    logAction(
-      auditLogs,
-      setAuditLogs,
-      'MANAGER_CREATED',
-      `Nuovo gestore creato: ${managerName.trim()} (${code})`,
-      'admin',
-      'admin',
-      { managerCode: code, managerName: managerName.trim() }
-    );
+    // Usa syncOperation per sincronizzazione robusta
+    ApiService.syncOperation({
+      localUpdate: () => {
+        setManagers(prev => ({ ...prev, [code]: newManager }));
+        setManagerName('');
+        setShowManagerCode({ name: managerName.trim(), code });
+      },
+      apiCall: () => ApiService.createManager(newManager),
+      storageKey: 'managers',
+      storageData: { ...managers, [code]: newManager },
+      operationName: `Manager Creation: ${managerName.trim()}`
+    }).then(result => {
+      if (result.success) {
+        console.log('✅ Manager created and synced successfully');
+      } else {
+        console.warn('⚠️ Manager created locally, database sync failed:', result.error);
+        alert('⚠️ Gestore creato localmente. Sincronizzazione database fallita, ma il gestore funzionerà ugualmente.');
+      }
+    });
+
+    // Log action
+    logAction(
+      auditLogs,
+      setAuditLogs,
+      'MANAGER_CREATED',
+      `Nuovo gestore creato: ${managerName.trim()} (${code})`,
+      'admin',
+      'admin',
+      { managerCode: code, managerName: managerName.trim() }
+    );
   };

   const toggleManagerStatus = (managerCode: string) => {
     const manager = managers[managerCode];
     if (!manager) return;

     const newStatus = !manager.isActive;
-    setManagers(prev => ({
-      ...prev,
-      [managerCode]: { ...manager, isActive: newStatus }
-    }));
+    
+    const updatedManager = { ...manager, isActive: newStatus };
+    const u     )
   }
pdatedManagers = { ...managers, [managerCode]: updatedManager };
+
+    // Sincronizza con database
+    ApiService.syncOperation({
+      localUpdate: () => {
+        setManagers(prev => ({
+          ...prev,
+          [managerCode]: updatedManager
+        }));
+      },
+      apiCall: () => ApiService.updateManager(manager.id, updatedManager),
+      storageKey: 'managers',
+      storageData: updatedManagers,
+      operationName: `Manager Status Change: ${manager.name}`
+    });

     // Log action
     logAction(
@@ .. @@
   const deleteManager = (managerCode: string) => {
     const manager = managers[managerCode];
     if (!manager) return;

     if (!confirm(`Sei sicuro di voler eliminare il gestore ${manager.name}?`)) return;

-    setManagers(prev => {
-      const 
   }newManagers = { ...prev };
-      delete newManagers[managerCode];
-      return newManagers;
-    });
+    const updatedManagers = { ...managers };
+    delete updatedManagers[managerCode];
+
+    // Sincronizza con database
+    ApiService.syncOperation({
+      localUpdate: () => {
+        setManagers(prev => {
+          const newManagers = { ...prev };
+          delete newManagers[managerCode];
+          return newManagers;
+        });
+      },
+      apiCall: () => ApiService.deleteManager(manager.id),
+      storageKey: 'managers',
+      storageData: updatedManagers,
+      operationName: `Manager Deletion: ${manager.name}`
+    });

     // Log action