import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Sakhi Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f6fd] flex items-center justify-center p-6 text-slate-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 border border-violet-200 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 flex items-center justify-center text-2xl">
              ✨
            </div>
            <h2 className="text-xl font-black text-slate-950">Sakhi Travel Companion</h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              We encountered a display issue while loading the workspace. Refreshing the session will restore your dashboard.
            </p>
            <div className="p-3 bg-violet-50 rounded-xl text-left border border-violet-100 text-[11px] font-mono text-violet-900 break-words max-h-24 overflow-y-auto">
              {this.state.error?.message || 'Unexpected application error'}
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs transition-colors cursor-pointer shadow-md"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
