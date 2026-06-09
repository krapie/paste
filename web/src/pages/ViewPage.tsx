import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

interface PasteData {
  id: string;
  content: string;
  created_at: string;
  expires_at: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Expired";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ClipboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

export default function ViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [paste, setPaste] = useState<PasteData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "not-found" | "expired">("loading");
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${API_URL}/pastes/${id}`)
      .then(res => {
        if (res.status === 404) {
          setStatus("not-found");
          return null;
        }
        if (!res.ok) throw new Error("fetch failed");
        return res.json();
      })
      .then((data: PasteData | null) => {
        if (!data) return;
        const expiresAt = new Date(data.expires_at).getTime();
        if (Date.now() >= expiresAt) {
          setStatus("expired");
          return;
        }
        setPaste(data);
        setStatus("ok");

        timerRef.current = setInterval(() => {
          const remaining = expiresAt - Date.now();
          if (remaining <= 0) {
            setStatus("expired");
            clearInterval(timerRef.current!);
          } else {
            setCountdown(formatCountdown(remaining));
          }
        }, 1000);
        setCountdown(formatCountdown(expiresAt - Date.now()));
      })
      .catch(() => setStatus("not-found"));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  async function handleCopy() {
    if (!paste) return;
    await navigator.clipboard.writeText(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "loading") {
    return <div className="state-message"><span>Loading…</span></div>;
  }

  if (status === "not-found") {
    return (
      <div className="state-message">
        <strong>Paste not found</strong>
        <span>This paste doesn't exist or has already expired.</span>
        <button className="new-paste-link" onClick={() => navigate("/")}>Create a new paste</button>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="state-message">
        <strong>This paste has expired</strong>
        <span>The link is no longer valid.</span>
        <button className="new-paste-link" onClick={() => navigate("/")}>Create a new paste</button>
      </div>
    );
  }

  return (
    <>
      <div className="view-header">
        <div className="expiry-badge">
          <ClockIcon />
          {countdown} remaining
        </div>
        <button className="btn-secondary" onClick={handleCopy}>
          <ClipboardIcon />
          {copied ? <span style={{ color: "var(--kp-success)" }}>Copied!</span> : "Copy to Clipboard"}
        </button>
      </div>

      <textarea
        className="textarea"
        value={paste?.content ?? ""}
        readOnly
        spellCheck={false}
        style={{ minHeight: "400px" }}
      />
    </>
  );
}
