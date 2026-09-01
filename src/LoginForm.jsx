import { useState } from "react";
import { hexToSalt, deriveAuthKey, deriveKeyFromPassword } from "./crypto";

function LoginForm({ onLoginSuccess, initialUsername = "" }) {
  const [username, setUsername] = useState(initialUsername);
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: fetch this user's salt (public, not sensitive).
      const saltResponse = await fetch(`http://localhost:3000/salt/${username}`);
      const saltData = await saltResponse.json();

      if (!saltData.success) {
        setError("Invalid credentials");
        return;
      }

      const salt = hexToSalt(saltData.salt);

      // Step 2: derive both keys locally. The Master Password itself
      // never leaves this function.
      const authKey = await deriveAuthKey(masterPassword, salt);
      const encryptionKey = await deriveKeyFromPassword(masterPassword, salt);

      // Step 3: send only the Auth Key to the server for verification.
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

      // Hand the real Encryption Key up to App — it lives only in
      // memory (React state), never localStorage, never the server.
      onLoginSuccess(encryptionKey);
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
        <label className="vault-label" htmlFor="masterPassword">Master Password</label>
        <input
          id="masterPassword"
          type="password"
          className="vault-input mono"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

      <button type="submit" className="vault-button" disabled={isLoading}>
        {isLoading ? "Unlocking…" : "Unlock Vault"}
      </button>
    </form>
  );
}

export default LoginForm;