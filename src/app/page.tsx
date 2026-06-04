"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Affiliation,
  GuestLabel,
  createGoogleSession,
  createGuestSession,
  getSession,
  registerAdminAccount,
  verifyAdminCredentials,
} from "@/lib/session";

const guestLabels = ["Teacher", "Staff", "Student"] as const;
const affiliations = ["College", "Company", "Other"] as const;

type GuestLabelOption = (typeof guestLabels)[number];
type AffiliationOption = (typeof affiliations)[number];

function decodeJwt(token: string) {
  const payload = token.split(".")[1] ?? "";
  try {
    return JSON.parse(decodeURIComponent(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(""),
    ));
  } catch {
    return null;
  }
}

export default function Home() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState<"signin" | "signup">("signin");
  const [guestForm, setGuestForm] = useState({
    name: "",
    guestLabel: "Teacher" as GuestLabelOption,
    affiliation: "College" as AffiliationOption,
    department: "",
  });
  const [adminForm, setAdminForm] = useState({
    email: "",
    password: "",
    name: "",
    affiliation: "College" as AffiliationOption,
    department: "",
  });
  const [googleForm, setGoogleForm] = useState({
    guestLabel: "Teacher" as GuestLabelOption,
    affiliation: "Company" as AffiliationOption,
    department: "",
  });
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleFormRef = useRef(googleForm);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const existing = getSession();
    if (existing) {
      router.replace(existing.role === "Admin" ? "/dashboard" : "/portal");
    } else {
      setSessionChecked(true);
    }
  }, [router]);

  useEffect(() => {
    googleFormRef.current = googleForm;
  }, [googleForm]);

  const handleGoogleCredential = useCallback(
    (response: { credential: string }) => {
      const payload = decodeJwt(response.credential) as { name?: string; email?: string } | null;
      if (!payload?.email) {
        setMessage("Google login failed: unable to read credential payload.");
        return;
      }

      const formState = googleFormRef.current;
      if (formState.affiliation === "College" && !formState.department.trim()) {
        setMessage("Department is required when College is selected.");
        return;
      }

      createGoogleSession({
        name: payload.name ?? payload.email,
        email: payload.email,
        guestLabel: formState.guestLabel,
        affiliation: formState.affiliation,
        department: formState.department,
      });
      router.replace("/portal");
    },
    [router],
  );

  useEffect(() => {
    if (!googleClientId || typeof window === "undefined") {
      return;
    }

    const renderGoogleButton = () => {
      const google = (window as any).google;
      if (!google?.accounts?.id || !googleButtonRef.current) {
        return;
      }

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        ux_mode: "popup",
      });
      google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 280,
      });
      setGoogleReady(true);
    };

    const existing = document.getElementById("google-gsi-client");
    if (existing && (window as any).google?.accounts?.id) {
      renderGoogleButton();
      return;
    }

    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.id = "google-gsi-client";
      script.onload = renderGoogleButton;
      document.head.appendChild(script);
    }
  }, [googleClientId, handleGoogleCredential]);

  const guestDepartmentRequired = guestForm.affiliation === "College";
  const googleDepartmentRequired = googleForm.affiliation === "College";
  const adminDepartmentRequired = adminForm.affiliation === "College";

  const handleGuestSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guestForm.name.trim()) {
      setMessage("Guest name is required.");
      return;
    }
    if (guestDepartmentRequired && !guestForm.department.trim()) {
      setMessage("Department is required when College is selected.");
      return;
    }

    createGuestSession({
      name: guestForm.name,
      guestLabel: guestForm.guestLabel,
      affiliation: guestForm.affiliation,
      department: guestForm.department,
    });

    router.push("/portal");
  };

  const handleAdminRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adminForm.email.trim() || !adminForm.password || !adminForm.name.trim()) {
      setMessage("Email, name, and password are required.");
      return;
    }
    if (adminForm.password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (adminDepartmentRequired && !adminForm.department.trim()) {
      setMessage("Department is required when College is selected.");
      return;
    }

    const result = registerAdminAccount({
      email: adminForm.email,
      password: adminForm.password,
      name: adminForm.name,
      affiliation: adminForm.affiliation,
      department: adminForm.department,
    });

    if (!result.success) {
      setMessage(result.message);
      return;
    }

    router.push("/dashboard");
  };

  const handleAdminLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = verifyAdminCredentials(adminForm.email, adminForm.password);
    if (!result.success) {
      setMessage(result.message);
      return;
    }
    router.push("/dashboard");
  };

  const handleGoogleDemo = () => {
    if (googleDepartmentRequired && !googleForm.department.trim()) {
      setMessage("Department is required when College is selected.");
      return;
    }

    createGoogleSession({
      name: "Google Demo User",
      email: "demo@example.com",
      guestLabel: googleForm.guestLabel,
      affiliation: googleForm.affiliation,
      department: googleForm.department,
    });
    router.push("/portal");
  };

  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
          <p className="text-lg font-medium">Preparing the login experience…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">MySaleStore access</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Sign in, create an admin account, or join as a guest.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Admins use the dashboard. Users and guests use the portal. Teacher, Staff, and Student labels are visual tags only.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Guest login</p>
                <h2 className="mt-3 text-2xl font-semibold">Join the portal as a guest</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">User role only</span>
            </div>

            <form className="space-y-6" onSubmit={handleGuestSubmit}>
              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Name</span>
                  <input
                    value={guestForm.name}
                    onChange={(event) => setGuestForm({ ...guestForm, name: event.target.value })}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Enter your name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Visual label</span>
                  <select
                    value={guestForm.guestLabel}
                    onChange={(event) => setGuestForm({ ...guestForm, guestLabel: event.target.value as GuestLabelOption })}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    {guestLabels.map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Affiliation</span>
                  <select
                    value={guestForm.affiliation}
                    onChange={(event) => setGuestForm({ ...guestForm, affiliation: event.target.value as AffiliationOption })}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    {affiliations.map((affiliation) => (
                      <option key={affiliation} value={affiliation}>
                        {affiliation}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Department</span>
                  <input
                    value={guestForm.department}
                    onChange={(event) => setGuestForm({ ...guestForm, department: event.target.value })}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder={guestDepartmentRequired ? "Required for College" : "Optional"}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Continue as guest
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Admin account</p>
                <h2 className="mt-3 text-2xl font-semibold">Create or sign in</h2>
              </div>
              <div className="inline-flex rounded-full bg-slate-100 p-2">
                {(["signin", "signup"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setAdminMode(mode);
                      setMessage(null);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      adminMode === mode
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {mode === "signin" ? "Sign in" : "Sign up"}
                  </button>
                ))}
              </div>
            </div>

            <form
              className="space-y-6"
              onSubmit={adminMode === "signup" ? handleAdminRegister : handleAdminLogin}
            >
              {adminMode === "signup" && (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Name</span>
                  <input
                    value={adminForm.name}
                    onChange={(event) => setAdminForm({ ...adminForm, name: event.target.value })}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    placeholder="Admin display name"
                  />
                </label>
              )}

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  value={adminForm.email}
                  onChange={(event) => setAdminForm({ ...adminForm, email: event.target.value })}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="admin@example.com"
                  type="email"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  value={adminForm.password}
                  onChange={(event) => setAdminForm({ ...adminForm, password: event.target.value })}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  placeholder="At least 8 characters"
                  type="password"
                />
              </label>

              {adminMode === "signup" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Affiliation</span>
                    <select
                      value={adminForm.affiliation}
                      onChange={(event) =>
                        setAdminForm({
                          ...adminForm,
                          affiliation: event.target.value as AffiliationOption,
                        })
                      }
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    >
                      {affiliations.map((affiliation) => (
                        <option key={affiliation} value={affiliation}>
                          {affiliation}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Department</span>
                    <input
                      value={adminForm.department}
                      onChange={(event) => setAdminForm({ ...adminForm, department: event.target.value })}
                      className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                      placeholder={adminDepartmentRequired ? "Required for College" : "Optional"}
                    />
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {adminMode === "signup" ? "Create admin account" : "Sign in"}
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-600">Google login</p>
              <h2 className="mt-3 text-2xl font-semibold">Sign in with Google</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">Portal access</span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Visual label</span>
              <select
                value={googleForm.guestLabel}
                onChange={(event) => setGoogleForm({ ...googleForm, guestLabel: event.target.value as GuestLabelOption })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {guestLabels.map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Affiliation</span>
              <select
                value={googleForm.affiliation}
                onChange={(event) => setGoogleForm({ ...googleForm, affiliation: event.target.value as AffiliationOption })}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {affiliations.map((affiliation) => (
                  <option key={affiliation} value={affiliation}>
                    {affiliation}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mt-6 space-y-2">
            <span className="text-sm font-medium text-slate-700">Department</span>
            <input
              value={googleForm.department}
              onChange={(event) => setGoogleForm({ ...googleForm, department: event.target.value })}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder={googleDepartmentRequired ? "Required for College" : "Optional"}
            />
          </label>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">Google login support</p>
              <p className="mt-2 text-sm text-slate-600">
                If a Google client ID is configured with <code className="rounded bg-slate-100 px-1 py-0.5">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>, the real Google button will appear.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
              {googleClientId ? (
                <div ref={googleButtonRef} className="min-h-[56px]" />
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleDemo}
                  className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Demo Google login
                </button>
              )}
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-900 shadow-sm">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
