"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  Bell,
  Check,
  ChevronDown,
  KeyRound,
  Loader2,
  Mail,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { DEFAULT_NOTIFICATION_SETTINGS, NOTIFICATION_LABELS, type NotificationSettings } from "@/lib/notification-settings";

interface ProfileData {
  name: string | null;
  username: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  website: string | null;
  social: string | null;
  github: string | null;
}

type ToggleRow = { key: keyof NotificationSettings; label: string; description: string };

export default function SettingsClient({ initialData }: { initialData: ProfileData }) {
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const router = useRouter();

  const [profile, setProfile] = useState(initialData);
  const [toggles, setToggles] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState("");
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setToggles({ ...DEFAULT_NOTIFICATION_SETTINGS, ...(data.settings || {}) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSettings();
  }, [loadSettings]);

  const updateProfile = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setProfileSuccess(false);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.name,
          username: profile.username,
          role: profile.role,
          location: profile.location,
          bio: profile.bio,
          website: profile.website,
          social: profile.social,
          github: profile.github,
        }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      setProfileSuccess(true);
      router.refresh();
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch {
      setProfileError("Couldn't save your profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  const togglePreference = (key: keyof NotificationSettings) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    setPrefsSuccess(false);
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    setPrefsError("");
    setPrefsSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: toggles }),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      setPrefsSuccess(true);
      setTimeout(() => setPrefsSuccess(false), 3000);
    } catch {
      setPrefsError("Couldn't save your preferences. Please try again.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const inputClass =
    "w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800";
  const labelClass = "text-sm font-bold text-gray-900";

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            <SettingsIcon size={20} className="text-indigo-600" />
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your profile, account, and notification preferences.
          </p>
        </div>

        {/* Profile */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7 mb-6">
          <div className="flex items-center gap-2.5 mb-5">
            <UserIcon size={17} className="text-indigo-600" />
            <h2 className="text-base font-extrabold text-gray-900">Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Full name</label>
              <input type="text" value={profile.name || ""} onChange={(e) => updateProfile("name", e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                <input type="text" value={profile.username || ""} onChange={(e) => updateProfile("username", e.target.value)} className={`${inputClass} pl-8`} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className={`${labelClass} flex items-center gap-1`}>Role / title <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={profile.role || ""} onChange={(e) => updateProfile("role", e.target.value)} placeholder="e.g. Full Stack Developer" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className={`${labelClass} flex items-center gap-1`}>Location <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={profile.location || ""} onChange={(e) => updateProfile("location", e.target.value)} placeholder="City, PH" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5 mb-5">
            <label className={`${labelClass} flex items-center gap-1`}>Bio <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={profile.bio || ""} onChange={(e) => updateProfile("bio", e.target.value)} rows={4} maxLength={200} className={`${inputClass} resize-none`} />
            <div className="flex justify-between items-center text-[11px] text-gray-500">
              <span>A short intro shown on your public profile.</span>
              <span>{(profile.bio || "").length} / 200</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-sm font-bold">
              {profileSuccess && <span className="text-emerald-600 flex items-center gap-1"><Check size={15} /> Profile saved!</span>}
              {profileError && <span className="text-red-600">{profileError}</span>}
            </span>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-70 active:scale-95"
            >
              {savingProfile && <Loader2 size={16} className="animate-spin" />}
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7 mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <KeyRound size={17} className="text-indigo-600" />
            <h2 className="text-base font-extrabold text-gray-900">Account</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Your Resumi account is powered by Clerk. Manage sign-in methods, password, and security from the account manager.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3 min-w-0">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                  {(user?.fullName || "U").charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">{user?.fullName || "User"}</div>
                <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Mail size={11} /> {user?.primaryEmailAddress?.emailAddress || "—"}
                </div>
              </div>
            </div>
            <button
              onClick={() => openUserProfile()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
            >
              Manage account <ChevronDown size={14} className="text-gray-400" />
            </button>
          </div>
        </section>

        {/* Notification preferences */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7">
          <div className="flex items-center gap-2.5 mb-1">
            <Bell size={17} className="text-indigo-600" />
            <h2 className="text-base font-extrabold text-gray-900">Notification preferences</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Choose what shows up in your in-app notification bell.
          </p>

          {!settingsLoaded ? (
            <div className="py-8 flex items-center justify-center gap-2 text-gray-400 text-sm font-medium">
              <Loader2 size={16} className="animate-spin" /> Loading preferences...
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {NOTIFICATION_LABELS.map((row: ToggleRow) => {
                const enabled = toggles[row.key];
                return (
                  <div key={row.key} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900">{row.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{row.description}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => togglePreference(row.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${enabled ? "bg-indigo-600" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <span className="text-sm font-bold">
              {prefsSuccess && <span className="text-emerald-600 flex items-center gap-1"><Check size={15} /> Preferences saved!</span>}
              {prefsError && <span className="text-red-600">{prefsError}</span>}
            </span>
            <button
              onClick={savePreferences}
              disabled={savingPrefs || !settingsLoaded}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-70 active:scale-95"
            >
              {savingPrefs && <Loader2 size={16} className="animate-spin" />}
              {savingPrefs ? "Saving..." : "Save preferences"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}