"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setSuccess("Check your email to confirm your account, then log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    color: "#e0e0e0",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#0a0e14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 900,
              color: "#f0f0f0",
              letterSpacing: -1.5,
              display: "inline-flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            <span>Brief</span>
            <span
              style={{
                display: "inline-block",
                width: 3,
                height: 30,
                background: "linear-gradient(180deg, #4ade80, #2dd4bf)",
                margin: "0 4px",
                borderRadius: 1,
                transform: "rotate(12deg)",
              }}
            />
            <span>Case</span>
          </h1>
          <div
            style={{
              fontSize: 10,
              color: "#555",
              letterSpacing: 2.5,
              textTransform: "uppercase",
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            Be briefed. Be ready.
          </div>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16,
            padding: 28,
          }}
        >
          <h2
            style={{
              margin: "0 0 24px",
              fontSize: 20,
              fontWeight: 800,
              color: "#f0f0f0",
              textAlign: "center",
            }}
          >
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#666",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#666",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#666",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={inputStyle}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  color: "#f87171",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.2)",
                  color: "#4ade80",
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 20px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #1a5c2e, #2d8a4e)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.15s",
              }}
            >
              {loading
                ? "..."
                : isSignUp
                ? "Create Account"
                : "Log In"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#4ade80",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {isSignUp
                ? "Already have an account? Log in"
                : "Need an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
