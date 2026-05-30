import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import http from "http";

// Create express app
const app = express();
const port = 3000;

// __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// // Static folder
app.use(express.static(path.join(__dirname,"public")));


// Start http server
const server = http.createServer(app);




// Initialize Socket.IO Before http listen()
// method 1
// const io = new Server(server);

// method 1 (origin)
const io = new Server(server,{
    cors:{
        origin:`http://localhost:${port}`,
        methods: ["GET","POST"]
    }
});


const rooms = ["Sales","Marketing","HR","Warehouse","IT"];
// Start Helper function

// End Helper funtion

io.on("connection",(socket)=>{
    console.log("Connected: ", socket.id);

    socket.data.username = `User-${socket.id.slice(0,4)}`;
    socket.data.currentRoom = null;
    
    // send room list
    socket.emit('roomList',rooms);

    // Set profile

    // Join room
        // leave old room

        // join new room
        
        // callback

    // chat Message

    // Typing

    // Disconect
});


// Start the server
server.listen(port,()=>{
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`Dahboard listening on http://localhost:${port}/dashboard`);    
})