// Typing Indicator

export function typingHandlers(socket){
    socket.on("typingFromClient",()=>{
        const rooms = [...socket.rooms];
        // console.log(rooms); // 0 = socket.id, 1= joined room
        let currentRoom = rooms[1];
        // console.log(currentRoom);

        if(!currentRoom) return;

        socket.to(currentRoom).emit("typingFromServer",{
            from: socket.data.userName
        });
    });


    socket.on("stoptypingFromClient",()=>{
        // const rooms = [...socket.rooms];
        // // console.log(rooms); // 0 = socket.id, 1= joined room
        // let currentRoom = rooms[1];
        // console.log(currentRoom);

        let currentRoom = socket.data.currentRoom;

        if(!currentRoom) return;

        socket.to(currentRoom).emit("stoptypingFromServer",{
            from: socket.data.userName
        });
    });
}
