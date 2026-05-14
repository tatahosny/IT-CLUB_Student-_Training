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
import { useAuthStore } from "@/store/authStore";
import { authApi, adminApi, attendanceApi, sessionApi, taskApi, gradingApi } from "@/api/adminApi";
import Logo from "@/components/common/Logo";
import { generateFingerprint } from "@/utils/helpers";

export default function LoginPage() {
  const navigate = useNavigate(); const { setAuth, isAuthenticated, user } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false); const [loading, setLoading] = useState(false)
  const [blockedInfo, setBlockedInfo] = useState(null);
  const [loginError, setLoginError] = useState(null);
  const { register, handleSubmit, formState: { errors }, resetField } = useForm()

  useEffect(() => {
    if (!localStorage.getItem('device_fingerprint')) localStorage.setItem('device_fingerprint', generateFingerprint())
    if (isAuthenticated && user) {
      if (user.first_login) {
        navigate('/first-login')
      } else {
        const role = user.role?.role_name
        navigate(role === 'hr' ? '/hr' : role === 'super_admin' ? '/admin' : role === 'instructor' ? '/instructor' : role === 'mentor' || role === 'mentor_manager' ? '/mentor' : '/student')
      }
    }
  }, [isAuthenticated])

  const onSubmit = async (data) => {
    setLoading(true); setLoginError(null);
    try {
      const res = await authApi.login(data); const { user, accessToken, refreshToken } = res.data.data
      setAuth(user, accessToken, refreshToken); toast.success(`Welcome back, ${user.full_name.split(' ')[0]}! 👋`)
    } catch (e) { 
      const status = e.response?.status;
      const msg = e.response?.data?.message || 'Login failed';
      
      if (status === 403) {
        setBlockedInfo({
          message: msg,
          blockedUntil: e.response.data.blockedUntil
        });
      } else if (status === 401) {
        setLoginError('Invalid Credentials: The password you entered is incorrect. Please double-check and try again.');
        resetField('password');
      } else if (status === 404) {
        setLoginError('Account Not Found: We couldn\'t find an account associated with this email address.');
      } else if (status === 429) {
        setLoginError('Too Many Attempts: Your access has been temporarily restricted due to multiple failed login attempts. Please try again later.');
      } else {
        setLoginError(`Authentication Error: ${msg}`);
      }
      // No toast here to keep it clean and persistent in the UI as requested
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      {/* Background effects */}
      <div style={{ position: 'absolute', inset: 0 }} className="bg-circuit" />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ width: '100%', maxWidth: 440, padding: '0 20px', zIndex: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Logo size={90} style={{ margin: '0 auto 24px', justifyContent: 'center' }} />
        </div>
        <motion.div 
          initial={{ scale: 0.95 }} 
          animate={{ 
            scale: 1,
            x: loginError ? [0, -10, 10, -10, 10, 0] : 0
          }}
          transition={{ 
            x: { duration: 0.4, ease: "easeInOut" }
          }}
          className="glass-card" 
          style={{ padding: 40, position: 'relative', border: '1px solid rgba(18, 214, 255, 0.15)' }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sign In</h2>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 32 }}>Enter your credentials to access the system</p>
          
          <AnimatePresence>
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444', fontSize: 12 }}
              >
                <AlertCircle size={14} /> {loginError}
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div style={{ marginBottom: 24 }}>
              <label className="label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  {...register('email', { required: 'Email address is required' })} 
                  type="email" 
                  className={`input ${errors.email ? 'input-error' : ''}`} 
                  placeholder="user@domain.com" 
                  style={{ paddingLeft: 44 }} 
                />
                <LogIn size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cyan)', opacity: 0.7 }} />
              </div>
              {errors.email && <span style={{ color: 'var(--color-red)', fontSize: 11, marginTop: 4, display: 'block' }}><AlertCircle size={10} style={{ display: 'inline', marginRight: 4 }} />{errors.email.message}</span>}
            </div>

            <div style={{ marginBottom: 32 }}>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  {...register('password', { required: 'Password is required' })} 
                  type={showPassword ? 'text' : 'password'} 
                  className={`input ${errors.password ? 'input-error' : ''}`} 
                  placeholder="••••••••" 
                  style={{ paddingLeft: 44 }} 
                />
                <Shield size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-cyan)', opacity: 0.7 }} />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span style={{ color: 'var(--color-red)', fontSize: 11, marginTop: 4, display: 'block' }}><AlertCircle size={10} style={{ display: 'inline', marginRight: 4 }} />{errors.password.message}</span>}
            </div>

            <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', height: 52, fontSize: 16 }}>
              {loading ? <RefreshCw className="spin" size={20} /> : <><Zap size={20} /> Authenticate Session</>}
            </button>
          </form>
        </motion.div>
      </motion.div>

      {/* Blocked Modal */}
      <AnimatePresence>
        {blockedInfo && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(5, 10, 20, 0.9)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: 400, background: 'rgba(11, 22, 34, 0.95)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 24, padding: 32, textAlign: 'center', boxShadow: '0 24px 50px rgba(239, 68, 68, 0.15)' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', margin: '0 auto 24px' }}>
                <AlertTriangle size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#EAFBFF', marginBottom: 12 }}>Access Suspended</h3>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
                {blockedInfo.message}
              </p>
              <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', marginBottom: 24 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-cyan)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>Locked Until</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#EAFBFF' }}>
                  {new Date(blockedInfo.blockedUntil).toLocaleString()}
                </div>
              </div>
              <button 
                onClick={() => setBlockedInfo(null)}
                className="btn" 
                style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
              >
                Understood
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
