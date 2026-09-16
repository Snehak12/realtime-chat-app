const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./db");
const authenticateToken = require("./middleware/authMiddleware");
const authRoutes = require("./routes/auth");
const conversationRoutes = require("./routes/conversations");
const messageRoutes = require("./routes/messages");
const setupChat = require("./sockets/chat");
const userRoutes = require("./routes/users");
const cors = require("cors");

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

setupChat(io);

app.use(express.json());
app.use(cors());
app.use(express.static("public"));
app.use(authRoutes);
app.use(conversationRoutes);
app.use(messageRoutes);
app.use(userRoutes);



const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

app.get("/profile", authenticateToken, (req, res) => {
    res.json({
        message: "You are authenticated!",
        user: req.user
    });
});

