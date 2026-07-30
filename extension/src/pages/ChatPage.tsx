import { useState, useRef, useEffect } from "react";
import "./ChatPage.css";

interface Segment {
  text: string;
  start: number;
  duration: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPageProps {
  segments: Segment[];
  onClose?: () => void;
}

export default function ChatPage({ segments, onClose = () => {} }: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const transcriptText = segments.map((s) => s.text).join(" ");

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8001/video/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcriptText, question }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-card">
      <div className="stars">
        <span className="star" style={{ top: '8%', left: '10%' }} />
        <span className="star" style={{ top: '20%', left: '85%' }} />
        <span className="star" style={{ top: '40%', left: '15%' }} />
        <span className="star" style={{ top: '55%', left: '90%' }} />
        <span className="star" style={{ top: '70%', left: '30%' }} />
        <span className="star" style={{ top: '85%', left: '75%' }} />
      </div>

      <div className="chat-header">
        <div className="chat-brand">
          <span className="chat-star-icon">⭐</span>
          <span>OrbitAI</span>
        </div>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>

      <button className="chat-back-btn" onClick={onClose}>←</button>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">Ask me anything about this video.</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="chat-bubble assistant loading">Thinking...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-row">
        <span className="chat-star-small">⭐</span>
        <textarea
          className="chat-input"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <button
        className="chat-send-btn"
        onClick={handleSend}
        disabled={loading || !input.trim()}
      >
        Send
      </button>
    </div>
  );
}