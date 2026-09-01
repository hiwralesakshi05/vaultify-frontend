import { useState } from "react";

// Cryptographically strong password generator — same crypto.getRandomValues
// API from crypto.js, not Math.random() (which isn't secure enough for this).
function generateStrongPassword(length = 16) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const randomValues = crypto.getRandomValues(new Uint32Array(length));

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  return password;
}

function AddPasswordForm({ existingEntries, onSaved, onCancel }) {
  const [site, setSite] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function handleGenerate() {
    setPassword(generateStrongPassword());
    setShowPassword(true); // show it right after generating, so it's visible
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    if (!site || !username || !password) {
      setError("All fields are required");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");

    // Add the new entry to whatever was already saved.
    const updatedEntries = [...existingEntries, { site, username, password }];

    try {
      const response = await fetch("http://localhost:3000/vault", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // NOTE: sent as plain JSON for now — real encryption before
        // this step is a planned follow-up (crypto.js + salt wiring).
        body: JSON.stringify({ blob: JSON.stringify(updatedEntries) }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      onSaved(updatedEntries); // hand the new full list back to Dashboard
    } catch (err) {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="vault-add-form">
      <div className="vault-field">
        <label className="vault-label" htmlFor="site">Site</label>
        <input
          id="site"
          type="text"
          className="vault-input"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          placeholder="gmail.com"
        />
      </div>

      <div className="vault-field">
        <label className="vault-label" htmlFor="entry-username">Username</label>
        <input
          id="entry-username"
          type="text"
          className="vault-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div className="vault-field">
        <label className="vault-label" htmlFor="entry-password">Password</label>
        <div className="vault-password-row">
          <input
            id="entry-password"
            type={showPassword ? "text" : "password"}
            className="vault-input mono"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="vault-button-small" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <button type="button" className="vault-link" onClick={handleGenerate}>
          Generate strong password
        </button>
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

      <div className="vault-form-actions">
        <button type="button" className="vault-button-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="vault-button" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save Entry"}
        </button>
      </div>
    </form>
  );
}

export default AddPasswordForm;