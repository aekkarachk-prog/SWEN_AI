"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Settings,
  LogOut,
  ArrowLeft,
  MessageSquare,
  Save,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import {
  clearSession,
  getSession,
  writeAccessLog,
} from "../../lib/mdkku-auth";

type PatientForm = {
  fullName: string;
  age: string;
  gender: string;
  diagnosis: string;
  note: string;
};

type PatientRecord = {
  id: string;
  patientId: string;
  fullName: string;
  age: number;
  gender: string;
  diagnosis: string;
  note: string;
  doctorName: string;
  createdAt: string;
  updatedAt: string;
};

function generatePatientId() {
  return `PT-${Math.floor(100000 + Math.random() * 900000)}`;
}

function readPatients(): PatientRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem("mdkku_patients");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePatients(patients: PatientRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("mdkku_patients", JSON.stringify(patients));
}

export default function CreatePatientPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [doctorName, setDoctorName] = useState("Loading...");
  const [patientId, setPatientId] = useState("");
  const [form, setForm] = useState<PatientForm>({
    fullName: "",
    age: "",
    gender: "",
    diagnosis: "",
    note: "",
  });

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/");
      return;
    }

    setDoctorName(session.user.name);
    setPatientId(generatePatientId());
    setIsAuthorized(true);

    writeAccessLog({
      action: "VIEW_CREATE_PATIENT_PAGE",
      page: "/history/create",
      session,
    });
  }, [router]);

  const handleChange = (
    key: keyof PatientForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setForm({
      fullName: "",
      age: "",
      gender: "",
      diagnosis: "",
      note: "",
    });
    setPatientId(generatePatientId());

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "ล้างฟอร์มแล้ว",
      showConfirmButton: false,
      timer: 1500,
      background: "#1e293b",
      color: "#fff",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName || !form.age || !form.gender || !form.diagnosis) {
      Swal.fire({
        icon: "warning",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณากรอกชื่อ อายุ เพศ และผลวินิจฉัย",
        confirmButtonColor: "#3b82f6",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    const ageNumber = Number(form.age);
    if (Number.isNaN(ageNumber) || ageNumber <= 0) {
      Swal.fire({
        icon: "warning",
        title: "อายุไม่ถูกต้อง",
        text: "กรุณากรอกอายุเป็นตัวเลขมากกว่า 0",
        confirmButtonColor: "#3b82f6",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    const newPatient: PatientRecord = {
      id: patientId,
      patientId,
      fullName: form.fullName.trim(),
      age: ageNumber,
      gender: form.gender,
      diagnosis: form.diagnosis,
      note: form.note.trim(),
      doctorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const patients = readPatients();
    writePatients([newPatient, ...patients]);

    writeAccessLog({
      action: "CREATE_PATIENT",
      page: "/history/create",
      detail: `${patientId} - ${newPatient.fullName}`,
    });

    Swal.fire({
      icon: "success",
      title: "บันทึกข้อมูลสำเร็จ",
      text: `เพิ่มผู้ป่วย ${newPatient.fullName} เรียบร้อยแล้ว`,
      confirmButtonColor: "#3b82f6",
      background: "#1e293b",
      color: "#fff",
    });

    setForm({
      fullName: "",
      age: "",
      gender: "",
      diagnosis: "",
      note: "",
    });
    setPatientId(generatePatientId());
  };

  const handleLogout = () => {
    writeAccessLog({
      action: "LOGOUT",
      page: "/history/create",
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
            <NavItem icon={<Users size={20} />} label="Patients" />
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
            <Link href="/history" className="text-slate-400 hover:text-blue-400 transition">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-slate-400 text-sm font-medium">
              Create Patient Record
            </span>
          </div>

          <div className="text-sm text-slate-400">
            ผู้บันทึก: <span className="text-white font-medium">{doctorName}</span>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-700 flex items-center gap-3">
                <UserPlus size={22} className="text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">เพิ่มข้อมูลผู้ป่วย</h2>
                  <p className="text-sm text-slate-400">
                    กรอกข้อมูลผู้ป่วยใหม่เข้าสู่ระบบ
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Patient ID">
                    <input
                      value={patientId}
                      readOnly
                      title="Patient ID"
                      placeholder="Patient ID"
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-300 outline-none"
                    />
                  </Field>

                  <Field label="แพทย์ผู้บันทึก">
                    <input
                      value={doctorName}
                      readOnly
                      title="แพทย์ผู้บันทึก"
                      placeholder="แพทย์ผู้บันทึก"
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-300 outline-none"
                    />
                  </Field>

                  <Field label="ชื่อผู้ป่วย">
                    <input
                      value={form.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="เช่น สมชาย ใจดี"
                      title="ชื่อผู้ป่วย"
                      className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </Field>

                  <Field label="อายุ">
                    <input
                      value={form.age}
                      onChange={(e) => handleChange("age", e.target.value)}
                      placeholder="เช่น 68"
                      type="number"
                      min="1"
                      title="อายุ"
                      className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </Field>

                  <Field label="เพศ">
                    <select
                      value={form.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      title="เพศ"
                      className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                    >
                      <option value="">-- เลือกเพศ --</option>
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="อื่น ๆ">อื่น ๆ</option>
                    </select>
                  </Field>

                  <Field label="ผลวินิจฉัย">
                    <select
                      value={form.diagnosis}
                      onChange={(e) => handleChange("diagnosis", e.target.value)}
                      title="ผลวินิจฉัย"
                      className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                    >
                      <option value="">-- เลือกผลวินิจฉัย --</option>
                      <option value="Non Demented">Non Demented</option>
                      <option value="Very Mild Demented">Very Mild Demented</option>
                      <option value="Mild Demented">Mild Demented</option>
                      <option value="Moderate Demented">Moderate Demented</option>
                    </select>
                  </Field>
                </div>

                <Field label="บันทึกเพิ่มเติม">
                  <textarea
                    value={form.note}
                    onChange={(e) => handleChange("note", e.target.value)}
                    placeholder="รายละเอียดอาการ ประวัติ หรือหมายเหตุเพิ่มเติม"
                    title="บันทึกเพิ่มเติม"
                    rows={5}
                    className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                  />
                </Field>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 transition"
                  >
                    <Save size={18} />
                    บันทึกข้อมูล
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800 transition"
                  >
                    <RotateCcw size={18} />
                    ล้างฟอร์ม
                  </button>

                  <Link
                    href="/history"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    กลับไปหน้าประวัติ
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
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