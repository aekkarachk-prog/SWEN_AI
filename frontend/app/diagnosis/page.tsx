"use client";

<<<<<<< Updated upstream
import Swal from "sweetalert2";
import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Upload, Download, CheckCircle2, ArrowLeft, MessageSquare
} from 'lucide-react';
import Link from 'next/link';


export default function DiagnosisPage() {
=======
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Settings,
  LogOut,
  Upload,
  Download,
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import {
  clearSession,
  getSession,
  writeAccessLog,
} from "../lib/mdkku-auth";

type DiagnosisResult = {
  prediction: string;
  probabilities: {
    non: number;
    very_mild: number;
    mild: number;
    moderate: number;
  };
};

export default function DiagnosisPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [doctorName, setDoctorName] = useState("Loading...");

>>>>>>> Stashed changes
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

<<<<<<< Updated upstream
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    const allowedTypes = ["image/png", "image/jpeg"];
  
    // ตรวจประเภทไฟล์
=======
  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/");
      return;
    }

    setDoctorName(session.user?.name || "Unknown Doctor");
    setIsAuthorized(true);

    writeAccessLog({
      action: "VIEW_DIAGNOSIS_PAGE",
      page: "/diagnosis",
      session,
    });
  }, [router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];

>>>>>>> Stashed changes
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "ไฟล์ไม่ถูกต้อง",
        text: "อนุญาตเฉพาะไฟล์ .png และ .jpg เท่านั้น",
<<<<<<< Updated upstream
        confirmButtonColor: "#ef4444"
=======
        confirmButtonColor: "#ef4444",
        background: "#1e293b",
        color: "#fff",
>>>>>>> Stashed changes
      });

      e.target.value = "";
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      Swal.fire({
        icon: "warning",
        title: "ไฟล์ใหญ่เกินไป",
        text: "ไฟล์ต้องมีขนาดไม่เกิน 5MB",
<<<<<<< Updated upstream
        confirmButtonColor: "#f59e0b"
=======
        confirmButtonColor: "#f59e0b",
        background: "#1e293b",
        color: "#fff",
>>>>>>> Stashed changes
      });

      e.target.value = "";
      return;
    }
<<<<<<< Updated upstream
  
    //  สำเร็จ
=======

    if (previewUrl) URL.revokeObjectURL(previewUrl);

>>>>>>> Stashed changes
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "อัปโหลดไฟล์เรียบร้อย",
      showConfirmButton: false,
      timer: 2000,
<<<<<<< Updated upstream
      timerProgressBar: true
=======
      timerProgressBar: true,
      background: "#1e293b",
      color: "#fff",
