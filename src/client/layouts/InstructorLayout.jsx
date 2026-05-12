import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, useLocation, Navigate, Link, NavLink } from "react-router-dom";
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

export default function InstructorLayout() {
  const { user, logout } = useAuthStore(); const navigate = useNavigate(); const [mobileOpen, setMobileOpen] = useState(false); const [collapsed, setCollapsed] = useState(false)
  const handleLogout = () => { logout(); navigate('/login') }
  const navItems = [
    { path: '/instructor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/instructor/sessions', label: 'Sessions', icon: Monitor },
    { path: '/instructor/tasks', label: 'Tasks', icon: ClipboardList },
    { path: '/instructor/grading', label: 'Grading', icon: CheckSquare },
    { path: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
  ]
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--color-bg-primary)' }}>
      <AnimatePresence>{mobileOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 48, backdropFilter: 'blur(4px)' }} />}</AnimatePresence>
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{
        width: collapsed ? 72 : 260,
        background: 'rgba(11, 22, 34, 0.8)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--glass-border)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        transition: 'width 0.3s ease-in-out',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <Logo size={32} showText={!collapsed} />
        </div>
        
        <nav style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
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
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 10, 
            padding: '12px', borderRadius: 12, marginBottom: 8,
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}>
            <div style={{ 
              width: 34, height: 34, borderRadius: 8, 
              background: 'linear-gradient(135deg, var(--color-cyan), var(--color-lime))', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 14, fontWeight: 800, color: '#07111B', flexShrink: 0
            }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
                <div style={{ fontSize: 10, color: 'var(--color-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>Instructor</div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="sidebar-nav-item" style={{ 
            width: '100%', color: 'var(--color-red)', cursor: 'pointer', 
            background: 'var(--color-red-dim)', border: '1px solid rgba(239, 68, 68, 0.15)',
            justifyContent: collapsed ? 'center' : undefined
          }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 64, background: 'rgba(11,22,34,0.95)', borderBottom: '1px solid rgba(18,214,255,0.07)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, backdropFilter: 'blur(20px)', zIndex: 45 }}>
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

          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }} className="mobile-title">Instructor Portal</h1>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--color-bg-primary)' }} className="bg-dots main-content"><motion.div key={window.location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}><Outlet /></motion.div></main>
      </div>
    </div>
  )
}
