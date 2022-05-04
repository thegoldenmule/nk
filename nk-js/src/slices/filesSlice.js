import { createSelector, createSlice } from '@reduxjs/toolkit';

const filesSlice = createSlice({
  name: 'files',
  initialState: {
    query: '',
    searchFocus: 0,
  },
  reducers: {
    updateQuery(state, { payload: query }) {
      return {
        ...state,
        query,
      };
    },

    focusSearch(state) {
      return {
        ...state,
        searchFocus: state.searchFocus + 1,
      };
    },
  },
});

export const getFiles = ({ files }) => files;
export const getQuery = createSelector(getFiles, ({ query }) => query);
export const getSearchFocus = createSelector(getFiles, ({ searchFocus }) => searchFocus);

export const { updateQuery, focusSearch } = filesSlice.actions;
export default filesSlice.reducer;
