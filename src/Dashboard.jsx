import { useState, useEffect } from "react";
import AddPasswordForm from "./AddPasswordForm";

function Dashboard({ onLogout }) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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
        setEntries(JSON.parse(data.blob));
      } else {
        setEntries([]);
      }
    } catch (err) {
      setError("Could not reach the server.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    onLogout();
  }

  function handleEntrySaved(updatedEntries) {
    setEntries(updatedEntries); // update the list immediately, no refetch needed
    setIsAdding(false);
  }

  return (
    <div>
      <div className="vault-dashboard-header">
        <p className="vault-status">Vault unlocked</p>
        <button className="vault-link" onClick={handleLogout}>Log out</button>
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

      {isAdding ? (
        <AddPasswordForm
          existingEntries={entries}
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