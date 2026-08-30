import { useState } from "react";

function LoginForm({ onLoginSuccess, initialUsername = "" }) {
  const [username, setUsername] = useState(initialUsername);
  const [authKey, setAuthKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, authKey }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      onLoginSuccess();
    } catch (err) {
      setError("Could not reach the server. Is it running?");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <div className="vault-field">
        <label className="vault-label" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          className="vault-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="vault-field">
        <label className="vault-label" htmlFor="authKey">Auth Key</label>
        <input
          id="authKey"
          type="password"
          className="vault-input mono"
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
          autoComplete="current-password"
        />
        <p className="vault-hint">Temporary placeholder — real PBKDF2 derivation arrives when crypto.js is wired in.</p>
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

      <button type="submit" className="vault-button" disabled={isLoading}>
        {isLoading ? "Unlocking…" : "Unlock Vault"}
      </button>
    </form>
  );
}

export default LoginForm;