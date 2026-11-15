const chatService = require("../services/chat.service");

/**
 * POST /api/chat
 * Trợ lý ảo AI tư vấn sản phẩm, dịch vụ và khuyến mãi TechHub
 */
const sendMessage = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const result = await chatService.generateChatReply({
      message,
      history,
    });

    return res.status(200).json({
      success: true,
      reply: result.reply,
      source: result.source,
    });
  } catch (error) {
    if (next) return next(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý phản hồi từ AI",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
};
