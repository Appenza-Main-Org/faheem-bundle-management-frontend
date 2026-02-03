import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <AlertTriangle size={48} />
            </div>
            <h1>Something went wrong</h1>
            <p>We're sorry, but something unexpected happened. Please try refreshing the page.</p>
            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}
            <div className="error-boundary-actions">
              <button onClick={this.handleReset} className="error-boundary-btn secondary">
                Try Again
              </button>
              <button onClick={this.handleReload} className="error-boundary-btn primary">
                <RefreshCw size={16} />
                Reload Page
              </button>
            </div>
          </div>
          <style>{`
            .error-boundary {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              padding: 2rem;
            }
            .error-boundary-content {
              max-width: 500px;
              text-align: center;
              background: white;
              padding: 3rem 2rem;
              border-radius: 1rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .error-boundary-icon {
              width: 80px;
              height: 80px;
              margin: 0 auto 1.5rem;
              background: #fef2f2;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #dc2626;
            }
            .error-boundary h1 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1e293b;
              margin: 0 0 0.75rem;
            }
            .error-boundary p {
              color: #64748b;
              margin: 0 0 1.5rem;
              line-height: 1.6;
            }
            .error-boundary-details {
              text-align: left;
              margin-bottom: 1.5rem;
              padding: 1rem;
              background: #f1f5f9;
              border-radius: 0.5rem;
              font-size: 0.75rem;
            }
            .error-boundary-details summary {
              cursor: pointer;
              font-weight: 500;
              color: #475569;
              margin-bottom: 0.5rem;
            }
            .error-boundary-details pre {
              margin: 0.5rem 0 0;
              white-space: pre-wrap;
              word-break: break-word;
              color: #dc2626;
              font-size: 0.7rem;
            }
            .error-boundary-actions {
              display: flex;
              gap: 0.75rem;
              justify-content: center;
            }
            .error-boundary-btn {
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.625rem 1.25rem;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 0.5rem;
              border: none;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .error-boundary-btn.primary {
              background: var(--primary, #6366f1);
              color: white;
            }
            .error-boundary-btn.primary:hover {
              opacity: 0.9;
            }
            .error-boundary-btn.secondary {
              background: #f1f5f9;
              color: #475569;
              border: 1px solid #e2e8f0;
            }
            .error-boundary-btn.secondary:hover {
              background: #e2e8f0;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
