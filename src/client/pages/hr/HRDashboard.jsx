import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, ClipboardList, TrendingUp, Search, 
  Activity, CheckCircle, Clock, FileText, UserCheck, 
  BarChart3, LayoutDashboard, History 
} from 'lucide-react';
import { hrApi } from '../../api/adminApi';
import { useAuthStore } from '../../store/authStore';

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');

  const { data: engagement, isLoading: loadingEngagement } = useQuery({
    queryKey: ['hr-engagement'],
    queryFn: () => hrApi.getEngagementStats().then(r => r.data.data)
  });

  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ['hr-submissions'],
    queryFn: () => hrApi.getSubmissionStats().then(r => r.data.data)
  });

  const { data: gradingLogs, isLoading: loadingLogs } = useQuery({
    queryKey: ['hr-grading-logs'],
    queryFn: () => hrApi.getGradingLogs().then(r => r.data.data)
  });

  const stats = [
    { label: 'Total Students', value: engagement?.totalStudents || 0, icon: Users, color: '#12D6FF' },
    { label: 'Avg Submissions', value: engagement?.avgSubmissions || 0, icon: ClipboardList, color: '#9BEA27' },
    { label: 'Total Attendance', value: engagement?.totalAttendances || 0, icon: UserCheck, color: '#F59E0B' },
    { label: 'Total Tasks', value: engagement?.taskSubmissions?.length || 0, icon: BookOpen, color: '#5BE7FF' },
  ];

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          <span className="gradient-text-brand">HR Management Center</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          Comprehensive tracking of student engagement, task progress, and mentor performance
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card" style={{ padding: 24 }}>
            <s.icon size={20} style={{ color: s.color, marginBottom: 12 }} />
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--glass-border)', paddingBottom: 12 }}>
        {[
          { id: 'overview', label: 'Engagement Overview', icon: Activity },
          { id: 'submissions', label: 'Task Tracking', icon: ClipboardList },
          { id: 'logs', label: 'Grading History', icon: History }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12,
              border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: activeTab === tab.id ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-cyan)' : 'var(--color-text-muted)',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Submission Rate by Task</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {engagement?.taskSubmissions?.map((task, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 600 }}>{task.title}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{task._count.submissions} / {engagement.totalStudents}</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          width: `${(task._count.submissions / engagement.totalStudents) * 100}%`,
                          background: 'linear-gradient(90deg, var(--color-cyan), var(--color-purple))'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 40, marginBottom: 20 }}>Recent Session Attendance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                  {engagement?.sessionAttendances?.map((session, i) => (
                    <div key={i} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session.title}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-cyan)' }}>{session._count.attendances}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Present</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Interaction Alerts</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 12, borderRadius: 12, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: 13 }}>
                    <div style={{ color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Clock size={14} /> Low Interaction
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>12 students haven't submitted the latest task.</p>
                  </div>
                  <div style={{ padding: 12, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: 13 }}>
                    <div style={{ color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <CheckCircle size={14} /> High Attendance
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Group A reached 95% attendance this week.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'submissions' && (
          <motion.div key="submissions" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="glass-card">
              <div style={{ padding: 20, borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Submission Statistics</h3>
                <div style={{ position: 'relative', width: 240 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input className="input" placeholder="Search tasks..." style={{ paddingLeft: 36, height: 36, fontSize: 12 }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Total Submissions</th>
                      <th>Group Performance</th>
                      <th>Latest Submission</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingSubmissions ? [...Array(5)].map((_, i) => (
                      <tr key={i}>{[...Array(5)].map((_, j) => (<td key={j}><div className="animate-shimmer" style={{ height: 16, borderRadius: 4 }} /></td>))}</tr>
                    )) : submissions?.filter(t => t.title.toLowerCase().includes(search.toLowerCase())).map((task, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{task.title}</td>
                        <td style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{task._count.submissions}</td>
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            {task.submissions[0]?.student?.group?.group_name || 'All Groups'}
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {task.submissions[0] ? new Date(task.submissions[0].submitted_at).toLocaleString() : 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${new Date(task.deadline) > new Date() ? 'badge-green' : 'badge-red'}`}>
                            {new Date(task.deadline) > new Date() ? 'Active' : 'Ended'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div key="logs" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <div className="glass-card">
              <div style={{ padding: 20, borderBottom: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>Mentor Grading Log</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Real-time audit of task evaluations and feedback</p>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Reviewer (Mentor)</th>
                      <th>Student</th>
                      <th>Task</th>
                      <th>Grade</th>
                      <th>Feedback</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLogs ? [...Array(5)].map((_, i) => (
                      <tr key={i}>{[...Array(6)].map((_, j) => (<td key={j}><div className="animate-shimmer" style={{ height: 16, borderRadius: 4 }} /></td>))}</tr>
                    )) : gradingLogs?.map((log, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-purple)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{log.mentor.full_name[0]}</div>
                            <span style={{ fontWeight: 600 }}>{log.reviewer_name || log.mentor.full_name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          <div>{log.submission.student.full_name}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{log.submission.student.academic_number}</div>
                        </td>
                        <td style={{ fontSize: 13 }}>{log.submission.task.title}</td>
                        <td>
                          <span style={{ color: 'var(--color-lime)', fontWeight: 700 }}>{log.total_grade}</span>
                        </td>
                        <td style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.feedback || '—'}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {new Date(log.graded_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
