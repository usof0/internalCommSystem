import React from 'react';

export const ProfileSectionHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className = 'profile-section-header', children }) => {
  return <div className={className}>{children}</div>;
};
