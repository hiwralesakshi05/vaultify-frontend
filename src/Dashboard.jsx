import { useState, useEffect } from "react";

function Dashboard({ onLogout }) {
  // Holds the list of saved password entries once fetched.
  const [entries, setEntries] = useState([]);

  // Tracks whether we're still waiting on the initial fetch.
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState("");

  // Runs once, right after this component first appears on screen —
  // that's what the empty [] at the end means (no dependencies).
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

      // NOTE: entries are stored as plain JSON for now — real
      // decryption gets wired in once crypto.js is integrated.
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

  return (
    <div>
      <div className="vault-dashboard-header">
        <p className="vault-status">Vault unlocked</p>
        <button className="vault-link" onClick={handleLogout}>Log out</button>
      </div>

      {error && <div className="vault-error">⚠ {error}</div>}

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
    </div>
  );
}

export default Dashboard;