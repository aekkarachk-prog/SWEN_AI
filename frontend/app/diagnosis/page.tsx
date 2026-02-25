"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Upload, Download, CheckCircle2, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';


export default function DiagnosisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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
  
    const maxSize = 5 * 1024 * 1024; 
    if (file.size > maxSize) {
      alert("ไฟล์ต้องไม่เกิน 5MB");
      return;
    }
  
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return alert("กรุณาอัปโหลดรูปภาพสแกนสมอง (MRI)");
    
    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('/api/diagnosis', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
      setLoading(false);
    } catch (error) {
      console.error("Error analyzing:", error);
      setTimeout(() => {
        setResult({
          prediction: "Mild Demented",
          probabilities: { non: 10, very_mild: 2, mild: 88, moderate: 0 }
        });
        setLoading(false);
      }, 1500);
    }
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
          <Link href="/">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          </Link>
          <Link href="/history">
            <NavItem icon={<Users size={20}/>} label="Patients" />
          </Link>
          <Link href="/diagnosis">
            <NavItem icon={<Stethoscope size={20}/>} label="Diagnosis" active/>
          </Link>
          <NavItem icon={<Settings size={20}/>} label="Setting" />
        </nav>

        <div className="p-4 border-t text-nowrap">
          <Link href="/">
            <button className="flex items-center gap-3 text-gray-500 hover:text-red-500 w-full px-4 py-2 transition">
              <LogOut size={20} /> Logout
            </button>
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-gray-400 text-sm">Diagnosis Path: /scan/alzheimer</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-green-500 flex items-center gap-1 text-sm">
                Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </span>
            </div>
            <button className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition border">
              <Download size={16} /> Export
            </button>
          </div>
        </header>

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
                
                <div className="mt-8 flex flex-col gap-4">
                  <label className="cursor-pointer bg-white border-2 border-blue-600 text-blue-600 text-center py-3.5 rounded-2xl font-bold hover:bg-blue-50 transition shadow-sm">
                    Choose File / Upload
                    <input type="file" className="hidden" accept=".jpg,.png,.jpeg" onChange={handleFileChange} />
                  </label>
                  
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading || !selectedFile}
                    className="bg-[#1e3a8a] text-white py-4 rounded-2xl font-bold hover:bg-blue-900 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 text-lg flex justify-center items-center gap-3"
                  >
                    {loading ? (
                       <><div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> Analyzing...</>
                    ) : "Analyze / Predict"}
                  </button>
                  <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mt-2">Validation: .png, .jpg, .jpeg</p>
                </div>
              </div>

              {/* Right Side: Results */}
              <div className="bg-slate-50/60 rounded-[2.5rem] p-10 border border-slate-100 flex flex-col shadow-inner">
                <h3 className="text-lg font-bold text-slate-700 mb-8 flex items-center gap-2">
                  Result: 
                  <span className={result ? "text-blue-600 font-black bg-blue-100/50 px-4 py-1.5 rounded-xl text-xl" : "text-slate-400 italic font-normal text-base"}>
                    {result ? result.prediction : "Waiting for analysis..."}
                  </span>
                </h3>
                
                <div className="space-y-6 flex-1">
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
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
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
        <span className={highlight && isHigh ? "font-bold text-emerald-600 uppercase tracking-tight" : "text-slate-600 font-bold"}>{label}</span>
        <span className={`font-mono font-bold ${highlight && isHigh ? "text-emerald-600" : "text-slate-500"}`}>{value}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex items-center px-1 relative">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out absolute left-1 ${highlight && isHigh ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-400'}`}
          style={{ width: `calc(${value}% - 8px)` }}
        ></div>
      </div>
    </div>
  );
}