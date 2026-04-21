/**
 * VoiceCallModal — ElevenLabs browser-based voice call UI.
 *
 * Flow:
 *   1. Modal opens → immediately fetches a signed URL from the Netlify function
 *   2. Conversation starts with the customer's full chat history + profile
 *      injected as system-prompt overrides (no agent re-configuration needed)
 *   3. Live transcript shows in real time
 *   4. If AI says the route phrase → call ends and agent picker opens
 *   5. "Route to Agent" button also available at any time
 *   6. Transcript is saved to chat history on close
 *
 * Props
 * ─────
 * customer       object    Full customer record from AppContext
 * messages       object[]  Current conversation messages (used as AI context)
 * onClose        fn()      Close without explicit routing
 * onCallEnd      fn(transcript[])  Called when call ends — adds to chat history
 * onRouteToAgent fn()      Opens the agent picker modal
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  buildDynamicVariables,
  getSessionConfig,
  ROUTE_PHRASE,
} from '../utils/elevenlabs';

// ─── CSS keyframes (injected once) ───────────────────────────────────────────
let _injected = false;
const injectKeyframes = () => {
  if (_injected) return;
  _injected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes vc-ping  { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.8);opacity:0} }
    @keyframes vc-spin  { to{transform:rotate(360deg)} }
    @keyframes vc-wave  { 0%,100%{transform:scaleY(.35)} 50%{transform:scaleY(1)} }
    @keyframes vc-blink { 0%,100%{opacity:.35;transform:scale(.85)} 50%{opacity:1;transform:scale(1.05)} }
  `;
  document.head.appendChild(s);
};

// ─── Animated waveform (no canvas) ───────────────────────────────────────────
const Waveform = ({ active, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 22 }}>
    {[0, 1, 2, 3, 4].map(i => (
      <div key={i} style={{
        width: 3,
        borderRadius: 2,
        background: color,
        height: active ? `${10 + (i % 3) * 7}px` : 3,
        opacity: active ? 1 : 0.25,
        animation: active ? `vc-wave ${0.55 + i * 0.1}s ${i * 0.07}s ease-in-out infinite` : 'none',
        transition: 'height 0.3s ease, opacity 0.3s ease',
      }} />
    ))}
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = n => String(n).padStart(2, '0');
const fmt = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

// ─── Component ────────────────────────────────────────────────────────────────
const VoiceCallModal = ({ customer, messages = [], onClose, onCallEnd, onRouteToAgent }) => {
  injectKeyframes();

  // status: 'connecting' | 'active' | 'ended' | 'error'
  const [status,      setStatus]     = useState('connecting');
  const [mode,        setMode]       = useState('listening'); // 'speaking' | 'listening'
  const [transcript,  setTranscript] = useState([]);
  const [isMuted,     setIsMuted]    = useState(false);
  const [duration,    setDuration]   = useState(0);
  const [errorMsg,    setErrorMsg]   = useState('');
  const [statusLabel, setStatusLabel] = useState('Connecting…');

  const convRef          = useRef(null);
  const timerRef         = useRef(null);
  const transcriptEndRef = useRef(null);
  const transcriptRef    = useRef([]);    // always-current transcript (avoids stale closures)
  const routedRef        = useRef(false); // prevent double-route
  const startedRef       = useRef(false); // prevent StrictMode double-start
  const mountedRef       = useRef(true);  // track if component is still mounted

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call timer
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // ── Start call (runs once on mount) ────────────────────────────────────────
  const startCall = useCallback(async () => {
    // Allow re-calling after the first session ends
    startedRef.current    = true;
    routedRef.current     = false;
    transcriptRef.current = [];
    setTranscript([]);
    setStatus('connecting');
    setErrorMsg('');
    setStatusLabel('Connecting…');

    let sessionConfig;
    try {
      sessionConfig = await getSessionConfig();
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
      return;
    }

    try {
      const { Conversation } = await import('@11labs/client');

      const conv = await Conversation.startSession({
        ...sessionConfig,
        dynamicVariables: buildDynamicVariables(customer, messages),

        onConnect: () => {
          if (!mountedRef.current) return;
          setStatus('active');
          setStatusLabel('Connected');
        },

        onDisconnect: (details) => {
          clearInterval(timerRef.current);
          convRef.current = null; // session is gone — clear the ref
          if (!mountedRef.current) return; // component already unmounted
          console.log('[VoiceCall] Disconnected:', details);
          if (details?.reason === 'error') {
            setErrorMsg(`Call disconnected — ${details.message || 'unknown error'}`);
            setStatus('error');
          } else {
            if (!routedRef.current) setStatus('ended');
          }
          setStatusLabel('Call Ended');
        },

        onMessage: ({ message, source }) => {
          if (!mountedRef.current) return; // discard messages after unmount
          const entry = {
            id:        `${Date.now()}-${Math.random()}`,
            speaker:   source === 'ai' ? 'agent' : 'customer',
            text:      message,
            timestamp: new Date().toISOString(),
          };
          setTranscript(prev => {
            const next = [...prev, entry];
            transcriptRef.current = next; // keep ref in sync for closures
            return next;
          });

          // Detect routing phrase from AI → auto-trigger human handoff
          if (
            source === 'ai' &&
            message.toLowerCase().includes(ROUTE_PHRASE) &&
            !routedRef.current
          ) {
            routedRef.current = true;
            // Give the AI 1.5 s to finish speaking before closing
            setTimeout(() => {
              endCall();
              onCallEnd && onCallEnd(transcriptRef.current); // use ref — not stale state
              onRouteToAgent && onRouteToAgent();
              onClose();
            }, 1500);
          }
        },

        onError: (msg, context) => {
          console.error('[VoiceCall] onError:', msg, context);
          if (!mountedRef.current) return;
          setErrorMsg(msg || 'Call error. Check your ElevenLabs agent and microphone permissions.');
          setStatus('error');
        },

        onStatusChange: ({ status: s }) => {
          if (!mountedRef.current) return;
          if (s === 'connecting')    setStatusLabel('Connecting…');
          if (s === 'connected')     setStatusLabel('Connected');
          if (s === 'disconnecting') setStatusLabel('Ending…');
          if (s === 'disconnected')  setStatusLabel('Call Ended');
        },

        onModeChange: ({ mode: m }) => {
          if (!mountedRef.current) return;
          setMode(m);
          setStatusLabel(m === 'speaking' ? 'AI Speaking' : 'Listening…');
        },
      });

      convRef.current = conv;
    } catch (err) {
      console.error('[VoiceCall] Session start failed:', err);
      setErrorMsg(err?.message || 'Failed to start call. Check browser microphone permissions.');
      setStatus('error');
    }
  }, [customer, messages]); // eslint-disable-line

  // Start once on mount. The ref guard prevents React 18 StrictMode's
  // double-invoke from spawning two simultaneous sessions.
  useEffect(() => {
    mountedRef.current = true;
    if (startedRef.current) return;
    startedRef.current = true;
    startCall();

    // Cleanup: end the session if the component is unmounted while the
    // call is still active (e.g. user navigates away or closes modal via
    // parent without using the Close / End buttons).
    return () => {
      mountedRef.current = false;
      if (convRef.current) {
        convRef.current.endSession().catch(() => {});
        convRef.current = null;
      }
      clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line

  // ── End call ──────────────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    clearInterval(timerRef.current);
    if (convRef.current) {
      try { await convRef.current.endSession(); } catch (_) {}
      convRef.current = null;
    }
    setStatus('ended');
  }, []);

  // ── Toggle mic mute ───────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (!convRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    try { convRef.current.setMicMuted(next); } catch (_) {}
  }, [isMuted]);

  // ── Close handler ─────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    endCall();
    onCallEnd && onCallEnd(transcriptRef.current);
    onClose();
  }, [endCall, onCallEnd, onClose]);

  // ── Route to human agent (manual) ────────────────────────────────────────
  const handleRouteToAgent = useCallback(() => {
    routedRef.current = true;
    endCall();
    onCallEnd && onCallEnd(transcriptRef.current);
    onRouteToAgent && onRouteToAgent();
    onClose();
  }, [endCall, onCallEnd, onRouteToAgent, onClose]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const isActive     = status === 'active';
  const isConnecting = status === 'connecting';
  const isEnded      = status === 'ended';
  const isError      = status === 'error';
  const isSpeaking   = isActive && mode === 'speaking';
  const isListening  = isActive && mode === 'listening';

  const ringColor = isActive ? '#10b981' : isConnecting ? '#f59e0b' : isEnded ? '#8b5cf6' : '#ef4444';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(2,6,23,0.93)',
      backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'linear-gradient(155deg, #0f172a 0%, #1a1035 100%)',
        borderRadius: 28,
        width: '100%', maxWidth: 440,
        overflow: 'hidden',
        boxShadow: '0 40px 120px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(255,255,255,0.06)',
      }}>

        {/* ── Top bar ── */}
        <div style={{
          padding: '15px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: ringColor,
              animation: isConnecting ? 'vc-blink 1s ease-in-out infinite' : 'none',
              boxShadow: `0 0 0 2px ${ringColor}28`,
            }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11.5, fontWeight: 600, fontFamily: 'var(--font-body)', letterSpacing: '0.03em' }}>
              {statusLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {(isActive || isEnded) && (
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                {fmt(duration)}
              </span>
            )}
            <button
              onClick={handleClose}
              style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'rgba(255,255,255,0.07)', border: 'none',
                cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        </div>

        {/* ── Avatar ── */}
        <div style={{ padding: '32px 24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>

          {/* Pulse rings + avatar */}
          <div style={{ position: 'relative', width: 108, height: 108 }}>

            {isSpeaking && <>
              <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: `${ringColor}14`, animation: 'vc-ping 2s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: -6,  borderRadius: '50%', background: `${ringColor}20`, animation: 'vc-ping 2s 0.45s ease-out infinite' }} />
            </>}

            {isConnecting && (
              <div style={{
                position: 'absolute', inset: -5, borderRadius: '50%',
                border: `2px solid ${ringColor}28`,
                borderTopColor: ringColor,
                animation: 'vc-spin 1s linear infinite',
              }} />
            )}

            <div style={{
              width: 108, height: 108, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${customer?.avatarColor || '#1e5fb5'}38, ${customer?.avatarColor || '#1e5fb5'}12)`,
              border: `3px solid ${isActive || isConnecting ? ringColor : 'rgba(255,255,255,0.09)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 800, color: customer?.avatarColor || '#60a5fa',
              transition: 'border-color 0.4s',
              userSelect: 'none',
            }}>
              {customer?.avatar || customer?.name?.[0] || '?'}
            </div>
          </div>

          {/* Name + subtitle */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'center' }}>
            <h2 style={{ color: '#f1f5f9', fontSize: 21, fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
              {customer?.name || 'Customer'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 12 }}>🌐</span>
              <span style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, fontFamily: 'var(--font-body)' }}>
                Browser Voice Call · Agently AI
              </span>
            </div>

            {/* Speaking / listening indicator */}
            {isActive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
                <Waveform active={isListening} color="#25D366" />
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'var(--font-body)' }}>
                  {isSpeaking ? 'AI responding' : 'Listening to you'}
                </span>
                <Waveform active={isSpeaking} color="#10b981" />
              </div>
            )}

            {/* Connecting hint */}
            {isConnecting && (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11.5, fontFamily: 'var(--font-body)', margin: '4px 0 0', textAlign: 'center' }}>
                Requesting microphone · Loading AI…
              </p>
            )}
          </div>

          {/* Error */}
          {isError && (
            <div style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.22)',
            }}>
              <p style={{ color: '#fca5a5', fontSize: 12, fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.55 }}>
                ⚠️ {errorMsg}
              </p>
            </div>
          )}
        </div>

        {/* ── Transcript ── */}
        {transcript.length > 0 && (
          <div style={{
            margin: '0 16px',
            background: 'rgba(0,0,0,0.28)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            padding: '11px 13px',
            maxHeight: 200,
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 3px', fontFamily: 'var(--font-body)' }}>
              Live Transcript
            </p>
            {transcript.map(entry => {
              const isAgent = entry.speaker === 'agent';
              return (
                <div key={entry.id} style={{
                  display: 'flex', gap: 7, alignItems: 'flex-start',
                  flexDirection: isAgent ? 'row' : 'row-reverse',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: isAgent ? 'rgba(16,185,129,0.18)' : 'rgba(37,211,102,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                  }}>
                    {isAgent ? '🤖' : '🎙'}
                  </div>
                  <div style={{
                    flex: 1,
                    background: isAgent ? 'rgba(16,185,129,0.08)' : 'rgba(37,211,102,0.06)',
                    border: `1px solid ${isAgent ? 'rgba(16,185,129,0.18)' : 'rgba(37,211,102,0.13)'}`,
                    borderRadius: isAgent ? '10px 10px 10px 3px' : '10px 10px 3px 10px',
                    padding: '7px 10px',
                  }}>
                    <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 12, lineHeight: 1.55, margin: '0 0 2px', fontFamily: 'var(--font-body)' }}>
                      {entry.text}
                    </p>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-body)' }}>
                      {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={transcriptEndRef} />
          </div>
        )}

        {/* ── Controls ── */}
        <div style={{ padding: '20px 24px', display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>

          {/* Active / connecting */}
          {(isActive || isConnecting) && (<>

            {/* Mute mic */}
            <button
              onClick={toggleMute}
              disabled={isConnecting}
              title={isMuted ? 'Unmute' : 'Mute microphone'}
              style={{
                width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                background: isMuted ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.07)',
                border: `1.5px solid ${isMuted ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)'}`,
                cursor: isConnecting ? 'default' : 'pointer',
                fontSize: 19, display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isConnecting ? 0.45 : 1, transition: 'all 0.2s',
              }}
            >
              {isMuted ? '🔇' : '🎤'}
            </button>

            {/* Route to human agent */}
            <button
              onClick={handleRouteToAgent}
              disabled={isConnecting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 16px', borderRadius: 50,
                background: 'rgba(139,92,246,0.15)',
                border: '1.5px solid rgba(139,92,246,0.28)',
                color: '#c4b5fd', cursor: isConnecting ? 'default' : 'pointer',
                fontSize: 11.5, fontWeight: 700, fontFamily: 'var(--font-body)',
                opacity: isConnecting ? 0.45 : 1, transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              👤 Route to Agent
            </button>

            {/* End call */}
            <button
              onClick={endCall}
              title="End call"
              style={{
                width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', cursor: 'pointer', fontSize: 19,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 18px rgba(239,68,68,0.38)',
              }}
            >
              📵
            </button>
          </>)}

          {/* Ended */}
          {isEnded && (<>
            <button onClick={handleClose} style={{ padding: '12px 22px', borderRadius: 50, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)' }}>
              Close
            </button>
            <button onClick={startCall} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 22px', borderRadius: 50, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)', boxShadow: '0 4px 18px rgba(16,185,129,0.28)' }}>
              🔄 Call Again
            </button>
            <button onClick={handleRouteToAgent} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 50, background: 'rgba(139,92,246,0.15)', border: '1.5px solid rgba(139,92,246,0.28)', color: '#c4b5fd', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
              👤 Route to Agent
            </button>
          </>)}

          {/* Error — retry */}
          {isError && (
            <button onClick={startCall} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 28px', borderRadius: 50, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
              🔄 Retry
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 16px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.16)', fontSize: 10, fontFamily: 'var(--font-body)', margin: 0 }}>
            Powered by ElevenLabs Conversational AI · Browser microphone required
          </p>
        </div>

      </div>
    </div>
  );
};

export default VoiceCallModal;
