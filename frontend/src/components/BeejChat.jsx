import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './BeejChat.module.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

/**
 * Formats current time as HH:MM
 */
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Detects source labels in text and returns badge types.
 * 🟢 API Data, 🔵 User Data, 🟡 Estimated
 */
function detectSourceBadges(text) {
  const badges = [];
  if (text.includes('🟢')) badges.push('api');
  if (text.includes('🔵')) badges.push('user');
  if (text.includes('🟡')) badges.push('estimated');
  return badges;
}

/**
 * Renders text with basic markdown-like formatting.
 * Converts **bold**, *italic*, bullet points into styled spans.
 */
function RichText({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        });
        return (
          <span key={i}>
            {parts}
            {i < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

/**
 * BeejChat — Full conversational AI chat interface powered by Gemini.
 *
 * Props:
 *   businessContext  — form data from InputForm
 *   session          — auth session (optional, for future auth)
 *   onBack           — callback to go back to InputForm
 */
export default function BeejChat({ businessContext, session, onBack }) {
  const [messages, setMessages]         = useState([]);
  const [followups, setFollowups]       = useState([]);
  const [inputText, setInputText]       = useState('');
  const [isStreaming, setIsStreaming]    = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [datasetData, setDatasetData]   = useState({});
  const [statusDot, setStatusDot]       = useState('online'); // 'online' | 'thinking'

  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);
  const abortRef        = useRef(null);

  // Auto-scroll to bottom whenever messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, followups, scrollToBottom]);

  // ── Initialize: fetch dataset context then stream first analysis ──
  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setIsInitializing(true);
      setStatusDot('thinking');

      try {
        // Step 1: fetch dataset data
        const startRes = await fetch(`${API}/beej/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_context: businessContext }),
        });

        if (!startRes.ok) throw new Error('Failed to initialize Beej session');
        const startData = await startRes.json();
        if (!cancelled) setDatasetData(startData.dataset_data || {});

        setIsInitializing(false);

        // Step 2: stream initial analysis
        if (!cancelled) {
          await streamFromEndpoint(
            `${API}/beej/chat/initial`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ business_context: businessContext }),
            },
            null // no user message for initial
          );
        }
      } catch (err) {
        if (!cancelled) {
          setIsInitializing(false);
          addErrorMessage(`Could not connect to Beej: ${err.message}. Please check your internet connection.`);
        }
      } finally {
        if (!cancelled) setStatusDot('online');
      }
    }

    initialize();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core streaming function ────────────────────────────────────
  async function streamFromEndpoint(url, fetchOptions, userMessageContent) {
    setIsStreaming(true);
    setStatusDot('thinking');
    setFollowups([]); // clear previous chips

    // Add user message to UI if present
    if (userMessageContent) {
      setMessages(prev => [
        ...prev,
        {
          id:      Date.now(),
          role:    'user',
          content: userMessageContent,
          time:    nowTime(),
        },
      ]);
    }

    // Placeholder Beej message for streaming
    const beejMsgId = Date.now() + 1;
    setMessages(prev => [
      ...prev,
      {
        id:         beejMsgId,
        role:       'beej',
        content:    '',
        streaming:  true,
        time:       nowTime(),
      },
    ]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Server error ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let receivedFollowups = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;

          try {
            const event = JSON.parse(raw);
            if (event.type === 'token') {
              fullText += event.text;
              setMessages(prev =>
                prev.map(m =>
                  m.id === beejMsgId ? { ...m, content: fullText } : m
                )
              );
            } else if (event.type === 'followups') {
              receivedFollowups = event.questions || [];
            } else if (event.type === 'error') {
              fullText += '\n\n⚠️ ' + event.text;
              setMessages(prev =>
                prev.map(m =>
                  m.id === beejMsgId ? { ...m, content: fullText } : m
                )
              );
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      // Mark streaming done
      setMessages(prev =>
        prev.map(m =>
          m.id === beejMsgId ? { ...m, streaming: false } : m
        )
      );
      setFollowups(receivedFollowups);

    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === beejMsgId
              ? { ...m, content: `⚠️ Something went wrong: ${err.message}`, streaming: false }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
      setStatusDot('online');
      inputRef.current?.focus();
    }
  }

  // ── Send a user message ────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || inputText).trim();
    if (!msg || isStreaming) return;

    setInputText('');

    // Build conversation history from current messages
    const history = messages
      .filter(m => m.content && !m.streaming)
      .map(m => ({ role: m.role === 'beej' ? 'assistant' : 'user', content: m.content }));

    await streamFromEndpoint(
      `${API}/beej/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_context:     businessContext,
          conversation_history: history,
          user_message:         msg,
          dataset_data:         datasetData,
        }),
      },
      msg
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, isStreaming, messages, businessContext, datasetData]);

  // ── Chip click ─────────────────────────────────────────────────
  const handleChipClick = useCallback((question) => {
    sendMessage(question);
  }, [sendMessage]);

  // ── Add error message helper ───────────────────────────────────
  function addErrorMessage(text) {
    setMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'beej', content: text, streaming: false, time: nowTime() },
    ]);
  }

  // ── Textarea auto-resize ───────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className={styles.chatWrap}>

      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack} title="Back to form">
          ←
        </button>

        <div className={styles.beejAvatar}>🌱</div>

        <div className={styles.headerInfo}>
          <div className={styles.headerName}>Beej</div>
          <div className={styles.headerSub}>
            AI Business Advisor · {businessContext?.business_idea?.slice(0, 40) || 'Your Business'}
          </div>
        </div>

        <div className={`${styles.statusDot} ${statusDot === 'thinking' ? styles.thinking : ''}`} />
      </div>

      {/* Messages */}
      <div className={styles.messagesArea}>

        {/* Initializing */}
        {isInitializing && (
          <div className={styles.initOverlay}>
            <div className={styles.initSpinner} />
            <span className={styles.initLabel}>
              Beej is fetching market data for {businessContext?.village || 'your area'}…
            </span>
          </div>
        )}

        {/* Messages list */}
        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={`${styles.messageRow} ${styles[msg.role]}`}>
              {/* Avatar (only for Beej) */}
              {msg.role === 'beej' && (
                <div className={styles.bubbleAvatar}>🌱</div>
              )}

              <div className={styles.bubbleContent}>
                <div className={styles.bubble}>
                  {msg.content
                    ? <RichText text={msg.content} />
                    : null
                  }
                  {/* Streaming cursor */}
                  {msg.streaming && <span className={styles.cursor} />}
                </div>

                {/* Source badges — show on completed Beej messages */}
                {msg.role === 'beej' && !msg.streaming && msg.content && (
                  <div className={styles.sourceBadges}>
                    {detectSourceBadges(msg.content).map(type => (
                      <span key={type} className={`${styles.sourceBadge} ${styles[type]}`}>
                        {type === 'api'       ? '🟢 API Data'   : ''}
                        {type === 'user'      ? '🔵 User Data'  : ''}
                        {type === 'estimated' ? '🟡 Estimated'  : ''}
                      </span>
                    ))}
                  </div>
                )}

                <span className={styles.bubbleTime}>{msg.time}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Thinking indicator — shown while streaming starts */}
        {isStreaming && messages.length > 0 && messages[messages.length - 1].content === '' && (
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
                onClick={() => handleChipClick(q)}
                disabled={isStreaming}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} style={{ height: 1 }} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <textarea
            ref={inputRef}
            className={styles.inputBox}
            placeholder={isStreaming ? 'Beej is responding…' : 'Ask Beej anything about your business…'}
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
            title="Send message (Enter)"
          >
            <svg className={styles.sendIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
