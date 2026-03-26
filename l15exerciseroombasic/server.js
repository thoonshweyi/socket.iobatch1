// => Method 2 (using socket)

import express from "express";
import {Server} from "socket.io";

import path from "path";
import { fileURLToPath } from "url";

import {namespaces} from "./data/namespace.js";

import { initSocket } from "./socket/main.js";

// Create express app
const app = express();
const port = 3000;

// __dirname from ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Static folder
app.use(express.static(path.join(__dirname,"public"))); // now you can run http://localhost:3000/index.html

// Route for home page = index.html
app.get("/",(req,res)=>{
    // res.sendFile(path.join(__dirname,"public/index.html"));
    res.sendFile(path.join(__dirname,"public","index.html"));
});


// Start express server
const expressServer  = app.listen(port,()=>{
    console.log(`Server is listening on http://localhost:${port} `);
});


// Init socket.io
const io = initSocket(expressServer,port);

// Graceful Shutdown
process.on("SIGINT",()=>{
    console.log("SIGTERM received. Shutting down gracefully...");
    expressServer.close(()=>{
        console.log("Server closed.");
        process.exit(0);
    });
});
// npm run dev
// nodemon server.js

// SIGINT = Ctrl+C
// SIGHUP = Terminal Close


// 🔹 What Is the Default Room?

// When a client connects:

// io.on("connection", (socket) => {
//     console.log(socket.id);
// });

// Socket.IO automatically creates a room with the same name as socket.id
// and makes the socket join that room.

// This is called the default room (or private room).

// You do NOT create it.
// Socket.IO creates it automatically.


// 🔹 What io.in(roomName) Does

// io → the main Socket.IO server instance

// .in(roomName) → select a room

// Then you usually chain .emit() to send an event

// 🔹 Difference From Other Methods
// 1️⃣ socket.to(roomName).emit()

// Sends to everyone in the room

// ❌ Excludes the sender

// 2️⃣ io.in(roomName).emit()

// Sends to everyone in the room

// ✅ Includes the sender

// 🔹 Why Two Methods Exist?

// It’s just naming preference / readability.

// to() → sounds natural when sending something

// "Send this TO roomA"

// in() → sounds natural when selecting a room

// "Broadcast IN roomA"

// Internally, they return the same BroadcastOperator object.