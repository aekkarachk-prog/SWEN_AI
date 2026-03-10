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
  ArrowLeft,
  MessageSquare,
  Search,
  Save,
  Trash2,
  RotateCcw,
  FilePenLine,
} from "lucide-react";
import {
  clearSession,
  getSession,
  writeAccessLog,
} from "../../lib/mdkku-auth";

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

type PatientForm = {
  patientId: string;
  fullName: string;
  age: string;
  gender: string;
  diagnosis: string;
  note: string;
};

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

function emptyForm(): PatientForm {
  return {
    patientId: "",
    fullName: "",
    age: "",
    gender: "",
    diagnosis: "",
    note: "",
  };
}

export default function EditDeletePatientPage() {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [doctorName, setDoctorName] = useState("Loading...");
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm());

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace("/");
      return;
    }

    setDoctorName(session.user.name);
    setPatients(readPatients());
    setIsAuthorized(true);

    writeAccessLog({
      action: "VIEW_EDIT_DELETE_PATIENT_PAGE",
      page: "/history/edit_del",
      session,
    });
  }, [router]);

  const filteredPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter((patient) => {
      return (
        patient.patientId.toLowerCase().includes(q) ||
        patient.fullName.toLowerCase().includes(q) ||
        patient.diagnosis.toLowerCase().includes(q) ||
        patient.gender.toLowerCase().includes(q) ||
        patient.doctorName.toLowerCase().includes(q)
      );
    });
  }, [patients, searchQuery]);

  const handleSelectPatient = (patient: PatientRecord) => {
    setSelectedPatient(patient);
    setForm({
      patientId: patient.patientId,
      fullName: patient.fullName,
      age: String(patient.age),
      gender: patient.gender,
      diagnosis: patient.diagnosis,
      note: patient.note || "",
    });

    writeAccessLog({
      action: "SELECT_PATIENT_FOR_EDIT",
      page: "/history/edit_del",
      detail: `${patient.patientId} - ${patient.fullName}`,
    });
  };

  const handleSearch = () => {
    writeAccessLog({
      action: "SEARCH_PATIENT_FOR_EDIT_DELETE",
      page: "/history/edit_del",
      detail: searchQuery || "ค้นหาทั้งหมด",
    });
  };

  const handleReset = () => {
    setSelectedPatient(null);
    setForm(emptyForm());
    setSearchQuery("");

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "ล้างข้อมูลแล้ว",
      showConfirmButton: false,
      timer: 1500,
      background: "#1e293b",
      color: "#fff",
    });
  };

  const handleChange = (key: keyof PatientForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เลือกผู้ป่วย",
        text: "กรุณาเลือกผู้ป่วยจากรายการด้านซ้ายก่อน",
        confirmButtonColor: "#3b82f6",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

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

    const updatedPatients = patients.map((patient) => {
      if (patient.patientId !== selectedPatient.patientId) return patient;

      return {
        ...patient,
        fullName: form.fullName.trim(),
        age: ageNumber,
        gender: form.gender,
        diagnosis: form.diagnosis,
        note: form.note.trim(),
        doctorName,
        updatedAt: new Date().toISOString(),
      };
    });

    writePatients(updatedPatients);
    setPatients(updatedPatients);

    const updatedPatient =
      updatedPatients.find((p) => p.patientId === selectedPatient.patientId) || null;
    setSelectedPatient(updatedPatient);

    writeAccessLog({
      action: "UPDATE_PATIENT",
      page: "/history/edit_del",
      detail: `${form.patientId} - ${form.fullName}`,
    });

    Swal.fire({
      icon: "success",
      title: "อัปเดตข้อมูลสำเร็จ",
      text: `บันทึกการแก้ไขของ ${form.fullName} เรียบร้อยแล้ว`,
      confirmButtonColor: "#3b82f6",
      background: "#1e293b",
      color: "#fff",
    });
  };

  const handleDelete = async () => {
    if (!selectedPatient) {
      Swal.fire({
        icon: "warning",
        title: "ยังไม่ได้เลือกผู้ป่วย",
        text: "กรุณาเลือกผู้ป่วยที่ต้องการลบก่อน",
        confirmButtonColor: "#3b82f6",
        background: "#1e293b",
        color: "#fff",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบข้อมูล",
      text: `คุณต้องการลบผู้ป่วย ${selectedPatient.fullName} ใช่หรือไม่`,
      showCancelButton: true,
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#475569",
      background: "#1e293b",
      color: "#fff",
    });

    if (!result.isConfirmed) return;

    const updatedPatients = patients.filter(
      (patient) => patient.patientId !== selectedPatient.patientId
    );

    writePatients(updatedPatients);
    setPatients(updatedPatients);

    writeAccessLog({
      action: "DELETE_PATIENT",
      page: "/history/edit_del",
      detail: `${selectedPatient.patientId} - ${selectedPatient.fullName}`,
    });

    setSelectedPatient(null);
    setForm(emptyForm());

    Swal.fire({
      icon: "success",
      title: "ลบข้อมูลสำเร็จ",
      text: "ระบบลบข้อมูลผู้ป่วยเรียบร้อยแล้ว",
      confirmButtonColor: "#3b82f6",
      background: "#1e293b",
      color: "#fff",
    });
  };

  const handleLogout = () => {
    writeAccessLog({
      action: "LOGOUT",
      page: "/history/edit_del",
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
            <Link href="/history" className="text-slate-400 hover:text-blue-400 transition">
              <ArrowLeft size={20} />
            </Link>
            <span className="text-slate-400 text-sm font-medium">
              Edit / Delete Patient Record
            </span>
          </div>

          <div className="text-sm text-slate-400">
            ผู้แก้ไข: <span className="text-white font-medium">{doctorName}</span>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-[360px_1fr] gap-6">
            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-700">
                <div className="flex items-center gap-2 text-white font-semibold mb-4">
                  <Search size={18} />
                  ค้นหาผู้ป่วย
                </div>

                <div className="space-y-3">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="ค้นหาจากรหัส ชื่อ หรือผลวินิจฉัย"
                    className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleSearch}
                      className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition"
                    >
                      ค้นหา
                    </button>
                    <button
                      onClick={handleReset}
                      title="รีเซ็ตการค้นหา"
                      className="rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-[620px] overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="p-6 text-sm text-slate-400">
                    ไม่พบข้อมูลผู้ป่วย
                  </div>
                ) : (
                  <div className="p-3 space-y-3">
                    {filteredPatients.map((patient) => {
                      const active =
                        selectedPatient?.patientId === patient.patientId;

                      return (
                        <button
                          key={patient.patientId}
                          onClick={() => handleSelectPatient(patient)}
                          className={`w-full text-left rounded-xl border p-4 transition ${
                            active
                              ? "border-blue-500 bg-blue-500/10"
                              : "border-slate-700 bg-[#0f172a] hover:border-slate-500"
                          }`}
                        >
                          <div className="font-semibold text-white">
                            {patient.fullName}
                          </div>
                          <div className="text-sm text-blue-400 mt-1">
                            {patient.patientId}
                          </div>
                          <div className="text-xs text-slate-400 mt-2">
                            {patient.diagnosis}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            อัปเดตล่าสุด: {formatDateTime(patient.updatedAt)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-700 flex items-center gap-3">
                <FilePenLine size={22} className="text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">
                    แก้ไข / ลบข้อมูลผู้ป่วย
                  </h2>
                  <p className="text-sm text-slate-400">
                    เลือกผู้ป่วยจากด้านซ้ายเพื่อแก้ไขข้อมูล
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Patient ID">
                    <input
                      value={form.patientId}
                      readOnly
                      title="Patient ID - Read only field"
                      placeholder="Patient ID"
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-300 outline-none"
                    />
                  </Field>

                  <Field label="แพทย์ผู้แก้ไขล่าสุด">
                    <input
                      value={doctorName}
                      readOnly
                      title="แพทย์ผู้แก้ไขล่าสุด - Read only field"
                      placeholder="แพทย์ผู้แก้ไขล่าสุด"
                      className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-slate-300 outline-none"
                    />
                  </Field>

                  <Field label="ชื่อผู้ป่วย">
                    <input
                      value={form.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="ชื่อผู้ป่วย"
                      className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </Field>

                  <Field label="อายุ">
                    <input
                      value={form.age}
                      onChange={(e) => handleChange("age", e.target.value)}
                      type="number"
                      min="1"
                      placeholder="อายุ"
                      className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </Field>

                  <Field label="เพศ">
                    <select
                      value={form.gender}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      aria-label="เพศ"
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
                      aria-label="ผลวินิจฉัย"
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
                    rows={5}
                    placeholder="หมายเหตุเพิ่มเติม"
                    className="w-full rounded-xl bg-[#0f172a] border border-slate-700 px-4 py-3 text-white outline-none focus:border-blue-500 resize-none"
                  />
                </Field>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-700 bg-[#0f172a] p-4 text-sm">
                    <div className="text-slate-400 mb-2">ข้อมูลเวลา</div>
                    <div className="space-y-1 text-slate-300">
                      <div>
                        วันที่สร้าง:{" "}
                        <span className="text-white">
                          {selectedPatient
                            ? formatDateTime(selectedPatient.createdAt)
                            : "-"}
                        </span>
                      </div>
                      <div>
                        วันที่แก้ไขล่าสุด:{" "}
                        <span className="text-white">
                          {selectedPatient
                            ? formatDateTime(selectedPatient.updatedAt)
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-[#0f172a] p-4 text-sm">
                    <div className="text-slate-400 mb-2">ผู้รับผิดชอบล่าสุด</div>
                    <div className="space-y-1 text-slate-300">
                      <div>
                        แพทย์ผู้บันทึก:{" "}
                        <span className="text-white">
                          {selectedPatient?.doctorName || "-"}
                        </span>
                      </div>
                      <div>
                        แพทย์ผู้กำลังแก้ไข:{" "}
                        <span className="text-white">{doctorName}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 transition"
                  >
                    <Save size={18} />
                    บันทึกการแก้ไข
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-500 transition"
                  >
                    <Trash2 size={18} />
                    ลบข้อมูลผู้ป่วย
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-5 py-3 font-semibold text-slate-200 hover:bg-slate-800 transition"
                  >
                    <RotateCcw size={18} />
                    ล้างการเลือก
                  </button>
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