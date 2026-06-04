export type GuestLabel = "Teacher" | "Staff" | "Student";
export type Affiliation = "College" | "Company" | "Other";
export type AuthProvider = "guest" | "google" | "local";
export type AppRole = "Admin" | "User";

export interface AppSession {
  id: string;
  name: string;
  role: AppRole;
  provider: AuthProvider;
  email?: string;
  guestLabel?: GuestLabel;
  affiliation?: Affiliation;
  department?: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  affiliation?: Affiliation;
  department?: string;
}

const SESSION_KEY = "mysale-session";
const ADMIN_ACCOUNTS_KEY = "mysale-admins";

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function getSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  return safeParse<AppSession>(window.localStorage.getItem(SESSION_KEY));
}

export function setSession(session: AppSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function loadAdminAccounts(): AdminAccount[] {
  if (typeof window === "undefined") return [];
  return safeParse<AdminAccount[]>(window.localStorage.getItem(ADMIN_ACCOUNTS_KEY)) ?? [];
}

export function saveAdminAccounts(accounts: AdminAccount[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function registerAdminAccount({
  email,
  password,
  name,
  affiliation,
  department,
}: Omit<AdminAccount, "id">): { success: boolean; message: string; session?: AppSession } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password || !name.trim()) {
    return { success: false, message: "Email, name, and password are required." };
  }

  const current = loadAdminAccounts();
  if (current.some((account) => account.email === normalizedEmail)) {
    return { success: false, message: "An admin account with that email already exists." };
  }

  const newAccount: AdminAccount = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password,
    name: name.trim(),
    affiliation,
    department,
  };

  saveAdminAccounts([...current, newAccount]);

  const session: AppSession = {
    id: crypto.randomUUID(),
    name: newAccount.name,
    role: "Admin",
    provider: "local",
    email: newAccount.email,
    affiliation: newAccount.affiliation,
    department: newAccount.department,
  };

  setSession(session);

  return { success: true, message: "Admin account created.", session };
}

export function verifyAdminCredentials(
  email: string,
  password: string,
): { success: boolean; message: string; session?: AppSession } {
  const normalizedEmail = email.trim().toLowerCase();
  const current = loadAdminAccounts();
  const match = current.find((account) => account.email === normalizedEmail && account.password === password);

  if (!match) {
    return { success: false, message: "Invalid email or password." };
  }

  const session: AppSession = {
    id: crypto.randomUUID(),
    name: match.name,
    role: "Admin",
    provider: "local",
    email: match.email,
    affiliation: match.affiliation,
    department: match.department,
  };

  setSession(session);
  return { success: true, message: "Signed in successfully.", session };
}

export function createGuestSession({
  name,
  guestLabel,
  affiliation,
  department,
}: {
  name: string;
  guestLabel: GuestLabel;
  affiliation: Affiliation;
  department?: string;
}): AppSession {
  const session: AppSession = {
    id: crypto.randomUUID(),
    name: name.trim() || "Guest User",
    role: "User",
    provider: "guest",
    guestLabel,
    affiliation,
    department: affiliation === "College" ? department?.trim() : department,
  };

  setSession(session);
  return session;
}

export function createGoogleSession({
  name,
  email,
  guestLabel,
  affiliation,
  department,
}: {
  name: string;
  email?: string;
  guestLabel?: GuestLabel;
  affiliation?: Affiliation;
  department?: string;
}): AppSession {
  const session: AppSession = {
    id: crypto.randomUUID(),
    name: name.trim() || "Google User",
    role: "User",
    provider: "google",
    email: email?.trim().toLowerCase(),
    guestLabel,
    affiliation,
    department: affiliation === "College" ? department?.trim() : department,
  };

  setSession(session);
  return session;
}
