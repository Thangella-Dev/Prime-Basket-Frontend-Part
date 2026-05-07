import React, { useState } from "react";

export default function ChatSideBar({ sessions, activeSessionId, creating, onNewChat, onSelectSession, onDeleteSession, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  // Rename not yet supported — placeholder
  const handleRename = async () => {};

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.3)", zIndex:60, backdropFilter:"blur(2px)", animation:"fadeIn 0.2s ease", borderRadius:"28px" }}
      />

      {/* Sidebar panel */}
      <div style={{ position:"absolute", top:0, left:0, bottom:0, width:"270px", zIndex:70, background:"white", display:"flex", flexDirection:"column", animation:"slideIn 0.25s ease-out", boxShadow:"8px 0 30px rgba(0,0,0,0.15)", borderRadius:"28px 0 0 28px" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0c4a6e,#0369a1,#0ea5e9)", padding:"18px 15px", borderRadius:"28px 0 0 0" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <span style={{ fontSize:"22px" }}>🛒</span>
              <div style={{ color:"white", fontWeight:800, fontSize:"15px" }}>PrimeBasket</div>
            </div>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:"8px", padding:"5px 10px", cursor:"pointer", color:"white", fontSize:"15px" }}>✕</button>
          </div>
          <button
            onClick={onNewChat}
            disabled={creating}
            style={{ width:"100%", padding:"10px", background:"rgba(255,255,255,0.95)", border:"none", borderRadius:"12px", color:"#0369a1", fontWeight:700, fontSize:"13px", cursor:"pointer", fontFamily:"Nunito,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {creating ? "Creating..." : "New Chat"}
          </button>
        </div>

        {/* Session list */}
        <div style={{ flex:1, overflowY:"auto", padding:"10px" }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign:"center", color:"#9e9e9e", fontSize:"13px", padding:"24px 0" }}>No chats yet</div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                style={{ padding:"10px 12px", borderRadius:"12px", cursor:"pointer", marginBottom:"4px", background: activeSessionId === s.id ? "#e0f2fe" : "transparent", border:`1.5px solid ${activeSessionId === s.id ? "#7dd3fc" : "transparent"}`, transition:"all 0.15s" }}
              >
                {editingId === s.id ? (
                  <div onClick={(e) => e.stopPropagation()} style={{ display:"flex", gap:"6px" }}>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRename(s.id)}
                      autoFocus
                      style={{ flex:1, border:"1.5px solid #0ea5e9", borderRadius:"6px", padding:"4px 8px", fontSize:"12px", outline:"none", fontFamily:"Nunito" }}
                    />
                    <button onClick={() => handleRename(s.id)} style={{ background:"#0ea5e9", border:"none", borderRadius:"6px", color:"white", padding:"4px 8px", cursor:"pointer", fontSize:"12px" }}>✓</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:"13px", fontWeight:600, color: activeSessionId === s.id ? "#0369a1" : "#424242", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        🛒 {s.title || "New Chat"}
                      </div>
                      <div style={{ fontSize:"11px", color:"#9e9e9e", marginTop:"2px" }}>
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"4px", marginLeft:"6px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title || ""); }}
                        style={{ background:"none", border:"none", cursor:"pointer", fontSize:"13px" }}
                      ></button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id, e); }}
                        style={{ background:"none", border:"none", cursor:"pointer", fontSize:"13px" }}
                      >🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 15px", borderTop:"1px solid #e0f2fe", display:"flex", alignItems:"center", gap:"8px" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#0369a1,#0ea5e9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px" }}>👤</div>
          <div style={{ fontSize:"11px", color:"#94a3b8" }}>PrimeBasket Member</div>
        </div>
      </div>
    </>
  );
}