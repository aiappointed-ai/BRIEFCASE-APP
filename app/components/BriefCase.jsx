"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/useAuth";
import { useDatabase } from "../lib/useDatabase";
import { isSupabaseConfigured } from "../lib/supabase";

// ============ UTILITIES ============
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name) {
  const colors = [
    ["#1a5c2e", "#2d8a4e"], ["#1a3a5c", "#2d5a8a"], ["#5c1a3a", "#8a2d5a"],
    ["#4a3a1a", "#7a6a2d"], ["#1a4a5c", "#2d7a8a"], ["#3a1a5c", "#5a2d8a"],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ============ SHARED COMPONENTS ============
function Avatar({ name, photo, size = 80 }) {
  const colors = getAvatarColor(name || "?");
  if (photo) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.1)" }}>
        <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      fontSize: size * 0.35, fontWeight: 700, color: "rgba(255,255,255,0.9)",
      letterSpacing: 1, border: "2px solid rgba(255,255,255,0.08)",
    }}>
      {getInitials(name || "?")}
    </div>
  );
}

function JerseyAvatar({ number, color, size = 60 }) {
  const c = color || "#333";
  const isLight = (hex) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 140;
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: 12, background: c,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, position: "relative", border: "2px solid rgba(255,255,255,0.08)",
    }}>
      <div style={{
        position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
        width: size * 0.35, height: size * 0.12, borderRadius: "0 0 50% 50%", background: "rgba(0,0,0,0.2)",
      }} />
      <span style={{
        fontSize: size * 0.4, fontWeight: 900, color: isLight(c) ? "#111" : "#fff",
        marginTop: size * 0.06, textShadow: isLight(c) ? "none" : "0 1px 2px rgba(0,0,0,0.3)",
      }}>{number || "?"}</span>
    </div>
  );
}

function Tag({ children, color = "default" }) {
  const colors = {
    default: { bg: "rgba(255,255,255,0.06)", text: "#aaa", border: "rgba(255,255,255,0.08)" },
    green: { bg: "rgba(45,138,78,0.15)", text: "#4ade80", border: "rgba(45,138,78,0.3)" },
    blue: { bg: "rgba(45,90,138,0.15)", text: "#60a5fa", border: "rgba(45,90,138,0.3)" },
    amber: { bg: "rgba(180,130,30,0.15)", text: "#fbbf24", border: "rgba(180,130,30,0.3)" },
  };
  const s = colors[color] || colors.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      letterSpacing: 0.3, textTransform: "uppercase",
    }}>{children}</span>
  );
}

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: "#d4d4d4", lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, textarea, span }) {
  const s = {
    width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e0e0e0",
    fontSize: 14, fontFamily: "inherit", outline: "none", resize: textarea ? "vertical" : "none",
    minHeight: textarea ? 80 : "auto",
  };
  return (
    <div style={{ gridColumn: span === 2 ? "1 / -1" : undefined }}>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={s} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={s} />}
    </div>
  );
}

// ============ STYLES ============
const btnStyle = {
  padding: "10px 20px", borderRadius: 10, border: "none",
  background: "linear-gradient(135deg, #1a5c2e, #2d8a4e)", color: "#fff",
  fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.3,
};
const btnSmall = {
  padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)", color: "#aaa", fontSize: 12, fontWeight: 600,
  cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center",
};
const navBtn = {
  width: 44, height: 44, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)", color: "#ccc", fontSize: 24, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit",
};

