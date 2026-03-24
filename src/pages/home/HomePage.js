import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(41, 121, 216, ${p.opacity})`;
        ctx.fill();
      });
      // Draw connecting lines
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(41, 121, 216, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const handleCard1Click = () => {
    window.open('https://claims-ai.netlify.app/', '_blank');
  };

  const handleCard2Click = () => {
    navigate('/engagement');
  };

  return (
    <div className="homepage">
      <canvas ref={canvasRef} className="homepage-canvas" />

      {/* Header */}
      <header className="hp-header animate-fade-in">
        <div className="hp-logo">
          <div className="hp-logo-icon">F</div>
          <div>
            <span className="hp-logo-name">FinAgent</span>
            <span className="hp-logo-sub">AI PLATFORM</span>
          </div>
        </div>
        <div className="hp-header-right">
          <span className="hp-status-dot" />
          <span className="hp-status-text">All Systems Operational</span>
        </div>
      </header>

      {/* Hero */}
      <section className="hp-hero">
        <div className="hp-hero-badge animate-fade-in">
          <span className="hp-ai-chip">✦ Powered by Agentic AI</span>
        </div>
        <h1 className="hp-hero-title animate-fade-in delay-100">
          AI Agent<br />
          <span className="hp-gradient-text">Marketplace</span>
        </h1>
        <p className="hp-hero-sub animate-fade-in delay-200">
          Autonomous intelligent agents that transform your fintech operations —<br />
          from onboarding to engagement, powered by cutting-edge AI.
        </p>

        {/* Stats bar */}
        <div className="hp-stats animate-fade-in delay-300">
          {[
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '< 2s', label: 'Response Time' },
            { value: '78%', label: 'AI Resolution Rate' },
            { value: '24/7', label: 'Always Active' },
          ].map(s => (
            <div key={s.label} className="hp-stat">
              <span className="hp-stat-value">{s.value}</span>
              <span className="hp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section className="hp-cards animate-fade-in delay-300">
        {/* Card 1 */}
        <div className="hp-agent-card hp-card-1" onClick={handleCard1Click} tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleCard1Click()}>
          <div className="hp-card-glow hp-card-glow-1" />
          <div className="hp-card-header">
            <div className="hp-card-icon hp-icon-1">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <polyline points="16 11 18 13 22 9"/>
              </svg>
            </div>
            <div className="hp-card-badge">Agent 01</div>
          </div>
          <div className="hp-card-body">
            <h2 className="hp-card-title">Customer Onboarding & Underwriting</h2>
            <p className="hp-card-subtitle">
              Intelligent end-to-end KYC verification, risk scoring, and credit underwriting — fully automated with zero manual intervention.
            </p>
          </div>
          <div className="hp-card-features">
            {['Auto KYC Verification', 'Risk Scoring Engine', 'Instant Credit Decision', 'Document Intelligence'].map(f => (
              <span key={f} className="hp-feature-tag hp-feature-tag-1">✓ {f}</span>
            ))}
          </div>
          <div className="hp-card-footer">
            <div className="hp-card-metric">
              <span className="hp-metric-value">3.2s</span>
              <span className="hp-metric-label">Avg. KYC Time</span>
            </div>
            <button className="hp-card-btn hp-btn-1">
              Launch Agent
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Card 2 */}
        <div className="hp-agent-card hp-card-2" onClick={handleCard2Click} tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && handleCard2Click()}>
          <div className="hp-card-glow hp-card-glow-2" />
          <div className="hp-card-header">
            <div className="hp-card-icon hp-icon-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <circle cx="9" cy="10" r="1" fill="currentColor"/>
                <circle cx="12" cy="10" r="1" fill="currentColor"/>
                <circle cx="15" cy="10" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="hp-card-badge hp-badge-2">Agent 02</div>
          </div>
          <div className="hp-card-body">
            <h2 className="hp-card-title">Smart Customer Engagement & Chatbot</h2>
            <p className="hp-card-subtitle">
              Proactive issue detection and resolution via WhatsApp — AI-first with seamless human handoff for complex cases.
            </p>
          </div>
          <div className="hp-card-features">
            {['WhatsApp AI Bot', 'Issue Detection', 'Human Handoff', 'Live Analytics'].map(f => (
              <span key={f} className="hp-feature-tag hp-feature-tag-2">✓ {f}</span>
            ))}
          </div>
          <div className="hp-card-footer">
            <div className="hp-card-metric">
              <span className="hp-metric-value">78%</span>
              <span className="hp-metric-label">AI Resolution</span>
            </div>
            <button className="hp-card-btn hp-btn-2">
              Launch Agent
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="hp-footer animate-fade-in delay-400">
        <p>© 2024 FinAgent AI Platform · Built for modern fintech operations</p>
      </footer>
    </div>
  );
};

export default HomePage;
