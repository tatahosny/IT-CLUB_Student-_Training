import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { 
  QrCode, RefreshCw, Clock, AlertTriangle, CheckCircle, ArrowLeft, Calendar, Info, UserCheck, CheckCheck
} from "lucide-react";
import QRCode from "qrcode";
import { useAuthStore } from "@/store/authStore";
import { attendanceApi, sessionApi } from "@/api/adminApi";

export default function RecordAttendance() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [selectedSession, setSelectedSession] = useState(null)
  const [qrImage, setQrImage] = useState('')
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // Fetch all sessions
  const { data: allSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['student-sessions'],
    queryFn: () => sessionApi.getAll().then(r => r.data.data),
  })

  // Poll attendance history to check for confirmation
  const { data: attendanceHistory } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: () => attendanceApi.getHistory().then(r => r.data.data),
    refetchInterval: (data) => {
      // If we are waiting for a scan or just checking status, poll every 3 seconds
      if (selectedSession && !isConfirmed) return 3000;
      return false;
    }
  })

  // Filter active sessions for the student
  const sessions = useMemo(() => {
    if (!allSessions) return [];
    return allSessions.filter(s => 
      s.is_active && (!s.group_id || s.group_id === user?.group_id)
    );
  }, [allSessions, user]);

  // Check if already attended the current selected session or any active session
  const checkAttendanceStatus = useMemo(() => {
    if (!attendanceHistory) return null;
    return attendanceHistory.find(a => a.is_present && sessions.some(s => s.id === a.session_id));
  }, [attendanceHistory, sessions]);

  useEffect(() => {
    if (checkAttendanceStatus && selectedSession === checkAttendanceStatus.session_id) {
      setIsConfirmed(true);
      toast.success('تم تأكيد حضورك بنجاح! 🎉');
    }
  }, [checkAttendanceStatus, selectedSession]);

  const generateMyQR = async (sessionId) => {
    if (!sessionId) return;
    setLoading(true); setQrImage(''); setQrData(null); setIsConfirmed(false);
    try {
      const res = await attendanceApi.getMyQR(sessionId); 
      const token = res.data.data; 
      setQrData(token)
      const dataUrl = await QRCode.toDataURL(`IT-QR:${token.qr_code}`, { 
        width: 300, 
        margin: 2,
        color: {
          dark: '#00d4ff',
          light: '#060b18'
        }
      });
      setQrImage(dataUrl); setSelectedSession(sessionId);
    } catch (e) { 
      const errorMsg = e.response?.data?.message || e.message || 'Failed to generate QR';
      toast.error(errorMsg);
    } finally { setLoading(false) }
  }

  const isExpired = qrData && new Date() > new Date(qrData.expires_at)
  const minutesLeft = qrData ? Math.max(0, Math.round((new Date(qrData.expires_at) - new Date()) / 60000)) : 0

  // If already confirmed for the selected session
  if (isConfirmed) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ padding: 60, border: '1px solid var(--color-green)' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(155, 234, 39, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'var(--color-green)' }}>
            <CheckCircle size={60} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>تم تأكيد الحضور</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 16, marginBottom: 40 }}>
            لقد تم تسجيل حضورك بنجاح في محاضرة: <br/>
            <strong style={{ color: 'var(--color-cyan)', fontSize: 20 }}>{sessions.find(s => s.id === selectedSession)?.title}</strong>
          </p>
          <button onClick={() => navigate('/student')} className="btn btn-primary" style={{ width: '100%', height: 56, fontSize: 18, fontWeight: 800 }}>
            <CheckCheck size={20} style={{ marginRight: 8 }} /> تم
          </button>
        </motion.div>
      </div>
    )
  }

  // If already attended an active session (but page just opened)
  if (!selectedSession && checkAttendanceStatus) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: 48 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(0, 212, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--color-cyan)' }}>
            <UserCheck size={40} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>مسجل مسبقاً</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
            لقد قمت بالفعل بتسجيل حضورك في محاضرة اليوم: <br/>
            <strong style={{ color: 'var(--color-cyan)' }}>{checkAttendanceStatus.session?.title}</strong>
          </p>
          <button onClick={() => navigate('/student')} className="btn btn-ghost" style={{ width: '100%' }}>العودة للرئيسية</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 60 }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/student')} className="btn btn-ghost" style={{ width: 40, height: 40, padding: 0, borderRadius: '50%' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900 }} className="font-orbitron gradient-text-brand">تسجيل الحضور</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>قم بتوليد رمز الـ QR الخاص بك لتسجيل حضورك في المحاضرة</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 40, display: 'flex', flexWrap: 'wrap', gap: 40, alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,212,255,0.15)', background: 'linear-gradient(135deg, rgba(6,11,24,0.8), rgba(12,20,40,0.8))', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 300, height: 300, background: 'rgba(0,212,255,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
        
        <div style={{ flex: '1 1 300px', textAlign: 'center' }}>
          <div style={{ marginBottom: 32, padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, letterSpacing: '2px', fontWeight: 700 }}>ACADEMIC ID</div>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '4px', color: 'var(--color-cyan)', textShadow: '0 0 20px rgba(0,212,255,0.3)' }}>{user?.academic_number}</div>
          </div>
          
          {sessionsLoading ? (
             <div className="animate-shimmer" style={{ height: 100, borderRadius: 16 }} />
          ) : sessions?.length > 0 && !qrImage && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 10 }}>اختر المحاضرة الجارية الآن لتوليد الكود:</p>
               {sessions.map(s => (
                 <button key={s.id} onClick={() => generateMyQR(s.id)} className="btn btn-primary" style={{ width: '100%', height: 48 }}>
                   {s.title} <span className="badge badge-green" style={{ marginLeft: 8 }}>LIVE</span>
                 </button>
               ))}
            </div>
          )}
          
          {!sessionsLoading && sessions?.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Clock size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.5 }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>لا توجد محاضرات أو ورش جارية حالياً</h3>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 10, maxWidth: 300, margin: '10px auto 0' }}>
                يمكنك توليد رمز الحضور فقط عندما تبدأ المحاضرة رسمياً من قبل المحاضر.
              </p>
              <button onClick={() => navigate('/student')} className="btn btn-ghost" style={{ marginTop: 24 }}>
                العودة للرئيسية
              </button>
            </div>
          )}
        </div>

        <AnimatePresence>
          {qrImage && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ flex: '0 0 auto' }}>
              <div style={{ padding: 20, borderRadius: 24, background: '#fff', border: isExpired ? '4px solid var(--color-red)' : '4px solid var(--color-cyan)', boxShadow: '0 0 40px rgba(0,212,255,0.2)' }}>
                <img src={qrImage} alt="QR" style={{ width: 240, height: 240, display: 'block', opacity: isExpired ? 0.2 : 1 }} />
                {isExpired && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-red)', fontWeight: 900, fontSize: 24 }}>EXPIRED</div>}
              </div>
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: isExpired ? 'var(--color-red)' : 'var(--color-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {isExpired ? <AlertTriangle size={18} /> : <RefreshCw className="spin" size={18} />}
                  {isExpired ? 'QR Expired' : `Waiting for scan... (${minutesLeft}m left)`}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 12, fontSize: 12 }} onClick={() => generateMyQR(selectedSession)} disabled={loading}>
                  <RefreshCw size={14} style={{ marginRight: 6 }} /> {loading ? 'Wait...' : 'Generate New QR'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: 40 }} className="glass-card">
         <div style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
               <Info size={20} className="text-cyan" />
               كيفية الاستخدام؟
            </h3>
            <ul style={{ color: 'var(--color-text-secondary)', fontSize: 14, display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 20 }}>
               <li>اختر المحاضرة الجارية حالياً من القائمة أعلاه.</li>
               <li>أظهر رمز الـ QR الناتج للمحاضر أو المنسق (Mentor).</li>
               <li>سيتم تحديث هذه الصفحة تلقائياً بمجرد مسح الكود بنجاح.</li>
               <li>الكود صالح لفترة زمنية محدودة وسيتم تجديده تلقائياً عند الحاجة.</li>
               <li>لا تشارك رمز الـ QR الخاص بك مع أي شخص آخر.</li>
            </ul>
         </div>
      </div>
    </div>
  )
}
