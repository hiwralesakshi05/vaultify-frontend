import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

// The faint concentric vault-door rings + bolt marks behind the card.
function VaultBackdrop() {
  const boltCount = 16;
  const bolts = Array.from({ length: boltCount }, (_, i) => {
    const angle = (i / boltCount) * Math.PI * 2;
    const radius = 380;
    const cx = 400 + radius * Math.cos(angle);
    const cy = 400 + radius * Math.sin(angle);
    return <circle key={i} cx={cx} cy={cy} r="5" fill="none" stroke="#c9a227" strokeWidth="1.5" />;
  });

  return (
    <svg className="vault-backdrop" viewBox="0 0 800 800" aria-hidden="true">
      <circle cx="400" cy="400" r="380" fill="none" stroke="#c9a227" strokeWidth="1.5" />
      <circle cx="400" cy="400" r="300" fill="none" stroke="#c9a227" strokeWidth="1" opacity="0.6" />
      <circle cx="400" cy="400" r="220" fill="none" stroke="#c9a227" strokeWidth="1" opacity="0.4" />
      {bolts}
    </svg>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // "login" or "register" — controls which form is shown when logged out.
  const [view, setView] = useState("login");

  // After a successful registration, pre-fill this so the login form
  // doesn't make the user retype their username.
  const [prefillUsername, setPrefillUsername] = useState("");

  function handleRegisterSuccess(username) {
    setPrefillUsername(username);
    setView("login");
  }

  return (
    <div className="vault-page">
      <VaultBackdrop />

      <div className="vault-card">
        <p className="vault-eyebrow">Zero-Knowledge Access</p>
        <h1 className="vault-title">🔐 Vaultify</h1>

        {isLoggedIn ? (
          <p className="vault-status">Vault unlocked. Dashboard coming next.</p>
        ) : view === "login" ? (
          <>
            <LoginForm
              onLoginSuccess={() => setIsLoggedIn(true)}
              initialUsername={prefillUsername}
            />
            <p className="vault-toggle">
              New here?{" "}
              <button className="vault-link" onClick={() => setView("register")}>
                Create a vault
              </button>
            </p>
          </>
        ) : (
          <>
            <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
            <p className="vault-toggle">
              Already have a vault?{" "}
              <button className="vault-link" onClick={() => setView("login")}>
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default App;