import express from 'express';
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import socket from './socket/socket.js';
import "dotenv/config";

const app = express();

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.json());
app.use(cors());

app.use('/', (req, res) => {
    res.send("dropit backend is running");
});

socket(io);

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server is running on port ${process.env.PORT || 3000}`);
});