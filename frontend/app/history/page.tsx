"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Download, CheckCircle2, ArrowLeft, Search, UserCircle2, PlusCircle
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFound, setIsFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setTimeout(() => {
      if (searchQuery === "1234567" || searchQuery.toLowerCase() === "somchai") {
        setIsFound(true);
      } else {
        alert("ไม่พบข้อมูล (ทดสอบพิมพ์: 1234567)");
        setIsFound(false);
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Stethoscope size={24} /> Dr. Bigboss สุดหล่อ
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/"><NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" /></Link>
          <Link href="/history"><NavItem icon={<Users size={20}/>} label="Patients" active/></Link>
          <Link href="/diagnosis"><NavItem icon={<Stethoscope size={20}/>} label="Diagnosis"/></Link>
          <NavItem icon={<Settings size={20}/>} label="Setting" />
        </nav>
        <div className="p-4 border-t text-nowrap">
          <Link href="/"><button className="flex items-center gap-3 text-slate-400 hover:text-red-500 w-full px-4 py-2 transition text-sm font-medium"><LogOut size={18} /> Logout</button></Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition"><ArrowLeft size={20} /></Link>
            <span className="text-gray-400 text-sm">Patient Database / Search</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-green-500 flex items-center gap-1.5 text-sm">Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div></span>
            </div>

            {/* ✅ เชื่อมหน้า Create เรียบร้อย */}
            <Link href="/history/create">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm">
                <PlusCircle size={16} /> ลงทะเบียนผู้ป่วยใหม่
              </button>
            </Link>

            <button className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition border">
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="ใส่หมายเลข HN (เช่น 1234567)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <button type="submit" disabled={loading} className="bg-[#1e3a8a] text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-md disabled:bg-slate-400">
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>
            </div>

            {isFound ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8 border-b pb-4 text-nowrap">
                  <h2 className="text-2xl font-bold text-slate-800">Patient Record Found</h2>
                  <button onClick={() => setIsFound(false)} className="text-sm text-red-400 hover:underline">Clear Result</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/50 flex flex-col items-center justify-center min-h-[300px]">
                      <UserCircle2 size={100} className="text-blue-200 mb-4" />
                      <p className="text-slate-400 text-xs font-bold uppercase">Stored MRI Scanning</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition">View Full History</button>
                        <Link href="/diagnosis" className="flex-1"><button className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-bold border border-blue-100 hover:bg-blue-100 transition">New Diagnosis</button></Link>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">ID Number</p>
                        <h3 className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">{searchQuery}</h3>
                        <p className="text-lg font-bold text-slate-600 mt-1">นายสมชาย ใจดีมาก</p>
                    </div>
                    
                    {/* 🔥 หลอดระดับอาการที่กลับมาครบ 4 ระดับ */}
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase border-b pb-1">Prediction Analysis</p>
                      <ProbabilityBar label="Non-Demented" value={10} />
                      <ProbabilityBar label="Very Mild Demented" value={2} />
                      <ProbabilityBar label="Mild Demented" value={88} highlight={true} />
                      <ProbabilityBar label="Moderate Demented" value={0} />
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] flex justify-between font-bold text-slate-400">
                        <span>Latest Scan: 8 Feb 2024</span>
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-slate-400">
                <Users size={48} className="opacity-20 mb-4" />
                <p className="text-xl font-bold text-slate-500">พร้อมค้นหาข้อมูลคนไข้</p>
                <p className="text-sm">กรุณาระบุหมายเลข HN เพื่อดูรายละเอียด</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
      {icon} <span className="font-medium text-sm text-nowrap">{label}</span>
    </div>
  );
}

function ProbabilityBar({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[11px]">
        <span className={highlight ? "font-bold text-emerald-600 uppercase" : "text-slate-500 font-medium"}>{label}</span>
        <span className={highlight ? "font-bold text-emerald-600" : "font-mono"}>{value}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 relative overflow-hidden">
        <div className={`h-full absolute left-0 transition-all duration-1000 ${highlight ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
