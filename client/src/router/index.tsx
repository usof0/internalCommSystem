import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ChatPage } from '../pages/ChatPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TasksPage } from '../pages/TasksPage';
import { TaskDetailsPage } from '../pages/TaskDetailsPage';
import { EventsPage } from '../pages/EventsPage';
import { EventDetailsPage } from '../pages/EventDetailsPage';
import { PollsPage } from '../pages/PollsPage';
import { PollDetailsPage } from '../pages/PollDetailsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { AdminPage } from '../pages/admin/AdminPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { RegistrationRequestsPage } from '../pages/admin/RegistrationRequestsPage';
import { UserDetailsPage } from '../pages/admin/UserDetailsPage';
import { RolesPage } from '../pages/admin/RolesPage';
import { OrganizationsPage } from '../pages/admin/OrganizationsPage';
import { TagsPage } from '../pages/admin/TagsPage';
import { PositionsPage } from '../pages/admin/PositionsPage';
import { PasswordResetRequestsPage } from '../pages/admin/PasswordResetRequestsPage';
import { AuthBootstrap } from '../components/AuthBootstrap';
import { OrgDetailsPage } from '../pages/admin/OrgDetailsPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <AuthBootstrap>
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      </AuthBootstrap>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'tasks/:taskId',
        element: <TaskDetailsPage />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'events/:eventId',
        element: <EventDetailsPage />,
      },
      {
        path: 'polls',
        element: <PollsPage />,
      },
      {
        path: 'polls/:pollId',
        element: <PollDetailsPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'change-password',
        element: <ChangePasswordPage />,
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requirePermission="admin.panel.access">
            <AdminPage />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'users',
            element: <UsersPage />,
          },
          {
            path: 'users/registration-requests',
            element: <RegistrationRequestsPage />,
          },
          {
            path: 'password-reset',
            element: <PasswordResetRequestsPage />,
          },
          {
            path: 'users/:userId',
            element: <UserDetailsPage />,
          },
          {
            path: 'roles',
            element: <RolesPage />,
          },
          {
            path: 'organizations',
            element: <OrganizationsPage />,
          },
          {
            path: 'organizations/:orgId',
            element: <OrgDetailsPage />,
          },
          {
            path: 'tags',
            element: <TagsPage />,
          },
          {
            path: 'positions',
            element: <PositionsPage />,
          },
        ],
      },
    ],
  },
]);
