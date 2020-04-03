const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessages = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder

app.use(express.static(path.join(__dirname, "public")));

const botAdmin = "ChatRoom Bot";

//Run when client connections
io.on("connection", socket => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    //Welcome current user
    socket.emit("message", formatMessages(botAdmin, "Welcome to ChatRoom"));

    //Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessages(botAdmin, `${user.username} has joined the chat`)
      );
  });

  //  Listen for chatMessage
  socket.on("chatMessage", msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessages(user.username, msg));
  });
  //Runs when client disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessages(botAdmin, `${user.username} has left the chat`)
      );
      //  Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = 5000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
