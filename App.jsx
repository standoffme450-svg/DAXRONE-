import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  signInWithPopup, onAuthStateChanged, signOut
} from "firebase/auth";
import {
  collection, addDoc, getDocs, orderBy, query, serverTimestamp,
  doc, setDoc, updateDoc
} from "firebase/firestore";
import {
  Menu, X, Plus, Send, Maximize2, Settings, LogOut, Globe2,
  Moon, Sun, Monitor, MessageSquare, ChevronLeft, Sparkles, UserRound
} from "lucide-react";
import { auth, db, googleProvider, firebaseConfigured } from "./firebase";
import { copy } from "./i18n";
import { CrystalLogo, OrbitalLoader } from "./Brand";

const languages = [
  ["uz", "O‘zbekcha"], ["ru", "Русский"], ["en", "English"], ["ar", "العربية"], ["tr", "Türkçe"]
];

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

export default function App() {
  const [language, setLanguage] = useState(localStorage.getItem("dx-language") || "uz");
  const [theme, setTheme] = useState(localStorage.getItem("dx-theme") || "dark");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(localStorage.getItem("dx-warning") === "yes");
  const [sidebar, setSidebar] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [quota, setQuota] = useState(false);
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const t = copy[language] || copy.uz;
  const isRTL = language === "ar";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    localStorage.setItem("dx-language", language);
    localStorage.setItem("dx-theme", theme);
  }, [theme, language, isRTL]);

  useEffect(() => {
    if (!auth) { setAuthReady(true); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u && db) await loadChats(u.uid);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, thinking]);

  async function loadChats(uid) {
    try {
      const q = query(collection(db, "users", uid, "chats"), orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn("Could not load chat history", e); }
  }

  async function login() {
    setError("");
    if (!firebaseConfigured || !auth) {
      setError("Firebase sozlamalari kiritilmagan. .env faylini to‘ldiring.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      setShowLogin(false);
    } catch (e) {
      setError(`${t.loginError} ${e.code || ""}`);
    }
  }

  async function logout() {
    if (auth) await signOut(auth);
    setMessages([]); setChats([]); setActiveChat(null);
    setSettingsOpen(false); setSidebar(false);
  }

  function startNewChat() {
    setActiveChat(null); setMessages([]); setQuota(false); setError("");
    setSidebar(false);
    textareaRef.current?.focus();
  }

  async function persistChat(chatId, nextMessages, title) {
    if (!user || !db) return;
    const chatRef = doc(db, "users", user.uid, "chats", chatId);
    await setDoc(chatRef, {
      title: title.slice(0, 72) || t.newChat,
      messages: nextMessages,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await loadChats(user.uid);
  }

  async function openChat(chat) {
    setActiveChat(chat.id);
    setMessages(chat.messages || []);
    setQuota(false); setError(""); setSidebar(false);
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const prompt = text.trim();
    if (!prompt || thinking || quota) return;
    if (!user) { setShowLogin(true); return; }
    const chatId = activeChat || makeId();
    const firstTitle = prompt;
    const userMessage = { id: makeId(), role: "user", text: prompt };
    const prior = messages;
    const next = [...prior, userMessage];
    setActiveChat(chatId);
    setMessages(next);
    setText("");
    setThinking(true);
    setError("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          messages: next.map(m => ({ role: m.role === "assistant" ? "model" : "user", text: m.text }))
        })
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 429 || data.code === "QUOTA_EXHAUSTED") {
        setQuota(true);
        await persistChat(chatId, next, firstTitle);
        return;
      }
      if (!response.ok) throw new Error(data.error || "AI service error");
      const assistantMessage = { id: makeId(), role: "assistant", text: data.answer || "" };
      const complete = [...next, assistantMessage];
      setMessages(complete);
      await persistChat(chatId, complete, firstTitle);
    } catch (err) {
      setError(err.message || "Connection error");
      setMessages(next);
    } finally { setThinking(false); }
  }

  const loginScreen = !user;
  const chatList = useMemo(() => chats, [chats]);

  if (!authReady) return <div className="boot"><OrbitalLoader /><span>DAXRONE</span></div>;

  return (
    <div className={`app-shell ${expanded ? "expanded" : ""}`}>
      {!user ? (
        <main className="welcome-screen">
          <div className="welcome-top"><div className="brand-mini"><CrystalLogo size={34}/> <span>DAXRONE</span></div>
            <label className="language-select"><Globe2 size={15}/><select value={language} onChange={e=>setLanguage(e.target.value)}>{languages.map(([k,v])=><option value={k} key={k}>{v}</option>)}</select></label>
          </div>
          <div className="welcome-center">
            <div className="hero-crystal"><CrystalLogo size={174}/></div>
            <div className="eyebrow">YOUR INTELLIGENT ASSISTANT</div>
            <h1>DAXRONE <span>AI</span></h1>
            <p className="welcome-sub">A quieter kind of intelligence.</p>
            <button className="google-button" onClick={login}><GoogleMark/> {t.continueGoogle}</button>
            {error && <p className="error-text">{error}</p>}
            {!firebaseConfigured && <p className="setup-hint">Firebase sozlamalari .env faylida kiritilgach Google login ishlaydi.</p>}
          </div>
          <div className="welcome-foot">BLACK TITANIUM <i/> QUANTUM IDENTITY</div>
        </main>
      ) : (
        <div className="workspace">
          <aside className={`sidebar ${sidebar ? "open" : ""}`}>
            <div className="sidebar-head">
              <div className="brand-mini"><CrystalLogo size={34}/><span>DAXRONE</span></div>
              <button className="icon-button close-sidebar" onClick={()=>setSidebar(false)} aria-label="Close"><X/></button>
            </div>
            <button className="new-chat-button" onClick={startNewChat}><Plus size={17}/>{t.newChat}</button>
            <div className="history-label">{t.history}</div>
            <div className="chat-history">
              {chatList.map(chat=><button key={chat.id} className={`history-item ${activeChat===chat.id?"selected":""}`} onClick={()=>openChat(chat)}><MessageSquare size={15}/><span>{chat.title || t.newChat}</span></button>)}
              {!chatList.length && <div className="history-empty">Suhbatlaringiz shu yerda saqlanadi</div>}
            </div>
            <div className="sidebar-bottom">
              <button className="settings-button" onClick={()=>setSettingsOpen(v=>!v)}><Settings size={17}/>{t.settings}</button>
              {settingsOpen && <div className="settings-panel">
                <div className="settings-title">{t.appearance}</div>
                <div className="theme-options">
                  <button className={theme==="dark"?"active":""} onClick={()=>setTheme("dark")}><Moon size={14}/>{t.dark}</button>
                  <button className={theme==="light"?"active":""} onClick={()=>setTheme("light")}><Sun size={14}/>{t.light}</button>
                  <button className={theme==="system"?"active":""} onClick={()=>setTheme("system")}><Monitor size={14}/>{t.system}</button>
                </div>
                <div className="settings-title">{t.language}</div>
                <select className="settings-select" value={language} onChange={e=>setLanguage(e.target.value)}>{languages.map(([k,v])=><option value={k} key={k}>{v}</option>)}</select>
              </div>}
              <div className="profile-row">
                {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound/>}
                <div className="profile-name"><b>{user.displayName || "DAXRONE user"}</b><small>{user.email}</small></div>
                <button className="icon-button" title={t.signOut} onClick={logout}><LogOut size={17}/></button>
              </div>
            </div>
          </aside>
          {sidebar && <button className="sidebar-backdrop" onClick={()=>setSidebar(false)} aria-label="Close menu"/>}
          <main className="chat-main">
            <header className="chat-header">
              <button className={`icon-button menu-toggle ${sidebar?"is-open":""}`} onClick={()=>setSidebar(v=>!v)} aria-label="Menu">{sidebar?<X/>:<Menu/>}</button>
              <div className="header-brand"><CrystalLogo size={31}/><span>DAXRONE</span></div>
              <button className="icon-button" title={t.expand} onClick={()=>setExpanded(v=>!v)}><Maximize2 size={18}/></button>
            </header>
            <section className="conversation">
              {messages.length === 0 && !thinking ? (
                <div className="empty-state"><div className="empty-mark"><CrystalLogo size={90}/></div><h2>{t.empty}</h2><p>DAXRONE AI</p></div>
              ) : (
                <div className="message-list">
                  {messages.map(m=><article key={m.id} className={`message ${m.role}`}><div className="message-avatar">{m.role==="assistant"?<CrystalLogo size={25}/>:<UserRound size={17}/>}</div><div className="message-content"><div className="message-author">{m.role==="assistant"?"DAXRONE":"You"}</div><div className="message-text">{m.text}</div></div></article>)}
                  {thinking && <div className="thinking-row"><OrbitalLoader small/><span>{t.thinking}</span></div>}
                  {quota && <div className="quota-card"><CrystalLogo size={35}/><p>{t.quota}</p></div>}
                  <div ref={bottomRef}/>
                </div>
              )}
            </section>
            {error && <div className="inline-error">{error}</div>}
            <form className="composer-wrap" onSubmit={sendMessage}>
              <div className="composer">
                <textarea ref={textareaRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder={t.placeholder} rows={1} />
                <button className="send-button" type="submit" disabled={!text.trim()||thinking||quota} aria-label={t.send}><Send size={18}/></button>
              </div>
              <div className="disclaimer">{t.disclaimer}</div>
            </form>
          </main>
        </div>
      )}
      {showLogin && <div className="modal-backdrop" onClick={()=>setShowLogin(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setShowLogin(false)}><X/></button><CrystalLogo size={64}/><h2>{t.welcome}</h2><p>{t.warning}</p><button className="google-button" onClick={login}><GoogleMark/>{t.continueGoogle}</button></div></div>}
      {user && !warningAccepted && <div className="modal-backdrop"><div className="modal"><div className="modal-logo"><CrystalLogo size={65}/></div><div className="modal-kicker">{t.warningTitle}</div><h2>{t.welcome}</h2><p>{t.warning}</p><button className="primary-button" onClick={()=>{setWarningAccepted(true);localStorage.setItem("dx-warning","yes");}}>{t.close}</button></div></div>}
    </div>
  );
}

function GoogleMark() {
  return <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z"/><path fill="#FF3D00" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z"/><path fill="#4CAF50" d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8z"/><path fill="#1976D2" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12z"/></svg>;
}
