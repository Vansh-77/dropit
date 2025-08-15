import { useState } from 'react'
import './App.css'

function App() {
  
  const [Mode, setMode] = useState('join');

  return (
    <div className='flex flex-col justify-center items-center h-screen w-screen bg-neutral-900'>
      <div className='flex flex-col h-[70%] w-[40%] bg-neutral-700 rounded-3xl overflow-hidden'>
        <div className='flex h-15 text-center text-2xl cursor-pointer'>
          <div className='flex flex-1/2 items-center justify-center bg-red-500' onClick={() => {
            setMode('join');
          }}>
            <h1>
              Join Room
            </h1>
          </div>
          <div className='flex flex-1/2 items-center justify-center bg-fuchsia-600' onClick={() => {
            setMode('create');
          }}>
            <h1>
              Create Room
            </h1>
          </div>
        </div>
        <div>
          {Mode == 'join' && <h1>Join Room</h1>}
          {Mode == 'create' && <h1>Create Room</h1>}
        </div>
      </div>
    </div>
  )
}

export default App
