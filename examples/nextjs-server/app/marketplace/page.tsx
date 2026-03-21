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
  image_data?: string; // base64, retourné par le search endpoint
}

function atomicToUSD(atomic: string): string {
  try {
    const n = BigInt(atomic);
    const whole = n / 1_000_000_000n;
    const frac = n % 1_000_000_000n;
    if (frac === 0n) return `${whole}`;
    const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
    return `${whole}.${fracStr}`;
  } catch {
    return atomic;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function MarketplacePage() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchTags, setSearchTags] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ImageMeta | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const fetchImages = useCallback(async (tags?: string) => {
    try {
      const q = tags ? `?tags=${encodeURIComponent(tags)}&limit=50` : "?limit=50";
      const res = await fetch(`/api/images/search${q}`);
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
      const res = await fetch("/api/tags");
      const data = await res.json();
      setAllTags(data.tags ?? []);
    } catch (e) {
      console.error("Fetch tags failed:", e);
    }
  }, []);

  useEffect(() => {
    fetchImages();
    fetchTags();
  }, [fetchImages, fetchTags]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchImages(searchTags || undefined);
      fetchTags();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, searchTags, fetchImages, fetchTags]);

  const handleSearch = () => {
    setLoading(true);
    fetchImages(searchTags || undefined);
  };

  const handleTagClick = (tag: string) => {
    setSearchTags(tag);
    setLoading(true);
    fetchImages(tag);
  };

  const handleDownload = async (id: string) => {
    setDownloadStatus("requesting...");
    try {
      const res = await fetch(`/api/images/${id}/download`);
      if (res.status === 402) {
        const data = await res.json();
        setDownloadStatus(`402 Payment Required — ${data.description || "Pay to download"}`);
      } else if (res.ok) {
        const data = await res.json();
        // Trigger browser download of the image
        const link = document.createElement("a");
        link.href = `data:image/jpeg;base64,${data.image_data}`;
        link.download = data.image_name;
        link.click();
        setDownloadStatus("✅ Downloaded!");
      } else {
        setDownloadStatus(`Error ${res.status}`);
      }
    } catch {
      setDownloadStatus("Network error");
    }
  };

  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <Link href="/" className="nav-logo">
          BSA <span>Marketplace</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/quickstart" className="nav-link">Quickstart</Link>
          <div
            style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: autoRefresh ? "var(--success)" : "var(--muted)",
              transition: "background 0.3s",
            }} />
            <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
              {autoRefresh ? "Live" : "Paused"}
            </span>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 2rem 1rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1rem", marginBottom: "0.5rem" }}>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Image Marketplace
          </h1>
          <span style={{
            background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.3)",
            color: "var(--cyan)", padding: "0.2rem 0.6rem", borderRadius: 999,
            fontSize: "0.75rem", fontWeight: 600,
          }}>
            {totalCount} image{totalCount !== 1 ? "s" : ""}
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
          Images uploaded via Telegram. Preview is free — download requires x402 payment.
        </p>

        {/* Search bar */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Search by tags (comma-separated)..."
            value={searchTags}
            onChange={(e) => setSearchTags(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1, background: "var(--bg-input)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "0.6rem 1rem", color: "var(--text)",
              fontSize: "0.9rem", outline: "none",
            }}
          />
          <button onClick={handleSearch} style={{
            background: "var(--blue)", color: "white", border: "none",
            borderRadius: 8, padding: "0.6rem 1.2rem", fontWeight: 600,
            fontSize: "0.9rem", cursor: "pointer",
          }}>Search</button>
          {searchTags && (
            <button onClick={() => { setSearchTags(""); setLoading(true); fetchImages(); }} style={{
              background: "transparent", color: "var(--muted)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "0.6rem 1rem", fontSize: "0.9rem", cursor: "pointer",
            }}>Clear</button>
          )}
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.5rem" }}>
            {allTags.map((tag) => (
              <button key={tag} onClick={() => handleTagClick(tag)} style={{
                background: searchTags === tag ? "rgba(6, 182, 212, 0.2)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${searchTags === tag ? "var(--cyan)" : "var(--border)"}`,
                color: searchTags === tag ? "var(--cyan)" : "var(--muted)",
                borderRadius: 999, padding: "0.25rem 0.7rem", fontSize: "0.78rem",
                cursor: "pointer", transition: "all 0.2s",
              }}>{tag}</button>
            ))}
          </div>
        )}
      </section>

      {/* Grid */}
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 2rem 3rem" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "3rem" }}>Loading...</div>
        ) : images.length === 0 ? (
          <div style={{
            textAlign: "center", color: "var(--muted)", padding: "4rem 2rem",
            background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.4 }}>{"{ }"}</div>
            <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No images yet</p>
            <p style={{ fontSize: "0.85rem" }}>Send a photo to your Telegram bot to list it here.</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}>
            {images.map((img) => (
              <div
                key={img.id}
                onClick={() => { setSelectedImage(img); setDownloadStatus(null); }}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: 12, overflow: "hidden", cursor: "pointer",
                  transition: "border-color 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--blue-light)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Image preview — blurred */}
                <div style={{ position: "relative", width: "100%", height: 180, overflow: "hidden", background: "#0a1628" }}>
                  {img.image_data ? (
                    <>
                      <img
                        src={`data:image/jpeg;base64,${img.image_data}`}
                        alt={img.image_name}
                        style={{
                          width: "100%", height: "100%", objectFit: "cover",
                          filter: "blur(6px)", transform: "scale(1.1)",
                        }}
                      />
                      <div style={{
                        position: "absolute", inset: 0, display: "flex",
                        alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,0.4)",
                      }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--cyan)", fontWeight: 600 }}>
                          🔒 Pay to unlock
                        </span>
                      </div>
                    </>
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "2rem", opacity: 0.3 }}>🖼️</span>
                    </div>
                  )}
                  {/* Price badge */}
                  <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: "rgba(34, 197, 94, 0.9)", color: "#000",
                    padding: "0.2rem 0.6rem", borderRadius: 6,
                    fontSize: "0.75rem", fontWeight: 700,
                  }}>
                    {atomicToUSD(img.price)} BSA
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: "1rem" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem", wordBreak: "break-word" }}>
                    {img.image_name}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.75rem" }}>
                    {img.attributs_image.map((tag) => (
                      <span key={tag} style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)",
                        color: "var(--muted)", borderRadius: 4, padding: "0.1rem 0.45rem", fontSize: "0.72rem",
                      }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: "0.75rem" }}>
                    <span>by {img.owner_ID}</span>
                    <span>{timeAgo(img.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.75rem", marginTop: "1.5rem", opacity: 0.6 }}>
          {lastRefresh && `Last refresh: ${lastRefresh}`}
          {autoRefresh && " — auto-refreshing every 5s"}
        </div>
      </section>

      {/* Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: 16, padding: "2rem", maxWidth: 480, width: "100%", position: "relative",
            }}
          >
            <button onClick={() => setSelectedImage(null)} style={{
              position: "absolute", top: 12, right: 12, background: "transparent",
              border: "none", color: "var(--muted)", fontSize: "1.2rem", cursor: "pointer",
            }}>×</button>

            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem" }}>
              {selectedImage.image_name}
            </h2>

            {/* Blurred preview in modal */}
            {selectedImage.image_data && (
              <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", marginBottom: "1rem", height: 200 }}>
                <img
                  src={`data:image/jpeg;base64,${selectedImage.image_data}`}
                  alt={selectedImage.image_name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(8px)", transform: "scale(1.1)" }}
                />
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", gap: "0.5rem",
                }}>
                  <span style={{ fontSize: "1.5rem" }}>🔒</span>
                  <span style={{ color: "var(--cyan)", fontWeight: 600, fontSize: "0.9rem" }}>
                    Pay {atomicToUSD(selectedImage.price)} BSA USD to unlock
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", background: "rgba(34, 197, 94, 0.06)", border: "1px solid rgba(34, 197, 94, 0.15)", borderRadius: 8 }}>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Price</span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>{atomicToUSD(selectedImage.price)} BSA USD</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Owner</span>
                <span style={{ fontSize: "0.85rem" }}>{selectedImage.owner_ID}</span>
              </div>
              <div>
                <span style={{ color: "var(--muted)", fontSize: "0.85rem", display: "block", marginBottom: "0.4rem" }}>Tags</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {selectedImage.attributs_image.map((tag) => (
                    <span key={tag} style={{
                      background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.25)",
                      color: "var(--cyan)", borderRadius: 4, padding: "0.15rem 0.5rem", fontSize: "0.78rem",
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleDownload(selectedImage.id)}
                style={{
                  marginTop: "0.5rem",
                  background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                  color: "white", border: "none", borderRadius: 8, padding: "0.75rem",
                  fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                }}
              >
                💳 Pay & Download (x402)
              </button>

              {downloadStatus && (
                <div style={{
                  padding: "0.6rem 0.8rem", borderRadius: 8, fontSize: "0.8rem",
                  background: downloadStatus.startsWith("402") ? "rgba(6, 182, 212, 0.07)" : downloadStatus.includes("✅") ? "rgba(34, 197, 94, 0.07)" : "rgba(239, 68, 68, 0.07)",
                  border: `1px solid ${downloadStatus.startsWith("402") ? "rgba(6, 182, 212, 0.25)" : downloadStatus.includes("✅") ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"}`,
                  color: downloadStatus.startsWith("402") ? "var(--cyan)" : downloadStatus.includes("✅") ? "var(--success)" : "var(--error)",
                }}>
                  {downloadStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer>
        <p>Built by <a href="https://github.com/bsaepfl" target="_blank" rel="noopener noreferrer">BSA</a> — Image Marketplace on TON Testnet</p>
      </footer>
    </>
  );
}