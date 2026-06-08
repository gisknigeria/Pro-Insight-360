'use client';

import { useState } from 'react';

interface Settings {
  emailNotifications: boolean;
  formReminders: boolean;
  reminderFrequency: 'DAILY' | 'WEEKLY' | 'NEVER';
  dataExport: boolean;
  darkMode: boolean;
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Configure your preferences and notification settings.
        </p>
      </div>

      {/* Alert */}
      {saved && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✓ Settings saved successfully
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  setSettings({ ...settings, emailNotifications: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300"
              />
              <div>
                <p className="font-medium text-slate-900">Email Notifications</p>
                <p className="text-sm text-slate-600">Receive email updates about your evaluations</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.formReminders}
                onChange={(e) =>
                  setSettings({ ...settings, formReminders: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300"
              />
              <div>
                <p className="font-medium text-slate-900">Form Reminders</p>
                <p className="text-sm text-slate-600">Get reminders for pending forms</p>
              </div>
            </label>

            {settings.formReminders && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-slate-900 mb-2">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="NEVER">Never</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Privacy & Data */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Privacy & Data</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dataExport}
                onChange={(e) =>
                  setSettings({ ...settings, dataExport: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300"
              />
              <div>
                <p className="font-medium text-slate-900">Allow Data Export</p>
                <p className="text-sm text-slate-600">Allow exporting evaluation data</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) =>
                  setSettings({ ...settings, darkMode: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300"
              />
              <div>
                <p className="font-medium text-slate-900">Dark Mode</p>
                <p className="text-sm text-slate-600">Use dark theme for the interface</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Change Password
            </label>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Update Password →
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-1">
              Two-Factor Authentication
            </label>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Enable MFA →
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
        >
          Save Settings
        </button>
        <button className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200">
          Cancel
        </button>
      </div>
    </div>
  );
}
