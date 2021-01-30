import { createSelector, createSlice } from '@reduxjs/toolkit';

const initialState = {
  key: '',
  title: '',
  body: '',
  newDraft: false,
};

const draftSlice =  createSlice(
  {
    name: 'draft',
    initialState,
    reducers: {
      newDraft(state, { payload: { key, title, body } }) {
        return {
          ...state,
          key, title, body,
          newDraft: true,
        };
      },

      newDraftUpdatedInternal(state) {
        return {
          ...state,
          newDraft: false,
        };
      },

      updateTitle(state, { payload: title }) {
        return {
          ...state,
          title,
        };
      },

      updateBody(state, { payload: body }) {
        return {
          ...state,
          body,
        };
      },
    },
  },
);

export const getDraft = ({ draft }) => draft;
export const getDraftKey = createSelector(getDraft, ({ key }) => key);
export const getDraftTitle = createSelector(getDraft, ({ title }) => title);
export const getDraftBody = createSelector(getDraft, ({ body }) => body);

export const { newDraft, newDraftUpdatedInternal, updateTitle, updateBody } = draftSlice.actions;
export default draftSlice.reducer;
