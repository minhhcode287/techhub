const express = require("express");
const chatController = require("../controllers/chat.controller");

const router = express.Router();

// POST /api/chat - Nhận tin nhắn và lịch sử trò chuyện
router.post("/", chatController.sendMessage);

module.exports = router;
