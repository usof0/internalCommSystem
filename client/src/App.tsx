
import ChatArea from './components/ChatArea/ChatArea';
import Sidebar from './components/Sidebar/Sidebar';



function App() {
  // const [count, setCount] = useState(0)

  return (
    <div className="flex flex-row max-h-screen max-w-screen">
      {/* <ControlBar/> */}
      <Sidebar className="flex flex-col min-w-70 max-w-100 mx-3"/>
      <ChatArea className="flex flex-col grow"/>
    </div>

  )
}

export default App;
