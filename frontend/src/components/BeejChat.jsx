import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './BeejChat.module.css';
import { useSessionStore } from '../hooks/useSessionStore';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// ── Helpers ──────────────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function detectSourceBadges(text) {
  const b = [];
  if (text.includes('🟢')) b.push('api');
  if (text.includes('🔵')) b.push('user');
  if (text.includes('🟡')) b.push('estimated');
  return b;
}

/** Render Markdown-like text: **bold**, newlines, horizontal rules */
function RichText({ text }) {
  return (
    <>
      {text.split('\n').map((line, i, arr) => {
        if (line.startsWith('---')) return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(111,187,124,0.15)', margin: '0.6rem 0' }} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        );
        return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
      })}
    </>
  );
}

/** Render Markdown report as HTML-ish spans */
function ReportBody({ text }) {
  // Convert markdown to HTML-safe format for display
  const lines = text.split('\n');
  return (
    <div>
      {lines.map((line, i) => {
        if (line.startsWith('# '))  return <h1 key={i}>{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
        if (line.startsWith('### '))return <h3 key={i}>{line.slice(4)}</h3>;
        if (line.startsWith('---')) return <hr key={i} />;
        if (line.startsWith('| ')) {
          // Table row
          const cells = line.split('|').filter((c,ci,a) => ci > 0 && ci < a.length - 1);
          const isHeader = lines[i+1]?.includes('|---|');
          const isSep    = line.includes('|---|');
          if (isSep) return null;
          const Tag = isHeader ? 'th' : 'td';
          return (
            <table key={i} style={{ display: cells.length > 1 ? undefined : 'none' }}>
              <tbody>
                <tr>
                  {cells.map((c, j) => <Tag key={j} dangerouslySetInnerHTML={{ __html: c.trim().replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />)}
                </tr>
              </tbody>
            </table>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i}>{line.slice(2)}</li>;
        if (/^\d+\. /.test(line)) return <li key={i}>{line.replace(/^\d+\. /, '')}</li>;
        if (!line.trim()) return <br key={i} />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        );
        return <p key={i}>{parts}</p>;
      })}
    </div>
  );
}

// Language code map for SpeechRecognition + TTS
const LANG_CODES = {
  en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', gu: 'gu-IN',
  ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', bn: 'bn-IN',
};

// ── Voice helpers ────────────────────────────────────────────────
function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function speakText(text, onEnd, langCode = 'en-IN') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[🟢🔵🟡🌱📋🏢📊💰🏛️⚠️✅🎯]/gu, '').replace(/\*\*/g, '').replace(/#{1,3} /g, '');
  const utt = new SpeechSynthesisUtterance(clean.slice(0, 800));
  utt.rate = 1.0;
  utt.pitch = 1.0;
  utt.lang = langCode;
  if (onEnd) utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ══════════════════════════════════════════════════════════════════
// BeejChat Component
// ══════════════════════════════════════════════════════════════════
export default function BeejChat({ businessContext, session, onBack, onNewSession, fromVoice }) {
  const store = useSessionStore();

  // ── Session state ────────────────────────────────────────────
  const [sessions,          setSessions]          = useState(() => store.getAllSessions());
  const [currentSessionId,  setCurrentSessionId]  = useState(null);
  const [sidebarOpen,       setSidebarOpen]       = useState(true);

  // ── Chat state ───────────────────────────────────────────────
  const [messages,          setMessages]          = useState([]);
  const [followups,         setFollowups]         = useState([]);
  const [datasetData,       setDatasetData]       = useState({});
  const [businessCtx,       setBusinessCtx]       = useState(businessContext || {});

  // ── UI state ─────────────────────────────────────────────────
  const [isStreaming,       setIsStreaming]       = useState(false);
  const [isInitializing,   setIsInitializing]    = useState(true);
  const [inputText,         setInputText]         = useState('');
  const [statusDot,         setStatusDot]         = useState('online');

  // ── Voice ────────────────────────────────────────────────────
  // Derive lang from live state so language changes take effect immediately
  const lang = LANG_CODES[businessCtx?.language] || LANG_CODES[businessContext?.language] || 'en-IN';
  const [isListening,       setIsListening]       = useState(false);
  const [voiceError,        setVoiceError]        = useState('');
  // Auto-enable TTS when user came from voice input
  const [ttsEnabled,        setTtsEnabled]        = useState(!!fromVoice);
  const [isSpeaking,        setIsSpeaking]        = useState(false);
  const recogRef      = useRef(null);
  // Keep a ref to sendMessage so voice onresult always uses the latest version
  const sendMessageRef = useRef(null);

  // ── Report ───────────────────────────────────────────────────
  const [showReport,        setShowReport]        = useState(false);
  const [reportText,        setReportText]        = useState('');
  const [isGenReport,       setIsGenReport]       = useState(false);

  // ── Refs ─────────────────────────────────────────────────────
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const abortRef       = useRef(null);

  // ── Auto-scroll ──────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  // Guard: don't save session until it has been fully initialized
  const sessionReadyRef = useRef(false);

  useEffect(() => { scrollToBottom(); }, [messages, followups, scrollToBottom]);

  // ── Save session whenever messages/followups/report change ───
  // Only runs AFTER initialization is complete (guarded by sessionReadyRef)
  useEffect(() => {
    if (!currentSessionId || !sessionReadyRef.current) return;
    store.updateSession(currentSessionId, {
      messages,
      followups,
      datasetData,
      report: reportText || null,
      businessContext: businessCtx,
    });
    setSessions(store.getAllSessions());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, followups, reportText]);

  // ── On mount: create/load session ───────────────────────────
  useEffect(() => {
    const existingId = store.getCurrentSessionId();
    const existing   = existingId ? store.getSession(existingId) : null;

    if (existing && existing.messages && existing.messages.length > 0) {
      // Session has messages - restore as-is, NO new analysis
      setCurrentSessionId(existingId);
      setMessages(existing.messages);
      setFollowups(existing.followups || []);
      setDatasetData(existing.datasetData || {});
      setBusinessCtx(existing.businessContext || businessContext);
      setReportText(existing.report || '');
      setIsInitializing(false);
      sessionReadyRef.current = true;
    } else if (existing) {
      // Session exists but 0 messages - run analysis once
      setCurrentSessionId(existingId);
      setBusinessCtx(existing.businessContext || businessContext);
      startInitialAnalysis(existing.businessContext || businessContext);
    } else {
      // Brand new session
      const newSess = store.createSession(businessContext);
      setCurrentSessionId(newSess.id);
      setSessions(store.getAllSessions());
      startInitialAnalysis(businessContext);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Start initial analysis ───────────────────────────────────
  async function startInitialAnalysis(bc) {
    setIsInitializing(true);
    setStatusDot('thinking');
    try {
      // Fetch dataset context
      const startRes = await fetch(`${API}/beej/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_context: bc }),
      });
      const startData = await startRes.json();
      const dd = startData.dataset_data || {};
      setDatasetData(dd);
      setIsInitializing(false);

      // Stream initial analysis
      await doStream(
        `${API}/beej/chat/initial`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_context: bc }),
        },
        null,
        dd,
      );
    } catch (err) {
      setIsInitializing(false);
      appendError(`Could not connect to Beej: ${err.message}`);
    } finally {
      setStatusDot('online');
      // Only start persisting AFTER initial stream completes
      sessionReadyRef.current = true;
    }
  }

  // ── Core streaming engine ────────────────────────────────────
  async function doStream(url, fetchOptions, userMsg, ddOverride) {
    setIsStreaming(true);
    setStatusDot('thinking');
    setFollowups([]);

    if (userMsg) {
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'user', content: userMsg, time: nowTime(),
      }]);
    }

    const beejId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: beejId, role: 'beej', content: '', streaming: true, time: nowTime(),
    }]);

    let fullText = '';
    let receivedFollowups = [];

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(url, { ...fetchOptions, signal: ctrl.signal });
      if (!res.ok) throw new Error(`Server ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === 'token') {
              fullText += ev.text;
              setMessages(prev => prev.map(m =>
                m.id === beejId ? { ...m, content: fullText } : m
              ));
            } else if (ev.type === 'followups') {
              receivedFollowups = ev.questions || [];
            } else if (ev.type === 'error') {
              fullText += '\n\n⚠️ ' + ev.text;
              setMessages(prev => prev.map(m =>
                m.id === beejId ? { ...m, content: fullText } : m
              ));
            }
          } catch { /* ignore parse errors */ }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === beejId ? { ...m, streaming: false } : m
      ));
      setFollowups(receivedFollowups);

      // TTS
      if (ttsEnabled && fullText) {
        setIsSpeaking(true);
        speakText(fullText, () => setIsSpeaking(false));
      }

    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === beejId
            ? { ...m, content: `⚠️ Error: ${err.message}`, streaming: false }
            : m
        ));
      }
    } finally {
      setIsStreaming(false);
      setStatusDot('online');
      inputRef.current?.focus();
    }
  }

  // ── Append error helper ──────────────────────────────────────
  function appendError(text) {
    setMessages(prev => [...prev, {
      id: Date.now(), role: 'beej', content: `⚠️ ${text}`, streaming: false, time: nowTime(),
    }]);
  }

  // ── Send user message ────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text ?? inputText).trim();
    if (!msg || isStreaming) return;
    setInputText('');

    const history = messages
      .filter(m => m.content && !m.streaming)
      .map(m => ({ role: m.role === 'beej' ? 'assistant' : 'user', content: m.content }));

    await doStream(
      `${API}/beej/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_context:     { ...businessCtx, language: businessCtx?.language || 'en' },
          conversation_history: history,
          user_message:         msg,
          dataset_data:         datasetData,
        }),
      },
      msg,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, isStreaming, messages, businessCtx, datasetData]);

  // Keep the ref in sync so voice callbacks always call the latest sendMessage
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // ── Voice input ──────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    const SpeechRec = getSpeechRecognition();
    if (!SpeechRec) {
      setVoiceError('Voice input not supported. Please use Chrome or Edge.');
      setTimeout(() => setVoiceError(''), 4000);
      return;
    }

    // Stop if already listening
    if (isListening) {
      recogRef.current?.stop();
      setIsListening(false);
      return;
    }

    setVoiceError('');
    const recog = new SpeechRec();
    recogRef.current = recog;
    recog.continuous     = true;   // keep listening until user stops
    recog.interimResults = true;
    recog.lang           = lang;   // derived from live businessCtx state

    recog.onstart = () => setIsListening(true);

    recog.onend = () => {
      setIsListening(false);
    };

    recog.onerror = (event) => {
      setIsListening(false);
      const errorMessages = {
        'not-allowed':     'Microphone access denied. Please allow mic permission in your browser.',
        'no-speech':       'No speech detected. Please speak clearly and try again.',
        'audio-capture':   'No microphone found. Please connect a microphone.',
        'network':         'Network error during voice recognition. Check your connection.',
        'aborted':         '', // user stopped, no error needed
      };
      const msg = errorMessages[event.error] || `Voice error: ${event.error}`;
      if (msg) {
        setVoiceError(msg);
        setTimeout(() => setVoiceError(''), 5000);
      }
    };

    recog.onresult = (e) => {
      // Build transcript from all results
      let interimTranscript = '';
      let finalTranscript   = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscript += text;
        else interimTranscript += text;
      }

      // Show interim text in the input box for live feedback
      setInputText(finalTranscript || interimTranscript);

      // Send once we have a final result
      if (finalTranscript.trim()) {
        recog.stop(); // stop listening after sending
        // Use ref so we always call the latest sendMessage (avoids stale closure)
        sendMessageRef.current?.(finalTranscript.trim());
      }
    };

    try {
      recog.start();
    } catch (err) {
      setVoiceError(`Could not start microphone: ${err.message}`);
      setTimeout(() => setVoiceError(''), 5000);
    }
  // lang changes when user switches language — re-create the recogniser
  }, [isListening, lang]);

  // ── TTS toggle ───────────────────────────────────────────────
  const toggleTts = () => {
    if (isSpeaking) { stopSpeaking(); setIsSpeaking(false); }
    setTtsEnabled(p => !p);
  };

  // ── Replay TTS for specific message ─────────────────────────
  const replayTts = (text) => {
    setIsSpeaking(true);
    speakText(text, () => setIsSpeaking(false), lang);
  };

  // ── Generate Report ──────────────────────────────────────────
  const handleGenerateReport = async () => {
    if (messages.length < 2) {
      alert('Have a conversation with Beej first before generating a report.');
      return;
    }
    setIsGenReport(true);
    setShowReport(true);

    const history = messages
      .filter(m => m.content && !m.streaming)
      .map(m => ({ role: m.role === 'beej' ? 'assistant' : 'user', content: m.content }));

    try {
      const res = await fetch(`${API}/beej/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_context:     businessCtx,
          conversation_history: history,
          dataset_data:         datasetData,
        }),
      });
      const data = await res.json();
      if (data.report) {
        setReportText(data.report);
      } else {
        setReportText('⚠️ Could not generate report. Please try again.');
      }
    } catch (err) {
      setReportText(`⚠️ Report generation failed: ${err.message}`);
    } finally {
      setIsGenReport(false);
    }
  };

  const copyReport = () => {
    navigator.clipboard.writeText(reportText).then(() => alert('Report copied to clipboard!'));
  };

  // ── Switch session ────────────────────────────────────────────
  const switchSession = useCallback((id) => {
    if (id === currentSessionId) return;

    // Persist current before switching
    if (currentSessionId) {
      store.updateSession(currentSessionId, { messages, followups, datasetData, report: reportText || null, businessContext: businessCtx });
    }

    const data = store.getSession(id);
    if (!data) return;
    store.setCurrentSessionId(id);
    setCurrentSessionId(id);
    setMessages(data.messages || []);
    setFollowups(data.followups || []);
    setDatasetData(data.datasetData || {});
    setBusinessCtx(data.businessContext || {});
    setReportText(data.report || '');
    setIsStreaming(false);
    setIsInitializing(false);
    setStatusDot('online');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, messages, followups, datasetData, reportText, businessCtx]);

  // ── Delete session ────────────────────────────────────────────
  const deleteSession = useCallback((e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    store.deleteSession(id);
    setSessions(store.getAllSessions());
    if (id === currentSessionId) {
      // Switch to first remaining or go back
      const remaining = store.getAllSessions();
      if (remaining.length > 0) {
        switchSession(remaining[0].id);
      } else {
        onBack?.();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId, switchSession, onBack]);

  // ── Textarea auto-resize ──────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── New session from sidebar ──────────────────────────────────
  const handleNewSession = () => {
    onNewSession?.() || onBack?.();
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.layout}>

      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.collapsed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarTitle}>💬 Conversations</div>
          <button className={styles.newSessionBtn} onClick={handleNewSession}>
            ＋ New Analysis
          </button>
        </div>

        <div className={styles.sessionList}>
          {sessions.length === 0 && (
            <div className={styles.sidebarEmpty}>No previous chats yet</div>
          )}
          {sessions.map(s => (
            <button
              key={s.id}
              className={`${styles.sessionItem} ${s.id === currentSessionId ? styles.active : ''}`}
              onClick={() => switchSession(s.id)}
            >
              <span className={styles.sessionItemTitle}>{s.title}</span>
              <span className={styles.sessionItemMeta}>{formatDate(s.updatedAt)}</span>
              <span
                className={styles.sessionDeleteBtn}
                onClick={(e) => deleteSession(e, s.id)}
                title="Delete"
              >✕</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <div className={styles.chatWrap}>

        {/* Header */}
        <div className={styles.header}>
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(p => !p)} title="Toggle sidebar">
            ☰
          </button>
          <button className={styles.backBtn} onClick={onBack} title="Back to form">
            ←
          </button>
          <div className={styles.beejAvatar}>🌱</div>
          <div className={styles.headerInfo}>
            <div className={styles.headerName}>Beej</div>
            <div className={styles.headerSub}>
              {businessCtx?.business_idea?.slice(0, 45) || 'AI Business Advisor'}
            </div>
          </div>

          <div className={styles.headerActions}>
            {/* Language indicator */}
            {businessCtx?.language && businessCtx.language !== 'en' && (
              <span style={{ fontSize:'0.65rem', color:'var(--gold)', background:'rgba(224,178,78,0.1)', border:'1px solid rgba(224,178,78,0.2)', borderRadius:'99px', padding:'0.15rem 0.5rem', fontWeight:700 }}>
                {businessCtx.language.toUpperCase()}
              </span>
            )}
            {/* TTS toggle */}
            <button
              className={`${styles.headerIconBtn} ${ttsEnabled ? styles.active : ''}`}
              onClick={toggleTts}
              title={ttsEnabled ? 'Disable voice responses' : 'Enable voice responses'}
            >
              {isSpeaking ? '🔊' : ttsEnabled ? '🔈' : '🔇'}
            </button>
          </div>

          <div className={`${styles.statusDot} ${statusDot === 'thinking' ? styles.thinking : ''}`} />
        </div>

        {/* Messages */}
        <div className={styles.messagesArea}>

          {isInitializing && (
            <div className={styles.initOverlay}>
              <div className={styles.initSpinner} />
              <span className={styles.initLabel}>
                Fetching market data for {businessCtx?.village || 'your area'}…
              </span>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id}>
              <div className={`${styles.messageRow} ${styles[msg.role]}`}>
                {msg.role === 'beej' && (
                  <div className={styles.bubbleAvatar}>🌱</div>
                )}
                <div className={styles.bubbleContent}>
                  <div className={styles.bubble}>
                    {msg.content ? <RichText text={msg.content} /> : null}
                    {msg.streaming && <span className={styles.cursor} />}
                  </div>

                  {msg.role === 'beej' && !msg.streaming && msg.content && (
                    <>
                      <div className={styles.sourceBadges}>
                        {detectSourceBadges(msg.content).map(type => (
                          <span key={type} className={`${styles.sourceBadge} ${styles[type]}`}>
                            {type === 'api'       ? '🟢 API Data'  : ''}
                            {type === 'user'      ? '🔵 User Data' : ''}
                            {type === 'estimated' ? '🟡 Estimated' : ''}
                          </span>
                        ))}
                        <button
                          className={styles.ttsReplayBtn}
                          onClick={() => replayTts(msg.content)}
                          title="Read aloud"
                        >🔊</button>
                      </div>
                    </>
                  )}
                  <span className={styles.bubbleTime}>{msg.time}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isStreaming && messages.length > 0 && messages[messages.length - 1]?.content === '' && (
            <div className={styles.thinkingRow}>
              <div className={styles.bubbleAvatar}>🌱</div>
              <div className={styles.thinkingBubble}>
                <div className={styles.thinkingDots}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
                <span className={styles.thinkingLabel}>Beej is thinking…</span>
              </div>
            </div>
          )}

          {/* Follow-up chips */}
          {followups.length > 0 && !isStreaming && (
            <div className={styles.followupsWrap}>
              {followups.map((q, i) => (
                <button
                  key={i}
                  className={styles.chipBtn}
                  onClick={() => sendMessage(q)}
                  disabled={isStreaming}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: 1 }} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          {/* Voice error toast */}
          {voiceError && (
            <div style={{
              background: 'rgba(192,57,43,0.15)',
              border: '1px solid rgba(192,57,43,0.4)',
              color: '#e74c3c',
              borderRadius: '8px',
              padding: '0.45rem 0.8rem',
              fontSize: '0.78rem',
              marginBottom: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}>
              ⚠️ {voiceError}
            </div>
          )}
          <div className={styles.inputRow}>
            {/* Mic button */}
            <button
              className={`${styles.micBtn} ${isListening ? styles.listening : ''}`}
              onClick={toggleVoice}
              disabled={isStreaming || isInitializing}
              title={isListening ? '🔴 Listening — click to stop' : 'Voice input — click to speak'}
            >
              {isListening ? '🔴' : '🎤'}
            </button>

            <textarea
              ref={inputRef}
              className={styles.inputBox}
              placeholder={
                isListening   ? '🎤 Listening…' :
                isStreaming    ? 'Beej is responding…' :
                'Ask Beej anything about your business… (Enter to send, Shift+Enter for newline)'
              }
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isStreaming || isInitializing}
            />

            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={isStreaming || isInitializing || !inputText.trim()}
              title="Send message"
            >
              <svg className={styles.sendIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Report Overlay ── */}
      {showReport && (
        <div className={styles.reportOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowReport(false); }}>
          <div className={styles.reportPanel}>
            <div className={styles.reportHeader}>
              <span className={styles.reportTitle}>📋 Business Feasibility Report</span>
              <div className={styles.reportHeaderActions}>
                {reportText && !isGenReport && (
                  <button className={styles.reportCopyBtn} onClick={copyReport}>
                    📋 Copy
                  </button>
                )}
                <button className={styles.reportCloseBtn} onClick={() => setShowReport(false)}>✕</button>
              </div>
            </div>

            <div className={styles.reportBody}>
              {isGenReport ? (
                <div className={styles.reportGenerating}>
                  <div className={styles.initSpinner} />
                  <span>Beej is synthesizing your conversation into a report…</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>This may take 10–20 seconds</span>
                </div>
              ) : reportText ? (
                <ReportBody text={reportText} />
              ) : null}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
