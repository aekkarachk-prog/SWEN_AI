"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  authenticateDoctor,
  clearSession,
  createSession,
  formatThaiDateTime,
  getAccessLogsByDoctor,
  getSession,
  registerDoctor,
  writeAccessLog,
  type SessionData,
  type UserRole,
} from "./lib/mdkku-auth";

type AuthMode = "login" | "register";

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "DOCTOR" as UserRole,
    licenseNo: "",
    department: "",
  });

  const [session, setSession] = useState<SessionData | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  const refreshAuth = useCallback(() => {
    const activeSession = getSession();
    setSession(activeSession);
    setIsCheckingAuth(false);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (!session?.user) return;
    writeAccessLog({ action: "OPEN_DASHBOARD", page: "/", session });
    setDashboardRefreshKey((prev) => prev + 1);
  }, [session?.token]);

  const doctorLogs = useMemo(
    () => getAccessLogsByDoctor(session?.user.id).slice(0, 10),
    [session?.user.id, dashboardRefreshKey]
  );

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerForm.fullName || !registerForm.username || !registerForm.password) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const doctor = registerDoctor({
        fullName: registerForm.fullName,
        username: registerForm.username,
        password: registerForm.password,
        role: registerForm.role,
        licenseNo: registerForm.licenseNo,
        department: registerForm.department,
      });

      const tempSession = createSession(doctor);
      writeAccessLog({
        action: "REGISTER_DOCTOR",
        page: "/",
        detail: `ลงทะเบียนแพทย์ใหม่: ${doctor.fullName}`,
        session: tempSession,
      });
      clearSession();

      setRegisterForm({
        fullName: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "DOCTOR",
        licenseNo: "",
        department: "",
      });
      setLoginForm({ username: doctor.username, password: "" });
      setAuthMode("login");
      alert("ลงทะเบียนแพทย์สำเร็จ");
    } catch (error: any) {
      alert(error?.message || "ลงทะเบียนไม่สำเร็จ");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const doctor = authenticateDoctor(loginForm.username, loginForm.password);
      if (!doctor) {
        throw new Error("ไม่พบบัญชีแพทย์ หรือรหัสผ่านไม่ถูกต้อง");
      }

      const nextSession = createSession(doctor);
      writeAccessLog({
        action: "LOGIN",
        page: "/",
        session: nextSession,
        detail: "เข้าสู่ระบบสำเร็จ",
      });

      setSession(nextSession);
      setLoginForm({ username: "", password: "" });
    } catch (error: any) {
      alert(error?.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  const handleLogout = () => {
    if (session) {
      writeAccessLog({
        action: "LOGOUT",
        page: "/",
        session,
        detail: "ออกจากระบบ",
      });
    }
    clearSession();
    setSession(null);
    setDashboardRefreshKey((prev) => prev + 1);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        กำลังโหลด...
      </div>
    );
  }

  if (session?.user) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">MDKKU Dashboard</h1>
              <p className="text-slate-300 mt-1">
                ระบบลงทะเบียนแพทย์และบันทึกการเข้าใช้
              </p>
            </div>

            <div className="text-right">
              <div className="font-semibold">{session.user.name}</div>
              <div className="text-sm text-slate-300">
                {session.user.role} • {session.user.department || "ไม่ระบุแผนก"}
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow">
              <h2 className="font-bold mb-3">ข้อมูลแพทย์</h2>
              <div className="space-y-2 text-sm">
                <div>ชื่อ: {session.user.name}</div>
                <div>Username: {session.user.username}</div>
                <div>License: {session.user.licenseNo || "-"}</div>
                <div>แผนก: {session.user.department || "-"}</div>
                <div>เข้าสู่ระบบ: {formatThaiDateTime(session.loginAt)}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow md:col-span-2">
              <h2 className="font-bold mb-3">เมนูระบบ</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <Link
                  href="/diagnosis"
                  className="rounded-xl border p-4 hover:bg-slate-50"
                >
                  Diagnosis
                </Link>
                <Link
                  href="/history"
                  className="rounded-xl border p-4 hover:bg-slate-50"
                >
                  Patient History
                </Link>
                <Link
                  href="/history/create"
                  className="rounded-xl border p-4 hover:bg-slate-50"
                >
                  Create Patient
                </Link>
                <Link
                  href="/history/edit_del"
                  className="rounded-xl border p-4 hover:bg-slate-50"
                >
                  Edit / Delete
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow">
            <h2 className="font-bold mb-3">ประวัติการเข้าใช้ล่าสุด</h2>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">เวลา</th>
                    <th className="py-2 pr-4">Action</th>
                    <th className="py-2 pr-4">Page</th>
                    <th className="py-2">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-slate-500">
                        ยังไม่มีประวัติการใช้งาน
                      </td>
                    </tr>
                  ) : (
                    doctorLogs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0">
                        <td className="py-2 pr-4">{formatThaiDateTime(log.at)}</td>
                        <td className="py-2 pr-4">{log.action}</td>
                        <td className="py-2 pr-4">{log.page}</td>
                        <td className="py-2">{log.detail || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-slate-900 p-8">
          <h1 className="text-3xl font-bold">MDKKU</h1>
          <p className="mt-3 text-slate-300">
            ระบบวิเคราะห์ Alzheimer พร้อมระบบลงทะเบียนแพทย์และบันทึกการเข้าใช้
          </p>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setAuthMode("login")}
              className={`rounded-xl px-4 py-2 ${
                authMode === "login" ? "bg-blue-600" : "bg-slate-800"
              }`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className={`rounded-xl px-4 py-2 ${
                authMode === "register" ? "bg-emerald-600" : "bg-slate-800"
              }`}
            >
              ลงทะเบียนแพทย์
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900 p-8">
          {authMode === "login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <h2 className="text-2xl font-bold">เข้าสู่ระบบ</h2>
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="Username"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
              />
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
              />
              <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold">
                เข้าสู่ระบบ
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <h2 className="text-2xl font-bold">ลงทะเบียนแพทย์</h2>
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="ชื่อ-นามสกุล"
                value={registerForm.fullName}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, fullName: e.target.value })
                }
              />
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="Username"
                value={registerForm.username}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, username: e.target.value })
                }
              />
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="เลขใบประกอบวิชาชีพ"
                value={registerForm.licenseNo}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, licenseNo: e.target.value })
                }
              />
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="แผนก"
                value={registerForm.department}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, department: e.target.value })
                }
              />
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="Password"
                type="password"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
              />
              <input
                className="w-full rounded-xl bg-slate-800 px-4 py-3"
                placeholder="Confirm Password"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    confirmPassword: e.target.value,
                  })
                }
              />
              <button className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold">
                ลงทะเบียนแพทย์
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}