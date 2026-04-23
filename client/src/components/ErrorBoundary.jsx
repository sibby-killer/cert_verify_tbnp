import React from 'react';

/**
 * ErrorBoundary — catches unhandled React render errors and displays a
 * user-friendly fallback instead of a blank white screen.
 *
 * Must be a class component — React does not support functional error boundaries.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console in dev; replace with Sentry/Datadog in production
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
          <p className="text-slate-500 mb-2 text-sm">
            An unexpected error occurred. The error has been logged.
          </p>

          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="text-left text-xs bg-slate-100 text-red-600 p-4 rounded-xl mb-6 overflow-auto max-h-40 border border-red-100">
              {this.state.error.message}
            </pre>
          )}

          <button
            onClick={this.handleReset}
            className="bg-[#1B3A6B] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#152d56] transition-all shadow-lg"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
}
