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

function CreateUserModal({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => adminApi.getRoles().then(r => r.data.data) })
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: () => adminApi.getGroups().then(r => r.data.data) })
  const { data: levels } = useQuery({ queryKey: ['levels'], queryFn: () => adminApi.getLevels().then(r => r.data.data) })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      await adminApi.createUser(data)
      toast.success('User created successfully')
      onSuccess()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 32, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}><span className="gradient-text-cyan">Add New User</span></h2>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Full Name</label>
            <input className={`input ${errors.full_name ? 'input-error' : ''}`} {...register('full_name', { required: true })} placeholder="Enter full name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className={`input ${errors.email ? 'input-error' : ''}`} type="email" {...register('email', { required: true })} placeholder="Email address" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className={`input ${errors.password ? 'input-error' : ''}`} type="password" {...register('password', { required: true })} placeholder="Initial password" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" {...register('role_id', { required: true })}>
              <option value="">Select Role</option>
              {roles?.map(r => <option key={r.id} value={r.id}>{r.role_name.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Academic # (Students)</label>
            <input className="input" {...register('academic_number')} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Group</label>
            <select className="input" {...register('group_id')}>
              <option value="">No Group</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" {...register('level_id')}>
              <option value="">No Level</option>
              {levels?.map(l => <option key={l.id} value={l.id}>{l.level_name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 48 }} disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function UserModal({ user, isEdit, roles, groups, levels, onClose, onSave, isLoading, isMasterAdmin }) {
  const [form, setForm] = useState(isEdit ? {
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    academic_number: user.academic_number || '',
    national_id: user.national_id || '',
    role_id: user.role_id || '',
    group_id: user.group_id || '',
    level_id: user.level_id || '',
    custom_permissions: user.custom_permissions || [],
    password: '', 
  } : {
    full_name: '', email: '', phone: '', academic_number: '', national_id: '',
    role_id: '', group_id: '', level_id: '', password: '', custom_permissions: []
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: 650, padding: 32, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}><span className="gradient-text-cyan">{isEdit ? 'Edit User Details' : 'Add New User'}</span></h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Full Name</label>
            <input className="input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Enter full name" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email address" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone number" />
          </div>
          <div>
            <label className="label">Academic #</label>
            <input className="input" value={form.academic_number} onChange={e => setForm({...form, academic_number: e.target.value})} placeholder="Optional" />
          </div>
          <div>
            <label className="label">National ID</label>
            <input className="input" value={form.national_id} onChange={e => setForm({...form, national_id: e.target.value})} placeholder="Optional" />
          </div>
          <div>
            <label className="label">Password {isEdit && '(Leave blank to keep same)'}</label>
            <input className="input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})} disabled={!isMasterAdmin}>
              <option value="">Select Role</option>
              {roles?.map(r => <option key={r.id} value={r.id}>{r.role_name.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Group</label>
            <select className="input" value={form.group_id} onChange={e => setForm({...form, group_id: e.target.value})}>
              <option value="">No Group</option>
              {groups?.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select className="input" value={form.level_id} onChange={e => setForm({...form, level_id: e.target.value})}>
              <option value="">No Level</option>
              {levels?.map(l => <option key={l.id} value={l.id}>{l.level_name}</option>)}
            </select>
          </div>
        </div>

        {isMasterAdmin && (
          <div style={{ marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} className="color-cyan" /> Custom Permissions
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['can_create_sessions', 'can_edit_sessions', 'can_delete_sessions', 'can_manage_users', 'can_view_analytics'].map(perm => (
                <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={form.custom_permissions.includes(perm)}
                    onChange={(e) => {
                      const newPerms = e.target.checked 
                        ? [...form.custom_permissions, perm] 
                        : form.custom_permissions.filter(p => p !== perm);
                      setForm({ ...form, custom_permissions: newPerms });
                    }}
                  />
                  {perm.replace(/_/g, ' ')}
                </label>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button className="btn btn-primary" style={{ flex: 1, height: 44 }} onClick={() => {
            if (!form.role_id) return toast.error('Please select a role');
            onSave(form);
          }} disabled={isLoading}>
            {isLoading ? 'Saving...' : isEdit ? 'Update Account' : 'Create Account'}
          </button>
          <button className="btn btn-ghost" style={{ height: 44 }} onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function UserHistoryModal({ user, onClose }) {
  const [tab, setTab] = useState('attendance')
  const { data: history, isLoading } = useQuery({
    queryKey: ['user-history', user.id],
    queryFn: () => adminApi.getHistory(user.id).then(r => r.data.data),
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-card" style={{ width: '100%', maxWidth: 750, padding: 32, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff' }}>
            {user.full_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{user.full_name}</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{user.academic_number} • {user.group?.group_name || 'No Group'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--glass-border)', paddingBottom: 12 }}>
          <button className={`btn btn-sm ${tab === 'attendance' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('attendance')} style={{ gap: 6 }}><Clock size={14} /> Attendance History</button>
          <button className={`btn btn-sm ${tab === 'grades' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('grades')} style={{ gap: 6 }}><Award size={14} /> Grading History</button>
        </div>

        {isLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}><p className="animate-pulse">Loading history data...</p></div>
        ) : (
          <div>
            {tab === 'attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history?.attendances?.length ? history.attendances.map((att, i) => (
                  <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{att.session?.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{new Date(att.session?.start_time).toLocaleDateString()} • {new Date(att.scanned_at).toLocaleTimeString()}</div>
                    </div>
                    <span className={`badge ${att.is_present ? 'badge-green' : 'badge-red'}`}>{att.is_present ? 'Present' : 'Absent'}</span>
                  </div>
                )) : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20 }}>No attendance records found</p>}
              </div>
            )}

            {tab === 'grades' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history?.submissions?.length ? history.submissions.map((sub, i) => (
                  <div key={i} style={{ padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{sub.task?.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Submitted: {new Date(sub.submitted_at).toLocaleDateString()}</div>
                      </div>
                      {sub.grade ? (
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-cyan)' }}>{sub.grade.total_grade} <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 400 }}>/ {sub.task?.total_marks}</span></div>
                          <div style={{ fontSize: 10, color: 'var(--color-lime)', fontWeight: 700, marginTop: 2 }}>GRADED</div>
                        </div>
                      ) : <span className="badge badge-amber">Pending Review</span>}
                    </div>
                    {sub.grade && (
                      <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: 12 }}>
                        <div style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>"{sub.grade.feedback || 'No feedback provided'}"</div>
                        <div style={{ marginTop: 8, fontSize: 10, color: 'var(--color-text-muted)' }}>Graded by: {sub.grade.mentor?.full_name || sub.grade.reviewer_name} • {new Date(sub.grade.graded_at).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                )) : <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 20 }}>No submissions found</p>}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function UserManagement() {
  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [importFile, setImportFile] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [viewingHistory, setViewingHistory] = useState(null)

  const isMasterAdmin = currentUser?.email === 'admin@it.training.system'
  const isSuperAdmin = currentUser?.role?.role_name === 'super_admin'

  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: () => adminApi.getRoles().then(r => r.data.data) })
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: () => adminApi.getGroups().then(r => r.data.data) })
  const { data: levels } = useQuery({ queryKey: ['levels'], queryFn: () => adminApi.getLevels().then(r => r.data.data) })

  const { data, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, page, limit: 20 }).then(r => r.data),
    keepPreviousData: true,
  })

  useEffect(() => {
    if (search && search.length > 2) {
      const timer = setTimeout(() => {
        adminApi.logActivity({
          action: 'action_search',
          description: `Searched for: "${search}" in User Management`
        }).catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const hasManagePerm = isMasterAdmin || currentUser?.custom_permissions?.includes('can_manage_users')
  const hasCreatePerm = isMasterAdmin || currentUser?.custom_permissions?.includes('can_create_sessions')
  const hasEditPerm = isMasterAdmin || currentUser?.custom_permissions?.includes('can_edit_sessions')
  const hasDeletePerm = isMasterAdmin || currentUser?.custom_permissions?.includes('can_delete_sessions')

  const createMutation = useMutation({
    mutationFn: adminApi.createUser,
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User created successfully'); setShowCreateModal(false) },
    onError: (e) => toast.error(e.response?.data?.message || 'Create failed')
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['users']); toast.success('User updated successfully'); setEditingUser(null) },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed')
  })

  const blockMutation = useMutation({
    mutationFn: ({ id, block }) => adminApi.blockUser(id, { block }),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User status updated')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('User deleted')
    },
  })

  const handleDownloadTemplate = async () => {
    try {
      const res = await adminApi.downloadTemplate()
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_template.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Download failed') }
  }

  const handleImport = async () => {
    if (!importFile) return toast.error('Select a file first')
    const formData = new FormData()
    formData.append('file', importFile)
    const toastId = toast.loading('Importing students...')
    try {
      const res = await adminApi.importStudents(formData)
      const { created, skipped, errors } = res.data.data
      
      toast.dismiss(toastId)
      
      if (created > 0) {
        toast.success(`Successfully imported ${created} students`)
      }
      
      if (skipped > 0) {
        toast.error(`${skipped} rows were skipped. Check console for details.`, { duration: 5000 })
      }

      if (errors.length > 0) {
        console.group('Import Errors Summary')
        errors.forEach(err => console.error(err))
        console.groupEnd()
      }

      queryClient.invalidateQueries(['users'])
      setImportFile(null)
    } catch (e) {
      toast.dismiss(toastId)
      toast.error(e.response?.data?.message || 'Import failed. Check file format.')
    }
  }

  const users = data?.data || []
  const meta = data?.meta || {}

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          <span className="gradient-text-cyan">User Management</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          Total Users: {meta.total || 0}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 40 }}
            placeholder="Search users..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select
          className="input"
          style={{ width: 160 }}
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="instructor">Instructor</option>
          <option value="mentor_manager">Mentor Manager</option>
          <option value="mentor">Mentor</option>
          <option value="student">Student</option>
          <option value="oc">HR</option>
        </select>

        <button className="btn btn-ghost btn-sm" onClick={handleDownloadTemplate}>
          <Download size={15} /> Template
        </button>

        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={15} />
          {importFile ? importFile.name.substring(0, 15) + '...' : 'Import Excel'}
          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => setImportFile(e.target.files[0])} />
        </label>

        {importFile && (
          <button className="btn btn-primary btn-sm" onClick={handleImport}>
            <Check size={15} /> Import Now
          </button>
        )}

        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
          <Plus size={15} /> Add User
        </button>
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Academic #</th>
                <th>Role</th>
                <th>Group</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div style={{ height: 16, borderRadius: 4, width: '80%' }} className="animate-shimmer" /></td>
                    ))}
                  </tr>
                ))
              ) : users.map((user, i) => (
                <tr key={user.id}>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{(page - 1) * 20 + i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, var(--color-cyan), var(--color-purple))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {user.full_name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{user.full_name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{user.email}</td>
                  <td><code style={{ fontSize: 12, color: 'var(--color-cyan)' }}>{user.academic_number || '—'}</code></td>
                  <td>
                    <span className={`badge ${ROLE_COLORS[user.role?.role_name] || 'badge-gray'}`}>
                      {user.role?.role_name === 'oc' ? 'HR' : user.role?.role_name?.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{user.group?.group_name || '—'}</td>
                  <td>
                    <span className={`badge ${user.is_blocked ? 'badge-red' : 'badge-green'}`}>
                      {user.is_blocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setEditingUser({ ...user, password: '' })}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 8px' }}
                        title="Edit User"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => blockMutation.mutate({ id: user.id, block: !user.is_blocked })}
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px' }}
                        title={user.is_blocked ? 'Unblock' : 'Block'}
                      >
                        {user.is_blocked ? <Shield size={14} style={{ color: 'var(--color-green)' }} /> : <UserX size={14} style={{ color: 'var(--color-amber)' }} />}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                      {user.role?.role_name === 'student' && (
                        <button
                          onClick={() => setViewingHistory(user)}
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '4px 8px', color: 'var(--color-purple)' }}
                          title="View Academic History"
                        >
                          <Clock size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {(meta.last_page > 1 || meta.totalPages > 1 || (meta.total > 20)) && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px 24px', 
            borderTop: '1px solid var(--glass-border)',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Showing <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{(page - 1) * 20 + 1}</span> to <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{Math.min(page * 20, meta.total || 0)}</span> of <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{meta.total || 0}</span> users
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button 
                className="btn btn-ghost btn-sm" 
                disabled={page === 1}
                onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div style={{ display: 'flex', gap: 4 }}>
                {(() => {
                  const lastPage = meta.last_page || meta.totalPages || Math.ceil((meta.total || 0) / 20);
                  const pages = [];
                  for (let i = 1; i <= lastPage; i++) {
                    if (i === 1 || i === lastPage || (i >= page - 2 && i <= page + 2)) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className={`btn btn-sm ${page === i ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ minWidth: 32, height: 32, padding: 0 }}
                        >
                          {i}
                        </button>
                      );
                    } else if (i === page - 3 || i === page + 3) {
                      pages.push(<span key={i} style={{ color: 'var(--color-text-muted)', padding: '0 4px' }}>...</span>);
                    }
                  }
                  return pages;
                })()}
              </div>

              <button 
                className="btn btn-ghost btn-sm" 
                disabled={page >= (meta.last_page || meta.totalPages || Math.ceil((meta.total || 0) / 20))}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        <ConfirmModal 
          isOpen={!!confirmDelete} 
          onClose={() => setConfirmDelete(null)} 
          onConfirm={() => deleteMutation.mutate(confirmDelete)}
          title="Delete User?"
          message="Are you sure you want to permanently delete this user account? This action cannot be undone."
        />

      </div>
      <AnimatePresence>
        {showCreateModal && <UserModal isMasterAdmin={isMasterAdmin} onClose={() => setShowCreateModal(false)} roles={roles} groups={groups} levels={levels} onSave={(data) => createMutation.mutate(data)} isLoading={createMutation.isPending} />}
        {editingUser && <UserModal isMasterAdmin={isMasterAdmin} user={editingUser} isEdit onClose={() => setEditingUser(null)} roles={roles} groups={groups} levels={levels} onSave={(data) => updateMutation.mutate({ id: editingUser.id, data })} isLoading={updateMutation.isPending} />}
        {viewingHistory && <UserHistoryModal user={viewingHistory} onClose={() => setViewingHistory(null)} />}
      </AnimatePresence>
    </div>
  )
}
