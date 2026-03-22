"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ============================================================
// Types
// ============================================================

interface ImageMeta {
  id: string;
  image_name: string;
  attributs_image: string[];
  price: string;
  owner_ID: string;
  created_at: string;
  image_data?: string;
}

// ============================================================
// Helpers
// ============================================================

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

const TAG_COLORS = ["#6366f1","#06b6d4","#f59e0b","#10b981","#ec4899","#8b5cf6"];
function tagColor(tag: string): string {
  const sum = [...tag].reduce((a, c) => a + c.charCodeAt(0), 0);
  return TAG_COLORS[Math.abs(sum) % TAG_COLORS.length];
}

// ============================================================
// Sub-components
// ============================================================


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
      title="Copy ID"
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: copied ? "#10b981" : "#475569", fontSize: 11,
        padding: "0 4px", lineHeight: 1, flexShrink: 0,
      }}
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

function ImageCard({ img, onClick }: { img: ImageMeta; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const price = atomicToUSD(img.price);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#0f172a",
        border: `1px solid ${hov ? "#334155" : "#1e293b"}`,
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        transition: "transform .18s, border-color .18s, box-shadow .18s",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? "0 8px 32px rgba(0,0,0,.45)" : "none",
      }}
    >
      {/* Image zone */}
      <div style={{ position: "relative", height: 180, background: "#1e293b", overflow: "hidden" }}>
        {img.image_data ? (
          <img
            src={`data:image/jpeg;base64,${img.image_data}`}
            alt={img.image_name}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(3px)", transform: "scale(1.05)" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40, opacity: .15 }}>🖼</span>
          </div>
        )}
        {/* Lock overlay */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,.35)", backdropFilter: "blur(2px)",
        }}>
          <div style={{
            background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 8, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 13 }}>🔒</span>
            <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600 }}>Pay to unlock</span>
          </div>
        </div>
        {/* Price badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "#10b981", color: "#fff",
          borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700,
          boxShadow: "0 2px 8px rgba(16,185,129,.4)",
        }}>
          {price} BSA
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#94a3b8", fontFamily: "monospace",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {img.id}
          </span>
          <CopyButton text={img.id} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {img.attributs_image.map(t => (
            <span key={t} style={{
              background: `${tagColor(t)}22`, border: `1px solid ${tagColor(t)}55`,
              color: tagColor(t), borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500,
            }}>{t}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#64748b", fontSize: 11, background: "#1e293b", borderRadius: 6, padding: "2px 8px" }}>
            {img.owner_ID.slice(0, 8)}…
          </span>
          <span style={{ color: "#475569", fontSize: 11 }}>{timeAgo(img.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main page
// ============================================================

export default function MarketplacePage() {
  const [images, setImages]           = useState<ImageMeta[]>([]);
  const [tagInput, setTagInput]       = useState("");
  const [activeTags, setActiveTags]   = useState<string[]>([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<ImageMeta | null>(null);
  const [downloadStatus, setDlStatus] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState("");

  // ── Data fetching ──────────────────────────────────────────

  const fetchImages = useCallback(async (tags?: string) => {
    try {
      const q = tags ? `?tags=${encodeURIComponent(tags)}&limit=50` : "?limit=50";
      const res  = await fetch(`/api/images/search${q}`);
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
    if (!autoRefresh) return;
    const id = setInterval(() => { fetchImages(activeTags.join(",") || undefined); }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, activeTags, fetchImages]);

  // ── Actions ───────────────────────────────────────────────

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || activeTags.includes(tag) || activeTags.length >= 10) return;
    const next = [...activeTags, tag];
    setActiveTags(next);
    setTagInput("");
    setLoading(true);
    fetchImages(next.join(","));
  };

  const removeTag = (tag: string) => {
    const next = activeTags.filter(t => t !== tag);
    setActiveTags(next);
    setLoading(true);
    fetchImages(next.join(",") || undefined);
  };

  const clearFilter = () => {
    setActiveTags([]);
    setTagInput("");
    setLoading(true);
    fetchImages();
  };

  const handleDownload = async (id: string) => {
    setDlStatus("requesting…");
    try {
      const res = await fetch(`/api/images/${id}/download`);
      if (res.status === 402) {
        const data = await res.json();
        setDlStatus(`402 Payment Required — ${data.description ?? "Pay to download"}`);
      } else if (res.ok) {
        const data = await res.json();
        const link = document.createElement("a");
        link.href     = `data:image/jpeg;base64,${data.image_data}`;
        link.download = data.image_name;
        link.click();
        setDlStatus("✅ Downloaded!");
      } else {
        setDlStatus(`Error ${res.status}`);
      }
    } catch { setDlStatus("Network error"); }
  };

  // ── Render ────────────────────────────────────────────────

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
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#f1f5f9" }}>BSA</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: "#06b6d4" }}>Marketplace</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>Home</Link>
          <div
            onClick={() => setAutoRefresh(v => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: autoRefresh ? "#10b981" : "#475569", boxShadow: autoRefresh ? "0 0 6px #10b981" : "none", transition: "all .3s" }} />
            <span style={{ color: autoRefresh ? "#10b981" : "#475569", fontSize: 12, fontWeight: 600 }}>
              {autoRefresh ? "Live" : "Paused"}
            </span>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 64px" }}>

        {/* HEADER */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
              Image Marketplace
            </h1>
            <div style={{
              background: "rgba(6,182,212,.1)", border: "1px solid rgba(6,182,212,.25)",
              color: "#06b6d4", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 600,
            }}>
              {totalCount} image{totalCount !== 1 ? "s" : ""}
            </div>
          </div>
          <p style={{ color: "#475569", fontSize: 14, margin: 0 }}>
            Images uploaded via Telegram · Preview free · Download requires x402 payment
          </p>
        </div>

        {/* SEARCH */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: activeTags.length > 0 ? 12 : 0 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
                  if (e.key === "Escape") clearFilter();
                  if (e.key === "Backspace" && tagInput === "" && activeTags.length > 0) removeTag(activeTags[activeTags.length - 1]);
                }}
                placeholder={activeTags.length >= 10 ? "Max 10 tags reached" : "Add a tag and press Enter…"}
                disabled={activeTags.length >= 10}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "#0f172a", border: "1px solid #1e293b",
                  borderRadius: 10, padding: "10px 14px 10px 40px",
                  color: "#f1f5f9", fontSize: 14, outline: "none",
                  opacity: activeTags.length >= 10 ? 0.5 : 1,
                }}
              />
            </div>
            <button onClick={() => addTag(tagInput)} style={{
              background: "#3b82f6", color: "#fff", border: "none",
              borderRadius: 10, padding: "0 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
            }}>Add</button>
            {activeTags.length > 0 && (
              <button onClick={clearFilter} style={{
                background: "transparent", border: "1px solid #1e293b",
                color: "#64748b", borderRadius: 10, padding: "0 16px", fontSize: 13, cursor: "pointer",
              }}>Clear</button>
            )}
          </div>
          {activeTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {activeTags.map(t => {
                const c = tagColor(t);
                return (
                  <button key={t} onClick={() => removeTag(t)} style={{
                    background: `${c}22`, border: `1px solid ${c}88`,
                    color: c, borderRadius: 20, padding: "4px 10px 4px 14px",
                    fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {t} <span style={{ fontSize: 10, opacity: 0.7 }}>✕</span>
                  </button>
                );
              })}
              <span style={{ color: "#334155", fontSize: 12, alignSelf: "center" }}>{activeTags.length}/10</span>
            </div>
          )}
        </div>

        {/* GRID */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#475569", padding: "64px 0" }}>Loading…</div>
        ) : images.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 24px", background: "#0f172a", borderRadius: 16, border: "1px solid #1e293b" }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: .2 }}>📭</div>
            <p style={{ color: "#475569", margin: 0 }}>No images yet — send a photo to your Telegram bot.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {images.map(img => (
              <ImageCard key={img.id} img={img} onClick={() => { setSelected(img); setDlStatus(null); }} />
            ))}
          </div>
        )}

        {/* FOOTER HINT */}
        {lastRefresh && (
          <p style={{ textAlign: "center", color: "#334155", fontSize: 11, marginTop: 32 }}>
            Last refresh: {lastRefresh}{autoRefresh ? " · auto every 5s" : ""}
          </p>
        )}
      </div>

      {/* MODAL */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
          backdropFilter: "blur(8px)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "#0f172a", border: "1px solid #1e293b",
            borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", position: "relative",
          }}>
            <button onClick={() => setSelected(null)} style={{
              position: "absolute", top: 14, right: 14,
              background: "#1e293b", border: "none", color: "#94a3b8",
              width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14,
            }}>✕</button>

            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, paddingRight: 36 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selected.id}
              </span>
              <CopyButton text={selected.id} />
            </div>

            {/* Blurred preview */}
            <div style={{ height: 180, borderRadius: 12, overflow: "hidden", background: "#1e293b", marginBottom: 20, position: "relative" }}>
              {selected.image_data ? (
                <img src={`data:image/jpeg;base64,${selected.image_data}`} alt={selected.image_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(4px)", transform: "scale(1.05)" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 50, opacity: .1 }}>🖼</span>
                </div>
              )}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(0,0,0,.5)" }}>
                <span style={{ fontSize: 28 }}>🔒</span>
                <span style={{ color: "#06b6d4", fontWeight: 600, fontSize: 13 }}>
                  Pay {atomicToUSD(selected.price)} BSA USD to unlock
                </span>
              </div>
            </div>

            {/* Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(16,185,129,.07)", border: "1px solid rgba(16,185,129,.15)", borderRadius: 10, padding: "10px 14px" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>Price</span>
                <span style={{ color: "#10b981", fontWeight: 700, fontSize: 13 }}>{atomicToUSD(selected.price)} BSA USD</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
                <span style={{ color: "#475569", fontSize: 13 }}>Owner</span>
                <span style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace" }}>{selected.owner_ID}</span>
              </div>
              <div style={{ padding: "0 4px" }}>
                <span style={{ color: "#475569", fontSize: 13, display: "block", marginBottom: 8 }}>Tags</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {selected.attributs_image.map(t => (
                    <span key={t} style={{ background: `${tagColor(t)}22`, border: `1px solid ${tagColor(t)}55`, color: tagColor(t), borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDownload(selected.id)}
              style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              💳 Pay & Download (x402)
            </button>

            {downloadStatus && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 8, fontSize: 12,
                background: downloadStatus.startsWith("402") ? "rgba(6,182,212,.07)" : downloadStatus.includes("✅") ? "rgba(16,185,129,.07)" : "rgba(239,68,68,.07)",
                border: `1px solid ${downloadStatus.startsWith("402") ? "rgba(6,182,212,.25)" : downloadStatus.includes("✅") ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.2)"}`,
                color: downloadStatus.startsWith("402") ? "#06b6d4" : downloadStatus.includes("✅") ? "#10b981" : "#ef4444",
              }}>
                {downloadStatus}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}