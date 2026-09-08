import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getStoredToken = (): string | null => {
  try {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const initialToken = getStoredToken();

const initialState: AuthState = {
  user: getStoredUser(),
  token: initialToken,
  isAuthenticated: !!initialToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
