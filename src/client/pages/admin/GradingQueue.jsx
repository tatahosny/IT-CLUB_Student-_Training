import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Clock, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { gradingApi } from '../../api/adminApi';

export default function GradingQueue({ compact = false }) {
  const { user } = useAuthStore()
  const role = user?.role?.role_name;
  const basePath = (role === 'super_admin' || role === 'hr') ? '/hr/grading' : role === 'instructor' ? '/instructor/grading' : '/mentor/grading';

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['grading-queue'],
    queryFn: () => gradingApi.getQueue().then(r => r.data.data),
  })

  return (
    <div style={{ textAlign: 'left' }}>
      {!compact && (
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-purple">Grading Queue</span></h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            There are {submissions?.length || 0} submissions pending review
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? [...Array(compact ? 3 : 5)].map((_, i) => (
          <div key={i} style={{ height: 90, borderRadius: 16 }} className="animate-shimmer glass-card" />
        )) : submissions?.length === 0 ? (
          <div className="glass-card" style={{ padding: compact ? 24 : 48, textAlign: 'center' }}>
            <Clock size={compact ? 24 : 40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: compact ? 12 : 14 }}>No submissions pending review at this time</p>
          </div>
        ) : submissions?.slice(0, compact ? 3 : 999).map(sub => (
          <motion.div key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card glass-card-hover" style={{ padding: compact ? 16 : 20 }}>
            <Link to={`${basePath}/${sub.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: compact ? 4 : 6 }}>
                    <div style={{
                      width: compact ? 28 : 36, height: compact ? 28 : 36, borderRadius: compact ? 8 : 10, background: 'linear-gradient(135deg, var(--color-purple), var(--color-pink))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: compact ? 11 : 14, fontWeight: 700,
                    }}>
                      {sub.student?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: compact ? 13 : 15, fontWeight: 600 }}>{sub.student?.full_name}</div>
                      {!compact && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>#{sub.student?.academic_number}</div>}
                    </div>
                  </div>
                  <div style={{ fontSize: compact ? 12 : 13, color: 'var(--color-text-secondary)', marginLeft: compact ? 38 : 46 }}>
                    Task: <strong>{sub.task?.title}</strong>
                  </div>
                  {!compact && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 46, marginTop: 2 }}>
                      Submitted: {new Date(sub.submitted_at).toLocaleString()} • {sub.uploaded_files?.length} files
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge-amber" style={{ fontSize: compact ? 9 : 10 }}>Pending</span>
                  <ChevronLeft size={compact ? 14 : 18} style={{ color: 'var(--color-text-muted)', transform: 'rotate(180deg)' }} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}