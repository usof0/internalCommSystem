import React from 'react';

type ButtonVariant = 'primary' | 'danger' | 'default';
type ButtonSize = 'sm' | 'md';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  loading?: boolean;
};

export const Button: React.FC<Props> = ({
  variant = 'default',
  size = 'md',
  block = false,
  loading = false,
  className = '',
  disabled,
  children,
  ...rest
}) => {
  const classes = [
    'btn',
    variant === 'primary' ? 'btn-primary' : '',
    variant === 'danger' ? 'btn-danger' : '',
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Загрузка...' : children}
    </button>
  );
};
