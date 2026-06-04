"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSession, clearSession, getSession } from "@/lib/session";

export default function PortalPage() {
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null | undefined>(undefined);

  useEffect(() => {
    const stored = getSession();
    setSession(stored);
  }, []);

  useEffect(() => {
    if (session === null) {
      router.replace("/");
    } else if (session && session.role === "Admin") {
      router.replace("/dashboard");
    }
  }, [router, session]);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
          <p className="text-lg font-medium">Checking your portal session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">User portal</p>
            <h1 className="mt-3 text-3xl font-semibold">Hello, {session.name}</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              You are signed in as a User. The portal uses the role labels for display purposes.
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
            <p className="text-sm font-semibold text-slate-500">Signed in with</p>
            <p className="mt-3 text-xl font-semibold text-slate-900 capitalize">{session.provider}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-500">Visual label</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{session.guestLabel ?? "Standard user"}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-500">Affiliation</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{session.affiliation ?? "None"}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-500">Department</p>
            <p className="mt-3 text-xl font-semibold text-slate-900">{session.department ?? "Not required"}</p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Portal details</h2>
          <p className="mt-4 text-slate-600">
            Teachers, Staff, and Students are labels used for the portal experience only. Your actual system role
            remains <span className="font-semibold">User</span> for this view.
          </p>
        </div>
      </div>
    </div>
  );
}
