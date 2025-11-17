import { createBrowserRouter } from 'react-router-dom'

import { MainLayout, AuthLayout, ProfileLayout } from '@/app/layouts';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <div>Welcome / Empty state</div>,
      },
      {
        path: "chat",
        children: [
          {
            path: ":chatid", 
            element: <div>chat with id</div>,
          },
          {
            path: ":chatid/topic/:topicid",
            element: <div>topic messages</div>,
          },
        ],
      },
      {
        path: "profile",
        element: <ProfileLayout />,
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
  },
]);
