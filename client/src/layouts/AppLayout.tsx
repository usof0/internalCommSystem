import React from 'react';
import { Outlet } from 'react-router-dom';
import { NotificationRouteSync } from '../components/NotificationRouteSync';
import { TopBar } from './TopBar';

export const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      {/* <Sidebar /> */}
      <div className="app-main">
        <TopBar />
        <NotificationRouteSync />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
