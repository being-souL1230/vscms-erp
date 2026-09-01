import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'campusconnect_session_token';
const USER_KEY = 'campusconnect_user';
const ROLE_KEY = 'campusconnect_user_role';

export const saveSession = async (sessionToken, user) => {
  try {
    if (sessionToken) await SecureStore.setItemAsync(SESSION_KEY, sessionToken);
    if (user) {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      await SecureStore.setItemAsync(ROLE_KEY, user.role || 'student');
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getSessionToken = async () => {
  try { return await SecureStore.getItemAsync(SESSION_KEY); }
  catch { return null; }
};

export const getUser = async () => {
  try {
    const data = await SecureStore.getItemAsync(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

export const getUserRole = async () => {
  try { return await SecureStore.getItemAsync(ROLE_KEY) || 'student'; }
  catch { return 'student'; }
};

export const removeSession = async () => {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    await SecureStore.deleteItemAsync(ROLE_KEY);
  } catch (error) {
    console.error('Error removing session:', error);
  }
};

// Legacy aliases
export const saveTokens = async (token) => { await saveSession(token); };
export const getToken = getSessionToken;
export const getRefreshToken = async () => null;
export const removeTokens = removeSession;
export const saveUser = async (user) => {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    await SecureStore.setItemAsync(ROLE_KEY, user.role || 'student');
  } catch {}
};
