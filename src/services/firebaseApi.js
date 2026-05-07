// ─── firebaseApi.js ───────────────────────────────────────────────────────────
// Using in-memory storage — Firestore blocked by network.
// When network allows Firestore, uncomment the Firebase sections below.
// ─────────────────────────────────────────────────────────────────────────────

// ─── FIREBASE (uncomment when network allows Firestore) ───────────────────────
// import { db } from "../firebase/firebaseConfig";
// import {
//   collection, doc, addDoc, getDocs, deleteDoc,
//   query, orderBy, serverTimestamp, updateDoc
// } from "firebase/firestore";

// ─── In-memory store ──────────────────────────────────────────────────────────
const memSessions = {};

function makeId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Create a new chat session ────────────────────────────────────────────────
export async function createSession(title = "New Chat") {
  const id = makeId();
  memSessions[id] = {
    id,
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  return { data: { id, title } };
}

// ─── Get all sessions ─────────────────────────────────────────────────────────
export async function getSessions() {
  const list = Object.values(memSessions).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  return { data: list };
}

// ─── Get all messages for a session ──────────────────────────────────────────
export async function getMessages(sessionId) {
  if (!memSessions[sessionId]) return { data: [] };
  return { data: [...memSessions[sessionId].messages] };
}

// ─── Save a user message ──────────────────────────────────────────────────────
export async function saveUserMessage(sessionId, content) {
  const msg = {
    id: Date.now(),
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  };
  if (memSessions[sessionId]) {
    memSessions[sessionId].messages.push(msg);
    memSessions[sessionId].updatedAt = msg.timestamp;
  }
  return { data: msg };
}

// ─── Save a bot message ───────────────────────────────────────────────────────
export async function saveBotMessage(sessionId, content) {
  const msg = {
    id: Date.now() + 1,
    role: "bot",
    content,
    timestamp: new Date().toISOString(),
  };
  if (memSessions[sessionId]) {
    memSessions[sessionId].messages.push(msg);
    memSessions[sessionId].updatedAt = msg.timestamp;
    if (memSessions[sessionId].title === "New Chat") {
      const firstWords = content.replace(/```[\s\S]*?```/g, "").trim().slice(0, 40);
      if (firstWords) memSessions[sessionId].title = firstWords + "…";
    }
  }
  return { data: msg };
}

// ─── Delete a session ─────────────────────────────────────────────────────────
export async function deleteSession(sessionId) {
  delete memSessions[sessionId];
  return { data: { success: true } };
}