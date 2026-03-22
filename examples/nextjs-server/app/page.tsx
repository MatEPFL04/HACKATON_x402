import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#f1f5f9", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>

      {/* NAV */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 56,
        borderBottom: "1px solid #1e293b",
        background: "rgba(2,8,23,.9)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}>
          MAR<span style={{ color: "#06b6d4" }}>Pictures</span>
        </span>
        <Link href="/marketplace" style={{
          background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
          color: "#fff", textDecoration: "none",
          borderRadius: 8, padding: "6px 18px", fontSize: 13, fontWeight: 700,
        }}>
          Browse Marketplace
        </Link>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "96px 24px 80px", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
          <div style={{
            background: "rgba(6,182,212,.1)", border: "1px solid rgba(6,182,212,.25)",
            color: "#06b6d4", borderRadius: 20, padding: "4px 16px", fontSize: 12, fontWeight: 600,
          }}>
            Powered by x402 · TON blockchain
          </div>
          <div style={{
            background: "rgba(139,92,246,.1)", border: "1px solid rgba(139,92,246,.25)",
            color: "#a78bfa", borderRadius: 20, padding: "4px 16px", fontSize: 12, fontWeight: 600,
          }}>
            Built for AI agents
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(32px,6vw,56px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, margin: "0 0 20px" }}>
          The image API<br />
          <span style={{ background: "linear-gradient(135deg,#3b82f6,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            built for AI agents.
          </span>
        </h1>

        <p style={{ fontSize: 18, color: "#64748b", lineHeight: 1.6, margin: "0 0 40px" }}>
          Millions of real, human-taken photos aggregated from everyday contributors — searchable and purchasable by AI agents via a single HTTP call. Upload your gallery, earn on every download.
        </p>

        <Link href="/marketplace" style={{
          display: "inline-block",
          background: "linear-gradient(135deg,#3b82f6,#06b6d4)",
          color: "#fff", textDecoration: "none",
          borderRadius: 14, padding: "14px 36px", fontSize: 16, fontWeight: 800,
          boxShadow: "0 8px 32px rgba(6,182,212,.3)",
        }}>
          Browse the Marketplace →
        </Link>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* SELLERS */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: "28px 28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>📤</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}>For contributors</span>
            </div>
            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 20px", lineHeight: 1.5 }}>
              Turn your existing photos into a passive income stream — no technical setup required.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { icon: "📱", title: "Dead simple via Telegram", desc: "Just send photos to the bot, add a few tags and a price. No app, no account, no dashboard." },
                { icon: "🗂", title: "Upload your whole gallery", desc: "Even photos sitting unused on your phone can earn. The more you share, the more you can make." },
                { icon: "💰", title: "Earn on every download", desc: "Every time an AI agent purchases one of your images, you receive a payment — automatically." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(59,130,246,.1)", border: "1px solid rgba(59,130,246,.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BUYERS */}
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: "28px 28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>🤖</span>
              <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}>For AI agents</span>
            </div>
            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 20px", lineHeight: 1.5 }}>
              A single API to access an ever-growing pool of authentic, human-taken images at scale.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                { icon: "✅", title: "100% real photos", desc: "Every image is taken and uploaded by a human. No AI-generated content, ever." },
                { icon: "📦", title: "Fulfill any request at scale", desc: 'Need 1 000 photos of a specific subject? No single person has that — but 1 000 people each uploaded one. We aggregate the long tail so you always get what you need.' },
                { icon: "💳", title: "Pay per download via x402", desc: "One HTTP call. No OAuth, no API key, no contract. Payment is a signed header, settlement is on-chain." },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>{s.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* UNDER THE HOOD */}
        <div style={{
          marginTop: 24,
          background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: "24px 28px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>⚙️</span>
            <span style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9" }}>Under the hood</span>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[
              { label: "x402 protocol", desc: "HTTP 402 Payment Required — an AI agent pays with a signed header, no wallet UI needed." },
              { label: "Aggregated long tail", desc: "No single contributor needs a huge catalog. Thousands of people each uploading a few photos add up to millions of images covering every niche." },
              { label: "Contributors get paid", desc: "Every download triggers a payment to the contributor who uploaded that image — on-chain, automatic." },
            ].map((item, i) => (
              <div key={i} style={{ flex: "1 1 200px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#06b6d4", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1e293b", padding: "20px 32px", textAlign: "center" }}>
        <span style={{ color: "#334155", fontSize: 12 }}>
          MAR<span style={{ color: "#06b6d4" }}>Pictures</span> — EPFL Hackathon 2026
        </span>
      </footer>
    </div>
  );
}
