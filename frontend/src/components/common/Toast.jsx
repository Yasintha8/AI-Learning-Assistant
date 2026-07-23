import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import Spinner from './Spinner';

const CONFIG = {
  success: { Icon: CheckCircle2, tone: 'text-success bg-success-bg', bar: 'bg-success' },
  error: { Icon: XCircle, tone: 'text-error bg-error-bg', bar: 'bg-error' },
  warning: { Icon: AlertTriangle, tone: 'text-warning bg-warning-bg', bar: 'bg-warning' },
  info: { Icon: Info, tone: 'text-info bg-info-bg', bar: 'bg-info' },
};

const ToastCard = ({ t, type = 'info', message, icon }) => {
  const isLoading = type === 'loading';
  const { Icon, tone, bar } = CONFIG[type] || CONFIG.info;

  return (
    <div
      role="status"
      className={`relative flex w-90 max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-2xl border border-border-light bg-bg-card p-4 pr-9 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 ${
        t.visible ? 'animate-toast-in' : 'animate-toast-out'
      }`}
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isLoading ? 'bg-primary-light' : tone}`}>
        {isLoading ? (
          <Spinner size="xs" tone="primary" inline />
        ) : icon ? (
          <span className="text-base leading-none">{icon}</span>
        ) : (
          <Icon className="w-[18px] h-[18px]" strokeWidth={2.25} />
        )}
      </span>

      <p className="pt-1 text-sm font-medium leading-snug text-text-heading">{message}</p>

      {!isLoading && (
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          aria-label="Dismiss notification"
          className="absolute right-3 top-3 text-text-muted transition-colors hover:text-text-body cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {!isLoading && t.duration !== Infinity && (
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-border-light">
          <div
            key={t.id}
            className={`h-full origin-left ${bar}`}
            style={{
              animation: `toast-progress ${t.duration}ms linear forwards`,
              animationPlayState: t.visible ? 'running' : 'paused',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ToastCard;