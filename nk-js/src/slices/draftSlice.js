import { createSelector, createSlice } from '@reduxjs/toolkit';

const initialState = {
  drafts: {},
  newDraft: false,
};

const draftSlice =  createSlice(
  {
    name: 'draft',
    initialState,
    reducers: {
      newDraft(state, { payload: { key, note } }) {
        const currentDraft = state.drafts[key];
        return {
          ...state,
          key,
          drafts: {
            ...state.drafts,
            [key]: currentDraft || { ...note, isDirty: false }
          },
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
          drafts: {
            ...state.drafts,
            [state.key]: {
              ...state.drafts[state.key],
              title,
              isDirty: true,
            },
          },
        };
      },

      updateBody(state, { payload: body }) {
        return {
          ...state,
          drafts: {
            ...state.drafts,
            [state.key]: {
              ...state.drafts[state.key],
              body,
              isDirty: true,
            },
          },
        };
      },

      draftSaved(state, { payload: { key, note } }) {
        return {
          ...state,
          drafts: {
            ...state.drafts,
            [key]: {
              ...state.drafts[key],
              lastUpdatedAt: note.lastUpdatedAt,
              isDirty: false,
            },
          },
        };
      },
    },
  },
);

export const getDraft = ({ draft }) => draft;
export const getDraftKey = createSelector(getDraft, ({ key }) => key);

export const { newDraft, newDraftUpdatedInternal, updateTitle, updateBody, draftSaved } = draftSlice.actions;
export default draftSlice.reducer;
