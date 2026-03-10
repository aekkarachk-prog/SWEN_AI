"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Settings,
  LogOut,
  Search,
  ArrowLeft,
  MessageSquare,
  FileText,
} from "lucide-react";
import {
  clearSession,
  getSession,
  writeAccessLog,
} from "../lib/mdkku-auth";

type PatientRecord = {
  id: string;
  patientId?: string;
  name?: string;
  fullName?: string;
  age?: number | string;
  gender?: string;
  diagnosis?: string;
  result?: string;
  status?: string;
  doctorName?: string;
  doctor?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

function readPatientsFromStorage(): PatientRecord[] {
  if (typeof window === "undefined") return [];

  const possibleKeys = [
    "patients",
    "patientData",
    "patient_records",
    "mdkku_patients",
  ];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {}
  }

  return [];
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

export default function HistoryPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [doctorName, setDoctorName] = useState("Loading...");
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/");
      return;
    }

    setDoctorName(session.user.name);
    setIsAuthorized(true);
    setPatients(readPatientsFromStorage());

    writeAccessLog({
      action: "VIEW_HISTORY_PAGE",
      page: "/history",
      session,
    });
  }, [router]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter((patient) => {
      const patientId = String(patient.patientId || patient.id || "").toLowerCase();
      const name = String(patient.name || patient.fullName || "").toLowerCase();
      const diagnosis = String(patient.diagnosis || patient.result || "").toLowerCase();
      const doctor = String(patient.doctorName || patient.doctor || "").toLowerCase();
      const status = String(patient.status || "").toLowerCase();

      return (
        patientId.includes(q) ||
        name.includes(q) ||
        diagnosis.includes(q) ||
        doctor.includes(q) ||
        status.includes(q)
      );
    });
  }, [patients, searchQuery]);

  const handleSearch = () => {
    writeAccessLog({
      action: "SEARCH_PATIENT",
      page: "/history",
      detail: searchQuery || "ค้นหาทั้งหมด",
    });
  };

  const handleRefresh = () => {
    setPatients(readPatientsFromStorage());
    writeAccessLog({
      action: "REFRESH_PATIENT_LIST",
      page: "/history",
      detail: "รีเฟรชรายการผู้ป่วย",
    });

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "รีเฟรชข้อมูลแล้ว",
      showConfirmButton: false,
      timer: 1500,
      background: "#1e293b",
      color: "#fff",
    });
  };

  const handleLogout = () => {
    writeAccessLog({
      action: "LOGOUT",
      page: "/history",
      detail: "ออกจากระบบ",
    });
    clearSession();
  };

  const handleContactAdmin = () => {
    Swal.fire({
      icon: "info",
      title: "ติดต่อผู้ดูแลระบบ",
      text: "ฟังก์ชันนี้กำลังอยู่ในช่วงพัฒนาครับ",
      confirmButtonColor: "#3b82f6",
      background: "#1e293b",
      color: "#fff",
    });
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
        <div className="p-6">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Stethoscope size={20} className="text-white" />
            </div>
            MDKKU HIS
          </h1>
          <p className="text-slate-400 text-xs mt-2 px-1 truncate">
            {doctorName}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
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
          <div onClick={handleContactAdmin}>
            <NavItem icon={<MessageSquare size={20} />} label="Contact Admin" />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Link href="/" onClick={handleLogout}>
            <button className="flex items-center gap-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full px-4 py-3 rounded-xl transition-all">
              <LogOut size={20} /> Logout
            </button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-[#1e293b] border-b border-slate-700 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-blue-400 transition">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-slate-400 text-sm font-medium">
              Patient History
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/history/create"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition"
            >
              + Add Patient
            </Link>
            <Link
              href="/history/edit_del"
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Edit / Delete
            </Link>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    ประวัติผู้ป่วย
                  </h2>
                  <p className="text-slate-400 mt-1 text-sm">
                    ค้นหาและตรวจสอบประวัติผู้ป่วยในระบบ
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative min-w-[280px]">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                      }}
                      placeholder="ค้นหาจากรหัส, ชื่อ, ผลวินิจฉัย..."
                      className="w-full rounded-xl bg-[#0f172a] border border-slate-700 pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleSearch}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition"
                  >
                    ค้นหา
                  </button>

                  <button
                    onClick={handleRefresh}
                    className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                  >
                    รีเฟรช
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <FileText size={18} />
                  รายการผู้ป่วย
                </div>
                <div className="text-sm text-slate-400">
                  ทั้งหมด {filteredPatients.length} รายการ
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="bg-[#0f172a] text-slate-300">
                    <tr className="text-left">
                      <th className="px-6 py-4">Patient ID</th>
                      <th className="px-6 py-4">ชื่อผู้ป่วย</th>
                      <th className="px-6 py-4">อายุ</th>
                      <th className="px-6 py-4">เพศ</th>
                      <th className="px-6 py-4">ผลวินิจฉัย</th>
                      <th className="px-6 py-4">แพทย์ผู้ดูแล</th>
                      <th className="px-6 py-4">อัปเดตล่าสุด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          ไม่พบข้อมูลผู้ป่วย
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((patient, index) => {
                        const patientId = patient.patientId || patient.id || "-";
                        const patientName =
                          patient.name || patient.fullName || "-";
                        const diagnosis =
                          patient.diagnosis || patient.result || "-";
                        const doctor =
                          patient.doctorName || patient.doctor || doctorName;
                        const updatedAt =
                          patient.updatedAt || patient.createdAt || "-";

                        return (
                          <tr
                            key={`${patientId}-${index}`}
                            className="border-t border-slate-800 hover:bg-slate-800/40 transition"
                          >
                            <td className="px-6 py-4 font-medium text-blue-400">
                              {patientId}
                            </td>
                            <td className="px-6 py-4 text-white">
                              {patientName}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {patient.age ?? "-"}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {patient.gender || "-"}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                                {diagnosis}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {doctor}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {formatDateTime(updatedAt)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
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
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
          : "text-slate-400 hover:bg-[#0f172a] hover:text-slate-200"
      }`}
    >
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}