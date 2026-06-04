"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSession, clearSession, getSession, loadAdminAccounts } from "@/lib/session";

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null | undefined>(undefined);
  const [adminCount, setAdminCount] = useState(0);

  useEffect(() => {
    const stored = getSession();
    setSession(stored);
    setAdminCount(loadAdminAccounts().length);
  }, []);

  useEffect(() => {
    if (session === null) {
      router.replace("/");
    } else if (session && session.role !== "Admin") {
      router.replace("/portal");
    }
  }, [router, session]);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
          <p className="text-lg font-medium">Checking your session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-600">Admin dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold">Welcome back, {session.name}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              You are signed in as an Admin. Use this dashboard to review portal access and manage the system.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.replace("/");
            }}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-500">Admin email</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{session.email ?? "—"}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-500">Registered admins</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{adminCount}</p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">System rules</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-600">
            <li>Admins access this dashboard interface.</li>
            <li>Users and guests access the portal.</li>
            <li>Guest labels like Teacher, Staff, Student are purely visual.</li>
            <li>If College is selected anywhere, Department becomes required.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