// ============ AUTH SCREEN ============
function AuthScreen({ onSignIn, onSignUp }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (isSignUp) {
        await onSignUp(email, password, name);
      } else {
        await onSignIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e14", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            margin: 0, fontSize: 36, fontFamily: "'Inter', sans-serif", fontWeight: 900,
            color: "#f0f0f0", letterSpacing: -2, display: "inline-flex", alignItems: "center",
          }}>
            Brief
            <span style={{ display: "inline-block", width: 2.5, height: 30, background: "linear-gradient(180deg, #4ade80, #2dd4bf)", margin: "0 4px", borderRadius: 1, transform: "rotate(12deg)" }} />
            Case
          </h1>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 2.5, textTransform: "uppercase", marginTop: 6, fontWeight: 600 }}>Be briefed. Be ready.</div>
        </div>

        {/* Form */}
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", padding: 28 }}>
          <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>
            {isSignUp ? "Create Account" : "Sign In"}
          </h2>

          {isSignUp && (
            <div style={{ marginBottom: 12 }}>
              <FormField label="Full Name" value={name} onChange={setName} placeholder="Your name" />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <FormField label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <FormField label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
          </div>

          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            style={{ ...btnStyle, width: "100%", padding: "12px", opacity: loading || !email || !password ? 0.5 : 1 }}
          >
            {loading ? "..." : isSignUp ? "Create Account" : "Sign In"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              style={{ background: "none", border: "none", color: "#4ade80", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ COACH FORM ============
function CoachForm({ coach, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(coach || {
    name: "", photo: null, school: "", division: "", conference: "",
    record: "", position: "", signed_players: "", bio: "", notes: "", events: [],
  });
  const fileRef = useRef();
  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update("photo", ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f0f0f0" }}>{coach ? "Edit Coach" : "Add Coach"}</h2>
        <button onClick={onCancel} style={btnSmall}>Cancel</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <Avatar name={form.name || "New"} photo={form.photo} size={72} />
          <div>
            <button onClick={() => fileRef.current?.click()} style={btnSmall}>Upload Photo</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            {form.photo && <button onClick={() => update("photo", null)} style={{ ...btnSmall, color: "#f87171", marginLeft: 8 }}>Remove</button>}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Full Name *" value={form.name} onChange={(v) => update("name", v)} span={2} />
          <FormField label="School / University" value={form.school} onChange={(v) => update("school", v)} />
          <FormField label="Position / Title" value={form.position} onChange={(v) => update("position", v)} />
          <FormField label="Division" value={form.division} onChange={(v) => update("division", v)} placeholder="D1, D2, D3, NAIA" />
          <FormField label="Conference" value={form.conference} onChange={(v) => update("conference", v)} />
          <FormField label="Record" value={form.record} onChange={(v) => update("record", v)} placeholder="14-5-2" />
          <FormField label="Players Signed" value={form.signed_players || form.signedPlayers || ""} onChange={(v) => update("signed_players", v)} span={2} />
        </div>
        <div style={{ marginTop: 12 }}><FormField label="Coaching Bio" value={form.bio} onChange={(v) => update("bio", v)} textarea /></div>
        <div style={{ marginTop: 12 }}><FormField label="Notes & Conversation Starters" value={form.notes} onChange={(v) => update("notes", v)} textarea placeholder="Personal details, preferences, tips..." /></div>
      </div>
      <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim()} style={{ ...btnStyle, flex: 1, opacity: form.name.trim() ? 1 : 0.4 }}>
          {coach ? "Save Changes" : "Add Coach"}
        </button>
        {coach && onDelete && <button onClick={() => onDelete(coach.id)} style={{ ...btnStyle, background: "rgba(248,113,113,0.1)", color: "#f87171" }}>Delete</button>}
      </div>
    </div>
  );
}

// ============ PLAYER FORM (with duplicate detection + coach notes) ============
function PlayerForm({ player, events, onSave, onCancel, onDelete, onSaveNote, existingNote, allNotes, findDuplicate, isOnline, userName, userId }) {
  const [form, setForm] = useState(player || {
    name: "", jerseyNumber: "", jerseyColor: "#cc0000", jersey_number: "", jersey_color: "#cc0000",
    position: "", division: "", rating: "", notes: "", eventId: "", event_id: "",
  });
  const [myNote, setMyNote] = useState(existingNote?.notes || "");
  const [myRating, setMyRating] = useState(existingNote?.rating || "");
  const [noteSaved, setNoteSaved] = useState(false);
  const [duplicate, setDuplicate] = useState(null);

  const update = (f, v) => {
    setForm((p) => ({ ...p, [f]: v }));
    if ((f === "jerseyNumber" || f === "jersey_number" || f === "eventId" || f === "event_id") && findDuplicate) {
      const jn = f.includes("jersey") ? v : (form.jerseyNumber || form.jersey_number);
      const ev = f.includes("event") ? v : (form.eventId || form.event_id);
      if (jn && ev) {
        const dup = findDuplicate(jn, ev);
        setDuplicate(dup && dup.id !== player?.id ? dup : null);
      }
    }
  };

  const handleSaveNote = () => {
    if (onSaveNote) {
      onSaveNote(player.id, { rating: myRating, notes: myNote }, userName);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    }
  };

  const colorPresets = ["#cc0000", "#0055aa", "#ffffff", "#000000", "#006633", "#ff6600", "#660099", "#ffcc00", "#00aacc", "#cc0066"];
  const jerseyNum = form.jerseyNumber || form.jersey_number || "";
  const jerseyCol = form.jerseyColor || form.jersey_color || "#cc0000";
  const eventId = form.eventId || form.event_id || "";

  // Separate other coaches' notes from mine
  const otherNotes = (allNotes || []).filter(n => n.coach_user_id !== userId);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f0f0f0" }}>{player ? "Edit Player" : "Scout Player"}</h2>
        <button onClick={onCancel} style={btnSmall}>Cancel</button>
      </div>

      {duplicate && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 4 }}>Player already scouted!</div>
          <div style={{ fontSize: 12, color: "#aaa" }}>
            #{duplicate.jersey_number || duplicate.jerseyNumber} {duplicate.name} was already added to this event.
            {isOnline && " You can add your own notes on their profile instead."}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: "auto", paddingBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <JerseyAvatar number={jerseyNum} color={jerseyCol} size={80} />
          <div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Jersey Color</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {colorPresets.map((c) => (
                <button key={c} onClick={() => { update("jerseyColor", c); update("jersey_color", c); }}
                  style={{ width: 28, height: 28, borderRadius: 8, background: c, border: jerseyCol === c ? "2px solid #4ade80" : "2px solid rgba(255,255,255,0.1)", cursor: "pointer" }} />
              ))}
            </div>
            <input type="color" value={jerseyCol} onChange={(e) => { update("jerseyColor", e.target.value); update("jersey_color", e.target.value); }}
              style={{ marginTop: 8, width: 60, height: 28, border: "none", background: "none", cursor: "pointer" }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <FormField label="Player Name" value={form.name} onChange={(v) => update("name", v)} span={2} placeholder="Jordan Smith" />
          <FormField label="Jersey #" value={jerseyNum} onChange={(v) => { update("jerseyNumber", v); update("jersey_number", v); }} placeholder="10" />
          <FormField label="Position" value={form.position} onChange={(v) => update("position", v)} placeholder="CM, LW, GK" />
          <FormField label="Projected Division" value={form.division} onChange={(v) => update("division", v)} placeholder="D1, D2, NAIA" />
          <FormField label="Rating" value={form.rating} onChange={(v) => update("rating", v)} placeholder="A, B+, C" />
        </div>

        {events.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 }}>Scouted At Event</label>
            <select value={eventId} onChange={(e) => { update("eventId", e.target.value); update("event_id", e.target.value); }}
              style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e0e0e0", fontSize: 14, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
              <option value="">No event linked</option>
              {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
            </select>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <FormField label="General Scouting Notes" value={form.notes} onChange={(v) => update("notes", v)} textarea placeholder="Strengths, weaknesses, physical traits, technical ability..." />
        </div>

        {/* OTHER COACHES' NOTES — READ ONLY */}
        {isOnline && player && otherNotes.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
              Other Coaches' Assessments ({otherNotes.length})
            </div>
            {otherNotes.map((note) => (
              <div key={note.id} style={{
                padding: 14, marginBottom: 8, background: "rgba(255,255,255,0.02)",
                borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#d4d4d4" }}>
                    {note.coach_name || "Unknown Coach"}
                  </span>
                  {note.rating && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                      background: note.rating.startsWith("A") ? "rgba(74,222,128,0.15)" : note.rating.startsWith("B") ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.06)",
                      color: note.rating.startsWith("A") ? "#4ade80" : note.rating.startsWith("B") ? "#60a5fa" : "#888",
                    }}>
                      {note.rating}
                    </span>
                  )}
                </div>
                {note.notes && <div style={{ fontSize: 13, color: "#999", lineHeight: 1.5 }}>{note.notes}</div>}
                <div style={{ fontSize: 10, color: "#444", marginTop: 6 }}>
                  {note.updated_at ? new Date(note.updated_at).toLocaleDateString() : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* YOUR NOTES — EDITABLE */}
        {isOnline && player && (
          <div style={{ marginTop: 16, padding: 16, background: "rgba(96,165,250,0.05)", borderRadius: 12, border: "1px solid rgba(96,165,250,0.15)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
              Your Assessment
            </div>
            <FormField label="Your Rating" value={myRating} onChange={setMyRating} placeholder="e.g. A-, B+" />
            <div style={{ marginTop: 8 }}>
              <FormField label="Your Notes" value={myNote} onChange={setMyNote} textarea placeholder="Your personal observations..." />
            </div>
            <button onClick={handleSaveNote}
              style={{ ...btnSmall, marginTop: 10, color: noteSaved ? "#4ade80" : "#60a5fa", background: noteSaved ? "rgba(74,222,128,0.1)" : "rgba(96,165,250,0.1)", border: `1px solid ${noteSaved ? "rgba(74,222,128,0.2)" : "rgba(96,165,250,0.2)"}` }}>
              {noteSaved ? "Saved ✓" : existingNote ? "Update My Notes" : "Save My Notes"}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => form.name.trim() && onSave(form)} disabled={!form.name.trim() || !!duplicate}
          style={{ ...btnStyle, flex: 1, background: "linear-gradient(135deg, #0055aa, #2d6a8a)", opacity: form.name.trim() && !duplicate ? 1 : 0.4 }}>
          {player ? "Save Changes" : "Add Player"}
        </button>
        {player && onDelete && <button onClick={() => onDelete(player.id)} style={{ ...btnStyle, background: "rgba(248,113,113,0.1)", color: "#f87171" }}>Delete</button>}
      </div>
    </div>
  );
}

// ============ COACH ROW ============
function CoachRow({ coach, action, onAction, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", marginBottom: 4,
      borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
      cursor: onClick ? "pointer" : "default", transition: "background 0.15s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}>
      <Avatar name={coach.name} photo={coach.photo} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coach.name}</div>
        <div style={{ fontSize: 12, color: "#666" }}>{coach.school} {coach.division && `· ${coach.division}`}</div>
      </div>
      {action && (
        <button onClick={(e) => { e.stopPropagation(); onAction(); }}
          style={{ ...btnSmall, fontSize: 18, padding: "2px 10px", color: action === "add" ? "#4ade80" : "#f87171", background: action === "add" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)" }}>
          {action === "add" ? "+" : "−"}
        </button>
      )}
    </div>
  );
}

// ============ PLAYER ROW ============
function PlayerRow({ player, onClick, event }) {
  const jn = player.jerseyNumber || player.jersey_number;
  const jc = player.jerseyColor || player.jersey_color || "#cc0000";
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", marginBottom: 4,
      borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
      cursor: "pointer", transition: "background 0.15s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}>
      <JerseyAvatar number={jn} color={jc} size={44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e0e0e0" }}>{player.name}</span>
          {player.rating && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 6,
              background: player.rating.startsWith("A") ? "rgba(74,222,128,0.15)" : player.rating.startsWith("B") ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.06)",
              color: player.rating.startsWith("A") ? "#4ade80" : player.rating.startsWith("B") ? "#60a5fa" : "#888",
            }}>{player.rating}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#666" }}>
          {player.position}{player.division && ` · ${player.division}`}{event && ` · ${event.name}`}
        </div>
      </div>
    </div>
  );
}

// ============ SWIPE PREP CARD ============
function SwipeCard({ coach, onSwipe, onPrev, index, total, hasPrev }) {
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [exiting, setExiting] = useState(null);
  const startX = useRef(0);

  const handleStart = (x) => { startX.current = x; setSwiping(true); };
  const handleMove = (x) => { if (swiping) setOffset(x - startX.current); };
  const handleEnd = () => {
    setSwiping(false);
    if (Math.abs(offset) > 100) {
      setExiting(offset > 0 ? "right" : "left");
      setTimeout(() => { offset > 0 && hasPrev ? onPrev() : onSwipe(); setExiting(null); setOffset(0); }, 250);
    } else setOffset(0);
  };

  const transform = exiting
    ? `translateX(${exiting === "right" ? 400 : -400}px) rotate(${exiting === "right" ? 15 : -15}deg)`
    : `translateX(${offset}px) rotate(${offset * 0.04}deg)`;

  return (
    <div style={{ transition: swiping ? "none" : "transform 0.3s", transform, opacity: exiting ? 0 : 1, cursor: "grab", userSelect: "none" }}
      onMouseDown={(e) => handleStart(e.clientX)} onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd} onMouseLeave={() => swiping && handleEnd()}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)} onTouchMove={(e) => handleMove(e.touches[0].clientX)} onTouchEnd={handleEnd}>
      <div style={{ background: "linear-gradient(165deg, #1a1f2e 0%, #0d1117 50%, #0a0e14 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "28px 28px 20px", display: "flex", alignItems: "center", gap: 20, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Avatar name={coach.name} photo={coach.photo} size={90} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#f0f0f0", letterSpacing: -0.5, marginBottom: 4 }}>{coach.name}</div>
            <div style={{ fontSize: 14, color: "#8b949e", marginBottom: 8 }}>{coach.position} — {coach.school}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {coach.division && <Tag color="green">{coach.division}</Tag>}
              {coach.conference && <Tag color="blue">{coach.conference}</Tag>}
              {coach.record && <Tag color="amber">Record: {coach.record}</Tag>}
            </div>
          </div>
        </div>
        <div style={{ padding: "20px 28px" }}>
          <InfoRow label="Coaching Bio" value={coach.bio} />
          <InfoRow label="Players Signed" value={coach.signed_players || coach.signedPlayers} />
          {coach.notes && (
            <div style={{ marginTop: 8, padding: 16, background: "rgba(251,191,36,0.05)", borderRadius: 12, border: "1px solid rgba(251,191,36,0.15)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#fbbf24", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Your Notes</div>
              <div style={{ fontSize: 14, color: "#d4d4d4", lineHeight: 1.6 }}>{coach.notes}</div>
            </div>
          )}
        </div>
        <div style={{ padding: "14px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#555" }}>{index + 1} of {total}</span>
          <span style={{ fontSize: 12, color: "#555" }}>← Swipe or tap arrow →</span>
        </div>
      </div>
    </div>
  );
}

// ============ PREP MODE ============
function PrepMode({ coaches, onExit }) {
  const [idx, setIdx] = useState(0);
  if (!coaches.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16 }}>
      <div style={{ fontSize: 48 }}>📋</div>
      <div style={{ fontSize: 18, color: "#888" }}>No coaches assigned</div>
      <button onClick={onExit} style={btnStyle}>Go Back</button>
    </div>
  );
  const done = idx >= coaches.length;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 16px" }}>
        <button onClick={onExit} style={{ ...btnSmall, gap: 6 }}>← Back</button>
        <div style={{ fontSize: 13, color: "#666" }}>{done ? "Complete!" : `${idx + 1} / ${coaches.length}`}</div>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginBottom: 16 }}>
        <div style={{ height: "100%", width: `${((done ? coaches.length : idx) / coaches.length) * 100}%`, background: "linear-gradient(90deg, #2d8a4e, #4ade80)", borderRadius: 2, transition: "width 0.3s" }} />
      </div>
      {done ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 16 }}>
          <div style={{ fontSize: 64 }}>🏆</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#f0f0f0" }}>You're Prepped!</div>
          <div style={{ fontSize: 14, color: "#888", textAlign: "center", maxWidth: 300 }}>You reviewed {coaches.length} coach{coaches.length > 1 ? "es" : ""}.</div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => setIdx(0)} style={btnStyle}>Review Again</button>
            <button onClick={onExit} style={{ ...btnStyle, background: "rgba(255,255,255,0.06)", color: "#aaa" }}>Done</button>
          </div>
        </div>
      ) : (
        <>
          <SwipeCard key={coaches[idx].id} coach={coaches[idx]} onSwipe={() => setIdx(i => i + 1)} onPrev={() => setIdx(i => Math.max(0, i - 1))} hasPrev={idx > 0} index={idx} total={coaches.length} />
          <div style={{ display: "flex", justifyContent: "center", gap: 16, paddingTop: 16 }}>
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} style={{ ...navBtn, opacity: idx === 0 ? 0.3 : 1 }}>‹</button>
            <button onClick={() => setIdx(i => i + 1)} style={navBtn}>›</button>
          </div>
        </>
      )}
    </div>
  );
}

