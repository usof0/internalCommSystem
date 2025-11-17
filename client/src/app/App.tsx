import { RouterProvider } from 'react-router-dom';
import { router } from './router';

import { ChatArea } from '@/features/ChatArea';
import { Sidebar } from '@/features/Sidebar';
import './App.css'


function App() {

  return (
    <div className="flex flex-row max-h-screen max-w-screen">
      {/* <ControlBar/> */}
      <Sidebar className="flex flex-col min-w-70 max-w-100 mx-3"/>
      <ChatArea className="flex flex-col grow"/>
    </div>

  );
  // return <RouterProvider router={ router }/>
}

export default App;
