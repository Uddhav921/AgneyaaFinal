import { useState, useRef, useEffect } from 'react';
import styles from './VoiceRecorder.module.css';
import PageNav from './PageNav';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function VoiceRecorder({ onTranscriptReady, onBack }) {
  const [phase, setPhase] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const recogRef = useRef(null);
  const timerRef = useRef(null);
  const linesRef = useRef([]);
  const { language } = useLanguage();
  const isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  };
  const stopTimer = () => clearInterval(timerRef.current);
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

  const startRecording = () => {
    if (!isSupported) {
      setErrorMsg('Your browser does not support voice input. Please use Chrome.');
      setPhase('error');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SR();
    
    // Map standard language codes to IN variants for speech recognition
    const langMap = {
      en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', gu: 'gu-IN',
      ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN', bn: 'bn-IN',
    };
    recog.lang = langMap[language] || 'en-IN';
    recog.continuous = true;
    recog.interimResults = true;
    linesRef.current = [];

    recog.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      if (final) linesRef.current.push(final.trim());
      setTranscript(linesRef.current.join(' ') + (interim ? ' ' + interim : ''));
    };

    recog.onerror = (e) => {
      if (e.error === 'no-speech') return;
      setErrorMsg('Microphone error: ' + e.error);
      setPhase('error');
      stopTimer();
    };

    recog.onend = () => { try { recog.start(); } catch (_) {} };

    recogRef.current = recog;
    recog.start();
    setPhase('recording');
    startTimer();
  };

  const stopRecording = () => {
    recogRef.current && recogRef.current.stop();
    stopTimer();
    setPhase('processing');
    setTimeout(() => setPhase('done'), 800);
  };

  useEffect(() => {
    return () => {
      recogRef.current && recogRef.current.stop();
      stopTimer();
    };
  }, []);

  const handleUseTranscript = () => onTranscriptReady(transcript.trim());
  const handleRetry = () => { setTranscript(''); linesRef.current = []; setPhase('idle'); };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <PageNav
          onBack={onBack}
          onForward={phase === 'done' && transcript.trim() ? handleUseTranscript : undefined}
          forwardLabel="Use this"
          forwardDisabled={phase !== 'done' || !transcript.trim()}
        />
        <div className={styles.header}>
          <h2>Voice Input</h2>
          <p>Speak naturally about your business idea, location, and available capital.</p>
        </div>

        {phase === 'idle' && (
          <div className={styles.center}>
            <div className={styles.micRing}>
              <button id="btn-start-recording" className={styles.micBtn} onClick={startRecording} aria-label="Start recording">
                <span style={{fontSize:'2.2rem'}}>&#127897;</span>
              </button>
            </div>
            <p className={styles.tapHint}>Tap to start speaking</p>
            {!isSupported && <p className={styles.warnMsg}>Use Chrome for voice support</p>}
          </div>
        )}

        {phase === 'recording' && (
          <div className={styles.center}>
            <div className={styles.pulseRing}>
              <button id="btn-stop-recording" className={styles.micBtn + ' ' + styles.micBtnActive} onClick={stopRecording} aria-label="Stop recording">
                <span style={{fontSize:'2rem'}}>&#9209;</span>
              </button>
            </div>
            <p className={styles.timer}>{fmt(elapsed)}</p>
            <p className={styles.listenHint}>Listening... tap to stop</p>
            {transcript && (
              <div className={styles.liveTranscript}>
                <span className={styles.liveDot} />
                <p>{transcript}</p>
              </div>
            )}
          </div>
        )}

        {phase === 'processing' && (
          <div className={styles.center}>
            <div className={styles.spinnerWrap}><div className={styles.spinner} /></div>
            <p className={styles.tapHint}>Processing your voice...</p>
          </div>
        )}

        {phase === 'done' && (
          <div className={styles.doneWrap}>
            <span className={styles.doneIcon}>&#9989;</span>
            <h3>Got it!</h3>
            <p>Here is what we heard:</p>
            <div className={styles.transcriptBox}>
              <textarea
                className={styles.transcriptEdit}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={5}
                placeholder="Your speech will appear here..."
              />
              <p className={styles.editNote}>You can edit the text above before continuing</p>
            </div>
            <div className={styles.doneActions}>
              <button className={styles.retryBtn} onClick={handleRetry}>Re-record</button>
              <button id="btn-use-transcript" className={styles.useBtn} onClick={handleUseTranscript} disabled={!transcript.trim()}>
                Use this
              </button>
            </div>
          </div>
        )}

        {phase === 'error' && (
          <div className={styles.center}>
            <p className={styles.warnMsg}>{errorMsg}</p>
            <button className={styles.retryBtn} onClick={handleRetry} style={{marginTop:'1rem'}}>Try again</button>
          </div>
        )}
      </div>
    </div>
  );
}