"use client";

<<<<<<< Updated upstream
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // แนะนำให้ใช้ 'framer-motion' แทน 'motion/react' ใน Next.js
import {
  User, Lock, LogOut, Stethoscope, History, FlaskConical,
  Bed, Activity, ShieldCheck, Hospital, LayoutDashboard, Key,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

// --- Types ---
type Role = 'DOCTOR' | 'NURSE';

interface UserData {
  username: string;
  role: Role;
  name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  token: string | null;
}

// --- Mock Database ---
const MOCK_USERS: Record<string, { password: string; role: Role; name: string }> = {
  'doctor': { password: '123', role: 'DOCTOR', name: 'นพ. สมชาย ใจดี' },
  'nurse': { password: '123', role: 'NURSE', name: 'พว. สมศรี มีสุข' },
};

// --- Helper: Generate Fake JWT ---
const generateFakeToken = (username: string, role: string) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub: username, role, iat: Math.floor(Date.now() / 1000) }));
  const signature = "fake_signature_hash_" + Math.random().toString(36).substring(7);
  return `${header}.${payload}.${signature}`;
};

export default function LoginPage() {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 🚀 ยิงไปหา API Backend (รองรับ Environment Variable สำหรับ Vercel + ngrok)
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ถ้าล็อกอินสำเร็จ (API ตอบ 200 OK)
        setAuth({
          isAuthenticated: true,
          // ใช้ username จากที่กรอก และกำหนด Role แบบ Hardcode ไปก่อน (เพราะตอนนี้ API ยังไม่ดึงข้อมูลจาก DB)
          user: { 
            username: username, 
            role: username === 'doctor' || username === 'doctor_somchai' ? 'DOCTOR' : 'NURSE', 
            name: username === 'doctor' || username === 'doctor_somchai' ? 'นพ. สมชาย ใจดี' : 'พว. สมศรี มีสุข' 
          },
          token: data.token, // 🔑 เอา Token ที่ API ส่งมาไปใช้งาน!
        });
      } else {
        // ถ้ารหัสผิด (API ตอบ 400 หรือ 401)
        setError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null, token: null });
    setUsername('');
    setPassword('');
  };

  const handleContactAdmin = () => {
    Swal.fire({
      title: '<strong>Contact Administrator</strong>',
      icon: 'info',
      html:
        '<div class="text-left space-y-2">' +
        '<p><b>Phone:</b> 043-363-xxx (IT Support)</p>' +
        '<p><b>Email:</b> it-support@mdkku.com</p>' +
        '<p><b>Office:</b> Building 1, 4th Floor</p>' +
        '</div>',
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: 'Close',
      confirmButtonColor: '#3b82f6',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <AnimatePresence mode="wait">
        {!auth.isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl bg-slate-800/80 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[500px] shadow-2xl border border-slate-700"
          >
            {/* Left Side: Branding */}
            <div className="w-full md:w-1/2 bg-blue-600/20 p-12 flex flex-col justify-center items-center text-center space-y-6 border-b md:border-b-0 md:border-r border-slate-700/50">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner"
              >
                <Hospital className="w-12 h-12 text-blue-400" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">โรงพยาบาลศรีนครินทร์</h1>
                <p className="text-blue-200/70 text-sm font-medium">คณะแพทยศาสตร์ มหาวิทยาลัยขอนแก่น</p>
              </motion.div>
              <div className="pt-8 text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Srinagarind Hospital HIS
              </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1">MDKKU</h2>
                <p className="text-slate-400">ระบบสารสนเทศทางการแพทย์</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="กรอกชื่อผู้ใช้ (doctor_somchai / nurse)"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="password123/กรอกรหัสผ่าน (123)"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-sm font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'เข้าสู่ระบบ'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-center">
                <button
                  onClick={handleContactAdmin}
                  className="text-sm text-slate-400 hover:text-blue-400 flex items-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  ลืมรหัสผ่านหรือพบปัญหา? ติดต่อผู้ดูแลระบบ
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-6xl space-y-6"
          >
            {/* Header */}
            <header className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">MDKKU Dashboard</h1>
                  <p className="text-slate-400 text-sm">ยินดีต้อนรับสู่ระบบสารสนเทศโรงพยาบาล</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-white font-semibold">{auth.user?.name}</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">{auth.user?.role}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleContactAdmin}
                    className="bg-slate-900 hover:bg-blue-900/30 text-slate-300 hover:text-blue-400 p-3 rounded-xl transition-all border border-slate-700"
                    title="ติดต่อผู้ดูแลระบบ"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="bg-slate-900 hover:bg-red-900/30 text-slate-300 hover:text-red-400 p-3 rounded-xl transition-all border border-slate-700"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Profile & Token */}
              <div className="space-y-6">
                <section className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> ข้อมูลผู้ใช้งาน
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-xs text-slate-500 uppercase mb-1">ชื่อ-นามสกุล</p>
                      <p className="text-white font-medium">{auth.user?.name}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                      <p className="text-xs text-slate-500 uppercase mb-1">ตำแหน่ง</p>
                      <p className="text-white font-medium">{auth.user?.role === 'DOCTOR' ? 'แพทย์ (Doctor)' : 'พยาบาล (Nurse)'}</p>
                    </div>
                  </div>
                </section>

                <section className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Key className="w-4 h-4" /> Session Token (Mock JWT)
                  </h3>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-hidden">
                    <p className="text-[10px] font-mono text-blue-400 break-all leading-relaxed opacity-80">
                      {auth.token}
                    </p>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500 italic text-center">
                    * โทเค็นนี้ถูกจำลองขึ้นเพื่อการทดสอบระบบความปลอดภัย
                  </p>
                </section>
              </div>

              {/* Right Column: Role-Based Menu */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl p-8 min-h-[400px] shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                    {auth.user?.role === 'DOCTOR' ? <Stethoscope className="text-blue-400" /> : <Activity className="text-emerald-400" />}
                    เมนูการใช้งานสำหรับ {auth.user?.role === 'DOCTOR' ? 'แพทย์' : 'พยาบาล'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {auth.user?.role === 'DOCTOR' ? (
                      <>
                        <MenuButton icon={<FlaskConical />} title="สั่งยา (Prescription)" desc="จัดการรายการยาและคำสั่งรักษา" color="blue" />
                        <Link href="/history" className="block w-full">
                          <MenuButton icon={<History />} title="ดูประวัติคนไข้ (EMR)" desc="ตรวจสอบประวัติการรักษาที่ผ่านมา" color="blue" />
                        </Link>
                        <MenuButton icon={<Activity />} title="ดูผล Lab (Laboratory)" desc="ตรวจสอบผลการตรวจทางห้องปฏิบัติการ" color="blue" />
                        {/* เพิ่มเมนูวิเคราะห์อัลไซเมอร์ให้หมอ */}
                        <Link href="/diagnosis" className="block w-full">
                          <MenuButton icon={<Stethoscope />} title="วิเคราะห์อัลไซเมอร์" desc="AI ช่วยวิเคราะห์ภาพสแกนสมอง" color="blue" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <MenuButton icon={<Bed />} title="จัดการเตียง (Bed Management)" desc="ตรวจสอบและจัดการสถานะเตียงผู้ป่วย" color="emerald" />
                        <MenuButton icon={<Activity />} title="บันทึกสัญญาณชีพ (V/S)" desc="บันทึกอุณหภูมิ ความดัน และชีพจร" color="emerald" />
                      </>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuButton({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: 'blue' | 'emerald' }) {
  const colorClasses = color === 'blue'
    ? 'bg-blue-600/10 text-blue-400 border-blue-500/20 hover:bg-blue-600/20'
    : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20';

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left ${colorClasses}`}
    >
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="font-bold text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </motion.button>
=======
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
>>>>>>> Stashed changes
  );
}