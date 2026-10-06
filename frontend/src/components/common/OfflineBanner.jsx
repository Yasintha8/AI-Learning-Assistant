import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      if (wasOffline) {
        setShowRestored(true);
        const timer = setTimeout(() => {
          setShowRestored(false);
          setWasOffline(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowRestored(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showRestored) {
    return null;
  }

  if (dismissed && !showRestored) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300 transform translate-y-0"
    >
      {!isOnline ? (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 sm:py-2.5 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2.5 mx-auto">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-50" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950" />
            </span>
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>You are currently offline. Check your internet connection.</span>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-black/10 transition-colors cursor-pointer"
            aria-label="Dismiss offline banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : showRestored ? (
        <div className="bg-emerald-600 text-white px-4 py-2 sm:py-2.5 shadow-lg flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold animate-fade-in">
          <Wifi className="w-4 h-4 shrink-0 animate-bounce" />
          <span>Back online! Connection restored.</span>
        </div>
      ) : null}
    </div>
  );
};

export default OfflineBanner;
