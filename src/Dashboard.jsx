import { useState, useEffect } from "react";
import AddPasswordForm from "./AddPasswordForm";
import TwoFactorSetup from "./TwoFactorSetup";
import { encryptData, decryptData } from "./crypto";

function Dashboard({ encryptionKey, onLogout }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  useEffect(() => {
    fetchVault();
  }, []);

  async function fetchVault() {
    setError("");
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:3000/vault", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      if (data.blob) {
        // The blob is now real ciphertext — { iv, ciphertext } as
        // hex strings — decrypted here, locally, using the real key.
        const parsed = JSON.parse(data.blob);
        const decrypted = await decryptData(encryptionKey, parsed.iv, parsed.ciphertext);
        setEntries(decrypted);
      } else {
        setEntries([]);
      }
    } catch (err) {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveEntries(updatedEntries) {
    const token = localStorage.getItem("token");

    // Encrypt the WHOLE array locally before it ever leaves the browser.
    const encrypted = await encryptData(encryptionKey, updatedEntries);

    const response = await fetch("http://localhost:3000/vault", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ blob: JSON.stringify(encrypted) }),
    });

    return response.json();
  }

  function handleLogout() {
    setEntries([]);
    localStorage.removeItem("token");
    onLogout();
  }

  function handleEntrySaved(updatedEntries) {
    setEntries(updatedEntries);
    setIsAdding(false);
  }

  return (
    <div>
      <div className="vault-dashboard-header">
        <p className="vault-status">Vault unlocked</p>
        <div style={{ display: "flex", gap: "16px" }}>
          {!showTwoFactor && !isAdding && (
            <button className="vault-link" onClick={() => setShowTwoFactor(true)}>
              Set up 2FA
            </button>
          )}
          <button className="vault-link" onClick={handleLogout}>Log out</button>
        </div>
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

      {showTwoFactor ? (
        <TwoFactorSetup onClose={() => setShowTwoFactor(false)} />
      ) : isAdding ? (
        <AddPasswordForm
          existingEntries={entries}
          onSave={saveEntries}
          onSaved={handleEntrySaved}
          onCancel={() => setIsAdding(false)}
        />
      ) : (
        <>
          {isLoading ? (
            <p className="vault-hint">Loading your vault…</p>
          ) : entries.length === 0 ? (
            <p className="vault-hint">Your vault is empty. Nothing saved yet.</p>
          ) : (
            <ul className="vault-entry-list">
              {entries.map((entry, i) => (
                <li key={i} className="vault-entry">
                  <span className="vault-entry-site">{entry.site}</span>
                  <span className="vault-entry-username">{entry.username}</span>
                </li>
              ))}
            </ul>
          )}

          <button className="vault-button" style={{ marginTop: "16px" }} onClick={() => setIsAdding(true)}>
            + Add Password
          </button>
        </>
      )}
    </div>
  );
}

export default Dashboard;