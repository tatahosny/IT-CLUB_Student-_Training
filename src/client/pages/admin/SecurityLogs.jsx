import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Shield, Activity, Clock, User, Monitor, Eye, Search, AlertTriangle, 
  ChevronRight, ChevronLeft, Filter, History, Key, LogIn
} from "lucide-react";
import { adminApi } from "../../api/adminApi";
import { ACTION_COLORS } from "../../utils/constants";

export default function SecurityLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "security";
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const { data: securityData, isLoading: securityLoading } = useQuery({
    queryKey: ['security-logs', page, activeTab],
    queryFn: () => adminApi.getSecurityLogs({ page, limit: 30 }).then(r => r.data),
    enabled: activeTab === 'security'
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-logs', page, activeTab],
    queryFn: () => adminApi.getActivityLogs({ page, limit: 30 }).then(r => r.data),
    enabled: activeTab === 'activity'
  });

  const logs = activeTab === 'security' ? securityData?.data || [] : activityData?.data || [];
  const meta = activeTab === 'security' ? securityData?.meta || {} : activityData?.meta || {};
  const isLoading = activeTab === 'security' ? securityLoading : activityLoading;

  const totalPages = Math.ceil((meta.total || 0) / 30);

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>
            <span className="gradient-text-brand">System Audit & Logs</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Monitor security events and user interactions across the platform.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--glass-border)', paddingBottom: 12 }}>
        <button 
          onClick={() => { setSearchParams({ tab: 'security' }); setPage(1); }}
          className={`btn btn-sm ${activeTab === 'security' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ gap: 8 }}
        >
          <Shield size={16} /> Security Events
        </button>
        <button 
          onClick={() => { setSearchParams({ tab: 'activity' }); setPage(1); }}
          className={`btn btn-sm ${activeTab === 'activity' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ gap: 8 }}
        >
          <Activity size={16} /> User Activity
        </button>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeTab === 'security' ? <Shield size={18} className="text-red-400" /> : <Activity size={18} className="text-cyan-400" />}
            {activeTab === 'security' ? 'Recent Security Threats & Access' : 'Detailed User Interaction Log'}
          </h3>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Showing {logs.length} of {meta.total || 0} entries
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              {activeTab === 'security' ? (
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>IP / Device</th>
                  <th>Description</th>
                </tr>
              ) : (
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target / Details</th>
                  <th>Context</th>
                </tr>
              )}
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => (
                    <td key={j}><div style={{ height: 16, borderRadius: 4 }} className="animate-shimmer" /></td>
                  ))}</tr>
                ))
              ) : logs.map((log) => (
                <tr key={log.id} style={{ transition: 'background 0.2s' }}>
                  <td style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{new Date(log.created_at).toLocaleTimeString()}</div>
                    <div>{new Date(log.created_at).toLocaleDateString()}</div>
                  </td>

                  {activeTab === 'security' ? (
                    <>
                      <td>
                        <span className={`badge ${ACTION_COLORS[log.action_type] || 'badge-gray'}`} style={{ textTransform: 'uppercase', fontSize: 10 }}>
                          {log.action_type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{log.user?.full_name || 'System'}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{log.user?.email || 'N/A'}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 11, fontFamily: 'monospace' }}>{log.ip_address || '—'}</div>
                        <div style={{ fontSize: 9, opacity: 0.6 }}>{log.device_id?.substring(0, 16)}...</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                        {log.description}
                        {log.action_type === 'fraud' && <AlertTriangle size={12} style={{ color: '#EF4444', marginLeft: 6, display: 'inline' }} />}
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{log.user?.full_name}</div>
                        <div style={{ fontSize: 9, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>{log.user?.role?.role_name}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {log.action === 'page_view' ? <Eye size={14} className="text-cyan-400" /> : 
                           log.action === 'action_search' ? <Search size={14} className="text-purple-400" /> :
                           log.action === 'login' ? <LogIn size={14} className="text-green-400" /> :
                           <Activity size={14} />}
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-primary)' }}>
                        <div style={{ 
                          padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', 
                          border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block' 
                        }}>
                          {log.description}
                        </div>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                         {log.action === 'page_view' ? 'Navigation' : log.action === 'action_search' ? 'Discovery' : 'System Event'}
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {logs.length === 0 && !isLoading && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No logs found for this period.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: 16, borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} /> Previous
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const p = i + 1;
                return (
                  <button 
                    key={p} 
                    onClick={() => setPage(p)}
                    style={{ 
                      width: 32, height: 32, borderRadius: 8, border: 'none', 
                      background: page === p ? 'var(--color-cyan)' : 'transparent',
                      color: page === p ? '#000' : '#fff', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
