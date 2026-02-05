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

// Default namespace "/"
io.on("connection", (socket) => {
    console.log("New client connected to /: ",  socket.id);

    socket.on("messageFromClient",(data)=>{

        // 1. by socket (only back to sender) - parameter
        // socket.emit('messageFromServer',{from:"me by socket: ",text:data.text});

        // 2. by socket ( to everyone, including sender ) - variable
        // io.emit('messageFromServer',{from:"me by io: ",text:data.text});

        // 3. by broadcast (to everyone, exclude sender) -parameter
        socket.broadcast.emit('messageFromServer',{from:"me by broadcast: ",text:data.text})


    });

    
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










// 1️⃣ What is the second parameter?
// const io = new Server(expressServer, { ... });


// 👉 This { ... } is options for Socket.IO server
// 👉 It tells Socket.IO how it should behave

// Think of it like:

// “Dear Socket.IO, here are the rules you must follow.”

// 2️⃣ Why do we need this object?

// Because:

// Browser and server may be on different origins

// Browsers block connections for security (CORS)

// Socket.IO must be told who is allowed to connect

// 3️⃣ Your Code Explained
// const io = new Server(expressServer, {
//     cors: {
//         origin: `http://localhost:${port}`,
//         methods: ["GET", "POST"]
//     }
// });


// Let’s break it down 👇

// 4️⃣ cors (MOST IMPORTANT PART)
// What is CORS?

// CORS = Cross-Origin Resource Sharing

// Browser rule:

// “Don’t allow requests from another origin unless server allows it.”

// What is an “origin”?

// An origin is made of 3 parts:

// protocol + domain + port


// Example:

// http://localhost:3000


// If any part changes → different origin.

// 5️⃣ origin
// origin: `http://localhost:${port}`


// Means:

// ✅ Allow Socket.IO connections only from
// http://localhost:3000

// ✔ Your browser page
// ✔ Your Socket.IO client

// ❌ Other websites
// ❌ Other ports

// Common alternatives
// origin: "*"


// ⚠ Allows any website (not recommended for production)

// origin: ["http://localhost:3000", "http://127.0.0.1:3000"]


// Allow multiple origins

// 6️⃣ methods
// methods: ["GET", "POST"]


// Means:

// Which HTTP methods are allowed during handshake

// Why HTTP?
// Because Socket.IO starts with HTTP, then upgrades to WebSocket.

// ✔ GET → initial handshake
// ✔ POST → fallback (polling)

// 7️⃣ What happens internally?
// Step-by-step

// 1️⃣ Browser loads your page
// 2️⃣ io() tries to connect
// 3️⃣ Browser sends HTTP request
// 4️⃣ Socket.IO checks CORS rules
// 5️⃣ If origin matches → ✅ allow
// 6️⃣ Connection upgraded to WebSocket

// If origin is not allowed → ❌ blocked

// 8️⃣ Without This Config (Common Error)

// You’ll see error like:

// Access to XMLHttpRequest has been blocked by CORS policy


// This happens when:

// Client and server ports differ

// Different domains

// Different protocol (http vs https)