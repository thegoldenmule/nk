import { createSelector, createSlice } from '@reduxjs/toolkit';

const filesSlice = createSlice({
  name: 'files',
  initialState: {
    query: '',
  },
  reducers: {
    updateQuery(state, { payload: query }) {
      return {
        ...state,
        query,
      };
    },
  },
});

export const getFiles = ({ files }) => files;
export const getQuery = createSelector(getFiles, ({ query }) => query);

export const { updateQuery } = filesSlice.actions;
export default filesSlice.reducer;
