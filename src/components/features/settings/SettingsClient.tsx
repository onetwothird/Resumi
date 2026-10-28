"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import {
  AlertCircle,
  Bell,
  Check,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { NOTIFICATION_LABELS, type NotificationSettings } from "@/lib/notification-settings";

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

type SectionId = "profile" | "account" | "notifications";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "account", label: "Account", icon: KeyRound },
  { id: "notifications", label: "Notifications", icon: Bell },
];

/**
 * Switches that only make sense for one side of the marketplace. Everyone
 * used to see all six, so jobseekers were offered "New applications" to job
 * postings they cannot have.
 */
const ROLE_SWITCHES: Record<"jobseeker" | "employer", (keyof NotificationSettings)[]> = {
  jobseeker: ["newMessage", "applicationUpdates", "interviewInvites", "marketing"],
  employer: ["newMessage", "newApplications", "jobPostingUpdates", "marketing"],
};

const BIO_MAX = 200;

type PrefsStatus = "idle" | "saving" | "saved" | "error";

export default function SettingsClient({
  initialData,
  initialSettings,
}: {
  initialData: ProfileData;
  initialSettings: NotificationSettings;
}) {
  const { user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const router = useRouter();

  // ── Profile ──
  const [saved, setSaved] = useState(initialData);
  const [profile, setProfile] = useState(initialData);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const dirty = JSON.stringify(profile) !== JSON.stringify(saved);

  const updateProfile = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setProfileSaved(false);
    setProfileError("");
    if (field === "username") setUsernameError("");
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError("");
    setUsernameError("");
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
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const message = typeof body?.error === "string" && res.status !== 500
          ? body.error
          : "Couldn't save your profile. Try again.";
        if (body?.field === "username") setUsernameError(message);
        else setProfileError(message);
        return;
      }
      // Adopt what the server stored (e.g. a stripped leading "@").
      const next: ProfileData = {
        name: body?.name ?? null,
        username: body?.username ?? null,
        role: body?.role ?? null,
        location: body?.location ?? null,
        bio: body?.bio ?? null,
        website: body?.website ?? null,
        social: body?.social ?? null,
        github: body?.github ?? null,
      };
      setSaved(next);
      setProfile(next);
      setProfileSaved(true);
      router.refresh();
    } catch {
      setProfileError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!profileSaved) return;
    const t = setTimeout(() => setProfileSaved(false), 3000);
    return () => clearTimeout(t);
  }, [profileSaved]);

  // ── Notifications: each switch saves on its own ──
  const [toggles, setToggles] = useState<NotificationSettings>(initialSettings);
  const [prefsStatus, setPrefsStatus] = useState<PrefsStatus>("idle");
  const lastConfirmed = useRef<NotificationSettings>(initialSettings);
  const requestSeq = useRef(0);

  const togglePreference = async (key: keyof NotificationSettings) => {
    const next = { ...toggles, [key]: !toggles[key] };
    setToggles(next);
    setPrefsStatus("saving");
    const seq = ++requestSeq.current;
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: next }),
      });
      if (!res.ok) throw new Error();
      lastConfirmed.current = next;
      if (seq === requestSeq.current) setPrefsStatus("saved");
    } catch {
      // Only the latest request decides what the switches show.
      if (seq === requestSeq.current) {
        setToggles(lastConfirmed.current);
        setPrefsStatus("error");
      }
    }
  };

  useEffect(() => {
    if (prefsStatus !== "saved") return;
    const t = setTimeout(() => setPrefsStatus("idle"), 2000);
    return () => clearTimeout(t);
  }, [prefsStatus]);

  const accountRole = user?.publicMetadata?.role as "jobseeker" | "employer" | undefined;
  const visibleSwitches = accountRole
    ? NOTIFICATION_LABELS.filter((row) => ROLE_SWITCHES[accountRole].includes(row.key))
    : NOTIFICATION_LABELS;

  // ── Section nav: highlight the section in view ──
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActiveSection(visible[0].target.id as SectionId);
      },
      { rootMargin: "-120px 0px -60% 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const inputClass =
    "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-gray-800 placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const optional = <span className="text-gray-400 font-normal"> (optional)</span>;
  const cardClass = "bg-white rounded-2xl border border-gray-200 shadow-xs scroll-mt-32 lg:scroll-mt-20";

  const displayName = profile.name || user?.fullName || "Your name";
  const avatarLetter = (profile.name || user?.fullName || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Your public profile, sign-in, and what you get notified about.</p>
        </div>

        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
          {/* Section nav: a sticky tab row on phones, a sidebar on desktop */}
          <nav
            aria-label="Settings sections"
            className="sticky top-14 z-10 -mx-4 sm:-mx-6 lg:mx-0 mb-5 lg:mb-0 px-4 sm:px-6 lg:px-0 py-2 lg:py-0 bg-[#F7F9FC]/95 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none lg:top-20 lg:self-start"
          >
            <ul className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const active = activeSection === id;
                return (
                  <li key={id} className="shrink-0">
                    <a
                      href={`#${id}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => setActiveSection(id)}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                        active ? "bg-white text-indigo-700 shadow-xs ring-1 ring-gray-200" : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-indigo-600" : "text-gray-400"} />
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="space-y-6 min-w-0">
            {/* ── Profile ── */}
            <section id="profile" aria-labelledby="profile-title" className={cardClass}>
              <div className="flex items-center gap-4 p-5 sm:p-6 border-b border-gray-100">
                {user?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.imageUrl} alt="" className="w-14 h-14 rounded-full object-cover border border-gray-200 shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-lg shrink-0">
                    {avatarLetter}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 id="profile-title" className="text-base font-semibold text-gray-900">Profile</h2>
                  <p className="text-sm text-gray-500 truncate">
                    {displayName}
                    {saved.username && <span className="text-gray-400"> &middot; @{saved.username}</span>}
                  </p>
                </div>
                {saved.username && (
                  <Link
                    href={`/u/${saved.username}`}
                    className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
                  >
                    View public profile <ExternalLink size={14} />
                  </Link>
                )}
              </div>

              <form
                className="p-5 sm:p-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (dirty && !savingProfile) saveProfile();
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <label htmlFor="settings-name" className={labelClass}>Full name</label>
                    <input id="settings-name" type="text" autoComplete="name" value={profile.name || ""} onChange={(e) => updateProfile("name", e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="settings-username" className={labelClass}>Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <input
                        id="settings-username"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        value={profile.username || ""}
                        onChange={(e) => updateProfile("username", e.target.value)}
                        aria-invalid={usernameError ? true : undefined}
                        aria-describedby="settings-username-hint"
                        className={`${inputClass} pl-7 ${usernameError ? "border-red-300 focus:border-red-400 focus:ring-red-500/15" : ""}`}
                      />
                    </div>
                    <p id="settings-username-hint" className={`mt-1.5 text-xs ${usernameError ? "text-red-600" : "text-gray-500"}`}>
                      {usernameError || "Your public profile link. Letters, numbers, - and _."}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="settings-headline" className={labelClass}>Headline{optional}</label>
                    <input id="settings-headline" type="text" value={profile.role || ""} onChange={(e) => updateProfile("role", e.target.value)} placeholder="e.g. Full Stack Developer" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="settings-location" className={labelClass}>Location{optional}</label>
                    <input id="settings-location" type="text" autoComplete="address-level2" value={profile.location || ""} onChange={(e) => updateProfile("location", e.target.value)} placeholder="City, PH" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="settings-bio" className={labelClass}>Bio{optional}</label>
                    <textarea id="settings-bio" value={profile.bio || ""} onChange={(e) => updateProfile("bio", e.target.value)} rows={3} maxLength={BIO_MAX} className={`${inputClass} resize-none`} />
                    <div className="mt-1.5 flex justify-between gap-3 text-xs text-gray-500">
                      <span>A short intro shown on your public profile.</span>
                      <span className="tabular-nums shrink-0">{(profile.bio || "").length}/{BIO_MAX}</span>
                    </div>
                  </div>
                </div>

                {saved.username && (
                  <Link href={`/u/${saved.username}`} className="sm:hidden mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600">
                    View public profile <ExternalLink size={14} />
                  </Link>
                )}

                {/* Save bar: only present when there's something to save */}
                <div
                  className={`mt-5 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-100 ${
                    dirty || profileError || profileSaved ? "" : "hidden"
                  }`}
                >
                  <p className="text-sm" role="status" aria-live="polite">
                    {profileError ? (
                      <span className="flex items-center gap-1.5 text-red-600"><AlertCircle size={15} /> {profileError}</span>
                    ) : profileSaved ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium"><Check size={15} /> Profile saved</span>
                    ) : (
                      <span className="text-gray-500">You have unsaved changes.</span>
                    )}
                  </p>
                  {dirty && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setProfile(saved); setProfileError(""); setUsernameError(""); }}
                        disabled={savingProfile}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-60"
                      >
                        Discard
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-70"
                      >
                        {savingProfile && <Loader2 size={16} className="animate-spin" />}
                        {savingProfile ? "Saving…" : "Save changes"}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </section>

            {/* ── Account ── */}
            <section id="account" aria-labelledby="account-title" className={`${cardClass} p-5 sm:p-6`}>
              <h2 id="account-title" className="text-base font-semibold text-gray-900">Account</h2>
              <p className="text-sm text-gray-500 mt-1 mb-5">Email, password, connected accounts and active sessions.</p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900">Sign-in email</div>
                    <div className="text-sm text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress || "—"}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openUserProfile()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors shrink-0"
                >
                  <KeyRound size={15} className="text-gray-400" /> Manage sign-in &amp; security
                </button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-200 p-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">Sign out</div>
                  <div className="text-sm text-gray-500">Sign out of Resumi on this device.</div>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </section>

            {/* ── Notifications ── */}
            <section id="notifications" aria-labelledby="notifications-title" className={`${cardClass} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="notifications-title" className="text-base font-semibold text-gray-900">Notifications</h2>
                  <p className="text-sm text-gray-500 mt-1">What shows up in your notification bell. Changes save automatically.</p>
                </div>
                <span className="text-xs font-medium shrink-0 pt-1 min-h-5" role="status" aria-live="polite">
                  {prefsStatus === "saving" && <span className="flex items-center gap-1 text-gray-400"><Loader2 size={12} className="animate-spin" /> Saving</span>}
                  {prefsStatus === "saved" && <span className="flex items-center gap-1 text-emerald-600"><Check size={13} /> Saved</span>}
                </span>
              </div>

              {prefsStatus === "error" && (
                <p role="alert" className="mt-4 flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                  <AlertCircle size={15} /> That change didn&rsquo;t save. Try again.
                </p>
              )}

              <ul className="mt-4 divide-y divide-gray-100">
                {visibleSwitches.map((row) => {
                  const enabled = toggles[row.key];
                  const id = `notif-${row.key}`;
                  return (
                    <li key={row.key} className="flex items-center justify-between gap-4 py-3.5">
                      <div className="min-w-0">
                        <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">{row.label}</label>
                        <p id={`${id}-desc`} className="text-sm text-gray-500 mt-0.5">{row.description}</p>
                      </div>
                      <button
                        id={id}
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-describedby={`${id}-desc`}
                        onClick={() => togglePreference(row.key)}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${enabled ? "bg-indigo-600" : "bg-gray-300"}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
