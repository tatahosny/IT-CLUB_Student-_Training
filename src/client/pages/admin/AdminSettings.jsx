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

export default function AdminSettings() {
  const { user, updateUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    confirmPassword: '',
  })

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (form.password && form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    setIsLoading(true)
    try {
      // Using authApi.updateProfile for self-updates to avoid permission errors
      const res = await authApi.updateProfile({ ...form, ...(form.password && { password: form.password }) })
      updateUser(res.data.data)
      toast.success('Profile updated successfully')
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed')
    } finally { setIsLoading(false) }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'left' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }} className="gradient-text-brand">Account Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>Manage your personal profile and account security</p>
      </div>
      <div className="grid-2">
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><Users size={18} className="color-cyan" /> General Information</h3>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label className="label">Full Name</label><input className="input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div className="form-group"><label className="label">Email Address</label><input className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div className="form-group"><label className="label">Phone Number</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <button className="btn btn-primary" type="submit" disabled={isLoading} style={{ marginTop: 8 }}>Save Changes</button>
          </form>
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><Shield size={18} className="color-purple" /> Security</h3>
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group"><label className="label">New Password</label><input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
            <div className="form-group"><label className="label">Confirm Password</label><input className="input" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} /></div>
            <button className="btn btn-ghost" type="submit" disabled={isLoading || !form.password} style={{ marginTop: 8 }}>Update Password</button>
          </form>
        </div>
      </div>
    </div>
  )
}
