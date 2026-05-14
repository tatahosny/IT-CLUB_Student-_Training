import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ClipboardList, CheckCircle, XCircle, Clock, Filter, Download } from 'lucide-react';
import { hrApi } from '../../api/adminApi';

export default function HRTaskAudit() {
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState('all');

  const { data: taskStats, isLoading } = useQuery({
    queryKey: ['hr-task-audit'],
    queryFn: () => hrApi.getSubmissionStats().then(r => r.data.data)
  });

  const filteredTasks = useMemo(() => {
    if (!taskStats) return [];
    return taskStats.filter(t => 
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [taskStats, searchTerm]);

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          <span className="gradient-text-cyan">Task Submission Audit</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          Detailed breakdown of student submissions categorized by task assignments.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input 
            className="input" 
            style={{ paddingLeft: 40, height: 44 }}
            placeholder="Search tasks or students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn btn-outline" style={{ height: 44, gap: 8 }}>
          <Download size={16} /> Export Audit
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {isLoading ? [...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 200, borderRadius: 24 }} className="animate-shimmer glass-card" />
        )) : filteredTasks.map((task, i) => (
          <motion.div 
            key={task.id} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className="glass-card" 
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ClipboardList size={20} className="text-cyan-400" /> {task.title}
                </h3>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Deadline: {new Date(task.deadline).toLocaleString()} • {task._count.submissions} Submissions
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-cyan)' }}>
                  {Math.round((task._count.submissions / (task.submissions.length || 1)) * 100)}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Completion Rate</div>
              </div>
            </div>

            <div className="table-wrapper" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Academic #</th>
                    <th>Group</th>
                    <th>Submitted At</th>
                    <th>Review Status</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {task.submissions.map((sub, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{sub.student.full_name}</td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{sub.student.academic_number}</td>
                      <td><span className="badge badge-gray">{sub.student.group?.group_name || '—'}</span></td>
                      <td style={{ fontSize: 12 }}>{new Date(sub.submitted_at).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${sub.status === 'reviewed' ? 'badge-green' : sub.status === 'pending' ? 'badge-amber' : 'badge-red'}`}>
                          {sub.status === 'reviewed' ? 'Graded' : sub.status === 'pending' ? 'Waiting' : 'Rejected'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: sub.grade ? 'var(--color-lime)' : 'var(--color-text-muted)' }}>
                          {sub.grade ? `${sub.grade.total_grade}%` : '—'}
                        </div>
                        {sub.grade && <div style={{ fontSize: 9, opacity: 0.6 }}>By {sub.grade.reviewer_name}</div>}
                      </td>
                    </tr>
                  ))}
                  {task.submissions.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                        No submissions found for this task yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
