import { useState } from "react";
import { generateSalt, saltToHex, deriveAuthKey } from "./crypto";

function RegisterForm({ onRegisterSuccess }) {
  const [username, setUsername] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    if (masterPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsLoading(true);

    try {
      // Everything below happens LOCALLY, in the browser. The real
      // Master Password never gets sent anywhere past this point.
      const salt = generateSalt();
      const authKey = await deriveAuthKey(masterPassword, salt);

      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          authKey,
          salt: saltToHex(salt),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      onRegisterSuccess(username);
    } catch (err) {
      setError("Could not reach the server. Is it running?");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleRegister}>
      <div className="vault-field">
        <label className="vault-label" htmlFor="reg-username">Username</label>
        <input
          id="reg-username"
          type="text"
          className="vault-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="vault-field">
        <label className="vault-label" htmlFor="reg-password">Master Password</label>
        <input
          id="reg-password"
          type="password"
          className="vault-input mono"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <div className="vault-field">
        <label className="vault-label" htmlFor="reg-confirm">Confirm Master Password</label>
        <input
          id="reg-confirm"
          type="password"
          className="vault-input mono"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <p className="vault-hint">This password never leaves your browser. If you forget it, your vault cannot be recovered.</p>
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

      <button type="submit" className="vault-button" disabled={isLoading}>
        {isLoading ? "Creating…" : "Create Vault"}
      </button>
    </form>
  );
}

export default RegisterForm;