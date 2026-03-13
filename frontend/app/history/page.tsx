"use client";

import React, { useState, Suspense } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Download, CheckCircle2, ArrowLeft, Search, UserCircle2, PlusCircle,
  MessageSquare, Trash2, RotateCcw, Activity
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const hnParam = searchParams ? searchParams.get('hn') : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [patientData, setPatientData] = useState<any>(null);
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState<string>("USER");
  const [isOnline, setIsOnline] = useState(true);

  React.useEffect(() => {
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

    // Load and Sync Theme - Default to light
    const savedTheme = localStorage.getItem('alz_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (!savedTheme) localStorage.setItem('alz_theme', 'light');
    }

    // Ping check for online status
    const checkStatus = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/patients`, { method: "HEAD" });
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === allPatients.length && allPatients.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allPatients.map(p => p.id_card));
    }
  };

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

  const performSearch = async (query: string) => {
    const isDark = document.documentElement.classList.contains('dark');
    if (!query.trim()) {
      setIsSearching(false);
      setPatientData(null);
      return;
    }

    setLoading(true);
    setIsSearching(true);

    try {
      const res = await fetch(`${getApiUrl()}/patients/${query}`);
      const data = await res.json();

      if (res.ok) {
        setPatientData(data);
      } else {
        Swal.fire({
          icon: "error",
          title: "ไม่พบข้อมูล",
          text: `ไม่พบผู้ป่วยที่มีหมายเลข HN: ${query}`,
          confirmButtonColor: "#ef4444",
          customClass: {
            popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
            title: isDark ? 'text-white' : '',
            htmlContainer: isDark ? 'text-slate-300' : ''
          }
        });
        setPatientData(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (hnParam) {
      setSearchQuery(hnParam);
      performSearch(hnParam);
    }
  }, [hnParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const latestHistory = patientData?.history?.[patientData.history.length - 1];

  const handleDelete = async (id_card: string) => {
    const isDark = document.documentElement.classList.contains('dark');
    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "การลบข้อมูลนี้จะไม่สามารถเรียกคืนได้ และรูปภาพที่เกี่ยวข้องจะถูกลบทั้งหมด!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${getApiUrl()}/patients/${id_card}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'ลบสำเร็จ!',
            text: 'ข้อมูลผู้ป่วยถูกลบออกจากระบบแล้ว',
            customClass: {
              popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
              title: isDark ? 'text-white' : '',
              htmlContainer: isDark ? 'text-slate-300' : ''
            }
          });
          // รีเฟรชข้อมูล
          fetchAllPatients();
          setIsSearching(false);
          setPatientData(null);
        } else {
          throw new Error("Delete failed");
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: 'ไม่สามารถลบข้อมูลได้',
          customClass: {
            popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
            title: isDark ? 'text-white' : '',
            htmlContainer: isDark ? 'text-slate-300' : ''
          }
        });
      }
    }
  };

  const handleClearHistory = async () => {
    if (!patientData) return;
    const isDark = document.documentElement.classList.contains('dark');

    const result = await Swal.fire({
      title: 'รีเซ็ตประวัติการวินิจฉัย?',
      text: "คุณต้องการลบประวัติ AI ทั้งหมดและเก็บไว้เพียงข้อมูลการลงทะเบียนเริ่มต้นใช่หรือไม่?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, รีเซ็ตเลย',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const res = await fetch(`${getApiUrl()}/patients/${patientData.id_card}/clear-history`, {
          method: 'POST'
        });

        if (res.ok) {
          const updatedPatient = await res.json();
          setPatientData(updatedPatient.patient);
          Swal.fire({
            icon: 'success',
            title: 'รีเซ็ตสำเร็จ',
            text: 'ล้างประวัติการวินิจฉัยคงเหลือไว้เพียงข้อมูลเริ่มต้น',
            timer: 2000,
            showConfirmButton: false,
            customClass: {
              popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
              title: isDark ? 'text-white' : '',
              htmlContainer: isDark ? 'text-slate-300' : ''
            }
          });
        } else {
          throw new Error("Clear failed");
        }
      } catch (error) {
        Swal.fire('Error!', 'ไม่สามารถล้างข้อมูลได้', 'error');
      } finally {
        setLoading(false);
      }
    }
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
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    }).then(() => {
      window.location.href = "/";
    });
  };

  const handleViewFullHistory = () => {
    if (!patientData || !patientData.history) return;
    const isDark = document.documentElement.classList.contains('dark');

    Swal.fire({
      title: `ประวัติการวินิจฉัย: ${patientData.name}`,
      width: '800px',
      html: `
        <div class="space-y-4 max-h-[600px] overflow-y-auto p-4 text-left">
          ${patientData.history.map((h: any, index: number) => `
            <div class="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 items-start">
              <div class="w-32 h-32 bg-white dark:bg-slate-900 rounded-lg border dark:border-slate-700 overflow-hidden flex-shrink-0">
                <img src="${h.image_url}" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-[10px] font-bold text-blue-500 uppercase">ครั้งที่ ${index + 1}</span>
                  <span class="text-[10px] text-slate-400 font-mono">${new Date(h.date).toLocaleString()}</span>
                </div>
                <p class="text-lg font-bold text-slate-800 dark:text-white mb-1">${h.diagnosis}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${h.notes || 'ไม่มีหมายเหตุ'}</p>
                <div class="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                  <div class="bg-blue-500 h-full rounded-full" style="width: ${(h.probability || 0) * 100}%"></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `,
      confirmButtonText: 'ปิดหน้าต่าง',
      confirmButtonColor: '#3b82f6',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    });
  };

  const handleExport = () => {
    const isDark = document.documentElement.classList.contains('dark');
    let patientsToExport: any[] = [];
    let filename = `patient_data_${new Date().toISOString().split('T')[0]}`;

    if (selectedIds.length > 0) {
      patientsToExport = allPatients.filter(p => selectedIds.includes(p.id_card));
      filename = `selected_patients_${new Date().toISOString().split('T')[0]}`;
    } else if (isSearching && patientData) {
      patientsToExport = [patientData];
      filename = `patient_${patientData.id_card}_${new Date().toISOString().split('T')[0]}`;
    } else {
      patientsToExport = allPatients;
    }

    if (patientsToExport.length === 0) {
      Swal.fire({
        title: 'No Data', 
        text: 'ไม่มีข้อมูลผู้ป่วยเพื่อส่งออก', 
        icon: 'info',
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
      return;
    }

    // If exporting all without selection, maybe confirm
    if (selectedIds.length === 0 && !isSearching) {
      Swal.fire({
        title: 'ส่งออกข้อมูลทั้งหมด?',
        text: `คุณกำลังจะส่งออกข้อมูลผู้ป่วยทั้งหมดจำนวน ${allPatients.length} รายการ`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันส่งออกทั้งหมด',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6',
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      }).then((result) => {
        if (result.isConfirmed) {
          generateCsv(patientsToExport, filename);
        }
      });
    } else {
      generateCsv(patientsToExport, filename);
    }
  };

  const generateCsv = (data: any[], filename: string) => {
    const isDark = document.documentElement.classList.contains('dark');
    const headers = ["HN/ID Card", "Name", "Gender", "Latest Diagnosis", "Created At"];
    const rows = data.map(p => [
      `"${p.id_card}"`,
      `"${p.name}"`,
      `"${p.gender || "N/A"}"`,
      `"${p.history?.length > 0 ? p.history[p.history.length - 1].diagnosis : "No Data"}"`,
      `"${new Date(p.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'ส่งออกสำเร็จ',
      text: `ส่งออกข้อมูลจำนวน ${data.length} รายการเรียบร้อยแล้ว`,
      timer: 2000,
      showConfirmButton: false,
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    });
  };

  const handleEditPatient = async () => {
    if (!patientData) return;
    const isDark = document.documentElement.classList.contains('dark');

    const { value: formValues } = await Swal.fire({
      title: 'แก้ไขข้อมูลผู้ป่วย',
      html: `
        <div class="text-left space-y-4 p-2">
          <div class="flex justify-center mb-4">
            <div class="relative group cursor-pointer" onclick="document.getElementById('swal-edit-pic').click()">
              <img id="swal-preview-pic" src="${patientData.profile_pic || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(patientData.name)}" class="w-24 h-24 rounded-full object-cover border-4 border-blue-100 dark:border-slate-700 shadow-md" />
              <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-white text-[10px] font-bold">เปลี่ยนรูป</span>
              </div>
              <input type="file" id="swal-edit-pic" class="hidden" accept="image/*" onchange="const f = this.files[0]; if(f){ const r = new FileReader(); r.onload=(e)=>{document.getElementById('swal-preview-pic').src=e.target.result; window.swal_new_pic=e.target.result;}; r.readAsDataURL(f); }">
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">ชื่อ-นามสกุล</label>
            <input id="swal-edit-name" class="swal2-input !m-0 !w-full ${isDark ? '!bg-slate-800 !text-white !border-slate-700' : ''}" value="${patientData.name}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">อายุ (Age)</label>
            <input id="swal-edit-age" type="number" class="swal2-input !m-0 !w-full ${isDark ? '!bg-slate-800 !text-white !border-slate-700' : ''}" value="${patientData.age || ''}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">เพศ</label>
            <select id="swal-edit-gender" class="swal2-input !m-0 !w-full ${isDark ? '!bg-slate-800 !text-white !border-slate-700' : ''}">
              <option value="male" ${patientData.gender === 'male' ? 'selected' : ''}>ชาย (Male)</option>
              <option value="female" ${patientData.gender === 'female' ? 'selected' : ''}>หญิง (Female)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">บันทึกจากแพทย์</label>
            <textarea id="swal-edit-notes" class="swal2-textarea !m-0 !w-full !h-24 !text-sm ${isDark ? '!bg-slate-800 !text-white !border-slate-700' : ''}" placeholder="ระบุรายละเอียดเพิ่มเติม...">${patientData.general_notes || ''}</textarea>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'บันทึกการแก้ไข',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      },
      didOpen: () => {
        (window as any).swal_new_pic = null;
      },
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-edit-name') as HTMLInputElement).value,
          age: (document.getElementById('swal-edit-age') as HTMLInputElement).value,
          gender: (document.getElementById('swal-edit-gender') as HTMLSelectElement).value,
          general_notes: (document.getElementById('swal-edit-notes') as HTMLTextAreaElement).value,
          profile_pic: (window as any).swal_new_pic || undefined
        }
      }
    });

    if (formValues) {
      try {
        const res = await fetch(`${getApiUrl()}/patients/${patientData.id_card}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formValues)
        });

        if (res.ok) {
          Swal.fire({
            icon: 'success',
            title: 'สำเร็จ',
            text: 'อัปเดตข้อมูลเรียบร้อยแล้ว',
            customClass: {
              popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
              title: isDark ? 'text-white' : '',
              htmlContainer: isDark ? 'text-slate-300' : ''
            }
          });
          const updated = await res.json();
          setPatientData(updated);
          fetchAllPatients();
        }
      } catch (e) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'ไม่สามารถอัปเดตข้อมูลได้',
          customClass: {
            popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
            title: isDark ? 'text-white' : '',
            htmlContainer: isDark ? 'text-slate-300' : ''
          }
        });
      }
    }
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
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col shadow-sm">
        <div className="p-6">
          <h1 className={`text-xl font-bold flex items-center gap-2 ${userRole === 'DOCTOR' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {userRole === 'DOCTOR' ? <Stethoscope size={24} /> : <Activity size={24} />} {userName}
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/"><NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" /></Link>
          <Link href="/dashboard"><NavItem icon={<Activity size={20}/>} label="Analytics"/></Link>
          <Link href="/history"><NavItem icon={<Users size={20}/>} label="Patients" active/></Link>
          {userRole === 'DOCTOR' && (
            <Link href="/diagnosis"><NavItem icon={<Stethoscope size={20}/>} label="Diagnosis"/></Link>
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
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition"><ArrowLeft size={20} /></Link>
            <span className="text-gray-400 dark:text-slate-500 text-sm">Patient Database / Search</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm font-medium dark:text-slate-400">Status:</span>
              {isOnline ? (
                <span className="text-green-500 flex items-center gap-1.5 text-sm">Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div></span>
              ) : (
                <span className="text-red-500 flex items-center gap-1.5 text-sm">Offline <div className="w-2 h-2 bg-red-500 rounded-full"></div></span>
              )}
            </div>

            <Link href="/history/create">
              <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm border border-blue-500">
                <PlusCircle size={16} /> ลงทะเบียนผู้ป่วยใหม่
              </button>
            </Link>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition border dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input type="text" placeholder="ใส่หมายเลข HN หรือ ID Card (เช่น PT-123456)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition dark:text-white" />
                </div>
                <button type="submit" disabled={loading} className="bg-[#1e3a8a] dark:bg-blue-700 text-white px-10 py-3 rounded-xl font-bold hover:bg-blue-800 dark:hover:bg-blue-600 transition shadow-md disabled:bg-slate-400">
                  {loading ? "Searching..." : "Search"}
                </button>
              </form>
            </div>

            {isSearching && patientData ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-8 border-b dark:border-slate-800 pb-4 text-nowrap">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Record Found</h2>
                  <div className="flex gap-4 items-center">
                    <button onClick={() => handleDelete(patientData.id_card)} className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition">
                      <Trash2 size={16} /> Delete Patient
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-blue-200 dark:border-blue-900/50 rounded-xl p-6 bg-blue-50/50 dark:bg-blue-900/10 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
                      {/* 👤 แสดงรูปโปรไฟล์คนไข้ */}
                      {patientData.profile_pic || (patientData.history?.length > 0 && patientData.history[0].image_url) ? (
                        <img 
                          src={patientData.profile_pic || patientData.history[0].image_url} 
                          alt="Patient Profile" 
                          className="w-full h-full object-contain rounded-lg shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(patientData.name) + '&background=random';
                          }}
                        />
                      ) : (
                        <>
                          <UserCircle2 size={100} className="text-blue-200 dark:text-blue-900 mb-4" />
                          <p className="text-slate-400 text-xs font-bold uppercase">No Profile Picture</p>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleViewFullHistory} className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">View Full History</button>
                        <Link href="/diagnosis" className="flex-1"><button className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 py-2 rounded-lg text-sm font-bold border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">New Diagnosis</button></Link>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">HN / ID Card</p>
                          <h3 className="text-3xl font-mono font-bold text-slate-800 dark:text-white tracking-tighter">{patientData.id_card}</h3>
                          <p className="text-lg font-bold text-slate-600 dark:text-slate-300 mt-1">{patientData.name}</p>
                          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Gender: {patientData.gender || 'Not specified'} | Age: {patientData.age || 'N/A'}</p>
                          {patientData.general_notes && (
                            <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-900/30 text-left">
                              <p className="text-[9px] font-bold text-blue-400 uppercase mb-1">Doctor's Note</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">{patientData.general_notes}</p>
                            </div>
                          )}
                          </div>

                        <div className="flex flex-col gap-2">
                          <button onClick={handleEditPatient} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline bg-white dark:bg-slate-900 px-3 py-1 rounded-md border dark:border-slate-800 shadow-sm">Edit Profile</button>
                          {patientData.history?.length > 1 && (
                            <button onClick={handleClearHistory} className="text-[10px] font-bold text-red-500 hover:underline bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md border border-red-100 dark:border-red-900/50 shadow-sm flex items-center gap-1 justify-center">
                              <RotateCcw size={10} /> Reset History
                            </button>
                          )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase border-b dark:border-slate-800 pb-1">Latest Analysis Result</p>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs text-slate-500 mb-1">Diagnosis:</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{latestHistory?.diagnosis || 'No previous scans'}</p>
                        {latestHistory?.notes && (
                          <p className="text-[10px] text-slate-400 mt-2 italic">Notes: {latestHistory.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-[10px] flex justify-between font-bold text-slate-400">
                        <span>Latest Update: {latestHistory ? new Date(latestHistory.date).toLocaleDateString() : 'Never'}</span>
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Registered</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : !isSearching && allPatients.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={selectedIds.length === allPatients.length && allPatients.length > 0}
                      onChange={toggleSelectAll}
                    />
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Users size={18} className="text-blue-500" /> 
                      รายชื่อผู้ป่วยที่ลงทะเบียนทั้งหมด ({allPatients.length})
                    </h3>
                  </div>
                  {selectedIds.length > 0 && (
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/50 animate-in fade-in zoom-in">
                      เลือกแล้ว {selectedIds.length} คน
                    </span>
                  )}
                </div>
                <div className="divide-y dark:divide-slate-800">
                  {allPatients.map((p) => (
                    <div key={p._id} className="p-4 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-4 flex-1">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedIds.includes(p.id_card)}
                          onChange={(e) => { e.stopPropagation(); toggleSelect(p.id_card); }}
                        />
                        <div className="flex items-center gap-4 flex-1" onClick={() => {setSearchQuery(p.id_card); handleSearch({preventDefault: () => {}} as any);}}>
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 overflow-hidden">
                            {p.profile_pic || (p.history?.length > 0 && p.history[0].image_url) ? (
                              <img src={p.profile_pic || p.history[0].image_url} className="w-full h-full object-cover" />
                            ) : (
                              <UserCircle2 size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{p.name}</p>
                            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">{p.id_card} | Age: {p.age || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Latest Scan</p>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {p.history?.length > 0 ? p.history[p.history.length-1].diagnosis : 'No Data'}
                          </p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id_card); }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-24 flex flex-col items-center justify-center text-slate-400">
                <Users size={48} className="opacity-20 mb-4" />
                <p className="text-xl font-bold text-slate-500 dark:text-slate-400">พร้อมค้นหาข้อมูลคนไข้</p>
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
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
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
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 relative overflow-hidden">
        <div className={`h-full absolute left-0 transition-all duration-1000 ${highlight ? 'bg-emerald-500' : 'bg-slate-400'}`} style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}
