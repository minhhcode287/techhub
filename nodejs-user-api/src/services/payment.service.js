const PaymentSession = require("../models/PaymentSession.model");
const { getDBStatus } = require("../config/database");

// In-memory storage for payment sessions (ensures 100% reliability in offline/no-mongo dev mode)
const inMemoryPaymentSessions = new Map();

/**
 * Sinh mã đối soát giao dịch duy nhất dạng THxxxxxx (TH + 6 chữ số)
 */
const generateTransactionCode = async () => {
  const dbStatus = getDBStatus();
  let code = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 20) {
    attempts++;
    const random6Digits = Math.floor(100000 + Math.random() * 900000);
    code = `TH${random6Digits}`;

    if (inMemoryPaymentSessions.has(code)) {
      continue;
    }

    if (dbStatus.connected) {
      try {
        const found = await PaymentSession.findOne({ transactionCode: code }).select("_id").lean();
        if (found) continue;
      } catch (err) {
        console.warn("[PaymentService] Error checking existing transactionCode:", err.message);
      }
    }

    exists = false;
  }

  return code;
};

/**
 * Tạo phiên thanh toán mới (Payment Session)
 * @param {Object} params
 * @param {number} params.amount Số tiền cần thanh toán
 * @param {string} [params.method] "banking" | "momo"
 * @param {Object} [params.metadata] Dữ liệu bổ sung (userId, phone, orderId...)
 */
