const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const onlineUsers = require("../sockets/onlineUsers");

module.exports = (io) => {
    const router = express.Router();

    router.post("/conversations", authenticateToken, async (req, res) => {
        const client = await pool.connect();

        let transactionStarted = false;

        try {
            const currentUserId = req.user.userId;
            const userId = Number(req.body.userId);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    message: "Invalid userId"
                });
            }

            if (currentUserId === userId) {
                return res.status(400).json({
                    message: "You cannot create a conversation with yourself"
                });
            }

            const userCheck = await client.query(
                `SELECT id
                FROM users
                WHERE id = $1`,
                [userId]
            );

            if (userCheck.rows.length === 0) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            const user1Id = Math.min(currentUserId, userId);
            const user2Id = Math.max(currentUserId, userId);

            const existingConversation = await client.query(
                `SELECT id, created_at
                FROM conversations
                WHERE user1_id = $1
                AND user2_id = $2`,
                [user1Id, user2Id]
            );

            if (existingConversation.rows.length > 0) {
                return res.status(200).json({
                    message: "Conversation already exists",
                    conversation: existingConversation.rows[0]
                });
            }

            await client.query("BEGIN");
            transactionStarted = true;

            const conversationResult = await client.query(
                `INSERT INTO conversations
                (user1_id, user2_id)
                VALUES ($1, $2)
                RETURNING id, created_at`,
                [user1Id, user2Id]
            );

            const conversation = conversationResult.rows[0];

            await client.query(
                `INSERT INTO conversation_members
                (conversation_id, user_id)
                VALUES ($1, $2), ($1, $3)`,
                [
                    conversation.id,
                    currentUserId,
                    userId
                ]
            );

            await client.query("COMMIT");

            io.emit("newConversation", {
                conversationId: conversation.id,
                userId: userId
            });

            const recipientSocketId = onlineUsers.get(userId);

            if (recipientSocketId) {
                io.to(recipientSocketId).emit("newConversation", {
                    conversationId: conversation.id
                });
            }

        } catch (error) {

            if (transactionStarted) {
                await client.query("ROLLBACK");
            }

            // Another request created the same conversation first
            if (error.code === "23505") {

                const user1Id = Math.min(
                    req.user.userId,
                    Number(req.body.userId)
                );

                const user2Id = Math.max(
                    req.user.userId,
                    Number(req.body.userId)
                );

                const existingConversation = await pool.query(
                    `SELECT id, created_at
                    FROM conversations
                    WHERE user1_id = $1
                    AND user2_id = $2`,
                    [user1Id, user2Id]
                );

                return res.status(200).json({
                    message: "Conversation already exists",
                    conversation: existingConversation.rows[0]
                });
            }

            console.error(
                "Failed to create conversation:",
                error
            );

            res.status(500).json({
                message: "Failed to create conversation"
            });

        } finally {
            client.release();
        }
    });

    router.get("/conversations", authenticateToken, async (req, res) => {
        try {
            const userId = req.user.userId;

            const result = await pool.query(
                `SELECT
                    c.id,
                    c.created_at,
                    COALESCE(
                        STRING_AGG(
                            u.username,
                            ', ' ORDER BY u.username
                        ) FILTER (WHERE u.id <> $1),
                        'Conversation ' || c.id
                    ) AS name,
                    MAX(u.id) FILTER (WHERE u.id <> $1) AS other_user_id,
                    (
                        SELECT COUNT(*)
                        FROM messages m
                        WHERE m.conversation_id = c.id
                        AND m.sender_id <> $1
                        AND m.created_at > cm.last_read_at
                    ) AS unread_count
                FROM conversations c
                JOIN conversation_members cm
                    ON c.id = cm.conversation_id
                JOIN conversation_members cm2
                    ON c.id = cm2.conversation_id
                JOIN users u
                    ON cm2.user_id = u.id
                WHERE cm.user_id = $1
                GROUP BY c.id, c.created_at, cm.last_read_at
                ORDER BY c.created_at DESC`,
                [userId]
            );

            res.json(result.rows);

        } catch (error) {
            console.error(
                "Failed to fetch conversations:",
                error
            );

            res.status(500).json({
                message: "Failed to fetch conversations"
            });
        }
    });

    router.patch(
        "/conversations/:conversationId/read",
        authenticateToken,
        async (req, res) => {
            try {
                const userId = req.user.userId;
                const conversationId = Number(req.params.conversationId);

                if (!Number.isInteger(conversationId) || conversationId <= 0) {
                    return res.status(400).json({
                        message: "Invalid conversationId"
                    });
                }

                const result = await pool.query(
                    `UPDATE conversation_members
                    SET last_read_at = CURRENT_TIMESTAMP
                    WHERE conversation_id = $1
                    AND user_id = $2
                    RETURNING conversation_id`,
                    [conversationId, userId]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({
                        message: "Conversation not found"
                    });
                }

                res.json({
                    message: "Conversation marked as read"
                });

            } catch (error) {
                console.error(
                    "Failed to mark conversation as read:",
                    error
                );

                res.status(500).json({
                    message: "Failed to mark conversation as read"
                });
            }
        }
    );


    return router;
};


