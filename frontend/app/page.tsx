"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, LogOut, Stethoscope, History,
  Bed, Activity, Shield, Hospital, LayoutDashboard, Key,
  MessageSquare, Settings as SettingsIcon, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

// --- Types ---
type Role = 'ADMIN' | 'DOCTOR' | 'NURSE';

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

  // 🔒 Lockout State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  // 🕒 Handle Lockout Countdown
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => prev - 1);
      }, 1000);
    } else if (lockoutTime === 0) {
      setIsLocked(false);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutTime]);

  // 🔄 Check for existing session on mount
  React.useEffect(() => {
    const savedAuth = localStorage.getItem('alz_auth');
    if (savedAuth) {
      try {
        setAuth(JSON.parse(savedAuth));
      } catch (e) {
        localStorage.removeItem('alz_auth');
      }
    }

    // Load and Sync Theme - Explicitly default to light
    const savedTheme = localStorage.getItem('alz_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('alz_theme', 'light');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    
    setIsLoading(true);
    setError('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });

      const data = await res.json();

      if (res.ok) {
        const newAuth = {
          isAuthenticated: true,
          user: data.user, 
          token: data.token,
        };
        setAuth(newAuth);
        localStorage.setItem('alz_auth', JSON.stringify(newAuth));
        setFailedAttempts(0); // Reset on successful login
      } else {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        if (newFailedAttempts >= 6) {
          setIsLocked(true);
          setLockoutTime(30);
          setError('คุณกรอกรหัสผิดเกิน 6 ครั้ง โปรดลองใหม่ในอีก 30 วินาที');
        } else {
          setError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('alz_auth');
    setAuth({ isAuthenticated: false, user: null, token: null });
    setUsername('');
    setPassword('');
  };

  const handleContactAdmin = () => {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
      title: '<strong>Contact Administrator</strong>',
      icon: 'info',
      html:
        '<div class="text-left space-y-2">' +
        '<p><b>Phone:</b> 043-363-xxx (IT Support)</p>' +
        '<p><b>Email:</b> it-support@mdkku.com</p>' +
        '<p><b>Office:</b> 9127, 1th Floor</p>' +
        '</div>',
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: 'Close',
      confirmButtonColor: '#3b82f6',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <AnimatePresence mode="wait">
        {!auth.isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-4xl bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl overflow-hidden flex flex-col md:flex-row min-h-[500px] shadow-2xl border border-slate-200 dark:border-slate-700"
          >
            {/* Left Side: Branding */}
            <div className="w-full md:w-1/2 bg-blue-600/5 dark:bg-blue-600/20 p-12 flex flex-col justify-center items-center text-center space-y-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700/50">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-inner"
              >
                <Hospital className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white mb-2">โรงพยาบาลศรีนครินทร์</h1>
                <p className="text-blue-600/70 dark:text-blue-200/70 text-sm font-medium">คณะแพทยศาสตร์ มหาวิทยาลัยขอนแก่น</p>
              </motion.div>
              <div className="pt-8 text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Srinagarind Hospital HIS
              </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full md:w-1/2 p-12 flex flex-col justify-center bg-white dark:bg-transparent">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">MDKKU</h2>
                <p className="text-slate-500 dark:text-slate-400">ระบบสารสนเทศทางการแพทย์</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="กรอกชื่อผู้ใช้"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="กรอกรหัสผ่าน"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-500 dark:text-red-400 text-sm font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || isLocked}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : isLocked ? (
                    `โปรดลองใหม่ใน (${lockoutTime}s)`
                  ) : (
                    'เข้าสู่ระบบ'
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 flex justify-center">
                <button
                  onClick={handleContactAdmin}
                  className="text-sm text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors"
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
            <header className="bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800 dark:text-white">MDKKU Dashboard</h1>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">ยินดีต้อนรับสู่ระบบสารสนเทศโรงพยาบาล</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-slate-800 dark:text-white font-semibold">{auth.user?.name}</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">{auth.user?.role}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href="/settings">
                    <button
                      className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 p-3 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                      title="ตั้งค่า"
                    >
                      <SettingsIcon className="w-5 h-5" />
                    </button>
                  </Link>
                  
                  <button
                    onClick={handleContactAdmin}
                    className="bg-slate-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 p-3 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                    title="ติดต่อผู้ดูแลระบบ"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="bg-slate-100 dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 p-3 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Profile */}
              <div className="space-y-6">
                <section className="bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> ข้อมูลผู้ใช้งาน
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <p className="text-xs text-slate-500 uppercase mb-1">ตำแหน่ง</p>
                      <p className="text-slate-800 dark:text-white font-medium">
                        {auth.user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ (Admin)' : 
                         auth.user?.role === 'DOCTOR' ? 'แพทย์ (Doctor)' : 'พยาบาล (Nurse)'}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Role-Based Menu */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl p-8 min-h-[400px] shadow-lg">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                    {auth.user?.role === 'ADMIN' ? <Shield className="text-blue-600 dark:text-blue-400" /> : 
                     auth.user?.role === 'DOCTOR' ? <Stethoscope className="text-blue-600 dark:text-blue-400" /> : 
                     <Activity className="text-emerald-600 dark:text-emerald-400" />}
                    เมนูการใช้งานสำหรับ {auth.user?.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : 
                                       auth.user?.role === 'DOCTOR' ? 'แพทย์' : 'พยาบาล'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {auth.user?.role === 'ADMIN' ? (
                      <>
                        <Link href="/admin/accounts" className="block w-full">
                          <MenuButton icon={<Shield />} title="จัดการบัญชีผู้ใช้งาน" desc="สร้าง แก้ไข หรือลบ บัญชีแพทย์และพยาบาล" color="blue" />
                        </Link>
                        <Link href="/dashboard" className="block w-full">
                          <MenuButton icon={<LayoutDashboard />} title="Dashboard & Analytics" desc="สถิติและการวิเคราะห์ผลรวม" color="blue" />
                        </Link>
                        <Link href="/diagnosis" className="block w-full">
                          <MenuButton icon={<Stethoscope />} title="วิเคราะห์อัลไซเมอร์" desc="AI ช่วยวิเคราะห์ภาพสแกนสมอง" color="blue" />
                        </Link>
                        <Link href="/history" className="block w-full">
                          <MenuButton icon={<History />} title="ฐานข้อมูลผู้ป่วย" desc="ตรวจสอบรายชื่อผู้ป่วยทั้งหมด" color="blue" />
                        </Link>
                        <Link href="/settings" className="block w-full">
                          <MenuButton icon={<SettingsIcon />} title="ตั้งค่าระบบ" desc="กำหนดค่าการทำงานของระบบ" color="blue" />
                        </Link>
                      </>
                    ) : auth.user?.role === 'DOCTOR' ? (
                      <>
                        <Link href="/history" className="block w-full">
                          <MenuButton icon={<History />} title="ดูประวัติคนไข้ (EMR)" desc="ตรวจสอบประวัติการรักษาที่ผ่านมา" color="blue" />
                        </Link>
                        <Link href="/dashboard" className="block w-full">
                          <MenuButton icon={<LayoutDashboard />} title="Dashboard & Analytics" desc="สถิติและการวิเคราะห์ผลจาก AI" color="blue" />
                        </Link>
                        <Link href="/diagnosis" className="block w-full">
                          <MenuButton icon={<Stethoscope />} title="วิเคราะห์อัลไซเมอร์" desc="AI ช่วยวิเคราะห์ภาพสแกนสมอง" color="blue" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/history/create" className="block w-full">
                          <MenuButton icon={<UserPlus />} title="ลงทะเบียนผู้ป่วย" desc="เพิ่มข้อมูลผู้ป่วยใหม่เข้าระบบ" color="emerald" />
                        </Link>
                        <Link href="/history" className="block w-full">
                          <MenuButton icon={<History />} title="รายชื่อผู้ป่วย" desc="ดูรายชื่อและประวัติการรักษา" color="emerald" />
                        </Link>
                        <Link href="/dashboard" className="block w-full">
                          <MenuButton icon={<LayoutDashboard />} title="Dashboard & Analytics" desc="สถิติรวมของโรงพยาบาล" color="emerald" />
                        </Link>
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
    ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-600/20'
    : 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-600/20';

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-start gap-4 p-5 rounded-2xl border transition-all text-left w-full ${colorClasses}`}
    >
      <div className="mt-1">{icon}</div>
      <div>
        <h4 className="font-bold mb-1">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
      </div>
    </motion.button>
  );
}
