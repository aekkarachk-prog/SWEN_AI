"use client";

import Swal from "sweetalert2";
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Upload, Download, CheckCircle2, ArrowLeft, MessageSquare, Save, Activity, Shield
} from 'lucide-react';
import Link from 'next/link';


export default function DiagnosisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState<string>("USER");
  const [isOnline, setIsOnline] = useState(true);

  React.useEffect(() => {
    const savedAuth = localStorage.getItem('alz_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        const role = authData.user?.role || "USER";
        setUserName(authData.user?.name || "Unknown User");
        setUserRole(role);

        // 🛡️ Role-Based Access Control
        if (role !== 'DOCTOR' && role !== 'ADMIN') {
          Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'เฉพาะแพทย์และผู้ดูแลระบบเท่านั้นที่มีสิทธิ์เข้าใช้งานระบบวิเคราะห์ AI',
            confirmButtonColor: '#3b82f6',
          }).then(() => {
            window.location.href = "/";
          });
        }
      } catch (e) {
        setUserName("Unknown User");
      }
    } else {
      window.location.href = "/";
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
      let API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      if (!API_URL || API_URL === "") {
        API_URL = "/api";
      }
      try {
        const res = await fetch(`${API_URL}/patients`, { method: "HEAD" });
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isDark = document.documentElement.classList.contains('dark');
    const file = e.target.files?.[0];
    if (!file) return;
  
    const allowedTypes = ["image/png", "image/jpeg"];
  
    // ตรวจประเภทไฟล์
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "ไฟล์ไม่ถูกต้อง",
        text: "อนุญาตเฉพาะไฟล์ .png และ .jpg เท่านั้น",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
  
      e.target.value = "";
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
  
    // ตรวจขนาดไฟล์ (5MB)
    const maxSize = 5 * 1024 * 1024;
  
    if (file.size > maxSize) {
      Swal.fire({
        icon: "warning",
        title: "ไฟล์ใหญ่เกินไป",
        text: "ไฟล์ต้องมีขนาดไม่เกิน 5MB",
        confirmButtonColor: "#f59e0b",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
  
      e.target.value = "";
      return;
    }
  
    //  สำเร็จ
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  
    // Toast เล็ก ๆ แจ้งว่าเลือกไฟล์แล้ว
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "อัปโหลดไฟล์เรียบร้อย",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      customClass: {
        popup: isDark ? 'dark:bg-slate-800 dark:text-white border border-slate-700' : ''
      }
    });
  };

  const getConfidence = (result: any) => {
    if (!result?.prediction || !result?.probabilities) return 0;
  
    switch (result.prediction) {
      case "Non Demented":
        return result.probabilities.non;
      case "Very Mild Demented":
        return result.probabilities.very_mild;
      case "Mild Demented":
        return result.probabilities.mild;
      case "Moderate Demented":
        return result.probabilities.moderate;
      default:
        return 0;
    }
  };

  const handleAnalyze = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (!selectedFile) {
      return Swal.fire({
        icon: "warning",
        title: "กรุณาอัปโหลดรูปภาพ",
        text: "โปรดเลือกรูป MRI ก่อนทำการวิเคราะห์",
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
    }  
    
    setLoading(true);

 
    Swal.fire({
      title: "กำลังวิเคราะห์...",
      timerProgressBar: true,
      text: "กรุณารอสักครู่",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    });
  
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      // 🛠️ ตรวจสอบให้แน่ใจว่า API_URL ไม่ใช่ค่าว่าง และมี /api เสมอ
      let API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      if (!API_URL || API_URL === "") {
        API_URL = "/api";
      }
    
      const response = await fetch(`${API_URL}/diagnosis`, {
        method: "POST",
        body: formData,
      });
    
      const data = await response.json();
    
      if (!response.ok) {
        throw new Error(
          data.error ||
          data.details ||
          "เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล"
        );
      }
    
      setResult(data);
      Swal.close();
    
      const confidence = getConfidence(data);
    
      Swal.fire({
        icon: confidence < 0.6 ? "warning" : "success",
        title: "วิเคราะห์เสร็จแล้ว",
        html: `
          <div style="text-align:left; font-size:14px">
            <b>ผลลัพธ์:</b> ${data.prediction}<br/>
            <b>ความมั่นใจ:</b> ${confidence.toFixed(2)}%
          </div>
        `,
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
    
    } catch (error: any) {
    
      console.error("Error analyzing:", error);
    
      Swal.fire({
        icon: "error",
        title: "Analysis Failed",
        text:
          error.message ||
          "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ หรือเกิดข้อผิดพลาดในการวิเคราะห์",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
    
      setResult(null);
    
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToPatient = async (patientId: string, patientName?: string) => {
    const isDark = document.documentElement.classList.contains('dark');
    if (!result || !selectedFile) return;

    Swal.fire({
      title: "กำลังบันทึกข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      }
    });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
      const confidence = getConfidence(result);

      const uploadData = new FormData();
      uploadData.append("image", selectedFile);
      uploadData.append("id_card", patientId);
      
      // ส่งชื่อไปเฉพาะเมื่อต้องสร้างคนไข้ใหม่เท่านั้น
      if (patientName) {
        uploadData.append("name", patientName);
      }

      uploadData.append("diagnosis", result.prediction);
      uploadData.append("notes", `AI Confidence: ${confidence.toFixed(2)}%`);
      uploadData.append("probability", (confidence / 100).toString());
      if (result.duration) {
        uploadData.append("duration", result.duration.toString());
      }

      const res = await fetch(`${API_URL}/patients/upload`, {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ",
          text: `ผลวินิจฉัยและรูปสแกนถูกบันทึกลงใน Slot History ของประวัติ ${patientId} เรียบร้อยแล้ว`,
          confirmButtonColor: "#10b981",
          customClass: {
            popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
            title: isDark ? 'text-white' : '',
            htmlContainer: isDark ? 'text-slate-300' : ''
          }
        });
      } else {
        const err = await res.json();
        throw new Error(err.error || "บันทึกไม่สำเร็จ");
      }
    } catch (error: any) {
      Swal.fire({ 
        icon: "error", 
        title: "เกิดข้อผิดพลาด", 
        text: error.message,
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
    }
  };

  const promptSaveToPatient = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
    
    let patients: any[] = [];
    try {
      const res = await fetch(`${API_URL}/patients`);
      if (res.ok) patients = await res.json();
    } catch (e) { console.error(e); }

    const { value: formValues } = await Swal.fire({
      title: 'บันทึกประวัติการวินิจฉัย',
      html: `
        <div class="text-left space-y-4 p-2">
          <p class="text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'} mb-2">กรุณาระบุรหัสคนไข้ (HN) ระบบจะค้นหาให้อัตโนมัติ</p>
          <div class="relative">
            <input id="swal-id-input" class="swal2-input !m-0 !w-full ${isDark ? '!bg-slate-800 !text-white !border-slate-700' : ''}" placeholder="พิมพ์ HN เช่น PT-123456" autocomplete="off">
            <div id="autocomplete-list" class="absolute z-50 w-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto hidden"></div>
          </div>
          <div id="new-patient-section" class="hidden animate-in fade-in slide-in-from-top-2">
            <label class="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 mt-4">ตรวจพบรหัสใหม่! กรุณาระบุชื่อคนไข้</label>
            <input id="swal-name-input" class="swal2-input !m-0 !w-full !border-blue-200 ${isDark ? '!bg-slate-800 !text-white' : ''}" placeholder="ชื่อ-นามสกุล คนไข้ใหม่">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'บันทึกข้อมูล',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : ''
      },
      didOpen: () => {
        const idInput = document.getElementById('swal-id-input') as HTMLInputElement;
        const nameInput = document.getElementById('swal-name-input') as HTMLInputElement;
        const listContainer = document.getElementById('autocomplete-list');
        const newSection = document.getElementById('new-patient-section');

        idInput?.addEventListener('input', (e) => {
          const val = (e.target as HTMLInputElement).value.toUpperCase();
          if (!val) {
            listContainer?.classList.add('hidden');
            newSection?.classList.add('hidden');
            return;
          }

          const matches = patients.filter(p => p.id_card.includes(val) || p.name.includes(val));
          const exactMatch = patients.find(p => p.id_card === val);

          if (listContainer) {
            if (matches.length > 0) {
              listContainer.classList.remove('hidden');
              listContainer.innerHTML = matches.map(p => `
                <div class="p-3 ${isDark ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-blue-50 border-gray-50'} cursor-pointer border-b last:border-0 patient-item" data-id="${p.id_card}" data-name="${p.name}">
                  <div class="font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}">${p.id_card}</div>
                  <div class="text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}">${p.name}</div>
                </div>
              `).join('');

              // Add click events to items
              document.querySelectorAll('.patient-item').forEach(item => {
                item.addEventListener('click', () => {
                  const id = item.getAttribute('data-id');
                  if (idInput && id) {
                    idInput.value = id;
                    listContainer.classList.add('hidden');
                    newSection?.classList.add('hidden');
                  }
                });
              });
            } else {
              listContainer.classList.add('hidden');
            }
          }

          // Show name input if it's a new ID
          if (newSection) {
            newSection.classList.toggle('hidden', !!exactMatch);
          }
        });

        // Hide list when clicking outside
        document.addEventListener('click', (e) => {
          if (!idInput?.contains(e.target as Node)) {
            listContainer?.classList.add('hidden');
          }
        });
      },
      preConfirm: () => {
        const id = (document.getElementById('swal-id-input') as HTMLInputElement).value.toUpperCase();
        const name = (document.getElementById('swal-name-input') as HTMLInputElement).value;
        const exists = patients.some(p => p.id_card === id);

        if (!id) {
          Swal.showValidationMessage('กรุณาระบุรหัสคนไข้ (HN)');
          return false;
        }
        if (!exists && !name) {
          Swal.showValidationMessage('ไม่พบรหัสคนไข้นี้ กรุณากรอกชื่อเพื่อลงทะเบียนใหม่');
          return false;
        }
        return { id, name: exists ? undefined : name };
      }
    });

    if (formValues) {
      handleSaveToPatient(formValues.id, formValues.name);
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
    const isDark = document.documentElement.classList.contains('dark');
    Swal.fire({
      title: '<strong>Contact Administrator</strong>',
      icon: 'info',
      html:
        '<div class="text-left space-y-2">' +
        '<p><b>Phone:</b> 191 (IT Support)</p>' +
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
          <Link href="/">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          </Link>
          <Link href="/dashboard">
            <NavItem icon={<Activity size={20}/>} label="Analytics" />
          </Link>
          <Link href="/history">
            <NavItem icon={<Users size={20}/>} label="Patients" />
          </Link>
          {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
            <Link href="/diagnosis">
              <NavItem icon={<Stethoscope size={20}/>} label="Diagnosis" active/>
            </Link>
          )}
          {userRole === 'ADMIN' && (
            <Link href="/admin/accounts">
              <NavItem icon={<Shield size={20}/>} label="Accounts" />
            </Link>
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
            className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-red-500 w-full px-4 py-2 transition font-medium"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-gray-400 dark:text-slate-500 text-sm font-medium">Diagnosis Path: /scan/alzheimer</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm font-medium dark:text-slate-400">Status:</span>
              {isOnline ? (
                <span className="text-green-500 flex items-center gap-1 text-sm">
                  Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </span>
              ) : (
                <span className="text-red-500 flex items-center gap-1 text-sm">
                  Offline <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </span>
              )}
            </div>
            <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition border dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        {/* Diagnosis Area - ปรับตำแหน่งให้อยู่กลางจอ (Centered) */}
        <div className="p-10 overflow-y-auto flex justify-center items-start">
          <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-12">
            <h2 className="text-2xl font-extrabold mb-10 text-slate-800 dark:text-white tracking-tight">Alzheimer's Diagnosis</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
              {/* Left Side: Upload & Preview */}
              <div className="flex flex-col">
                <div className={`border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center min-h-[400px] flex-1 relative overflow-hidden transition-all ${previewUrl ? 'border-blue-200 bg-white dark:bg-slate-950' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-6 rounded-3xl" />
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                         <Upload size={32} className="text-blue-400" />
                      </div>
                      <p className="font-bold text-slate-500 dark:text-slate-400">Image Preview & Upload</p>
                      <p className="text-xs mt-2 text-slate-400 dark:text-slate-500 italic">Drop MRI scan here</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 flex flex-col gap-4">
                  <label className="cursor-pointer bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 dark:text-blue-400 text-center py-3.5 rounded-2xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition shadow-sm">
                    Choose File / Upload
                    <input type="file" className="hidden" accept=".jpg,.png,.jpeg" onChange={handleFileChange} />
                  </label>
                  
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading || !selectedFile}
                    className="bg-[#1e3a8a] dark:bg-blue-700 text-white py-4 rounded-2xl font-bold hover:bg-blue-900 dark:hover:bg-blue-600 transition disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 text-lg flex justify-center items-center gap-3"
                  >
                    {loading ? (
                       <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> Analyzing...</>
                    ) : "Analyze / Predict"}
                  </button>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold uppercase tracking-widest mt-2">Validation: .png, .jpg, .jpeg</p>
                </div>
              </div>

              {/* Right Side: Results */}
              <div className="bg-slate-50/60 dark:bg-slate-950/50 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 flex flex-col shadow-inner">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-8 flex items-center gap-2">
                  Result: 
                  <span className={result ? "text-blue-600 dark:text-blue-400 font-black bg-blue-100/50 dark:bg-blue-900/30 px-4 py-1.5 rounded-xl text-xl" : "text-slate-400 italic font-normal text-base"}>
                    {result ? result.prediction : "Waiting for analysis..."}
                  </span>
                </h3>
                
                <div className="space-y-6 flex-1">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Confidence Probabilities</p>
                  
                  <ProbabilityBar label="Non-Demented" value={result?.probabilities?.non || 0} />
                  <ProbabilityBar label="Very Mild" value={result?.probabilities?.very_mild || 0} />
                  <ProbabilityBar label="Mild" value={result?.probabilities?.mild || 0} highlight={result?.prediction === 'Mild Demented'} />
                  <ProbabilityBar label="Moderate" value={result?.probabilities?.moderate || 0} highlight={result?.prediction === 'Moderate Demented'} />
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200/50 dark:border-slate-800">
                   {result && (
                     <button 
                        onClick={promptSaveToPatient}
                        className="w-full mb-4 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                     >
                       <Save size={18} /> Save to Patient Record
                     </button>
                   )}
                   <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold">
                     <CheckCircle2 size={18} className="text-emerald-500" /> 
                     History CRUD System Connected
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}

function ProbabilityBar({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) {
  const isHigh = value > 50;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm mb-1">
        <span className={highlight && isHigh ? "font-bold text-emerald-600 uppercase tracking-tight" : "text-slate-600 dark:text-slate-400 font-bold"}>{label}</span>
        <span className={`font-mono font-bold ${highlight && isHigh ? "text-emerald-600" : "text-slate-500 dark:text-slate-500"}`}>{value}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 overflow-hidden flex items-center px-1 relative">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out absolute left-1 ${highlight && isHigh ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-400 dark:bg-slate-600'}`}
          style={{ width: `calc(${value}% - 8px)` }}
        ></div>
      </div>
    </div>
  );
}
