import React, { useState, useEffect, useRef, useMemo } from "react";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useNavigate, useParams, useSearchParams, useLocation, Navigate, Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import QRCode from "qrcode";
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

export default function SessionAttendanceDetail() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const isSuperAdmin = currentUser?.role?.role_name === 'super_admin'

  const [searchParams] = useSearchParams()
  const { data: session, refetch: refetchSession } = useQuery({ queryKey: ['session', id], queryFn: () => sessionApi.getById(id).then(r => r.data.data) })
  
  const [showQR, setShowQR] = useState(false)
  const [qrToken, setQrToken] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrDuration, setQrDuration] = useState(5) // Default 5 mins

  const generateWorkshopQR = async () => {
    setQrLoading(true); setQrToken(null); setQrImage('')
    try {
      const res = await attendanceApi.getWorkshopQR(id, qrDuration); const token = res.data.data; 
      setQrToken(token); setTimeLeft(token.timeLeftSeconds)
      const dataUrl = await QRCode.toDataURL(`IT-QR:${token.qr_code}`, { width: 400, margin: 4, color: { dark: '#00d4ff', light: '#060b18' } })
      setQrImage(dataUrl); setShowQR(true)
    } catch (e) { 
      console.error('QR Generation Error:', e)
      toast.error(e.response?.data?.message || 'Failed to generate QR') 
    } finally { setQrLoading(false) }
  }

  const [timeLeft, setTimeLeft] = useState(0)
  useEffect(() => {
    if (!showQR || !qrToken) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1)
        if (next === 0) {
          clearInterval(interval)
          toast.error('QR Code Expired!')
        }
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showQR, qrToken])
  const { data: attendance, refetch } = useQuery({ queryKey: ['attendance', id], queryFn: () => attendanceApi.getSessionAttendance(id).then(r => r.data.data), refetchInterval: 10000 })
  const [attendanceFilter, setAttendanceFilter] = useState('all') // all | present | absent
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const filteredAttendance = useMemo(() => {
    let result = attendance || [];
    
    // Filter by status
    if (attendanceFilter === 'present') result = result.filter(record => record.is_present);
    if (attendanceFilter === 'absent') result = result.filter(record => !record.is_present);
    
    // Search
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(record => 
        record.student?.full_name?.toLowerCase().includes(lowSearch) || 
        record.student?.academic_number?.toLowerCase().includes(lowSearch)
      );
    }
    
    return result;
  }, [attendance, attendanceFilter, searchTerm]);

  const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
  const paginatedAttendance = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAttendance.slice(start, start + itemsPerPage);
  }, [filteredAttendance, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on filter/search change
  }, [attendanceFilter, searchTerm]);

  useEffect(() => {
    if (searchParams.get('edit') === 'true' && session) {
      handleEditInfo()
    }
  }, [searchParams, session])

  const [addStaffMode, setAddStaffMode] = useState(false)
  const [staffSearch, setStaffSearch] = useState('')
  const [isEditingInfo, setIsEditingInfo] = useState(false)
  const [infoForm, setInfoForm] = useState({ title: '', room_number: '', start_time: '', end_time: '' })
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['userSearch', staffSearch],
    queryFn: () => adminApi.getUsers({ search: staffSearch, limit: 5 }).then(r => r.data.data),
    enabled: addStaffMode && staffSearch.length > 2
  })

  const stats = {
    present: attendance?.filter(a => a.is_present).length || 0,
    absent: attendance?.filter(a => !a.is_present).length || 0,
    total: attendance?.length || 0
  }
  const isMentor = currentUser?.role?.role_name.includes('mentor');
  const isMasterAdmin = currentUser?.email === 'admin@it.training.system';
  const hasEditPerm = isMasterAdmin || currentUser?.custom_permissions?.includes('can_edit_sessions');
  const isInstructorAssigned = session?.instructors?.some(i => i.id === currentUser?.id);
  
  const canEditSession = !isMentor && (isMasterAdmin || isInstructorAssigned || hasEditPerm);
  const canGenerateQR = isMentor || canEditSession;

  const markMutation = useMutation({
    mutationFn: (data) => attendanceApi.markManual(data),
    onSuccess: () => {
      refetch()
      toast.success('Attendance updated')
    }
  })

  const instructors = session?.instructors || [];
  
  const addStaffMutation = useMutation({
    mutationFn: (userId) => {
      const currentIds = instructors.map(i => i.id)
      if (currentIds.includes(userId)) throw new Error('User already added')
      return sessionApi.update(id, { instructor_ids: [...currentIds, userId] })
    },
    onSuccess: () => {
      refetchSession()
      toast.success('Staff added successfully')
      setAddStaffMode(false)
      setStaffSearch('')
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add staff')
    }
  })

  const removeStaffMutation = useMutation({
    mutationFn: (userId) => {
      const newIds = instructors.filter(i => i.id !== userId).map(i => i.id);
      const newLabels = { ...session?.staff_labels };
      delete newLabels[userId];
      return sessionApi.update(id, { instructor_ids: newIds, staff_labels: newLabels })
    },
    onSuccess: () => {
      refetchSession()
      toast.success('Staff removed successfully')
    }
  })

  const updateSessionInfoMutation = useMutation({
    mutationFn: (data) => sessionApi.update(id, data),
    onSuccess: () => {
      refetchSession()
      setIsEditingInfo(false)
      toast.success('Session updated')
    }
  })

  const handleEditInfo = () => {
    setInfoForm({
      title: session.title,
      room_number: session.room_number || '',
      start_time: session.start_time ? new Date(session.start_time).toISOString().slice(0, 16) : '',
      end_time: session.end_time ? new Date(session.end_time).toISOString().slice(0, 16) : ''
    })
    setIsEditingInfo(true)
  }

  const exportToExcel = async (type) => {
    if (!attendance || attendance.length === 0) return toast.error('No data to export');
    try {
      const XLSX = await import('xlsx');
      let dataToExport = [];
      if (type === 'present') dataToExport = attendance.filter(a => a.is_present);
      else if (type === 'absent') dataToExport = attendance.filter(a => !a.is_present);
      else dataToExport = attendance;

      if (dataToExport.length === 0) return toast.error(`No ${type} students to export`);

      const formattedData = dataToExport.map(record => ({
        'Student Name': record.student?.full_name,
        'Academic Number': record.student?.academic_number,
        'Status': record.is_present ? 'Present' : 'Absent',
        'Scanned At': record.scanned_at ? new Date(record.scanned_at).toLocaleString() : 'N/A',
        'Method': record.scanner_role || (record.is_present ? 'QR Scan' : 'Manual')
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, `Session_${id}_${type}_Attendance.xlsx`);
      toast.success('Export successful');
    } catch (e) {
      toast.error('Failed to export Excel');
    }
  };

  const copyPhone = (phone) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    toast.success('Phone copied!');
  }

  const groupStaff = session?.group?.users || [];
  const mentors = groupStaff.filter(u => u.role.role_name.includes('mentor'));
  const ocs = groupStaff.filter(u => u.role.role_name === 'oc');

  const updateLabelMutation = useMutation({
    mutationFn: ({ userId, newLabel }) => {
      const currentLabels = session?.staff_labels || {};
      return sessionApi.update(id, { staff_labels: { ...currentLabels, [userId]: newLabel } })
    },
    onSuccess: () => {
      refetchSession()
      toast.success('Role label updated')
    }
  })

  const AVAILABLE_ROLES = [
    { value: '', label: '-- Default Role --' },
    { value: 'Instructor', label: 'Instructor' },
    { value: 'Mentor', label: 'Mentor' },
    { value: 'Mentor Manager', label: 'Mentor Manager' },
    { value: 'OC', label: 'OC (Organizing Committee)' },
    { value: 'Guest Speaker', label: 'Guest Speaker' }
  ];

  const StaffItem = ({ u, color, defaultRoleLabel }) => {
    const [isEditing, setIsEditing] = useState(false);
    const customLabel = session?.staff_labels?.[u.id];
    const displayRole = customLabel || defaultRoleLabel;
    const [editValue, setEditValue] = useState(customLabel || '');

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `var(--color-${color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold', color: color === 'cyan' ? '#000' : '#fff' }}>{u.full_name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{u.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6, minHeight: 18 }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <select 
                    autoFocus 
                    className="input" 
                    style={{ height: 24, fontSize: 11, padding: '2px 4px', width: 130, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-primary)' }} 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                  >
                    {AVAILABLE_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <button onClick={() => { updateLabelMutation.mutate({ userId: u.id, newLabel: editValue }); setIsEditing(false) }} className="text-green-400"><Check size={14} /></button>
                  <button onClick={() => setIsEditing(false)} className="text-red-400"><X size={14} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: canEditSession ? 'pointer' : 'default' }} onClick={() => canEditSession && (setEditValue(customLabel || ''), setIsEditing(true))}>
                  <span style={{ color: customLabel ? 'var(--color-cyan)' : 'inherit', fontWeight: customLabel ? 600 : 400 }}>{displayRole}</span>
                  {canEditSession && <Edit3 size={10} style={{ opacity: 0.5 }} />}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {u.phone && (
            <button onClick={() => copyPhone(u.phone)} className="btn btn-sm" style={{ padding: '4px 8px', fontSize: 11, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: 'none' }}>
              {u.phone}
            </button>
          )}
          {canEditSession && (
            <button 
              onClick={() => setConfirmDelete(u.id)} 
              className="text-red-400 hover-text-red-300" 
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">{session?.title || 'Session Details'}</span></h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Detailed breakdown of attendance and staff for this session.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => window.history.back()}>Back</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 24 }}>
        {/* Card 1: Session Details & Actions */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} className="text-cyan-400" /> Session Details
            </h3>
            {canEditSession && !isEditingInfo && (
              <button onClick={handleEditInfo} className="btn btn-sm btn-ghost" style={{ padding: '4px 8px' }}>
                <Edit size={14} /> Edit
              </button>
            )}
          </div>

          {isEditingInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Title</label>
                <input className="input" style={{ height: 32, fontSize: 13 }} value={infoForm.title} onChange={e => setInfoForm({...infoForm, title: e.target.value})} />
              </div>
              <div>
                <label className="label" style={{ fontSize: 11 }}>Room</label>
                <input className="input" style={{ height: 32, fontSize: 13 }} value={infoForm.room_number} onChange={e => setInfoForm({...infoForm, room_number: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: 11 }}>Start</label>
                  <input className="input" type="datetime-local" style={{ height: 32, fontSize: 11 }} value={infoForm.start_time} onChange={e => setInfoForm({...infoForm, start_time: e.target.value})} />
                </div>
                <div>
                  <label className="label" style={{ fontSize: 11 }}>End</label>
                  <input className="input" type="datetime-local" style={{ height: 32, fontSize: 11 }} value={infoForm.end_time} onChange={e => setInfoForm({...infoForm, end_time: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => updateSessionInfoMutation.mutate(infoForm)}>Save</button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => setIsEditingInfo(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Group:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{session?.group?.group_name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{session?.start_time ? new Date(session.start_time).toLocaleDateString() : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Time:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {session?.start_time ? new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''} - {session?.end_time ? new Date(session.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Room:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{session?.room_number || '—'}</span>
              </div>
            </div>
          )}

          {canEditSession && (
            <div style={{ padding: 12, borderRadius: 12, background: session?.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.03)', border: session?.is_active ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid var(--glass-border)', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: session?.is_active ? 'var(--color-green)' : 'var(--color-text-primary)' }}>
                  {session?.is_active ? 'Session is Active' : 'Session is Inactive'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {session?.is_active ? 'Students can scan QR to register' : 'QR codes disabled'}
                </div>
              </div>
              <button 
                className={`btn btn-sm ${session?.is_active ? 'btn-danger' : 'btn-primary'}`}
                style={{ height: 32, fontSize: 11, padding: '0 12px' }}
                onClick={() => updateSessionInfoMutation.mutate({ is_active: !session?.is_active })}
                disabled={updateSessionInfoMutation.isPending}
              >
                {session?.is_active ? 'Stop Session' : 'Start Session'}
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => exportToExcel('present')} className="btn btn-primary" style={{ flex: 1, fontSize: 13, height: 38, gap: 6 }}>
              <Download size={14} /> Export Present
            </button>
            <button onClick={() => exportToExcel('absent')} className="btn btn-outline" style={{ flex: 1, fontSize: 13, height: 38, gap: 6, borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--color-red)' }}>
              <Download size={14} /> Export Absent
            </button>
          </div>
        </div>

        {/* Card 2: Staff List */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={18} className="text-purple-400" /> Assigned Staff
            </h3>
            {hasEditPerm && (
              <button onClick={() => setAddStaffMode(!addStaffMode)} className="btn btn-sm btn-outline" style={{ fontSize: 11, padding: '4px 8px' }}>
                {addStaffMode ? 'Cancel' : '+ Add Staff'}
              </button>
            )}
          </div>
          
          {addStaffMode && (
            <div style={{ marginBottom: 16, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
              <input 
                type="text" 
                placeholder="Search by name, phone, or ID..." 
                className="input" 
                style={{ fontSize: 12, padding: '6px 12px', height: 32, marginBottom: 8 }}
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
              />
              {searching ? <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Searching...</div> : 
               searchResults?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {searchResults.map(u => (
                    <button key={u.id} onClick={() => addStaffMutation.mutate(u.id)} className="btn btn-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-tertiary)', padding: '6px 10px', width: '100%' }} disabled={addStaffMutation.isPending}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{u.full_name} <span style={{ color: 'var(--color-cyan)', fontWeight: 400 }}>({u.role?.role_name})</span></span>
                        {u.phone && <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>📞 {u.phone}</span>}
                      </div>
                      <Plus size={14} />
                    </button>
                  ))}
                </div>
              ) : staffSearch.length > 2 ? <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>No results found</div> : null}
            </div>
          )}

          <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 5, display: 'flex', flexDirection: 'column' }}>
            {instructors.map(u => <StaffItem key={`inst_${u.id}`} u={u} color="purple" defaultRoleLabel={u.role?.role_name || 'Instructor'} />)}
            {mentors.map(u => <StaffItem key={`ment_${u.id}`} u={u} color="cyan" defaultRoleLabel={u.role?.role_name || 'Mentor'} />)}
            {ocs.map(u => <StaffItem key={`oc_${u.id}`} u={u} color="gray" defaultRoleLabel="OC" />)}
            
            {instructors.length === 0 && mentors.length === 0 && ocs.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No staff assigned</div>
            )}
          </div>
        </div>

        {/* Card 3: Statistics Summary */}
        <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} className="text-green-400" /> Attendance Stats
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-green)' }}>{stats.present}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>Present</div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-red)' }}>{stats.absent}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: 4 }}>Absent</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 16px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Registered Students</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.total}</span>
          </div>
        </div>
        
        {/* Card 4: Session QR */}
        {canGenerateQR && (
          <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(124, 58, 237, 0.05))', border: '1px solid rgba(0,212,255,0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={18} className="text-cyan-400" /> Session QR
            </h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-cyan)' }}>
                <QrCode size={32} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Self-Checkin</div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Set duration and show QR to students.</p>
              </div>
              
              {session?.is_active ? (
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select 
                    className="input" 
                    value={qrDuration} 
                    onChange={e => setQrDuration(parseInt(e.target.value))}
                    style={{ fontSize: 12, height: 36, padding: '0 8px' }}
                    disabled={!canGenerateQR}
                  >
                    <option value={1}>1 Minute</option>
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                  </select>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={generateWorkshopQR} disabled={qrLoading || !canGenerateQR}>
                    {qrLoading ? 'Generating...' : 'Show Session QR'}
                  </button>
                </div>
              ) : (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-red)', fontSize: 12, fontWeight: 600, width: '100%' }}>
                  Session is Inactive
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 300 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>كشف الحضور</h3>
            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
              <input 
                type="text" 
                placeholder="بحث بالاسم أو الرقم الأكاديمي..." 
                className="input" 
                style={{ height: 38, paddingLeft: 36, fontSize: 13, direction: 'rtl' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
            {[
              { id: 'all', label: 'الكل' },
              { id: 'present', label: 'حاضر' },
              { id: 'absent', label: 'غائب' }
            ].map(f => (
              <button 
                key={f.id} 
                onClick={() => setAttendanceFilter(f.id)}
                style={{ 
                  padding: '6px 16px', 
                  fontSize: 12, 
                  fontWeight: 700, 
                  borderRadius: 6, 
                  border: 'none', 
                  cursor: 'pointer',
                  background: attendanceFilter === f.id ? 'var(--color-cyan)' : 'transparent',
                  color: attendanceFilter === f.id ? '#000' : 'var(--color-text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrapper">
          <table style={{ direction: 'rtl', textAlign: 'right' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'right' }}>الطالب</th>
                <th style={{ textAlign: 'right' }}>الرقم الأكاديمي</th>
                <th style={{ textAlign: 'right' }}>الحالة</th>
                <th style={{ textAlign: 'right' }}>الوقت</th>
                <th style={{ textAlign: 'right' }}>الطريقة</th>
                <th style={{ textAlign: 'right' }}>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAttendance?.map((record) => (
                <tr key={record.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, border: '1px solid var(--glass-border)' }}>
                      {record.student?.avatar ? <img src={record.student.avatar} style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} /> : record.student?.full_name?.[0]}
                    </div>
                    <span style={{ fontWeight: 600 }}>{record.student?.full_name}</span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>{record.student?.academic_number}</td>
                  <td>
                    <span className={`badge ${record.is_present ? 'badge-green' : 'badge-red'}`} style={{ minWidth: 70, justifyContent: 'center' }}>
                      {record.is_present ? 'حاضر' : 'غائب'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {record.scanned_at ? new Date(record.scanned_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {record.scanner_role === 'student' ? 'المسح الشخصي' : record.scanner_role === 'FRAUD_ATTEMPT' ? 'محاولة غش' : record.scanner_role || (record.is_present ? 'رمز QR' : '—')}
                  </td>
                  <td>
                    {!isMentor && isSuperAdmin && (
                      <button 
                        onClick={() => markMutation.mutate({ sessionId: id, studentId: record.student_id, attendanceType: record.attendance_type || 'first', isPresent: !record.is_present })}
                        className={`btn btn-sm ${record.is_present ? 'btn-danger' : 'btn-primary'}`}
                        style={{ padding: '6px 12px', fontSize: 11, minWidth: 100 }}
                      >
                        {record.is_present ? 'تسجيل غياب' : 'تسجيل حضور'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedAttendance.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Search size={32} opacity={0.2} />
                      <span>لا يوجد طلاب يطابقون البحث</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="btn btn-sm btn-ghost"
              style={{ width: 32, height: 32, padding: 0 }}
            >
              <ChevronRight size={18} />
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentPage(i + 1)}
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    border: 'none', 
                    cursor: 'pointer',
                    background: currentPage === i + 1 ? 'var(--color-cyan)' : 'rgba(255,255,255,0.05)',
                    color: currentPage === i + 1 ? '#000' : 'var(--color-text-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    transition: 'all 0.2s'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="btn btn-sm btn-ghost"
              style={{ width: 32, height: 32, padding: 0 }}
            >
              <ChevronLeft size={18} />
            </button>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showQR && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowQR(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 40, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}><span className="gradient-text-cyan">Workshop QR Code</span></h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Students scan this code to register attendance</p>
              
              <div style={{ background: '#fff', padding: 20, borderRadius: 24, display: 'inline-block', marginBottom: 24, boxShadow: '0 0 50px rgba(0,212,255,0.2)' }}>
                <img src={qrImage} alt="Workshop QR" style={{ width: 320, height: 320, display: 'block' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 18, color: timeLeft < 30 ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 800, fontFamily: 'monospace' }}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8 }}>Time Remaining</div>
                <button className="btn btn-primary" style={{ height: 48, marginTop: 12 }} onClick={() => setShowQR(false)}>Close Fullscreen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={!!confirmDelete} 
        onClose={() => setConfirmDelete(null)} 
        onConfirm={() => removeStaffMutation.mutate(confirmDelete)}
        title="Remove Staff?"
        message="Are you sure you want to remove this staff member from the session?"
      />
    </div>
  )
}
