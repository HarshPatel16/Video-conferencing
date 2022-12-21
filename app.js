const express = require("express");
const app = express();
const static = express.static(__dirname + "/public");
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

//const userRoutes = require("./routes/usets");
const meetData = require("./data/meeting");

app.use("/peerjs", peerServer);
const configRoutes = require("./routes");
const exphbs = require("express-handlebars");

app.use("/public", static);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const path = require("path");
const session = require("express-session");

app.use(
  session({
    name: "AuthCookie",
    secret: "some secret string!",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(async (req, res, next) => {
  if (req.session.user) {
    console.log(
      `${new Date().toUTCString()} ${req.method} ${
        req.originalUrl
      } (Authenticated User)`
    );
  } else {
    console.log(
      `${new Date().toUTCString()} ${req.method} ${
        req.originalUrl
      } (Non-Authenticated User)`
    );
  }
  next();
});

app.use("/home", (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    return res
      .status(403)
      .render("sub_layout/login", {
        title: "Login",
        error: "Please enter Credentials first",
      });
  }
});

configRoutes(app);
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId, userName);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
    socket.on("disconnecting", (reason) => {
      socket.to(roomId).emit("user-disconnected", userId);

      const main = async () => {
        console.log('main');
        try {
            console.log(roomId);
          console.log(roomId);
          const meetObj = await meetData.removeParticipantFromMeet(
            roomId,
            userName
          );
        } catch (e) {}
      };
      main();
    });
  });
});

server.listen(process.env.PORT || 443, () => {
  console.log("We've now got a server!");
  console.log("Your routes will be running on http://localhost:443");
});
