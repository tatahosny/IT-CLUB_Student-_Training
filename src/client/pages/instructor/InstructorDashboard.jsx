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
import GradingQueue from "../admin/GradingQueue";
import { ROLE_COLORS, ACTION_COLORS } from "../../utils/constants";

export default function InstructorDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { data: sessions } = useQuery({
    queryKey: ['instructor-sessions'],
    queryFn: () => sessionApi.getAll({ limit: 10 }).then(r => r.data.data),
  })
  const { data: tasks } = useQuery({
    queryKey: ['instructor-tasks'],
    queryFn: () => taskApi.getAll().then(r => r.data.data),
  })

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          Welcome back, <span className="gradient-text-cyan">{user?.full_name?.split(' ')[0]}</span> 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          Instructor Dashboard — Manage sessions, tasks and grading performance
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'My Sessions', value: sessions?.length || 0, icon: BookOpen, color: '#00d4ff' },
          { label: 'Active Tasks', value: tasks?.filter(t => t.is_active).length || 0, icon: ClipboardList, color: '#7c3aed' },
          { label: 'Total Submissions', value: tasks?.reduce((s, t) => s + (t._count?.submissions || 0), 0) || 0, icon: TrendingUp, color: '#10b981' },
          { label: 'Groups Assigned', value: [...new Set(sessions?.map(s => s.group_id))].filter(Boolean).length, icon: Users, color: '#f59e0b' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card glass-card-hover"
            style={{ padding: 24, background: `linear-gradient(135deg, var(--glass-bg), ${card.color}15)` }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}20`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <card.icon size={22} style={{ color: card.color }} />
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: card.color, marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}><CheckSquare size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-purple)' }} />Pending Grading</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/instructor/grading')}>View Queue</button>
          </div>
          <GradingQueue compact={true} />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}><Monitor size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-cyan)' }} />My Active Sessions</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/instructor/sessions')}>Manage All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sessions?.length ? sessions.filter(s => s.is_active).slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Room: {s.room_number} • {s._count?.attendances || 0} students present</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/instructor/sessions/${s.id}/attendance`)}>Control</button>
              </div>
            )) : <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>No active sessions found</div>}
          </div>
        </motion.div>
      </div>

      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}><Activity size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--color-cyan)' }} />Task Performance & Submissions</h3>
        {tasks?.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tasks.slice(0, 10).map(t => ({ name: t.title.substring(0,10), submissions: t._count?.submissions || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} />
              <YAxis stroke="var(--color-text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8 }} />
              <Bar dataKey="submissions" fill="url(#colorCyan)" radius={[4, 4, 0, 0]} />
              <defs><linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-cyan)" stopOpacity={0.8}/><stop offset="95%" stopColor="var(--color-purple)" stopOpacity={0.8}/></linearGradient></defs>
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No task data available</p>}
      </div>
    </div>
  )
}
