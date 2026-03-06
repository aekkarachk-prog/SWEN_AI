"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, UserCircle2, Lock, LogOut, Activity, 
  Beaker, FileClock, Brain, MessageSquare 
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Swal from 'sweetalert2';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); 

  // สร้างฟังก์ชันเช็ค Auth แยกออกมา
  const checkAuth = useCallback(() => {
    const savedSession = localStorage.getItem('mdkku_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setUserData(parsedSession.user);
        setSessionToken(parsedSession.token);
        setIsLoggedIn(true);
      } catch (err) {
        localStorage.removeItem('mdkku_session');
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
    setIsCheckingAuth(false);
  }, []);

  // ดักจับการย้อนกลับและดึง Cache
  useEffect(() => {
    checkAuth();

    const wakeUpGuard = () => checkAuth();
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) wakeUpGuard();
    };

    window.addEventListener('popstate', wakeUpGuard);
    window.addEventListener('focus', wakeUpGuard); 
    window.addEventListener('pageshow', handlePageShow as any);

    return () => {
      window.removeEventListener('popstate', wakeUpGuard);
      window.removeEventListener('focus', wakeUpGuard);
      window.removeEventListener('pageshow', handlePageShow as any);
    };
  }, [pathname, checkAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 🚀 --- โหมดประตูหลัง (Bypass) สำหรับบอส --- 🚀
    if (username === 'admin' && password === '1234') {
      const mockUser = { name: "นพ. สมชาย (ทดสอบ)", role: "DOCTOR" };
      setUserData(mockUser);
      setSessionToken("mock-token-99999");
      setIsLoggedIn(true);
      
      localStorage.setItem('mdkku_session', JSON.stringify({
        token: "mock-token-99999",
        user: mockUser
      }));
      setIsLoading(false);
      return; 
    }

    // โค้ดเชื่อม API ของจริง
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${API_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserData(data.user);
        setSessionToken(data.token);
        setIsLoggedIn(true);
        localStorage.setItem('mdkku_session', JSON.stringify({ token: data.token, user: data.user }));
      } else {
        setError(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ API ได้ (แต่บอสใช้ admin/1234 เข้าได้เลย!)');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setSessionToken(null);
    setUsername('');
    setPassword('');
    localStorage.removeItem('mdkku_session');
    router.replace('/'); 
  };

  const handleContactAdmin = () => {
    Swal.fire({
      title: '<strong>Contact Administrator</strong>',
      icon: 'info',
      html: `
        <div class="text-left space-y-2 text-slate-300">
          <p><b>Phone:</b> 043-363-xxx (IT Support)</p>
          <p><b>Email:</b> it-support@mdkku.com</p>
          <p><b>Office:</b> Building 1, 4th Floor</p>
        </div>
      `,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: 'Close',
      confirmButtonColor: '#3b82f6',
      background: '#1e293b',
      color: '#fff'
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: DASHBOARD
  // ==========================================
  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-8 font-sans text-slate-200">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <header className="bg-[#1e293b] rounded-2xl p-6 flex justify-between items-center shadow-lg border border-slate-700">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Building2 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MDKKU Dashboard</h1>
                <p className="text-slate-400 text-sm">ยินดีต้อนรับสู่ระบบสารสนเทศโรงพยาบาล</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-medium text-white">{userData?.name || 'Unknown'}</p>
                <p className="text-sm text-emerald-400 font-semibold uppercase flex items-center justify-end gap-1">
                  <CheckCircleIcon /> {userData?.role || 'USER'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleContactAdmin}
                  className="p-3 bg-slate-800 hover:bg-blue-900/30 text-slate-300 hover:text-blue-400 rounded-xl transition-all border border-slate-700 hover:border-blue-500/50"
                  title="ติดต่อผู้ดูแลระบบ"
                >
                  <MessageSquare size={20} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-3 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl transition-all border border-slate-700 hover:border-red-500/50"
                  title="ออกจากระบบ"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 space-y-6">
              <div className="bg-[#1e293b] rounded-2xl p-6 shadow-lg border border-slate-700">
                <h2 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                  <UserCircle2 size={18} /> ข้อมูลผู้ใช้งาน
                </h2>
                <div className="space-y-4">
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">ชื่อ-นามสกุล</p>
                    <p className="font-medium text-white">{userData?.name}</p>
                  </div>
                  <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-500 mb-1">ตำแหน่ง</p>
                    <p className="font-medium text-white">
                      {userData?.role === 'DOCTOR' ? 'แพทย์ (Doctor)' : 'พยาบาล (Nurse)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e293b] rounded-2xl p-6 shadow-lg border border-slate-700">
                <h2 className="text-slate-300 font-medium mb-4 flex items-center gap-2">
                  <Lock size={18} /> SESSION TOKEN
                </h2>
                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 break-all">
                  <p className="text-xs text-blue-400 font-mono">
                    {sessionToken || "No Token"}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 bg-[#1e293b] rounded-2xl p-8 shadow-lg border border-slate-700">
              <h2 className="text-xl text-white font-medium mb-6 flex items-center gap-2">
                <Activity size={24} className="text-blue-500" /> เมนูการใช้งานสำหรับ {userData?.role === 'DOCTOR' ? 'แพทย์' : 'พยาบาล'}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userData?.role === 'DOCTOR' ? (
                  <>
                    <MenuCard icon={<Beaker />} title="สั่งยา (Prescription)" desc="จัดการรายการยาและคำสั่งรักษา" />
                    <Link href="/history" className="block">
                       <MenuCard icon={<FileClock />} title="ดูประวัติคนไข้ (EMR)" desc="ตรวจสอบประวัติการรักษาที่ผ่านมา" />
                    </Link>
                    <MenuCard icon={<Activity />} title="ดูผล Lab (Laboratory)" desc="ตรวจสอบผลการตรวจทางห้องปฏิบัติการ" />
                    <Link href="/diagnosis" className="block">
                      <div className="bg-[#2e3b55] hover:bg-blue-600/20 border border-slate-600 hover:border-blue-500 transition-all p-6 rounded-xl cursor-pointer group h-full">
                        <Brain size={28} className="text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-medium text-lg mb-1">วิเคราะห์อัลไซเมอร์</h3>
                        <p className="text-sm text-slate-400">AI ช่วยวิเคราะห์ภาพสแกนสมอง</p>
                      </div>
                    </Link>
                  </>
                ) : (
                  <>
                    <MenuCard icon={<Activity />} title="บันทึกสัญญาณชีพ" desc="Vitals sign & Monitoring" />
                    <MenuCard icon={<UserCircle2 />} title="จัดการเตียงผู้ป่วย" desc="Bed Management System" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LOGIN PAGE 
  // ==========================================
  return (
    <div className="min-h-screen flex bg-[#0f172a]">
      <div className="hidden lg:flex w-1/2 bg-[#1e3a8a] flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-800/40 via-transparent to-transparent"></div>
        <div className="relative z-10 text-center text-white space-y-6 max-w-md">
          <div className="bg-white/10 p-6 rounded-3xl inline-block backdrop-blur-sm border border-white/20 mb-4 shadow-xl">
            <Building2 size={64} className="text-blue-200" />
          </div>
          <h1 className="text-4xl font-bold tracking-wide">โรงพยาบาลศรีนครินทร์</h1>
          <p className="text-blue-200 text-lg">คณะแพทยศาสตร์ มหาวิทยาลัยขอนแก่น</p>
          <div className="pt-8 border-t border-blue-800/50">
            <p className="text-sm text-blue-300 tracking-widest uppercase font-semibold">Srinagarind Hospital HIS</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0f172a]">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">MDKKU</h2>
            <p className="text-slate-400 font-medium">ระบบสารสนเทศทางการแพทย์</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 mt-12">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Username</label>
              <div className="relative">
                <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 text-white px-12 py-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="กรอกชื่อผู้ใช้ (admin)" 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1e293b] border border-slate-700 text-white px-12 py-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  placeholder="กรอกรหัสผ่าน (1234)"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 mt-4 active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function MenuCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-[#0f172a] border border-slate-700 p-6 rounded-xl group hover:border-slate-500 transition-all h-full">
      <div className="text-slate-400 mb-3 group-hover:text-white transition-colors">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <h3 className="text-white font-medium text-lg mb-1">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}