import { useState } from "react";

function RegisterForm({ onRegisterSuccess }) {
  const [username, setUsername] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [confirmAuthKey, setConfirmAuthKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    // Simple client-side check before even bothering the server —
    // catches typos immediately instead of a round trip.
    if (authKey !== confirmAuthKey) {
      setError("Auth keys don't match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, authKey }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      // Registered successfully — hand the username back so the
      // login screen can be pre-filled, saving the user retyping it.
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
        <label className="vault-label" htmlFor="reg-authKey">Auth Key</label>
        <input
          id="reg-authKey"
          type="password"
          className="vault-input mono"
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <div className="vault-field">
        <label className="vault-label" htmlFor="reg-confirm">Confirm Auth Key</label>
        <input
          id="reg-confirm"
          type="password"
          className="vault-input mono"
          value={confirmAuthKey}
          onChange={(e) => setConfirmAuthKey(e.target.value)}
          autoComplete="new-password"
        />
        <p className="vault-hint">Temporary placeholder — real PBKDF2 derivation arrives when crypto.js is wired in.</p>
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

      <button type="submit" className="vault-button" disabled={isLoading}>
        {isLoading ? "Creating…" : "Create Vault"}
      </button>
    </form>
  );
}

export default RegisterForm;