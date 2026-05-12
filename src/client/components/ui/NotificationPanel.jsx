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

export default function NotificationPanel({ onClose }) {
  const panelRef = useRef(null)
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['notifications'], queryFn: () => adminApi.getNotifications().then(r => r.data.data) })
  const markRead = useMutation({ mutationFn: adminApi.markRead, onSuccess: () => queryClient.invalidateQueries(['notifications']) })
  useEffect(() => {
    const handleClick = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const notifications = data || []
  const unread = notifications.filter(n => !n.is_read).length
  return (
    <motion.div ref={panelRef} initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--color-bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 16, zIndex: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} style={{ color: 'var(--color-cyan)' }} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>Notifications</span>
          {unread > 0 && <span className="badge badge-red">{unread}</span>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={16} /></button>
      </div>
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0 ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>No notifications</div> : notifications.map(n => (
          <div key={n.id} onClick={() => !n.is_read && markRead.mutate(n.id)} style={{ padding: '12px 16px', cursor: n.is_read ? 'default' : 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: n.is_read ? '3px solid transparent' : '3px solid var(--color-cyan)', background: n.is_read ? 'transparent' : 'rgba(0,212,255,0.03)', transition: 'background 0.15s' }}>
            <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, marginBottom: 2 }}>{n.title}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{n.message}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
