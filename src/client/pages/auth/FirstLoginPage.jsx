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

export default function FirstLoginPage() {
  const navigate = useNavigate(); const { user, updateUser } = useAuthStore(); const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm(); const newPassword = watch('newPassword', '')
  const onSubmit = async (data) => {
    setLoading(true); try {
      await authApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword })
      updateUser({ ...user, first_login: false }); toast.success('Password changed!'); navigate('/')
    } catch (e) { toast.error(e.response?.data?.message || 'Failed') } finally { setLoading(false) }
  }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: 440, padding: '0 20px' }}>
        <div className="glass-card" style={{ padding: 40, textAlign: 'left' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>Change Password</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 18 }}><label className="label">Current Password</label><input {...register('currentPassword', { required: 'Required' })} type="password" className="input" /></div>
            <div style={{ marginBottom: 18 }}><label className="label">New Password</label><input {...register('newPassword', { required: 'Required', minLength: 8 })} type="password" className="input" /></div>
            <div style={{ marginBottom: 28 }}><label className="label">Confirm New Password</label><input {...register('confirmPassword', { validate: v => v === newPassword || 'Passwords do not match' })} type="password" className="input" /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 48 }} disabled={loading}>{loading ? 'Updating...' : 'Set Password & Continue'}</button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
