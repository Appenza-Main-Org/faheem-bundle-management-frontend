import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} aria-hidden="true" />,
    error: <AlertCircle size={20} aria-hidden="true" />,
    warning: <AlertCircle size={20} aria-hidden="true" />,
    info: <Info size={20} aria-hidden="true" />,
  };

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-message">{message}</div>
      <button
        onClick={onClose}
        className="toast-close-btn"
        aria-label="Dismiss notification"
      >
        <X size={18} />
      </button>
      <style>
        {`
          .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -2px rgb(0 0 0 / 0.2);
            min-width: 300px;
            max-width: 500px;
            animation: slideInRight 0.3s ease-out;
          }

          .toast-success {
            background: var(--success-light);
            border: 2px solid var(--success);
          }

          .toast-error {
            background: var(--danger-light);
            border: 2px solid var(--danger);
          }

          .toast-warning {
            background: var(--warning-light);
            border: 2px solid var(--warning);
          }

          .toast-info {
            background: var(--primary-light);
            border: 2px solid var(--primary);
          }

          .toast-icon {
            flex-shrink: 0;
          }

          .toast-message {
            flex: 1;
            font-size: 0.9375rem;
            font-weight: 500;
          }

          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Toast;
