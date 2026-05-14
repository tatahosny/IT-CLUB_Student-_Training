import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronRight, ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

export default function GlobalAttendanceLog() {
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: () => adminApi.getGroups().then(r => r.data.data) })
  const { data, isLoading } = useQuery({
    queryKey: ['global-attendance', search, groupFilter, page],
    queryFn: () => adminApi.getGlobalAttendance({ search, group: groupFilter, page, limit }).then(r => r.data),
    keepPreviousData: true,
  })

  useEffect(() => {
    if (search && search.length > 2) {
      const timer = setTimeout(() => {
        adminApi.logActivity({
          action: 'action_search',
          description: `Searched for: "${search}" in Global Attendance`
        }).catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const attendances = data?.data || []
  const total = data?.meta?.total || 0
  const totalPages = Math.ceil(total / limit)

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>
          <span className="gradient-text-cyan">Global Attendance Log</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          View all attendance and absence records across all sessions
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 40 }}
            placeholder="Search by student name, academic # or session name..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <select
          className="input"
          style={{ width: 180 }}
          value={groupFilter}
          onChange={e => { setGroupFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Groups</option>
          {groups?.map(g => <option key={g.id} value={g.id}>{g.group_name}</option>)}
        </select>
      </div>

      <div className="glass-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Academic #</th>
                <th>Session</th>
                <th>Type</th>
                <th>Time</th>
                <th>IP / Device</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? [...Array(10)].map((_, i) => (
                <tr key={i}>{[...Array(7)].map((_, j) => (<td key={j}><div className="animate-shimmer" style={{ height: 16, borderRadius: 4 }} /></td>))}</tr>
              )) : attendances.map(a => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--color-cyan)' }}>{a.student?.full_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{a.student?.group?.group_name}</div>
                  </td>
                  <td style={{ fontSize: 12 }}><code>{a.student?.academic_number}</code></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.session?.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{new Date(a.session?.start_time).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <span className={`badge ${a.attendance_type === 'first' ? 'badge-cyan' : a.attendance_type === 'second' ? 'badge-purple' : 'badge-amber'}`}>
                      {a.attendance_type === 'first' ? '1st Attendance' : a.attendance_type === 'second' ? '2nd Attendance' : 'Workshop'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {a.scanned_at ? new Date(a.scanned_at).toLocaleTimeString() : 'Manual'}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                    <div>{a.ip_address || '—'}</div>
                    <div style={{ opacity: 0.7 }}>{a.device_id?.substring(0, 12)}...</div>
                  </td>
                  <td>
                    {a.is_present ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-green)', fontSize: 12, fontWeight: 700 }}>
                        <CheckCircle size={14} /> Present
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-red)', fontSize: 12, fontWeight: 700 }}>
                        <XCircle size={14} /> Absent
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && attendances.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No attendance records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600 }}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </div>
  )
}