import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Shield, Monitor, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Camera, Menu, X,
  BookOpen, ClipboardList, BarChart3, CheckSquare, Cpu, Zap, FileText,
  Activity, History, PieChart, Search, Flag
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/api/authApi'
import { adminApi } from '@/api/adminApi'
import QRScanner from '@/components/qr/QRScanner'
import NotificationPanel from '@/components/ui/NotificationPanel'
import Logo from '@/components/common/Logo'
import toast from 'react-hot-toast'

const HR_NAV_ITEMS = [
  { path: '/hr', label: 'HR Overview', icon: Activity, exact: true },
  { path: '/hr/grading-audit', label: 'Grading Logs', icon: History },
  { path: '/hr/sessions', label: 'Active Control', icon: Monitor },
  { path: '/hr/attendance', label: 'Attendance Archive', icon: FileText },
  { path: '/hr/analytics', label: 'Engagement Stats', icon: PieChart },
  { path: '/hr/settings', label: 'HR Config', icon: Settings },
]

export default function HRLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Debounced page view logging
    const pageName = location.pathname.split('/').pop() || 'hr-dashboard';
    if (!user) return;
    const timer = setTimeout(() => {
      adminApi.logActivity({
        action: 'page_view',
        description: `HR visited ${pageName} page`
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/login')
    toast.success('HR Session ended')
  }

  const sidebarW = collapsed ? 72 : 260

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#050a14' }}>
      
      {/* Background Decor */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(18, 214, 255, 0.05) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(155, 234, 39, 0.03) 0%, transparent 70%)' }} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(8px)', zIndex: 40 }}
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR ─────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          background: 'rgba(10, 20, 30, 0.8)',
          backdropFilter: 'blur(30px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'relative',
          flexShrink: 0,
          zIndex: 50,
          boxShadow: '10px 0 30px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo Section */}
        <div style={{
          padding: '28px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          overflow: 'hidden'
        }}>
          <Logo size={collapsed ? 30 : 34} showText={!collapsed} />
          
          {/* PC Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hide-mobile"
            style={{
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              color: 'var(--color-cyan)',
              cursor: 'pointer',
              width: 28,
              height: 28,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* HR Badge */}
        {!collapsed && (
          <div style={{ padding: '16px 20px 8px' }}>
            <div style={{ padding: '4px 12px', borderRadius: 8, background: 'rgba(0, 212, 255, 0.1)', border: '1px solid rgba(0, 212, 255, 0.2)', color: 'var(--color-cyan)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block' }}>
              HR Administration
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }} className="scrollbar-hide">
          {HR_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{ 
                justifyContent: collapsed ? 'center' : undefined,
                marginBottom: 4,
                borderRadius: 12,
                transition: 'all 0.2s',
                color: 'rgba(255,255,255,0.6)'
              }}
            >
              <item.icon size={18} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{
            padding: '12px', borderRadius: 16, background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--color-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 800 }}>
              {user?.full_name?.[0]}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name}</div>
                <div style={{ fontSize: 9, color: 'var(--color-cyan)', textTransform: 'uppercase', fontWeight: 800 }}>Certified HR Agent</div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '10px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start', gap: 12, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <LogOut size={16} />
            {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>End HR Session</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        
        {/* Topbar */}
        <header style={{
          height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', background: 'rgba(5, 10, 20, 0.8)', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.03)', zIndex: 30
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Mobile Toggle Menu */}
            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              className="mobile-header-btn"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-cyan)', boxShadow: '0 0 10px var(--color-cyan)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>HR Systems Active</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
             <button onClick={() => setScannerOpen(true)} className="btn btn-ghost" style={{ width: 40, height: 40, borderRadius: 12, padding: 0 }}>
               <Camera size={18} />
             </button>
             <div style={{ position: 'relative' }}>
               <button onClick={() => setNotifOpen(!notifOpen)} className="btn btn-ghost" style={{ width: 40, height: 40, borderRadius: 12, padding: 0 }}>
                 <Bell size={18} />
               </button>
               {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
             </div>
             <div style={{ height: 32, width: 1, background: 'rgba(255,255,255,0.1)' }} />
             <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 10 }}>
               {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
               <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #00d4ff, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
                 {user?.full_name[0]}
               </div>
             </div>
          </div>
        </header>

        {/* Page Area */}
        <main style={{ flex: 1, overflow: 'auto', padding: '32px', position: 'relative' }} className="scrollbar-hide">
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {scannerOpen && <QRScanner onClose={() => setScannerOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
