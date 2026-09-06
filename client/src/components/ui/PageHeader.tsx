import React from 'react';

export const PageHeader: React.FC<{
  title: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ title, actions, className = '', style }) => {
  return (
    <div className={`page-header ${className}`} style={style}>
      <div style={{ flex: 1 }}>{typeof title === 'string' ? <h1>{title}</h1> : title}</div>
      {actions ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div> : null}
    </div>
  );
};
