import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import {BrowserRouter ,Routes ,Route} from "react-router";
import RoomPage from './RoomPage.jsx';
import { Buffer } from 'buffer'
import process from 'process'

window.Buffer = Buffer
window.process = process

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/:roomName" element={<RoomPage/>}/>
      </Routes>
    </BrowserRouter>
)
