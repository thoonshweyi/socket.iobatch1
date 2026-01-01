import express from "express";
import {Server} from "socket.io";

import path from "path";
import { fileURLToPath } from "url";

// Create express app
const app = express();
const port = 3000;

// __dirname from ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Static folder
app.use(express.static(path.join(__dirname,"public"))); // now you can run http://localhost:3000/index.html

// Start express server
const expressServer  = app.listen(port,()=>{
    console.log(`Server is listening on http://localhost:${port} `);
});

// Initialize Socket.IO After express.listen
const io = new Server(expressServer);

io.on("connection", (socket) => {
    console.log("New client connected: ",  socket.id);
});

// nodemon server.js
