import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Monitor, Wifi, Clock, Users, Play, Square, QrCode, ArrowRight } from 'lucide-react';
import { sessionApi } from '../../api/adminApi';
import { Link } from 'react-router-dom';

export default function HRSessionControl() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['hr-sessions-monitor'],
    queryFn: () => sessionApi.getAll({ limit: 50 }).then(r => r.data.data),
    refetchInterval: 10000
  });

  const activeSessions = sessions?.filter(s => s.is_active) || [];

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>
          <span className="gradient-text-cyan">Operational Session Control</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
          Live monitoring of active training modules and attendance windows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
        {isLoading ? [...Array(3)].map((_, i) => (
          <div key={i} style={{ height: 220, borderRadius: 24 }} className="animate-shimmer glass-card" />
        )) : sessions?.map((session, i) => (
          <motion.div 
            key={session.id} 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: i * 0.05 }}
            className="glass-card" 
            style={{ 
              padding: 24, 
              border: session.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--glass-border)',
              background: session.is_active ? 'linear-gradient(135deg, rgba(16,185,129,0.05), transparent)' : 'transparent'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {session.is_active ? <Wifi size={16} className="text-green-400 animate-pulse" /> : <Clock size={16} className="text-gray-400" />}
                <span style={{ fontSize: 11, fontWeight: 800, color: session.is_active ? 'var(--color-green)' : 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {session.is_active ? 'Streaming Now' : 'Scheduled / Ended'}
                </span>
              </div>
              <span className="badge badge-gray">{session.session_type}</span>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{session.title}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={14} /> {session._count?.attendances || 0} Students Present
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Monitor size={14} /> {session.room_number || 'TBD Room'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <Link to={`/hr/sessions/${session.id}`} className="btn btn-primary" style={{ flex: 1, height: 40, fontSize: 13 }}>
                Control Center <ArrowRight size={14} style={{ marginLeft: 6 }} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
