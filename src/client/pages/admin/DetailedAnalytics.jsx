import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, BookOpen, ClipboardList, TrendingUp, Search, Download, Filter } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useAuthStore } from '../../store/authStore';

export default function DetailedAnalytics() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('none')
  const { data, isLoading } = useQuery({
    queryKey: ['detailed-analytics'],
    queryFn: () => adminApi.getDetailedAnalytics().then(r => r.data),
  })

  let students = data?.data || []
  
  if (sortBy === 'low_attendance') students = [...students].sort((a, b) => parseFloat(a.attendance_rate) - parseFloat(b.attendance_rate))
  else if (sortBy === 'high_attendance') students = [...students].sort((a, b) => parseFloat(b.attendance_rate) - parseFloat(a.attendance_rate))
  else if (sortBy === 'low_grade') students = [...students].sort((a, b) => parseFloat(a.avg_grade) - parseFloat(b.avg_grade))
  else if (sortBy === 'high_grade') students = [...students].sort((a, b) => parseFloat(b.avg_grade) - parseFloat(a.avg_grade))

  const filtered = students.filter(s => 
    (s.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
    s.academic_number?.includes(search)
  )

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, color: '#12D6FF' },
    { label: 'Avg Attendance', value: students.length ? (students.reduce((acc, s) => acc + parseFloat(s.attendance_rate), 0) / students.length).toFixed(1) + '%' : '0%', icon: BookOpen, color: '#9BEA27' },
    { label: 'Tasks Submissions', value: students.reduce((acc, s) => acc + s.tasks_submitted, 0), icon: ClipboardList, color: '#5BE7FF' },
    { label: 'Avg System Grade', value: students.length ? (students.reduce((acc, s) => acc + parseFloat(s.avg_grade), 0) / students.length).toFixed(1) + '%' : '0%', icon: TrendingUp, color: '#F59E0B' },
  ]

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>
            <span className="gradient-text-brand">System Analytics</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Detailed tracking of attendance, tasks, and academic performance
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Students', value: students.length, icon: Users, color: '#12D6FF' },
          { label: 'Avg Attendance', value: students.length ? (students.reduce((acc, s) => acc + parseFloat(s.attendance_rate), 0) / students.length).toFixed(1) + '%' : '0%', icon: BookOpen, color: '#9BEA27' },
          { label: 'Task Submissions', value: students.reduce((acc, s) => acc + s.tasks_submitted, 0), icon: ClipboardList, color: '#5BE7FF' },
          { label: 'Avg System Grade', value: students.length ? (students.reduce((acc, s) => acc + parseFloat(s.avg_grade), 0) / students.length).toFixed(1) + '%' : '0%', icon: TrendingUp, color: '#F59E0B' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card" style={{ padding: 24 }}>
            <s.icon size={20} style={{ color: s.color, marginBottom: 12 }} />
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Student Performance List</h3>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', width: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                className="input" 
                placeholder="Search students..." 
                style={{ paddingLeft: 36, height: 40, fontSize: 13, borderRadius: 10 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Sort Filter */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Filter size={14} style={{ position: 'absolute', left: 12, color: 'var(--color-cyan)' }} />
              <select 
                className="input" 
                style={{ paddingLeft: 36, height: 40, fontSize: 13, width: 180, borderRadius: 10, cursor: 'pointer', border: '1px solid rgba(0, 212, 255, 0.2)', background: 'rgba(0, 212, 255, 0.05)' }}
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="none">Default Sorting</option>
                <option value="low_attendance">⚠ Lowest Attendance</option>
                <option value="high_attendance">★ Best Attendance</option>
                <option value="low_grade">↓ Lowest Grades</option>
                <option value="high_grade">↑ Highest Grades</option>
              </select>
            </div>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Academic #</th>
                <th>Group</th>
                <th>Attendance</th>
                <th>Rate</th>
                <th>Tasks</th>
                <th>Avg Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(6)].map((_, i) => (
                <tr key={i}>{[...Array(8)].map((_, j) => (<td key={j}><div style={{ height: 14, borderRadius: 4 }} className="animate-shimmer" /></td>))}</tr>
              )) : filtered.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{s.name}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.academic_number}</td>
                  <td><span className="badge badge-gray">{s.group || '—'}</span></td>
                  <td style={{ fontWeight: 700 }}>{s.total_attendance} <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 400 }}>days</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: '100%', width: `${s.attendance_rate}%`, background: parseFloat(s.attendance_rate) > 75 ? '#9BEA27' : parseFloat(s.attendance_rate) > 50 ? '#F59E0B' : '#EF4444' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{s.attendance_rate}%</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-lime)', fontWeight: 700 }}>{s.tasks_submitted}</td>
                  <td style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{s.avg_grade}%</td>
                  <td><span className={`badge ${parseFloat(s.attendance_rate) > 75 && parseFloat(s.avg_grade) > 60 ? 'badge-green' : 'badge-amber'}`}>{parseFloat(s.attendance_rate) > 75 && parseFloat(s.avg_grade) > 60 ? 'Excellent' : 'Needs Review'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}