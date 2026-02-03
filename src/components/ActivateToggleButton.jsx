import React from 'react';
import { Power, PowerOff } from 'lucide-react';

/**
 * Unified Activate/Deactivate toggle button component
 * Used across Bundles, Rows, and Vouchers management
 *
 * @param {boolean} isActive - Current active state of the entity
 * @param {function} onToggle - Callback function when button is clicked
 * @param {string} entityName - Name of the entity for tooltip (e.g., 'bundle', 'row', 'voucher')
 * @param {boolean} stopPropagation - Whether to stop event propagation (default: false)
 * @param {boolean} disabled - Whether the button is disabled
 * @param {boolean} useDualIcons - Use Power/PowerOff icons based on state (default: false, uses Power for both)
 * @param {number} iconSize - Size of the icon (default: 14)
 */
const ActivateToggleButton = ({
  isActive,
  onToggle,
  entityName = 'item',
  stopPropagation = false,
  disabled = false,
  useDualIcons = false,
  iconSize = 14,
}) => {
  const handleClick = (e) => {
    if (stopPropagation) {
      e.stopPropagation();
    }
    if (!disabled) {
      onToggle();
    }
  };

  const styles = {
    button: {
      padding: '0.375rem',
      background: isActive ? '#fef2f2' : '#f0fdf4',
      border: `1px solid ${isActive ? '#fecaca' : '#86efac'}`,
      borderRadius: '0.375rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.15s ease',
      opacity: disabled ? 0.5 : 1,
    },
    icon: {
      color: isActive ? '#dc2626' : '#16a34a',
    },
  };

  const Icon = useDualIcons && isActive ? PowerOff : Power;
  const title = isActive ? `Deactivate ${entityName}` : `Activate ${entityName}`;

  return (
    <button
      onClick={handleClick}
      style={styles.button}
      title={title}
      disabled={disabled}
      type="button"
    >
      <Icon size={iconSize} style={styles.icon} />
    </button>
  );
};

export default ActivateToggleButton;
