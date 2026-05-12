import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Clock, ChevronRight, User } from 'lucide-react'
import { gradingApi } from '../../api/adminApi'

export default function GradingQueue() {
  const { data: submissions, isLoading } = useQuery({
    queryKey: ['grading-queue'],
    queryFn: () => gradingApi.getQueue().then(r => r.data.data),
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-brand">Grading Queue</span></h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          {submissions?.length || 0} submissions awaiting review
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? [...Array(5)].map((_, i) => (
          <div key={i} style={{ height: 90, borderRadius: 16 }} className="animate-shimmer glass-card" />
        )) : submissions?.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
            <Clock size={40} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)' }}>No submissions pending review</p>
          </div>
        ) : submissions?.map(sub => (
          <motion.div key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card glass-card-hover" style={{ padding: 20 }}>
            <Link to={`/mentor/grading/${sub.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'linear-gradient(135deg, #08B8E8, #9BEA27)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#07111B', fontSize: 14, fontWeight: 800,
                    }}>
                      {sub.student?.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{sub.student?.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>#{sub.student?.academic_number}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginLeft: 46 }}>
                    Task: <strong>{sub.task?.title}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 46, marginTop: 2 }}>
                    Submitted: {new Date(sub.submitted_at).toLocaleString()} • {sub.uploaded_files?.length} files
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge-amber">Pending</span>
                  <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
