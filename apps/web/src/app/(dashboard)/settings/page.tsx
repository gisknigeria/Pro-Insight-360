'use client';

import { useState } from 'react';

interface Settings {
  emailNotifications: boolean;
  formReminders: boolean;
  reminderFrequency: 'DAILY' | 'WEEKLY' | 'NEVER';
  dataExport: boolean;
  darkMode: boolean;
}

function ToggleSwitch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-all duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    emailNotifications: true,
    formReminders: true,
    reminderFrequency: 'WEEKLY',
    dataExport: true,
    darkMode: false,
  });
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleSave = async () => {
    const token = localStorage.getItem('accessToken');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={mounted ? 'animate-fade-in' : ''}>
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted">Configure your preferences and notification settings.</p>
      </div>

      {/* ── Success alert ── */}
      {saved && (
        <div className="mb-6 rounded-xl border border-green-200/50 bg-gradient-to-r from-green-50 to-green-100/50 p-4 text-sm text-green-700 shadow-sm animate-scale-in">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span className="font-semibold">Settings saved successfully</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Notifications ── */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg shadow-sm">
              🔔
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Notifications</h2>
              <p className="text-xs text-muted">Control how you receive updates</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Email Notifications</p>
                <p className="text-xs text-muted mt-0.5">Receive email updates about your evaluations</p>
              </div>
              <ToggleSwitch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(v) => setSettings({ ...settings, emailNotifications: v })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Form Reminders</p>
                <p className="text-xs text-muted mt-0.5">Get reminders for pending forms</p>
              </div>
              <ToggleSwitch
                id="formReminders"
                checked={settings.formReminders}
                onChange={(v) => setSettings({ ...settings, formReminders: v })}
              />
            </div>

            {settings.formReminders && (
              <div className="ml-2 pl-5 border-l-2 border-primary/20 animate-slide-in-right">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Reminder Frequency
                </label>
                <select
                  value={settings.reminderFrequency}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reminderFrequency: e.target.value as 'DAILY' | 'WEEKLY' | 'NEVER',
                    })
                  }
                  className="w-full max-w-xs rounded-xl border border-border bg-surface-muted px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="NEVER">Never</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Privacy & Data ── */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg shadow-sm">
              🔒
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Privacy & Data</h2>
              <p className="text-xs text-muted">Manage your data preferences</p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Allow Data Export</p>
                <p className="text-xs text-muted mt-0.5">Allow exporting evaluation data</p>
              </div>
              <ToggleSwitch
                id="dataExport"
                checked={settings.dataExport}
                onChange={(v) => setSettings({ ...settings, dataExport: v })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-foreground text-sm">Dark Mode</p>
                <p className="text-xs text-muted mt-0.5">Use dark theme for the interface</p>
              </div>
              <ToggleSwitch
                id="darkMode"
                checked={settings.darkMode}
                onChange={(v) => setSettings({ ...settings, darkMode: v })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Account ── */}
      <div className="rounded-2xl border border-border bg-surface p-6 mt-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg shadow-sm">
            👤
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Account</h2>
            <p className="text-xs text-muted">Security and account management</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface-muted p-4 transition-all hover:border-primary/30 hover:shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-lg">🔑</span>
              <div>
                <p className="font-semibold text-foreground text-sm">Change Password</p>
                <p className="text-xs text-muted">Update your account password</p>
              </div>
            </div>
            <button className="mt-3 text-xs font-bold text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1">
              Update Password →
            </button>
          </div>
          <div className="rounded-xl border border-border bg-surface-muted p-4 transition-all hover:border-primary/30 hover:shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-lg">🔐</span>
              <div>
                <p className="font-semibold text-foreground text-sm">Two-Factor Auth</p>
                <p className="text-xs text-muted">Add an extra layer of security</p>
              </div>
            </div>
            <button className="mt-3 text-xs font-bold text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1">
              Enable MFA →
            </button>
          </div>
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
        >
          {saved ? '✅ Saved!' : 'Save Settings'}
        </button>
        <button className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground shadow-sm hover:bg-surface-muted transition-all active:scale-[0.98]">
          Cancel
        </button>
      </div>
    </div>
  );
}
