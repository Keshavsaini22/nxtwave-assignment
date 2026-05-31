import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserPayload } from '../types/auth.types.js';
import { AuthService } from '../services/auth.service.js';
import { getStoredTokens, setStoredTokens, clearStoredTokens } from '../services/api.js';

interface AuthState {
  user: UserPayload | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

const parseJWT = (token: string): UserPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as UserPayload;
  } catch (e) {
    return null;
  }
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(credentials);
      const { accessToken, refreshToken } = response;
      setStoredTokens(accessToken, refreshToken);
      const decoded = parseJWT(accessToken);
      if (!decoded) {
        throw new Error('Failed to parse user session claims.');
      }
      return decoded;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    payload: {
      email: string;
      password: string;
      role: 'ADMIN' | 'MANAGER' | 'MEMBER';
      organizationName?: string;
      organizationId?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      await AuthService.register(payload);
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      const { refreshToken } = getStoredTokens();
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
    } catch (err: any) {
    } finally {
      clearStoredTokens();
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    restoreAuth: (state) => {
      const { accessToken } = getStoredTokens();
      if (accessToken) {
        const decoded = parseJWT(accessToken);
        if (decoded) {
          state.user = decoded;
        } else {
          clearStoredTokens();
          state.user = null;
        }
      }
      state.loading = false;
    },
    clearAuth: (state) => {
      clearStoredTokens();
      state.user = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<UserPayload>) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action: any) => {
        state.error = action.payload?.detail || action.payload?.message || 'Authentication failed.';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      });
  },
});

export const { restoreAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
