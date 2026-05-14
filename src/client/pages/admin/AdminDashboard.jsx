import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Users, Monitor, ClipboardList, Shield, 
  CheckSquare, Activity, Cpu, FileText, BarChart3, Settings, Zap, Eye
} from 'lucide-react'
import { adminApi } from '../../api/adminApi'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import GradingQueue from './GradingQueue'

const STAT_CARDS = [
  { key: 'totalUsers',    label: 'Total Users', icon: Users,        color: 'var(--color-cyan)', gradient: 'rgba(18,214,255,0.05)' },
  { key: 'totalStudents', label: 'Trainee Students',    icon: Cpu,          color: 'var(--color-lime)', gradient: 'rgba(155,234,39,0.05)' },
  { key: 'totalSessions', label: 'Sessions',    icon: Monitor,      color: 'var(--color-cyan-bright)', gradient: 'rgba(91,231,255,0.05)' },
  { key: 'totalTasks',    label: 'Tasks',       icon: ClipboardList,color: 'var(--color-lime-bright)', gradient: 'rgba(183,255,74,0.05)'  },
]

const QUICK_LINKS = [
  { path: '/admin/users', label: 'Users', icon: Users, color: '#12D6FF' },
  { path: '/admin/sessions', label: 'Sessions', icon: Monitor, color: '#9BEA27' },
  { path: '/admin/tasks', label: 'Tasks', icon: ClipboardList, color: '#5BE7FF' },
  { path: '/admin/grading', label: 'Grading', icon: CheckSquare, color: '#B7FF4A' },
  { path: '/admin/attendance', label: 'Attendance', icon: FileText, color: '#12D6FF' },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, color: '#9BEA27' },
  { path: '/admin/security', label: 'Security Logs', icon: Shield, color: 'var(--color-red)' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, color: 'var(--color-text-muted)' },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminApi.getAnalytics().then((r) => r.data.data),
  })

  if (isLoading) return <DashboardSkeleton />

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }} className="font-orbitron gradient-text-brand">
          System Dashboard
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 6, fontWeight: 500 }}>
          <Activity size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--color-cyan)' }} />
          Real-time system monitoring and data analytics
        </p>
      </div>

      {/* Quick Links Section */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} className="text-cyan" />
          Quick Management
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {QUICK_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="glass-card glass-card-hover"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                padding: '16px 12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${link.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: link.color, border: `1px solid ${link.color}30`
              }}>
                <link.icon size={20} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {STAT_CARDS.map((card, i) => (
          <motion.div key={card.key} custom={i} initial="hidden" animate="visible" variants={cardVariants}
            className="glass-card glass-card-hover" style={{ background: `linear-gradient(135deg, var(--glass-bg), ${card.gradient})`, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                <card.icon size={22} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.02em' }}>{analytics?.[card.key] || 0}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}><CheckSquare size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-purple)' }} />Pending Gradings</h3>
            <button onClick={() => navigate('/admin/grading')} className="btn btn-ghost" style={{ fontSize: 12, height: 32 }}>View All</button>
          </div>
          <GradingQueue compact />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}><Monitor size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-cyan)' }} />Active Sessions</h3>
            <button onClick={() => navigate('/admin/sessions')} className="btn btn-ghost" style={{ fontSize: 12, height: 32 }}>Live Monitoring</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analytics?.activeSessionsList?.length > 0 ? (
              analytics.activeSessionsList.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green)', boxShadow: '0 0 8px var(--color-green)' }} className="animate-pulse" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.session_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.instructor?.full_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-cyan)' }}>{s.attendance_count} Present</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>No active sessions right now</div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}><Activity size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-cyan)' }} />System Activity Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics?.activityData || []}>
              <defs>
                <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ background: 'rgba(11, 22, 34, 0.9)', border: '1px solid var(--glass-border)', borderRadius: 12, color: '#fff' }}
                itemStyle={{ color: 'var(--color-cyan)' }}
              />
              <Area type="monotone" dataKey="value" stroke="var(--color-cyan)" fillOpacity={1} fill="url(#colorCyan)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}><FileText size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-lime)' }} />Recent Activity</h3>
            <button onClick={() => navigate('/admin/security?tab=activity')} className="btn btn-ghost" style={{ fontSize: 12, height: 32 }}>History</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {analytics?.recentLogs?.map((log, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {log.action.includes('view') ? <Eye size={16} className="text-cyan" /> : <Activity size={16} style={{ color: 'var(--color-purple)' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{log.user?.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{log.description}</div>
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {(!analytics?.recentLogs || analytics.recentLogs.length === 0) && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted)', fontSize: 12 }}>No recent activity</div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 24, marginBottom: 28 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}><Users size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-lime)' }} />User Distribution</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={analytics?.roleData || []} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {(analytics?.roleData || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={[ '#12D6FF', '#9BEA27', '#5BE7FF', '#B7FF4A' ][index % 4]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ background: 'rgba(11, 22, 34, 0.9)', border: '1px solid var(--glass-border)', borderRadius: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div>
      <div style={{ height: 32, width: 240, borderRadius: 8, marginBottom: 8 }} className="animate-shimmer" />
      <div style={{ height: 16, width: 340, borderRadius: 8, marginBottom: 32 }} className="animate-shimmer" />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 32 }}>
        {[...Array(8)].map((_, i) => <div key={i} style={{ height: 100, borderRadius: 12 }} className="animate-shimmer glass-card" />)}
      </div>

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {[...Array(4)].map((_, i) => <div key={i} style={{ height: 140, borderRadius: 16 }} className="animate-shimmer glass-card" />)}
      </div>
      <div className="grid-2">
        <div style={{ height: 320, borderRadius: 16 }} className="animate-shimmer glass-card" />
        <div style={{ height: 320, borderRadius: 16 }} className="animate-shimmer glass-card" />
      </div>
    </div>
  )
}
