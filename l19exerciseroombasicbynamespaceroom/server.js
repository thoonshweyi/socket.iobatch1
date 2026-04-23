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

// Start Helper Function
function emitNamespaceCount(namespaceInstance,endpoint){
    namespaceInstance.emit("userCountFromServerToNS",{
        ns: endpoint,
        count: namespaceInstance.sockets.size
    });
}

// room users count inside namespace
function getRoomCount(namespaceInstance,rooName){
    if(!roomName) return;

    return ;
}

function emitRoomCount(namespaceInstance,roomName){
    if(!roomName) return;

    const arrsockets = namespaceInstance.in(roomName).fetchSockets();
    const count = arrsockets.length;

    // namespaceInstance.to(roomName).emit('roomUsers',{
    //     roomname: roomName,
    //     count 
    // })

    namespaceInstance.in(roomName).emit('roomUsers',{
        roomname: roomName,
        count 
    })
}
// End Helper Function

// Root namespaces "/" Used only to send namespace list
io.on("connection",(socket)=>{
    // console.log("Client connected to root /", socket.id);

    socket.emit('nsList',namespaces);
})

// Create socket.io namespaces dynamically
namespaces.forEach(namespace=>{
    const thisNS = io.of(namespace.endpoint);

    thisNS.on('connection',(socket)=>{
        console.log(`Connected to ${namespace.endpoint}: `,socket.id);

        // Welcome message per namespace
         socket.emit("welcome",{
            ns: namespace.endpoint,
            msg: `Server reply: Welcome to ${namespace.name}.`
         })

        //  Send room list of this namespace
        socket.emit('roomList',namespace.rooms);


        // send user count to everyone in this namespace
        emitNamespaceCount(thisNS,namespace.endpoint);

        // Set profile

        // Join room
            // leave old room
            // join new room
            // update room user countn
            // callback


        // Room Message

        // Typing in current room only

        // Disconnect
            // update namespace user count
            // update room user count

        //  Chat Message Handler with current namespace
        socket.on("messageFromClientToNS",(data)=>{
            // console.log(`Message in ${namespace.endpoint}: `,data);

            socket.broadcast.emit('messageFromServerToNS',{
                ns: namespace.name,
                from: socket.id,
                text: data.getinputval,
                at: new Date().toLocaleTimeString()
            });

        });

        // Typing from client
        socket.on("typingFromClient",()=>{
            socket.broadcast.emit("typingFromServerNS",{
                ns: namespace.endpoint,
                from: socket.id
            });
        });

        // Stop typing from client
        socket.on("stopTypingFromClientNS",()=>{
            socket.broadcast.emit("stoptypingFromServerNS",{
                ns: namespace.endpoint,
                from: socket.id
            });
        });

        
        socket.on('disconnect',(reason)=>{
            console.log(`Client ${socket.id} disconnected from ${namespace.endpoint}. Reason: `, reason);

            // after disconnect, send user count to everyone in this namespace
            emitNamespaceCount(thisNS,namespace.endpoint);

            // remove typing indicator for disconnected user
            socket.broadcast.emit("stoptypingFromServerNS",{
                ns: namespace.endpoint,
                from: socket.id
            });
        });
    })
})

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