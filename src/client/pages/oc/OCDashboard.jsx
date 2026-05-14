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

export default function HRScannerDashboard() {
  const [scanResult, setScanResult] = useState(null); const [scanning, setScanning] = useState(false); const [error, setError] = useState(null); const [sessionId, setSessionId] = useState(''); const scannerRef = useRef(null)
  useEffect(() => { return () => { if (scannerRef.current) { try { scannerRef.current.clear() } catch {} } } }, [])
  const startScanner = () => {
    if (!sessionId) return toast.error('Enter session ID first'); setScanning(true); setError(null); setScanResult(null)
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner('hr-qr-scanner', { fps: 10, qrbox: { width: 250, height: 250 } }, false)
      scannerRef.current.render(async (decodedText) => {
        const qrCode = decodedText.replace('IT-QR:', '')
        try {
          const res = await attendanceApi.scanQR({ qrCode, sessionId: parseInt(sessionId), attendanceType: 'first', fingerprint: localStorage.getItem('device_fingerprint') })
          setScanResult(res.data); toast.success(res.data.message)
        } catch (e) { const msg = e.response?.data?.message || 'Scan failed'; setError(msg); toast.error(msg) }
      }, (err) => console.warn('QR scan error:', err))
    }, 100)
  }
  const stopScanner = () => { if (scannerRef.current) { try { scannerRef.current.clear() } catch {} } setScanning(false) }
  return (
    <div>
      <div style={{ marginBottom: 28 }}><h1 style={{ fontSize: 26, fontWeight: 800 }}><span className="gradient-text-cyan">HR Scanner Panel</span></h1><p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>Scan student QR codes for attendance</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Scanner</h3>
          <div style={{ marginBottom: 16 }}><label className="label">Session ID</label><input className="input" type="number" placeholder="Enter active session ID" value={sessionId} onChange={e => setSessionId(e.target.value)} /></div>
          {!scanning ? <button className="btn btn-primary" style={{ width: '100%' }} onClick={startScanner}><Camera size={16} /> Start Scanner</button> : <button className="btn btn-danger" style={{ width: '100%' }} onClick={stopScanner}><X size={16} /> Stop Scanner</button>}
          {scanning && <div style={{ marginTop: 16 }}><div id="hr-qr-scanner" style={{ width: '100%' }} /></div>}
        </div>
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Scan Result</h3>
          {!scanResult && !error && (<div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}><Camera size={40} style={{ color: 'var(--color-text-muted)' }} /><p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Waiting for scan...</p></div>)}
          {error && (<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: 20, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}><AlertCircle size={32} style={{ color: 'var(--color-red)', margin: '0 auto 12px' }} /><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-red)' }}>{error}</p></motion.div>)}
          {scanResult && (<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ padding: 24, borderRadius: 12, background: scanResult.success ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${scanResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`, textAlign: 'center' }}>{scanResult.success ? <CheckCircle size={40} style={{ color: 'var(--color-green)', margin: '0 auto 12px' }} /> : <AlertCircle size={40} style={{ color: 'var(--color-amber)', margin: '0 auto 12px' }} />}<p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{scanResult.data?.student?.full_name}</p><p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>#{scanResult.data?.student?.academic_number}</p><p style={{ fontSize: 14, fontWeight: 600, color: scanResult.success ? 'var(--color-green)' : 'var(--color-amber)' }}>{scanResult.message}</p>{scanResult.data?.attendance_type && <span className="badge badge-cyan" style={{ marginTop: 12 }}>{scanResult.data.attendance_type}</span>}</motion.div>)}
        </div>
      </div>
    </div>
  )
}
