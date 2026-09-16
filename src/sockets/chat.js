const jwt = require("jsonwebtoken");
const pool = require("../db");
const onlineUsers = new Set();

module.exports = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
    
        if (!token) {
            return next(new Error("Authentication required"));
        }
    
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
            socket.user = decoded;
    
            next();
        } catch (error) {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        onlineUsers.add(socket.user.userId);

    console.log(
        `${socket.user.username} is online`
    );

    io.emit("userStatus", {
    userId: socket.user.userId,
    online: true
    });

    socket.emit("onlineUsers", Array.from(onlineUsers));

    console.log(
         "User connected:",
        socket.user.username,
        socket.id
    );

    socket.on("chatMessage", async (data) => {
        try {
            if (!data || typeof data !== "object") {
                return socket.emit(
                    "errorMessage",
                    "Invalid message data"
                );
            }

            const conversationId = Number(data.conversationId);
            const message = data.message?.trim();

            if (!Number.isInteger(conversationId) || conversationId <= 0) {
                return socket.emit(
                    "errorMessage",
                    "Invalid conversation"
                );
            }

            if (!message) {
                return socket.emit(
                    "errorMessage",
                    "Message cannot be empty"
                );
            }

            if (message.length > 2000) {
                return socket.emit(
                    "errorMessage",
                    "Message cannot exceed 2000 characters"
                );
            }

            const memberCheck = await pool.query(
                `SELECT 1
                FROM conversation_members
                WHERE conversation_id = $1
                AND user_id = $2`,
                [conversationId, socket.user.userId]
            );

            if (memberCheck.rows.length === 0) {
                return socket.emit(
                    "errorMessage",
                    "You are not a member of this conversation"
                );
            }

            console.log("Message received:", message);

            const result = await pool.query(
                `INSERT INTO messages (conversation_id, sender_id, content)
                VALUES ($1, $2, $3)
                RETURNING id, conversation_id, sender_id, content, created_at`,
                [
                    conversationId,
                    socket.user.userId,
                    message
                ]
            );

            const savedMessage = result.rows[0];

            const userResult = await pool.query(
                `SELECT username
                FROM users
                WHERE id = $1`,
                [socket.user.userId]
            );

            savedMessage.sender_username =
                userResult.rows[0].username;

            io.to(`conversation_${conversationId}`).emit(
                "chatMessage",
                savedMessage
            );

        } catch (error) {
            console.error("Failed to save message:", error);

            socket.emit(
                "errorMessage",
                "Failed to send message"
            );
        }
    });

    socket.on("joinConversation", async (conversationId) => {
        try {
            conversationId = Number(conversationId);

            if (!Number.isInteger(conversationId) || conversationId <= 0) {
                return socket.emit(
                    "errorMessage",
                    "Invalid conversation"
                );
            }

            // Leave the previously selected conversation
            if (
                socket.currentConversationId &&
                socket.currentConversationId !== conversationId
            ) {
                socket.leave(
                    `conversation_${socket.currentConversationId}`
                );

                console.log(
                    `${socket.user.username} left conversation ${socket.currentConversationId}`
                );
            }

            // Join the new conversation
            socket.join(`conversation_${conversationId}`);

            socket.currentConversationId = conversationId;

            console.log(
                `${socket.user.username} joined conversation ${conversationId}`
            );

        } catch (error) {
            console.error("Failed to join conversation:", error);

            socket.emit(
                "errorMessage",
                "Failed to join conversation"
            );
        }
    });

    socket.on("disconnect", () => {
    onlineUsers.delete(socket.user.userId);

    console.log(
        `${socket.user.username} is offline`
    );
    io.emit("userStatus", {
        userId: socket.user.userId,
        online: false
    });
    });
});
};