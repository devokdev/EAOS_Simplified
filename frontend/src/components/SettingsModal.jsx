import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useToast } from "./ToastProvider";
import { Icon } from "./ui";

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */

function PasswordField({ id, label, placeholder, value, onChange, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="settings-field">
      <label className="settings-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-password-wrap">
        <input
          id={id}
          className="input settings-input"
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="reveal-btn"
          aria-label={show ? "Hide" : "Show"}
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
        >
          <Icon name={show ? "eye" : "moon"} className="icon-small" />
        </button>
      </div>
      {hint && <p className="settings-hint">{hint}</p>}
    </div>
  );
}

function TextField({ id, label, placeholder, value, onChange, hint }) {
  return (
    <div className="settings-field">
      <label className="settings-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input settings-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {hint && <p className="settings-hint">{hint}</p>}
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */

export function SettingsModal({ open, onClose }) {
  const { pushToast } = useToast();
  const overlayRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(null);

  // form state
  const [gmailUser, setGmailUser] = useState("");
  const [gmailPassword, setGmailPassword] = useState("");
  const [geminiKey1, setGeminiKey1] = useState("");
  const [geminiKey2, setGeminiKey2] = useState("");

  /* fetch current config when modal opens */
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api("/api/settings")
      .then((data) => {
        setCurrent(data);
        setGmailUser(data.gmail_user || "");
        setGmailPassword("");
        setGeminiKey1("");
        setGeminiKey2("");
      })
      .catch(() => pushToast("Failed to load settings", "error"))
      .finally(() => setLoading(false));
  }, [open, pushToast]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* close on overlay click */
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "POST",
        body: JSON.stringify({
          gmail_user: gmailUser,
          gmail_app_password: gmailPassword,
          gemini_key_1: geminiKey1,
          gemini_key_2: geminiKey2,
        }),
      });
      pushToast("Settings saved & applied ✓", "success");
      onClose();
    } catch (err) {
      pushToast(err.message || "Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="settings-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="settings-modal">
        {/* ── Header ── */}
        <div className="settings-modal-header">
          <div className="settings-modal-title-row">
            <div className="settings-modal-icon">
              <Icon name="settings" className="icon-medium" />
            </div>
            <div>
              <h2 className="settings-modal-title">Workspace Settings</h2>
              <p className="settings-modal-sub">
                Update credentials — changes apply instantly, no restart needed.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            aria-label="Close settings"
            onClick={onClose}
          >
            <Icon name="xmark" className="icon-small" />
          </button>
        </div>

        {/* ── Body ── */}
        {loading ? (
          <div className="settings-loader">
            <div className="loader-ring" />
            <span>Loading current settings…</span>
          </div>
        ) : (
          <form className="settings-body" onSubmit={handleSave} noValidate>
            {/* Gmail section */}
            <section className="settings-section">
              <div className="settings-section-header">
                <div className="settings-section-icon settings-icon-gmail">
                  <Icon name="mail" className="icon-small" />
                </div>
                <div>
                  <p className="settings-section-title">Gmail Account</p>
                  <p className="settings-section-desc">
                    Used as the sending address for all outbound emails.
                  </p>
                </div>
              </div>

              <div className="settings-fields">
                <TextField
                  id="s-gmail-user"
                  label="Gmail Address"
                  placeholder={current?.gmail_user || "you@gmail.com"}
                  value={gmailUser}
                  onChange={setGmailUser}
                  hint="Leave blank to keep current value"
                />
                <PasswordField
                  id="s-gmail-pass"
                  label="App Password"
                  placeholder={
                    current?.gmail_app_password_masked
                      ? `Current: ${current.gmail_app_password_masked}`
                      : "Google App Password"
                  }
                  value={gmailPassword}
                  onChange={setGmailPassword}
                  hint="Generate at myaccount.google.com → Security → App Passwords"
                />
              </div>
            </section>

            <div className="settings-divider" />

            {/* Gemini section */}
            <section className="settings-section">
              <div className="settings-section-header">
                <div className="settings-section-icon settings-icon-ai">
                  <Icon name="spark" className="icon-small" />
                </div>
                <div>
                  <p className="settings-section-title">Gemini API Keys</p>
                  <p className="settings-section-desc">
                    EAOS rotates between Key 1 and Key 2 for rate-limit resilience.
                  </p>
                </div>
              </div>

              <div className="settings-fields settings-fields-2col">
                <PasswordField
                  id="s-gemini-1"
                  label={
                    <>
                      Key 1{" "}
                      {current?.gemini_key_1_set && (
                        <span className="settings-badge settings-badge-ok">active</span>
                      )}
                    </>
                  }
                  placeholder={
                    current?.gemini_key_1_masked
                      ? `Current: ${current.gemini_key_1_masked}`
                      : "AIza…"
                  }
                  value={geminiKey1}
                  onChange={setGeminiKey1}
                  hint="Primary key"
                />
                <PasswordField
                  id="s-gemini-2"
                  label={
                    <>
                      Key 2{" "}
                      {current?.gemini_key_2_set && (
                        <span className="settings-badge settings-badge-ok">active</span>
                      )}
                    </>
                  }
                  placeholder={
                    current?.gemini_key_2_masked
                      ? `Current: ${current.gemini_key_2_masked}`
                      : "AIza…"
                  }
                  value={geminiKey2}
                  onChange={setGeminiKey2}
                  hint="Fallback / load-balance key"
                />
              </div>
            </section>

            {/* ── Footer ── */}
            <div className="settings-footer">
              <p className="settings-footer-note">
                <Icon name="check" className="icon-small" />
                Credentials are stored in <code>.env</code> on the server.
              </p>
              <div className="settings-footer-actions">
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`button button-primary ${saving ? "button-busy" : ""}`}
                  disabled={saving}
                >
                  <Icon name="check" className="button-icon" />
                  <span>{saving ? "Saving…" : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
