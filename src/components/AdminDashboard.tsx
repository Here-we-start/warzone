@@ .. @@
   const [showManualSubmission, setShowManualSubmission] = useState(false);
+  const [copied, setCopied] = useState<string | null>(null);
 
   const approveSubmission = (submissionId: string) => {
     const submission = pendingSubmissions.find(s => s.id === submissionId);