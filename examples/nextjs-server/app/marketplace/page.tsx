"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ImageMeta {
  id: string;
  image_name: string;
  attributs_image: string[];
  price: string;
  owner_ID: string;
  created_at: string;
  image_data?: string;
}

function atomicToUSD(atomic: string): string {
  try {
    const n = BigInt(atomic);
    const whole = n / 1_000_000_000n;
    const frac  = n % 1_000_000_000n;
    if (frac === 0n) return `${whole}`;
    return `${whole}.${frac.toString().padStart(9, "0").replace(/0+$/, "")}`;
  } catch { return atomic; }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: copied ? "#4A6741" : "#7A6E60",
        fontSize: 11, padding: "0 4px", lineHeight: 1, flexShrink: 0,
        fontFamily: "'DM Mono', monospace",
      }}
    >
      {copied ? "✓ copied" : "⎘"}
    </button>
  );
}

function ImageCard({ img, onClick }: { img: ImageMeta; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const price = atomicToUSD(img.price);
  const mainTag = img.attributs_image.filter(t => t !== "untagged")[0] ?? img.image_name;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#EDE7D9",
        border: `1px solid ${hov ? "#C4451A" : "rgba(26,18,9,0.12)"}`,
        overflow: "hidden", cursor: "pointer",
        transition: "transform .18s, border-color .18s, box-shadow .18s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 8px 32px rgba(196,69,26,0.12)" : "none",
      }}
    >
      {/* Image zone */}
      <div style={{ position: "relative", height: 200, background: "#1A1209", overflow: "hidden" }}>
        {img.image_data ? (
          <img
            src={`data:image/jpeg;base64,${img.image_data}`}
            alt={img.image_name}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(4px)", transform: "scale(1.06)" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 32, opacity: .1, color: "#F5F0E8" }}>▣</span>
          </div>
        )}
        {/* Lock overlay */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(26,18,9,0.5)" }}>
          <div style={{ border: "1px solid rgba(245,240,232,0.2)", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#F5F0E8", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 300 }}>
              locked · pay to unlock
            </span>
          </div>
        </div>
        {/* Price badge */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "#C4451A", color: "#F5F0E8",
          padding: "4px 12px",
          fontSize: 11, fontWeight: 500,
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.06em",
        }}>
          {price} BSA
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 15, color: "#1A1209", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {mainTag}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {img.attributs_image.slice(0, 4).map(t => (
            <span key={t} style={{
              border: "1px solid rgba(26,18,9,0.2)",
              color: "#7A6E60", padding: "2px 8px", fontSize: 10,
              fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em",
              textTransform: "lowercase",
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ color: "#7A6E60", fontSize: 10, fontFamily: "monospace" }}>{img.id.slice(0, 12)}…</span>
            <CopyButton text={img.id} />
          </div>
          <span style={{ color: "#7A6E60", fontSize: 10, fontFamily: "'DM Mono', monospace" }}>{timeAgo(img.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [images, setImages]         = useState<ImageMeta[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState<ImageMeta | null>(null);
  const [downloadStatus, setDlStatus] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");

  const fetchImages = useCallback(async (query?: string) => {
    try {
      const qs = query ? `?q=${encodeURIComponent(query)}&limit=50` : "?limit=50";
      const res  = await fetch(`/api/images/search${qs}`);
      const data = await res.json();
      setImages(data.images ?? []);
      setTotalCount(data.count ?? 0);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.error("Fetch images failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  useEffect(() => {
    if (!autoRefresh || activeQuery) return; // don't re-embed on every tick
    const id = setInterval(() => { fetchImages(); }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, activeQuery, fetchImages]);

  const runSearch = (q: string) => {
    setActiveQuery(q);
    setLoading(true);
    fetchImages(q || undefined);
  };

  const clearSearch = () => {
    setQueryInput("");
    setActiveQuery("");
    setLoading(true);
    fetchImages();
  };

  const handleDownload = async (id: string) => {
    setDlStatus("requesting…");
    try {
      const res = await fetch(`/api/images/${id}/download`);
      if (res.status === 402) {
        const data = await res.json();
        setDlStatus(`402 — ${data.description ?? "Pay to download"}`);
      } else if (res.ok) {
        const data = await res.json();
        const link = document.createElement("a");
        link.href     = `data:image/jpeg;base64,${data.image_data}`;
        link.download = data.image_name;
        link.click();
        setDlStatus("✓ Downloaded");
      } else {
        setDlStatus(`Error ${res.status}`);
      }
    } catch { setDlStatus("Network error"); }
  };

  const C = {
    cream: "#F5F0E8", ink: "#1A1209", rust: "#C4451A",
    paper: "#EDE7D9", muted: "#7A6E60", border: "rgba(26,18,9,0.1)",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: ${C.cream}; margin: 0; }
        .hl-search:focus { outline: none; border-color: ${C.rust} !important; }
        .hl-search::placeholder { color: ${C.muted}; }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.cream, color: C.ink, fontFamily: "'DM Mono', monospace" }}>

        {/* NAV */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 4rem", height: 56,
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(245,240,232,0.92)", backdropFilter: "blur(8px)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <Link href="/" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.ink, textDecoration: "none", letterSpacing: "-0.02em" }}>
            HumanLens
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/" style={{ color: C.muted, fontSize: 11, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Home
            </Link>
            <div onClick={() => setAutoRefresh(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: autoRefresh ? "#4A6741" : C.muted,
                boxShadow: autoRefresh ? "0 0 6px #4A6741" : "none",
                transition: "all .3s",
              }} />
              <span style={{ color: autoRefresh ? "#4A6741" : C.muted, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {autoRefresh ? "Live" : "Paused"}
              </span>
            </div>
          </div>
        </nav>

        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* HEADER */}
          <div style={{ marginBottom: 40, borderBottom: `1px solid ${C.border}`, paddingBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.2em", textTransform: "uppercase", color: C.rust, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "block", width: 24, height: 1, background: C.rust }} />
              Marketplace
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem,5vw,3.5rem)", letterSpacing: "-0.03em", lineHeight: 1, margin: 0, color: C.ink }}>
                Human-verified<br /><em style={{ fontStyle: "italic", color: C.rust }}>images.</em>
              </h1>
              <div style={{ border: `1px solid ${C.border}`, padding: "6px 16px", fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>
                {totalCount} image{totalCount !== 1 ? "s" : ""} available
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 12, fontFamily: "'DM Mono', monospace" }}>⌕</span>
                <input
                  className="hl-search"
                  value={queryInput}
                  onChange={e => setQueryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { e.preventDefault(); runSearch(queryInput); }
                    if (e.key === "Escape") clearSearch();
                  }}
                  placeholder="Natural language search… e.g. two people sitting outside"
                  style={{
                    width: "100%",
                    background: C.paper, border: `1px solid ${activeQuery ? C.rust : C.border}`,
                    padding: "11px 14px 11px 36px",
                    color: C.ink, fontSize: 13, fontFamily: "'DM Mono', monospace",
                    fontWeight: 300, letterSpacing: "0.02em",
                  }}
                />
              </div>
              <button onClick={() => runSearch(queryInput)} style={{
                background: C.ink, color: C.cream, border: "none",
                padding: "0 24px", fontFamily: "'DM Mono', monospace",
                fontSize: 11, fontWeight: 500, letterSpacing: "0.12em",
                textTransform: "uppercase", cursor: "pointer",
                transition: "background 0.2s",
              }}>Search</button>
              {activeQuery && (
                <button onClick={clearSearch} style={{
                  background: "transparent", border: `1px solid ${C.border}`,
                  color: C.muted, padding: "0 16px",
                  fontFamily: "'DM Mono', monospace", fontSize: 11, cursor: "pointer",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>Clear</button>
              )}
            </div>
            {activeQuery && (
              <p style={{ color: C.muted, fontSize: 11, margin: "8px 0 0 2px", letterSpacing: "0.05em" }}>
                Semantic results for: <span style={{ color: C.rust, fontWeight: 500 }}>"{activeQuery}"</span>
              </p>
            )}
          </div>

          {/* GRID */}
          {loading ? (
            <div style={{ textAlign: "center", color: C.muted, padding: "64px 0", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: "0.1em" }}>
              Loading…
            </div>
          ) : images.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 24px", border: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: C.ink, opacity: 0.2, marginBottom: 12 }}>No images yet</div>
              <p style={{ color: C.muted, fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
                Send a photo to the Telegram bot to get started.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 1, border: `1px solid ${C.border}`, borderRight: "none", borderBottom: "none" }}>
              {images.map(img => (
                <div key={img.id} style={{ borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                  <ImageCard img={img} onClick={() => { setSelected(img); setDlStatus(null); }} />
                </div>
              ))}
            </div>
          )}

          {lastRefresh && (
            <p style={{ textAlign: "center", color: C.muted, fontSize: 10, marginTop: 24, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Last refresh: {lastRefresh}{autoRefresh ? " · auto every 5s" : ""}
            </p>
          )}
        </div>

        {/* MODAL */}
        {selected && (
          <div onClick={() => setSelected(null)} style={{
            position: "fixed", inset: 0, background: "rgba(26,18,9,0.7)",
            backdropFilter: "blur(6px)", zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: C.cream, border: `1px solid ${C.border}`,
              padding: 32, maxWidth: 460, width: "100%", position: "relative",
            }}>
              <button onClick={() => setSelected(null)} style={{
                position: "absolute", top: 16, right: 16,
                background: "none", border: `1px solid ${C.border}`,
                color: C.muted, width: 28, height: 28, cursor: "pointer",
                fontSize: 12, fontFamily: "'DM Mono', monospace",
              }}>✕</button>

              {/* ID row */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace", letterSpacing: "0.05em" }}>{selected.id}</span>
                <CopyButton text={selected.id} />
              </div>

              {/* Blurred preview */}
              <div style={{ height: 200, overflow: "hidden", background: C.ink, marginBottom: 24, position: "relative" }}>
                {selected.image_data ? (
                  <img src={`data:image/jpeg;base64,${selected.image_data}`} alt={selected.image_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(5px)", transform: "scale(1.08)" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 40, opacity: .1, color: C.cream }}>▣</span>
                  </div>
                )}
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(26,18,9,0.55)" }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(245,240,232,0.7)" }}>
                    locked
                  </span>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: C.cream, letterSpacing: "-0.02em" }}>
                    {atomicToUSD(selected.price)} BSA USD
                  </span>
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, border: `1px solid ${C.border}`, marginBottom: 24 }}>
                {[
                  { label: "Price", value: `${atomicToUSD(selected.price)} BSA USD` },
                  { label: "Owner", value: `${selected.owner_ID.slice(0,10)}…` },
                ].map(r => (
                  <div key={r.label} style={{ padding: "12px 16px", borderRight: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>{r.label}</div>
                    <div style={{ fontSize: 13, color: C.ink, fontFamily: "'DM Mono', monospace", fontWeight: 400 }}>{r.value}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: C.muted, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>Tags</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selected.attributs_image.map(t => (
                    <span key={t} style={{ border: `1px solid ${C.border}`, color: C.muted, padding: "3px 10px", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em" }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={() => handleDownload(selected.id)}
                style={{
                  width: "100%", padding: "14px 0",
                  background: C.ink, color: C.cream, border: "none",
                  fontFamily: "'DM Mono', monospace", fontSize: 12,
                  fontWeight: 500, letterSpacing: "0.12em",
                  textTransform: "uppercase", cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = C.rust)}
                onMouseLeave={e => (e.currentTarget.style.background = C.ink)}
              >
                Pay &amp; Download — x402
              </button>

              {downloadStatus && (
                <div style={{
                  marginTop: 12, padding: "8px 14px",
                  fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em",
                  border: `1px solid ${downloadStatus.includes("✓") ? "rgba(74,103,65,0.4)" : downloadStatus.startsWith("402") ? "rgba(196,69,26,0.3)" : "rgba(196,69,26,0.3)"}`,
                  color: downloadStatus.includes("✓") ? "#4A6741" : C.rust,
                  background: downloadStatus.includes("✓") ? "rgba(74,103,65,0.06)" : "rgba(196,69,26,0.04)",
                }}>
                  {downloadStatus}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}