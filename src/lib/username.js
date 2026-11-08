// Supabase auth needs an email, so a username is stored as an internal address (no mail is ever sent to it).
export const USER_DOMAIN = 'users.kabbalot-tovot.app';
export const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

export const normalizeUsername = (u) => u.trim().toLowerCase();
export const usernameToEmail = (u) => (u.includes('@') ? u : `${u}@${USER_DOMAIN}`);
export const emailToUsername = (email = '') => email.replace(`@${USER_DOMAIN}`, '');
