@@ .. @@
 interface MultiplierSettingsProps {
   isOpen: boolean;
   onClose: () => void;
+  multipliers?: Record<number, number>;
+  onSave?: (multipliers: Record<number, number>) => void;
 }
 
 const DEFAULT}
_MULTIPLIERS = {
@@ .. @@
 export default function MultiplierSettings({ isOpen, onClose }: MultiplierSettingsProps) {
+export default function MultiplierSettings({ 
+  isOpen, 
+  onClose, 
+  multipliers: externalMultipliers,
+  onSave 
+}: MultiplierSettingsProps) {
   const [multipliers, setMultipliers] = useLocalStorage('multipliers', DEFAULT_MULTIPLIERS);
+  const [multipliers, setMultipliers] = useLocalStorage('multipliers', externalMultipliers || DEFAULT_MULTIPLIERS);
   const [tempMultipliers, setTempMultipliers] = useState(multipliers);
@@ .. @@
   const handleSave = () => {
     setMultipliers(tempMultipliers);
+    if (onSave) {
+      onSave(tempMultipliers);
+    }
     onClose();
   };
@@ .. @@
           <div className="flex space-x-3">
             <button
               onClick={onClose}
               className="px-6 py-3 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono"
             >
               ANNULLA
             </button>
             <button
               onClick={handleSave}
               className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 font-mono"
             >
               <Save className="w-4 h-4" />
               <span>SALVA</span>
             </button>
           </div>
         </div>
+
+        <div className="mt-4 p-4 bg-ice-blue/10 border border-ice-blue/30 rounded-lg">
+          <div className="text-ice-blue font-mono text-sm">
+            <div className="font-bold mb-2">ANTEPRIMA CALCOLO:</div>
+            <div className="grid grid-cols-2 gap-4 text-xs">
+              <div>1° posto, 10 kills = {(10 * tempMultipliers[1]).toFixed(1)} punti</div>
+              <div>5° posto, 8 kills = {(8 * tempMultipliers[5]).toFixed(1)} punti</div>
+              <div>10° posto, 5 kills = {(5 * tempMultipliers[10]).toFixed(1)} punti</div>
+              <div>20° posto, 2 kills = {(2 * tempMultipliers[20]).toFixed(1)} punti</div>
+            </div>
+          </div>
+        </div>
       </GlassPanel>