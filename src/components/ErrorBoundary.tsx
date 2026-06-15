import React from 'react';
import {RefreshCw} from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * App-level error boundary. Catches render/lifecycle exceptions so a single
 * crashing component shows a recoverable fallback instead of a white screen.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {error: null};

  static getDerivedStateFromError(error: Error): State {
    return {error};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface to monitoring if wired (Sentry/console kept for non-prod).
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Uncaught render error:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              An unexpected error occurred. Reloading usually fixes it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <RefreshCw size={16} />
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
