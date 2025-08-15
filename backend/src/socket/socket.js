import bcrypt from 'bcryptjs';

const rooms = new Map();


export default function (io) {
    io.on('connection', socket => {
        socket.on('joinRoom', ({ roomName, password }) => {
            try {
                const room = rooms.get(roomName);
                if (!room) {
                    socket.emit('error', 'room not found');
                    return;
                }
                const isValidPassword = bcrypt.compare(password, room.password);
                if (!isValidPassword) {
                    socket.emit('error', 'Invalid password');
                    return;
                }
                room.members.add(socket.id);
                room.members.forEach(peerId => {
                    if (peerId !== socket.id) {
                        io.to(peerId).emit('newMember', socket.id);
                    }
                });
                socket.roomId = roomName;
                socket.emit('success', `Joined room: ${roomName}`);
            } catch (error) {
                console.log(error);
                socket.emit('error', 'Internal server error');
            }
            socket.on('signal', ({ targetId, signal }) => {
                io.to(targetId).emit('sigmal', { sourceId: socket.id, signal });
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
    });
}