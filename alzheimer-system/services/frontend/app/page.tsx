"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// เลือกใช้เฉพาะไอคอนมาตรฐานที่มีในทุกเวอร์ชัน
import { 
  User, Lock, LogOut, Stethoscope, Activity, 
  Hospital, LayoutDashboard, Key 
} from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      setIsLogin(true);
    } else {
      alert('รหัสผ่านไม่ถูกต้อง (ลอง admin / 1234)');
    }
  };

  if (isLogin) {
    return (
      <div className="flex h-screen bg-[#f8fafc]">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
          <div className="p-6">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
              <Stethoscope size={24} /> Dr. Bigboss
            </h1>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-md cursor-pointer">
              <LayoutDashboard size={20} /> <span className="font-medium text-sm">Dashboard</span>
            </div>
            {/* ลิงก์ไปหน้าวิเคราะห์โรค */}
            <a href="/diagnosis" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-xl transition cursor-pointer">
              <Activity size={20} /> <span className="font-medium text-sm">Diagnosis</span>
            </a>
          </nav>
          <div className="p-4 border-t">
            <button onClick={() => setIsLogin(false)} className="flex items-center gap-3 text-gray-500 hover:text-red-500 w-full px-4 py-2 transition">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Hospital Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><User size={24}/></div>
              <div><p className="text-sm text-slate-500">Total Patients</p><p className="text-2xl font-bold">1,284</p></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600"><Activity size={24}/></div>
              <div><p className="text-sm text-slate-500">Active Cases</p><p className="text-2xl font-bold">342</p></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Hospital size={24}/></div>
              <div><p className="text-sm text-slate-500">Available Beds</p><p className="text-2xl font-bold">89</p></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // หน้า Login
  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark p-10 rounded-3xl w-full max-w-md relative z-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="bg-blue-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-400/30">
            <Stethoscope size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">MDKKU SYSTEM</h1>
          <p className="text-slate-400 text-sm mt-2">Healthcare Management Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            <Key size={18} /> Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
}