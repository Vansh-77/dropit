

const rooms = new Map();

export default function (io) {
    io.on('connection', socket => {
        socket.on("roomExists", ({ roomName }) => {
            if (rooms.has(roomName)) {
                socket.emit("roomExists", true);
            }
        });
        socket.on('joinRoom', ({ roomName, password }) => {
            try {
                const room = rooms.get(roomName);
                if (!room) {
                    socket.emit('error', 'Room not found');
                    return;
                }
                if (room.password !== password) {
                    socket.emit('error', 'Invalid password');
                    return;
                }
                const existingMembers = [...room.members];
                socket.emit("initPeers", existingMembers);

                room.members.add(socket.id);
                socket.roomId = roomName;

                room.members.forEach(peerId => {
                    if (peerId !== socket.id) {
                        io.to(peerId).emit('newMember', socket.id);
                    }
                });
                
                socket.emit('success', `Joined room: ${roomName}`);
                console.log(rooms);
            } catch (error) {
                console.log(error);
                socket.emit('InternalError', 'Internal server error');
            }
        });

        socket.on('createRoom', ({ roomName, password }) => {
            try {
                const room = rooms.get(roomName);
                if (room) {
                    socket.emit('error', 'Room Name already exists');
                    return;
                }
                rooms.set(roomName, {
                    members: new Set([socket.id]),
                    password: password,
                });
                socket.roomId = roomName;
                socket.emit('success', `Created room: ${roomName}`);
                console.log(rooms);
            } catch (error) {
                console.log(error);
                socket.emit('internalError', 'Internal server error');
            }
        });

        socket.on('signal', ({ targetId, signal }) => {
            io.to(targetId).emit('signal', { sourceId: socket.id, signal });
        });

        socket.on('disconnect', () => {
            const room = rooms.get(socket.roomId);
            if (room) {
                room.members.delete(socket.id);
                if (room.members.size === 0) {
                    rooms.delete(socket.roomId);
                }
                room.members.forEach(peerId => {
                    io.to(peerId).emit('memberLeft', socket.id);
                });
            }
        });
    });
};