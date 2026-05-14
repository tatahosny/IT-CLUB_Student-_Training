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

export default function AttendanceControl() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const isSuperAdmin = currentUser?.role?.role_name === 'super_admin'
  const isInstructor = currentUser?.role?.role_name === 'instructor'

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: isSuperAdmin ? 'pointer' : 'default' }} onClick={() => isSuperAdmin && (setEditValue(customLabel || ''), setIsEditing(true))}>
                  <span style={{ color: customLabel ? 'var(--color-cyan)' : 'inherit', fontWeight: customLabel ? 600 : 400 }}>{displayRole}</span>
                  {isSuperAdmin && <Edit3 size={10} style={{ opacity: 0.5 }} />}
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

  const renderInstructorView = () => (
    <div style={{ textAlign: 'right', direction: 'rtl' }}>
      {/* Premium Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-cyan)' }}>
              <Monitor size={24} />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0 }}>
              <span className="gradient-text-cyan">{session?.title}</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 20, color: 'var(--color-text-muted)', fontSize: 15 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={16} /> {session?.room_number || 'قاعة غير محددة'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={16} /> {session?.start_time ? new Date(session.start_time).toLocaleDateString('ar-EG') : ''}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={16} /> {session?.start_time ? new Date(session.start_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ gap: 8, height: 44, padding: '0 20px' }}>
          <ArrowLeft size={20} /> رجوع للمحاضرات
        </button>
      </div>

      {/* Stats & Session Control Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* Present Stats */}
        <div className="glass-card" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05 }}>
            <Users size={120} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-green)', marginBottom: 12, letterSpacing: 1 }}>الطلاب الحاضرين حالياً</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ fontSize: 56, fontWeight: 950, color: 'var(--color-green)', lineHeight: 1 }}>{stats.present}</div>
            <div style={{ fontSize: 18, color: 'var(--color-text-muted)' }}>/ {stats.total}</div>
          </div>
          <div style={{ marginTop: 16, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }}>
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${(stats.present / (stats.total || 1)) * 100}%` }}
              style={{ height: '100%', background: 'var(--color-green)', borderRadius: 3, boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }} 
            />
          </div>
        </div>

        {/* Absent Stats */}
        <div className="glass-card" style={{ padding: 32, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05 }}>
            <UserX size={120} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-red)', marginBottom: 12, letterSpacing: 1 }}>الطلاب الغائبين</div>
          <div style={{ fontSize: 56, fontWeight: 950, color: 'var(--color-red)', lineHeight: 1 }}>{stats.absent}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>يمكنك تسجيل حضور يدوي من الأسفل</div>
        </div>

        {/* Session Action Card */}
        <div className="glass-card" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: session?.is_active ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), transparent)' : 'transparent' }}>
          {session?.is_active ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="pulse-green" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green)' }} />
                  <span style={{ fontWeight: 700, color: 'var(--color-green)' }}>التسجيل مفتوح</span>
                </div>
                <button className="btn btn-primary" onClick={generateWorkshopQR} disabled={qrLoading} style={{ height: 44, padding: '0 24px', gap: 8 }}>
                  <QrCode size={18} /> عرض الـ QR للطلاب
                </button>
              </div>
              <button className="btn btn-danger btn-outline" style={{ width: '100%', height: 44 }} onClick={() => updateSessionInfoMutation.mutate({ is_active: false })}>
                إغلاق باب التسجيل الآن
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>بدء تسجيل حضور الطلاب لهذه الجلسة</div>
              <button className="btn btn-primary" style={{ width: '100%', height: 50, fontSize: 16, fontWeight: 700 }} onClick={() => updateSessionInfoMutation.mutate({ is_active: true })}>
                تفعيل تسجيل الحضور
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Attendance List */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>كشف الحضور والغياب</h3>
            <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10 }}>
              {['all', 'present', 'absent'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setAttendanceFilter(f)}
                  style={{ 
                    padding: '6px 16px', fontSize: 12, fontWeight: 700, borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: attendanceFilter === f ? 'var(--color-cyan)' : 'transparent',
                    color: attendanceFilter === f ? '#000' : 'var(--color-text-muted)',
                    transition: '0.3s'
                  }}
                >
                  {f === 'all' ? 'الكل' : f === 'present' ? 'حاضر' : 'غائب'}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12, flex: 1, justifyContent: 'flex-end', minWidth: 300 }}>
            <div style={{ position: 'relative', maxWidth: 300, width: '100%' }}>
              <input 
                className="input" 
                placeholder="بحث عن طالب..." 
                style={{ height: 40, paddingRight: 40, fontSize: 14, background: 'rgba(255,255,255,0.03)' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Search size={18} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            </div>
            {isInstructorAssigned && (
              <button className="btn btn-ghost" style={{ height: 40, padding: '0 16px', gap: 8 }} onClick={() => exportToExcel('all')}>
                <Download size={18} /> تحميل الكشف
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ textAlign: 'right', padding: '16px 32px' }}>الطالب</th>
                <th style={{ textAlign: 'right', padding: '16px 32px' }}>الرقم الأكاديمي</th>
                <th style={{ textAlign: 'right', padding: '16px 32px' }}>حالة الحضور</th>
                <th style={{ textAlign: 'right', padding: '16px 32px' }}>وقت التسجيل</th>
                {isInstructorAssigned && <th style={{ textAlign: 'center', padding: '16px 32px' }}>الإجراء</th>}
              </tr>
            </thead>
            <tbody style={{ fontSize: 15 }}>
              {paginatedAttendance.map(record => (
                <tr key={record.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '16px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)' }}>
                        {record.student?.full_name?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{record.student?.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{record.student?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 32px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>{record.student?.academic_number}</td>
                  <td style={{ padding: '16px 32px' }}>
                    <span className={`badge ${record.is_present ? 'badge-green' : 'badge-red'}`} style={{ height: 28, padding: '0 12px', fontSize: 12 }}>
                      {record.is_present ? 'حاضر' : 'غائب'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 32px', color: 'var(--color-text-muted)' }}>
                    {record.scanned_at ? new Date(record.scanned_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  {isInstructorAssigned && (
                    <td style={{ padding: '16px 32px', textAlign: 'center' }}>
                      <button 
                        onClick={() => markMutation.mutate({ sessionId: id, studentId: record.student_id, attendanceType: record.attendance_type || 'first', isPresent: !record.is_present })}
                        className={`btn btn-sm ${record.is_present ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ height: 32, padding: '0 16px', fontSize: 11 }}
                      >
                        {record.is_present ? 'إلغاء التحضير' : 'تحضير يدوي'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedAttendance.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    <Search size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
                    <div>لا يوجد طلاب يطابقون معايير البحث حالياً</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: 24, display: 'flex', justifyContent: 'center', gap: 8 }}>
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setCurrentPage(i + 1)}
                style={{ 
                  width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: currentPage === i + 1 ? 'var(--color-cyan)' : 'rgba(255,255,255,0.05)',
                  color: currentPage === i + 1 ? '#000' : '#fff',
                  fontWeight: 700
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {showQR && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={() => setShowQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-card" style={{ width: '100%', maxWidth: 500, padding: 48, textAlign: 'center', position: 'relative' }}
              onClick={e => e.stopPropagation()}
            >
              <button style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }} onClick={() => setShowQR(false)}>
                <X size={24} />
              </button>
              <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}><span className="gradient-text-cyan">سجل حضورك الآن</span></h2>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>قم بمسح رمز الـ QR من خلال تطبيق الطالب</p>
              
              <div style={{ background: '#fff', padding: 20, borderRadius: 32, display: 'inline-block', marginBottom: 32, boxShadow: '0 0 60px rgba(0,212,255,0.3)' }}>
                <img src={qrImage} alt="Session QR" style={{ width: 340, height: 340, display: 'block' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 24, color: timeLeft < 30 ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 950, fontFamily: 'monospace' }}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: -6 }}>الوقت المتبقي لصلاحية الكود</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return renderInstructorView();
}
