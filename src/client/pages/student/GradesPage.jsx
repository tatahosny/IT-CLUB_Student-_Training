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

export default function GradesPage() {
  const { data: submissions, isLoading } = useQuery({ queryKey: ['my-submissions'], queryFn: () => taskApi.getMySubmissions().then(r => r.data.data) })
  const graded = submissions?.filter(s => s.status === 'reviewed' && s.grade) || []
  const avg = graded.length ? Math.round(graded.reduce((s, sub) => s + sub.grade.total_grade, 0) / graded.length) : null
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">My Grades</span></h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>{graded.length} graded tasks • Average: {avg !== null ? `${avg} pts` : '—'}</p>
      </div>
      {isLoading ? <div style={{ height: 200 }} className="animate-shimmer glass-card" /> : graded.length === 0 ? (<div className="glass-card" style={{ padding: 48, textAlign: 'center' }}><Star size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} /><p style={{ color: 'var(--color-text-muted)' }}>No grades yet</p></div>) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {graded.map((sub, i) => (
            <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="glass-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div><h3 style={{ fontSize: 16, fontWeight: 700 }}>{sub.task?.title}</h3><p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Graded by: {sub.grade.mentor?.full_name || sub.grade.reviewer_name} • {new Date(sub.grade.graded_at).toLocaleDateString()}</p></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontSize: 28, fontWeight: 800 }} className="gradient-text-brand">{sub.grade.total_grade}</div><div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>/ {sub.task?.total_marks} pts</div></div>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }}><motion.div initial={{ width: 0 }} animate={{ width: `${(sub.grade.total_grade / sub.task?.total_marks) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.06 }} style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #00d4ff, #7c3aed)' }} /></div>
              {sub.grade.details?.length > 0 && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8, marginBottom: 12 }}>{sub.grade.details.map(d => (<div key={d.id} style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', fontSize: 12 }}><div style={{ color: 'var(--color-text-secondary)', marginBottom: 2 }}>{d.criteria?.title}</div><div style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>{d.student_grade} / {d.criteria?.max_grade}</div>{d.notes && <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 2 }}>{d.notes}</div>}</div>))}</div>)}
              {sub.grade.feedback && <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', fontSize: 13, color: 'var(--color-text-secondary)' }}>💬 {sub.grade.feedback}</div>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
