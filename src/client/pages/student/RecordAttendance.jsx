import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { 
  QrCode, RefreshCw, Clock, AlertTriangle, CheckCircle, ArrowLeft, Calendar
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

  const { data: allSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['student-sessions'],
    queryFn: () => sessionApi.getAll().then(r => r.data.data),
  })

  const sessions = useMemo(() => {
    if (!allSessions) return [];
    return allSessions.filter(s => 
      s.is_active && (!s.group_id || s.group_id === user?.group_id)
    );
  }, [allSessions, user]);

  const generateMyQR = async (sessionId) => {
    if (!sessionId) return;
    setLoading(true); setQrImage(''); setQrData(null);
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
                  {isExpired ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                  {isExpired ? 'QR Expired' : `Valid for ${minutesLeft} mins`}
                </div>
                <button className="btn btn-ghost" style={{ marginTop: 12, fontSize: 12 }} onClick={() => generateMyQR(selectedSession)} disabled={loading}>
                  <RefreshCw size={14} style={{ marginRight: 6 }} /> {loading ? 'Wait...' : 'Refresh Token'}
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
               <li>الكود صالح لفترة زمنية محدودة وسيتم تجديده تلقائياً عند الحاجة.</li>
               <li>لا تشارك رمز الـ QR الخاص بك مع أي شخص آخر.</li>
            </ul>
         </div>
      </div>
    </div>
  )
}
