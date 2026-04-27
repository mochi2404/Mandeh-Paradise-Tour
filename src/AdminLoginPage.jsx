import { useState } from "react";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleComingSoon = (message) => {
    setFeedback(message);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (password === "AdminTerra2026!") {
      localStorage.setItem("terravoyage_admin_token", "authenticated");
      window.location.assign("/admin/analytics/");
    } else {
      setFeedback("Email atau Password salah. Silakan coba lagi.");
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-visual-panel">
        <div className="admin-visual-overlay" />
        <img
          alt="TerraVoyage Landscape"
          className="admin-visual-image"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGPc2DcDGO9xnbPSAS_7asDs0xxXkXBHO9TXEEZMt-FVP3Q8tuNjgFpaM0YPyHXdlpcpbUmOPmfrVHP_-Ay4JuJjoOL3ndFfhgLr6RcTG_-Bx8KW-Sj7_f7k-F4flRAnYT5k4EJbttjOrp_lRuz3lW_dSdAFDIpQa2DAQbiQgmcrxu75ePNKh8YQ8qcb1SVv4SkytdffzfLre1IJ8h41cL7M7Veada1bdokKk5lkDik34prQhvOcX63mXkJNjW3wUi7atbGdtdwEWs"
        />

        <div className="admin-visual-content">
          <div className="admin-brand admin-brand-light">
            <span className="material-symbols-outlined">landscape</span>
            <span>TerraVoyage</span>
          </div>

          <div className="admin-visual-copy">
            <h1>Begin your next organic escape.</h1>
            <p>
              Where sustainable luxury meets the untamed beauty of the natural
              world.
            </p>
          </div>

          <div className="admin-visual-footnote">
            <span className="material-symbols-outlined">explore</span>
            <span>Curated Expeditions 2024</span>
          </div>
        </div>
      </section>

      <section className="admin-form-panel">
        <nav className="admin-back-nav">
          <a className="admin-back-link" href="/">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Back to Home</span>
          </a>
        </nav>

        <div className="admin-form-shell">
          <header className="admin-login-header">
            <div className="admin-brand admin-brand-mobile">
              <span className="material-symbols-outlined">landscape</span>
              <span>TerraVoyage</span>
            </div>
            <h2>Welcome Back</h2>
            <p>Enter your details to access your luxury concierge.</p>
          </header>

          <div className="admin-social-grid">
            <button
              className="admin-social-button"
              onClick={() => handleComingSoon("Login dengan Google akan segera tersedia.")}
              type="button"
            >
              <svg aria-hidden="true" className="admin-social-icon" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              className="admin-social-button"
              onClick={() => handleComingSoon("Login dengan Facebook akan segera tersedia.")}
              type="button"
            >
              <svg aria-hidden="true" className="admin-social-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          <div className="admin-divider">
            <span>Or continue with email</span>
          </div>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <label className="admin-field">
              <span>Email Address</span>
              <div className="admin-input-wrap">
                <span className="material-symbols-outlined">mail</span>
                <input 
                  placeholder="name@luxury-travel.com" 
                  required 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>

            <label className="admin-field">
              <span>Password</span>
              <div className="admin-input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input
                  placeholder="password admin"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="admin-visibility-button"
                  onClick={() => setShowPassword((value) => !value)}
                  type="button"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </label>

            <div className="admin-form-row">
              <label className="admin-checkbox">
                <input type="checkbox" />
                <span>Remember Me</span>
              </label>
              <button
                className="admin-inline-link"
                onClick={() => handleComingSoon("Reset password akan segera tersedia.")}
                type="button"
              >
                Forgot Password?
              </button>
            </div>

            <button className="admin-submit-button" type="submit">
              <span>Sign In</span>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </form>

          {feedback ? <p className="admin-feedback">{feedback}</p> : null}

          <footer className="admin-login-footer">
            <p>
              New to TerraVoyage?
              <button
                className="admin-inline-link"
                onClick={() => handleComingSoon("Pembuatan akun admin akan segera tersedia.")}
                type="button"
              >
                Create an account
              </button>
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default AdminLoginPage;
