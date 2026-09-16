const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users/search", authenticateToken, async (req, res) => {
    try {
        const search = req.query.q?.trim();

        if (!search) {
            return res.json([]);
        }

        const result = await pool.query(
            `SELECT id, username
             FROM users
             WHERE username ILIKE $1
             AND id <> $2
             ORDER BY username
             LIMIT 10`,
            [`%${search}%`, req.user.userId]
        );

        res.json(result.rows);

    } catch (error) {
        console.error("Failed to search users:", error);

        res.status(500).json({
            message: "User search failed"
        });
    }
});

module.exports = router;