import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Trash2, ClipboardList, Users, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { taskApi } from '../../api/adminApi'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function TaskManagement() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()
  const role = currentUser?.role?.role_name
  const isHR = role === 'hr'
  const canModify = role === 'super_admin' || role === 'instructor'

  const [showCreate, setShowCreate] = useState(false)
  const [expandedTask, setExpandedTask] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', max_files: 3,
    allowed_types: ['pdf', 'zip', 'jpg'], total_marks: 100,
    criteria: [{ title: '', max_grade: 0 }],
  })

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['instructor-tasks'],
    queryFn: () => taskApi.getAll().then(r => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => { queryClient.invalidateQueries(['instructor-tasks']); setShowCreate(false); toast.success('Task created!') },
    onError: e => toast.error(e.response?.data?.message || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => { queryClient.invalidateQueries(['instructor-tasks']); toast.success('Task deleted') },
  })

  const addCriteria = () => setForm(f => ({ ...f, criteria: [...f.criteria, { title: '', max_grade: 0 }] }))
  const updateCriteria = (i, field, val) => setForm(f => ({
    ...f,
    criteria: f.criteria.map((c, idx) => idx === i ? { ...c, [field]: val } : c),
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">Task Management</span></h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>{tasks?.length || 0} tasks created</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Create New Task</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Task title" />
            </div>
            <div>
              <label className="label">Deadline</label>
              <input className="input" type="datetime-local" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Task description and requirements..." style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="label">Max Files</label>
              <input className="input" type="number" min="1" max="10" value={form.max_files} onChange={e => setForm({...form, max_files: e.target.value})} />
            </div>
            <div>
              <label className="label">Total Marks</label>
              <input className="input" type="number" value={form.total_marks} onChange={e => setForm({...form, total_marks: e.target.value})} />
            </div>
          </div>

          {/* Grading Criteria */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label className="label" style={{ marginBottom: 0 }}>Grading Criteria</label>
              <button className="btn btn-ghost btn-sm" onClick={addCriteria}><Plus size={14} /> Add</button>
            </div>
            {form.criteria.map((c, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 8 }}>
                <input className="input" placeholder={`Criteria ${i + 1} (e.g. Navbar, Responsive)`} value={c.title} onChange={e => updateCriteria(i, 'title', e.target.value)} />
                <input className="input" type="number" placeholder="Max grade" style={{ width: 100 }} value={c.max_grade} onChange={e => updateCriteria(i, 'max_grade', parseFloat(e.target.value))} />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Tasks list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {isLoading ? [...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 100, borderRadius: 16 }} className="animate-shimmer glass-card" />
        )) : tasks?.map(task => (
          <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <ClipboardList size={18} style={{ color: 'var(--color-purple)' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{task.title}</h3>
                  <span className={`badge ${new Date(task.deadline) > new Date() ? 'badge-green' : 'badge-red'}`}>
                    {new Date(task.deadline) > new Date() ? 'Open' : 'Expired'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <span><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />{new Date(task.deadline).toLocaleString()}</span>
                  <span><Users size={12} style={{ display: 'inline', marginRight: 4 }} />{task._count?.submissions || 0} submissions</span>
                  <span>{task.total_marks} marks</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                  {expandedTask === task.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {canModify && (
                  <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Delete task?')) deleteMutation.mutate(task.id) }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {expandedTask === task.id && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
                {task.description && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>{task.description}</p>}
                {task.criteria?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>GRADING CRITERIA</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {task.criteria.map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 6, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 12 }}>
                          <span style={{ color: 'var(--color-text-primary)' }}>{c.title}</span>
                          <span style={{ color: 'var(--color-purple)', fontWeight: 700 }}>{c.max_grade}pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
