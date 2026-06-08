import { useState, useEffect, useRef } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSN-CSxIQPb4-Jri5mMt0jxlv86ttidEs",
  authDomain: "cd-english.firebaseapp.com",
  projectId: "cd-english",
  storageBucket: "cd-english.firebasestorage.app",
  messagingSenderId: "1019950623435",
  appId: "1:1019950623435:web:353de9a3a68e2d5536094e",
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

// ── Static Data ──────────────────────────────────────────────────
const SITUATIONS = {
  general: [
    { id: "cafe", icon: "☕", title: "Ordering at a Café", th: "สั่งกาแฟ/ร้านอาหาร", starter: "Hi, what can I get for you today?" },
    { id: "airport", icon: "✈️", title: "Airport Check-in", th: "เช็คอินสนามบิน", starter: "Good morning! Can I see your passport and booking reference?" },
    { id: "shopping", icon: "🛒", title: "Shopping", th: "ช้อปปิ้ง", starter: "Can I help you find something?" },
    { id: "intro", icon: "👋", title: "Introduction & Small Talk", th: "แนะนำตัว/Small talk", starter: "Hi! I don't think we've met. I'm Alex." },
    { id: "doctor", icon: "🏥", title: "At the Doctor", th: "พบแพทย์", starter: "Hello, what seems to be the problem today?" },
    { id: "phone", icon: "📞", title: "Phone Call", th: "คุยโทรศัพท์", starter: "Good afternoon, how may I direct your call?" },
  ],
  legal: [
    { id: "consultation", icon: "⚖️", title: "Initial Client Consultation", th: "รับปรึกษาลูกค้าครั้งแรก", starter: "Good morning. Thank you for coming in. Could you briefly explain your situation?" },
    { id: "contract", icon: "📄", title: "Explaining a Contract", th: "อธิบายสัญญาให้ลูกค้า", starter: "I've reviewed the contract you sent over. Shall we go through the key clauses together?" },
    { id: "negotiation", icon: "🤝", title: "Negotiation with Opposing Counsel", th: "ต่อรองกับทนายฝ่ายตรงข้าม", starter: "Thank you for making time for this call. I'd like to discuss a potential settlement on behalf of my client." },
    { id: "opinion", icon: "💼", title: "Delivering a Legal Opinion", th: "ให้ความเห็นทางกฎหมาย", starter: "Thank you for your patience. I've completed my analysis. Are you ready to hear my findings?" },
    { id: "conference", icon: "🌐", title: "International Conference Call", th: "ประชุมกับทนายต่างประเทศ", starter: "Good morning everyone. Let's confirm everyone is on the line. Could each party introduce themselves?" },
    { id: "court", icon: "🏛️", title: "Court Preparation", th: "เตรียมคดีขึ้นศาล", starter: "Before we proceed, I want to make sure you're fully prepared for tomorrow's hearing." },
  ]
};

const SAMPLE_VOCAB = [
  { id: 1, phrase: "That's a red flag", meaning: "นั่นเป็นสัญญาณเตือน", context: "Series", example: "When he stopped texting back, that was a red flag.", date: "2024-01-15", category: "general" },
  { id: 2, phrase: "Pursuant to", meaning: "ตามที่กำหนดใน / อาศัยอำนาจตาม", context: "Legal", example: "Pursuant to Section 5 of the agreement, the parties shall...", date: "2024-01-14", category: "legal" },
  { id: 3, phrase: "Pull yourself together", meaning: "ตั้งสติ / สงบสติอารมณ์", context: "Series", example: "You need to pull yourself together before the meeting.", date: "2024-01-13", category: "general" },
  { id: 4, phrase: "Indemnify", meaning: "ชดใช้ค่าเสียหาย / คุ้มครองความเสียหาย", context: "Legal", example: "The client agrees to indemnify the firm against all claims.", date: "2024-01-12", category: "legal" },
];

const DAILY_PHRASES = [
  { en: "I didn't see that coming.", th: "ไม่ได้คาดไว้เลย" },
  { en: "We need to get our ducks in a row.", th: "ต้องจัดการทุกอย่างให้พร้อม" },
  { en: "Let's circle back on that.", th: "เดี๋ยวค่อยกลับมาคุยเรื่องนี้" },
  { en: "I'll take your word for it.", th: "เชื่อในสิ่งที่คุณบอก" },
  { en: "That's beside the point.", th: "ไม่ใช่ประเด็นสำคัญ" },
];
const LEGAL_PHRASES = [
  { en: "Without prejudice to our client's rights...", th: "โดยไม่กระทบต่อสิทธิของลูกความ" },
  { en: "Subject to the terms and conditions herein...", th: "ภายใต้ข้อกำหนดและเงื่อนไขที่ระบุไว้" },
  { en: "The aforementioned clause shall be interpreted...", th: "ข้อกำหนดดังกล่าวต้องตีความว่า..." },
  { en: "In accordance with the applicable laws...", th: "ตามกฎหมายที่บังคับใช้" },
  { en: "My client reserves all rights in this matter.", th: "ลูกความขอสงวนสิทธิ์ทั้งปวงในเรื่องนี้" },
];

