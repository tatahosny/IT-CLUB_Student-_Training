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
import { ROLE_COLORS, ACTION_COLORS } from "../../utils/constants";

export default function AttendanceHistory() {
  const { data, isLoading } = useQuery({ queryKey: ['attendance-history'], queryFn: () => attendanceApi.getHistory().then(r => r.data.data) })
  const presentCount = data?.filter(a => a.is_present).length || 0; const total = data?.length || 0; const rate = total ? Math.round((presentCount / total) * 100) : 0
  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">Attendance History</span></h1><p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>{presentCount} / {total} sessions attended ({rate}%)</p></div>
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontSize: 14, fontWeight: 600 }}>Overall Attendance Rate</span><span style={{ fontSize: 22, fontWeight: 800 }} className="gradient-text-brand">{rate}%</span></div><div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}><motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ duration: 1 }} style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${rate >= 75 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444'}, #00d4ff)` }} /></div><div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>{rate >= 75 ? '✓ Good attendance' : rate >= 50 ? '⚠️ Attendance needs improvement' : '✗ Critical — Low attendance'}</div></div>
      <div className="glass-card"><div className="table-wrapper"><table><thead><tr><th>#</th><th>Session</th><th>Date</th><th>Type</th><th>Scanned At</th><th>Status</th></tr></thead><tbody>{isLoading ? [...Array(8)].map((_, i) => (<tr key={i}>{[...Array(6)].map((_, j) => <td key={j}><div style={{ height: 14, borderRadius: 4 }} className="animate-shimmer" /></td>)}</tr>)) : data?.map((a, i) => (<tr key={a.id}><td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td><td style={{ fontWeight: 500 }}>{a.session?.title}</td><td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{new Date(a.session?.start_time).toLocaleDateString()}</td><td><span className={`badge ${a.attendance_type === 'first' ? 'badge-cyan' : a.attendance_type === 'second' ? 'badge-purple' : 'badge-amber'}`}>{a.attendance_type}</span></td><td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{a.scanned_at ? new Date(a.scanned_at).toLocaleTimeString() : '—'}</td><td>{a.is_present ? <CheckCircle size={16} style={{ color: 'var(--color-green)' }} /> : <XCircle size={16} style={{ color: 'var(--color-red)' }} />}</td></tr>))}</tbody></table></div></div>
    </div>
  )
}
