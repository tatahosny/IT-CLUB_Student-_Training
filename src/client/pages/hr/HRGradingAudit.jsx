import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { History, UserCheck, Star, Award, Search, Filter, Calendar } from 'lucide-react';
import { hrApi } from '../../api/adminApi';

export default function HRGradingAudit() {
  const [search, setSearch] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['hr-grading-logs'],
    queryFn: () => hrApi.getGradingLogs().then(r => r.data.data)
  });

  // Calculate mentor performance stats from logs
  const mentorStats = {};
  logs?.forEach(log => {
    const name = log.reviewer_name || log.mentor.full_name;
    if (!mentorStats[name]) {
      mentorStats[name] = { count: 0, avgGrade: 0, lastGraded: null };
    }
    mentorStats[name].count++;
    mentorStats[name].avgGrade += log.total_grade;
    if (!mentorStats[name].lastGraded || new Date(log.graded_at) > new Date(mentorStats[name].lastGraded)) {
      mentorStats[name].lastGraded = log.graded_at;
    }
  });

  const mentorList = Object.entries(mentorStats).map(([name, stats]) => ({
    name,
    ...stats,
    avgGrade: (stats.avgGrade / stats.count).toFixed(1)
  })).sort((a, b) => b.count - a.count);

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          <span className="gradient-text-purple">Mentor Grading Performance</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          Audit trail of task evaluations and mentor grading activity.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div>
          <div className="glass-card">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={18} className="text-purple-400" /> Recent Grading Logs
              </h3>
              <div style={{ position: 'relative', width: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="input" placeholder="Search..." style={{ paddingLeft: 34, height: 34, fontSize: 12 }} value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Reviewer</th>
                    <th>Student</th>
                    <th>Task</th>
                    <th>Grade</th>
                    <th>Graded At</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(5)].map((_, j) => (<td key={j}><div className="animate-shimmer" style={{ height: 16, borderRadius: 4 }} /></td>))}</tr>
                  )) : logs?.filter(l => (l.reviewer_name || l.mentor.full_name).toLowerCase().includes(search.toLowerCase())).map((log, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.reviewer_name || log.mentor.full_name}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Mentor</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{log.submission.student.full_name}</td>
                      <td style={{ fontSize: 12 }}>{log.submission.task.title}</td>
                      <td><span style={{ color: 'var(--color-lime)', fontWeight: 700 }}>{log.total_grade}%</span></td>
                      <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(log.graded_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} className="text-amber-400" /> Leaderboard
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mentorList.map((mentor, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? 'var(--color-amber)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: i === 0 ? '#000' : '#fff' }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{mentor.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{mentor.count} reviews • Avg {mentor.avgGrade}%</div>
                  </div>
                  {i === 0 && <Star size={14} className="text-amber-400" />}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20, background: 'linear-gradient(135deg, rgba(124,58,237,0.1), transparent)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>HR Insight</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              Mentor activity has increased by 24% this week. Ensure all pending tasks are reviewed within 48 hours of submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
