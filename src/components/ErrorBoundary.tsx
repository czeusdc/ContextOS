import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-6 text-slate-200">
          <div className="max-w-md w-full bg-[#0d0d14] border border-red-500/20 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 flex items-center justify-center rounded-2xl mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Application Error</h1>
            <p className="text-sm text-slate-400 mb-8">
              {this.state.error?.message || "An unexpected error occurred during execution."}
            </p>
            <Button onClick={() => window.location.href = '/'} className="w-full rounded-full bg-slate-800 hover:bg-slate-700">
              <Home className="w-4 h-4 mr-2" />
              Return to Safety
            </Button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
