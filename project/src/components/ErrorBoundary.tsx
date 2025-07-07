import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import GlassPanel from './GlassPanel';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log error to console and external service
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // Send to error tracking service
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
          <GlassPanel className="w-full max-w-2xl p-6 sm:p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 mb-4 relative">
                <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-400" />
                <div className="absolute inset-0 rounded-full bg-red-400/10 animate-ping" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-mono">
                ERRORE SISTEMA
              </h1>
              <p className="text-red-400/80 font-mono text-sm sm:text-base">
                Si è verificato un errore imprevisto nell'applicazione
              </p>
            </div>

            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
              <h3 className="text-red-400 font-mono font-bold mb-2 text-sm sm:text-base">
                Dettagli Errore:
              </h3>
              <div className="text-red-400/80 font-mono text-xs sm:text-sm break-all">
                {this.state.error?.message || 'Errore sconosciuto'}
              </div>
              {import.meta.env.DEV && this.state.error?.stack && (
                <details className="mt-2">
                  <summary className="text-red-400/60 cursor-pointer text-xs">
                    Stack Trace (Development)
                  </summary>
                  <pre className="text-red-400/60 text-xs mt-2 overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center space-x-2 py-3 sm:py-4 bg-gradient-to-r from-ice-blue to-ice-blue-dark text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(161,224,255,0.5)] hover:scale-105 transition-all duration-300 font-mono text-sm sm:text-base"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>RICARICA APPLICAZIONE</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center space-x-2 py-3 sm:py-4 bg-gray-500/20 border border-gray-500/50 text-gray-400 rounded-xl hover:bg-gray-500/30 transition-colors font-mono text-sm sm:text-base"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>TORNA ALLA HOME</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-red-500/20">
              <p className="text-red-400/60 text-xs sm:text-sm font-mono">
                Se il problema persiste, contatta il supporto tecnico
              </p>
              <div className="text-red-400/40 text-xs font-mono mt-2">
                Error ID: {Date.now().toString(36).toUpperCase()}
              </div>
            </div>
          </GlassPanel>
        </div>
      );
    }

    return this.props.children;
  }
}