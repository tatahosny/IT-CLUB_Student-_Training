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
  XCircle, ChevronUp, ChevronDown, Wifi, Check, Activity, Edit, FolderOpen
} from "lucide-react";
import QRCode from "qrcode";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useAuthStore } from "@/store/authStore";
import { authApi, adminApi, attendanceApi, sessionApi, taskApi, gradingApi } from "@/api/adminApi";
import Logo from "@/components/common/Logo";
import TaskCard from "@/components/common/TaskCard";
import { ROLE_COLORS, ACTION_COLORS } from "@/utils/constants";

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [taskFiles, setTaskFiles] = useState({})
  const [submittingTask, setSubmittingTask] = useState(null)

  const { data: allSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['student-sessions'],
    queryFn: () => sessionApi.getAll().then(r => r.data.data),
  })

  const sessions = useMemo(() => allSessions?.filter(s => s.is_active) || [], [allSessions])

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
        {/* Record Attendance CTA */}
        <section>
          <div className="glass-card" style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, background: 'linear-gradient(135deg, rgba(18,214,255,0.1), rgba(0,0,0,0.2))', border: '1px solid rgba(18,214,255,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(18,214,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-cyan)', boxShadow: '0 0 20px rgba(18,214,255,0.1)' }}>
                <QrCode size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Session Attendance</h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Ready for your session? Generate your attendance QR code now.</p>
              </div>
            </div>
            <Link to="/student/record-attendance" className="btn btn-primary" style={{ height: 48, padding: '0 32px', fontSize: 16 }}>
              <Zap size={18} /> Record Attendance
            </Link>
          </div>
        </section>

        {/* Sessions Schedule Section */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} className="color-cyan" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800 }}>Sessions Schedule</h2>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Instructors</th>
                    <th>Mentors</th>
                    <th>Date & Time</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan="5"><div style={{ height: 20, borderRadius: 4 }} className="animate-shimmer" /></td>
                      </tr>
                    ))
                  ) : allSessions?.length > 0 ? allSessions.map(session => {
                    const staff = session.instructors || [];
                    const getRole = (u) => {
                      const label = session.staff_labels?.[u.id];
                      if (label) return label;
                      return u.role?.role_name || '';
                    };
                    
                    const instructorRoles = ['instructor', 'speaker', 'lecturer'];
                    const mentorsRoles = ['mentor', 'mentor_manager', 'oc'];

                    const instructorsList = staff.filter(u => {
                      const r = getRole(u).toLowerCase();
                      return instructorRoles.some(role => r.includes(role));
                    });
                    
                    const mentorsList = staff.filter(u => {
                      const r = getRole(u).toLowerCase();
                      return mentorsRoles.some(role => r.includes(role)) && !instructorRoles.some(role => r.includes(role));
                    });

                    return (
                      <tr key={session.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{session.title}</div>
                          <span className={`badge ${session.is_active ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 9, padding: '1px 6px', marginTop: 4 }}>
                            {session.is_active ? 'LIVE' : 'Scheduled'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {instructorsList.length > 0 ? instructorsList.map(u => (
                              <span key={u.id} className="badge badge-purple" style={{ fontSize: 10 }}>{u.full_name.split(' ')[0]}</span>
                            )) : <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>—</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {mentorsList.length > 0 ? mentorsList.map(u => (
                              <span key={u.id} className="badge badge-cyan" style={{ fontSize: 10, background: 'rgba(0,212,255,0.05)', color: 'var(--color-cyan)', border: '1px solid rgba(0,212,255,0.1)' }}>{u.full_name.split(' ')[0]}</span>
                            )) : <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>—</span>}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{new Date(session.start_time).toLocaleDateString()}</div>
                          <div style={{ color: 'var(--color-cyan)', fontWeight: 700, marginTop: 2 }}>
                            {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                            <MapPin size={13} className="color-cyan" />
                            <span style={{ fontWeight: 500 }}>{session.room_number || 'Room TBD'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        <Calendar size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
                        <p>No upcoming sessions found for your group.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
