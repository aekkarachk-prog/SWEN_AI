"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, Users, UserPlus, Trash2, Edit2, 
  Search, ArrowLeft, LayoutDashboard, Stethoscope, 
  Activity, Settings as SettingsIcon, LogOut, MessageSquare,
  Eye, EyeOff
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

interface UserAccount {
  _id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE';
  email: string;
}

export default function ManageAccountsPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const savedAuth = JSON.parse(localStorage.getItem('alz_auth') || '{}');
      const res = await fetch(`${API_URL}/api/user/all`, {
        headers: { 'Authorization': `Bearer ${savedAuth.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else if (res.status === 403) {
        window.location.href = "/"; // Not an admin
      }
    } catch (error) {
      console.error("Fetch users failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem('alz_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setUserName(authData.user?.name || "Admin");
      setUserRole(authData.user?.role || "");
      if (authData.user?.role !== 'ADMIN') window.location.href = "/";
    } else {
      window.location.href = "/";
    }
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    const { value: formValues } = await Swal.fire({
      title: '<span class="text-2xl font-black uppercase tracking-tight">สร้างบัญชีผู้ใช้ใหม่</span>',
      html: `
        <div class="text-left space-y-4 p-2">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Username</label>
            <input id="swal-username" placeholder="เช่น doctor_john" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
          </div>
          
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">Password</label>
            <div class="relative">
              <input id="swal-password" type="password" placeholder="••••••••" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
              <button type="button" id="toggle-pass" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer">
                👁️
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">ชื่อ-นามสกุล</label>
              <input id="swal-name" placeholder="ระบุชื่อจริง" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">ตำแหน่ง (Role)</label>
              <select id="swal-role" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
                <option value="DOCTOR">DOCTOR (แพทย์)</option>
                <option value="NURSE">NURSE (พยาบาล)</option>
                <option value="ADMIN">ADMIN (ผู้ดูแลระบบ)</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">อีเมล</label>
            <input id="swal-email" type="email" placeholder="example@mdkku.com" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
          </div>
        </div>
      `,
      didOpen: () => {
        const toggleBtn = document.getElementById('toggle-pass');
        const passInput = document.getElementById('swal-password') as HTMLInputElement;
        if (toggleBtn && passInput) {
          toggleBtn.onclick = () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            toggleBtn.innerText = isPass ? '🔒' : '👁️';
          };
        }
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'สร้างบัญชี',
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2.5rem]' : '!rounded-[2.5rem]',
        title: '!pt-8',
        actions: '!pb-8'
      },
      preConfirm: () => {
        const username = (document.getElementById('swal-username') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const name = (document.getElementById('swal-name') as HTMLInputElement).value;
        if (!username || !password || !name) {
          Swal.showValidationMessage('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
          return false;
        }
        return {
          username,
          password,
          name,
          role: (document.getElementById('swal-role') as HTMLSelectElement).value,
          email: (document.getElementById('swal-email') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const savedAuth = JSON.parse(localStorage.getItem('alz_auth') || '{}');
      const res = await fetch(`${API_URL}/api/user/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedAuth.token}`
        },
        body: JSON.stringify(formValues)
      });

      if (res.ok) {
        Swal.fire({
          title: 'สำเร็จ', 
          text: 'สร้างบัญชีเรียบร้อยแล้ว', 
          icon: 'success',
          customClass: { popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2.5rem]' : '!rounded-[2.5rem]' }
        });
        fetchUsers();
      } else {
        const err = await res.json();
        Swal.fire({
          title: 'ผิดพลาด', 
          text: err.error || 'ไม่สามารถสร้างบัญชีได้', 
          icon: 'error',
          customClass: { popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2.5rem]' : '!rounded-[2.5rem]' }
        });
      }
    }
  };

  const handleEditUser = async (user: UserAccount) => {
    const isDark = document.documentElement.classList.contains('dark');
    const { value: formValues } = await Swal.fire({
      title: '<span class="text-2xl font-black uppercase tracking-tight">แก้ไขข้อมูลผู้ใช้</span>',
      html: `
        <div class="text-left space-y-4 p-2">
          <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-6 flex justify-between items-center">
            <div>
              <p class="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Account Username</p>
              <p class="text-sm font-bold text-slate-700 dark:text-slate-300">@${user.username}</p>
            </div>
            <div class="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border dark:border-slate-700 shadow-sm">
              <span class="text-xs font-black text-blue-600">${user.role.charAt(0)}</span>
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">ชื่อ-นามสกุล</label>
            <input id="swal-edit-name" value="${user.name}" placeholder="ชื่อ-นามสกุล" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">ตำแหน่ง (Role)</label>
            <select id="swal-edit-role" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
              <option value="DOCTOR" ${user.role === 'DOCTOR' ? 'selected' : ''}>DOCTOR (แพทย์)</option>
              <option value="NURSE" ${user.role === 'NURSE' ? 'selected' : ''}>NURSE (พยาบาล)</option>
              <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>ADMIN (ผู้ดูแลระบบ)</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">อีเมล</label>
            <input id="swal-edit-email" value="${user.email || ''}" placeholder="Email" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 ml-1">รหัสผ่านใหม่ (ปล่อยว่างถ้าไม่เปลี่ยน)</label>
            <div class="relative">
              <input id="swal-edit-pass" type="password" placeholder="••••••••" class="swal2-input !m-0 !w-full !rounded-2xl !border-slate-200 dark:!border-slate-700 !text-sm ${isDark ? '!bg-slate-800 !text-white' : ''}">
              <button type="button" id="toggle-edit-pass" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer">
                👁️
              </button>
            </div>
          </div>
        </div>
      `,
      didOpen: () => {
        const toggleBtn = document.getElementById('toggle-edit-pass');
        const passInput = document.getElementById('swal-edit-pass') as HTMLInputElement;
        if (toggleBtn && passInput) {
          toggleBtn.onclick = () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            toggleBtn.innerText = isPass ? '🔒' : '👁️';
          };
        }
      },
      showCancelButton: true,
      confirmButtonText: 'บันทึกการเปลี่ยนแปลง',
      confirmButtonColor: '#3b82f6',
      cancelButtonText: 'ยกเลิก',
      customClass: {
        popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2.5rem]' : '!rounded-[2.5rem]',
        title: '!pt-8',
        actions: '!pb-8'
      },
      preConfirm: () => {
        return {
          name: (document.getElementById('swal-edit-name') as HTMLInputElement).value,
          role: (document.getElementById('swal-edit-role') as HTMLSelectElement).value,
          email: (document.getElementById('swal-edit-email') as HTMLInputElement).value,
          password: (document.getElementById('swal-edit-pass') as HTMLInputElement).value || undefined
        }
      }
    });

    if (formValues) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const savedAuth = JSON.parse(localStorage.getItem('alz_auth') || '{}');
      const res = await fetch(`${API_URL}/api/user/${user._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedAuth.token}`
        },
        body: JSON.stringify(formValues)
      });

      if (res.ok) {
        Swal.fire({
          title: 'สำเร็จ', 
          text: 'อัปเดตข้อมูลเรียบร้อยแล้ว', 
          icon: 'success',
          customClass: { popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2.5rem]' : '!rounded-[2.5rem]' }
        });
        fetchUsers();
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    const isDark = document.documentElement.classList.contains('dark');
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: "คุณต้องการลบผู้ใช้งานรายนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'ใช่, ลบเลย',
      customClass: { popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2rem]' : '!rounded-[2rem]' }
    });

    if (result.isConfirmed) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
      const savedAuth = JSON.parse(localStorage.getItem('alz_auth') || '{}');
      const res = await fetch(`${API_URL}/api/user/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${savedAuth.token}` }
      });

      if (res.ok) {
        Swal.fire({
          title: 'สำเร็จ', 
          text: 'ลบผู้ใช้เรียบร้อยแล้ว', 
          icon: 'success',
          customClass: { popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2rem]' : '!rounded-[2rem]' }
        });
        fetchUsers();
      } else {
        const err = await res.json();
        Swal.fire({
          title: 'ผิดพลาด', 
          text: err.error || 'ลบไม่สำเร็จ', 
          icon: 'error',
          customClass: { popup: isDark ? '!bg-slate-900 !text-white !border-slate-800 !rounded-[2rem]' : '!rounded-[2rem]' }
        });
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        '</div>',
      confirmButtonColor: '#3b82f6',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
      }
    });
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col shadow-sm text-nowrap">
        <div className="p-6 text-nowrap">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Shield size={24} /> {userName}
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/"><NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" /></Link>
          <Link href="/dashboard"><NavItem icon={<Activity size={20}/>} label="Analytics"/></Link>
          <Link href="/history"><NavItem icon={<Users size={20}/>} label="Patients" /></Link>
          {(userRole === 'DOCTOR' || userRole === 'ADMIN') && (
            <Link href="/diagnosis"><NavItem icon={<Stethoscope size={20}/>} label="Diagnosis"/></Link>
          )}
          {userRole === 'ADMIN' && (
            <Link href="/admin/accounts"><NavItem icon={<Shield size={20}/>} label="Accounts" active/></Link>
          )}
          <Link href="/settings"><NavItem icon={<SettingsIcon size={20}/>} label="Setting" /></Link>
          <div onClick={handleContactAdmin}>
            <NavItem icon={<MessageSquare size={20}/>} label="Contact Admin" />
          </div>
        </nav>
        <div className="p-4 border-t dark:border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-red-500 w-full px-4 py-2 transition text-sm font-medium">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8 text-nowrap">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition"><ArrowLeft size={20} /></Link>
            <span className="text-gray-400 dark:text-slate-500 text-sm font-medium uppercase tracking-widest text-[10px]">Administration / <span className="text-blue-600 font-black">User Accounts</span></span>
          </div>
          <button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition shadow-xl shadow-blue-600/20 active:scale-95">
            <UserPlus size={18} /> Create Account
          </button>
        </header>

        <div className="p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 flex-1">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border dark:border-slate-800 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="ค้นหาตามชื่อ หรือ Username..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 outline-none transition dark:text-white text-sm font-medium"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">User Profile</th>
                    <th className="px-8 py-5">Position / Role</th>
                    <th className="px-8 py-5">Email Contact</th>
                    <th className="px-8 py-5 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {loading ? (
                    <tr><td colSpan={4} className="p-24 text-center">
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading database...</span>
                    </td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="p-24 text-center text-slate-400 font-medium">ไม่พบข้อมูลบัญชีผู้ใช้</td></tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-black text-xs border dark:border-blue-800 shadow-sm">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white text-sm">{user.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-wider">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' :
                          user.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' : 
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-xs font-medium text-slate-500 dark:text-slate-400">{user.email || '-'}</td>
                      <td className="px-8 py-5 text-right space-x-1">
                        <button onClick={() => handleEditUser(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteUser(user._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}
