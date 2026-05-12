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

export default function SecurityLogs() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['security-logs', page],
    queryFn: () => adminApi.getSecurityLogs({ page, limit: 30 }).then(r => r.data),
  })

  const logs = data?.data || []
  const meta = data?.meta || {}

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>
            <Shield size={22} style={{ display: 'inline', marginRight: 10, color: 'var(--color-red)' }} />
            <span className="gradient-text-brand">Security Logs</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Total Security Events: {meta.total || 0}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="input" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Events</option>
            <option value="fraud">Fraud</option>
            <option value="block">Block</option>
            <option value="login">Login</option>
          </select>
        </div>
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event Type</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Device</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => (
                    <td key={j}><div style={{ height: 14, borderRadius: 4 }} className="animate-shimmer" /></td>
                  ))}</tr>
                ))
              ) : logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge ${ACTION_COLORS[log.action_type] || 'badge-gray'}`}>
                      {log.action_type}
                    </span>
                    {log.action_type === 'fraud' && (
                      <AlertTriangle size={14} style={{ color: 'var(--color-red)', marginLeft: 6, display: 'inline' }} />
                    )}
                  </td>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{log.user?.full_name || 'System'}</td>
                  <td><code style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{log.ip_address || '—'}</code></td>
                  <td><code style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{log.device_id?.substring(0, 16) || '—'}</code></td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-secondary)', maxWidth: 300 }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {meta.total > 30 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 13, alignSelf: 'center' }}>Page {page}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(meta.total / 30)}>Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
