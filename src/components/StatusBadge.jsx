import React from 'react';

/**
 * Compact status badge with dot indicator
 * Modern design pattern used by GitHub, Stripe, Vercel, etc.
 *
 * @param {string} status - Status string: 'active', 'inactive', 'available', 'used', or custom
 * @param {string} label - Custom label (optional, defaults based on status)
 *
 * Legacy props (for backwards compatibility):
 * @param {boolean} isActive - Whether the status is active
 * @param {string} activeLabel - Label for active state
 * @param {string} inactiveLabel - Label for inactive state
 */

const STATUS_CONFIGS = {
  active: {
    background: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
    dot: '#22c55e',
    label: 'Active',
  },
  available: {
    background: '#f0fdf4',
    color: '#15803d',
    border: '#bbf7d0',
    dot: '#22c55e',
    label: 'Available',
  },
  inactive: {
    background: '#f8fafc',
    color: '#64748b',
    border: '#e2e8f0',
    dot: '#94a3b8',
    label: 'Inactive',
  },
  used: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    dot: '#ef4444',
    label: 'Used',
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca',
    dot: '#ef4444',
    label: 'Error',
  },
};

const StatusBadge = ({
  status,
  label,
  // Legacy props for backwards compatibility
  isActive,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}) => {
  // Determine the config based on props
  let config;
  let displayLabel;

  if (status) {
    // New API: use status string
    const normalizedStatus = status.toLowerCase();
    config = STATUS_CONFIGS[normalizedStatus] || STATUS_CONFIGS.inactive;
    displayLabel = label || config.label;
  } else {
    // Legacy API: use isActive boolean
    config = isActive ? STATUS_CONFIGS.active : STATUS_CONFIGS.error;
    displayLabel = isActive ? activeLabel : inactiveLabel;
  }

  const styles = {
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.375rem',
      padding: '0.125rem 0.5rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      lineHeight: '1.25rem',
      background: config.background,
      color: config.color,
      border: `1px solid ${config.border}`,
    },
    dot: {
      width: '0.375rem',
      height: '0.375rem',
      borderRadius: '50%',
      background: config.dot,
      flexShrink: 0,
    },
  };

  return (
    <span style={styles.badge}>
      <span style={styles.dot} />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
