import styles from './Navbar.module.css';

const LogInIcon = () => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

export default function Navbar() {
  return (
    <nav className={styles.nav}>
      {/* Logo */}
      <a href="/" className={styles.logo} aria-label="Agneyaa Home">
        <span className={styles.flame} aria-hidden="true">🔥</span>
        <span className={styles.brand}>Agneyaa</span>
      </a>

      {/* Login — top right */}
      <button className={styles.loginBtn} id="btn-login" aria-label="Login">
        <LogInIcon />
        Login
      </button>
    </nav>
  );
}
