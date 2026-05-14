import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, RefreshCw, Clock, CheckCircle } from 'lucide-react'
import { sessionApi } from '../../api/sessionApi'
import { attendanceApi } from '../../api/attendanceApi'
import QRCode from 'qrcode'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import { useAuthStore } from '../../store/authStore'

export default function MyQRPage() {
  const { user } = useAuthStore()
  const [selectedSession, setSelectedSession] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)

  const { data: sessions } = useQuery({
    queryKey: ['active-sessions'],
    queryFn: () => sessionApi.getAll().then(r => r.data.data?.filter(s => s.is_active)),
  })

  const generateMyQR = useCallback(async (sessionId) => {
    setLoading(true)
    try {
      const res = await attendanceApi.getMyQR(sessionId)
      const token = res.data.data
      setQrData(token)

      const dataUrl = await QRCode.toDataURL(`IT-QR:${token.qr_code}`, {
        width: 280, margin: 3,
        color: { dark: '#00d4ff', light: '#060b18' },
      })
      setQrImage(dataUrl)
      setSelectedSession(sessionId)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate QR')
    } finally {
      setLoading(false)
    }
  }, [])

  // Listen for real-time scan events
  useEffect(() => {
    if (!selectedSession) return;
    const socket = io();
    socket.emit('join_session', selectedSession);

    socket.on('attendance_update', (data) => {
      if (data.studentId === user?.id) {
        toast.success('Attendance recorded successfully! QR code changed.', { icon: '✅', duration: 4000 });
        generateMyQR(selectedSession);
      }
    });

    return () => {
      socket.emit('leave_session', selectedSession);
      socket.disconnect();
    };
  }, [selectedSession, user?.id, generateMyQR]);

  const isExpired = qrData && new Date() > new Date(qrData.expires_at)
  const minutesLeft = qrData ? Math.max(0, Math.round((new Date(qrData.expires_at) - new Date()) / 60000)) : 0

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}><span className="gradient-text-cyan">My QR Code</span></h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          Your personal dynamic QR code for attendance
        </p>
      </div>

      {/* Session selection */}
      {sessions?.length > 0 ? (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            SELECT ACTIVE SESSION
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => generateMyQR(s.id)}
                className="glass-card"
                style={{
                  padding: 16, textAlign: 'left', cursor: 'pointer',
                  border: selectedSession === s.id ? '1px solid rgba(0,212,255,0.4)' : '1px solid var(--glass-border)',
                  background: selectedSession === s.id ? 'rgba(0,212,255,0.06)' : undefined,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
                      {new Date(s.start_time).toLocaleTimeString()} — {new Date(s.end_time).toLocaleTimeString()}
                    </div>
                  </div>
                  <span className="badge badge-green">LIVE</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <Clock size={36} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No active sessions right now</p>
        </div>
      )}

      {/* QR Display */}
      <AnimatePresence>
        {qrImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card"
            style={{ padding: 32, textAlign: 'center' }}
          >
            <div style={{
              padding: 16, borderRadius: 16, display: 'inline-block',
              background: 'rgba(0,0,0,0.5)',
              border: isExpired ? '2px solid var(--color-red)' : '2px solid rgba(0,212,255,0.3)',
              position: 'relative',
            }}>
              <img src={qrImage} alt="My QR Code" style={{ width: 200, height: 200, display: 'block', opacity: isExpired ? 0.4 : 1 }} />
              {isExpired && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.7)', borderRadius: 14,
                  fontSize: 16, fontWeight: 700, color: 'var(--color-red)',
                }}>
                  EXPIRED
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              {!isExpired ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-green)', fontSize: 14, fontWeight: 600 }}>
                  <CheckCircle size={16} />
                  Valid for {minutesLeft} more minutes
                </div>
              ) : (
                <p style={{ color: 'var(--color-red)', fontSize: 14, fontWeight: 600 }}>QR has expired</p>
              )}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              ⚠️ This QR is personal — do not share with others
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => generateMyQR(selectedSession)}
              disabled={loading}
            >
              <RefreshCw size={15} />
              {loading ? 'Generating...' : 'Refresh QR'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
