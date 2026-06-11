'use client';

import { useEffect, useState } from 'react';

type SyncStatus = 'online' | 'offline' | 'syncing' | 'sync-error';

export function OfflineStatusBanner() {
  const [status, setStatus] = useState<SyncStatus>('online');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function handleOnline() {
      setStatus('online');
      // Trigger sync when coming back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SYNC_RESPONSES' });
        setStatus('syncing');
      }
    }

    function handleOffline() {
      setStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) setStatus('offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (status === 'online') return null;

  const bannerConfig = {
    offline: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      icon: '📵',
      message: 'You are offline. Your answers are being saved locally and will sync when you reconnect.',
    },
    syncing: {
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-blue-800',
      icon: '🔄',
      message: 'Syncing your saved responses…',
    },
    'sync-error': {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: '⚠️',
      message: 'Sync failed. Your responses are still saved locally. Please try again.',
    },
  };

  const config = bannerConfig[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 px-4 py-3 border rounded-lg text-sm ${config.bg} ${config.text}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{config.message}</span>
    </div>
  );
}
