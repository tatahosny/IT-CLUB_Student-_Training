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

export default function QRScanner({ onClose }) {
  const { user } = useAuthStore()
  const scannerRef = useRef(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (!isScanning) return;
    
    // Use a slight delay to ensure the DOM element is rendered
    const timer = setTimeout(() => {
      const element = document.getElementById('qr-reader');
      if (!element) return;
      
      scannerRef.current = new Html5QrcodeScanner('qr-reader', { 
        fps: 10, 
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      }, false)
      
      scannerRef.current.render(
        async (decoded) => {
          const qrCode = decoded.replace('IT-QR:', '')
          try {
            const res = await attendanceApi.scanQR({ 
              qrCode, 
              sessionId: sessionId ? parseInt(sessionId) : undefined, 
              attendanceType: 'first', 
              fingerprint: localStorage.getItem('device_fingerprint') 
            })
            setResult(res.data); setError(null); toast.success(res.data.message)
          } catch (e) { 
            const msg = e.response?.data?.message || 'Scan failed'; 
            setError(msg); 
            toast.error(msg) 
          }
        },
        (err) => {}
      )
    }, 100);

    return () => {
      clearTimeout(timer);
      try { scannerRef.current?.clear() } catch {}
    }
  }, [isScanning, sessionId])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-card" style={{ width: '100%', maxWidth: 420, padding: 28, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Camera size={20} style={{ color: 'var(--color-cyan)' }} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>QR Scanner</h2>
        </div>

        {!isScanning ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--color-cyan)' }}>
              <Camera size={32} />
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 20 }}>Please allow camera access to scan QR codes</p>
            <button onClick={() => setIsScanning(true)} className="btn btn-primary" style={{ width: '100%' }}>Start Camera</button>
          </div>
        ) : (
          <>
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '2px solid rgba(0,212,255,0.2)', background: '#000', marginBottom: 16 }}>
              <div id="qr-reader" style={{ width: '100%' }} />
            </div>
            {(user?.role?.role_name === 'oc' || user?.role?.role_name === 'instructor') && (
              <div style={{ marginBottom: 16 }}>
                <label className="label">Session ID (optional)</label>
                <input className="input" type="number" placeholder="Leave empty to auto-detect" value={sessionId} onChange={e => setSessionId(e.target.value)} />
              </div>
            )}
          </>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-green)' }}>Success!</div>
            <div style={{ fontSize: 14 }}>{result.student.full_name}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{result.student.academic_number}</div>
          </motion.div>
        )}

        {error && (
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--color-red)', fontSize: 13, textAlign: 'center' }}>
            {error}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
