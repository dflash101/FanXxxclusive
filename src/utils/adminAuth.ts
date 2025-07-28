// Simple localStorage-based admin authentication
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const ADMIN_AUTH_KEY = 'adminAuthenticated';

export const adminAuth = {
  login: (username: string, password: string): boolean => {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem(ADMIN_AUTH_KEY, 'true');
      return true;
    }
    return false;
  },

  logout: (): void => {
    localStorage.removeItem(ADMIN_AUTH_KEY);
  },

  isAuthenticated: (): boolean => {
    return localStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  }
};