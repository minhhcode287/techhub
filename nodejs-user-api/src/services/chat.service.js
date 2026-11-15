require("../config/env");
const productService = require("./product.service");
const rentalService = require("./rental.service");
const voucherService = require("./voucher.service");

/**
 * Format tiền tệ VNĐ chuẩn vi-VN
 */
const formatVND = (num) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num || 0);
};

/**
 * Chuẩn hóa đối tượng specs từ Map hoặc Object thành chuỗi hiển thị gọn gàng
 */
const stringifySpecs = (specs) => {
  if (!specs) return "";
  let obj = specs;
  if (typeof specs.toJSON === "function") {
    obj = specs.toJSON();
  } else if (specs instanceof Map) {
    obj = Object.fromEntries(specs);
  }
  if (typeof obj !== "object") return String(obj);

  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ");
};

/**
 * Thu thập ngữ cảnh chi tiết (Context-Aware RAG) từ Database
 */
const fetchSystemContext = async () => {
  try {
    const [products, cameras, vouchers] = await Promise.all([
      productService.getAllProducts().catch(() => []),
      rentalService.getAllCameras().catch(() => []),
      voucherService.getActiveVouchers().catch(() => []),
    ]);

    // Lấy đầy đủ thông số kỹ thuật (name, category, brand, price, stock, description, specs)
    const productSummary = (products || []).slice(0, 50).map((p) => {
      let specsObj = {};
      if (p.specs) {
        if (typeof p.specs.toJSON === "function") {
          specsObj = p.specs.toJSON();
        } else if (p.specs instanceof Map) {
          specsObj = Object.fromEntries(p.specs);
        } else if (typeof p.specs === "object") {
          specsObj = p.specs;
        }
      }

      return {
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: formatVND(p.price),
        rawPrice: Number(p.price) || 0,
        stock: Number(p.stock) || 0,
        description: p.description || "",
        specs: specsObj,
        specsText: stringifySpecs(specsObj),
      };
    });

    // Tóm tắt danh sách máy ảnh cho thuê kèm thông số cảm biến và quay phim
    const cameraSummary = (cameras || []).map((c) => ({
      name: c.name,
      brand: c.brand,
      sensor: c.sensorType || "",
      maxResolution: c.maxResolution || "",
      dailyRate: formatVND(c.dailyRate),
      rawDailyRate: Number(c.dailyRate) || 0,
      depositAmount: formatVND(c.depositAmount),
      available: Number(c.availableQuantity) || 0,
      description: c.description || "",
      accessories: Array.isArray(c.includedAccessories)
        ? c.includedAccessories.join(", ")
        : "",
    }));

    // Tóm tắt danh sách Voucher đang kích hoạt
    const voucherSummary = (vouchers || []).map((v) => ({
      code: v.code,
      discount:
        v.discountType === "percent"
          ? `${v.discountValue}% (Tối đa ${formatVND(v.maxDiscount || 0)})`
          : formatVND(v.discountValue),
      minOrderValue: formatVND(v.minOrderValue || 0),
    }));

    return {
      productSummary,
      cameraSummary,
      voucherSummary,
      loyaltyPolicy:
        "Mỗi 100.000 VNĐ chi tiêu tích được 1 điểm thưởng. Khi đặt hàng tiếp theo, 1 điểm quy đổi giảm trực tiếp 10.000 VNĐ.",
    };
  } catch (err) {
    console.warn("[ChatService] Error building context:", err.message);
    return {
      productSummary: [],
      cameraSummary: [],
      voucherSummary: [],
      loyaltyPolicy: "100.000đ = +1 điểm; 1 điểm = giảm 10.000đ.",
    };
  }
};

/**
 * Xây dựng System Instruction nâng cấp cho Google Gemini
 */
