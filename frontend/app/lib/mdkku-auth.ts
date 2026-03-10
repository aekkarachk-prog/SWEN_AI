export type UserRole = "DOCTOR" | "ADMIN";

export interface DoctorAccount {
  id: string;
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
  licenseNo: string;
  department: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  licenseNo: string;
  department: string;
}

export interface SessionData {
  token: string;
  loginAt: string;
  user: SessionUser;
}

export interface AccessLog {
  id: string;
  doctorId: string;
  doctorName: string;
  username: string;
  role: UserRole;
  action: string;
  page: string;
  detail?: string;
  at: string;
}

const DOCTORS_KEY = "mdkku_doctors";
const SESSION_KEY = "mdkku_session";
const ACCESS_LOGS_KEY = "mdkku_access_logs";

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDoctors(): DoctorAccount[] {
  return readJson<DoctorAccount[]>(DOCTORS_KEY, []);
}

export function registerDoctor(payload: {
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
  licenseNo: string;
  department: string;
}) {
  const doctors = getDoctors();
  const normalizedUsername = payload.username.trim().toLowerCase();

  const exists = doctors.some(
    (doctor) => doctor.username.toLowerCase() === normalizedUsername
  );

  if (exists) {
    throw new Error("ชื่อผู้ใช้นี้ถูกใช้งานแล้ว");
  }

  const newDoctor: DoctorAccount = {
    id: uid("doctor"),
    fullName: payload.fullName.trim(),
    username: normalizedUsername,
    password: payload.password,
    role: payload.role,
    licenseNo: payload.licenseNo.trim(),
    department: payload.department.trim(),
    createdAt: new Date().toISOString(),
  };

  writeJson(DOCTORS_KEY, [newDoctor, ...doctors]);
  return newDoctor;
}

export function authenticateDoctor(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();
  const doctors = getDoctors();

  return (
    doctors.find(
      (doctor) =>
        doctor.username.toLowerCase() === normalizedUsername &&
        doctor.password === password
    ) || null
  );
}

export function createSession(doctor: DoctorAccount): SessionData {
  const session: SessionData = {
    token: uid("token"),
    loginAt: new Date().toISOString(),
    user: {
      id: doctor.id,
      name: doctor.fullName,
      username: doctor.username,
      role: doctor.role,
      licenseNo: doctor.licenseNo,
      department: doctor.department,
    },
  };

  writeJson(SESSION_KEY, session);
  return session;
}

export function getSession(): SessionData | null {
  return readJson<SessionData | null>(SESSION_KEY, null);
}

export function clearSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

export function writeAccessLog(input: {
  action: string;
  page: string;
  detail?: string;
  session?: SessionData | null;
}) {
  if (!isBrowser()) return;

  const session = input.session ?? getSession();
  if (!session?.user) return;

  const logs = readJson<AccessLog[]>(ACCESS_LOGS_KEY, []);

  const newLog: AccessLog = {
    id: uid("log"),
    doctorId: session.user.id,
    doctorName: session.user.name,
    username: session.user.username,
    role: session.user.role,
    action: input.action,
    page: input.page,
    detail: input.detail,
    at: new Date().toISOString(),
  };

  writeJson(ACCESS_LOGS_KEY, [newLog, ...logs].slice(0, 300));
}

export function getAccessLogs(): AccessLog[] {
  return readJson<AccessLog[]>(ACCESS_LOGS_KEY, []);
}

export function getAccessLogsByDoctor(doctorId?: string) {
  if (!doctorId) return [];
  return getAccessLogs().filter((log) => log.doctorId === doctorId);
}

export function formatThaiDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}