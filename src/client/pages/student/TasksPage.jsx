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
import TaskCard from "../../components/common/TaskCard";
import { ROLE_COLORS, ACTION_COLORS } from "../../utils/constants";

export default function TasksPage() {
  const [taskFiles, setTaskFiles] = useState({})
  const [submittingTask, setSubmittingTask] = useState(null)
  const { data: tasks, isLoading } = useQuery({ queryKey: ['student-tasks'], queryFn: () => taskApi.getAll().then(r => r.data.data) })
  const { data: mySubmissions, refetch } = useQuery({ queryKey: ['my-submissions'], queryFn: () => taskApi.getMySubmissions().then(r => r.data.data) })
  
  const getSubmission = (taskId) => mySubmissions?.find(s => s.task_id === taskId)

  const handleTaskDeleteFile = async (taskId, filePath) => {
    const fileName = filePath.split(/[\\/]/).pop();
    try { await taskApi.deleteFile(taskId, fileName); toast.success('File removed'); refetch(); } catch (e) { toast.error('Failed to remove file') }
  }

  const handleTaskSubmit = async (taskId) => {
    const files = taskFiles[taskId] || []
    if (!files.length) return toast.error('Select files first')
    setSubmittingTask(taskId); try {
      const formData = new FormData(); files.forEach(f => formData.append('files', f))
      await taskApi.submit(taskId, formData); await refetch(); toast.success('Updated successfully!'); setTaskFiles({ ...taskFiles, [taskId]: [] })
    } catch (e) { toast.error(e.response?.data?.message || 'Submission failed') } finally { setSubmittingTask(null) }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}><span className="gradient-text-cyan">Tasks & Assignments</span></h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>Submit your projects and track your grades</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {isLoading ? [...Array(6)].map((_, i) => <div key={i} style={{ height: 200, borderRadius: 20 }} className="animate-shimmer glass-card" />) : tasks?.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            sub={getSubmission(task.id)} 
            files={taskFiles[task.id]} 
            setFiles={(f) => setTaskFiles({ ...taskFiles, [task.id]: f })} 
            submitting={submittingTask === task.id} 
            handleSubmit={handleTaskSubmit} 
            handleDeleteFile={handleTaskDeleteFile} 
          />
        ))}
      </div>
    </div>
  )
}
