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

function CreateSessionModal({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: () => adminApi.getGroups().then(r => r.data.data) })
  const { data: instructors } = useQuery({ queryKey: ['instructors-list'], queryFn: () => adminApi.getUsers({ role: 'instructor', limit: 100 }).then(r => r.data.data) })
  const [selectedInstructors, setSelectedInstructors] = useState([])
  const [loading, setLoading] = useState(false)

  const toggleInstructor = (id) => {
    setSelectedInstructors(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await sessionApi.create({ ...data, instructor_ids: selectedInstructors })
      toast.success('Session created successfully')
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}><span className="gradient-text-cyan">Create New Session</span></h2>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Session Title</label>
            <input className={`input ${errors.title ? 'input-error' : ''}`} {...register('title', { required: true })} placeholder="e.g. Intro to Node.js" />
          </div>
          <div>
            <label className="label">Room Number</label>
            <input className="input" {...register('room_number')} placeholder="e.g. Lab 4" />
          </div>
          <div>
            <label className="label">Session Type</label>
            <select className="input" {...register('session_type', { required: true })}>
              <option value="lecture">Lecture</option>
              <option value="workshop">Workshop</option>
            </select>
          </div>
          <div>
            <label className="label">Start Time</label>
            <input className="input" type="datetime-local" {...register('start_time', { required: true })} />
          </div>
          <div>
            <label className="label">End Time</label>
            <input className="input" type="datetime-local" {...register('end_time', { required: true })} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Group (Optional)</label>
            <select className="input" {...register('group_id')}>
              <option value="">Public / All Groups</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label" style={{ marginBottom: 10 }}>Instructors</label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: 10, 
              maxHeight: 120, 
              overflowY: 'auto',
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              border: '1px solid var(--glass-border)'
            }}>
              {instructors?.map(ins => (
                <label key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedInstructors.includes(ins.id)}
                    onChange={() => toggleInstructor(ins.id)}
                  />
                  {ins.full_name.split(' ')[0]}
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2', marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 48 }} disabled={loading}>{loading ? 'Creating...' : 'Create Session'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function SessionMonitoring() {
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const isMasterAdmin = currentUser?.email === 'admin@it.training.system'
  const isSuperAdmin = currentUser?.role?.role_name === 'super_admin'
  const isHR = currentUser?.role?.role_name === 'hr'

  const hasCreatePerm = isMasterAdmin || currentUser?.custom_permissions?.includes('can_create_sessions')
  const hasEditPerm = isMasterAdmin || isHR || currentUser?.custom_permissions?.includes('can_edit_sessions')
  const hasDeletePerm = isMasterAdmin || currentUser?.custom_permissions?.includes('can_delete_sessions')
  
  const deleteMutation = useMutation({
    mutationFn: (id) => sessionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions-monitor'])
      toast.success('Session deleted')
    }
  })
  const { data, isLoading } = useQuery({
    queryKey: ['sessions-monitor'],
    queryFn: () => sessionApi.getAll({ limit: 50 }).then(r => r.data.data),
    enabled: !!currentUser?.id,
    refetchInterval: 15000,
  })

  const sessions = data || []
  const activeSessions = sessions.filter(s => s.is_active)

  const isMentor = currentUser?.role?.role_name.includes('mentor');
  
  const filteredSessions = isMentor 
    ? sessions.filter(s => s.session_type === 'workshop' || s.instructors?.some(inst => inst.id === currentUser.id))
    : sessions;

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>
            <span className="gradient-text-cyan">Session Monitoring</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            {isMentor ? 'View and manage your workshops' : `${activeSessions.length} active sessions • Auto-updates every 15s`}
          </p>
        </div>
        {!isMentor && hasCreatePerm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> New Session
          </button>
        )}
      </div>

      {!isMentor && activeSessions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--color-green)' }}>
            <Wifi size={16} style={{ display: 'inline', marginRight: 6 }} />
            Active Sessions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 16 }}>
            {activeSessions.map(session => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ padding: 20, borderColor: 'rgba(16,185,129,0.3)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="badge badge-green">LIVE</span>
                  <span className="badge badge-cyan">{session.session_type === 'lecture' ? 'Lecture' : 'Workshop'}</span>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{session.title}</h4>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                  <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {new Date(session.start_time).toLocaleTimeString()} — {new Date(session.end_time).toLocaleTimeString()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                  {session._count?.attendances || 0} students present
                </div>
                <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
                  {(() => {
                    const staff = session.instructors || [];
                    const getRole = (u) => {
                      const label = session.staff_labels?.[u.id];
                      if (label) return label;
                      return u.role?.role_name || '';
                    };
                    
                    const instructorsList = staff.filter(u => {
                      const r = getRole(u).toLowerCase();
                      return r.includes('instructor') || r.includes('speaker') || (!r && u.role?.role_name === 'instructor');
                    });
                    const hrList = staff.filter(u => {
                      const r = getRole(u).toLowerCase();
                      return r === 'hr' || r.includes('human') || u.role?.role_name === 'hr';
                    });
                    
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {instructorsList.length > 0 && (
                          <div style={{ fontSize: 11 }}>
                            <span style={{ color: 'var(--color-purple)', fontWeight: 800 }}>Instructor: </span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{instructorsList.map(u => u.full_name.split(' ')[0]).join(', ')}</span>
                          </div>
                        )}
                        {hrList.length > 0 && (
                          <div style={{ fontSize: 11 }}>
                            <span style={{ color: 'var(--color-cyan)', fontWeight: 800 }}>HR: </span>
                            <span style={{ color: 'var(--color-text-primary)' }}>{hrList.map(u => u.full_name.split(' ')[0]).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <Link to={`${session.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    View Attendance
                  </Link>
                  {(hasEditPerm || session.instructors?.some(i => i.id === currentUser?.id)) && (
                    <Link to={`${session.id}?edit=true`} className="btn btn-ghost btn-sm" style={{ width: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit Session">
                      <Edit size={14} />
                    </Link>
                  )}
                  {hasDeletePerm && (
                    <button onClick={() => setConfirmDelete(session.id)} className="btn btn-danger btn-sm" style={{ width: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {isMentor && filteredSessions.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>My Sessions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filteredSessions.map(session => (
              <motion.div key={session.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ padding: '4px 10px', borderRadius: 8, background: session.session_type === 'workshop' ? 'rgba(124,58,237,0.1)' : 'rgba(34,211,238,0.1)', color: session.session_type === 'workshop' ? 'var(--color-purple)' : 'var(--color-cyan)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{session.session_type === 'lecture' ? 'Lecture' : 'Workshop'}</div>
                  <span className={`badge ${session.is_active ? 'badge-green' : 'badge-gray'}`}>{session.is_active ? 'Active' : 'Ended'}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{session.title}</h3>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  {new Date(session.start_time).toLocaleString()}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Group: <span style={{ fontWeight: 600 }}>{session.group?.group_name || '—'}</span></div>
                  <div style={{ fontSize: 12, color: 'var(--color-cyan)', fontWeight: 700 }}>{session._count?.attendances || 0} Present</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`${session.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    Manage Attendance
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!isMentor && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>All Sessions</h3>
          <div className="glass-card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Instructors</th>
                    <th>HRs</th>
                    <th>Mentors</th>
                    <th>Group</th>
                    <th>Start Time</th>
                    <th>Present</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? [...Array(8)].map((_, i) => (
                    <tr key={i}>{[...Array(10)].map((_, j) => (
                      <td key={j}><div style={{ height: 14, borderRadius: 4 }} className="animate-shimmer" /></td>
                    ))}</tr>
                  )) : sessions.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.title}</td>
                      <td><span className={`badge ${s.session_type === 'workshop' ? 'badge-purple' : 'badge-cyan'}`}>{s.session_type}</span></td>
                      {(() => {
                        const staff = s.instructors || [];
                        const getRole = (u) => {
                          const label = s.staff_labels?.[u.id];
                          if (label) return label;
                          return u.role?.role_name || '';
                        };
                        
                        const instructorsList = staff.filter(u => {
                          const r = getRole(u).toLowerCase();
                          return r.includes('instructor') || r.includes('speaker') || (!r && u.role?.role_name === 'instructor');
                        });
                        const hrList = staff.filter(u => {
                          const r = getRole(u).toLowerCase();
                          return r === 'hr' || r.includes('human') || u.role?.role_name === 'hr';
                        });
                        const mentorsList = staff.filter(u => {
                          const r = getRole(u).toLowerCase();
                          return r.includes('mentor') || u.role?.role_name.includes('mentor');
                        });

                        return (
                          <>
                            <td style={{ fontSize: 12 }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {instructorsList.map(u => (
                                  <span key={u.id} style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--color-purple)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, border: '1px solid rgba(124,58,237,0.2)' }}>
                                    {u.full_name.split(' ')[0]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ fontSize: 12 }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {hrList.map(u => (
                                  <span key={u.id} style={{ background: 'rgba(34,211,238,0.1)', color: 'var(--color-cyan)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, border: '1px solid rgba(34,211,238,0.2)' }}>
                                    {u.full_name.split(' ')[0]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td style={{ fontSize: 12 }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {mentorsList.map(u => (
                                  <span key={u.id} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', padding: '2px 8px', borderRadius: 6, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {u.full_name.split(' ')[0]}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </>
                        )
                      })()}
                      <td style={{ fontSize: 13 }}>{s.group?.group_name || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(s.start_time).toLocaleString()}</td>
                      <td style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>{s._count?.attendances || 0}</td>
                      <td><span className={`badge ${s.is_active ? 'badge-green' : 'badge-gray'}`}>{s.is_active ? 'Active' : 'Ended'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Link to={`${s.id}`} style={{ color: 'var(--color-cyan)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Details</Link>
                          {(hasEditPerm || s.instructors?.some(i => i.id === currentUser?.id)) && (
                            <Link to={`${s.id}?edit=true`} style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }} title="Edit Session">
                              <Edit size={14} />
                            </Link>
                          )}
                          {hasDeletePerm && (
                            <button onClick={() => setConfirmDelete(s.id)} style={{ background: 'transparent', border: 'none', color: 'var(--color-red)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showCreateModal && <CreateSessionModal onClose={() => setShowCreateModal(false)} onSuccess={() => { setShowCreateModal(false); queryClient.invalidateQueries(['sessions-monitor']) }} />}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={() => deleteMutation.mutate(confirmDelete)}
        title="Delete Session?"
        message="Are you sure you want to permanently delete this session? This action cannot be undone."
      />
    </div>
  )
}