const buildSystemInstruction = (context) => {
  return `Bạn là "TechHub AI" - Chuyên gia tư vấn phần cứng & công nghệ cấp cao của hệ thống TechHub (techhub.vn).

VAI TRÒ & NĂNG LỰC:
1. Bạn có kiến thức sâu rộng về phần cứng máy tính (CPU, GPU, RAM, tản nhiệt, kiến trúc ARM vs x86-64, nhân xử lý, xung nhịp, công nghệ bán dẫn), thiết bị di động và máy ảnh kỹ thuật số điện ảnh.
2. Khi khách hàng hỏi các câu hỏi chuyên môn (ví dụ: "chip nào mạnh nhất", "máy nào render video tốt", "so sánh chip M3 Max và Intel Core i9-14900HX", "card đồ họa RTX 4090 khác gì 4080"), bạn hãy:
   - Phân tích kiến thức kỹ thuật thực tế (hiệu năng đơn nhân/đa nhân, số nhân GPU, khả năng xử lý đồ họa 3D/video 4K-8K, tối ưu điện năng).
   - ĐỐI CHIẾU TRỰC TIẾP VỚI DANH SÁCH KHO HÀNG CỦA TECHHUB BÊN DƯỚI: Chỉ rõ ngay model máy cụ thể nào trong shop đang sở hữu con chip/cấu hình đó, kèm giá bán VNĐ chính xác, cấu hình chi tiết (RAM, SSD, Card màn hình) và tình trạng tồn kho thực tế.
3. Nếu người dùng hỏi câu hỏi tiếp nối trong hội thoại, hãy dựa vào ngữ cảnh (history) để trả lời tự nhiên, súc tích, mạch lạc; KHÔNG lặp lại câu chào rập khuôn mở đầu như "Chào bạn mình là TechHub AI".
4. Luôn báo giá tiền VNĐ rõ ràng (ví dụ: 89.990.000 VNĐ). Định dạng Markdown đẹp mắt (in đậm tên sản phẩm và thông số quan trọng, bullet point phân tích).

KHO HÀNG SẢN PHẨM TECHHUB HIỆN CÓ:
${JSON.stringify(
  context.productSummary.map((p) => ({
    name: p.name,
    category: p.category,
    brand: p.brand,
    price: p.price,
    stock: p.stock,
    specs: p.specs,
    description: p.description,
  })),
  null,
  2
)}

DỊCH VỤ CHO THUÊ MÁY ẢNH TECHHUB:
${JSON.stringify(context.cameraSummary, null, 2)}

VOUCHER ƯU ĐÃI:
${JSON.stringify(context.voucherSummary, null, 2)}

CHÍNH SÁCH ĐIỂM THƯỞNG:
${context.loyaltyPolicy}
`;
};

/**
 * Gọi Google Gemini API (gemini-2.5-flash) với System Instruction và History
 */
