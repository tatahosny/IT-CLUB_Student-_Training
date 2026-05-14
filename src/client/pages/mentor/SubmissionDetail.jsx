import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Send, FileText } from 'lucide-react'
import { gradingApi } from '../../api/adminApi'
import toast from 'react-hot-toast'

export default function SubmissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', id],
    queryFn: () => gradingApi.getDetail(id).then(r => r.data.data),
  })

  const [grades, setGrades] = useState({})
  const [notes, setNotes] = useState({})
  const [feedback, setFeedback] = useState('')

  const gradeMutation = useMutation({
    mutationFn: (data) => gradingApi.grade(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['grading-queue'])
      toast.success('Submission graded successfully!')
      navigate('/mentor/grading')
    },
    onError: e => toast.error(e.response?.data?.message || 'Failed to grade'),
  })

  const handleSubmit = () => {
    if (!submission) return
    const details = submission.task.criteria.map(c => ({
      criteria_id: c.id,
      student_grade: parseFloat(grades[c.id] || 0),
      notes: notes[c.id] || '',
    }))
    gradeMutation.mutate({ feedback, details })
  }

  const totalGrade = submission?.task.criteria.reduce((sum, c) => sum + parseFloat(grades[c.id] || 0), 0) || 0

  if (isLoading) return <div className="glass-card" style={{ padding: 32 }}><p style={{ color: 'var(--color-text-muted)' }}>Loading...</p></div>

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        <ArrowLeft size={15} /> Back to Queue
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Submission info */}
        <div>
          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{submission?.task?.title}</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>{submission?.task?.description}</p>
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>STUDENT</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{submission?.student?.full_name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>#{submission?.student?.academic_number}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>SUBMITTED</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(submission?.submitted_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>TOTAL MARKS</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{submission?.task?.total_marks} pts</div>
              </div>
            </div>
          </div>

          {/* Files */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Submitted Files ({submission?.uploaded_files?.length || 0})</h3>
            {submission?.uploaded_files?.map((file, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)', marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={16} style={{ color: 'var(--color-cyan)' }} />
                  <span style={{ fontSize: 13 }}>{file.split('/').pop()}</span>
                </div>
                <a href={`/uploads/${file}`} download className="btn btn-ghost btn-sm">
                  <Download size={13} />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Grading panel */}
        <div>
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Grade Submission</h3>

            {/* Total indicator */}
            <div style={{
              padding: 16, borderRadius: 12, textAlign: 'center', marginBottom: 20,
              background: `linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,212,255,0.1))`,
              border: '1px solid rgba(124,58,237,0.2)',
            }}>
              <div style={{ fontSize: 36, fontWeight: 800 }} className="gradient-text-brand">
                {submission?.status === 'reviewed' ? submission?.grade?.total_grade : totalGrade}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>of {submission?.task?.total_marks} total marks</div>
              {submission?.status === 'reviewed' && (
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--color-lime)' }}>
                  GRADED BY: {submission?.grade?.mentor?.full_name || submission?.grade?.reviewer_name}
                </div>
              )}
            </div>

            {/* Criteria */}
            {submission?.task?.criteria?.map(c => (
              <div key={c.id} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</label>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Max: {c.max_grade}</span>
                </div>
                <input
                  type="number" min="0" max={c.max_grade}
                  className="input"
                  placeholder={`0 — ${c.max_grade}`}
                  value={grades[c.id] || ''}
                  onChange={e => setGrades(g => ({ ...g, [c.id]: e.target.value }))}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Notes (optional)"
                  value={notes[c.id] || ''}
                  onChange={e => setNotes(n => ({ ...n, [c.id]: e.target.value }))}
                  style={{ marginTop: 6 }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label className="label">Overall Feedback</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Feedback for the student..."
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleSubmit}
              disabled={gradeMutation.isPending}
            >
              <Send size={15} />
              {gradeMutation.isPending ? 'Submitting...' : 'Submit Grade'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
