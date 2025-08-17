import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import socket from "../socket/socket";
import Peer from "simple-peer";
import { QRCodeSVG } from "qrcode.react";
import { ToastContainer, toast, Bounce } from 'react-toastify';

export default function RoomPage() {
    const { roomName } = useParams();
    const [socketId, setSocketId] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [roomJoined, setroomJoined] = useState(false);
    const [roomExists, setroomExists] = useState(false);
    const [initialrender, setinitialrender] = useState(true);
    const peersRef = useRef({});

    const inputRef = useRef(null);

    useEffect(() => {
        if (initialrender) {
            const params = new URLSearchParams(window.location.search);
            const passwordFromUrl = params.get("password");

            if (passwordFromUrl) {
                localStorage.setItem("password", passwordFromUrl);
                handleJoinRoom();
                setinitialrender(false);
            } else {
                const password = localStorage.getItem("password");
                if (password) {
                    setroomJoined(true);
                    setinitialrender(false);
                }
            }
        }
    }, [])

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "";
            socket.disconnect();
            localStorage.clear();
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
        socket.on("connect", () => {
            setSocketId(socket.id);
        });
        socket.emit("roomExists", { roomName });
        socket.on("roomExists", (exists) => {
            if (exists) {
                setroomExists(true);
            }
            else {
                setroomExists(false);
            }
        })
        socket.on("initPeers", existingMembers => {
            existingMembers.forEach((peerId) => {
                const peer = createPeer(peerId, true);
                peersRef.current[peerId] = peer;
            })
        })
        socket.on('newMember', peerId => {
            if (!peersRef.current[peerId]) {
                const peer = createPeer(peerId, false)
                peersRef.current[peerId] = peer;
            }
        });

        socket.on("signal", ({ sourceId, signal }) => {
            if (peersRef.current[sourceId]) {
                peersRef.current[sourceId].signal(signal);
            }
        });

        socket.on('memberLeft', peerId => {
            if (peersRef.current[peerId]) {
                peersRef.current[peerId].destroy();
                delete peersRef.current[peerId];
            }
        });
        return () => {
            socket.off("connect");
            socket.off("initPeers");
            socket.off("newMember");
            socket.off("signal");
            socket.off("memberLeft");
        }
    }, []);

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

    const createPeer = (peerId, initiator) => {
        const peer = new Peer({ initiator: initiator, trickle: false });

        peer.on('signal', signal => {
            socket.emit('signal', { targetId: peerId, signal });
        });

        peer.on('data', data => {
            handleFileMessage(peerId, data);
        });

        // peer.on('connect', () => {
        //     console.log('Connected to', peerId);
        // });
        return peer;
    }

    const sendFile = (file) => {
        const reader = new FileReader();

        reader.onload = () => {
            const meta = JSON.stringify({
                type: "file-meta",
                fileName: file.name,
                size: file.size,
            });
            Object.values(peersRef.current).forEach(peer => peer.send(meta));

            Object.values(peersRef.current).forEach(peer => peer.send(reader.result));

            const endMsg = JSON.stringify({ type: "file-end" });
            Object.values(peersRef.current).forEach(peer => peer.send(endMsg));
        };

        reader.readAsArrayBuffer(file);
    };
    const fileBufferRef = {};
    const handleFileMessage = (peerId, data) => {
        if (data instanceof Uint8Array) {
            const text = new TextDecoder().decode(data);
            try {
                const msg = JSON.parse(text);
                if (msg.type === "file-meta") {
                    fileBufferRef[peerId] = {
                        fileName: msg.fileName,
                        size: msg.size,
                        chunks: [],
                    };
                    return;
                }

                if (msg.type === "file-end") {
                    const fileInfo = fileBufferRef[peerId];
                    if (fileInfo) {
                        const blob = new Blob(fileInfo.chunks);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = fileInfo.fileName;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                        delete fileBufferRef[peerId];
                    }
                    return;
                }
            } catch {
                if (fileBufferRef[peerId]) {
                    fileBufferRef[peerId].chunks.push(data);
                }
            }
        }
    };

    const handleJoinRoom = () => {
        try {
            const password = localStorage.getItem("password");
            socket.emit("joinRoom", { roomName, password });
            socket.once("error", (message) => {
                error(message);
                if (message === "Room not found") {
                    setroomExists(false);
                }
            })
            socket.once("InternalError", (message) => {
                error(message);
            });
            socket.once("success", () => {
                setroomJoined(true);
            });

        } catch (error) {
            error("An error occurred while joining the room.");
        }

    }
    const handleCreateRoom = () => {
        try {
            const password = localStorage.getItem("password");
            if (!password) {
                error("Please enter a password to create a room.")
                return;
            }
            socket.emit("createRoom", { roomName, password });
            socket.once("error", (message) => {
                error(message);
                setroomExists(true);
            });
            socket.once("InternalError", (message) => {
                alert(message);
            });
            socket.once("success", () => {
                setroomExists(true);
                setroomJoined(true);
            });

        } catch (error) {
            error("Failed to create room. Please try again.");
        }
    };

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
            sendFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            sendFile(e.target.files[0]);
        }
    };

    const handleBrowseClick = () => {
        inputRef.current.click();
    };
    const password = localStorage.getItem("password");
    const roomUrl = `${window.location.origin}/${roomName}?password=${encodeURIComponent(password)}`;

    return (<>
        <div className="fixed z-0 h-full w-full bg-slate-950"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,#3e3e3e,transparent)]"></div></div>
        <div className="relative h-screen w-full text-white">
            {roomExists ? roomJoined ?
                <div className="relative flex items-center justify-center h-full px-10">
                    <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-xl font-bold">Room: {roomName}</h1>
                            <QRCodeSVG value={roomUrl} size={150} />
                        </div>
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-64 cursor-pointer transition ${dragActive
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
                : <div className="relative flex items-center justify-center h-full">
                    <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 space-y-6">
                        <h1 className="text-xl font-bold">Room: {roomName}</h1>
                        <div className="text-center text-red-500">
                            <p className="text-lg font-medium">This room requires a password to join.</p>
                            <p className="text-sm">Please enter the password to access the room.</p>
                        </div>
                        <div>
                            <input
                                type="password"
                                placeholder="Enter Room Password"
                                className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={(e) => localStorage.setItem("password", e.target.value)}
                            />
                        </div>
                        <button
                            className="w-full p-3 bg-blue-500 rounded-lg text-white hover:bg-blue-600"
                            onClick={handleJoinRoom}
                        >
                            Join Room
                        </button>
                    </div>
                </div> : <div className="relative flex items-center justify-center h-full">
                <div className="w-full max-w-2xl bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 space-y-6">
                    <h1 className="text-xl font-bold">Room: {roomName}</h1>
                    <div className="text-center text-red-500">
                        <p className="text-lg font-medium">This room doesn't exist</p>
                        <p className="text-sm">Please enter password to create the room.</p>
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Enter Room Password"
                            className="w-full p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => localStorage.setItem("password", e.target.value)}
                        />
                    </div>
                    <button
                        className="w-full p-3 bg-pink-500 rounded-lg text-white hover:bg-pink-600 cursor-pointer"
                        onClick={handleCreateRoom}
                    >
                        Create Room
                    </button>
                </div>
            </div>}
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
