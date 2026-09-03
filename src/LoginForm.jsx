import { useState } from "react";
import { hexToSalt, deriveAuthKey, deriveKeyFromPassword } from "./crypto";

function LoginForm({ onLoginSuccess, initialUsername = "" }) {
  const [username, setUsername] = useState(initialUsername);
  const [masterPassword, setMasterPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Kept between the first and second submit, so we don't have to
  // re-derive the Auth Key when the user enters their 2FA code.
  const [pendingAuthKey, setPendingAuthKey] = useState(null);
  const [pendingEncryptionKey, setPendingEncryptionKey] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      let authKey = pendingAuthKey;
      let encryptionKey = pendingEncryptionKey;

      // Only re-derive keys on the FIRST submit — on the 2FA step,
      // we already have them saved from a moment ago.
      if (!needsCode) {
        const saltResponse = await fetch(`http://localhost:3000/salt/${username}`);
        const saltData = await saltResponse.json();

        if (!saltData.success) {
          setError("Invalid credentials");
          return;
        }

        const salt = hexToSalt(saltData.salt);
        authKey = await deriveAuthKey(masterPassword, salt);
        encryptionKey = await deriveKeyFromPassword(masterPassword, salt);
      }

      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, authKey, code: needsCode ? code : undefined }),
      });

      const data = await response.json();

      if (data.requires2FA) {
        // Save the keys so we don't need the password again, show
        // the code field, and stop here.
        setPendingAuthKey(authKey);
        setPendingEncryptionKey(encryptionKey);
        setNeedsCode(true);
        return;
      }

      if (!data.success) {
        setError(data.message);
        return;
      }

      localStorage.setItem("token", data.token);
      onLoginSuccess(encryptionKey);
    } catch (err) {
      setError("Could not reach the server. Is it running?");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleLogin}>
      {!needsCode ? (
        <>
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
        </>
      ) : (
        <div className="vault-field">
          <label className="vault-label" htmlFor="code">2FA Code</label>
          <input
            id="code"
            type="text"
            className="vault-input mono"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            autoFocus
          />
          <p className="vault-hint">Enter the 6-digit code from your authenticator app.</p>
        </div>
      )}

      {error && <div className="vault-error">⚠ {error}</div>}

      <button type="submit" className="vault-button" disabled={isLoading}>
        {isLoading ? "Unlocking…" : needsCode ? "Verify Code" : "Unlock Vault"}
      </button>
    </form>
  );
}

export default LoginForm;