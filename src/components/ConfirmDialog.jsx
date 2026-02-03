import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger' // 'danger' or 'warning'
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="confirm-dialog-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="confirm-dialog-header">
          <div className="confirm-dialog-title-wrapper">
            <div className={`confirm-dialog-icon ${type}`}>
              <AlertTriangle size={24} aria-hidden="true" />
            </div>
            <h3 id="confirm-dialog-title" className="confirm-dialog-title">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="confirm-dialog-body">
          <p>{message}</p>
        </div>

        {/* Footer */}
        <div className="confirm-dialog-footer">
          <button
            onClick={onClose}
            className="dialog-btn-cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`dialog-btn-confirm ${type}`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>
        {`
          .confirm-dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 1rem;
            animation: fadeIn 0.2s ease-out;
          }

          .confirm-dialog {
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3), 0 10px 10px -5px rgb(0 0 0 / 0.2);
            max-width: 480px;
            width: 100%;
            animation: slideUp 0.2s ease-out;
          }

          .confirm-dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem;
            border-bottom: 2px solid var(--gray-200);
          }

          .confirm-dialog-title-wrapper {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .confirm-dialog-icon {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .confirm-dialog-icon.danger {
            background: #fee2e2;
            color: var(--danger);
          }

          .confirm-dialog-icon.warning {
            background: #fef3c7;
            color: var(--warning);
          }

          .confirm-dialog-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--gray-900);
            margin: 0;
          }

          .confirm-dialog-body {
            padding: 1.5rem;
          }

          .confirm-dialog-body p {
            font-size: 0.9375rem;
            color: var(--gray-700);
            line-height: 1.6;
            margin: 0;
          }

          .confirm-dialog-footer {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding: 1.25rem 1.5rem;
            border-top: 2px solid var(--gray-200);
            background: var(--gray-50);
            border-radius: 0 0 0.75rem 0.75rem;
          }
        `}
      </style>
    </div>
  );
}

export default ConfirmDialog;
