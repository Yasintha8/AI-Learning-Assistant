import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable Select Dropdown component.
 * Ensures a tight, consistent gap between text label and ChevronDown icon,
 * eliminating the wide gaps caused by native OS select elements and stretched containers.
 */
const Select = ({
  value,
  onChange,
  options = [],
  className = '',
  buttonClassName = '',
  ariaLabel,
  prefix,
  icon: Icon,
  size = 'md', // 'sm' | 'md' | 'lg'
  autoWidth = true,
  disabled = false,
  variant = 'default', // 'default' | 'badge'
}) => {
  // Normalize options to { value, label }
  const normalizedOptions = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const currentOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );
  const currentLabel = currentOption ? currentOption.label : (normalizedOptions[0]?.label || '');

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-[11px] gap-1.5 rounded-lg',
    md: 'h-9 px-3 text-xs gap-2 rounded-xl',
    lg: 'h-11 px-3.5 text-xs font-bold gap-2 rounded-xl',
  }[size] || 'h-9 px-3 text-xs gap-2 rounded-xl';

  const variantClasses = {
    default:
      'bg-bg-main border border-border-medium hover:border-primary/50 text-text-heading font-semibold shadow-2xs',
    badge:
      'rounded-full border font-extrabold uppercase tracking-wider',
  }[variant] || 'bg-bg-main border border-border-medium hover:border-primary/50 text-text-heading font-semibold shadow-2xs';

  return (
    <div
      className={`relative inline-flex items-center rounded-xl focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all ${
        autoWidth ? 'w-auto' : 'w-full'
      } ${className}`}
    >
      {/* Visual representation with tight, precise gap between label and ChevronDown */}
      <div
        className={`inline-flex items-center justify-between text-text-heading transition-all duration-150 select-none pointer-events-none ${sizeClasses} ${variantClasses} ${
          autoWidth ? 'w-auto' : 'w-full'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${buttonClassName}`}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />}
          {prefix && <span className="text-text-muted font-normal">{prefix}</span>}
          <span className="truncate">{currentLabel}</span>
        </span>
        <ChevronDown
          className="w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-150"
          strokeWidth={2.25}
        />
      </div>

      {/* Accessible native select overlay for 100% keyboard & mobile compatibility */}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-label={ariaLabel || (prefix ? `${prefix} ${currentLabel}` : currentLabel)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base sm:text-xs z-10 disabled:cursor-not-allowed"
      >
        {normalizedOptions.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="bg-bg-card text-text-heading py-1"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