// ── Phrase Bank data ─────────────────────────────────────────────
const PHRASE_BANK = {
  native: [
    { phrase: "That makes sense", th: "เข้าใจแล้ว / สมเหตุสมผล", example: "Oh, that makes sense. Thanks for explaining." },
    { phrase: "Fair enough", th: "โอเค / ยุติธรรมดี", example: "Fair enough, I'll go with your suggestion." },
    { phrase: "My bad", th: "ผิดฉันเอง / ขอโทษ", example: "Oh, my bad — I forgot to send the email." },
    { phrase: "I'm swamped", th: "งานท่วมหัว / ยุ่งมาก", example: "I can't meet today, I'm completely swamped." },
    { phrase: "Let's touch base", th: "มาคุยกันก่อน / ติดต่อกันหน่อย", example: "Let's touch base tomorrow morning on this." },
    { phrase: "Sounds good", th: "ดีเลย / โอเค", example: "Sounds good! See you at three." },
    { phrase: "I'll get back to you", th: "จะกลับมาแจ้งให้ทราบ", example: "I'll get back to you by end of day." },
    { phrase: "Bear with me", th: "รอสักครู่ / อดทนรอหน่อย", example: "Bear with me while I pull up the file." },
    { phrase: "To be honest", th: "พูดตรงๆ / จริงๆ แล้ว", example: "To be honest, I think we need more time." },
    { phrase: "On the same page", th: "เข้าใจตรงกัน", example: "Just want to make sure we're on the same page." },
    { phrase: "Cut to the chase", th: "พูดตรงประเด็น", example: "Let's cut to the chase — what do you need?" },
    { phrase: "At the end of the day", th: "ท้ายที่สุดแล้ว", example: "At the end of the day, it's your decision." },
  ],
  legal: [
    { phrase: "Pursuant to", th: "ตามที่กำหนดใน / อาศัยอำนาจตาม", example: "Pursuant to Clause 5, the payment is due." },
    { phrase: "Without prejudice", th: "โดยไม่กระทบสิทธิ์", example: "This offer is made without prejudice." },
    { phrase: "In accordance with", th: "เป็นไปตาม / สอดคล้องกับ", example: "In accordance with the law, we must disclose." },
    { phrase: "Subject to", th: "ภายใต้เงื่อนไข", example: "Subject to approval, the deal will proceed." },
    { phrase: "Notwithstanding", th: "แม้จะมี / โดยไม่คำนึงถึง", example: "Notwithstanding the above, the clause applies." },
    { phrase: "Hereinafter referred to as", th: "ต่อไปนี้เรียกว่า", example: "ABC Co., hereinafter referred to as 'the Company'." },
    { phrase: "Indemnify and hold harmless", th: "ชดใช้และปกป้องจากความเสียหาย", example: "The client shall indemnify and hold harmless the firm." },
    { phrase: "At your earliest convenience", th: "เมื่อสะดวกโดยเร็ว", example: "Please respond at your earliest convenience." },
    { phrase: "Reserve the right", th: "สงวนสิทธิ์", example: "Our client reserves the right to take legal action." },
    { phrase: "Breach of contract", th: "การผิดสัญญา", example: "This constitutes a clear breach of contract." },
    { phrase: "Force majeure", th: "เหตุสุดวิสัย", example: "The delay was caused by a force majeure event." },
    { phrase: "Due diligence", th: "การตรวจสอบอย่างรอบคอบ", example: "We must complete due diligence before signing." },
  ],
  mistakes: [
    { wrong: "Discuss about", right: "Discuss", th: "ไม่ต้องใส่ 'about' หลัง discuss", example: "Let's discuss the contract. (ไม่ใช่ discuss about)" },
    { wrong: "Make homework", right: "Do homework", th: "ใช้ 'do' กับงานประจำ", example: "I need to do my homework tonight." },
    { wrong: "I am agree", right: "I agree", th: "'agree' เป็น verb ไม่ใช่ adjective", example: "I agree with your point." },
    { wrong: "Explain me", right: "Explain to me", th: "ต้องมี 'to' หลัง explain", example: "Can you explain this to me?" },
    { wrong: "I look forward to meet", right: "I look forward to meeting", th: "หลัง 'to' ต้องใช้ -ing", example: "I look forward to meeting you." },
    { wrong: "According to my opinion", right: "In my opinion", th: "ไม่ใช้ 'according to' กับความเห็นตัวเอง", example: "In my opinion, the clause is ambiguous." },
    { wrong: "Make a decision about", right: "Make a decision on", th: "ใช้ 'on' ไม่ใช่ 'about'", example: "We need to make a decision on this matter." },
    { wrong: "Cope up with", right: "Cope with", th: "ไม่มี 'up' ใน cope with", example: "It's hard to cope with the workload." },
  ],
};

// ── Sample Dialogues ─────────────────────────────────────────────
const DIALOGUES = {
  general: [
    {
      id: "smalltalk", title: "Small Talk at a Conference", th: "คุยเล่นในงานสัมมนา",
      lines: [
        { speaker: "A", text: "Hi, is this your first time at this conference?" },
        { speaker: "B", text: "Yes, it is! I wasn't sure what to expect, honestly." },
        { speaker: "A", text: "Same here. There are some really interesting sessions today." },
        { speaker: "B", text: "Agreed. Are you attending the panel discussion at 2?" },
        { speaker: "A", text: "Absolutely. I've been looking forward to it all week." },
        { speaker: "B", text: "Great, maybe we can grab coffee after and compare notes!" },
      ]
    },
    {
      id: "meeting", title: "Starting a Business Meeting", th: "เริ่มต้นประชุมธุรกิจ",
      lines: [
        { speaker: "A", text: "Good morning everyone. Shall we get started?" },
        { speaker: "B", text: "Sure. Before we begin, let me share my screen." },
        { speaker: "A", text: "Thanks. So today's agenda covers three main points." },
        { speaker: "B", text: "Could you speak up a little? The connection isn't great on my end." },
        { speaker: "A", text: "Of course. Can everyone hear me clearly now?" },
        { speaker: "B", text: "Much better, thank you. Please go ahead." },
      ]
    },
    {
      id: "email_followup", title: "Following Up on an Email", th: "ติดตามอีเมลที่ส่งไป",
      lines: [
        { speaker: "A", text: "Hi Sarah, I just wanted to follow up on my email from Tuesday." },
        { speaker: "B", text: "Oh yes, sorry for the delay. I've been swamped this week." },
        { speaker: "A", text: "No worries at all. Have you had a chance to review the proposal?" },
        { speaker: "B", text: "I have, and I think it looks promising. I have a few questions though." },
        { speaker: "A", text: "Of course, happy to answer anything. What would you like to know?" },
        { speaker: "B", text: "Let's jump on a call tomorrow. Does 10 AM work for you?" },
      ]
    },
  ],
  legal: [
    {
      id: "client_first", title: "First Meeting with a Client", th: "รับปรึกษาลูกค้าครั้งแรก",
      lines: [
        { speaker: "Lawyer", text: "Good morning. Please have a seat. How can I assist you today?" },
        { speaker: "Client", text: "Thank you. I'm dealing with a contract dispute with my former business partner." },
        { speaker: "Lawyer", text: "I see. Could you walk me through the key facts from the beginning?" },
        { speaker: "Client", text: "Of course. We entered into a partnership agreement about two years ago..." },
        { speaker: "Lawyer", text: "And when did the dispute arise? Was there a specific incident that triggered it?" },
        { speaker: "Client", text: "Yes, it started when he refused to honor the profit-sharing clause." },
        { speaker: "Lawyer", text: "I understand. Do you have a copy of the agreement with you today?" },
        { speaker: "Client", text: "Yes, I brought all the relevant documents as you requested." },
      ]
    },
    {
      id: "negotiation", title: "Settlement Negotiation Call", th: "โทรเจรจาตกลงคดี",
      lines: [
        { speaker: "Lawyer A", text: "Good afternoon. Thank you for making time for this call." },
        { speaker: "Lawyer B", text: "Of course. I understand you'd like to discuss a settlement." },
        { speaker: "Lawyer A", text: "That's correct. My client is open to an amicable resolution." },
        { speaker: "Lawyer B", text: "We appreciate that. What figure does your client have in mind?" },
        { speaker: "Lawyer A", text: "Without prejudice, we're proposing a sum of 500,000 Baht as full and final settlement." },
        { speaker: "Lawyer B", text: "I'll need to take that back to my client. Can we reconvene on Thursday?" },
        { speaker: "Lawyer A", text: "Thursday works for us. Shall we say 2 PM?" },
      ]
    },
    {
      id: "legal_opinion", title: "Delivering a Legal Opinion", th: "ให้ความเห็นทางกฎหมาย",
      lines: [
        { speaker: "Lawyer", text: "Thank you for your patience. I've completed my review of the matter." },
        { speaker: "Client", text: "I've been anxious to hear your assessment." },
        { speaker: "Lawyer", text: "In my opinion, you have a reasonably strong case based on the evidence." },
        { speaker: "Client", text: "That's reassuring. What are the main strengths?" },
        { speaker: "Lawyer", text: "Primarily, the breach of contract is well-documented. The paper trail is clear." },
        { speaker: "Client", text: "And the risks? I need to understand the full picture." },
        { speaker: "Lawyer", text: "The main risk is the opposing party may counter-claim. We need to be prepared for that." },
        { speaker: "Client", text: "Understood. What do you recommend as the next step?" },
      ]
    },
  ],
};

