import { emitRoomCount } from "./main.js";

export function roomHandlers(io,socket){
    // Profile Handler
    socket.on('setProfileFromClient',(data,callback)=>{
        const name = String(data?.name ?? "").trim().slice(0,20);
        if(!name) return  callback({ok:false, error: `Name is required`});
        
        socket.data.userName = name;
        callback({ok:true,name})
    });

    // join room Handler
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
                await emitRoomCount(io,prevRoom); // update old room users (everyone see decrement)

                socket.to(prevRoom).emit("systemAlertFromServer",{
                    text: `${socket.data.userName} left the group chat.`
                })
            }

            // join new room
            if(socket.data.currentRoom !== roomName){
                await socket.join(roomName);
                socket.data.currentRoom = roomName; // noted = must be set custom room key/value in data
            }

            // update new room users(everyone sees increment)
            await emitRoomCount(io,roomName);
            
            socket.to(roomName).emit("systemAlertFromServer",{
                text: `${socket.data.userName} join the group chat.`
            })


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

    // Message Handler
    socket.on("messageFromClient",(data,callback)=>{
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

        if(!currentRoom) return callback?.({ok:false,error: "Join a room first."});

        io.to(currentRoom).emit("messageFromServer",{
            room: currentRoom,
            from:socket.data.userName,
            text: data.getinputval,
            at: Date.now()
        });

        callback?.({ok:true});
    })

}


