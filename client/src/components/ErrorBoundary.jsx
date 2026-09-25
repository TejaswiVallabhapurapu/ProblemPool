import React from 'react';

/**
 * Global ErrorBoundary Component
 * Catches unhandled runtime rendering errors anywhere in the React tree
 * and prevents the application from unmounting to a blank white screen.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ProblemPool Uncaught Component Error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080808] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#141414]/90 backdrop-blur-xl border border-white/10 text-center shadow-2xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/20 text-rose-300 text-xs font-bold mb-4">
              <span>Application Notice</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              We encountered an issue while rendering this view. You can return to the platform or refresh your session.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-white hover:bg-slate-200 transition cursor-pointer"
              >
                Return to Home
              </button>
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-[#202020] hover:bg-[#282828] border border-white/10 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
