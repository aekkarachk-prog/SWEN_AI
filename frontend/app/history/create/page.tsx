"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Settings,
  LogOut,
  Upload,
  Save,
  ArrowLeft,
  Download,
  Phone,
  Fingerprint,
  MessageSquare,
  Activity,
  Shield
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function CreatePatientPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mounted, setMounted] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState<string>("USER");
  const [isOnline, setIsOnline] = useState(true);

  // ป้องกัน Hydration Error และสุ่ม ID ฝั่ง Client เท่านั้น
  useEffect(() => {
    setMounted(true);
    setPatientId("PT-" + Math.floor(100000 + Math.random() * 900000));
    
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

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    age: "", // 🎂 เพิ่มฟิลด์ Age
    gender: "",
    phoneNumber: "",
    notes: "", // 📝 เพิ่มฟิลด์ Note
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isDark = document.documentElement.classList.contains('dark');
    const file = e.target.files?.[0];
    if (!file) return;
  
    const allowedTypes = ["image/png", "image/jpeg"];
    
    if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: "error",
          title: "ไฟล์ไม่ถูกต้อง",
          text: "อนุญาตเฉพาะไฟล์ .png และ .jpg เท่านั้น",
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

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isDark = document.documentElement.classList.contains('dark');
    
    Swal.fire({
      title: "กำลังบันทึกข้อมูล...",
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

    try {
      // 🛠️ ตรวจสอบให้แน่ใจว่า API_URL ไม่ใช่ค่าว่าง และมี /api เสมอ
      let API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      if (!API_URL || API_URL === "") {
        API_URL = "/api";
      }

      const fullName = `${formData.firstName} ${formData.lastName}`;

      // 1. Create Patient Meta Data
      const patientRes = await fetch(`${API_URL}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_card: patientId,
          name: fullName,
          age: formData.age, // 🎂 ส่ง Age ไปด้วย
          gender: formData.gender,
          general_notes: formData.notes, // 📝 ส่ง Note ไปด้วย
        }),
      });

      if (!patientRes.ok) {
        const errorData = await patientRes.json();
        throw new Error(errorData.error || "ไม่สามารถสร้างข้อมูลผู้ป่วยได้");
      }

      // 2. If there is a file, upload it
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("image", selectedFile);
        uploadData.append("id_card", patientId);
        uploadData.append("name", fullName);
        uploadData.append("diagnosis", "Initial");
        uploadData.append("notes", "Uploaded during registration");

        const uploadRes = await fetch(`${API_URL}/patients/upload`, {
          method: "POST",
          body: uploadData,
        });

        if (!uploadRes.ok) {
          console.error("Photo upload failed, but patient was created.");
        }
      }

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        text: `ลงทะเบียนผู้ป่วย ${fullName} เรียบร้อยแล้ว`,
        confirmButtonColor: "#3b82f6",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      }).then(() => {
        window.location.href = "/history";
      });

    } catch (error: any) {
      console.error("Error saving patient:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์",
        confirmButtonColor: "#ef4444",
        customClass: {
          popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
          title: isDark ? 'text-white' : '',
          htmlContainer: isDark ? 'text-slate-300' : ''
        }
      });
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

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* ===== SIDEBAR (เหมือนกับหน้า History เพื่อความต่อเนื่อง) ===== */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col shadow-sm">
        <div className="p-6">
          <h1 className={`text-xl font-bold flex items-center gap-2 ${userRole === 'DOCTOR' ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {userRole === 'DOCTOR' ? <Stethoscope size={24} /> : <Activity size={24} />} {userName}
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" />
          </Link>
          <Link href="/dashboard">
            <NavItem icon={<Activity size={20} />} label="Analytics" />
          </Link>
          <Link href="/history">
            <NavItem icon={<Users size={20} />} label="Patients" active />
          </Link>
          {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
            <Link href="/diagnosis">
              <NavItem icon={<Stethoscope size={20} />} label="Diagnosis" />
            </Link>
          )}
          {userRole === 'ADMIN' && (
            <Link href="/admin/accounts">
              <NavItem icon={<Shield size={20} />} label="Accounts" />
            </Link>
          )}
          <Link href="/settings">
            <NavItem icon={<Settings size={20} />} label="Setting" />
          </Link>
          <div onClick={handleContactAdmin}>
            <NavItem icon={<MessageSquare size={20} />} label="Contact Admin" />
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

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            {/* กดย้อนกลับไปที่หน้า history */}
            <Link href="/history" className="text-slate-400 hover:text-blue-600 transition p-2">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">
              Path: history / <span className="text-blue-600 font-bold">create</span>
            </span>
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
            <button className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition border dark:border-slate-700">
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        {/* Form Area */}
        <div className="p-10 overflow-y-auto flex justify-center items-start">
          <div className="w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                ลงทะเบียนผู้ป่วยใหม่
              </h2>
              <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-900/50 uppercase tracking-widest">
                New Registration
              </span>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
              {/* Left Side: MRI / Image Upload */}
              <div className="flex flex-col">
                <div className={`relative group border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all min-h-[400px] flex-1
                    ${previewUrl ? 'border-blue-200 bg-white dark:bg-slate-950' : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="MRI Preview" className="w-full h-full object-contain p-6 rounded-3xl" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
                         <Upload className="text-blue-400" size={32} />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-bold">Image Preview & Upload</p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 italic">อัปโหลดรูปภาพสแกนหรือรูปผู้ป่วย</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-4">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.png,.jpeg" onChange={handleFileChange} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-blue-600 text-blue-600 dark:text-blue-400 py-3.5 rounded-2xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition shadow-sm"
                  >
                    เลือกไฟล์รูปภาพ
                  </button>
                  <button 
                    type="submit"
                    className="w-full bg-[#1e3a8a] dark:bg-blue-700 text-white py-4 rounded-2xl font-bold hover:bg-blue-900 dark:hover:bg-blue-600 transition shadow-lg shadow-blue-900/20 text-lg flex items-center justify-center gap-3"
                  >
                    <Save size={22} /> บันทึกข้อมูลคนไข้
                  </button>
                </div>
              </div>

              {/* Right Side: Information Form */}
              <div className="bg-slate-50/60 dark:bg-slate-950/50 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 flex flex-col">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-8 flex items-center gap-2">
                  ข้อมูลพื้นฐานผู้ป่วย
                  <div className="h-[2px] flex-1 bg-slate-200 dark:bg-slate-800 rounded-full ml-2 opacity-50"></div>
                </h3>

                <div className="space-y-6 flex-1">
                  {/* ID Field (Editable) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Patient ID (Auto Generated / Editable)</label>
                    <div className="relative">
                      <Fingerprint size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input 
                        type="text" 
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 p-4 pl-12 rounded-2xl font-mono font-bold text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500/20" 
                      />
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">ชื่อ</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        placeholder="กรอกชื่อ" 
                        required
                        onChange={handleChange}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700 dark:text-slate-200" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">นามสกุล</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        placeholder="กรอกนามสกุล" 
                        required
                        onChange={handleChange}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700 dark:text-slate-200" 
                      />
                    </div>
                  </div>

                  {/* Age Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">อายุ (Age)</label>
                    <input 
                      type="number" 
                      name="age" 
                      placeholder="กรอกอายุ" 
                      required
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700 dark:text-slate-200" 
                    />
                  </div>

                  {/* Gender Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">เพศ</label>
                    <select 
                      name="gender" 
                      required
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium appearance-none text-slate-700 dark:text-slate-200"
                    >
                      <option value="">เลือกเพศ</option>
                      <option value="male">ชาย (Male)</option>
                      <option value="female">หญิง (Female)</option>
                    </select>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">เบอร์โทรศัพท์</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        name="phoneNumber" 
                        placeholder="08x-xxx-xxxx" 
                        required
                        onChange={handleChange}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700 dark:text-slate-200" 
                      />
                    </div>
                  </div>

                  {/* 📝 Doctor's Note Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">บันทึกจากแพทย์ (Doctor's Note)</label>
                    <textarea 
                      name="notes"
                      placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับคนไข้..."
                      onChange={(e: any) => handleChange(e)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700 dark:text-slate-200 min-h-[120px] resize-none"
                    ></textarea>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200/50 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
                    Database & Cloud Storage Connected
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-component สำหรับ Sidebar
function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}