const callGeminiAPI = async (message, history, context) => {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("NO_GEMINI_KEY");
  }

  // Chuẩn bị contents từ history hội thoại
  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    history.slice(-10).forEach((h) => {
      if (h.text && typeof h.text === "string" && h.text.trim()) {
        contents.push({
          role: h.role === "assistant" || h.role === "model" ? "model" : "user",
          parts: [{ text: h.text.trim() }],
        });
      }
    });
  }

  // Thêm tin nhắn hiện tại của user
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  const bodyPayload = {
    systemInstruction: {
      parts: [{ text: buildSystemInstruction(context) }],
    },
    contents,
    generationConfig: {
      temperature: 0.65,
      topP: 0.95,
      maxOutputTokens: 1200,
    },
  };

  const modelName = "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(6000), // Timeout 6 giây phản hồi nhanh
    });
  } catch (netErr) {
    console.error(`[Gemini API Network Error]: ${netErr.message}`);
    throw netErr;
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error(
      `[Gemini API Error] Model: ${modelName} | Status: ${response.status} (${response.statusText})\n[Error Body]: ${errText}`
    );
    throw new Error(`Gemini API [${modelName}] HTTP ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const textReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || null;

  if (!textReply) {
    throw new Error("Empty candidate reply from Gemini API");
  }

  return textReply;
};

/**
 * Thuật toán chấm điểm liên quan (Keyword & Spec Scoring) cho Smart Fallback
 * Quét sâu name, brand, category, description và toàn bộ trường specs
 */
const calculateProductScore = (p, queryWords, rawQuery) => {
  let score = 0;
  const nameLower = (p.name || "").toLowerCase();
  const descLower = (p.description || "").toLowerCase();
  const brandLower = (p.brand || "").toLowerCase();
  const catLower = (p.category || "").toLowerCase();
  const specsLower = (p.specsText || "").toLowerCase();

  const fullText = `${nameLower} ${brandLower} ${catLower} ${specsLower} ${descLower}`;

  // Kiểm tra khớp trực tiếp cụm từ
  if (rawQuery.length >= 3 && fullText.includes(rawQuery)) {
    score += 25;
  }

  queryWords.forEach((word) => {
    if (word.length < 2) return;

    if (nameLower.includes(word)) score += 12;
    if (specsLower.includes(word)) score += 10;
    if (descLower.includes(word)) score += 5;
    if (brandLower.includes(word)) score += 6;
    if (catLower.includes(word)) score += 4;
  });

  return score;
};

/**
 * Nâng cấp Smart Fallback Engine: Phân tích kỹ thuật & trích xuất sản phẩm chính xác
 */
const runSmartFallback = (message, context) => {
  const msg = (message || "").toLowerCase().trim();
  const { productSummary, cameraSummary, voucherSummary } = context;

  // 1. Phân tích Voucher / Khuyến mãi
  if (
    msg.includes("voucher") ||
    msg.includes("giảm giá") ||
    msg.includes("mã ưu đãi") ||
    msg.includes("khuyến mãi") ||
    msg.includes("coupon")
  ) {
    if (voucherSummary.length === 0) {
      return `Hiện tại TechHub chưa có mã voucher mới, nhưng bạn vẫn được tích lũy **100.000đ = +1 điểm** (quy đổi 1 điểm = 10.000đ giảm giá) trên mọi đơn hàng nhé! ✨`;
    }

    const voucherList = voucherSummary
      .map(
        (v) =>
          `🎟️ **Mã: \`${v.code}\`**\n- Mức giảm: **${v.discount}**\n- Áp dụng cho đơn từ: **${v.minOrderValue}**`
      )
      .join("\n\n");

    return `Dưới đây là các **Mã giảm giá khả dụng** đang áp dụng tại TechHub:\n\n${voucherList}\n\n💡 *Bạn có thể nhập mã này trực tiếp tại trang Giỏ hàng hoặc Modal Mua ngay để được trừ tiền tự động nhé!*`;
  }

  // 2. Phân tích Điểm thưởng / Loyalty
  if (
    msg.includes("điểm") ||
    msg.includes("tích điểm") ||
    msg.includes("đổi điểm") ||
    msg.includes("loyalty") ||
    msg.includes("thành viên")
  ) {
    return `⭐ **Chương trình Tích & Đổi điểm thưởng TechHub:**\n\n1. **Cách tích điểm:** Mỗi khi hoàn tất đơn hàng, bạn được tích lũy: cứ **100.000 VNĐ chi tiêu = +1 điểm thưởng**.\n2. **Cách đổi điểm:** Khi thanh toán đơn hàng tiếp theo, bạn dùng điểm: **1 điểm = giảm ngay 10.000 VNĐ** (chọn *"Dùng tối đa"* tại giỏ hàng).\n3. **Hạng hội viên:** Silver ➔ Gold ➔ Platinum với mức ưu đãi điểm nhân thêm hấp dẫn!`;
  }

  // 3. Phân tích chuyên sâu về Chip, CPU, Render, Hiệu năng mạnh nhất
  const isAskingHardware =
    msg.includes("chip") ||
    msg.includes("cpu") ||
    msg.includes("m3") ||
    msg.includes("i9") ||
    msg.includes("i7") ||
    msg.includes("ryzen") ||
    msg.includes("rtx") ||
    msg.includes("render") ||
    msg.includes("mạnh nhất") ||
    msg.includes("đồ họa") ||
    msg.includes("gpu");

  if (isAskingHardware) {
    // Phân tích kỹ thuật đối chiếu
    let techAnalysis = "";
    if (msg.includes("m3 max") || (msg.includes("m3") && msg.includes("i9"))) {
      techAnalysis = `💡 **Phân tích kỹ thuật chuyên sâu:**\n- **Apple M3 Max (16-Core CPU / 40-Core GPU):** Kiến trúc ARM 3nm tối tân, băng thông bộ nhớ lên tới 300GB/s Unified Memory. Tối ưu cực đại cho render Final Cut Pro, DaVinci Resolve, đồ họa 3D Blender và thời lượng pin vượt trội.\n- **Intel Core i9-14900HX (24 nhân / 32 luồng):** Xung nhịp Turbo Boost cực cao 5.8GHz kết hợp GPU rời NVIDIA RTX 4090/4080 cho hiệu năng tính toán thuần túy và chơi game AAA ở mức fps cao nhất.`;
    } else if (msg.includes("mạnh nhất") || msg.includes("render")) {
      techAnalysis = `💡 **Phân tích kỹ thuật:** Để render video 4K/8K và đồ họa 3D mượt mà, cấu hình cần CPU từ 14 nhân trở lên (hoặc Apple M3 Max), RAM tối thiểu 32GB và GPU chuyên dụng từ 12GB - 16GB VRAM (như RTX 4080/4090 hoặc 40-Core GPU Apple).`;
    }

    // Lọc sản phẩm laptop cao cấp nhất
    const highEndLaptops = productSummary
      .filter((p) => p.category === "laptop")
      .sort((a, b) => b.rawPrice - a.rawPrice)
      .slice(0, 3);

    const productRecommendations = highEndLaptops
      .map(
        (p) =>
          `💻 **${p.name}**\n- **Giá bán:** **${p.price}** (Tồn kho: ${
            p.stock > 0 ? `🟢 Còn ${p.stock} máy` : "Hết hàng"
          })\n- **Thông số kỹ thuật:** ${p.specsText || p.description}\n- **Đánh giá:** Chiếc máy lý tưởng cho tác vụ đồ họa nặng, dựng phim chuyên nghiệp và tính toán kỹ thuật cao cấp.`
      )
      .join("\n\n");

    return `${techAnalysis ? techAnalysis + "\n\n" : ""}Dưới đây là các **dòng máy trang bị cấu hình khủng nhất** đang có sẵn tại TechHub:\n\n${productRecommendations}\n\n👉 Tất cả máy đều sẵn hàng tại Showroom, bảo hành chính hãng 24 tháng và miễn phí giao hàng toàn quốc!`;
  }

  // 4. Phân tích Dịch vụ Thuê máy ảnh (Sony, Canon, Fujifilm, FX3, A7 IV)
  if (
    msg.includes("thuê") ||
    msg.includes("máy ảnh") ||
    msg.includes("camera") ||
    msg.includes("sony") ||
    msg.includes("canon") ||
    msg.includes("fuji")
  ) {
    let matchedCams = cameraSummary;
    if (msg.includes("sony")) {
      matchedCams = cameraSummary.filter((c) =>
        c.brand.toLowerCase().includes("sony") || c.name.toLowerCase().includes("sony")
      );
    } else if (msg.includes("canon")) {
      matchedCams = cameraSummary.filter((c) =>
        c.brand.toLowerCase().includes("canon") || c.name.toLowerCase().includes("canon")
      );
    }

    const camList = (matchedCams.length > 0 ? matchedCams : cameraSummary)
      .slice(0, 3)
      .map(
        (c) =>
          `📷 **${c.name}**\n- **Giá thuê:** **${c.dailyRate}/ngày** | **Tiền cọc:** ${c.depositAmount}\n- **Cảm biến & Quay phim:** ${c.sensor} | ${c.maxResolution}\n- **Tình trạng:** ${
            c.available > 0 ? `🟢 Còn ${c.available} máy sẵn sàng` : "🔴 Đang cho thuê"
          }\n- **Phụ kiện đi kèm:** ${c.accessories}`
      )
      .join("\n\n");

    return `Dạ TechHub cung cấp dịch vụ **Cho thuê máy ảnh & máy quay chuyên nghiệp**:\n\n${camList}\n\n👉 Bạn có thể chuyển sang tab **"Thuê máy ảnh"** trên trang chủ để đặt ngày thuê và ký hợp đồng giữ máy trực tuyến ngay nhé!`;
  }

  // 5. Thuật toán chấm điểm tổng quát cho sản phẩm
  const queryTokens = msg
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);

  const scoredProducts = productSummary
    .map((p) => ({
      product: p,
      score: calculateProductScore(p, queryTokens, msg),
    }))
    .filter((item) => item.score > 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (scoredProducts.length > 0) {
    const list = scoredProducts
      .map(
        ({ product: p }) =>
          `🔥 **${p.name}** (${p.brand})\n- **Giá bán:** **${p.price}** (Kho: ${p.stock} sản phẩm)\n- **Cấu hình:** ${p.specsText || p.description}`
      )
      .join("\n\n");

    return `Dựa trên yêu cầu của bạn, TechHub gợi ý các sản phẩm phù hợp nhất trong kho hàng:\n\n${list}\n\nBạn có muốn mình tư vấn chi tiết hơn về cấu hình, chính sách trả góp hay mã giảm giá cho sản phẩm nào không ạ? 😊`;
  }

  // 6. Chào hỏi hoặc câu hỏi chung
  return `Chào bạn! Mình là **Trợ lý AI TechHub** 🤖✨

Mình có thể hỗ trợ bạn chuyên sâu:
- 💻 **Tư vấn phần cứng & Laptop:** So sánh chip CPU (M3 Max, Core i9, Ryzen), card đồ họa RTX, chọn máy theo nhu cầu làm việc & gaming.
- 📷 **Thuê máy ảnh:** Tư vấn dòng máy ảnh Sony, Canon, thông số quay chụp 4K/8K và bảng giá thuê/ngày.
- 🎟️ **Mã giảm giá (Voucher):** Cập nhật voucher hot nhất và cách áp dụng trừ tiền trực tiếp.
- ⭐ **Điểm thưởng tích lũy:** Hướng dẫn chính sách 100k = 1 điểm (đổi 1 điểm = 10k VNĐ).

Bạn đang cần tìm thiết bị hay cần tư vấn kỹ thuật gì, hãy nhắn cho mình nhé!`;
};

/**
 * Controller chính xử lý tin nhắn chat từ người dùng
 */
const generateChatReply = async ({ message, history = [] }) => {
  if (!message || typeof message !== "string" || !message.trim()) {
    return {
      reply: "Dạ bạn có thể gửi lại câu hỏi hoặc nội dung bạn cần hỗ trợ được không ạ?",
      source: "validation",
    };
  }

  const cleanMessage = message.trim();
  const context = await fetchSystemContext();

  // Thử gọi Gemini AI trước
  try {
    const geminiReply = await callGeminiAPI(cleanMessage, history, context);
    return {
      reply: geminiReply,
      source: "gemini-2.5-flash",
    };
  } catch (err) {
    console.log(
      `[ChatService] Gemini API call bypassed/failed (${err.message}). Activating Smart Spec Relevance Fallback.`
    );
    const fallbackReply = runSmartFallback(cleanMessage, context);
    return {
      reply: fallbackReply,
      source: "smart-fallback",
    };
  }
};

module.exports = {
  fetchSystemContext,
  generateChatReply,
};
