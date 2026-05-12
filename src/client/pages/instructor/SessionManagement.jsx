import React, { useState, useEffect, useRef, useMemo } from "react";
import ConfirmModal from "../../components/common/ConfirmModal";
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
import { ROLE_COLORS, ACTION_COLORS } from "../../utils/constants";

export default function SessionManagement() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [showCreate, setShowCreate] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ title: '', room_number: '', start_time: '', end_time: '', session_type: 'workshop' })

  const { data, isLoading } = useQuery({
    queryKey: ['my-sessions', user.id],
    queryFn: () => sessionApi.getAll({ limit: 50 }).then(r => r.data.data),
    refetchInterval: 15000,
  })

  const { data: staff } = useQuery({ 
    queryKey: ['staff-list'], 
    queryFn: () => adminApi.getUsers({ limit: 200 }).then(r => r.data.data.filter(u => ['instructor', 'mentor', 'mentor_manager'].includes(u.role?.role_name))) 
  })

  const [selectedInstructors, setSelectedInstructors] = useState([user.id])

  const toggleInstructor = (id) => {
    setSelectedInstructors(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const createMutation = useMutation({
    mutationFn: (data) => sessionApi.create({ ...data, instructor_ids: selectedInstructors }),
    onSuccess: () => { queryClient.invalidateQueries(['my-sessions']); setShowCreate(false); setEditingSession(null); toast.success('Session created!') },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => sessionApi.update(editingSession.id, { ...data, instructor_ids: selectedInstructors }),
    onSuccess: () => { queryClient.invalidateQueries(['my-sessions']); setShowCreate(false); setEditingSession(null); toast.success('Session updated!') },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: sessionApi.delete,
    onSuccess: () => { queryClient.invalidateQueries(['my-sessions']); toast.success('Session deleted') },
  })

  const sessions = (data || []).filter(s => s.instructors?.some(inst => inst.id === user.id) || s.session_type === 'workshop')
  const activeSessions = sessions.filter(s => s.is_active)
  
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.room_number?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditingSession(null)
    setForm({ title: '', room_number: '', start_time: '', end_time: '', session_type: 'workshop' })
    setSelectedInstructors([user.id])
    setShowCreate(true)
  }

  const openEdit = (session) => {
    setEditingSession(session)
    setForm({
      title: session.title,
      room_number: session.room_number || '',
      start_time: session.start_time ? new Date(session.start_time).toISOString().slice(0, 16) : '',
      end_time: session.end_time ? new Date(session.end_time).toISOString().slice(0, 16) : '',
      session_type: session.session_type || 'workshop'
    })
    setSelectedInstructors(session.instructors?.map(i => i.id) || [user.id])
    setShowCreate(true)
  }

  return (
    <div>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>
            <span className="gradient-text-cyan">Session Management</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            {activeSessions.length} active sessions • {sessions.length} total assigned
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} /> New Workshop
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'Total Assigned', value: sessions.length, icon: BookOpen, color: '#00d4ff' },
          { label: 'Active Now', value: activeSessions.length, icon: Wifi, color: '#10b981' },
          { label: 'Workshops', value: sessions.filter(s => s.session_type === 'workshop').length, icon: Cpu, color: '#7c3aed' },
        ].map((card, i) => (
          <div key={i} className="glass-card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
              <card.icon size={24} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {activeSessions.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-green)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green)', boxShadow: '0 0 10px var(--color-green)' }} className="animate-pulse" />
            Live Sessions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {activeSessions.map(session => (
              <motion.div key={session.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: 24, borderColor: 'rgba(16,185,129,0.3)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: '100%', background: 'var(--color-green)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="badge badge-green">LIVE</span>
                  <span className="badge badge-cyan">{session.session_type}</span>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{session.title}</h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                   <MapPin size={12} style={{ display: 'inline', marginRight: 4 }} /> {session.room_number || 'No Room'} • {session._count?.attendances || 0} students
                </div>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate(`/instructor/sessions/${session.id}/attendance`)}>
                  Control Room
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>All Sessions</h3>
          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              className="input" 
              placeholder="Search sessions..." 
              style={{ paddingLeft: 36, height: 40, fontSize: 13 }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Session Details</th>
                <th>Type</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(3)].map((_, i) => (
                <tr key={i}><td colSpan={5} className="animate-shimmer" style={{ height: 60 }} /></tr>
              )) : filteredSessions.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Room: {s.room_number || 'N/A'}</div>
                  </td>
                  <td><span className={`badge ${s.session_type === 'workshop' ? 'badge-purple' : 'badge-cyan'}`}>{s.session_type}</span></td>
                  <td style={{ fontSize: 13 }}>
                    <div>{new Date(s.start_time).toLocaleDateString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td>
                    <span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>
                      {s.is_active ? 'ACTIVE' : 'DONE'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/instructor/sessions/${s.id}/attendance`)} title="Attendance Control">
                        <Users size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)} title="Edit Staff/Session">
                        <Edit size={14} style={{ color: 'var(--color-cyan)' }} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(s.id)} style={{ color: 'var(--color-red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: 550, padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>{editingSession ? 'Edit Session Staff' : 'Create New Workshop'}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Workshop Title</label>
                  <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Intro to Web Development" disabled={user.role?.role_name !== 'super_admin'} />
                </div>
                <div>
                  <label className="label">Room Number</label>
                  <input className="input" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} placeholder="e.g. Lab-3" disabled={user.role?.role_name !== 'super_admin'} />
                </div>
                <div>
                  <label className="label">Session Type</label>
                  <select className="input" value={form.session_type} onChange={e => setForm({...form, session_type: e.target.value})} disabled={user.role?.role_name !== 'super_admin'}>
                    <option value="workshop">Workshop</option>
                    <option value="lecture">Lecture</option>
                  </select>
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <input className="input" type="datetime-local" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} disabled={user.role?.role_name !== 'super_admin'} />
                </div>
                <div>
                  <label className="label">End Time</label>
                  <input className="input" type="datetime-local" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} disabled={user.role?.role_name !== 'super_admin'} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Session Staff (Instructors & Mentors)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 150, overflowY: 'auto', padding: 4, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
                    {staff?.filter(i => i.id !== user.id).map(ins => (
                      <label key={ins.id} style={{ 
                        padding: '6px 12px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                        background: selectedInstructors.includes(ins.id) ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${selectedInstructors.includes(ins.id) ? 'var(--color-cyan)' : 'var(--glass-border)'}`,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <input type="checkbox" style={{ display: 'none' }} checked={selectedInstructors.includes(ins.id)} onChange={() => toggleInstructor(ins.id)} />
                        <span>{ins.full_name}</span>
                        <span style={{ fontSize: 9, opacity: 0.6, textTransform: 'uppercase' }}>({ins.role?.role_name?.replace('_', ' ')})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, height: 44 }} 
                  onClick={() => editingSession ? updateMutation.mutate(form) : createMutation.mutate(form)} 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingSession ? 'Save Changes' : 'Create Session')}
                </button>
                <button className="btn btn-ghost" style={{ height: 44 }} onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={() => deleteMutation.mutate(confirmDelete)} 
        title="Delete Session?"
        message="This will remove the session and all associated attendance records permanently."
      />
    </div>
  )
}
