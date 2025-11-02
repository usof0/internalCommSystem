// import { useState } from 'react'


import Sidebar from './components/Sidebar/Sidebar';

// import ChatPreview from './components/common/ChatPreview';


function App() {
  // const [count, setCount] = useState(0)

  return (
    <div className="flex flex-row">

      <Sidebar/>
      <div className="bg-gray-600 min-w-90"></div>
    </div>

  )
}

export default App;
