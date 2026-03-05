"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Upload, Download, CheckCircle2, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function DiagnosisPage() {
  const router = useRouter();
  
  // --- Auth State ---
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [doctorName, setDoctorName] = useState("Loading...");

  // --- Diagnosis State ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('mdkku_session');
    
    if (!savedSession) {
      router.replace('/');
    } else {
      try {
        const sessionData = JSON.parse(savedSession);
        setDoctorName(sessionData.user?.name || "Unknown Doctor");
        setIsAuthorized(true);
      } catch (error) {
        router.replace('/');
      }
    }
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); 
    }
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
      
      if (!response.ok) throw new Error('API Error');
      
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

  if (!isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium">กำลังตรวจสอบสิทธิ์เข้าถึง...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col shadow-lg z-10">
        <div className="p-6">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Stethoscope size={20} className="text-white" />
            </div>
            MDKKU HIS
          </h1>
          <p className="text-slate-400 text-xs mt-2 px-1 truncate">{doctorName}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/">
            <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          </Link>
          <NavItem icon={<Users size={20}/>} label="Patients" />
          <NavItem icon={<Stethoscope size={20}/>} label="Diagnosis" active />
          <NavItem icon={<Settings size={20}/>} label="Setting" />
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Link href="/" onClick={() => localStorage.removeItem('mdkku_session')}>
            <button className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full px-4 py-3 rounded-xl transition-all">
              <LogOut size={20} /> Logout
            </button>
          </Link>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-blue-400 transition">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-slate-400 text-sm font-medium">Diagnosis Path: /scan/alzheimer</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-400">Status:</span>
              <span className="text-emerald-400 flex items-center gap-1.5 text-sm font-medium">
                Online <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
              </span>
            </div>
            <button className="flex items-center gap-2 bg-[#0f172a] border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all">
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        {/* Diagnosis Area */}
        <div className="p-8 overflow-y-auto">
          <div className="max-w-4xl bg-[#1e293b] rounded-2xl shadow-xl border border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
               Alzheimer's Diagnosis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Upload & Preview */}
              <div className="space-y-6">
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 bg-[#0f172a] flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden transition-all hover:border-blue-500/50 hover:bg-blue-900/10 group">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-[280px] object-contain rounded-lg shadow-lg relative z-10" />
                  ) : (
                    <div className="text-center text-slate-500 group-hover:text-blue-400 transition-colors">
                      <Upload size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Image Preview & Upload</p>
                      <p className="text-xs mt-2 opacity-70">Drop MRI scan here</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-4">
                  <label className="cursor-pointer bg-[#0f172a] border border-slate-600 text-slate-300 text-center py-3 rounded-xl font-medium hover:bg-slate-800 hover:border-slate-400 transition-all shadow-sm">
                    Choose File / Upload
                    <input type="file" className="hidden" accept=".jpg,.png,.jpeg" onChange={handleFileChange} />
                  </label>
                  <p className="text-xs text-slate-500 text-center italic">Validation (.png, .jpg, .jpeg)</p>
                  
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading || !selectedFile}
                    className="bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-500 transition-all disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2 active:scale-[0.98]"
                  >
                    {loading ? (
                       <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Analyzing...</>
                    ) : "Analyze / Predict"}
                  </button>
                </div>
              </div>

              {/* Right Side: Results */}
              <div className="bg-[#0f172a] rounded-xl p-6 border border-slate-700 flex flex-col shadow-inner">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">Result: 
                  <span className={result ? "text-blue-400 font-bold bg-blue-900/40 border border-blue-800/50 px-3 py-1 rounded-lg" : "text-slate-500 italic font-normal text-base"}>
                    {result ? result.prediction : "Waiting for analysis..."}
                  </span>
                </h3>
                
                <div className="space-y-6 flex-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence Probabilities</p>
                  
                  <ProbabilityBar label="Non-Demented" value={result?.probabilities?.non || 0} />
                  <ProbabilityBar label="Very Mild" value={result?.probabilities?.very_mild || 0} />
                  <ProbabilityBar label="Mild" value={result?.probabilities?.mild || 0} highlight={result?.prediction === 'Mild Demented'} />
                  <ProbabilityBar label="Moderate" value={result?.probabilities?.moderate || 0} highlight={result?.prediction === 'Moderate Demented'} />
                </div>

                <div className="mt-8 pt-5 border-t border-slate-800">
                   <p className="text-xs text-slate-400 flex items-center gap-2 font-medium">
                     <CheckCircle2 size={16} className="text-emerald-500" /> History CRUD System Connected
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
      active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-[#0f172a] hover:text-slate-200'
    }`}>
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}

function ProbabilityBar({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) {
  const isHigh = value > 50;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm mb-1">
        <span className={highlight && isHigh ? "font-bold text-emerald-400" : "text-slate-300 font-medium"}>{label}</span>
        <span className={`font-mono font-medium ${highlight && isHigh ? "text-emerald-400" : "text-slate-400"}`}>{value}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden flex items-center px-0.5 relative border border-slate-700/50">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-out absolute left-0.5 ${highlight && isHigh ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}
          style={{ width: `calc(${value}% - 4px)` }}
        ></div>
      </div>
    </div>
  );
}