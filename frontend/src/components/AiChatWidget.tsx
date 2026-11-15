import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { api } from "../services/api";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  source?: string;
}

const STORAGE_KEY = "techhub_ai_chat_history";

const INITIAL_GREETING: ChatMessage = {
  id: "greeting",
  sender: "ai",
  text: `Dạ chào bạn! Mình là **Trợ lý AI TechHub** 🤖✨\n\nMình có thể hỗ trợ bạn:\n- 💻 Tư vấn Laptop, Điện thoại theo nhu cầu & mức giá.\n- 📷 Báo giá & thủ tục cho thuê máy ảnh Sony, Canon, Fujifilm.\n- 🎟️ Cung cấp mã giảm giá (Voucher) đang mở hôm nay.\n- ⭐ Hướng dẫn tích & đổi điểm thưởng cho đơn hàng.\n\nBạn cần hỗ trợ gì cứ nhắn cho mình nhé!`,
  timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
};

const QUICK_PROMPTS = [
  { label: "💻 Tư vấn Laptop mạnh nhất", text: "Tư vấn cho mình dòng laptop mạnh nhất hiện có tại shop" },
  { label: "📷 Máy ảnh Sony cho thuê", text: "Shop có những dòng máy ảnh Sony nào đang cho thuê?" },
  { label: "🎟️ Mã Voucher giảm giá", text: "Hiện tại shop đang có những mã voucher giảm giá nào?" },
  { label: "⭐ Cách tích & đổi điểm", text: "Chính sách tích điểm thưởng và đổi điểm giảm giá như thế nào?" },
];

/**
 * Helper format Markdown cơ bản (in đậm, code inline, xuống dòng) an toàn
 */
