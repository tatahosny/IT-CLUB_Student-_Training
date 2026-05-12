import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: 400,
            padding: 32,
            position: 'relative',
            textAlign: 'center'
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>

          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: type === 'danger' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: type === 'danger' ? 'var(--color-red)' : 'var(--color-amber)'
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{title}</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
            {message}
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              style={{ flex: 1, height: 44 }}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
            <button
              className="btn btn-ghost"
              style={{ flex: 1, height: 44 }}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
