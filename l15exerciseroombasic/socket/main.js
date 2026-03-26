import {Server} from "socket.io";

export function initSocket(expServer,port){
    const io = new Server(expServer,{
        cors:{
            origin:`http://localhost:${port}`,
            methods: ["GET","POST"]
        }
    });
}

io.on("connection",(socket)=>{
    console.log("New client: ",socket.id);

    socket.data.currentRoom = null;
    socket.data.userName = `User-${socket.id.slice(0,4)}`;

    // register handler

    // system alert
    socket.on('disconnect',()=>{
        const room = socket.data.currentRoom;

        // socket already left rooms on disconnect
        emitRoomCount(io,room);

        socket.to(room).emit("systemAlertFromServer",{
            text: `${socket.data.userName} disconnected.`
        });
    });
});

// Helper function
async function emitRoomCount(io,roomName){
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