// ============ EVENT FORM ============
function EventForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  return (
    <div style={{ padding: 24 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>New Showcase / Event</h3>
      <FormField label="Event Name" value={name} onChange={setName} placeholder="Phoenix Showcase 2026" />
      <div style={{ marginTop: 12 }}><FormField label="Date" value={date} onChange={setDate} placeholder="Feb 15, 2026" /></div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={() => name.trim() && onSave({ name: name.trim(), date })} disabled={!name.trim()} style={{ ...btnStyle, flex: 1, opacity: name.trim() ? 1 : 0.4 }}>Create Event</button>
        <button onClick={onCancel} style={{ ...btnStyle, background: "rgba(255,255,255,0.06)", color: "#aaa" }}>Cancel</button>
      </div>
    </div>
  );
}

// ============ COACH SELECTOR ============
function CoachSelector({ coaches, event, onToggle, onClose }) {
  const assigned = coaches.filter(c => (c.events || c.event_ids || []).includes(event.id));
  const unassigned = coaches.filter(c => !(c.events || c.event_ids || []).includes(event.id));
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#f0f0f0" }}>{event.name}</h3>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{event.date}</div>
        </div>
        <button onClick={onClose} style={btnSmall}>Done</button>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Attending ({assigned.length})</div>
      {assigned.length === 0 && <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>No coaches assigned yet</div>}
      {assigned.map(c => <CoachRow key={c.id} coach={c} action="remove" onAction={() => onToggle(c.id, event.id)} />)}
      <div style={{ fontSize: 10, fontWeight: 700, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 16, marginBottom: 8 }}>All Coaches ({unassigned.length})</div>
      {unassigned.map(c => <CoachRow key={c.id} coach={c} action="add" onAction={() => onToggle(c.id, event.id)} />)}
    </div>
  );
}

