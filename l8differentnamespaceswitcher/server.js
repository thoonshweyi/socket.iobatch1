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

    socket.emit("welcome",{ns:"/",msg:"Welcome to default naespace."});

    socket.on("messageFromClient",(data)=>{
        console.log("Message from client on / : ",data);

        io.emit("messageFromServer",{
            ns:"/",
            text: data.getinputval
        });
    });

    
});


// Admin namespace "/admin"
const adminNS = io.of("/admin");

adminNS.on("connection", (socket) => {
    console.log("New client connected to /admin: ",  socket.id);

    socket.emit("welcome",{ns:"/admin",msg:"Welcome to Admin naespace."});

    
    socket.on("messageFromAdminClient",(data)=>{
        console.log("Message from Admin client on /admin : ",data);

        // broadcast to all admin clients
        // adminNS.emit("adminBroadcast",{
        //     ns:"/admin",
        //     text: data.getinputval
        // });

        // return to admin (sender)
        socket.emit("adminBroadcast",{
            ns:"/admin",
            text: data.getinputval
        });
    });


});


// Namespace Switcher

// root: sending namespace list
io.on('connection',(socket)=>{
    socket.emit('nsList',namespaces);
});

namespaces.forEach((ns)=>{
    const thisNS = io.of(ns.endpoint);

    thisNS.on("connection",(socket)=>{
        console.log(`Connected to ${ns.endpoint} : ${socket.id}`)
    
        socket.emit('welcome',{
            ns: ns.endpoint,
            msg: `Welcome to ${ns.name} namespace.`
        });

        socket.on("messageFromNSClient",(data)=>{
            console.log(`Message from ${ns.endpoint}: ${data}`);

            thisNS.emit('NsBroadcast',{
                ns: ns.endpoint,
                text: data.getinputval
            });
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