const createSession = async ({ amount, method = "banking", metadata = {} }) => {
  const expectedAmount = Math.max(0, Math.round(Number(amount) || 0));
  const transactionCode = await generateTransactionCode();
  const dbStatus = getDBStatus();

  // URL VietQR chuẩn theo thông tin tài khoản TechHub (VietinBank)
  const qrUrl = `https://img.vietqr.io/image/ICB-102565426868-compact2.png?amount=${expectedAmount}&addInfo=${encodeURIComponent(
    transactionCode
  )}&accountName=${encodeURIComponent("NGUYEN NHAT MINH")}`;

  const sessionData = {
    transactionCode,
    expectedAmount,
    status: "PENDING",
    paymentMethod: method === "momo" ? "momo" : "banking",
    bankRef: null,
    paidAt: null,
    qrUrl,
    metadata,
    bankInfo: {
      bankId: "ICB",
      bankName: "VietinBank (Ngân hàng TMCP Công Thương Việt Nam)",
      accountNumber: "102565426868",
      accountName: "NGUYEN NHAT MINH",
      branch: "Hội Sở / Sầm Sơn",
      amount: expectedAmount,
      content: transactionCode,
    },
    momoInfo: {
      phone: "0912345678",
      accountName: "NGUYEN NHAT MINH",
      amount: expectedAmount,
      content: transactionCode,
      qrUrl: "/images/momo-qr.jpg",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Lưu in-memory
  inMemoryPaymentSessions.set(transactionCode, { ...sessionData });

  // Lưu MongoDB nếu có kết nối
  if (dbStatus.connected) {
    try {
      const created = await PaymentSession.create({
        transactionCode,
        expectedAmount,
        status: "PENDING",
        paymentMethod: sessionData.paymentMethod,
        qrUrl,
        metadata,
      });
      sessionData._id = created._id;
    } catch (err) {
      console.warn("[PaymentService] DB save session error:", err.message);
    }
  }

  return sessionData;
};

/**
 * Lấy trạng thái của phiên thanh toán dựa vào transactionCode
 * @param {string} transactionCode
 */
const getSessionStatus = async (transactionCode) => {
  if (!transactionCode || typeof transactionCode !== "string") {
    throw new Error("Mã giao dịch không hợp lệ");
  }

  const cleanCode = transactionCode.trim().toUpperCase();
  const dbStatus = getDBStatus();
  let session = null;

  if (dbStatus.connected) {
    try {
      session = await PaymentSession.findOne({ transactionCode: cleanCode }).lean();
    } catch (err) {
      console.warn("[PaymentService] DB getSessionStatus error:", err.message);
    }
  }

  if (!session) {
    session = inMemoryPaymentSessions.get(cleanCode);
  }

  if (!session) {
    throw new Error(`Không tìm thấy phiên thanh toán với mã "${cleanCode}"`);
  }

  return {
    transactionCode: session.transactionCode,
    status: session.status,
    expectedAmount: session.expectedAmount,
    paidAt: session.paidAt,
    bankRef: session.bankRef,
    paymentMethod: session.paymentMethod,
    updatedAt: session.updatedAt,
  };
};

/**
 * Xử lý Webhook tự động đối soát giao dịch ngân hàng / Casso / SePay / MoMo
 * @param {Object} payload Dữ liệu nhận từ webhook
 */
const handleWebhook = async (payload = {}) => {
  // Trích xuất các trường thông tin phổ biến
  const contentText = String(
    payload.content ||
      payload.description ||
      payload.transferContent ||
      payload.orderCode ||
      payload.transactionCode ||
      payload.msg ||
      ""
  );

  const transferAmount = Number(
    payload.transferAmount !== undefined
      ? payload.transferAmount
      : payload.amount !== undefined
      ? payload.amount
      : payload.accumulated !== undefined
      ? payload.accumulated
      : 0
  );

  const bankRef = String(
    payload.referenceCode ||
      payload.reference ||
      payload.bankRef ||
      payload.transactionID ||
      payload.id ||
      `BANK-${Date.now()}`
  );

  // Tìm mã THxxxxxx trong chuỗi content
  let matchedCode = "";
  if (payload.transactionCode && /^TH\d{6}$/i.test(payload.transactionCode.trim())) {
    matchedCode = payload.transactionCode.trim().toUpperCase();
  } else {
    const regexMatch = contentText.match(/\b(TH\d{6})\b/i);
    if (regexMatch && regexMatch[1]) {
      matchedCode = regexMatch[1].toUpperCase();
    }
  }

  if (!matchedCode) {
    return {
      success: false,
      matched: false,
      message: `Không trích xuất được mã đối soát THxxxxxx từ nội dung giao dịch: "${contentText}"`,
    };
  }

  const dbStatus = getDBStatus();
  let session = null;

  if (dbStatus.connected) {
    try {
      session = await PaymentSession.findOne({ transactionCode: matchedCode });
    } catch (err) {
      console.warn("[PaymentService] DB search session error:", err.message);
    }
  }

  if (!session) {
    session = inMemoryPaymentSessions.get(matchedCode);
  }

  if (!session) {
    return {
      success: false,
      matched: false,
      message: `Không tìm thấy phiên thanh toán nào khớp với mã "${matchedCode}" trong hệ thống`,
    };
  }

  // Đã thanh toán trước đó
  if (session.status === "PAID") {
    return {
      success: true,
      matched: true,
      alreadyPaid: true,
      message: `Phiên thanh toán "${matchedCode}" đã được ghi nhận thanh toán trước đó lúc ${session.paidAt}`,
      session: {
        transactionCode: session.transactionCode,
        status: session.status,
        expectedAmount: session.expectedAmount,
        paidAt: session.paidAt,
        bankRef: session.bankRef,
      },
    };
  }

  // Kiểm tra số tiền chuyển
  if (transferAmount > 0 && transferAmount < session.expectedAmount) {
    return {
      success: false,
      matched: true,
      insufficientAmount: true,
      message: `Số tiền chuyển (${transferAmount} VNĐ) nhỏ hơn số tiền cần thanh toán (${session.expectedAmount} VNĐ)`,
      session: {
        transactionCode: session.transactionCode,
        status: session.status,
        expectedAmount: session.expectedAmount,
      },
    };
  }

  // Cập nhật trạng thái PAID
  const paidAt = new Date();
  const finalBankRef = bankRef;

  // Cập nhật memory
  const memSession = inMemoryPaymentSessions.get(matchedCode);
  if (memSession) {
    memSession.status = "PAID";
    memSession.paidAt = paidAt;
    memSession.bankRef = finalBankRef;
    memSession.updatedAt = paidAt;
  }

  // Cập nhật DB
  if (dbStatus.connected && session.save) {
    try {
      session.status = "PAID";
      session.paidAt = paidAt;
      session.bankRef = finalBankRef;
      await session.save();
    } catch (err) {
      console.warn("[PaymentService] DB update session error:", err.message);
    }
  }

  return {
    success: true,
    matched: true,
    message: `Đối soát thành công! Đã khớp lệnh thanh toán cho mã "${matchedCode}" với số tiền ${session.expectedAmount.toLocaleString(
      "vi-VN"
    )} VNĐ.`,
    session: {
      transactionCode: matchedCode,
      status: "PAID",
      expectedAmount: session.expectedAmount,
      paidAt,
      bankRef: finalBankRef,
    },
  };
};

module.exports = {
  createSession,
  getSessionStatus,
  handleWebhook,
};
