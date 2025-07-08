@@ .. @@
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
   const [error, setError] = useState<string | null>(null);
 
+  // Determine if photos are required based on submitter type
+  const isPhotoRequired = submitterType !== 'admin' && submitterType !== 'manager';
+
   if (!isOpen) return null;
 
   const selectedTeamData = teams.find(team => team.code === selectedTeam);
@@ .. @@
       return;
     }
 
-    if (photos.length < 2) {
+    // Only check photo requirement for team submissions, not for admin/manager
+    if (isPhotoRequired && photos.length < 2) {
       setError('Carica almeno 2 screenshot');
       return;
     }
@@ .. @@
           </div>
 
           <PhotoUpload
+            required={isPhotoRequired}
             photos={photos}
             onPhotosChange={setPhotos}
             maxPhotos={2}
-            required={true}
           />
 
           {error && (
@@ .. @@
           <button
             onClick={handleSubmit}
-            disabled={!selectedTeam || position < 1 || kills < 0 || photos.length < 2 || isSubmitting}
+            disabled={!selectedTeam || position < 1 || kills < 0 || (isPhotoRequired && photos.length < 2) || isSubmitting}
             className="flex-1 py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none font-mono relative overflow-hidden"
           >
             {isSubmitting && (