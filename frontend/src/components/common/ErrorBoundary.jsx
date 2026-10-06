import React, { Component } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // Log to external error monitoring service if available in production (e.g. Sentry/LogRocket)
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({
              error: this.state.error,
              errorInfo: this.state.errorInfo,
              reset: this.handleReset,
            })
          : this.props.fallback;
      }

      const isInline = this.props.inline;

      return (
        <div
          role="alert"
          className={`flex items-center justify-center p-6 ${
            isInline ? 'w-full py-12' : 'min-h-[50vh] w-full'
          }`}
        >
          <div className="w-full max-w-lg bg-bg-card border border-rose-200 dark:border-rose-900/40 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-fade-in">
            {/* Warning Icon Badge */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-8 h-8" strokeWidth={2} />
            </div>

            {/* Heading & Subtitle */}
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-text-heading tracking-tight">
                {this.props.title || 'Something went wrong'}
              </h2>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                {this.props.message ||
                  'An unexpected error occurred while rendering this component. You can try refreshing or returning to the dashboard.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-md shadow-primary/20 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-card border border-border-medium hover:border-text-heading text-text-heading text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bg-main hover:bg-border-light text-text-muted hover:text-text-heading text-xs font-semibold transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Technical Error Details Accordion */}
            {this.state.error && (
              <div className="pt-4 border-t border-border-light text-left">
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between text-xs font-semibold text-text-muted hover:text-text-heading transition-colors cursor-pointer"
                >
                  <span>Technical details</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 bg-bg-main border border-border-light rounded-xl overflow-x-auto text-[11px] font-mono text-rose-600 dark:text-rose-400 max-h-48 overflow-y-auto">
                    <p className="font-bold">{this.state.error.toString()}</p>
                    {this.state.errorInfo?.componentStack && (
                      <pre className="mt-2 text-[10px] text-text-muted whitespace-pre-wrap font-mono">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
