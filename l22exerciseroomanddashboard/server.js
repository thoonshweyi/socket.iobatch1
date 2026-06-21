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


const initrooms = ["Sales","Marketing","HR","Warehouse","IT"];

// Start Helper function
function getStats(){
    const roomstats = initrooms.map(initroom=>{
        const roomset = io.sockets.adapter.rooms.get(initroom);

        return {
            initroom,
            count: roomset ? roomset.size : 0
        }
    });

    return {
        rooms: roomstats,
        totalusers: io.engine.clientsCount // total socket users
    }
}

function emitstats(){
    io.emit('dashboard:stats',getStats());
}
// End Helper funtion

io.on("connection",(socket)=>{
    console.log("Connected: ", socket.id);

    // dashboard stats
    emitstats();

    socket.data.username = `User-${socket.id.slice(0,4)}`;
    socket.data.currentRoom = null;
    
    // send room list
    socket.emit('roomList',initrooms);

    // Set profile
    socket.on("setProfileFromClient",(data,callback)=>{
        const name = String(data?.name ?? "").trim().slice(0,20);

        if(!name){
            return callback?.({
                ok: false,
                message: "Name is required"
            })
        }

        socket.data.username = name;
        callback?.({
            ok: true,
            name,
            message: "Name Updated!"
        });
    });

    // Join room
    socket.on("joinRoomFromClient",(roomName,callback)=>{
        try{

            roomName = String(roomName || "").trim();
            if(!roomName){   
                return callback?.({
                    ok: false,
                    error: "Room Name required."
                });
            }

            if(!initrooms.includes(roomName)){   
                return callback?.({
                    ok: false,
                    error: "Invalid room name."
                });
            }

            const prevRoom = socket.data.currentRoom;

            // leave old room
            if(prevRoom && prevRoom !== roomName){

                socket.leave(prevRoom);

                emitstats();

                socket.to(prevRoom).emit('systemMessageFromServer',{
                    message: `${socket.data.username} left ${prevRoom}`
                });

            }

            
            // join new room
            if(socket.data.currentRoom !== roomName){
                socket.join(roomName);
                socket.data.currentRoom = roomName;
            }
            
            emitstats();

            // notify others in room
            socket.to(roomName).emit('systemMessageFromServer',{
                message: `${socket.data.username} joined ${roomName}`
            });

            // obj for response
            callback?.({
                ok: true,
                room: roomName,
                message: `Joined ${roomName}`
            });

        }catch(err){
            console.error("joinRoomFromClient error: ",err)
            callback?.({
                ok: false,
                error: "Joined Failed."
            })
        }
    })

    // chat Message
    socket.on("messageFromClient",(data,callback)=>{
        const room = socket.data.currentRoom;
        const username = socket.data.username;
        if(!room){
            return callback({ok:false, message: "Join a foom first"});
        }

        const text = String(data?.getinputval ?? "").trim();

        if(!text){
            return callback({ok:false,message: "Empty message"});
        }

        // server to room client for display
        io.to(room).emit('messageFromServer',{
            room,
            from: username,
            text: data.getinputval,
            at: new Date().toLocaleTimeString()
        });

        callback({ok:true});

    });


    // Admin Announcement Message
    socket.on("adminmessageFromClient",(data,callback)=>{
        const password = String(data?.password ?? "").trim();
        const text = String(data?.announcementtext ?? "").trim();

        if(password !== 'admin123'){
            return callback({ok:false,message: "Wrong admin password"});
        }

        if(!text){
            return callback({ok:false,message: "Announcement message is required"});
        }

        // server to room client for display
        io.emit('adminmessageFromServer',{
            text,
            at: new Date().toLocaleTimeString()
        });

        callback({ok:true,message: "Announcement sent."});

    });

    // Typing
    // Typing from client
    socket.on("typingFromClient",()=>{
        const room = socket.data.currentRoom;
        if(!room) return;

        socket.to(room).emit("typingFromServer",{
            from: socket.data.username
        });
    });

    // Stop typing from client
    socket.on("stopTypingFromClient",()=>{
        const room = socket.data.currentRoom;
        if(!room) return;

        socket.to(room).emit("stoptypingFromServerNS",{
            from: socket.data.username
        });
    });

    // Disconect
     
    socket.on('disconnect',(reason)=>{
        console.log(`Client ${socket.id} disconnected. Reason: `, reason);

        // after disconnect, send system message
        const room = socket.data.currentRoom;
        const username = socket.data.username;

        if(room){
            socket.to(room).emit("systemMessageFromServer",{
                message: `${username} disconnected.`
            })
        }
    
        // remove typing indicator for disconnected user
        socket.broadcast.emit("stoptypingFromServerNS",{
            from: socket.data.username
        });
    });
});


// Start the server
server.listen(port,()=>{
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`Dahboard listening on http://localhost:${port}/dashboard`);    
})