import React, { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RefreshCw, CheckCircle, AlertCircle, User, BookOpen, Clock, MapPin, Check, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { attendanceApi } from "@/api/adminApi";
import { useAuthStore } from "@/store/authStore";

export default function QRScanner({ onClose, sessionId }) {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const html5QrCodeRef = useRef(null);
  const { user: currentUser } = useAuthStore();
  const isStudent = currentUser?.role?.role_name === 'student';

  const stopScanner = async () => {
    if (html5QrCodeRef.current?.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  const startScanner = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      setIsPaused(false);
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        onScanSuccess,
        onScanFailure
      );
    } catch (err) {
      setError("Camera permission denied or not found");
      console.error(err);
    }
  };

  useEffect(() => {
    html5QrCodeRef.current = new Html5Qrcode("reader");
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    if (loading || previewData || isPaused) return;
    
    if (!decodedText.startsWith("IT-QR:")) {
      toast.error("تنسيق QR غير صالح");
      return;
    }

    setIsPaused(true);
    await stopScanner(); // Stop scanner immediately on success
    
    const qrCode = decodedText.split(":")[1];
    handleScan(qrCode);
  };

  const onScanFailure = (err) => {
    // Quietly fail
  };

  const handleScan = async (qrCode, confirm = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.scanQR({ 
        qrCode, 
        sessionId: sessionId ? parseInt(sessionId) : undefined,
        confirm: confirm
      });

      if (res.data.preview) {
        setPreviewData({ ...res.data.data, qrCode });
        toast.success("تم التعرف على الطالب! يرجى التأكيد.");
      } else {
        toast.success(res.data.message || "تم تسجيل الحضور بنجاح! ✅");
        setScanResult(res.data.data);
        
        if (!isStudent) {
          // If admin, show success then reset for next student after a short delay
          setTimeout(() => {
            setPreviewData(null);
            setScanResult(null);
            startScanner(); // Restart scanner for next student
          }, 1500);
        } else {
          setTimeout(onClose, 2000);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || "فشل المسح";
      setError(msg);
      toast.error(msg);
      // Restart scanner if it failed (unless it was a serious error)
      if (!isStudent) {
        setTimeout(startScanner, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (previewData) {
      handleScan(previewData.qrCode, true);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setError(null);
    startScanner(); // Resume scanning
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'rgba(5, 10, 20, 0.9)', backdropFilter: 'blur(10px)' }}
    >
      <div style={{ width: '100%', maxWidth: 450, background: 'rgba(11, 22, 34, 0.95)', border: '1px solid var(--glass-border)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 50px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', direction: 'rtl' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(18, 214, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-cyan)' }}>
              <Camera size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{previewData ? 'تأكيد الحضور' : 'مسح رمز الحضور'}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: 32, textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            {!previewData ? (
              <motion.div key="scanner" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div id="reader" style={{ width: '100%', borderRadius: 16, overflow: 'hidden', border: '2px solid var(--glass-border)', background: '#000' }} />
                
                {error && (
                  <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, direction: 'rtl' }}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div style={{ marginTop: 24 }}>
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }}>ضع رمز QR الخاص بالطالب داخل الإطار</p>
                  <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-cyan)' }} />
                    <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-cyan)', animationDelay: '0.2s' }} />
                    <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-cyan)', animationDelay: '0.4s' }} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="preview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ direction: 'rtl' }}>
                {/* Student Info Card */}
                <div style={{ padding: 24, borderRadius: 20, background: 'rgba(18, 214, 255, 0.05)', border: '1px solid rgba(18, 214, 255, 0.1)', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, textAlign: 'right' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--color-cyan), var(--color-lime))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#07111B', boxShadow: '0 8px 16px rgba(0,212,255,0.2)' }}>
                      {previewData.student.full_name?.[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800 }}>{previewData.student.full_name}</h4>
                      <div style={{ fontSize: 14, color: 'var(--color-cyan)', fontWeight: 600 }}>رقم أكاديمي: {previewData.student.academic_number}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--color-text-muted)' }}>
                      <BookOpen size={18} style={{ color: 'var(--color-lime)' }} />
                      <span><strong style={{ color: 'var(--color-text-primary)' }}>المحاضرة:</strong> {previewData.session.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--color-text-muted)' }}>
                      <User size={18} style={{ color: 'var(--color-lime)' }} />
                      <span><strong style={{ color: 'var(--color-text-primary)' }}>المحاضر:</strong> {previewData.session.instructors}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, color: 'var(--color-text-muted)' }}>
                      <Clock size={18} style={{ color: 'var(--color-lime)' }} />
                      <span><strong style={{ color: 'var(--color-text-primary)' }}>نوع الحضور:</strong> {previewData.attendanceType === 'first' ? 'الحضور الأول' : 'الحضور الثاني'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button 
                    onClick={handleConfirm} 
                    disabled={loading}
                    className="btn btn-primary" 
                    style={{ flex: 2, height: 52, fontSize: 16 }}
                  >
                    {loading ? <RefreshCw size={20} className="spin" /> : <><Check size={20} /> تأكيد الحضور</>}
                  </button>
                  <button 
                    onClick={handleCancel} 
                    disabled={loading}
                    className="btn" 
                    style={{ flex: 1, height: 52, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                  >
                    <XCircle size={20} /> إلغاء
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
