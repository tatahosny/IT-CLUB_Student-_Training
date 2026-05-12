import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, useLocation, Navigate, Link, NavLink, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  LayoutDashboard, Users, Shield, Monitor, Settings, LogOut, ChevronLeft, ChevronRight, Bell, Camera, Menu, X,
  BookOpen, ClipboardList, BarChart3, GraduationCap, CheckSquare, Cpu, Eye, EyeOff, LogIn, Zap, CheckCircle, AlertCircle,
  Search, Filter, Download, Upload, Plus, Trash2, Edit3, MoreVertical, Key, Clock, Calendar, MapPin, UserCheck, UserX,
  ExternalLink, FileText, Info, AlertTriangle, Play, Square, QrCode, RefreshCw, Send, ArrowLeft, Star, Award, CheckCheck, TrendingUp,
  XCircle, ChevronUp, ChevronDown, Wifi, Check, Activity, Edit
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useAuthStore } from "../store/authStore";
import { authApi, adminApi, attendanceApi, sessionApi, taskApi, gradingApi } from "../api/adminApi";
import Logo from "../components/common/Logo";
import { ROLE_COLORS, ACTION_COLORS } from "../utils/constants";

export default function StudentLayout() {
  const { user, logout } = useAuthStore(); const navigate = useNavigate(); const [scannerOpen, setScannerOpen] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const [collapsed, setCollapsed] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleLogout = async () => { try { await authApi.logout() } catch {} logout(); navigate('/login'); toast.success('Logged out') }
  const navItems = [
    { path: '/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/student/tasks', label: 'Tasks', icon: ClipboardList },
    { path: '/student/grades', label: 'My Grades', icon: Star },
    { path: '/student/attendance', label: 'Attendance', icon: Clock },
    { path: '/student/notifications', label: 'Notifications', icon: Bell },
    { path: '/student/settings', label: 'Settings', icon: Settings },
  ]
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 48, backdropFilter: 'blur(4px)' }} />}</AnimatePresence>
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{
        width: collapsed ? 72 : 260,
        background: 'rgba(11, 22, 34, 0.8)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--glass-border)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        transition: 'width 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Logo size={32} showText={!collapsed} />
        </div>
        <div style={{ margin: 8, padding: '12px', borderRadius: 12, background: 'rgba(18, 214, 255, 0.04)', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 2, height: '100%', background: 'linear-gradient(to bottom, var(--color-cyan), var(--color-lime))' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 10, 
              background: 'linear-gradient(135deg, var(--color-cyan), var(--color-lime))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 16, fontWeight: 800, color: '#07111B',
              boxShadow: '0 0 10px var(--color-cyan-glow)',
              flexShrink: 0
            }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{user?.full_name?.split(' ')[0]}</div>
                <div style={{ fontSize: 10, color: 'var(--color-cyan)', fontWeight: 600 }}>#{user?.academic_number}</div>
              </div>
            )}
          </div>
        </div>
        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <NavLink 
              key={item.path} to={item.path} end={item.exact} 
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : undefined }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 8px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
          <AnimatePresence>
            {deferredPrompt && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                onClick={handleInstallClick} 
                className="btn btn-primary" 
                style={{ width: '100%', marginBottom: 12, height: 44 }}
              >
                <Download size={16} /> Install System
              </motion.button>
            )}
          </AnimatePresence>
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ 
            width: '100%', color: 'var(--color-red)', cursor: 'pointer', 
            background: 'var(--color-red-dim)', border: '1px solid rgba(239, 68, 68, 0.15)',
            justifyContent: collapsed ? 'center' : undefined
          }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>
          {!collapsed && (
            <div style={{ marginTop: 20, padding: '0 12px', opacity: 0.6, fontSize: 9, textAlign: 'center' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>© {new Date().getFullYear()} — <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>Mostafa_Hosny</span></div>
              <div style={{ marginTop: 2 }}>IT-CLUB Borg El Arab Technological University</div>
            </div>
          )}
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="mobile-header" style={{ height: 64, background: 'rgba(11,22,34,0.95)', borderBottom: '1px solid rgba(18,214,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: 12, backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="mobile-header-btn" 
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--color-text-primary)', cursor: 'pointer', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            {/* PC Sidebar Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hide-mobile"
              style={{
                background: 'rgba(18, 214, 255, 0.08)', border: '1px solid rgba(18, 214, 255, 0.15)',
                color: 'var(--color-cyan)', cursor: 'pointer',
                width: 40, height: 40, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <Menu size={20} /> : <X size={20} />}
            </button>

            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }} className="mobile-title">Student Portal</h1>
          </div>
          <button onClick={() => setScannerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: 'var(--color-cyan)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}><Camera size={16} /><span className="hide-mobile">Scan QR</span></button>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--color-bg-primary)' }} className="bg-dots main-content"><motion.div key={window.location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><Outlet /></motion.div></main>
      </div>
      <AnimatePresence>{scannerOpen && <QRScanner onClose={() => setScannerOpen(false)} />}</AnimatePresence>
    </div>
  )
}
