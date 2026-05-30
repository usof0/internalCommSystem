import React from 'react';

function initialsFrom(name?: string, email?: string) {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    const res = (a + b).toUpperCase();
    if (res) return res;
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export const Avatar: React.FC<{
  src?: string | null;
  name?: string;
  email?: string;
  size?: number; // px
  className?: string;
}> = ({ src, name, email, size = 40, className = '' }) => {
  const fallback = initialsFrom(name, email);

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? email ?? 'avatar'}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
        onError={(e) => {
          // hide broken image -> fallback below not possible in same render, but keeps UI ok
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--primary)',
        color: 'var(--text-on-primary)',
        fontSize: Math.max(12, Math.floor(size * 0.35)),
        fontWeight: 600,
      }}
    >
      {fallback}
    </div>
  );
};
