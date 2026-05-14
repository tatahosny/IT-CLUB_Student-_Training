import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Shield, Monitor, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Camera, Menu, X,
  BookOpen, ClipboardList, BarChart3, CheckSquare, Cpu, Zap, FileText,
  Activity, History
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/authApi'
import { adminApi } from '@/api/adminApi'
import QRScanner from '@/components/qr/QRScanner'
import NotificationPanel from '@/components/ui/NotificationPanel'
import Logo from '@/components/common/Logo'
import toast from 'react-hot-toast'

const NAV_ITEMS = {
  super_admin: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
    { path: '/admin/grading', label: 'Grading', icon: CheckSquare },
    { path: '/admin/sessions', label: 'Sessions', icon: Monitor },
    { path: '/admin/attendance', label: 'Attendance', icon: FileText },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/hr-dashboard', label: 'HR Overview', icon: Activity },
    { path: '/admin/tasks-audit', label: 'Tasks Audit', icon: ClipboardList },
    { path: '/admin/grading-audit', label: 'Grading Logs', icon: History },
    { path: '/admin/security', label: 'Security Logs', icon: Shield },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ],
  instructor: [
    { path: '/instructor',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/instructor/sessions', label: 'Sessions',  icon: BookOpen },
    { path: '/instructor/tasks',    label: 'Tasks',     icon: ClipboardList },
    { path: '/instructor/analytics',label: 'Analytics', icon: BarChart3 },
  ],
  mentor: [
    { path: '/mentor',         label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    { path: '/mentor/grading', label: 'Grading Queue', icon: CheckSquare },
  ],
  mentor_manager: [
    { path: '/mentor',         label: 'Dashboard',    icon: LayoutDashboard, exact: true },
    { path: '/mentor/grading', label: 'Grading Queue', icon: CheckSquare },
  ],
}

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Debounced page view logging — avoids API call on fast navigation
    const pageName = location.pathname.split('/').pop() || 'dashboard';
    if (!user) return;
    const timer = setTimeout(() => {
      adminApi.logActivity({
        action: 'page_view',
        description: `Visited ${pageName} page`
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const role = user?.role?.role_name
  const isMasterAdmin = user?.email === 'admin@it.training.system'
  const baseItems = NAV_ITEMS[role] || NAV_ITEMS.super_admin
  const navItems = baseItems.filter(item => {
    if (isMasterAdmin) return true
    if (role === 'super_admin' || role === 'hr') return true 
    const perms = user?.custom_permissions || []
    if (item.path === '/admin/users' || item.path === '/instructor/users') return perms.includes('can_manage_users')
    if (item.path.includes('/sessions')) return perms.includes('can_create_sessions') || perms.includes('can_edit_sessions')
    if (item.path === '/admin/security') return perms.includes('can_view_analytics')
    return true
  })

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const sidebarW = collapsed ? 72 : 260

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg-primary)' }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(7,17,27,0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          background: 'rgba(11, 22, 34, 0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'relative',
          flexShrink: 0,
          zIndex: 50,
          boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        }}
      >
        {/* Top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, var(--color-cyan), var(--color-lime), transparent)',
          zIndex: 1,
        }} />


        {/* Scanline effect for sidebar */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(to bottom, transparent, rgba(18, 214, 255, 0.03) 50%, transparent)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none',
          opacity: 0.5
        }} />

        {/* Logo & Toggle Section */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          overflow: 'hidden'
        }}>
          <Logo size={32} showText={!collapsed} />
          
          {/* PC Sidebar Toggle (Inside Sidebar) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hide-mobile"
            style={{
              background: 'rgba(18, 214, 255, 0.08)',
              border: '1px solid rgba(18, 214, 255, 0.15)',
              color: 'var(--color-cyan)',
              cursor: 'pointer',
              width: 32,
              height: 32,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              marginLeft: collapsed ? 0 : 10
            }}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }} className="scrollbar-hide">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ padding: '6px 16px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                  color: 'var(--color-text-muted)', textTransform: 'uppercase', fontFamily: "'Poppins',sans-serif" }}
              >
                Navigation
              </motion.div>
            )}
          </AnimatePresence>

          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{ justifyContent: collapsed ? 'center' : undefined }}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} style={{ flexShrink: 0 }} />
              <AnimatePresence>
                {(!collapsed || mobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* User info & logout */}
        <div style={{ padding: '16px 8px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
          {/* User card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px', borderRadius: 12, overflow: 'hidden',
            marginBottom: 8, background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--glass-border)'
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-cyan), var(--color-lime))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#07111B', fontSize: 14, fontWeight: 800,
              boxShadow: '0 0 15px var(--color-cyan-glow)',
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {(!collapsed || mobileOpen) && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ flex: 1, overflow: 'hidden' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#EAFBFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.full_name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                    {role === 'oc' ? 'HR' : role?.replace(/_/g, ' ')}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className="sidebar-nav-item"
            style={{
              width: '100%', cursor: 'pointer',
              justifyContent: (collapsed && !mobileOpen) ? 'center' : undefined,
              color: 'var(--color-red)',
              background: 'var(--color-red-dim)',
              border: '1px solid rgba(239, 68, 68, 0.15)'
            }}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            <AnimatePresence>
              {(!collapsed || mobileOpen) && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Copyright */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                padding: '10px 16px',
                fontSize: '9px', color: 'var(--color-text-muted)',
                borderTop: '1px solid rgba(18,214,255,0.05)',
                textAlign: 'center', background: 'rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ marginBottom: 2 }}>
                © 2026 — <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>Mostafa_Hosny</span>
              </div>
              <div style={{ opacity: 0.7 }}>IT-CLUB Borg El Arab Technological University</div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.aside>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <header style={{
          height: 60,
          background: 'rgba(11,22,34,0.95)',
          borderBottom: '1px solid rgba(18,214,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', flexShrink: 0,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          {/* Left: mobile toggle menu btn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-header-btn"
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                color: 'var(--color-text-primary)', cursor: 'pointer',
                width: 40, height: 40, borderRadius: 10,
                alignItems: 'center', justifyContent: 'center'
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Breadcrumb hint */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} style={{ color: 'var(--color-cyan)' }} />
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'Poppins',sans-serif" }}>
                IT Training System
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* QR Scanner */}
            <button
              onClick={() => setScannerOpen(true)}
              style={{
                width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                background: 'rgba(18,214,255,0.08)',
                border: '1px solid rgba(18,214,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-cyan)', transition: 'all 0.2s',
              }}
              title="Open QR Scanner"
            >
              <Camera size={16} />
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                style={{
                  width: 38, height: 38, borderRadius: 10, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(18,214,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-secondary)', transition: 'all 0.2s',
                }}
              >
                <Bell size={16} />
              </button>
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
            </div>

            {/* Avatar */}
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: 'linear-gradient(135deg, #08B8E8, #9BEA27)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#07111B', fontSize: 13, fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(18,214,255,0.25)',
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1, overflow: 'auto', padding: 24,
          background: 'var(--color-bg-primary)',
        }} className="bg-dots">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {scannerOpen && <QRScanner onClose={() => setScannerOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
