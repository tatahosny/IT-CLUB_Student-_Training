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

export default function LoginPage() {
  const navigate = useNavigate(); const { setAuth, isAuthenticated, user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  useEffect(() => {
    if (!localStorage.getItem('device_fingerprint')) localStorage.setItem('device_fingerprint', generateFingerprint())
    if (isAuthenticated && user) {
      if (user.first_login) {
        navigate('/first-login')
      } else {
        const role = user.role?.role_name
        navigate(role === 'super_admin' ? '/admin' : role === 'instructor' ? '/instructor' : role === 'mentor' || role === 'mentor_manager' ? '/mentor' : role === 'oc' ? '/oc' : '/student')
      }
    }
  }, [isAuthenticated])
  const onSubmit = async (data) => {
    setLoading(true); try {
      const res = await authApi.login(data); const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken); toast.success(`Welcome back, ${user.full_name.split(' ')[0]}! 👋`)
    } catch (e) { toast.error(e.response?.data?.message || 'Login failed') } finally { setLoading(false) }
  }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', inset: 0 }} className="bg-circuit" />
      <div style={{ 
        position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', 
        background: 'radial-gradient(circle, rgba(18, 214, 255, 0.1) 0%, transparent 70%)', 
        filter: 'blur(60px)', pointerEvents: 'none' 
      }} />
      <div style={{ 
        position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', 
        background: 'radial-gradient(circle, rgba(155, 234, 39, 0.08) 0%, transparent 70%)', 
        filter: 'blur(60px)', pointerEvents: 'none' 
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ width: '100%', maxWidth: 440, padding: '0 20px', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Logo size={90} style={{ margin: '0 auto 24px', justifyContent: 'center' }} />
          <p style={{ 
            color: 'var(--color-text-muted)', fontSize: 13, 
            letterSpacing: '0.3em', fontWeight: 700, textTransform: 'uppercase', 
            marginTop: 8, opacity: 0.8 
          }}>
            Strategic Training Ecosystem
          </p>
        </div>
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="glass-card" 
          style={{ padding: 40, position: 'relative', border: '1px solid rgba(18, 214, 255, 0.15)' }}
        >
          {/* Subtle glow border top */}
          <div style={{ 
            position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, 
            background: 'linear-gradient(90deg, transparent, var(--color-cyan), transparent)', 
            boxShadow: '0 0 10px var(--color-cyan)' 
          }} />

          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 32 }}>Enter your credentials to access the system</p>
          
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div style={{ marginBottom: 24 }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  {...register('email', { required: 'Email is required' })} 
                  type="email" 
                  className={`input ${errors.email ? 'input-error' : ''}`} 
                  placeholder="user@domain.com" 
                  style={{ paddingLeft: 44 }} 
                />
                <LogIn size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cyan)', opacity: 0.7 }} />
              </div>
            </div>

            <div style={{ marginBottom: 32 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  {...register('password', { required: 'Password is required' })} 
                  type={showPassword ? 'text' : 'password'} 
                  className={`input ${errors.password ? 'input-error' : ''}`} 
                  placeholder="Enter your password" 
                  style={{ paddingLeft: 44, paddingRight: 48 }} 
                />
                <Key size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cyan)', opacity: 0.7 }} />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', height: 52, fontSize: 16, borderRadius: 12 }} 
              disabled={loading}
            >
              {loading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In to System</span>
                  <Zap size={18} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <div style={{ marginTop: 32, textAlign: 'center', opacity: 0.7, fontSize: 11, lineHeight: 1.8 }}>
          <div style={{ color: 'var(--color-text-muted)' }}>
            All Rights Reserved © {new Date().getFullYear()} — 
            <span style={{ color: 'var(--color-cyan)', fontWeight: 800, margin: '0 4px' }}>IT CLUB</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.05em' }}>Borg El Arab Technological University — EdTech Exchange</div>
        </div>
      </motion.div>
    </div>
  )
}
