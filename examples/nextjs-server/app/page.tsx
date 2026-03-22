import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --cream: #F5F0E8;
          --ink: #1A1209;
          --rust: #C4451A;
          --gold: #D4A843;
          --sage: #4A6741;
          --paper: #EDE7D9;
          --muted: #7A6E60;
          --serif: 'DM Serif Display', Georgia, serif;
          --mono: 'DM Mono', monospace;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--cream);
          color: var(--ink);
          font-family: var(--mono);
          overflow-x: hidden;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1000;
          opacity: 0.6;
        }

        .hl-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 4rem;
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(245,240,232,0.85);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid rgba(26,18,9,0.06);
        }

        .hl-nav-logo {
          font-family: var(--serif);
          font-size: 1.3rem;
          color: var(--ink);
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .hl-nav-links {
          display: flex;
          gap: 2.5rem;
          align-items: center;
        }

        .hl-nav-links a {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 300;
          color: var(--muted);
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .hl-nav-links a:hover { color: var(--ink); }

        .hl-nav-cta {
          background: var(--ink) !important;
          color: var(--cream) !important;
          padding: 0.55rem 1.4rem !important;
          font-size: 0.72rem !important;
          letter-spacing: 0.08em !important;
        }
        .hl-nav-cta:hover { background: var(--rust) !important; color: var(--cream) !important; }

        .hl-hero {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          padding: 8rem 4rem 4rem;
          gap: 4rem;
        }

        .hl-hero-left { opacity: 0; animation: hlFadeUp 0.9s ease 0.1s forwards; }
        .hl-hero-right { opacity: 0; animation: hlFadeUp 0.9s ease 0.3s forwards; }

        @keyframes hlFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hl-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--rust);
          margin-bottom: 1.8rem;
        }
        .hl-eyebrow::before {
          content: '';
          display: block;
          width: 28px;
          height: 1px;
          background: var(--rust);
        }

        .hl-h1 {
          font-family: var(--serif);
          font-size: clamp(3.5rem, 6vw, 5.5rem);
          line-height: 1.0;
          letter-spacing: -0.03em;
          color: var(--ink);
          margin-bottom: 2rem;
        }
        .hl-h1 em { font-style: italic; color: var(--rust); }

        .hl-desc {
          font-family: var(--mono);
          font-size: 0.88rem;
          font-weight: 300;
          line-height: 1.8;
          color: var(--muted);
          max-width: 420px;
          margin-bottom: 3rem;
        }

        .hl-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .hl-btn-primary {
          background: var(--ink);
          color: var(--cream);
          padding: 0.9rem 2.2rem;
          font-family: var(--mono);
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
          text-decoration: none;
          display: inline-block;
        }
        .hl-btn-primary:hover { background: var(--rust); }

        .hl-btn-secondary {
          color: var(--muted);
          font-family: var(--mono);
          font-size: 0.78rem;
          font-weight: 300;
          letter-spacing: 0.08em;
          text-decoration: none;
          border-bottom: 1px solid var(--muted);
          padding-bottom: 2px;
          transition: all 0.2s;
        }
        .hl-btn-secondary:hover { color: var(--ink); border-color: var(--ink); }

        .hl-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .hl-lens-wrap {
          position: relative;
          width: 380px;
          height: 380px;
        }

        .hl-lens-outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(26,18,9,0.12);
          animation: hlSpin 40s linear infinite;
        }

        @keyframes hlSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hl-tick {
          position: absolute;
          width: 1px;
          height: 10px;
          background: rgba(26,18,9,0.2);
          left: 50%;
          top: -1px;
          transform-origin: 50% 191px;
        }

        .hl-lens-inner {
          position: absolute;
          inset: 30px;
          border-radius: 50%;
          background: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hl-ring1 { position: absolute; inset: 26px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.12); }
        .hl-ring2 { position: absolute; inset: 62px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2); }
        .hl-ring3 { position: absolute; inset: 98px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.35); }

        .hl-stat {
          position: absolute;
          background: var(--paper);
          border: 1px solid rgba(26,18,9,0.1);
          padding: 0.8rem 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          animation: hlFloat 4s ease-in-out infinite;
        }
        .hl-stat:nth-child(3) { animation-delay: -2s; }

        @keyframes hlFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .hl-stat-num {
          font-family: var(--serif);
          font-size: 1.6rem;
          color: var(--ink);
          line-height: 1;
        }

        .hl-stat-label {
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .hl-stat-1 { top: 20px; right: -30px; }
        .hl-stat-2 { bottom: 60px; left: -40px; }

        .hl-marquee {
          background: var(--ink);
          padding: 1rem 0;
          overflow: hidden;
        }

        .hl-marquee-track {
          display: flex;
          animation: hlMarquee 18s linear infinite;
          white-space: nowrap;
        }

        @keyframes hlMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .hl-marquee-item {
          font-family: var(--mono);
          font-size: 0.72rem;
          font-weight: 300;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--cream);
          padding: 0 2.5rem;
          opacity: 0.7;
          flex-shrink: 0;
        }
        .hl-marquee-dot { color: var(--rust); opacity: 1 !important; }

        .hl-section {
          padding: 8rem 4rem;
        }

        .hl-section-label {
          font-family: var(--mono);
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--rust);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .hl-section-label::after {
          content: '';
          width: 60px;
          height: 1px;
          background: var(--rust);
          opacity: 0.4;
        }

        .hl-section-title {
          font-family: var(--serif);
          font-size: clamp(2.5rem, 4vw, 3.8rem);
          letter-spacing: -0.03em;
          line-height: 1.05;
          margin-bottom: 4rem;
          max-width: 520px;
        }

        .hl-steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-left: 1px solid rgba(26,18,9,0.1);
        }

        .hl-step {
          padding: 2.5rem;
          border-right: 1px solid rgba(26,18,9,0.1);
          border-bottom: 1px solid rgba(26,18,9,0.1);
          transition: background 0.2s;
        }
        .hl-step:hover { background: var(--paper); }

        .hl-step-num {
          font-family: var(--serif);
          font-size: 3.5rem;
          font-style: italic;
          color: rgba(26,18,9,0.08);
          line-height: 1;
          margin-bottom: 1.5rem;
        }

        .hl-step-title {
          font-family: var(--serif);
          font-size: 1.3rem;
          letter-spacing: -0.02em;
          margin-bottom: 0.8rem;
          color: var(--ink);
        }

        .hl-step-desc {
          font-family: var(--mono);
          font-size: 0.78rem;
          font-weight: 300;
          line-height: 1.8;
          color: var(--muted);
        }

        .hl-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-top: 1px solid rgba(26,18,9,0.1);
        }

        .hl-col {
          padding: 5rem 4rem;
        }
        .hl-col:first-child { border-right: 1px solid rgba(26,18,9,0.1); }
        .hl-col-dark {
          background: var(--ink);
        }
        .hl-col-dark .hl-section-label { color: var(--gold); }
        .hl-col-dark .hl-section-label::after { background: var(--gold); }
        .hl-col-dark .hl-section-title { color: var(--cream); }
        .hl-col-dark .hl-feature-item { border-color: rgba(245,240,232,0.1); }
        .hl-col-dark .hl-feature-title { color: var(--cream); }
        .hl-col-dark .hl-feature-desc { color: rgba(245,240,232,0.5); }
        .hl-col-dark .hl-feature-num { color: rgba(245,240,232,0.08); }

        .hl-feature-item {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          padding: 1.5rem 0;
          border-bottom: 1px solid rgba(26,18,9,0.08);
        }

        .hl-feature-num {
          font-family: var(--serif);
          font-size: 1.8rem;
          font-style: italic;
          color: rgba(26,18,9,0.08);
          line-height: 1;
          flex-shrink: 0;
          width: 32px;
        }

        .hl-feature-title {
          font-family: var(--serif);
          font-size: 1.05rem;
          letter-spacing: -0.01em;
          margin-bottom: 0.35rem;
          color: var(--ink);
        }

        .hl-feature-desc {
          font-family: var(--mono);
          font-size: 0.75rem;
          font-weight: 300;
          line-height: 1.7;
          color: var(--muted);
        }

        .hl-tech-row {
          padding: 3rem 4rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          border-top: 1px solid rgba(26,18,9,0.1);
          flex-wrap: wrap;
        }

        .hl-tech-label {
          font-family: var(--mono);
          font-size: 0.68rem;
          font-weight: 300;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--muted);
          flex-shrink: 0;
        }

        .hl-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid rgba(26,18,9,0.15);
          padding: 0.45rem 0.9rem;
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          color: var(--ink);
        }

        .hl-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--sage); display: inline-block; }
        .hl-dot-rust { background: var(--rust); }
        .hl-dot-gold { background: var(--gold); }

        .hl-footer {
          padding: 3rem 4rem;
          border-top: 1px solid rgba(26,18,9,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hl-footer-logo {
          font-family: var(--serif);
          font-size: 1.1rem;
          color: var(--ink);
        }

        .hl-footer-copy {
          font-family: var(--mono);
          font-size: 0.68rem;
          font-weight: 300;
          letter-spacing: 0.08em;
          color: var(--muted);
        }

        @media (max-width: 900px) {
          .hl-nav { padding: 1.5rem 2rem; }
          .hl-hero { grid-template-columns: 1fr; padding: 7rem 2rem 3rem; }
          .hl-visual { display: none; }
          .hl-section { padding: 5rem 2rem; }
          .hl-steps { grid-template-columns: 1fr; }
          .hl-split { grid-template-columns: 1fr; }
          .hl-col:first-child { border-right: none; border-bottom: 1px solid rgba(26,18,9,0.1); }
          .hl-footer { flex-direction: column; gap: 1rem; text-align: center; }
          .hl-tech-row { padding: 2rem; }
        }
      `}</style>

      {/* NAV */}
      <nav className="hl-nav">
        <span className="hl-nav-logo">HumanLens</span>
        <div className="hl-nav-links">
          <a href="#how">How it works</a>
          <a href="#for-whom">For whom</a>
          <Link href="/marketplace" className="hl-nav-cta">Browse marketplace</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="hl-hero">
        <div className="hl-hero-left">
          <div className="hl-eyebrow">Image API for AI agents</div>
          <h1 className="hl-h1">
            Real photos.<br /><em>Not generated.</em><br />Never faked.
          </h1>
          <p className="hl-desc">
            HumanLens aggregates millions of human-taken photos from everyday contributors — searchable and purchasable by AI agents via a single HTTP call. One request. On-chain payment. Done.
          </p>
          <div className="hl-actions">
            <Link href="/marketplace" className="hl-btn-primary">Browse marketplace</Link>
            <a href="#how" className="hl-btn-secondary">See how it works</a>
          </div>
        </div>

        <div className="hl-hero-right hl-visual">
          <div className="hl-lens-wrap">
            <div className="hl-lens-outer">
              {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg) => (
                <div key={deg} className="hl-tick" style={{ transform: `rotate(${deg}deg) translateX(-50%)` }} />
              ))}
            </div>
            <div className="hl-lens-inner">
              <div className="hl-ring1" />
              <div className="hl-ring2" />
              <div className="hl-ring3" />
              <svg width="100" height="120" viewBox="0 0 100 120" fill="none" style={{ position: "relative", zIndex: 2 }}>
                <circle cx="50" cy="32" r="18" stroke="white" strokeWidth="2" />
                <path d="M18 72 Q18 60 32 56 Q50 51 68 56 Q82 60 82 72" stroke="white" strokeWidth="2" strokeLinecap="round" />
                <line x1="50" y1="51" x2="50" y2="72" stroke="white" strokeWidth="1.5" opacity="0.5" />
              </svg>
            </div>
            <div className="hl-stat hl-stat-2">
              <span className="hl-stat-num">100%</span>
              <span className="hl-stat-label">Human verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="hl-marquee">
        <div className="hl-marquee-track">
          {["Human-verified","·","AI-agent ready","·","x402 protocol","·","TON blockchain","·","Pay per download","·","No AI slop","·","Real photos","·",
            "Human-verified","·","AI-agent ready","·","x402 protocol","·","TON blockchain","·","Pay per download","·","No AI slop","·","Real photos","·"].map((item, i) => (
            <span key={i} className={`hl-marquee-item${item === "·" ? " hl-marquee-dot" : ""}`}>{item}</span>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="hl-section" id="how">
        <div className="hl-section-label">How it works</div>
        <h2 className="hl-section-title">One HTTP call.<br />On-chain settlement.</h2>
        <div className="hl-steps">
          {[
            { n: "01", title: "Contributors upload via Telegram", desc: "Everyday humans send photos to our bot. Set a price, add a description, done. No app. No dashboard. No friction." },
            { n: "02", title: "AI agent requests an image", desc: "One GET request. Server returns HTTP 402 with price and recipient wallet. Agent signs a TON Jetton transfer locally — nothing broadcast yet." },
            { n: "03", title: "Payment confirmed, image delivered", desc: "Facilitator broadcasts the signed BOC, polls for on-chain confirmation. 200 OK + full image + TX hash. Contributor paid directly, peer-to-peer." },
          ].map((s) => (
            <div key={s.n} className="hl-step">
              <div className="hl-step-num">{s.n}</div>
              <div className="hl-step-title">{s.title}</div>
              <p className="hl-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOR WHOM */}
      <div className="hl-split" id="for-whom">
        <div className="hl-col">
          <div className="hl-section-label">For contributors</div>
          <h2 className="hl-section-title">Turn your camera roll into income.</h2>
          {[
            { title: "Dead simple via Telegram", desc: "Send a photo, write a description, set a price. Your wallet gets paid on every download." },
            { title: "Upload your whole gallery", desc: "Photos sitting on your phone can earn. The more you share, the more the long tail compounds." },
            { title: "Payments go directly to you", desc: "On-chain, automatic, peer-to-peer. We never touch the money." },
          ].map((f, i) => (
            <div key={i} className="hl-feature-item">
              <span className="hl-feature-num">{i + 1}</span>
              <div>
                <div className="hl-feature-title">{f.title}</div>
                <p className="hl-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="hl-col hl-col-dark">
          <div className="hl-section-label">For AI agents</div>
          <h2 className="hl-section-title">The image API that scales with you.</h2>
          {[
            { title: "100% real photos", desc: "Every image is human-taken and AI-screened. No generated content, ever. Ground truth data at scale." },
            { title: "Fulfill any request", desc: "Need 1000 photos of a niche subject? No single person has that — but 1000 people each uploaded one." },
            { title: "Pay per download, x402", desc: "One HTTP call. No OAuth, no API key, no contract. Payment is a signed header, settlement is on-chain." },
          ].map((f, i) => (
            <div key={i} className="hl-feature-item">
              <span className="hl-feature-num">{i + 1}</span>
              <div>
                <div className="hl-feature-title">{f.title}</div>
                <p className="hl-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TECH ROW */}
      <div className="hl-tech-row">
        <span className="hl-tech-label">Built with</span>
        {[
          { label: "x402 Protocol", dot: "" },
          { label: "TON Blockchain", dot: "hl-dot-rust" },
          { label: "BSA USD Jetton", dot: "hl-dot-gold" },
          { label: "Telegram Bot API", dot: "" },
          { label: "Claude AI tagging", dot: "hl-dot-rust" },
        ].map((b) => (
          <span key={b.label} className="hl-badge">
            <span className={`hl-dot ${b.dot}`} />
            {b.label}
          </span>
        ))}
      </div>

      {/* FOOTER */}
      <footer className="hl-footer">
        <span className="hl-footer-logo">HumanLens</span>
        <span className="hl-footer-copy">EPFL Hackathon 2026 — BSA × TON</span>
      </footer>
    </>
  );
}