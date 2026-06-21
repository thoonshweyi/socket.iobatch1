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
function getOnlineUsers(){
    // const users = [];

    // namespaceInstance.sockets.forEach((socket)=>{
    //     users.push({
    //         id:socket.id,
    //         name: socket.data.userName || `User-${socket.id.slice(0,4)}`,
    //         room: socket.data.currentRoom || null
    //     })
    // })

    // return users;
}

function emitOnlineUsers(){
    io.emit('onlineUsersFromServer',getOnlineUsers());
}
function emitRoomCount(){

    // namespaceInstance.to(roomName).emit("userCountFromServerToNSRoom",{
    //     roomname: roomName,
    //     count: getRoomCount(namespaceInstance,roomName)
    // });
}
// End Helper funtion

io.on("connection",(socket)=>{
    console.log("Connected: ", socket.id);

    socket.data.userName = `User-${socket.id.slice(0,4)}`;
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

        socket.data.userName = name;
        callback?.({
            ok: true,
            name,
            message: "Name Updated!"
        });

        // Online room users count 
        emitOnlineUsers();
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

                    emitRoomCount();

                    socket.to(prevRoom).emit('systemMessageFromServer',{
                        message: `${socket.data.userName} left ${prevRoom}`
                    });

                }

                
                // join new room
                if(socket.data.currentRoom !== roomName){
                    socket.join(roomName);
                    socket.data.currentRoom = roomName;
                }
                
                // update room user count
                emitRoomCount();

                // notify others in room
                socket.to(roomName).emit('systemMessageFromServer',{
                    message: `${socket.data.userName} joined ${roomName}`
                });

                // obj for response
                callback?.({
                    ok: true,
                    roomname: roomName,
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
        // leave old room

        // join new room
        
        // callback

    // chat Message
    socket.on("messageFromClient",(data,callback)=>{
        const room = socket.data.currentRoom;
        const username = socket.data.userName;
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
        const password = String(data?.getinputpassword ?? "").trim();
        const text = String(data?.getinputval ?? "").trim();

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

        socket.to(room).emit("typingFromServerNS",{
            from: socket.data.userName
        });
    });

    // Stop typing from client
    socket.on("stopTypingFromClient",()=>{
        const room = socket.data.currentRoom;
        if(!room) return;

        socket.to(room).emit("stoptypingFromServerNS",{
            from: socket.data.userName
        });
    });

    // Disconect
     
    socket.on('disconnect',(reason)=>{
        console.log(`Client ${socket.id} disconnected. Reason: `, reason);

        // after disconnect, send system message
        const room = socket.data.currentRoom;
        const username = socket.data.userName;

        if(room){
            socket.to(room).emit("systemMessageFromServer",{
                message: `${username} disconnected.`
            })
        }
    
        // remove typing indicator for disconnected user
        socket.broadcast.emit("stoptypingFromServerNS",{
            from: socket.data.userName
        });
    });
});


// Start the server
server.listen(port,()=>{
    console.log(`Server listening on http://localhost:${port}`);
    console.log(`Dahboard listening on http://localhost:${port}/dashboard`);    
})