const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const { generateMessage } = require("./utils/messages.js");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users.js");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username,
      room,
    });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage(`Welcome, ${user.username} !`));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined!`));
    io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (!user) {
      return callback({
        error: "User was not found!",
      });
    }

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback("Delivered!");
  });

  socket.on("sendLocation", (location, callback) => {
    const user = getUser(socket.id);

    if (!user) {
      return callback({
        error: "User was not found!",
      });
    }

    io.to(user.room).emit(
      "locationMessage",
      generateMessage(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}`
      )
    );
    callback("Location shared!");
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`)
      );
      io.to(user.room).emit('roomData', {
          room: user.room,
          users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on the following port ${PORT}`);
});
