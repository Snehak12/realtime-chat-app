const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/messages", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = Number(req.query.conversationId);

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.status(400).json({
                message: "Invalid conversationId"
            });
        }

        // Check if the user belongs to this conversation
        const memberCheck = await pool.query(
            `SELECT 1
             FROM conversation_members
             WHERE conversation_id = $1
             AND user_id = $2`,
            [conversationId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                message: "You are not a member of this conversation"
            });
        }

        // Get messages for this conversation
        const result = await pool.query(
            `SELECT
                m.id,
                m.conversation_id,
                m.sender_id,
                u.username AS sender_username,
                m.content,
                m.created_at
            FROM messages m
            JOIN users u
                ON m.sender_id = u.id
            WHERE m.conversation_id = $1
            ORDER BY m.created_at ASC`,
            [conversationId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Failed to fetch messages:", error);

        res.status(500).json({
            message: "Failed to fetch messages"
        });
    }
});

module.exports = router;