import React from 'react';

export const FormRow: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => <div className={`form-row ${className}`}>{children}</div>;

export const FormGroup: React.FC<{ label?: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className = '',
}) => (
  <div className={`form-group ${className}`}>
    {label ? <label>{label}</label> : null}
    {children}
  </div>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => {
  return <input className={`input ${className}`} {...rest} />;
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...rest }) => {
  return <select className={`select ${className}`} {...rest} />;
};
