// Typing Indicator
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