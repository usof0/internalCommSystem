import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';


interface AuthState {
  user: User | null;
  token: string | null;
  authz: { permissions: string[], roles: string[] }
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  authz: {permissions: [], roles: []},
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string | null | undefined;
        authz?: { permissions?: string[]; roles?: string[] };
        permissions?: string[];
        roles?: string[];
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token ?? null;

      const permissions =
        action.payload.authz?.permissions ?? action.payload.permissions ?? [];
      const roles = action.payload.authz?.roles ?? action.payload.roles ?? [];

      state.authz.permissions = permissions;
      state.authz.roles = roles;

      if (state.token) {
        state.isAuthenticated = true;
      } else {
        state.isAuthenticated = false;
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.authz = { permissions: [], roles: [] };
      state.isAuthenticated = false;
    },

    setAuthz: (
      state,
      action: PayloadAction<{ permissions: string[]; roles?: string[] }>
    ) => {
      state.authz.permissions = action.payload.permissions;
      state.authz.roles = action.payload.roles ?? [];
    },

    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, logout, setAuthz, setUser } = authSlice.actions;
export default authSlice.reducer;