const renderFormattedText = (text: string) => {
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    // Xử lý bullet points
    const isBullet = line.trim().startsWith("- ");
    const content = isBullet ? line.trim().slice(2) : line;

    // Xử lý in đậm **bold** và code `code`
    const parts = content.split(/(\*\*.*?\*\*|`.*?`)/g);

    const formattedContent = parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={partIdx} className="font-extrabold text-[#2D3748]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={partIdx}
            className="px-1.5 py-0.5 rounded bg-[#6C63FF]/10 text-[#6C63FF] font-mono font-bold text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <span key={partIdx}>{part}</span>;
    });

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc text-xs leading-relaxed my-0.5">
          {formattedContent}
        </li>
      );
    }

    if (!line.trim()) {
      return <div key={lineIdx} className="h-1.5" />;
    }

    return (
      <p key={lineIdx} className="text-xs leading-relaxed my-0.5">
        {formattedContent}
      </p>
    );
  });
};

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Bỏ qua lỗi parse
    }
    return [INITIAL_GREETING];
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Lưu lịch sử chat vào sessionStorage mỗi khi có tin nhắn mới
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Tránh lỗi storage quota
    }
  }, [messages]);

  // Cuộn mượt xuống đáy mỗi khi danh sách tin nhắn thay đổi hoặc mở cửa sổ
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setLoading(true);

    try {
      // Chuẩn bị history cho backend
      const historyPayload = newMessages
        .slice(-6)
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "model") as "user" | "model",
          text: m.text,
        }));

      const res = await api.chatWithAI({
        message: text,
        history: historyPayload,
      });

      if (res.success && res.reply) {
        const aiMsg: ChatMessage = {
          id: "ai-" + Date.now(),
          sender: "ai",
          text: res.reply,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          source: res.source,
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error("Phản hồi không hợp lệ từ máy chủ");
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: "err-" + Date.now(),
        sender: "ai",
        text: "Dạ kết nối mạng đang bị gián đoạn đôi chút, bạn vui lòng bấm gửi lại câu hỏi nhé! 🤖",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Bạn có chắc chắn muốn làm mới và xóa lịch sử trò chuyện?")) {
      setMessages([INITIAL_GREETING]);
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // Bỏ qua
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* 1. NÚT BONG BÓNG MỞ CHAT (Góc dưới bên phải) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Tooltip Gợi ý */}
          <div className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-full neu-extruded bg-[#E0E5EC] text-xs font-bold text-[#3D4852] border border-white/60 shadow-md animate-bounce cursor-pointer"
               onClick={() => setIsOpen(true)}>
            <Sparkles className="h-3.5 w-3.5 text-[#6C63FF]" />
            <span>Chat với AI TechHub</span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Mở Trợ lý AI"
            className="relative h-14 w-14 rounded-full neu-extruded bg-[#E0E5EC] flex items-center justify-center text-[#6C63FF] hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl border border-white/80 group"
          >
            <Bot className="h-7 w-7 transition-transform group-hover:rotate-6 text-[#6C63FF]" />
            {/* Chấm xanh trạng thái Online */}
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#E0E5EC]"></span>
            </span>
          </button>
        </div>
      )}

      {/* 2. CỬA SỔ KHUNG CHAT NEUMORPHIC */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[350px] sm:w-[400px] h-[540px] max-h-[88vh] rounded-[28px] neu-extruded bg-[#E0E5EC] border border-white/70 shadow-2xl flex flex-col overflow-hidden animate-scaleIn">
          {/* HEADER */}
          <div className="p-3.5 sm:p-4 bg-[#E0E5EC] border-b border-[#D1D9E6] flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl neu-extruded bg-[#E0E5EC] flex items-center justify-center text-[#6C63FF] shrink-0 border border-white/80">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-[#2D3748] uppercase tracking-wide">
                    Trợ lý AI TechHub
                  </h3>
                  <span className="text-[9px] bg-[#6C63FF]/15 text-[#6C63FF] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                    Gemini 2.5
                  </span>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Sẵn sàng tư vấn 24/7
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearHistory}
                title="Xóa lịch sử chat"
                className="h-8 w-8 rounded-xl neu-btn text-[#6B7280] hover:text-[#E53E3E] flex items-center justify-center transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ khung chat"
                className="h-8 w-8 rounded-xl neu-btn text-[#6B7280] hover:text-[#2D3748] flex items-center justify-center transition"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MESSAGE LIST BODY */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto bg-[#E0E5EC]/50 scrollbar-thin">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isAi ? "justify-start" : "justify-end"
                  } animate-fadeIn`}
                >
                  {isAi && (
                    <div className="h-7 w-7 rounded-xl neu-extruded bg-[#E0E5EC] text-[#6C63FF] flex items-center justify-center shrink-0 mt-0.5 border border-white/60">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isAi
                        ? "neu-inset bg-[#E8EDF5]/90 text-[#3D4852] border border-white/40"
                        : "neu-extruded bg-gradient-to-r from-[#6C63FF] to-[#5A52E0] text-white font-medium"
                    }`}
                  >
                    <div>{renderFormattedText(msg.text)}</div>
                    <div
                      className={`text-[9px] mt-1.5 flex items-center justify-end gap-1 ${
                        isAi ? "text-[#9CA3AF]" : "text-white/70"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI THINKING INDICATOR */}
            {loading && (
              <div className="flex items-start gap-2 animate-fadeIn">
                <div className="h-7 w-7 rounded-xl neu-extruded bg-[#E0E5EC] text-[#6C63FF] flex items-center justify-center shrink-0 mt-0.5 border border-white/60">
                  <Bot className="h-3.5 w-3.5 animate-spin" />
                </div>
                <div className="neu-inset bg-[#E8EDF5] rounded-2xl py-2 px-3 text-xs text-[#6B7280] flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#6C63FF] animate-bounce"></span>
                  <span className="h-2 w-2 rounded-full bg-[#6C63FF] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="h-2 w-2 rounded-full bg-[#6C63FF] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] font-bold text-[#6C63FF] ml-1">AI đang suy nghĩ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT SUGGESTIONS (HỎI NHANH) */}
          <div className="p-2 border-t border-[#D1D9E6]/60 bg-[#E0E5EC] shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt.text)}
                  disabled={loading}
                  className="neu-btn text-[10px] font-bold py-1 px-2.5 rounded-xl whitespace-nowrap text-[#4A5568] hover:text-[#6C63FF] active:scale-95 transition shrink-0"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT FORM FOOTER */}
          <div className="p-3 bg-[#E0E5EC] border-t border-[#D1D9E6] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi AI về laptop, máy ảnh, voucher..."
                  disabled={loading}
                  className="w-full bg-[#E0E5EC] text-[#2D3748] font-medium rounded-2xl py-2.5 pl-3.5 pr-3 text-xs neu-input outline-none placeholder:text-[#A0AEC0] focus:ring-1 focus:ring-[#6C63FF]/50 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                aria-label="Gửi tin nhắn"
                className={`h-9 w-9 rounded-2xl neu-btn flex items-center justify-center shrink-0 transition-all ${
                  inputMessage.trim() && !loading
                    ? "bg-[#6C63FF] text-white shadow-md hover:scale-105 active:scale-95"
                    : "text-[#A0AEC0] cursor-not-allowed"
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
