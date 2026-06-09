import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

const PRESETS = [
  { label: "5m", seconds: 300 },
  { label: "30m", seconds: 1800 },
  { label: "1h", seconds: 3600 },
  { label: "6h", seconds: 21600 },
  { label: "24h", seconds: 86400 },
  { label: "Custom", seconds: -1 },
] as const;

function formatExpiry(expiresAt: string): string {
  const d = new Date(expiresAt);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  );
}

export default function CreatePage() {
  const [content, setContent] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number>(3600);
  const [customMinutes, setCustomMinutes] = useState<string>("60");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function getTTLSeconds(): number {
    if (isCustom) {
      const mins = parseInt(customMinutes, 10);
      if (isNaN(mins) || mins < 1) return 60;
      if (mins > 1440) return 86400;
      return mins * 60;
    }
    return selectedPreset;
  }

  async function handleSubmit() {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/pastes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, ttl_seconds: getTTLSeconds() }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text.trim() || "Failed to create paste");
        return;
      }

      const data = await res.json();
      setResult({ url: data.url, expiresAt: data.expires_at });
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <textarea
        className="textarea"
        placeholder="Paste anything..."
        value={content}
        onChange={e => setContent(e.target.value)}
        spellCheck={false}
      />

      <div className="ttl-section">
        <div className="ttl-label">Expires in</div>
        <div className="ttl-presets">
          {PRESETS.map(p => {
            const active = p.seconds === -1 ? isCustom : (!isCustom && selectedPreset === p.seconds);
            return (
              <button
                key={p.label}
                className={`ttl-pill${active ? " active" : ""}`}
                onClick={() => {
                  if (p.seconds === -1) {
                    setIsCustom(true);
                  } else {
                    setIsCustom(false);
                    setSelectedPreset(p.seconds);
                  }
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {isCustom && (
          <div className="ttl-custom-input">
            <input
              type="number"
              min={1}
              max={1440}
              value={customMinutes}
              onChange={e => setCustomMinutes(e.target.value)}
              placeholder="60"
            />
            <span>minutes (1–1440)</span>
          </div>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading || !content.trim()}
      >
        {loading ? "Generating…" : "Generate Link"}
      </button>

      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div className="result-box">
          <div className="result-box-label">Link ready</div>
          <div className="result-url-row">
            <span className="result-url">{result.url}</span>
            <button className="btn-secondary" onClick={handleCopy}>
              <ClipboardIcon />
              {copied ? <span className="copied-feedback">Copied!</span> : "Copy"}
            </button>
          </div>
          <div className="result-meta">Expires {formatExpiry(result.expiresAt)}</div>
        </div>
      )}
    </>
  );
}
