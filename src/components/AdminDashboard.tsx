@@ .. @@
  const [showManualSubmission, setShowManualSubmission] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Raggruppa le submission pendenti per team
  const pendingByTeam = pendingSubmissions.reduce((acc, submission) => {
  }
  )
@@ .. @@
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
    }
  }
@@ .. @@
                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                        <span className="text-white font-mono text-lg">{code}</span>
                        <button
                          onClick={() => copyToClipboard(code)}
                          className="flex items-center space-x-1 px-3 py-1 bg-ice-blue/20 border border-ice-blue/50 text-ice-blue rounded text-sm font-mono hover:bg-ice-blue/30 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copied === code ? 'COPIATO!' : 'COPIA'}</span>
                        <div className="text-white font-mono text-lg">{manager.code}</div>
                        <div className="text-purple-400/60 text-sm font-mono">{manager.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(manager.code)}
                        className="flex items-center space-x-1 px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded text-sm font-mono hover:bg-purple-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === manager.code ? 'COPIATO!' : 'COPIA'}</span>
                      </button>
@@ .. @@
                        <div className="text-green-400/60 text-sm font-mono">{team.name}</div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(team.code)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 rounded text-sm font-mono hover:bg-green-500/30 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copied === team.code ? 'COPIATO!' : 'COPIA'}</span>
                      </button>