// ============ MAIN APP ============
export default function BriefCase() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const online = isSupabaseConfigured();
  const db = useDatabase(user?.id);

  const [mode, setMode] = useState("coaches");
  const [view, setView] = useState("roster");
  const [editingCoach, setEditingCoach] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [activeEvent, setActiveEvent] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDiv, setFilterDiv] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");

  // Show auth screen if Supabase is configured but not logged in
  if (online && authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0e14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#555", fontSize: 16 }}>Loading...</div>
      </div>
    );
  }

  if (online && !user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  const { coaches, events, players, saveCoach, deleteCoach: dbDeleteCoach, saveEvent, deleteEvent: dbDeleteEvent, toggleCoachEvent, savePlayer, deletePlayer: dbDeletePlayer, saveCoachNote, getMyNoteForPlayer, getAllNotesForPlayer, findDuplicatePlayer } = db;

  const filtered = coaches
    .filter(c => {
      const q = search.toLowerCase();
      const ms = !q || c.name?.toLowerCase().includes(q) || c.school?.toLowerCase().includes(q) || c.conference?.toLowerCase().includes(q);
      const md = !filterDiv || c.division === filterDiv;
      return ms && md;
    })
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const divisions = [...new Set(coaches.map(c => c.division).filter(Boolean))];

  const prepCoaches = activeEvent
    ? coaches.filter(c => (c.events || c.event_ids || []).includes(activeEvent.id)).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const filteredPlayers = players
    .filter(p => {
      const q = playerSearch.toLowerCase();
      return !q || p.name?.toLowerCase().includes(q) || p.position?.toLowerCase().includes(q) || (p.jersey_number || p.jerseyNumber || "").includes(q);
    })
    .sort((a, b) => ((b.created_at || b.createdAt || "").localeCompare(a.created_at || a.createdAt || "")));

  const handleSaveCoach = (data) => { saveCoach(data); setEditingCoach(null); setView("roster"); };
  const handleDeleteCoach = (id) => { dbDeleteCoach(id); setEditingCoach(null); setView("roster"); };
  const handleSaveEvent = (data) => { saveEvent(data); setView("roster"); };
  const handleDeleteEvent = (id) => { dbDeleteEvent(id); setActiveEvent(null); setView("roster"); };
  const handleSavePlayer = (data) => { savePlayer(data); setEditingPlayer(null); setView("player-list"); };
  const handleDeletePlayer = (id) => { dbDeletePlayer(id); setEditingPlayer(null); setView("player-list"); };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#0a0e14", color: "#e0e0e0", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Inter:wght@800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <div style={{ padding: "24px 0 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 30, fontFamily: "'Inter', sans-serif", fontWeight: 900, color: "#f0f0f0", letterSpacing: -1.5, display: "flex", alignItems: "center" }}>
                Brief
                <span style={{ display: "inline-block", width: 2, height: 26, background: "linear-gradient(180deg, #4ade80, #2dd4bf)", margin: "0 3px", borderRadius: 1, transform: "rotate(12deg)" }} />
                Case
              </h1>
              <div style={{ fontSize: 10, color: "#555", letterSpacing: 2.5, textTransform: "uppercase", marginTop: 4, fontWeight: 600 }}>Be briefed. Be ready.</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {online && user && (
                <button onClick={signOut} style={{ ...btnSmall, fontSize: 10, padding: "4px 10px" }}>Sign Out</button>
              )}
              <button onClick={() => {
                if (mode === "coaches") { setEditingCoach(null); setView("form"); }
                else { setEditingPlayer(null); setView("player-form"); }
              }} style={mode === "coaches" ? btnStyle : { ...btnStyle, background: "linear-gradient(135deg, #0055aa, #2d6a8a)" }}>
                {mode === "coaches" ? "+ Coach" : "+ Player"}
              </button>
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 4, marginTop: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 3 }}>
            <button onClick={() => { setMode("coaches"); setView("roster"); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === "coaches" ? "rgba(74,222,128,0.12)" : "transparent", color: mode === "coaches" ? "#4ade80" : "#555", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 }}>
              Coach Prep
            </button>
            <button onClick={() => { setMode("recruit"); setView("player-list"); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === "recruit" ? "rgba(96,165,250,0.12)" : "transparent", color: mode === "recruit" ? "#60a5fa" : "#555", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 }}>
              Recruitment
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, paddingTop: 16, paddingBottom: 24 }}>

          {db.loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#555" }}>Loading data...</div>
          )}

          {/* ROSTER */}
          {!db.loading && view === "roster" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search coaches..."
                  style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e0e0e0", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                {divisions.length > 0 && (
                  <select value={filterDiv} onChange={(e) => setFilterDiv(e.target.value)}
                    style={{ padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#aaa", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                    <option value="">All Divs</option>
                    {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
              </div>

              {/* Events */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: 1.5, textTransform: "uppercase" }}>Showcase Events</div>
                  <button onClick={() => setView("event-form")} style={{ ...btnSmall, fontSize: 11 }}>+ Event</button>
                </div>
                {events.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#444", padding: "8px 0" }}>No events yet</div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {events.map(evt => {
                      const count = coaches.filter(c => (c.events || c.event_ids || []).includes(evt.id)).length;
                      return (
                        <div key={evt.id} style={{ padding: "10px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, flex: "1 1 200px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#d4d4d4" }}>{evt.name}</div>
                            <div style={{ fontSize: 11, color: "#555" }}>{evt.date} · {count} coach{count !== 1 ? "es" : ""}</div>
                          </div>
                          <button onClick={() => { setActiveEvent(evt); setView("event-select"); }} style={{ ...btnSmall, fontSize: 11 }}>Edit</button>
                          <button onClick={() => { setActiveEvent(evt); setView("prep"); }}
                            style={{ ...btnSmall, background: count > 0 ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: count > 0 ? "#4ade80" : "#555", border: count > 0 ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(255,255,255,0.06)", fontSize: 11 }}>
                            Prep ▶
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Coach Roster ({filtered.length})</div>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>
                  <div style={{ fontSize: 14, color: "#555" }}>{search ? "No matches" : "No coaches added yet"}</div>
                </div>
              ) : filtered.map(c => (
                <CoachRow key={c.id} coach={c} onClick={() => { setEditingCoach(c); setView("form"); }} />
              ))}
            </>
          )}

          {/* COACH FORM */}
          {view === "form" && <CoachForm coach={editingCoach} onSave={handleSaveCoach} onCancel={() => { setEditingCoach(null); setView("roster"); }} onDelete={editingCoach ? handleDeleteCoach : null} />}

          {/* EVENT FORM */}
          {view === "event-form" && <EventForm onSave={handleSaveEvent} onCancel={() => setView("roster")} />}

          {/* EVENT SELECTOR */}
          {view === "event-select" && activeEvent && (
            <>
              <CoachSelector coaches={coaches} event={activeEvent} onToggle={toggleCoachEvent} onClose={() => setView("roster")} />
              <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => { setActiveEvent(activeEvent); setView("prep"); }} style={{ ...btnStyle, flex: 1 }}>Start Prep Mode ▶</button>
                <button onClick={() => handleDeleteEvent(activeEvent.id)} style={{ ...btnStyle, background: "rgba(248,113,113,0.1)", color: "#f87171" }}>Delete Event</button>
              </div>
            </>
          )}

          {/* PREP MODE */}
          {view === "prep" && <PrepMode coaches={prepCoaches} onExit={() => setView("roster")} />}

          {/* PLAYER LIST */}
          {!db.loading && view === "player-list" && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input value={playerSearch} onChange={(e) => setPlayerSearch(e.target.value)} placeholder="Search players..."
                  style={{ flex: 1, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "#e0e0e0", fontSize: 14, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#60a5fa", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>Scouted Players ({filteredPlayers.length})</div>
              {filteredPlayers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "50px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>⚽</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#e0e0e0", marginBottom: 6 }}>No players scouted yet</div>
                  <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>Tap "+ Player" to scout athletes</div>
                  <button onClick={() => { setEditingPlayer(null); setView("player-form"); }}
                    style={{ ...btnStyle, background: "linear-gradient(135deg, #0055aa, #2d6a8a)" }}>Scout First Player</button>
                </div>
              ) : filteredPlayers.map(p => (
                <PlayerRow key={p.id} player={p} event={events.find(e => e.id === (p.event_id || p.eventId))}
                  onClick={() => { setEditingPlayer(p); setView("player-form"); }} />
              ))}
            </>
          )}

          {/* PLAYER FORM */}
          {view === "player-form" && (
            <PlayerForm
              player={editingPlayer}
              events={events}
              onSave={handleSavePlayer}
              onCancel={() => { setEditingPlayer(null); setView("player-list"); }}
              onDelete={editingPlayer ? handleDeletePlayer : null}
              onSaveNote={saveCoachNote}
              existingNote={editingPlayer ? getMyNoteForPlayer(editingPlayer.id) : null}
              allNotes={editingPlayer ? getAllNotesForPlayer(editingPlayer.id) : []}
              userName={user?.user_metadata?.full_name || user?.email || "Unknown"}
              userId={user?.id}
              findDuplicate={findDuplicatePlayer}
              isOnline={online && !!user}
            />
          )}
        </div>
      </div>
    </div>
  );
}
