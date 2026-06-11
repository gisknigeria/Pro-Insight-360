'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

interface Notification {
  id: string;
  type: 'FORM_ASSIGNED' | 'FORM_REMINDER' | 'RESPONSE_SUBMITTED' | 'EVALUATION_ACTIVATED' | 'DIAGNOSIS_READY' | 'REPORT_READY';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

const TYPE_CONFIG = {
  FORM_ASSIGNED: { label: 'Form Assigned', icon: '📋', color: 'bg-amber-100 text-amber-800' },
  FORM_REMINDER: { label: 'Form Reminder', icon: '⏰', color: 'bg-orange-100 text-orange-700' },
  RESPONSE_SUBMITTED: { label: 'Response Submitted', icon: '✅', color: 'bg-green-100 text-green-700' },
  EVALUATION_ACTIVATED: { label: 'Evaluation Activated', icon: '🚀', color: 'bg-purple-100 text-purple-700' },
  DIAGNOSIS_READY: { label: 'Diagnosis Ready', icon: '🔍', color: 'bg-yellow-100 text-yellow-700' },
  REPORT_READY: { label: 'Report Ready', icon: '📄', color: 'bg-indigo-100 text-indigo-700' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUnread, setFilterUnread] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterUnread ? notifications.filter((n) => !n.read) : notifications;

  const markAllAsRead = async () => {
    const token = localStorage.getItem('accessToken');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Stay updated on forms, evaluations, and reports.
            </p>
          </div>
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total', value: notifications.length, icon: '📬' },
          { label: 'Unread', value: notifications.filter((n) => !n.read).length, icon: '🔔' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filterUnread}
            onChange={(e) => setFilterUnread(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <span className="text-sm font-medium text-slate-700">Show unread only</span>
        </label>
      </div>

      {/* Notifications */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title={filterUnread ? 'No unread notifications' : 'No notifications'}
          description={filterUnread ? 'All caught up! ✓' : 'You will see notifications here as they arrive.'}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`rounded-lg border p-4 transition hover:shadow ${
                notif.read
                  ? 'bg-white border-slate-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex gap-4">
                <span className="text-2xl mt-1">{TYPE_CONFIG[notif.type].icon}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${
                        notif.read ? 'text-slate-900' : 'text-slate-900 font-bold'
                      }`}>
                        {notif.title}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        notif.read ? 'text-slate-600' : 'text-slate-700'
                      }`}>
                        {notif.message}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${TYPE_CONFIG[notif.type].color}`}>
                      {TYPE_CONFIG[notif.type].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
