import { useState } from "react";
import "./App.css";
import socket from "../socket/socket";
import { useNavigate } from "react-router";
import { ToastContainer, toast ,Bounce } from 'react-toastify';

export default function App() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create");
  const [roomName, setRoomName] = useState("");
  const [password, setPassword] = useState("");

  const HandleCreateRoom = () => {
    try {
      socket.emit("createRoom", { roomName, password });
      socket.once("error", (message) => {
        error(message);
      });
      socket.once("InternalError", (message) => {
        error(message);
      });
      socket.once("success", () => {
        localStorage.setItem("password", password);
        navigate(`/${roomName}`);
      });

    } catch (error) {
      error("Failed to create room. Please try again.");
    }
  };

  const HandleJoinRoom = () => {
    try {
      socket.emit("joinRoom", { roomName, password });
      socket.once("error", (message) => {
        error(message);
      });
      socket.once("InternalError", (message) => {
       error(message);
      });
      socket.once("success", () => {
        localStorage.setItem("password", password);
        navigate(`/${roomName}`);
      });

    } catch (error) {
      error("An error occurred while joining the room.");
    }

  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomName) {
      error("Room name is required");
      return;
    }
    if (!password) {
      error("Password is required");
      return;
    }
    if (activeTab === "join") {
      HandleJoinRoom();
    } else {
      HandleCreateRoom();
    }
  };
  const error = (err) => {
    toast.error(err, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Bounce,
    });
  }

  return (<>
    <div className="fixed z-0 h-full w-full bg-slate-950"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]"></div></div>
    <div className="relative z-10 flex items-center justify-center min-h-screen min-w-screen p-10">
      <div className="w-md bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex">
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-3 text-center font-semibold cursor-pointer ${activeTab === "join"
              ? "bg-gradient-to-r from-blue-600 to-cyan-400 text-black"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
          >
            Join Room
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-3 text-center font-semibold  cursor-pointer ${activeTab === "create"
              ? "bg-gradient-to-r from-purple-500 to-pink-600 text-black"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
          >
            Create Room
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          <div>
            <div className="text-sm font-medium mb-1 text-white">Room Name</div>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="text-sm font-medium mb-1 text-white">Password</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className={`w-full py-2 mt-5 rounded-lg font-semibold cursor-pointer ${activeTab === "join"
              ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-black hover:opacity-90"
              : "bg-gradient-to-r from-purple-500 to-pink-500 text-black hover:opacity-90"
              }`}
          >
            {activeTab === "join" ? "Join Now" : "Create Room"}
          </button>
        </form>
      </div>
    </div>
    <ToastContainer
      stacked={true}
      position="top-center"
      autoClose={4000}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="dark"
      transition={Bounce}
    />
  </>
  );
}
