import React from 'react';

export const Card: React.FC<{
  className?: string;
  contentClassName?: string;
  actionsClassName?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({
  className = 'card',
  contentClassName = 'card-content',
  actionsClassName = 'card-actions',
  children,
  actions,
}) => {
  return (
    <div className={className}>
      <div className={contentClassName}>{children}</div>
      {actions ? <div className={actionsClassName}>{actions}</div> : null}
    </div>
  );
};
