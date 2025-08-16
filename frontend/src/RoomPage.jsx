import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import  socket  from "../socket/socket"; 

export default function RoomPage() {
  const { roomName } = useParams();
  const [socketId, setSocketId] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const inputRef = useRef(null);

   useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "";
            socket.disconnect();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    if (socket.id) setSocketId(socket.id);
    socket.on("connect", () => setSocketId(socket.id));
    return () => socket.off("connect");
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    inputRef.current.click();
  };

  return (<>
    <div className="fixed z-0 h-full w-full bg-slate-950"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]"></div></div>
    <div className="relative h-screen w-full text-white overflow-hidden">
      <div className="relative flex items-center justify-center h-full">
        <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 space-y-6">
          <h1 className="text-xl font-bold">Room: {roomName}</h1>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-64 cursor-pointer transition ${
              dragActive
                ? "border-blue-400 bg-blue-500/10"
                : "border-gray-600 bg-gray-700/40 hover:bg-gray-700/60"
            }`}
            onClick={handleBrowseClick}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
            />
            {!selectedFile ? (
              <div className="text-center">
                <p className="text-lg font-medium">Drag & Drop your file here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium text-green-400">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB selected
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div></>
  );
}
