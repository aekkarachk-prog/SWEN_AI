"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Download, CheckCircle2, ArrowLeft, Search, UserCircle2, PlusCircle,
  MessageSquare, Trash2
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // 🛠️ Helper สำหรับสร้าง API_URL
  const getApiUrl = () => {
    let url = process.env.NEXT_PUBLIC_API_URL || "";
    if (!url || url === "") return "/api";
    return url;
  };

  // 1. โหลดคนไข้ทั้งหมดเมื่อเข้าหน้าเว็ป
  const fetchAllPatients = async () => {
    try {
      const res = await fetch(`${getApiUrl()}/patients`);
      if (res.ok) {
        const data = await res.json();
        setAllPatients(data);
      }
    } catch (error) {
      console.error("Error fetching all patients:", error);
    }
  };

  React.useEffect(() => {
    fetchAllPatients();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setPatientData(null);
      return;
    }

    setLoading(true);
    setIsSearching(true);

    try {
      const res = await fetch(`${getApiUrl()}/patients/${searchQuery}`);
      const data = await res.json();

      if (res.ok) {
        setPatientData(data);
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่พบข้อมูล",
          text: `ไม่พบผู้ป่วยที่มีหมายเลข HN: ${searchQuery}`,
          confirmButtonColor: "#ef4444"
        });
        setPatientData(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์",
        confirmButtonColor: "#ef4444"
      });
    } finally {
      setLoading(false);
    }
  };

  const latestHistory = patientData?.history?.[patientData.history.length - 1];

  const handleDelete = async (id_card: string) => {
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "การลบข้อมูลนี้จะไม่สามารถเรียกคืนได้ และรูปภาพที่เกี่ยวข้องจะถูกลบทั้งหมด!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${getApiUrl()}/patients/${id_card}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          Swal.fire('ลบสำเร็จ!', 'ข้อมูลผู้ป่วยถูกลบออกจากระบบแล้ว', 'success');
          // รีเฟรชข้อมูล
          fetchAllPatients();
          setIsSearching(false);
          setPatientData(null);
        } else {
          throw new Error("Delete failed");
        }
      } catch (error) {
        Swal.fire('Error!', 'ไม่สามารถลบข้อมูลได้', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('alz_auth');
    Swal.fire({
      title: 'ออกจากระบบสำเร็จ',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.location.href = "/";
    });
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
          <div onClick={handleContactAdmin}>
            <NavItem icon={<MessageSquare size={20}/>} label="Contact Admin" />
          </div>
        </nav>
        <div className="p-4 border-t text-nowrap">
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
                  <input type="text" placeholder="ใส่หมายเลข HN หรือ ID Card (เช่น PT-123456)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <button type="submit" disabled={loading} className="bg-[#1e3a8a] text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-800 transition shadow-md disabled:bg-slate-400">
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>
            </div>

            {isSearching && patientData ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8 border-b pb-4 text-nowrap">
                  <h2 className="text-2xl font-bold text-slate-800">Patient Record Found</h2>
                  <div className="flex gap-4 items-center">
                    <button onClick={() => handleDelete(patientData.id_card)} className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                      <Trash2 size={16} /> Delete Patient
                    </button>
                    <button onClick={() => {setIsSearching(false); setPatientData(null); setSearchQuery('');}} className="text-sm text-slate-400 hover:underline">Clear Result</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/50 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
                      {latestHistory?.image_url ? (
                        <img src={latestHistory.image_url} alt="Latest MRI" className="w-full h-full object-contain rounded-lg shadow-sm" />
                      ) : (
                        <>
                          <UserCircle2 size={100} className="text-blue-200 mb-4" />
                          <p className="text-slate-400 text-xs font-bold uppercase">No MRI Image Found</p>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                        <button className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition">View Full History</button>
                        <Link href="/diagnosis" className="flex-1"><button className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-bold border border-blue-100 hover:bg-blue-100 transition">New Diagnosis</button></Link>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">HN / ID Card</p>
                        <h3 className="text-3xl font-mono font-bold text-slate-800 tracking-tighter">{patientData.id_card}</h3>
                        <p className="text-lg font-bold text-slate-600 mt-1">{patientData.name}</p>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Gender: {patientData.gender || 'Not specified'}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase border-b pb-1">Latest Analysis Result</p>
                      <div className="bg-white p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-slate-500 mb-1">Diagnosis:</p>
                        <p className="text-xl font-bold text-blue-600">{latestHistory?.diagnosis || 'No previous scans'}</p>
                        {latestHistory?.notes && (
                          <p className="text-[10px] text-slate-400 mt-2 italic">Notes: {latestHistory.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 text-[10px] flex justify-between font-bold text-slate-400">
                        <span>Latest Update: {latestHistory ? new Date(latestHistory.date).toLocaleDateString() : 'Never'}</span>
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Registered</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : !isSearching && allPatients.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Users size={18} className="text-blue-500" /> 
                    รายชื่อผู้ป่วยที่ลงทะเบียนทั้งหมด ({allPatients.length})
                  </h3>
                </div>
                <div className="divide-y">
                  {allPatients.map((p) => (
                    <div key={p._id} className="p-4 hover:bg-blue-50/30 transition flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4 flex-1" onClick={() => {setSearchQuery(p.id_card); handleSearch({preventDefault: () => {}} as any);}}>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <UserCircle2 size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-blue-600 transition">{p.name}</p>
                          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">{p.id_card}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Latest Scan</p>
                          <p className="text-xs font-bold text-slate-600">
                            {p.history?.length > 0 ? p.history[p.history.length-1].diagnosis : 'No Data'}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id_card); }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete Patient"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-24 flex flex-col items-center justify-center text-slate-400">
                <Users size={48} className="opacity-20 mb-4" />
                <p className="text-xl font-bold text-slate-500">พร้อมค้นหาข้อมูลคนไข้</p>
                <p className="text-sm">กรุณาระบุหมายเลข HN เพื่อดูรายละเอียด หรือเลือกจากรายการด้านล่าง</p>
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
