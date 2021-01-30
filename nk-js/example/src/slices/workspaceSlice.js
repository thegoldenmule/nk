import { createSelector, createSlice } from '@reduxjs/toolkit';

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
    }
  },
});

export const getWorkspace = ({ workspace }) => workspace;
export const getActiveKey = createSelector(getWorkspace, ({ activeKey }) => activeKey);

export const { updateActiveKey } = workspaceSlice.actions;
export default workspaceSlice.reducer;
