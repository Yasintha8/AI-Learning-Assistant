import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const CONFIG = {
  success: { Icon: CheckCircle2, tone: 'text-success bg-success-bg border-success-border' },
  error: { Icon: XCircle, tone: 'text-error bg-error-bg border-error-border' },
  warning: { Icon: AlertTriangle, tone: 'text-warning bg-warning-bg border-warning-border' },
  info: { Icon: Info, tone: 'text-info bg-info-bg border-info-border' },
};

const AlertBanner = ({ type = 'error', message, onDismiss, className = '' }) => {
  if (!message) return null;
  const { Icon, tone } = CONFIG[type] || CONFIG.error;

  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm font-medium animate-fade-in ${tone} ${className}`}
    >
      <Icon className="w-[18px] h-[18px] shrink-0 mt-0.5" strokeWidth={2.25} />
      <p className="flex-1 leading-snug">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;