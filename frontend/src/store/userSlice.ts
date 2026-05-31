import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { StaffUser, PaginatedUsersResponse } from '../types/user.types.js';
import { UserService } from '../services/user.service.js';

interface UserState {
  items: StaffUser[];
  total: number;
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: UserState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
  success: null,
};

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (query: { page: number; limit: number }, { rejectWithValue }) => {
    try {
      return await UserService.listUsers(query.page, query.limit);
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export const provisionUser = createAsyncThunk(
  'users/provision',
  async (payload: { email: string; password_raw: string; role: 'MANAGER' | 'MEMBER' }, { rejectWithValue }) => {
    try {
      return await UserService.createUser(payload);
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export const toggleBlockUser = createAsyncThunk(
  'users/toggleBlock',
  async (payload: { id: string; isBlocked: boolean }, { rejectWithValue }) => {
    try {
      return await UserService.updateUser(payload.id, { isBlocked: payload.isBlocked });
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export const toggleRoleUser = createAsyncThunk(
  'users/toggleRole',
  async (payload: { id: string; role: 'MANAGER' | 'MEMBER' }, { rejectWithValue }) => {
    try {
      return await UserService.updateUser(payload.id, { role: payload.role });
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (userId: string, { rejectWithValue }) => {
    try {
      await UserService.deleteUser(userId);
      return userId;
    } catch (err: any) {
      return rejectWithValue(err);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserAlerts: (state) => {
      state.error = null;
      state.success = null;
    },
    clearUsers: (state) => {
      state.items = [];
      state.total = 0;
      state.loading = false;
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<PaginatedUsersResponse>) => {
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload?.detail || action.payload?.message || 'Failed to fetch active organization users.';
      })
      .addCase(provisionUser.fulfilled, (state, action) => {
        state.success = `User "${action.payload.email}" has been successfully provisioned.`;
        state.error = null;
      })
      .addCase(provisionUser.rejected, (state, action: any) => {
        state.error = action.payload?.detail || action.payload?.message || 'Failed to provision user.';
      })
      .addCase(toggleBlockUser.fulfilled, (state, action) => {
        state.success = `Account status updated: "${action.payload.email}" is now ${action.payload.isBlocked ? 'suspended' : 'active'}.`;
        state.error = null;
      })
      .addCase(toggleBlockUser.rejected, (state, action: any) => {
        state.error = action.payload?.detail || action.payload?.message || 'Failed to toggle status.';
      })
      .addCase(toggleRoleUser.fulfilled, (state, action) => {
        state.success = `Role updated: "${action.payload.email}" set to ${action.payload.role}.`;
        state.error = null;
      })
      .addCase(toggleRoleUser.rejected, (state, action: any) => {
        state.error = action.payload?.detail || action.payload?.message || 'Failed to update role.';
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.success = 'Staff member has been permanently removed.';
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action: any) => {
        state.error = action.payload?.detail || action.payload?.message || 'Failed to delete user.';
      });
  },
});

export const { clearUserAlerts, clearUsers } = userSlice.actions;
export default userSlice.reducer;
