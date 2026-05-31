"use client";
import { useState, useRef, useEffect } from "react";

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:3001";

interface Message { role:"user"|"assistant"; content:string; sources?:string[]; time:string; }

const SUGGESTIONS = [
  "Bagaimana kondisi lingkungan di Jakarta?",
  "Provinsi mana yang paling banyak titik api?",
  "Apakah ada gempa besar minggu ini?",
  "Which province has the worst air quality?",
];

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, loading]);

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;
    const time = new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
    setMessages(p => [...p, {role:"user", content:question, time}]);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch(`${AGENT_URL}/api/agent`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({question, history: messages.map(m=>({role:m.role,content:m.content}))}),
      });
      const d = await r.json();
      setMessages(p => [...p, {role:"assistant", content:d.answer||"No response.", sources:d.metadata?.sources, time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}]);
    } catch {
      setMessages(p => [...p, {role:"assistant", content:"⚠️ Could not connect to Bumi Watch agent. Make sure the agent server is running.", time:new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}]);
    } finally { setLoading(false); }
  }

  return (
    <div className="card flex flex-col h-[600px]" id="chat">
      <div className="p-4 border-b border-[rgba(82,183,136,0.15)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1A7A4A] flex items-center justify-center"><span>🌿</span></div>
        <div>
          <h3 className="text-sm font-bold text-[#D8F3DC]">Ask Bumi</h3>
          <p className="text-[10px] text-[#52B788]">Powered by Gemini · Real-time data</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] pulse"/>
          <span className="text-[10px] text-[#52B788]">Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
            <div className="text-4xl">🌍</div>
            <div>
              <p className="text-lg font-bold text-[#D8F3DC] mb-1">Ask the Earth</p>
              <p className="text-xs text-[#52B788]">Ask anything about Indonesia's environment</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s,i) => (
                <button key={i} onClick={()=>sendMessage(s)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-[rgba(82,183,136,0.2)] text-[#74C69D] hover:border-[#52B788] hover:text-[#D8F3DC] hover:bg-[rgba(82,183,136,0.05)] transition-all">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg,i) => (
          <div key={i} className={`fade-in flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${msg.role==="user"?"bg-[#1A7A4A] text-[#D8F3DC] rounded-br-none":"bg-[#162B1E] border border-[rgba(82,183,136,0.15)] text-[#D8F3DC] rounded-bl-none"}`}>
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <div className={`flex items-center gap-2 mt-2 ${msg.role==="user"?"justify-end":"justify-start"}`}>
                {msg.sources && <span className="text-[10px] text-[#52B788]">{msg.sources.join(" · ")}</span>}
                <span className="text-[10px] text-[#52B788] opacity-60">{msg.time}</span>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="fade-in flex justify-start">
            <div className="bg-[#162B1E] border border-[rgba(82,183,136,0.15)] rounded-xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] typing-dot"/>
                <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] typing-dot"/>
                <div className="w-1.5 h-1.5 rounded-full bg-[#52B788] typing-dot"/>
                <span className="text-[10px] text-[#52B788] ml-1">Bumi is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div className="p-4 border-t border-[rgba(82,183,136,0.15)]">
        <div className="flex gap-2">
          <textarea value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage(input);}}}
            placeholder="Ask about air quality, fires, earthquakes..." rows={1}
            className="flex-1 bg-[#162B1E] border border-[rgba(82,183,136,0.2)] rounded-lg px-3 py-2 text-sm text-[#D8F3DC] placeholder-[#52B788] resize-none focus:outline-none focus:border-[#52B788] transition-colors"/>
          <button onClick={()=>sendMessage(input)} disabled={!input.trim()||loading}
            className="px-4 py-2 bg-[#1A7A4A] text-[#D8F3DC] rounded-lg text-sm font-medium hover:bg-[#52B788] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Send
          </button>
        </div>
        <p className="text-[10px] text-[#52B788] mt-1.5 opacity-60">Enter to send · Bahasa Indonesia & English</p>
      </div>
    </div>
  );
}
