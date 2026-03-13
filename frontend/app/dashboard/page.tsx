"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Brain, Activity, Clock, UserCheck, 
  ArrowUpRight, AlertCircle, LayoutDashboard,
  Calendar, RefreshCcw, Stethoscope, Settings, 
  ChevronRight, Info, LogOut, MessageSquare, ArrowLeft, Shield
  } from 'lucide-react';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts/es6';
import Swal from 'sweetalert2';

interface SummaryData {
  kpi: {
    totalPatients: number;
    scansToday: number;
    analyzedToday: number;
    humanReviewedToday: number;
    accuracy: string;
    patientTrend: string;
    scanTrend: string;
    analyzedTrend: string;
    avgTurnaroundTime: string;
    accuracyTrend: string;
  };
  predictionData: Array<{ name: string; value: number; color: string }>;
  ageData: Array<{ range: string; male: number; female: number }>;
  recentActivities: Array<{
    id: string;
    hn: string;
    patient: string;
    type: string;
    status: string;
    time: string;
    alert: boolean;
  }>;
  trendData: Array<{ month: string; cases: number; risk: number }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState<string>("USER");
  const [isOnline, setIsOnline] = useState(true);

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${API_URL}/api/patients/analytics/summary`);
      if (!res.ok) throw new Error("Failed to fetch summary data");
      const summary = await res.json();
      setData(summary);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load Auth Data
    const savedAuth = localStorage.getItem('alz_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        setUserName(authData.user?.name || "Unknown User");
        setUserRole(authData.user?.role || "USER");
      } catch (e) {
        setUserName("Unknown User");
      }
    } else {
      setUserName("Unknown User");
    }

    // Theme Sync
    const savedTheme = localStorage.getItem('alz_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Initial Fetch
    fetchSummary();

    // Online Status Ping
    const checkStatus = async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      try {
        const res = await fetch(`${API_URL}/api/patients`, { method: "HEAD" });
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleShowInfo = () => {
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
      title: 'AI Classification Details',
      html: `
        <div class="text-left space-y-4 text-sm p-2">
          <div class="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <div class="w-3 h-3 rounded-full bg-emerald-500 mt-1 flex-shrink-0"></div>
            <div>
              <p class="font-bold text-emerald-700 dark:text-emerald-400 uppercase text-[10px]">Non-Demented</p>
              <p class="text-slate-600 dark:text-slate-400">สมองปกติ ไม่พบร่องรอยการเสื่อมของระบบประสาทที่ส่งผลต่อความจำ</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
            <div class="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
            <div>
              <p class="font-bold text-blue-700 dark:text-blue-400 uppercase text-[10px]">Very Mild Demented</p>
              <p class="text-slate-600 dark:text-slate-400">เริ่มมีอาการหลงลืมเล็กน้อยมาก มักเป็นจุดเริ่มต้นของการติดตามอย่างใกล้ชิด</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
            <div class="w-3 h-3 rounded-full bg-amber-500 mt-1 flex-shrink-0"></div>
            <div>
              <p class="font-bold text-amber-700 dark:text-amber-400 uppercase text-[10px]">Mild Demented</p>
              <p class="text-slate-600 dark:text-slate-400">มีภาวะสมองเสื่อมระยะเริ่มต้น กระทบต่อกิจวัตรประจำวันบางส่วน</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
            <div class="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
            <div>
              <p class="font-bold text-red-700 dark:text-red-400 uppercase text-[10px]">Moderate Demented</p>
              <p class="text-slate-600 dark:text-slate-400">ภาวะสมองเสื่อมระยะปานกลาง ต้องการการดูแลและการประเมินจากแพทย์ผู้เชี่ยวชาญทันที</p>
            </div>
          </div>
        </div>
      `,
      confirmButtonText: 'รับทราบ',
      confirmButtonColor: '#3b82f6',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800 rounded-[2rem]' : 'rounded-[2rem]',
        title: isDark ? 'text-white' : '',
      }
    });
  };

  const handleLogout = () => {
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.removeItem('alz_auth');
    Swal.fire({
      title: 'ออกจากระบบสำเร็จ',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
      }
    }).then(() => {
      window.location.href = "/";
    });
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
        '</div>',
      confirmButtonColor: '#3b82f6',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
      }
    });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col shadow-sm">
        <div className="p-6">
          <h1 className={`text-xl font-bold flex items-center gap-2 ${userRole === 'DOCTOR' || userRole === 'ADMIN' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {userRole === 'DOCTOR' ? <Stethoscope size={24} /> : userRole === 'ADMIN' ? <Shield size={24} /> : <Activity size={24} />} {userName}
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/"><NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" /></Link>
          <Link href="/dashboard"><NavItem icon={<Activity size={20}/>} label="Analytics" active/></Link>
          <Link href="/history"><NavItem icon={<Users size={20}/>} label="Patients" /></Link>
          {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
            <Link href="/diagnosis"><NavItem icon={<Stethoscope size={20}/>} label="Diagnosis"/></Link>
          )}
          {userRole === 'ADMIN' && (
            <Link href="/admin/accounts"><NavItem icon={<Shield size={20}/>} label="Accounts" /></Link>
          )}
          <Link href="/settings">
            <NavItem icon={<Settings size={20}/>} label="Setting" />
          </Link>
          <div onClick={handleContactAdmin}>
            <NavItem icon={<MessageSquare size={20}/>} label="Contact Admin" />
          </div>
        </nav>
        <div className="p-4 border-t dark:border-slate-800 text-nowrap">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-red-500 w-full px-4 py-2 transition text-sm font-medium"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition"><ArrowLeft size={20} /></Link>
            <span className="text-gray-400 dark:text-slate-500 text-sm font-medium tracking-tight">System / <span className="text-blue-600 font-bold">Analytics Dashboard</span></span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-500 dark:text-slate-400">Status:</span>
              {isOnline ? (
                <span className="text-green-500 flex items-center gap-1.5">
                  Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </span>
              ) : (
                <span className="text-red-500 flex items-center gap-1.5 text-sm">
                  Offline <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border dark:border-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <button 
              onClick={fetchSummary}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {isLoading ? (
              <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">กำลังประมวลผลข้อมูลวิเคราะห์...</p>
              </div>
            ) : error || !data ? (
              <div className="h-[60vh] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100 dark:border-red-900/30">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">เกิดข้อผิดพลาด</h2>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{error || "ไม่สามารถเชื่อมต่อได้"}</p>
                  <button onClick={fetchSummary} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20">ลองใหม่อีกครั้ง</button>
                </div>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KPICard title="ผู้ป่วยทั้งหมด" value={data.kpi.totalPatients.toLocaleString()} icon={<Users />} trend={data.kpi.patientTrend} color="blue" />
                  <KPICard title="MRI สแกนวันนี้" value={data.kpi.scansToday.toString()} icon={<Clock />} trend={data.kpi.scanTrend} color="amber" />
                  <KPICard title="วิเคราะห์สำเร็จ (วันนี้)" value={data.kpi.analyzedToday.toString()} icon={<Brain />} trend={data.kpi.analyzedTrend} color="emerald" />
                  <KPICard title="ความแม่นยำเฉลี่ย" value={data.kpi.accuracy} icon={<UserCheck />} trend="+0.2" color="indigo" />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Distribution Chart */}
                  <section className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase text-[11px] tracking-widest text-slate-400">AI Distribution</h3>
                      <button onClick={handleShowInfo} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                        <Info className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      </button>
                    </div>
                    <div className="h-64 flex items-center justify-center">
                      {data.predictionData.every(d => d.value === 0) ? (
                        <div className="text-center">
                          <Brain className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs text-slate-400 font-medium italic">No Data Analyzed</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={data.predictionData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name" stroke="none">
                              {data.predictionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            <Legend verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </section>

                  {/* Trend Analysis Chart */}
                  <section className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase text-[11px] tracking-widest text-slate-400">Activity Trends</h3>
                      <div className="text-[10px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">Last 6 Months</div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.trendData}>
                          <defs>
                            <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <YAxis width={30} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip />
                          <Area type="monotone" dataKey="cases" name="All Cases" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
                          <Area type="monotone" dataKey="risk" name="At Risk" stroke="#ef4444" strokeWidth={3} fill="none" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Demographics */}
                  <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 uppercase text-[11px] tracking-widest text-slate-400 text-nowrap">Age & Gender Profile</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.ageData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <YAxis width={30} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="female" name="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>

                  {/* Operational Metrics */}
                  <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 uppercase text-[11px] tracking-widest text-slate-400">System Performance</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg. Response Time</span>
                          <span className="text-xs font-black text-slate-800 dark:text-white">{data.kpi.avgTurnaroundTime} seconds</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.min(100, (parseFloat(data.kpi.avgTurnaroundTime) / 10) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Worker Load Distribution</h4>
                        <div className="space-y-4">
                          <WorkloadItem name="AI Analysis Agent" cases={data.kpi.analyzedToday} total={data.kpi.scansToday || 1} color="blue" />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Recent Activities */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase text-[11px] tracking-widest text-slate-400">Real-time Activity Stream</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-4">HN / Patient Name</th>
                          <th className="px-6 py-4">Action</th>
                          <th className="px-6 py-4">AI Diagnostic Result</th>
                          <th className="px-6 py-4">Time</th>
                          <th className="px-6 py-4 text-right">Profile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.recentActivities.map((activity) => (
                          <tr key={activity.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800 dark:text-white text-sm">{activity.hn}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{activity.patient}</div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400">
                              {activity.type}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                activity.status === 'Non Demented' || activity.status === 'Registration' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                activity.status === 'Very Mild Demented' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                activity.status === 'Mild Demented' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                activity.status === 'Moderate Demented' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400'
                              }`}>
                                {activity.alert && <AlertCircle className="w-3 h-3" />}
                                {activity.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[11px] font-medium text-slate-500">
                              {new Date(activity.time).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link href={`/history?hn=${activity.hn}`}>
                                <button className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                        {data.recentActivities.length === 0 && (
                          <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">No activity recorded today</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
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
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}

function KPICard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: string, color: string }) {
  const colorMap: any = {
    blue: 'bg-blue-600/10 text-blue-600 border-blue-200 dark:border-blue-900',
    emerald: 'bg-emerald-600/10 text-emerald-600 border-emerald-200 dark:border-emerald-900',
    amber: 'bg-amber-600/10 text-amber-600 border-amber-200 dark:border-amber-900',
    indigo: 'bg-indigo-600/10 text-indigo-600 border-indigo-200 dark:border-indigo-900',
  };

  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend}% <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</h4>
      </div>
    </motion.div>
  );
}

function WorkloadItem({ name, cases, total, color }: { name: string, cases: number, total: number, color: string }) {
  const percentage = (cases / (total || 1)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-black uppercase">
        <span className="text-slate-700 dark:text-slate-300">{name}</span>
        <span className="text-slate-400">{cases} / {total} TASK</span>
      </div>
      <div className="w-full bg-slate-50 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'}`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
