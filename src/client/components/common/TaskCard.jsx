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

export default function TaskCard({ task, sub, files, setFiles, submitting, handleSubmit, handleDeleteFile }) {
  const isDeadlinePassed = new Date() > new Date(task.deadline)
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 20px rgba(18,214,255,0.1)' }}
      className="glass-card" 
      style={{ 
        padding: 0, 
        display: 'flex', 
        flexDirection: 'column', 
        border: sub ? '1px solid rgba(155,234,39,0.3)' : '1px solid rgba(255,255,255,0.1)', 
        background: 'rgba(11, 22, 34, 0.9)', 
        overflow: 'hidden',
        borderRadius: 20,
        height: '100%'
      }}
    >
      <div style={{ height: 6, background: sub ? 'linear-gradient(90deg, #9BEA27, #10B981)' : isDeadlinePassed ? 'var(--color-red)' : 'linear-gradient(90deg, #00d4ff, #7c3aed)', width: '100%' }} />
      
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: '#fff' }}>{task.title}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} className="color-cyan" /> {new Date(task.deadline).toLocaleDateString()}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Award size={14} className="color-lime" /> {task.total_marks} Marks</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} className="color-purple" /> {task.instructor?.full_name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} className="color-orange" /> {task.max_files} Files Max</span>
            </div>
          </div>
          <div className={`badge ${sub ? 'badge-green' : isDeadlinePassed ? 'badge-red' : 'badge-cyan'}`} style={{ padding: '4px 12px', fontSize: 10 }}>
            {sub ? 'SUBMITTED' : isDeadlinePassed ? 'EXPIRED' : 'OPEN'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {task.allowed_types?.map(type => (
            <span key={type} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: '1px solid var(--glass-border)', textTransform: 'uppercase' }}>
              .{type}
            </span>
          ))}
        </div>

        {task.description && (
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 20, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {task.description}
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12 }}>
           <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Submission Progress</span>
           <span style={{ fontWeight: 800, color: (sub?.uploaded_files?.length || 0) >= task.max_files ? 'var(--color-lime)' : 'var(--color-cyan)' }}>
             {(sub?.uploaded_files?.length || 0)} / {task.max_files} Files
           </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', marginBottom: 20, overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${((sub?.uploaded_files?.length || 0) / task.max_files) * 100}%` }} 
            style={{ height: '100%', background: 'linear-gradient(90deg, #00d4ff, #7c3aed)', borderRadius: 3 }} 
          />
        </div>

        {/* File Management Box */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 16, padding: 16, marginBottom: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
             {sub?.uploaded_files?.length ? 'Your Submissions' : 'No files uploaded yet'}
           </div>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
             {sub?.uploaded_files?.map((path, i) => (
               <div key={`sub-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(155,234,39,0.1)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                   <FileText size={16} style={{ color: 'var(--color-lime)', flexShrink: 0 }} />
                   <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#eee' }}>{path.split(/[\\/]/).pop()}</span>
                 </div>
                 {sub.status !== 'reviewed' && (
                   <button 
                     onClick={() => handleDeleteFile(task.id, path)} 
                     className="btn btn-danger btn-sm" 
                     style={{ padding: '4px 10px', height: 'auto', gap: 4, background: 'rgba(239, 68, 68, 0.15)' }}
                   >
                     <Trash2 size={12} /> <span style={{ fontSize: 10 }}>DELETE</span>
                   </button>
                 )}
               </div>
             ))}

             {files?.map((f, i) => (
               <div key={`new-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, background: 'rgba(18, 214, 255, 0.05)', border: '1px solid rgba(18, 214, 255, 0.2)', borderStyle: 'dashed' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                   <FileText size={16} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
                   <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }}>{f.name}</span>
                 </div>
                 <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 4 }}><X size={16} /></button>
               </div>
             ))}
           </div>
        </div>

        {/* Action Area */}
        {!isDeadlinePassed && sub?.status !== 'reviewed' && (
          <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
            <label 
              style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8, 
                height: 44, 
                borderRadius: 12, 
                cursor: (sub?.uploaded_files?.length || 0) + (files?.length || 0) >= task.max_files ? 'not-allowed' : 'pointer', 
                border: '2px dashed rgba(18,214,255,0.3)', 
                background: (sub?.uploaded_files?.length || 0) + (files?.length || 0) >= task.max_files ? 'rgba(255,255,255,0.02)' : 'rgba(18,214,255,0.02)', 
                fontSize: 13, 
                fontWeight: 700, 
                color: (sub?.uploaded_files?.length || 0) + (files?.length || 0) >= task.max_files ? 'var(--color-text-muted)' : 'var(--color-cyan)', 
                transition: 'all 0.2s',
                opacity: (sub?.uploaded_files?.length || 0) + (files?.length || 0) >= task.max_files ? 0.5 : 1
              }} 
              className={(sub?.uploaded_files?.length || 0) + (files?.length || 0) >= task.max_files ? '' : 'hover-glow'}
            >
              {(sub?.uploaded_files?.length || 0) + (files?.length || 0) >= task.max_files ? (
                <><CheckCircle size={18} /> Limit Reached</>
              ) : (
                <><Plus size={18} /> Add File</>
              )}
              <input 
                type="file" 
                style={{ display: 'none' }} 
                disabled={(sub?.uploaded_files?.length || 0) + (files?.length || 0) >= task.max_files}
                onChange={e => {
                  const newFiles = Array.from(e.target.files);
                  const remaining = task.max_files - ((sub?.uploaded_files?.length || 0) + (files?.length || 0));
                  if (newFiles.length > 0) {
                    if (remaining <= 0) {
                      toast.error(`You have reached the maximum of ${task.max_files} files`);
                    } else {
                      setFiles([...(files || []), ...newFiles].slice(0, (files?.length || 0) + remaining));
                    }
                  }
                  e.target.value = null;
                }} 
              />
            </label>
            
            {files?.length > 0 && (
              <button 
                className="btn btn-primary" 
                style={{ flex: 1.2, height: 44, borderRadius: 12, fontSize: 13, fontWeight: 800, boxShadow: '0 8px 24px rgba(18,214,255,0.3)' }} 
                onClick={() => handleSubmit(task.id)} 
                disabled={submitting}
              >
                <Upload size={16} /> {submitting ? '...' : sub ? 'Update' : 'Submit'}
              </button>
            )}
          </div>
        )}

        {sub && sub.status === 'reviewed' && (
          <div style={{ marginTop: 'auto', padding: 16, borderRadius: 16, background: 'linear-gradient(135deg, rgba(155,234,39,0.1), rgba(16,185,129,0.1))', border: '1px solid rgba(155,234,39,0.2)', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-lime)', marginBottom: 4, textTransform: 'uppercase' }}>Submission Graded</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <CheckCircle size={24} style={{ color: 'var(--color-lime)' }} /> {sub.grade.total_grade} <span style={{ fontSize: 14, opacity: 0.5 }}>/ {task.total_marks}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
