import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './app/store';
import { SocketManager } from './components/SocketManager';
import { router } from './router';
import './styles/main.css';

function App() {
  const theme = useSelector((state: RootState) => state.ui.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      <SocketManager />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
