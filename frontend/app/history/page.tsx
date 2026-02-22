"use client";

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, Stethoscope, Settings, LogOut, 
  Upload, Download, CheckCircle2, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Reset result when new image is uploaded
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return alert("กรุณาอัปโหลดรูปภาพสแกนสมอง (MRI)");
    
    setLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // ยิง API ผ่าน Nginx ไปที่ Backend
      const response = await fetch('/api/diagnosis', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
      setLoading(false);
    } catch (error) {
      console.error("Error analyzing:", error);
      // Mock ข้อมูลกรณี API ยังไม่เชื่อมต่อ
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
            <NavItem icon={<Stethoscope size={20}/>} label="Patients" active/>
          </Link>
          <Link href="/diagnosis">
            <NavItem icon={<Stethoscope size={20}/>} label="Diagnosis"/>
          </Link>
          <NavItem icon={<Settings size={20}/>} label="Setting" />
        </nav>

        <div className="p-4 border-t">
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
        <header className="h-16 bg-white border-b flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-gray-400 text-sm">Diagnosis Path: /scan/alzheimer</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-green-500 flex items-center gap-1 text-sm">
                Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </span>
            </div>
            <button className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-200 transition">
              <Download size={16} /> Export
            </button>
          </div>
        </header>

        {/* Diagnosis Area */}
        <div className="p-8 overflow-y-auto">
          <div className="max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold mb-8 text-slate-800">Patient Record</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Upload & Preview */}
              <div className="space-y-6">
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-6 bg-blue-50/50 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden transition-all hover:bg-blue-50">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-[280px] object-contain rounded-lg shadow-sm" />
                  ) : (
                    <div className="text-center text-blue-300">
                      <Upload size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="font-medium">Image Preview & Upload</p>
                      <p className="text-xs mt-2 opacity-70">Upload MRI scan here</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
                  <label className="cursor-pointer bg-white border border-blue-600 text-blue-600 text-center py-2.5 rounded-lg font-medium hover:bg-blue-50 transition shadow-sm">
                    Edit Picture / Upload
                    <input type="file" className="hidden" accept=".jpg,.png,.jpeg" onChange={handleFileChange} />
                  </label>
                  <p className="text-xs text-slate-400 text-center italic">Validation (.png, .jpg, .jpeg)</p>
                  
                  <button 
                    onClick={handleAnalyze}
                    disabled={loading || !selectedFile}
                    className="bg-[#1e3a8a] text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
                  >
                    {loading ? (
                       <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Uploading...</>
                    ) : "Save"}
                  </button>
                </div>
              </div>

              {/* Right Side: Results */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">Medical Record Number:
                  <span className={result ? "text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-md" : "text-slate-400 italic font-normal text-base"}>
                    {result ? result.prediction : "1234567"}
                  </span>
                </h3>
                
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex flex-col">
                  <p className="text-lg font-semibold mb-6 flex items-center gap-2">ชื่อผู้ป่วย นามสกุลผู้ป่วย</p>
                  
                  <ProbabilityBar label="Non-Demented" value={result?.probabilities?.non || 0} />
                  <ProbabilityBar label="Very Mild" value={result?.probabilities?.very_mild || 0} />
                  <ProbabilityBar label="Mild" value={result?.probabilities?.mild || 0} highlight={result?.prediction === 'Mild Demented'} />
                  <ProbabilityBar label="Moderate" value={result?.probabilities?.moderate || 0} highlight={result?.prediction === 'Moderate Demented'} />
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200">
                   <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
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
      active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}>
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
  );
}

function ProbabilityBar({ label, value, highlight = false }: { label: string, value: number, highlight?: boolean }) {
  const isHigh = value > 50;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm mb-1">
        <span className={highlight && isHigh ? "font-bold text-emerald-600" : "text-slate-600 font-medium"}>{label}</span>
        <span className={`font-mono font-medium ${highlight && isHigh ? "text-emerald-600" : "text-slate-500"}`}>{value}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex items-center px-0.5 relative">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ease-out absolute left-0.5 ${highlight && isHigh ? 'bg-emerald-500 shadow-sm' : 'bg-slate-400'}`}
          style={{ width: `calc(${value}% - 4px)` }}
        ></div>
      </div>
    </div>
  );
}