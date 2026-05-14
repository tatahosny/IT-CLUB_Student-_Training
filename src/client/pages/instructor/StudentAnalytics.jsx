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

export default function StudentAnalytics() {
  const { data: submissions } = useQuery({ queryKey: ['my-submissions'], queryFn: () => taskApi.getMySubmissions().then(r => r.data.data) })
  const { data: attendance } = useQuery({ queryKey: ['my-attendance'], queryFn: () => attendanceApi.getHistory().then(r => r.data.data) })
  const graded = submissions?.filter(s => s.status === 'reviewed') || []
  const attendanceData = attendance?.slice(-7).map(a => ({ name: new Date(a.session?.start_time).toLocaleDateString(), status: a.is_present ? 1 : 0 })) || []
  const gradeData = graded.slice(-5).map(s => ({ name: s.task?.title?.substring(0, 8), grade: s.grade?.total_grade || 0 }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">My Analytics</span></h1><p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>Track your learning progress and attendance</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Grade Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={gradeData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} /><YAxis stroke="var(--color-text-muted)" fontSize={12} /><Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8 }} /><Area type="monotone" dataKey="grade" stroke="#00d4ff" fill="rgba(0,212,255,0.1)" strokeWidth={2} /></AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Attendance Status (Last 7)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={attendanceData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" /><XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} /><YAxis hide /><Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 8 }} /><Bar dataKey="status" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Performance Summary</h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>You have completed <strong>{graded.length}</strong> tasks with an average grade of <strong>{graded.length ? Math.round(graded.reduce((s, g) => s + (g.grade?.total_grade || 0), 0) / graded.length) : 0}%</strong>. Your attendance is consistent at <strong>{attendance?.length ? Math.round((attendance.filter(a => a.is_present).length / attendance.length) * 100) : 0}%</strong>. Keep up the good work!</p>
      </div>
    </div>
  )
}
