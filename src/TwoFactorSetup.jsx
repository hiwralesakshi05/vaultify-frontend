import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function TwoFactorSetup({ onClose }) {
  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  async function handleStartSetup() {
    setError("");
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/2fa/setup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      setQrCode(data.qrCode);
    } catch (err) {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      setIsEnabled(true);
    } catch (err) {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isEnabled) {
    return (
      <div>
        <p className="vault-status">✅ Two-factor authentication is now enabled.</p>
        <button className="vault-button" style={{ marginTop: "16px" }} onClick={onClose}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="vault-hint" style={{ marginBottom: "16px" }}>
        Add a second layer of protection — a 6-digit code from an authenticator app (like Google Authenticator or Authy), required on every login.
      </p>

      {!qrCode ? (
        <button className="vault-button" onClick={handleStartSetup} disabled={isLoading}>
          {isLoading ? "Generating…" : "Set Up 2FA"}
        </button>
      ) : (
        <form onSubmit={handleVerify}>
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <img src={qrCode} alt="2FA QR code" style={{ width: "180px", height: "180px" }} />
            <p className="vault-hint">Scan this with your authenticator app</p>
          </div>

          <div className="vault-field">
            <label className="vault-label" htmlFor="verify-code">Enter the 6-digit code</label>
            <input
              id="verify-code"
              type="text"
              className="vault-input mono"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              autoFocus
            />
          </div>

          {error && <div className="vault-error">⚠ {error}</div>}

          <div className="vault-form-actions">
            <button type="button" className="vault-button-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="vault-button" disabled={isLoading}>
              {isLoading ? "Verifying…" : "Confirm"}
            </button>
          </div>
        </form>
      )}

      {error && !qrCode && <div className="vault-error">⚠ {error}</div>}
    </div>
  );
}

export default TwoFactorSetup;