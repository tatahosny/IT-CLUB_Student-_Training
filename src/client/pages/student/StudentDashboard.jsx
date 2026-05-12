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
import { useAuthStore } from "../../store/authStore";
import { authApi, adminApi, attendanceApi, sessionApi, taskApi, gradingApi } from "../../api/adminApi";
import Logo from "../../components/common/Logo";
import TaskCard from "../../components/common/TaskCard";
import { ROLE_COLORS, ACTION_COLORS } from "../../utils/constants";

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [selectedSession, setSelectedSession] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [taskFiles, setTaskFiles] = useState({})
  const [submittingTask, setSubmittingTask] = useState(null)

  const { data: sessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => sessionApi.getAll().then(r => r.data.data?.filter(s => s.is_active)),
  })

  const { data: tasks, isLoading: tasksLoading } = useQuery({ queryKey: ['student-tasks'], queryFn: () => taskApi.getAll().then(r => r.data.data) })
  const { data: mySubmissions, refetch: refetchSubs } = useQuery({ queryKey: ['my-submissions'], queryFn: () => taskApi.getMySubmissions().then(r => r.data.data) })

  const getSubmission = (taskId) => mySubmissions?.find(s => s.task_id === taskId)

  const handleTaskSubmit = async (taskId) => {
    const files = taskFiles[taskId] || []
    if (!files.length) return toast.error('Select files first')
    setSubmittingTask(taskId); try {
      const formData = new FormData(); files.forEach(f => formData.append('files', f))
      await taskApi.submit(taskId, formData); await refetchSubs(); toast.success('Updated successfully!'); setTaskFiles({ ...taskFiles, [taskId]: [] })
    } catch (e) { toast.error(e.response?.data?.message || 'Submission failed') } finally { setSubmittingTask(null) }
  }

  const handleTaskDeleteFile = async (taskId, filePath) => {
    const fileName = filePath.split(/[\\/]/).pop();
    try { await taskApi.deleteFile(taskId, fileName); toast.success('File removed'); refetchSubs(); } catch (e) { toast.error('Failed to remove file') }
  }

  // Auto-select session if only one is active
  useEffect(() => {
    if (sessions?.length === 1 && !selectedSession && !qrImage && !loading) {
      generateMyQR(sessions[0].id)
    }
  }, [sessions, selectedSession, qrImage, loading])

  const generateMyQR = async (sessionId) => {
    setLoading(true); try {
      const res = await attendanceApi.getMyQR(sessionId); const token = res.data.data; setQrData(token)
      const dataUrl = await QRCode.toDataURL(`IT-QR:${token.qr_code}`, { width: 280, margin: 3, color: { dark: '#00d4ff', light: '#060b18' } })
      setQrImage(dataUrl); setSelectedSession(sessionId)
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate QR') } finally { setLoading(false) }
  }

  const isExpired = qrData && new Date() > new Date(qrData.expires_at)
  const minutesLeft = qrData ? Math.max(0, Math.round((new Date(qrData.expires_at) - new Date()) / 60000)) : 0

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ textAlign: 'center', marginBottom: 48, marginTop: 20 }}>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.5px' }}>
          Welcome, <span className="gradient-text-cyan">{user?.full_name}</span> 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 16, marginTop: 10, maxWidth: 600, margin: '10px auto 0' }}>
          Your central hub for attendance tracking and academic tasks
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {/* Attendance Section - Full Width or Centered Card */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={18} className="color-cyan" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Attendance QR</h2>
          </div>
          
          <div className="glass-card" style={{ padding: 40, display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,212,255,0.15)', background: 'linear-gradient(135deg, rgba(6,11,24,0.8), rgba(12,20,40,0.8))', position: 'relative', overflow: 'hidden' }}>
            {/* Background Glow */}
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 300, height: 300, background: 'rgba(0,212,255,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
            
            <div style={{ flex: '1 1 300px', textAlign: 'center' }}>
              <div style={{ marginBottom: 32, padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '2px', fontWeight: 700 }}>ACADEMIC ID</div>
                <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '4px', color: 'var(--color-cyan)', textShadow: '0 0 20px rgba(0,212,255,0.3)' }}>{user?.academic_number}</div>
              </div>
              
              {sessions?.length > 0 && !qrImage && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                   <p style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Select active session to generate QR:</p>
                   {sessions.map(s => (
                     <button key={s.id} onClick={() => generateMyQR(s.id)} className="btn btn-primary" style={{ width: '100%', height: 48 }}>{s.title} <span className="badge badge-green" style={{ marginLeft: 8 }}>LIVE</span></button>
                   ))}
                </div>
              )}
              
              {sessions?.length === 0 && (
                <div style={{ opacity: 0.6 }}>
                  <Clock size={40} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
                  <p>No sessions currently active</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {qrImage && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '0 0 auto' }}>
                  <div style={{ padding: 20, borderRadius: 24, background: '#fff', border: isExpired ? '4px solid var(--color-red)' : '4px solid var(--color-cyan)', boxShadow: '0 0 40px rgba(0,212,255,0.2)' }}>
                    <img src={qrImage} alt="QR" style={{ width: 240, height: 240, display: 'block', opacity: isExpired ? 0.2 : 1 }} />
                    {isExpired && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-red)', fontWeight: 900, fontSize: 24 }}>EXPIRED</div>}
                  </div>
                  <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: isExpired ? 'var(--color-red)' : 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {isExpired ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                      {isExpired ? 'QR Expired' : `Valid for ${minutesLeft} mins`}
                    </div>
                    <button className="btn btn-ghost" style={{ marginTop: 12, fontSize: 12 }} onClick={() => generateMyQR(selectedSession)} disabled={loading}>
                      <RefreshCw size={14} style={{ marginRight: 6 }} /> {loading ? 'Wait...' : 'Refresh Token'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Tasks Grid Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={18} className="color-purple" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Recent Tasks & Projects</h2>
            </div>
            <Link to="/tasks" style={{ fontSize: 14, color: 'var(--color-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }} className="hover-underline">
              View All <ExternalLink size={14} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
            {tasksLoading ? [...Array(3)].map((_, i) => <div key={i} style={{ height: 220, borderRadius: 24 }} className="glass-card animate-shimmer" />) : 
             tasks?.slice(0, 6).map(task => (
              <TaskCard 
                key={task.id} 
                task={task} 
                sub={getSubmission(task.id)} 
                files={taskFiles[task.id]} 
                setFiles={(f) => setTaskFiles({ ...taskFiles, [task.id]: f })} 
                submitting={submittingTask === task.id} 
                handleSubmit={handleTaskSubmit} 
                handleDeleteFile={handleTaskDeleteFile} 
              />
            ))}
            {tasks?.length === 0 && (
              <div className="glass-card" style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', opacity: 0.6 }}>
                <FolderOpen size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
                <p style={{ fontSize: 16 }}>No assignments assigned to you yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
