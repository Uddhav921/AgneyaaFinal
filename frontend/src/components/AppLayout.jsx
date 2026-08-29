import styles from './AppLayout.module.css';
import { supabase } from '../lib/supabase';

/**
 * Sidebar navigation items — maps to the 4 module flow.
 * stateKeys: all appState values that belong to this nav item.
 */
const NAV_ITEMS = [
  {
    id: 'dashboard',
    icon: '⬛',
    label: 'Dashboard',
    sub: 'Access All Modules',
    stateKeys: ['dashboard'],
    alwaysOn: true,
  },
  {
    id: 'chat',
    icon: '🌱',
    label: 'Beej Analysis',
    sub: 'AI Feasibility Chat',
    stateKeys: ['chat'],
    badge: 'Module 1',
    moduleId: 'm1',
  },
  {
    id: 'mool',
    icon: '💰',
    label: 'Mool Financial',
    sub: 'Loan & EMI Calculator',
    stateKeys: ['mool'],
    badge: 'Module 2',
    moduleId: 'm2',
  },
  {
    id: 'report',
    icon: '📊',
    label: 'Final Report',
    sub: 'Feasibility Score',
    stateKeys: ['report'],
    badge: 'Module 3',
    moduleId: 'm3',
  },
  {
    id: 'feedback',
    icon: '⭐',
    label: 'Feedback',
    sub: 'Rate & Suggest',
    stateKeys: ['feedback'],
    badge: 'Module 4',
    moduleId: 'm4',
  },
];

/**
 * Get the nav item ID for a given appState string.
 */
export function getNavId(appState) {
  for (const item of NAV_ITEMS) {
    if (item.stateKeys.includes(appState)) return item.id;
  }
  return 'dashboard';
}

/**
 * AppLayout — persistent left sidebar with module navigation.
 *
 * Props:
 *   appState         — current app state string
 *   user             — Supabase user object
 *   completedModules — { m1, m2, m3, m4 } booleans
 *   onNavigate       — (stateKey) => void
 *   children         — main content area
 */
export default function AppLayout({ appState, user, completedModules = {}, onNavigate, children }) {
  const activeId = getNavId(appState);

  const isAccessible = (item) => {
    if (item.alwaysOn) return true;
    if (item.moduleId === 'm1') return true;                     // Module 1 always open
    if (item.moduleId === 'm2') return !!completedModules.m1;   // Needs M1
    if (item.moduleId === 'm3') return !!completedModules.m2;   // Needs M2
    if (item.moduleId === 'm4') return !!completedModules.m3;   // Needs M3
    return true;
  };

  const isDone = (item) => {
    if (!item.moduleId) return false;
    return !!completedModules[item.moduleId];
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const avatarUrl = user?.user_metadata?.avatar_url;
  const userName  = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <div className={styles.root}>

      {/* ── Left Module Sidebar ── */}
      <aside className={styles.sidebar}>

        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.flame}>🔥</span>
          <span className={styles.brandName}>Agneyaa</span>
        </div>

        {/* Navigation Items */}
        <nav className={styles.nav} aria-label="Module Navigation">
          {NAV_ITEMS.map((item, idx) => {
            const accessible = isAccessible(item);
            const done       = isDone(item);
            const isActive   = item.stateKeys.includes(appState);
            const locked     = !accessible;
            const isLast     = idx === NAV_ITEMS.length - 1;

            return (
              <button
                key={item.id}
                className={[
                  styles.navItem,
                  isActive  ? styles.active : '',
                  done      ? styles.done   : '',
                  locked    ? styles.locked : '',
                ].join(' ')}
                onClick={() => accessible && onNavigate?.(item.stateKeys[0])}
                disabled={locked}
                title={locked ? 'Complete previous modules first' : item.label}
              >
                {/* Track: indicator + connecting line */}
                <div className={styles.track}>
                  <div className={styles.indicator}>
                    {done ? '✓' : item.alwaysOn ? '⬡' : idx}
                  </div>
                  {!isLast && <div className={styles.line} />}
                </div>

                {/* Content */}
                <div className={styles.itemContent}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemIcon}>{item.icon}</span>
                    {item.badge && (
                      <span className={styles.itemBadge}>{item.badge}</span>
                    )}
                    {locked && <span className={styles.lockIcon}>🔒</span>}
                  </div>
                  <span className={styles.itemLabel}>{item.label}</span>
                  <span className={styles.itemSub}>{item.sub}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        {user && (
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {avatarUrl
                ? <img src={avatarUrl} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : <div className={styles.avatarFallback}>{userName[0]?.toUpperCase()}</div>
              }
            </div>
            <div className={styles.userMeta}>
              <div className={styles.userName}>{userName}</div>
              <div className={styles.userRole}>Rural Entrepreneur</div>
            </div>
            <button className={styles.signOutBtn} onClick={handleSignOut} title="Sign out">⎋</button>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <div className={styles.content}>
        {children}
      </div>

    </div>
  );
}
