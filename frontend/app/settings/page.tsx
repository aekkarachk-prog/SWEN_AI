"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Stethoscope, Settings as SettingsIcon, LogOut,
  ArrowLeft, MessageSquare, Moon, Sun, User as UserIcon
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const [userName, setUserName] = useState("Loading...");
  const [userRole, setUserRole] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Load User Data
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

    // Load Theme - Explicitly default to light
    const savedTheme = localStorage.getItem('alz_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('alz_theme', 'light');
    }

    // Ping check for online status
    const checkStatus = async () => {
      let API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
      try {
        const res = await fetch(`${API_URL}/patients`, { method: "HEAD" });
        setIsOnline(res.ok);
      } catch (e) {
        setIsOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('alz_auth');
    Swal.fire({
      title: 'ออกจากระบบสำเร็จ',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      window.location.href = "/";
    });
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('alz_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('alz_theme', 'light');
    }
  };

  const handleUpdateProfile = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    const { value: newName } = await Swal.fire({
      title: 'แก้ไขโปรไฟล์',
      input: 'text',
      inputLabel: 'ชื่อที่แสดงผล',
      inputValue: userName,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#3b82f6',
      customClass: {
        popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
        title: isDark ? 'text-white' : '',
        htmlContainer: isDark ? 'text-slate-300' : '',
        input: isDark ? 'bg-slate-800 text-white border-slate-700' : ''
      }
    });

    if (newName && newName !== userName) {
      const savedAuth = localStorage.getItem('alz_auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        authData.user.name = newName;
        localStorage.setItem('alz_auth', JSON.stringify(authData));
        setUserName(newName);
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'อัปเดตชื่อเรียบร้อยแล้ว',
          customClass: {
            popup: isDark ? 'dark:bg-slate-900 dark:text-white border border-slate-800' : '',
            title: isDark ? 'text-white' : '',
            htmlContainer: isDark ? 'text-slate-300' : ''
          }
        });
      }
    }
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
        '<p><b>Office:</b> Building 1, 4th Floor</p>' +
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

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
            <Stethoscope size={24} /> {userName}
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/"><NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" /></Link>
          <Link href="/history"><NavItem icon={<Users size={20}/>} label="Patients" /></Link>
          <Link href="/diagnosis"><NavItem icon={<Stethoscope size={20}/>} label="Diagnosis"/></Link>
          <Link href="/settings"><NavItem icon={<SettingsIcon size={20}/>} label="Setting" active/></Link>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 transition"><ArrowLeft size={20} /></Link>
            <span className="text-gray-400 dark:text-slate-500 text-sm font-medium">System Settings</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium dark:text-slate-400">Status:</span>
            {isOnline ? (
              <span className="text-green-500 flex items-center gap-1.5 text-sm">Online <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div></span>
            ) : (
              <span className="text-red-500 flex items-center gap-1.5 text-sm">Offline <div className="w-2 h-2 bg-red-500 rounded-full"></div></span>
            )}
          </div>
        </header>

        <div className="p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Settings</h2>

            {/* Profile Section */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <UserIcon className="text-blue-500" size={20} /> User Profile
              </h3>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl font-bold">
                  {userName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Display Name</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">{userName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{userRole} Account</p>
                </div>
                <button onClick={handleUpdateProfile} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-xl text-sm font-bold transition">
                  Edit Profile
                </button>
              </div>
            </section>

            {/* Appearance Section */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Sun className="text-amber-500" size={20} /> Appearance
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">Dark Mode</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">เปลี่ยนโทนสีของแอปพลิเคชันเพื่อถนอมสายตา</p>
                </div>
                <button 
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}>
                    {isDarkMode ? <Moon size={14} className="m-1.5 text-blue-600" /> : <Sun size={14} className="m-1.5 text-amber-500" />}
                  </span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
      active ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
    }`}>
      {icon}
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}
