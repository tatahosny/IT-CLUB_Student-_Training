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

export default function NotificationsPage() {
  const queryClient = useQueryClient(); const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => adminApi.getNotifications().then(r => r.data.data) })
  const markRead = useMutation({ mutationFn: adminApi.markRead, onSuccess: () => queryClient.invalidateQueries(['notifications']) })
  const notifications = data || []; const unread = notifications.filter(n => !n.is_read).length
  return (
    <div>
      <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">Notifications</span></h1><p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>{unread} unread</p></div>
      {isLoading ? <div style={{ height: 200 }} className="animate-shimmer glass-card" /> : notifications.length === 0 ? (<div className="glass-card" style={{ padding: 48, textAlign: 'center' }}><Bell size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} /><p style={{ color: 'var(--color-text-muted)' }}>No notifications</p></div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{notifications.map((notif, i) => (<motion.div key={notif.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="glass-card" style={{ padding: '16px 20px', cursor: 'pointer', borderLeft: notif.is_read ? '3px solid transparent' : '3px solid var(--color-cyan)', opacity: notif.is_read ? 0.7 : 1 }} onClick={() => !notif.is_read && markRead.mutate(notif.id)}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><div style={{ fontSize: 14, fontWeight: notif.is_read ? 400 : 700, marginBottom: 4 }}>{notif.title}</div><div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{notif.message}</div><div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>{new Date(notif.created_at).toLocaleString()}</div></div>{!notif.is_read && (<div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-cyan)', flexShrink: 0, marginTop: 4 }} />)}</div></motion.div>))}</div>)}
    </div>
  )
}
