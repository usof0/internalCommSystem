import React from 'react';

export const ProfileInfoItem: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = 'profile-info-item', children }) => {
  return <div className={className}>{children}</div>;
};