// ── Speech helpers ───────────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
function useSpeechRecog({ onResult }) {
  const ref = useRef(null);
  const [listening, setListening] = useState(false);
  const start = () => {
    if (!SpeechRecognition) { alert("กรุณาใช้ Chrome"); return; }
    const r = new SpeechRecognition();
    r.lang = "en-US"; r.interimResults = false;
    r.onresult = e => onResult(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    ref.current = r; r.start(); setListening(true);
  };
  const stop = () => { ref.current?.stop(); setListening(false); };
  return { listening, start, stop };
}
function tts(text, onEnd) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = 0.85;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");

  // vocab
  const [vocabList, setVocabList] = useState(SAMPLE_VOCAB);
  const [newPhrase, setNewPhrase] = useState("");
  const [newContext, setNewContext] = useState("");
  const [liveResult, setLiveResult] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const liveTimer = useRef(null);
  const [vocabFilter, setVocabFilter] = useState("all");
  const [fbReady, setFbReady] = useState(false);

  // ── Firebase: load vocab realtime ────────────────────────────
  useEffect(() => {
    try {
      const q = query(collection(db, "vocab"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        if (!snap.empty) {
          setVocabList(snap.docs.map(d => ({ ...d.data(), docId: d.id })));
        }
        setFbReady(true);
      }, () => setFbReady(true));
      return () => unsub();
    } catch { setFbReady(true); }
  }, []);

  // chat
  const [selectedSit, setSelectedSit] = useState(null);
  const [sitCat, setSitCat] = useState("general");
  const [chatHistory, setChatHistory] = useState([]);
  const [userMsg, setUserMsg] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [shownTrans, setShownTrans] = useState({});

  // daily
  const [dailyMode, setDailyMode] = useState("general");
  const [dailyIdx, setDailyIdx] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [dailySaid, setDailySaid] = useState("");
  const [dailyFb, setDailyFb] = useState("");
  const [dailyFbLoading, setDailyFbLoading] = useState(false);

  // quiz
  const [quizCard, setQuizCard] = useState(null);
  const [quizFlipped, setQuizFlipped] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, wrong: 0 });
  const [quizMode, setQuizMode] = useState("meaning");

  // mistake log
  const [mistakes, setMistakes] = useState([]);

  // tools - phrase bank
  const [pbSection, setPbSection] = useState("native"); // native | legal | mistakes
  const [savedPhrases, setSavedPhrases] = useState([]);

  // tools - dialogues
  const [dlgSection, setDlgSection] = useState("general");
  const [openDlg, setOpenDlg] = useState(null);
  const [playingLine, setPlayingLine] = useState(null);

  // tools tab section
  const [toolsSection, setToolsSection] = useState("phrasebank"); // phrasebank | dialogues | mistakes

  const [ttsId, setTtsId] = useState(null);
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  // ── API ──────────────────────────────────────────────────────
  const claude = async (messages, system = "", maxTokens = 800) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages }),
    });
    const d = await res.json();
    return d.content?.map(b => b.text || "").join("") || "";
  };

  // ── Live vocab lookup ────────────────────────────────────────
  useEffect(() => {
    if (!newPhrase.trim() || newPhrase.trim().length < 2) { setLiveResult(null); return; }
    clearTimeout(liveTimer.current);
    liveTimer.current = setTimeout(async () => {
      setLiveLoading(true);
      try {
        const sys = `English dictionary for Thai lawyer. JSON only, no markdown:
{"meaning_th":"คำแปลไทย","meaning_en":"definition","part_of_speech":"noun/verb/phrase","formality":"casual/neutral/formal/legal","contexts":["ctx1","ctx2","ctx3"],"examples":["ex1","ex2","ex3"],"synonyms":["s1","s2","s3"],"antonyms":["a1","a2"],"grammar_note":"tip","speaking_tip":"tip"}`;
        const txt = await claude([{ role: "user", content: `Look up: "${newPhrase.trim()}"` }], sys, 700);
        setLiveResult(JSON.parse(txt.replace(/```json|```/g, "").trim()));
      } catch { setLiveResult(null); }
      setLiveLoading(false);
    }, 600);
    return () => clearTimeout(liveTimer.current);
  }, [newPhrase]);

  const saveVocab = async () => {
    if (!newPhrase.trim() || !liveResult) return;
    const item = {
      id: Date.now(), phrase: newPhrase.trim(), meaning: liveResult.meaning_th,
      context: newContext || "General", example: liveResult.examples?.[0] || "",
      date: new Date().toISOString().split("T")[0],
      category: newContext?.toLowerCase().includes("legal") || ["legal","formal"].includes(liveResult.formality) ? "legal" : "general",
      formality: liveResult.formality, fullData: liveResult,
      createdAt: Date.now(),
    };
    try {
      await addDoc(collection(db, "vocab"), item);
      setSavedMsg(`✓ บันทึก "${newPhrase.trim()}" ลง Cloud แล้ว ☁️`);
    } catch {
      setVocabList(p => [item, ...p]);
      setSavedMsg(`✓ บันทึก "${newPhrase.trim()}" แล้ว (offline)`);
    }
    setNewPhrase(""); setNewContext(""); setLiveResult(null);
    setTimeout(() => setSavedMsg(""), 3000);
  };

  // ── Chat ─────────────────────────────────────────────────────
  const sendChat = async (text) => {
    const msg = (text || userMsg).trim();
    if (!msg || !selectedSit) return;
    const isLegal = sitCat === "legal";
    const apiHist = chatHistory.map(m => ({ role: m.role, content: m.content }));
    const newHist = [...chatHistory, { role: "user", content: msg }];
    setChatHistory(newHist); setUserMsg(""); setChatLoading(true);
    const sys = `Roleplay English conversation: "${selectedSit.title}". ${isLegal ? "Professional legal context. User is Thai lawyer." : "General conversation."}
Reply in EXACTLY this format:
[REPLY]
(1-2 sentence roleplay response)
[TRANSLATION]
(Thai translation of [REPLY] only)
[FEEDBACK]
💡 Correction & Feedback:
• Said: (quote user)
• Fix: (corrected version or "✓ Good!")
• Tip: (one native tip)
• Rating: ⭐/⭐⭐/⭐⭐⭐`;
    try {
      const raw = await claude([...apiHist, { role: "user", content: msg }], sys, 800);
      const reply = raw.match(/\[REPLY\]([\s\S]*?)\[TRANSLATION\]/)?.[1]?.trim() || raw;
      const trans = raw.match(/\[TRANSLATION\]([\s\S]*?)\[FEEDBACK\]/)?.[1]?.trim() || "";
      const feedback = raw.match(/\[FEEDBACK\]([\s\S]*)/)?.[1]?.trim() || "";
      if (feedback.includes("⭐") && !feedback.includes("⭐⭐")) {
        const fix = feedback.match(/Fix: (.+)/)?.[1];
        if (fix && fix !== "✓ Good!") setMistakes(p => [{ id: Date.now(), original: msg, correction: fix, date: new Date().toLocaleDateString("th-TH") }, ...p.slice(0, 19)]);
      }
      setChatHistory([...newHist, { role: "assistant", content: reply, translation: trans, feedback }]);
    } catch { setChatHistory([...newHist, { role: "assistant", content: "Sorry, try again.", translation: "", feedback: "" }]); }
    setChatLoading(false);
  };

  // ── Daily ────────────────────────────────────────────────────
  const getDailyFb = async (said, target) => {
    setDailyFbLoading(true); setDailyFb("");
    try {
      const fb = await claude([{ role: "user", content: `Target: "${target}"\nSaid: "${said}"\nBrief feedback + ⭐/⭐⭐/⭐⭐⭐` }], "English coach for Thai lawyer. Max 3 lines.", 200);
      setDailyFb(fb);
    } catch { setDailyFb("กรุณาลองใหม่"); }
    setDailyFbLoading(false);
  };

  // ── Quiz ─────────────────────────────────────────────────────
  const drawQuiz = () => {
    if (vocabList.length === 0) return;
    setQuizCard(vocabList[Math.floor(Math.random() * vocabList.length)]);
    setQuizFlipped(false);
  };
  useEffect(() => { if (tab === "quiz" && !quizCard) drawQuiz(); }, [tab]);

  const chatSpeech = useSpeechRecog({ onResult: t => setUserMsg(t) });
  const dailySpeech = useSpeechRecog({
    onResult: t => {
      setDailySaid(t);
      const phrases = dailyMode === "legal" ? LEGAL_PHRASES : DAILY_PHRASES;
      getDailyFb(t, phrases[dailyIdx % phrases.length].en);
    }
  });

  // ── Styles ───────────────────────────────────────────────────
  const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 };
  const goldBtn = (off) => ({ background: off ? "rgba(201,169,110,0.25)" : "#c9a96e", border: "none", borderRadius: 12, padding: "12px 20px", color: "#0a0a0f", fontSize: 13, fontWeight: 700, cursor: off ? "not-allowed" : "pointer" });
  const micBtn = (on) => ({ width: 52, height: 52, borderRadius: "50%", border: "2px solid", borderColor: on ? "#e05555" : "rgba(201,169,110,0.5)", background: on ? "rgba(224,85,85,0.15)" : "rgba(201,169,110,0.08)", cursor: "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", boxShadow: on ? "0 0 16px rgba(224,85,85,0.4)" : "none" });
  const segBtn = (active) => ({ flex: 1, padding: "8px 4px", borderRadius: 8, border: "1px solid", borderColor: active ? "#c9a96e" : "rgba(255,255,255,0.1)", background: active ? "rgba(201,169,110,0.12)" : "transparent", color: active ? "#c9a96e" : "#6b6350", fontSize: 11, cursor: "pointer", letterSpacing: 0.5, fontWeight: active ? 700 : 400 });
  const Pill = ({ label, color = "#c9a96e", bg = "rgba(201,169,110,0.12)" }) => (
    <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 20, background: bg, color, letterSpacing: 0.5 }}>{label}</span>
  );

  const dailyPhrases = dailyMode === "legal" ? LEGAL_PHRASES : DAILY_PHRASES;
  const curPhrase = dailyPhrases[dailyIdx % dailyPhrases.length];
  const filteredVocab = vocabFilter === "all" ? vocabList : vocabList.filter(v => v.category === vocabFilter);
  const TABS = [
    { id: "home", icon: "⌂", label: "Home" },
    { id: "vocab", icon: "📝", label: "Vocab" },
    { id: "speak", icon: "💬", label: "Speak" },
    { id: "daily", icon: "🎯", label: "Daily" },
    { id: "quiz", icon: "🧠", label: "Quiz" },
    { id: "tools", icon: "📚", label: "Library" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e8e4d9", fontFamily: "Georgia,serif" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(ellipse at 20% 20%,#1a1025 0%,transparent 60%),radial-gradient(ellipse at 80% 80%,#0d1a2e 0%,transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", paddingBottom: 90 }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#8b7355", textTransform: "uppercase", marginBottom: 4 }}>
            {{ home:"Dashboard",vocab:"Vocabulary Bank",speak:"Speaking Practice",chat:"Conversation",daily:"Daily Challenge",quiz:"Quiz Mode",tools:"Library"}[tab]}
          </div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#e8e4d9" }}>
            {tab === "chat" && selectedSit ? selectedSit.title : "LexisSpeak"}
          </h1>
          {tab === "chat" && selectedSit && <div style={{ fontSize: 11, color: "#8b7355", marginTop: 2 }}>{selectedSit.th}</div>}
          <div style={{ fontSize: 10, color: fbReady ? "#7ab87a" : "#8b7355", marginTop: 4 }}>{fbReady ? "☁️ Cloud sync on" : "⏳ connecting..."}</div>
        </div>

        {/* ══ HOME ══ */}
        {tab === "home" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
              {[{ n: vocabList.length, l: "Words" }, { n: vocabList.filter(v => v.category === "legal").length, l: "Legal" }, { n: quizScore.correct + quizScore.wrong > 0 ? Math.round(quizScore.correct / (quizScore.correct + quizScore.wrong) * 100) + "%" : "-", l: "Quiz %" }].map((s, i) => (
                <div key={i} style={{ ...card, textAlign: "center", marginBottom: 0, padding: "14px 8px" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#c9a96e" }}>{s.n}</div>
                  <div style={{ fontSize: 10, color: "#6b6350", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {mistakes.length > 0 && (
              <div style={{ background: "rgba(224,85,85,0.06)", border: "1px solid rgba(224,85,85,0.18)", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: "#e07070", letterSpacing: 2, marginBottom: 6 }}>⚠️ RECENT MISTAKE</div>
                <div style={{ fontSize: 13 }}>{mistakes[0].original}</div>
                <div style={{ fontSize: 12, color: "#7ab87a", marginTop: 3 }}>→ {mistakes[0].correction}</div>
              </div>
            )}
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#6b6350", textTransform: "uppercase", marginBottom: 12 }}>Quick Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { icon: "📝", title: "Add Vocabulary", sub: "แปลอัตโนมัติ", action: () => setTab("vocab") },
                { icon: "🧠", title: "Quiz Mode", sub: `${quizScore.correct}✓ ${quizScore.wrong}✗`, action: () => setTab("quiz") },
                { icon: "💬", title: "Speak Practice", sub: "General + Legal", action: () => setTab("speak") },
                { icon: "📚", title: "Library", sub: "Phrases + Dialogues", action: () => setTab("tools") },
              ].map((a, i) => (
                <button key={i} onClick={a.action} style={{ ...card, cursor: "pointer", marginBottom: 0, transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(201,169,110,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: "#6b6350", marginTop: 2 }}>{a.sub}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "#6b6350", textTransform: "uppercase", marginBottom: 10 }}>Recent Words</div>
            {vocabList.slice(0, 3).map(v => (
              <div key={v.id} style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div><span style={{ fontSize: 13, fontWeight: 600 }}>{v.phrase}</span><span style={{ fontSize: 11, color: "#6b6350", marginLeft: 8 }}>{v.meaning}</span></div>
                <Pill label={v.category} color={v.category === "legal" ? "#c9a96e" : "#64b4ff"} bg={v.category === "legal" ? "rgba(201,169,110,0.15)" : "rgba(100,180,255,0.1)"} />
              </div>
            ))}
          </div>
        )}

        {/* ══ VOCAB ══ */}
        {tab === "vocab" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ ...card, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#8b7355", marginBottom: 8, letterSpacing: 1 }}>ADD WORD / PHRASE</div>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <input value={newPhrase} onChange={e => setNewPhrase(e.target.value)}
                  placeholder="พิมพ์คำหรือประโยคภาษาอังกฤษ..."
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: `1px solid ${liveLoading ? "rgba(201,169,110,0.5)" : liveResult ? "rgba(201,169,110,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "10px 36px 10px 12px", color: "#e8e4d9", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "Georgia,serif", transition: "border-color 0.3s" }} />
                <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: liveResult ? "#7ab87a" : "#c9a96e" }}>{liveLoading ? "⏳" : liveResult ? "✓" : ""}</div>
              </div>
              <button onClick={saveVocab} disabled={!liveResult || !newPhrase.trim()} style={{ ...goldBtn(!liveResult || !newPhrase.trim()), width: "100%", letterSpacing: 1 }}>
                {liveLoading ? "กำลังวิเคราะห์..." : liveResult ? "✦ SAVE TO VOCABULARY" : "พิมพ์คำเพื่อดูคำแปล..."}
              </button>
              {savedMsg && <div style={{ fontSize: 12, color: "#7ab87a", marginTop: 8, textAlign: "center" }}>{savedMsg}</div>}
            </div>
            {(liveLoading || liveResult) && (
              <div style={{ background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: 16, padding: 16, marginBottom: 14 }}>
                {liveLoading ? <div style={{ fontSize: 13, color: "#8b7355", textAlign: "center", padding: 10 }}>⏳ กำลังวิเคราะห์...</div> : liveResult && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{newPhrase}</div>
                        <div style={{ fontSize: 14, color: "#c9a96e", fontWeight: 600 }}>{liveResult.meaning_th}</div>
                        <div style={{ fontSize: 12, color: "#8b7355", marginTop: 1 }}>{liveResult.meaning_en}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end" }}>
                        {liveResult.part_of_speech && <Pill label={liveResult.part_of_speech} />}
                        {liveResult.formality && <Pill label={liveResult.formality} color={["legal","formal"].includes(liveResult.formality) ? "#c9a96e" : "#64b4ff"} bg={["legal","formal"].includes(liveResult.formality) ? "rgba(201,169,110,0.12)" : "rgba(100,180,255,0.1)"} />}
                      </div>
                    </div>
                    {liveResult.contexts?.length > 0 && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "#6b6350", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>📍 ใช้ในสถานการณ์</div>{liveResult.contexts.map((c, i) => <div key={i} style={{ fontSize: 12, color: "#a89880", padding: "3px 0 3px 10px", borderLeft: "2px solid rgba(201,169,110,0.3)", marginBottom: 2 }}>• {c}</div>)}</div>}
                    {liveResult.examples?.length > 0 && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9, color: "#6b6350", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>✏️ รูปประโยค</div>{liveResult.examples.map((ex, i) => <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "7px 10px", fontSize: 12, color: "#b0a898", fontStyle: "italic", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}><span>"{ex}"</span><button onClick={() => { setTtsId(`ex${i}`); tts(ex, () => setTtsId(null)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, opacity: ttsId === `ex${i}` ? 1 : 0.4, marginLeft: 6 }}>🔊</button></div>)}</div>}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                      {liveResult.synonyms?.length > 0 && <div><div style={{ fontSize: 9, color: "#7ab87a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>≈ คำคล้ายกัน</div>{liveResult.synonyms.map((s, i) => <div key={i} style={{ fontSize: 12, color: "#7ab87a" }}>• {s}</div>)}</div>}
                      {liveResult.antonyms?.length > 0 && <div><div style={{ fontSize: 9, color: "#e07070", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>↔ คำตรงข้าม</div>{liveResult.antonyms.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#e07070" }}>• {a}</div>)}</div>}
                    </div>
                    {liveResult.grammar_note && <div style={{ fontSize: 11, color: "#6b9bd2", marginBottom: 3 }}>📌 {liveResult.grammar_note}</div>}
                    {liveResult.speaking_tip && <div style={{ fontSize: 11, color: "#7ab87a" }}>🗣️ {liveResult.speaking_tip}</div>}
                  </>
                )}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["all","general","legal"].map(f => <button key={f} onClick={() => setVocabFilter(f)} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", borderColor: vocabFilter === f ? "#c9a96e" : "rgba(255,255,255,0.1)", background: vocabFilter === f ? "rgba(201,169,110,0.15)" : "transparent", color: vocabFilter === f ? "#c9a96e" : "#6b6350", fontSize: 11, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>{f}</button>)}
            </div>
            {filteredVocab.map(v => (
              <div key={v.id} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{v.phrase}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => { setTtsId(v.id); tts(v.phrase, () => setTtsId(null)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, opacity: ttsId === v.id ? 1 : 0.4 }}>🔊</button>
                    <Pill label={v.category} color={v.category === "legal" ? "#c9a96e" : "#64b4ff"} bg={v.category === "legal" ? "rgba(201,169,110,0.15)" : "rgba(100,180,255,0.1)"} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#c9a96e", marginBottom: 2 }}>{v.meaning}</div>
                <div style={{ fontSize: 11, color: "#5a5040", fontStyle: "italic", marginBottom: v.fullData ? 5 : 0 }}>{v.example}</div>
                {v.fullData && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{v.fullData.synonyms?.slice(0,2).map((s,i) => <span key={i} style={{ fontSize: 10, color: "#7ab87a" }}>≈ {s}</span>)}{v.fullData.antonyms?.slice(0,1).map((a,i) => <span key={i} style={{ fontSize: 10, color: "#e07070" }}>↔ {a}</span>)}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ══ SPEAK ══ */}
        {tab === "speak" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["general","legal"].map(c => <button key={c} onClick={() => setSitCat(c)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid", borderColor: sitCat === c ? "#c9a96e" : "rgba(255,255,255,0.1)", background: sitCat === c ? "rgba(201,169,110,0.12)" : "transparent", color: sitCat === c ? "#c9a96e" : "#6b6350", fontSize: 12, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{c === "legal" ? "⚖️ Legal" : "🗣️ General"}</button>)}
            </div>
            {SITUATIONS[sitCat].map(sit => (
              <button key={sit.id} onClick={() => { setSelectedSit(sit); setChatHistory([{ role: "assistant", content: sit.starter, translation: "", feedback: "" }]); setShownTrans({}); setTab("chat"); }}
                style={{ width: "100%", ...card, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 10, transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(201,169,110,0.06)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                <span style={{ fontSize: 24 }}>{sit.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{sit.title}</div>
                  <div style={{ fontSize: 11, color: "#6b6350", marginTop: 2 }}>{sit.th}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ══ CHAT ══ */}
        {tab === "chat" && (
          <div style={{ padding: "0 20px" }}>
            <button onClick={() => { setTab("speak"); setChatHistory([]); setSelectedSit(null); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#6b6350", fontSize: 11, padding: "6px 12px", cursor: "pointer", marginBottom: 12, letterSpacing: 1 }}>← Back</button>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 12, minHeight: 260, maxHeight: 400, overflowY: "auto", marginBottom: 12 }}>
              {chatHistory.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", gap: 6 }}>
                      <div style={{ maxWidth: "85%" }}>
                        <div style={{ background: isUser ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.05)", borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "9px 13px", fontSize: 13, color: isUser ? "#e8e4d9" : "#b8b0a0", lineHeight: 1.6 }}>
                          {msg.content}
                          {!isUser && (
                            <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                              <button onClick={() => { setTtsId(`c${i}`); tts(msg.content, () => setTtsId(null)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: ttsId === `c${i}` ? 1 : 0.4 }}>🔊</button>
                              {msg.translation && <button onClick={() => setShownTrans(p => ({ ...p, [i]: !p[i] }))} style={{ background: shownTrans[i] ? "rgba(201,169,110,0.2)" : "rgba(255,255,255,0.06)", border: "1px solid", borderColor: shownTrans[i] ? "rgba(201,169,110,0.4)" : "rgba(255,255,255,0.12)", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 10, color: shownTrans[i] ? "#c9a96e" : "#6b6350" }}>🇹🇭 {shownTrans[i] ? "ซ่อน" : "แปล"}</button>}
                            </div>
                          )}
                        </div>
                        {!isUser && shownTrans[i] && msg.translation && <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px 12px 12px 12px", padding: "8px 12px", fontSize: 12, color: "#a89880", marginTop: 4, fontStyle: "italic" }}>🇹🇭 {msg.translation}</div>}
                        {!isUser && msg.feedback && <div style={{ background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.18)", borderRadius: "4px 12px 12px 12px", padding: "9px 13px", fontSize: 12, color: "#c9a96e", lineHeight: 1.7, marginTop: 5, whiteSpace: "pre-wrap" }}>{msg.feedback}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {chatLoading && <div style={{ color: "#6b6350", fontSize: 13, fontStyle: "italic" }}>typing...</div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => chatSpeech.listening ? chatSpeech.stop() : chatSpeech.start()} style={micBtn(chatSpeech.listening)}>{chatSpeech.listening ? "⏹" : "🎤"}</button>
              <input value={userMsg} onChange={e => setUserMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder={chatSpeech.listening ? "🔴 Listening..." : "Type or 🎤 speak..."} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${chatSpeech.listening ? "rgba(224,85,85,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "11px 13px", color: "#e8e4d9", fontSize: 13, outline: "none", fontFamily: "Georgia,serif" }} />
              <button onClick={() => sendChat()} disabled={chatLoading || !userMsg.trim()} style={{ ...goldBtn(chatLoading || !userMsg.trim()), padding: "12px 16px", fontSize: 15 }}>→</button>
            </div>
            {chatSpeech.listening && <div style={{ textAlign: "center", fontSize: 11, color: "#e05555", marginTop: 6 }}>🔴 Recording... tap ⏹ to stop</div>}
          </div>
        )}

        {/* ══ DAILY ══ */}
        {tab === "daily" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {["general","legal"].map(c => <button key={c} onClick={() => { setDailyMode(c); setDailyIdx(0); setShowMeaning(false); setDailySaid(""); setDailyFb(""); }} style={{ flex: 1, padding: "9px", borderRadius: 10, border: "1px solid", borderColor: dailyMode === c ? "#c9a96e" : "rgba(255,255,255,0.1)", background: dailyMode === c ? "rgba(201,169,110,0.12)" : "transparent", color: dailyMode === c ? "#c9a96e" : "#6b6350", fontSize: 12, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>{c === "legal" ? "⚖️ Legal" : "🗣️ General"}</button>)}
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "24px 20px", marginBottom: 14, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#6b6350", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>Phrase {dailyIdx + 1} / {dailyPhrases.length}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "#e8e4d9", lineHeight: 1.5, marginBottom: 18, fontStyle: "italic" }}>"{curPhrase.en}"</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 14 }}>
                <button onClick={() => { setTtsId("daily"); tts(curPhrase.en, () => setTtsId(null)); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 16px", color: "#e8e4d9", fontSize: 13, cursor: "pointer" }}>{ttsId === "daily" ? "⏸" : "🔊"} Listen</button>
                <button onClick={() => setShowMeaning(!showMeaning)} style={{ background: showMeaning ? "rgba(201,169,110,0.15)" : "rgba(255,255,255,0.05)", border: "1px solid", borderColor: showMeaning ? "rgba(201,169,110,0.3)" : "rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 16px", color: showMeaning ? "#c9a96e" : "#e8e4d9", fontSize: 13, cursor: "pointer" }}>{showMeaning ? "Hide" : "💡 ความหมาย"}</button>
              </div>
              {showMeaning && <div style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.15)", borderRadius: 10, padding: "10px", fontSize: 14, color: "#c9a96e", marginBottom: 14 }}>{curPhrase.th}</div>}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <button onClick={() => { setDailySaid(""); setDailyFb(""); dailySpeech.listening ? dailySpeech.stop() : dailySpeech.start(); }} style={{ ...micBtn(dailySpeech.listening), width: 62, height: 62, fontSize: 26 }}>{dailySpeech.listening ? "⏹" : "🎤"}</button>
                <div style={{ fontSize: 11, color: dailySpeech.listening ? "#e05555" : "#6b6350" }}>{dailySpeech.listening ? "🔴 Recording..." : "Tap to speak"}</div>
              </div>
            </div>
            {dailySaid && <div style={{ ...card, marginBottom: 8 }}><div style={{ fontSize: 10, color: "#6b6350", letterSpacing: 2, marginBottom: 4 }}>YOU SAID</div><div style={{ fontSize: 13, fontStyle: "italic" }}>"{dailySaid}"</div></div>}
            {dailyFbLoading && <div style={{ ...card, fontSize: 13, color: "#6b6350", fontStyle: "italic" }}>Analyzing...</div>}
            {dailyFb && <div style={{ background: "rgba(201,169,110,0.07)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: 14, padding: "12px 16px", marginBottom: 12 }}><div style={{ fontSize: 10, color: "#c9a96e", letterSpacing: 2, marginBottom: 5 }}>💡 FEEDBACK</div><div style={{ fontSize: 13, color: "#c9a96e", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{dailyFb}</div></div>}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setDailyIdx(i => Math.max(0,i-1)); setShowMeaning(false); setDailySaid(""); setDailyFb(""); }} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", color: "#6b6350", fontSize: 13, cursor: "pointer" }}>← Prev</button>
              <button onClick={() => { setDailyIdx(i => (i+1) % dailyPhrases.length); setShowMeaning(false); setDailySaid(""); setDailyFb(""); }} style={{ ...goldBtn(false), flex: 1, padding: "12px" }}>Next →</button>
            </div>
          </div>
        )}

        {/* ══ QUIZ ══ */}
        {tab === "quiz" && (
          <div style={{ padding: "0 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
              {[{ n: quizScore.correct, l: "CORRECT", c: "#7ab87a", bg: "rgba(122,184,122,0.1)", bc: "rgba(122,184,122,0.25)" }, { n: quizScore.wrong, l: "WRONG", c: "#e07070", bg: "rgba(224,85,85,0.1)", bc: "rgba(224,85,85,0.2)" }, { n: quizScore.correct + quizScore.wrong > 0 ? Math.round(quizScore.correct / (quizScore.correct + quizScore.wrong) * 100) + "%" : "0%", l: "ACCURACY", c: "#c9a96e", bg: "rgba(201,169,110,0.1)", bc: "rgba(201,169,110,0.2)" }].map((s, i) => (
                <div key={i} style={{ background: s.bg, border: `1px solid ${s.bc}`, borderRadius: 10, padding: "10px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.n}</div>
                  <div style={{ fontSize: 9, color: s.c, letterSpacing: 1, opacity: 0.7 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[{ id: "meaning", label: "🇹🇭 Meaning" }, { id: "sentence", label: "✏️ Sentence" }].map(m => <button key={m.id} onClick={() => { setQuizMode(m.id); setQuizCard(null); setQuizFlipped(false); setTimeout(drawQuiz, 0); }} style={segBtn(quizMode === m.id)}>{m.label}</button>)}
            </div>
            {vocabList.length === 0 ? (
              <div style={{ ...card, textAlign: "center", padding: 30 }}>
                <div style={{ fontSize: 30, marginBottom: 10 }}>📝</div>
                <div style={{ fontSize: 13, color: "#6b6350" }}>ยังไม่มีคำศัพท์ในคลัง ไปเพิ่มที่หน้า Vocab ก่อนนะครับ</div>
              </div>
            ) : quizCard && (
              <>
                <div onClick={() => setQuizFlipped(f => !f)} style={{ background: quizFlipped ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${quizFlipped ? "rgba(201,169,110,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, padding: "36px 24px", marginBottom: 14, textAlign: "center", cursor: "pointer", minHeight: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
                  {!quizFlipped ? (
                    <>
                      <div style={{ fontSize: 10, color: "#6b6350", letterSpacing: 3, textTransform: "uppercase", marginBottom: 16 }}>{quizMode === "meaning" ? "คำนี้แปลว่าอะไร?" : "นึกประโยคตัวอย่างได้ไหม?"}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: "#e8e4d9", marginBottom: 8 }}>{quizCard.phrase}</div>
                      <Pill label={quizCard.category} color={quizCard.category === "legal" ? "#c9a96e" : "#64b4ff"} bg={quizCard.category === "legal" ? "rgba(201,169,110,0.15)" : "rgba(100,180,255,0.1)"} />
                      <div style={{ fontSize: 11, color: "#4a4030", marginTop: 20 }}>แตะเพื่อดูเฉลย</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 10, color: "#c9a96e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>เฉลย</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#c9a96e", marginBottom: 8 }}>{quizCard.meaning}</div>
                      {quizCard.example && <div style={{ fontSize: 13, color: "#8b7355", fontStyle: "italic", lineHeight: 1.6 }}>"{quizCard.example}"</div>}
                      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                        {quizCard.fullData?.synonyms?.slice(0,2).map((s,i) => <span key={i} style={{ fontSize: 11, color: "#7ab87a" }}>≈ {s}</span>)}
                      </div>
                    </>
                  )}
                </div>
                {quizFlipped && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <button onClick={() => { setQuizScore(s => ({ ...s, wrong: s.wrong+1 })); drawQuiz(); }} style={{ background: "rgba(224,85,85,0.12)", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 12, padding: "13px", color: "#e07070", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✗ ยังจำไม่ได้</button>
                    <button onClick={() => { setQuizScore(s => ({ ...s, correct: s.correct+1 })); drawQuiz(); }} style={{ background: "rgba(122,184,122,0.12)", border: "1px solid rgba(122,184,122,0.3)", borderRadius: 12, padding: "13px", color: "#7ab87a", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>✓ จำได้แล้ว!</button>
                  </div>
                )}
                <button onClick={() => { setQuizFlipped(false); drawQuiz(); }} style={{ ...goldBtn(false), width: "100%", letterSpacing: 1 }}>→ ข้ามการ์ดนี้</button>
              </>
            )}
          </div>
        )}

        {/* ══ LIBRARY (Tools) ══ */}
        {tab === "tools" && (
          <div style={{ padding: "0 20px" }}>
            {/* Section tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {[{ id: "phrasebank", label: "📖 Phrases" }, { id: "dialogues", label: "🎭 Dialogues" }, { id: "mistakes", label: "⚠️ Mistakes" }].map(s => (
                <button key={s.id} onClick={() => setToolsSection(s.id)} style={{ ...segBtn(toolsSection === s.id), flex: 1, padding: "9px 4px", fontSize: 11 }}>{s.label}</button>
              ))}
            </div>

            {/* ─ Phrase Bank ─ */}
            {toolsSection === "phrasebank" && (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {[{ id: "native", label: "🗣️ Native" }, { id: "legal", label: "⚖️ Legal" }].map(s => (
                    <button key={s.id} onClick={() => setPbSection(s.id)} style={{ ...segBtn(pbSection === s.id), flex: 1 }}>{s.label}</button>
                  ))}
                </div>
                {PHRASE_BANK[pbSection].map((item, i) => (
                  <div key={i} style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e4d9", flex: 1 }}>{"phrase" in item ? item.phrase : item.wrong}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { setTtsId(`pb${i}`); tts("phrase" in item ? item.phrase : item.right, () => setTtsId(null)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, opacity: ttsId === `pb${i}` ? 1 : 0.4 }}>🔊</button>
                        {"phrase" in item && !savedPhrases.find(p => p === item.phrase) && (
                          <button onClick={async () => {
                            setSavedPhrases(p => [...p, item.phrase]);
                            const newItem = { id: Date.now(), phrase: item.phrase, meaning: item.th, context: pbSection === "legal" ? "Legal" : "General", example: item.example, date: new Date().toISOString().split("T")[0], category: pbSection, createdAt: Date.now() };
                            try { await addDoc(collection(db, "vocab"), newItem); } catch { setVocabList(prev => [newItem, ...prev]); }
                          }} style={{ background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.3)", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 10, color: "#c9a96e" }}>+ Save</button>
                        )}
                        {"phrase" in item && savedPhrases.find(p => p === item.phrase) && <span style={{ fontSize: 10, color: "#7ab87a" }}>✓ Saved</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: "#c9a96e", marginBottom: 4 }}>{item.th}</div>
                    <div style={{ fontSize: 12, color: "#5a5040", fontStyle: "italic" }}>"{item.example}"</div>
                  </div>
                ))}
              </>
            )}

            {/* ─ Dialogues ─ */}
            {toolsSection === "dialogues" && (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {["general","legal"].map(c => <button key={c} onClick={() => { setDlgSection(c); setOpenDlg(null); }} style={{ ...segBtn(dlgSection === c), flex: 1 }}>{c === "legal" ? "⚖️ Legal" : "🗣️ General"}</button>)}
                </div>
                {!openDlg ? (
                  DIALOGUES[dlgSection].map(d => (
                    <button key={d.id} onClick={() => setOpenDlg(d)} style={{ width: "100%", ...card, cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(201,169,110,0.06)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
                        <div style={{ fontSize: 11, color: "#6b6350", marginTop: 2 }}>{d.th} · {d.lines.length} lines</div>
                      </div>
                      <span style={{ color: "#c9a96e", fontSize: 16 }}>›</span>
                    </button>
                  ))
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <button onClick={() => { setOpenDlg(null); setPlayingLine(null); window.speechSynthesis.cancel(); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#6b6350", fontSize: 11, padding: "6px 12px", cursor: "pointer" }}>← Back</button>
                      <button onClick={() => {
                        let i = 0;
                        const playNext = () => {
                          if (i >= openDlg.lines.length) { setPlayingLine(null); return; }
                          setPlayingLine(i);
                          tts(openDlg.lines[i].text, () => { i++; setTimeout(playNext, 400); });
                        };
                        playNext();
                      }} style={{ ...goldBtn(false), padding: "8px 16px", fontSize: 12 }}>▶ Play All</button>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#c9a96e", marginBottom: 14, textAlign: "center" }}>{openDlg.title}</div>
                    {openDlg.lines.map((line, i) => (
                      <div key={i} style={{ ...card, borderColor: playingLine === i ? "rgba(201,169,110,0.4)" : "rgba(255,255,255,0.07)", background: playingLine === i ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.02)", marginBottom: 8, transition: "all 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: "#8b7355", letterSpacing: 1, marginBottom: 4 }}>{line.speaker}</div>
                            <div style={{ fontSize: 13, color: "#e8e4d9", lineHeight: 1.6 }}>{line.text}</div>
                          </div>
                          <button onClick={() => { setPlayingLine(i); tts(line.text, () => setPlayingLine(null)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, opacity: playingLine === i ? 1 : 0.4, marginLeft: 10, flexShrink: 0 }}>🔊</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {/* ─ Common Mistakes ─ */}
            {toolsSection === "mistakes" && (
              <>
                <div style={{ fontSize: 11, color: "#6b6350", letterSpacing: 2, marginBottom: 14 }}>ข้อผิดพลาดที่คนไทยทำบ่อย — เรียนรู้ก่อนติดนิสัย</div>
                {PHRASE_BANK.mistakes.map((item, i) => (
                  <div key={i} style={{ ...card, borderColor: "rgba(224,85,85,0.12)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, color: "#e07070", textDecoration: "line-through", marginBottom: 2 }}>✗ {item.wrong}</div>
                        <div style={{ fontSize: 13, color: "#7ab87a", fontWeight: 600 }}>✓ {item.right}</div>
                      </div>
                      <button onClick={() => { setTtsId(`mk${i}`); tts(item.right, () => setTtsId(null)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, opacity: ttsId === `mk${i}` ? 1 : 0.4 }}>🔊</button>
                    </div>
                    <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 5 }}>📌 {item.th}</div>
                    <div style={{ fontSize: 12, color: "#5a5040", fontStyle: "italic" }}>"{item.example}"</div>
                  </div>
                ))}
                {mistakes.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "#e07070", letterSpacing: 2, marginTop: 20, marginBottom: 12 }}>⚠️ MY MISTAKE LOG</div>
                    {mistakes.map(m => (
                      <div key={m.id} style={{ ...card, borderColor: "rgba(224,85,85,0.15)" }}>
                        <div style={{ fontSize: 10, color: "#6b6350", marginBottom: 4 }}>{m.date}</div>
                        <div style={{ fontSize: 13, color: "#e07070" }}>✗ {m.original}</div>
                        <div style={{ fontSize: 13, color: "#7ab87a", marginTop: 3 }}>✓ {m.correction}</div>
                        <button onClick={() => { setTtsId(`ml${m.id}`); tts(m.correction, () => setTtsId(null)); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#6b6350", marginTop: 4, opacity: ttsId === `ml${m.id}` ? 1 : 0.6 }}>🔊 ฟังประโยคที่ถูก</button>
                      </div>
                    ))}
                    <button onClick={() => setMistakes([])} style={{ background: "none", border: "1px solid rgba(224,85,85,0.3)", borderRadius: 10, padding: "10px", width: "100%", color: "#e07070", fontSize: 12, cursor: "pointer", marginTop: 6 }}>Clear My Mistakes</button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", padding: "8px 0 12px", zIndex: 100 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== "chat") setSelectedSit(null); }} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: 0.3, color: tab === t.id ? "#c9a96e" : "#4a4030", fontWeight: tab === t.id ? 700 : 400 }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#c9a96e" }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
