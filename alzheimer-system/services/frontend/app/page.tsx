"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // แนะนำให้ใช้ 'framer-motion' แทน 'motion/react' ใน Next.js
import {
  User, Lock, LogOut, Stethoscope, History, FlaskConical,
  Bed, Activity, ShieldCheck, Hospital, LayoutDashboard, Key
} from 'lucide-react';

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const userRecord = MOCK_USERS[username.toLowerCase()];
      if (userRecord && userRecord.password === password) {
        const token = generateFakeToken(username, userRecord.role);
        setAuth({
          isAuthenticated: true,
          user: { username, role: userRecord.role, name: userRecord.name },
          token: token,
        });
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, user: null, token: null });
    setUsername('');
    setPassword('');
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
                      placeholder="กรอกชื่อผู้ใช้ (doctor / nurse)"
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
                      placeholder="กรอกรหัสผ่าน (123)"
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
                <button
                  onClick={handleLogout}
                  className="bg-slate-900 hover:bg-red-900/30 text-slate-300 hover:text-red-400 p-3 rounded-xl transition-all border border-slate-700"
                  title="ออกจากระบบ"
                >
                  <LogOut className="w-5 h-5" />
                </button>
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
                        <MenuButton icon={<History />} title="ดูประวัติคนไข้ (EMR)" desc="ตรวจสอบประวัติการรักษาที่ผ่านมา" color="blue" />
                        <MenuButton icon={<Activity />} title="ดูผล Lab (Laboratory)" desc="ตรวจสอบผลการตรวจทางห้องปฏิบัติการ" color="blue" />
                        {/* เพิ่มเมนูวิเคราะห์อัลไซเมอร์ให้หมอ */}
                        <MenuButton icon={<Stethoscope />} title="วิเคราะห์อัลไซเมอร์" desc="AI ช่วยวิเคราะห์ภาพสแกนสมอง" color="blue" />
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
  );
}