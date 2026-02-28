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
} from "lucide-react";
import Link from "next/link";

export default function CreatePatientPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mounted, setMounted] = useState(false);
  const [patientId, setPatientId] = useState("");

  // ป้องกัน Hydration Error และสุ่ม ID ฝั่ง Client เท่านั้น
  useEffect(() => {
    setMounted(true);
    setPatientId("PT-" + Math.floor(100000 + Math.random() * 900000));
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    phoneNumber: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      const allowedTypes = ["image/png", "image/jpeg"];
    
      if (!allowedTypes.includes(file.type)) {
        alert("อนุญาตเฉพาะไฟล์ .png และ .jpg เท่านั้น");
        e.target.value = ""; 
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
    }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // จำลอง Logic การส่งข้อมูล
    try {
      console.log("Saving Patient Data:", { patientId, ...formData, file: selectedFile });
      alert(`บันทึกข้อมูลผู้ป่วย ${formData.firstName} (ID: ${patientId}) สำเร็จ!`);
      // หลังจาก Save สำเร็จ อาจจะให้เด้งกลับหน้าหลัก
      // window.location.href = "/history";
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* ===== SIDEBAR (เหมือนกับหน้า History เพื่อความต่อเนื่อง) ===== */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Stethoscope size={24} /> Dr. Bigboss สุดหล่อ
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" />
          </Link>
          <Link href="/history">
            <NavItem icon={<Users size={20} />} label="Patients" active />
          </Link>
          <Link href="/diagnosis">
            <NavItem icon={<Stethoscope size={20} />} label="Diagnosis" />
          </Link>
          <NavItem icon={<Settings size={20} />} label="Setting" />
        </nav>
        <div className="p-4 border-t">
          <Link href="/">
            <button className="flex items-center gap-3 text-slate-400 hover:text-red-500 w-full px-4 py-2 transition text-sm font-medium">
              <LogOut size={18} /> Logout
            </button>
          </Link>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            {/* กดย้อนกลับไปที่หน้า history */}
            <Link href="/history" className="text-slate-400 hover:text-blue-600 transition p-2">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-slate-400 text-sm font-medium">
              Path: history / <span className="text-blue-600 font-bold">update & delete</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-slate-500">Status:</span>
              <span className="text-green-500 flex items-center gap-1.5">
                Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </span>
            </div>
            <button className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition">
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        {/* Form Area */}
        <div className="p-10 overflow-y-auto flex justify-center items-start">
          <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                ข้อมูลผู้ป่วย
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
              {/* Left Side: MRI / Image Upload */}
              <div className="flex flex-col">
                <div className={`relative group border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all min-h-[400px] flex-1
                    ${previewUrl ? 'border-blue-200 bg-white' : 'border-slate-200 bg-slate-50/50 hover:bg-blue-50/30'}`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="MRI Preview" className="w-full h-full object-contain p-6 rounded-3xl" />
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                         <Upload className="text-blue-400" size={32} />
                      </div>
                      <p className="text-slate-500 font-bold">Image Preview & Upload</p>
                      <p className="text-slate-400 text-xs mt-1 italic">อัปโหลดรูปภาพสแกนหรือรูปผู้ป่วย</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-4">
                  <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.png,.jpeg" onChange={handleFileChange} />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-white border-2 border-blue-600 text-blue-600 py-3.5 rounded-2xl font-bold hover:bg-blue-50 transition shadow-sm"
                  >
                    เลือกไฟล์รูปภาพ
                  </button>
                  <button 
                    type="submit"
                    className="w-full bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold hover:bg-blue-900 transition shadow-lg shadow-blue-900/20 text-lg flex items-center justify-center gap-3"
                  >
                    <Save size={22} /> บันทึกข้อมูลคนไข้
                  </button>
                </div>
              </div>

              {/* Right Side: Information Form */}
              <div className="bg-slate-50/60 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-2">
                  ข้อมูลพื้นฐานผู้ป่วย
                  <div className="h-[2px] flex-1 bg-slate-200 rounded-full ml-2 opacity-50"></div>
                </h3>

                <div className="space-y-6 flex-1">
                  {/* ID Field (Read Only) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Patient ID (Auto Generated)</label>
                    <div className="relative">
                      <Fingerprint size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                      <input 
                        type="text" 
                        readOnly 
                        value={patientId}
                        className="w-full bg-blue-50/50 border border-blue-100 p-4 pl-12 rounded-2xl font-mono font-bold text-blue-600 outline-none" 
                      />
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">ชื่อ</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        placeholder="กรอกชื่อ" 
                        required
                        onChange={handleChange}
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">นามสกุล</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        placeholder="กรอกนามสกุล" 
                        required
                        onChange={handleChange}
                        className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700" 
                      />
                    </div>
                  </div>

                  {/* Gender Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">เพศ</label>
                    <select 
                      name="gender" 
                      required
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium appearance-none text-slate-700"
                    >
                      <option value="">เลือกเพศ</option>
                      <option value="male">ชาย (Male)</option>
                      <option value="female">หญิง (Female)</option>
                    </select>
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">เบอร์โทรศัพท์</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="tel" 
                        name="phoneNumber" 
                        placeholder="08x-xxx-xxxx" 
                        required
                        onChange={handleChange}
                        className="w-full bg-white border border-slate-200 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition font-medium text-slate-700" 
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200/50">
                  <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
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
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
    }`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}