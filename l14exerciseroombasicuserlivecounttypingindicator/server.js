// => Method 2 (using socket)

import express from "express";
import {Server} from "socket.io";

import path from "path";
import { fileURLToPath } from "url";

import {namespaces} from "./data/namespace.js";

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

// Initialize Socket.IO After express.listen
// method 1
// const io = new Server(expressServer);

// method 1 (origin)
const io = new Server(expressServer,{
    cors:{
        origin:`http://localhost:${port}`,
        methods: ["GET","POST"]
    }
});

// Helper function
async function emitRoomCount(roomName){
    if(!roomName) return;

    const arrsockets = await io.in(roomName).fetchSockets();
    const count = arrsockets.length;

    // io.to(roomName).emit('roomUsers',{
    //     roomname: roomName,
    //     count 
    // })

    io.in(roomName).emit('roomUsers',{
        roomname: roomName,
        count 
    })
}


// Default namespace "/", leave(), join(), fetchSockets()
io.on("connection", (socket) => {
    // console.log("New client connected to /: ",  socket.id);

    // room join Handler
    socket.on('joinRoomFromClient',async (roomName,callback)=>{
        // console.log(socket);
        // console.log("Before Join Print = ",socket.rooms); // Previous room // Set(1) { 'SSADtFVvNWCeZiLdAAAD' } // User

        // // console.log(callback); // [Function (anonymous)]



        // => method 1

        // // leave all previous room except it's own room
        // for(const room of socket.rooms){
        //     // console.log(room);
        //     if(room != socket.id) await socket.leave(room);
        // }

        // // joinnew room
        // await socket.join(roomName)

        // const socketinRoom = await io.in(roomName).fetchSockets(); // [{socket}]
        // const usercount = socketinRoom.length;

        // console.log("socketinRoom = ",socketinRoom);
        // console.log(`${socket.id} joined ${roomName}, Users Count: ${usercount}`);

        // if(typeof callback == "function"){
        //     callback(roomName,usercount);
        // }


        // // personal alert 
        // socket.emit('joinedRoomFromServer',roomName);
        // console.log(`${socket.id} joined ${roomName}`);

        // // console.log("After Join Print = ",socket.rooms); // After Join Print =  Set(2) { '2_kM1wRij8Q3YwXGAAAH', 'room1' } // current room
    

        // => method 2
        console.log("Previous Room = ", socket.data.currentRoom);
        try{    
            if(!roomName) return;

            // previous room
            const prevRoom = socket.data.currentRoom; // first join = data:{}, second join = data{currentRoom: "room1"}

            // leave all previous room
            if(prevRoom && prevRoom !== roomName){
                await socket.leave(prevRoom);
                await emitRoomCount(prevRoom); // update old room users (everyone see decrement)
            }

            // join new room
            if(socket.data.currentRoom !== roomName){
                await socket.join(roomName);
                socket.data.currentRoom = roomName; // noted = must be set custom room key/value in data
            }

            // update new room users(everyone sees increment)
            emitRoomCount(roomName);


            // callback
            if(typeof callback == "function"){
                const socketinRoom = await io.in(roomName).fetchSockets();
                const usercount = socketinRoom.length;

                callback(roomName,usercount);
            }

            
        // personal alert 
        socket.emit('joinedRoomFromServer',roomName);
        
        console.log(`${socket.id} joined ${roomName}`);

        }catch(err){
            console.error("joinRoomFromClient error: ",err);
        }

        console.log("Current Room = ", socket.data.currentRoom);

    })

    socket.on("typingFromClient",()=>{
        const rooms = [...socket.rooms];
        // console.log(rooms); // 0 = socket.id, 1= joined room
        let currentRoom = rooms[1];
        // console.log(currentRoom);


        socket.to(currentRoom).emit("typingFromServer",{
            from: socket.id
        });
    });


    socket.on("stoptypingFromClient",()=>{
        const rooms = [...socket.rooms];
        // console.log(rooms); // 0 = socket.id, 1= joined room
        let currentRoom = rooms[1];
        console.log(currentRoom);

        socket.to(currentRoom).emit("stoptypingFromServer",{
            from: socket.id
        });
    });

    socket.on("messageFromClient",(data)=>{
        // console.log(socket); // 
        console.log(socket.rooms); // Set(2) { 'EGlDdI7tQVL8oGjNAAAD', 'room1' }

        // Find the Room
        // // method 1
        // const rooms = [...socket.rooms];
        // // console.log(rooms); // 0 = socket.id, 1= joined room
        // let currentRoom = rooms[1];
        // console.log(currentRoom);


        // // method 2
        // const rooms = Array.from(socket.rooms);
        // // console.log(rooms); // 0 = socket.id, 1= joined room
        // let currentRoom = rooms[1];
        // console.log(currentRoom);

        // method 3
        const [socketid,currentRoom] = Array.from(socket.rooms);
        // console.log(currentRoom);

        if(!currentRoom) return;

        io.to(currentRoom).emit("messageFromServer",{
            room: currentRoom,
            from:socket.id,
            text: data.getinputval 
        });
    })

    
});




// Graceful Shutdown
process.on("SIGINT",()=>{
    console.log("SIGTERM received. Shutting down gracefully...");
    expressServer.close(()=>{
        console.log("Server closed.");
        process.exit(0);
    });
});
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