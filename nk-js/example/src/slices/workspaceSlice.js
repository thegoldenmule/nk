import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { loadNote } from './nkSlice';

export const loadAll = createAsyncThunk(
  'workspace/loadAll',
  async (keys, { getState, dispatch }) => {
    for (const key of keys) {
      await dispatch(loadNote(key));
    }
  },
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    activeKey: '',
  },
  reducers: {
    updateActiveKey(state, action) {
      return {
        ...state,
        activeKey: action.payload,
      };
    },
  },
});

export const getWorkspace = ({ workspace }) => workspace;
export const getActiveKey = createSelector(getWorkspace, ({ activeKey }) => activeKey);

export const { updateActiveKey } = workspaceSlice.actions;
export default workspaceSlice.reducer;
