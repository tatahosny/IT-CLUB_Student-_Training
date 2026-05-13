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
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword', '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authApi.changePassword({ 
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      });
      updateUser({ ...user, first_login: false });
      toast.success('Password changed successfully!');
      navigate('/');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Logo size={80} style={{ margin: '0 auto 20px', justifyContent: 'center' }} />
          <h2 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">Secure Your Account</span></h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 8 }}>Since this is your first login, please set a new password.</p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Temporary Password (Phone Number)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  {...register('currentPassword', { required: 'Please enter your current temporary password' })} 
                  type={showPass ? 'text' : 'password'} 
                  className={`input ${errors.currentPassword ? 'input-error' : ''}`} 
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.currentPassword && <span style={{ color: 'var(--color-red)', fontSize: 11, marginTop: 4, display: 'block' }}><AlertCircle size={10} style={{ display: 'inline', marginRight: 4 }} />{errors.currentPassword.message}</span>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label className="label">New Secure Password</label>
              <input 
                {...register('newPassword', { 
                  required: 'New password is required', 
                  minLength: { value: 8, message: 'Password must be at least 8 characters' } 
                })} 
                type={showPass ? 'text' : 'password'} 
                className={`input ${errors.newPassword ? 'input-error' : ''}`} 
                placeholder="Minimum 8 characters"
              />
              {errors.newPassword && <span style={{ color: 'var(--color-red)', fontSize: 11, marginTop: 4, display: 'block' }}><AlertCircle size={10} style={{ display: 'inline', marginRight: 4 }} />{errors.newPassword.message}</span>}
            </div>

            <div style={{ marginBottom: 32 }}>
              <label className="label">Confirm New Password</label>
              <input 
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: v => v === newPassword || 'Passwords do not match' 
                })} 
                type={showPass ? 'text' : 'password'} 
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`} 
                placeholder="Repeat new password"
              />
              {errors.confirmPassword && <span style={{ color: 'var(--color-red)', fontSize: 11, marginTop: 4, display: 'block' }}><AlertCircle size={10} style={{ display: 'inline', marginRight: 4 }} />{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 52, fontSize: 16 }} disabled={loading}>
              {loading ? <RefreshCw className="spin" size={20} /> : <><Shield size={20} /> Update Password & Login</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
