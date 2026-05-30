import React from 'react';
import { Button } from './Button';

export const Modal: React.FC<{
  open: boolean;
  title?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}> = ({ open, title, onClose, children, footer, maxWidth = 800 }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'color-mix(in srgb, var(--text-primary) 45%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2rem',
          maxWidth,
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || footer) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>{title}</div>
            <Button onClick={onClose}>Закрыть</Button>
          </div>
        )}

        {children}

        {footer ? <div style={{ marginTop: '1.5rem' }}>{footer}</div> : null}
      </div>
    </div>
  );
};