>>>>>>> Stashed changes
    });
  };

  const getConfidence = (data: DiagnosisResult | null) => {
    if (!data?.prediction || !data?.probabilities) return 0;

    switch (data.prediction) {
      case "Non Demented":
        return data.probabilities.non;
      case "Very Mild Demented":
        return data.probabilities.very_mild;
      case "Mild Demented":
        return data.probabilities.mild;
      case "Moderate Demented":
        return data.probabilities.moderate;
      default:
        return 0;
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      return Swal.fire({
        icon: "warning",
        title: "กรุณาอัปโหลดรูปภาพ",
        text: "โปรดเลือกรูป MRI ก่อนทำการวิเคราะห์",
<<<<<<< Updated upstream
        confirmButtonColor: "#3b82f6"
=======
        confirmButtonColor: "#3b82f6",
        background: "#1e293b",
        color: "#fff",
>>>>>>> Stashed changes
      });
    }

    setLoading(true);

 
    Swal.fire({
      title: "กำลังวิเคราะห์...",
      timerProgressBar: true,
      text: "กรุณารอสักครู่",
      allowOutsideClick: false,
<<<<<<< Updated upstream
=======
      background: "#1e293b",
      color: "#fff",
>>>>>>> Stashed changes
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
<<<<<<< Updated upstream
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${API_URL}/api/diagnosis`, {
        method: 'POST',
        body: formData,
      });
        
=======
      const response = await fetch("/api/diagnosis", {
        method: "POST",
        body: formData,
      });

>>>>>>> Stashed changes
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.details || "เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล"
        );
      }

      setResult(data);
<<<<<<< Updated upstream
  
      Swal.close(); 
  
 const confidence = getConfidence(data);

Swal.fire({
  icon: confidence < 0.6 ? "warning" : "success",
  title: "วิเคราะห์เสร็จแล้ว 🎉",
  html: `
    <div style="text-align:left; font-size:14px">
      <b>ผลลัพธ์:</b> ${data.prediction}<br/>
      <b>ความมั่นใจ:</b> ${confidence.toFixed(2)}%
    </div>
  `,
  confirmButtonColor: "#3b82f6"
});
  
    } catch (error: any) {
      console.error("Error analyzing:", error);
  
      Swal.fire({
        icon: 'error',
        title: 'Analysis Failed',
        text: error.message || 
              'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ หรือเกิดข้อผิดพลาดในการวิเคราะห์',
        confirmButtonColor: '#ef4444'
      });
  
      setResult(null);
  
    } finally {
      setLoading(false);
=======
      setLoading(false);
      Swal.close();

      writeAccessLog({
        action: "ANALYZE_MRI",
        page: "/diagnosis",
        detail: `${selectedFile.name} -> ${data.prediction}`,
      });

      const confidence = getConfidence(data);

      Swal.fire({
        icon: confidence < 60 ? "warning" : "success",
        title: "วิเคราะห์เสร็จแล้ว 🎉",
        html: `
          <div style="text-align:left; font-size:14px">
            <b>ผลลัพธ์:</b> ${data.prediction}<br/>
            <b>ความมั่นใจ:</b> ${confidence.toFixed(2)}%
          </div>
        `,
        confirmButtonColor: "#3b82f6",
        background: "#1e293b",
        color: "#fff",
      });
    } catch (error: any) {
      console.error("Error analyzing:", error);

      setTimeout(() => {
        const fallbackResult: DiagnosisResult = {
          prediction: "Mild Demented",
          probabilities: { non: 10, very_mild: 2, mild: 88, moderate: 0 },
        };

        setResult(fallbackResult);
        setLoading(false);
        Swal.close();

        writeAccessLog({
          action: "ANALYZE_MRI_FALLBACK",
          page: "/diagnosis",
          detail: `${selectedFile.name} -> Mild Demented (fallback)`,
        });

        Swal.fire({
          icon: "warning",
          title: "เชื่อม API ไม่สำเร็จ",
          text: "ระบบแสดงผลตัวอย่างชั่วคราวแทน",
          confirmButtonColor: "#f59e0b",
          background: "#1e293b",
          color: "#fff",
        });
      }, 1500);
>>>>>>> Stashed changes
    }
  };

  const handleContactAdmin = () => {
    Swal.fire({
<<<<<<< Updated upstream
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
    });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
=======
      icon: "info",
      title: "ติดต่อผู้ดูแลระบบ",
      text: "ฟังก์ชันนี้กำลังอยู่ในช่วงพัฒนาครับ",
      confirmButtonColor: "#3b82f6",
      background: "#1e293b",
      color: "#fff",
    });
  };

  const handleLogout = () => {
    writeAccessLog({
      action: "LOGOUT",
      page: "/diagnosis",
      detail: "ออกจากระบบ",
    });
    clearSession();
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">
            กำลังตรวจสอบสิทธิ์เข้าถึง...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200">
      <aside className="w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col shadow-lg z-10">
>>>>>>> Stashed changes
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Stethoscope size={24} /> Dr. Bigboss สุดหล่อ
          </h1>
<<<<<<< Updated upstream
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
=======
          <p className="text-slate-400 text-xs mt-2 px-1 truncate">
            {doctorName}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
>>>>>>> Stashed changes
          <Link href="/">
            <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" />
          </Link>
          <Link href="/history">
            <NavItem icon={<Users size={20} />} label="Patients" />
          </Link>
          <Link href="/diagnosis">
            <NavItem
              icon={<Stethoscope size={20} />}
              label="Diagnosis"
              active
            />
          </Link>
          <NavItem icon={<Settings size={20} />} label="Setting" />
          <div onClick={handleContactAdmin}>
            <NavItem icon={<MessageSquare size={20} />} label="Contact Admin" />
          </div>
        </nav>

<<<<<<< Updated upstream
        <div className="p-4 border-t text-nowrap">
          <Link href="/">
            <button className="flex items-center gap-3 text-gray-500 hover:text-red-500 w-full px-4 py-2 transition">
=======
        <div className="p-4 border-t border-slate-700">
          <Link href="/" onClick={handleLogout}>
            <button className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full px-4 py-3 rounded-xl transition-all">
>>>>>>> Stashed changes
              <LogOut size={20} /> Logout
            </button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
<<<<<<< Updated upstream
        {/* Header bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 text-nowrap">
=======
        <header className="h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-8 shadow-sm">
>>>>>>> Stashed changes
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition">
              <ArrowLeft size={20} />
            </Link>
<<<<<<< Updated upstream
            <span className="text-gray-400 text-sm">Diagnosis Path: /scan/alzheimer</span>
=======
            <span className="text-slate-400 text-sm font-medium">
              Diagnosis Path: /scan/alzheimer
            </span>
>>>>>>> Stashed changes
          </div>

          <div className="flex items-center gap-4">
<<<<<<< Updated upstream
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-green-500 flex items-center gap-1 text-sm">
                Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </span>
            </div>
            <button className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition border">
=======
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400">Status:</span>
              <span className="text-emerald-400 flex items-center gap-1.5 text-sm font-medium">
                Online
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              </span>
            </div>

            <button className="flex items-center gap-2 bg-[#0f172a] border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
>>>>>>> Stashed changes
              <Download size={16} /> Export
            </button>
          </div>
        </header>

<<<<<<< Updated upstream
        {/* Diagnosis Area - ปรับตำแหน่งให้อยู่กลางจอ (Centered) */}
        <div className="p-10 overflow-y-auto flex justify-center items-start">
          <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-12">
            <h2 className="text-2xl font-extrabold mb-10 text-slate-800 tracking-tight">Alzheimer's Diagnosis</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
              {/* Left Side: Upload & Preview */}
              <div className="flex flex-col">
                <div className={`border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center min-h-[400px] flex-1 relative overflow-hidden transition-all ${previewUrl ? 'border-blue-200 bg-white' : 'border-slate-200 bg-slate-50/50 hover:bg-blue-50/30'}`}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-6 rounded-3xl" />
=======
        <div className="p-8 overflow-y-auto">
          <div className="max-w-4xl bg-[#1e293b] rounded-2xl shadow-xl border border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
              Alzheimer&apos;s Diagnosis
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 bg-[#0f172a] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden transition-all hover:border-blue-500/50 hover:bg-blue-900/10 group">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-[280px] object-contain rounded-lg shadow-lg relative z-10"
                    />
>>>>>>> Stashed changes
                  ) : (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                         <Upload size={32} className="text-blue-400" />
                      </div>
                      <p className="font-bold text-slate-500">Image Preview & Upload</p>
                      <p className="text-xs mt-2 text-slate-400 italic">Drop MRI scan here</p>
                    </div>
                  )}
                </div>
<<<<<<< Updated upstream
                
                <div className="mt-8 flex flex-col gap-4">
                  <label className="cursor-pointer bg-white border-2 border-blue-600 text-blue-600 text-center py-3.5 rounded-2xl font-bold hover:bg-blue-50 transition shadow-sm">
=======

                <div className="flex flex-col gap-4">
                  <label className="cursor-pointer bg-[#0f172a] border border-slate-600 text-slate-300 text-center py-3 rounded-xl font-medium hover:bg-slate-800 hover:border-slate-400 transition-all shadow-sm">
>>>>>>> Stashed changes
                    Choose File / Upload
                    <input
                      type="file"
                      className="hidden"
                      accept=".jpg,.png,.jpeg"
                      onChange={handleFileChange}
                    />
                  </label>

                  <button
                    onClick={handleAnalyze}
                    disabled={loading || !selectedFile}
                    className="bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold hover:bg-blue-900 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 text-lg flex justify-center items-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      "Analyze / Predict"
                    )}
                  </button>
<<<<<<< Updated upstream
                  <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-2">Validation: .png, .jpg, .jpeg</p>
                </div>
              </div>

              {/* Right Side: Results */}
              <div className="bg-slate-50/60 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col shadow-inner">
                <h3 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-2">
                  Result: 
                  <span className={result ? "text-blue-600 font-black bg-blue-100/50 px-4 py-1.5 rounded-xl text-xl" : "text-slate-400 italic font-normal text-base"}>
=======

                  <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-2">
                    Validation: .png, .jpg, .jpeg (Max 5MB)
                  </p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-700 flex flex-col shadow-inner">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                  Result:
                  <span
                    className={
                      result
                        ? "text-blue-400 font-bold bg-blue-900/40 border border-blue-800/50 px-3 py-1 rounded-lg"
                        : "text-slate-500 italic font-normal text-base"
                    }
                  >
>>>>>>> Stashed changes
                    {result ? result.prediction : "Waiting for analysis..."}
                  </span>
                </h3>

                <div className="space-y-6 flex-1">
<<<<<<< Updated upstream
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confidence Probabilities</p>
                  
                  <ProbabilityBar label="Non-Demented" value={result?.probabilities?.non || 0} />
                  <ProbabilityBar label="Very Mild" value={result?.probabilities?.very_mild || 0} />
                  <ProbabilityBar label="Mild" value={result?.probabilities?.mild || 0} highlight={result?.prediction === 'Mild Demented'} />
                  <ProbabilityBar label="Moderate" value={result?.probabilities?.moderate || 0} highlight={result?.prediction === 'Moderate Demented'} />
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200/50">
                   <p className="text-xs text-slate-500 flex items-center gap-2 font-bold">
                     <CheckCircle2 size={18} className="text-emerald-500" /> 
                     History CRUD System Connected
                   </p>
=======
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Confidence Probabilities
                  </p>

                  <ProbabilityBar
                    label="Non-Demented"
                    value={result?.probabilities?.non || 0}
                    highlight={result?.prediction === "Non Demented"}
                  />
                  <ProbabilityBar
                    label="Very Mild"
                    value={result?.probabilities?.very_mild || 0}
                    highlight={result?.prediction === "Very Mild Demented"}
                  />
                  <ProbabilityBar
                    label="Mild"
                    value={result?.probabilities?.mild || 0}
                    highlight={result?.prediction === "Mild Demented"}
                  />
                  <ProbabilityBar
                    label="Moderate"
                    value={result?.probabilities?.moderate || 0}
                    highlight={result?.prediction === "Moderate Demented"}
                  />
                </div>

                <div className="mt-8 pt-5 border-t border-slate-800">
                  <p className="text-xs text-slate-400 flex items-center gap-2 font-medium">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    History CRUD System Connected
                  </p>
>>>>>>> Stashed changes
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
<<<<<<< Updated upstream
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}>
=======
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
          : "text-slate-400 hover:bg-[#0f172a] hover:text-slate-200"
      }`}
    >
>>>>>>> Stashed changes
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}

function ProbabilityBar({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const isHigh = safeValue > 50;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm mb-1">
<<<<<<< Updated upstream
        <span className={highlight && isHigh ? "font-bold text-emerald-600 uppercase tracking-tight" : "text-slate-600 font-bold"}>{label}</span>
        <span className={`font-mono font-bold ${highlight && isHigh ? "text-emerald-600" : "text-slate-500"}`}>{value}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex items-center px-1 relative">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out absolute left-1 ${highlight && isHigh ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-400'}`}
          style={{ width: `calc(${value}% - 8px)` }}
        ></div>
=======
        <span
          className={
            highlight && isHigh
              ? "font-bold text-emerald-400"
              : "text-slate-300 font-medium"
          }
        >
          {label}
        </span>
        <span
          className={`font-mono font-medium ${
            highlight && isHigh ? "text-emerald-400" : "text-slate-400"
          }`}
        >
          {safeValue}%
        </span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex items-center px-0.5 relative border border-slate-700/50">
        <div className={`h-2 rounded-full transition-all duration-1000 ease-out absolute left-0.5 ${
            highlight && isHigh
              ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              : "bg-slate-600"
          }`}
          style={{ width: `calc(${safeValue}% - 4px)` }}
          data-width={safeValue}
        />
>>>>>>> Stashed changes
      </div>
    </div>
  );
}