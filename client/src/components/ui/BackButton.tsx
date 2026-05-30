import React from 'react';

type BackButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
  compact?: boolean;
};

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Назад',
  compact = false,
  className = '',
  ...props
}) => {
  const classes = ['back-button', compact ? 'back-button--compact' : '', className].filter(Boolean).join(' ');

  return (
    <button type="button" className={classes} aria-label={props['aria-label'] ?? label} {...props}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="back-button__icon">
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
      {!compact ? <span>{label}</span> : null}
    </button>
  );
};
