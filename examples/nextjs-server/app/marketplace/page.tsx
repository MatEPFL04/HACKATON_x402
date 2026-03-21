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

function TagPill({ tag, active, onClick }: { tag: string; active: boolean; onClick: () => void }) {
  const c = tagColor(tag);
  return (
    <button
      onClick={onClick}
      style={{
        background:    active ? `${c}22` : "transparent",
        border:        `1px solid ${active ? `${c}88` : "#1e293b"}`,
        color:         active ? c : "#475569",
        borderRadius:  20, padding: "4px 14px",
        fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s",
      }}
    >
      {tag}
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
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(7px)", transform: "scale(1.1)" }}
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
        <div style={{
          fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 10,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {img.attributs_image.filter(t => t !== "untagged").join(", ") || img.image_name.replace(/^photo_\d+_\w+\.jpg$/, "Sans titre")}
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
  const [allTags, setAllTags]         = useState<string[]>([]);
  const [search, setSearch]           = useState("");
  const [activeTag, setActiveTag]     = useState("");
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

  const fetchTags = useCallback(async () => {
    try {
      const res  = await fetch("/api/tags");
      const data = await res.json();
      setAllTags(data.tags ?? []);
    } catch (e) {
      console.error("Fetch tags failed:", e);
    }
  }, []);

  useEffect(() => { fetchImages(); fetchTags(); }, [fetchImages, fetchTags]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => { fetchImages(activeTag || search || undefined); fetchTags(); }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, activeTag, search, fetchImages, fetchTags]);

  // ── Actions ───────────────────────────────────────────────

  const applyTag = (tag: string) => {
    const next = activeTag === tag ? "" : tag;
    setActiveTag(next);
    setSearch("");
    setLoading(true);
    fetchImages(next || undefined);
  };

  const applySearch = () => {
    setActiveTag("");
    setLoading(true);
    fetchImages(search || undefined);
  };

  const clearFilter = () => {
    setSearch(""); setActiveTag("");
    setLoading(true); fetchImages();
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
          <Link href="/"          style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>Home</Link>
          <Link href="/quickstart" style={{ color: "#64748b", fontSize: 13, textDecoration: "none" }}>Quickstart</Link>
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
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 14 }}>🔍</span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setActiveTag(""); }}
              onKeyDown={e => { if (e.key === "Enter") applySearch(); if (e.key === "Escape") clearFilter(); }}
              placeholder="Search by tag or filename…"
              style={{
                width: "100%", boxSizing: "border-box",
                background: "#0f172a", border: "1px solid #1e293b",
                borderRadius: 10, padding: "10px 14px 10px 40px",
                color: "#f1f5f9", fontSize: 14, outline: "none",
              }}
            />
          </div>
          <button onClick={applySearch} style={{
            background: "#3b82f6", color: "#fff", border: "none",
            borderRadius: 10, padding: "0 20px", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>Search</button>
          {(search || activeTag) && (
            <button onClick={clearFilter} style={{
              background: "transparent", border: "1px solid #1e293b",
              color: "#64748b", borderRadius: 10, padding: "0 16px", fontSize: 13, cursor: "pointer",
            }}>Clear</button>
          )}
        </div>

        {/* TAG PILLS */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 32 }}>
            {allTags.map(t => (
              <TagPill key={t} tag={t} active={activeTag === t} onClick={() => applyTag(t)} />
            ))}
          </div>
        )}

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

            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, paddingRight: 36, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selected.attributs_image.filter(t => t !== "untagged").join(", ") || "Sans titre"}
            </h2>

            {/* Blurred preview */}
            <div style={{ height: 180, borderRadius: 12, overflow: "hidden", background: "#1e293b", marginBottom: 20, position: "relative" }}>
              {selected.image_data ? (
                <img src={`data:image/jpeg;base64,${selected.image_data}`} alt={selected.image_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(9px)", transform: "scale(1.1)" }} />
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