import { createContext, createData, deserialize, getKeys, register, serialize } from '../nk-js';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { noteToValue, valueToNote } from '../notes';

// taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
const newKey = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

export const login = createAsyncThunk(
  'nk/loadContext',
  async () => {
    const contextData = localStorage.getItem('_context');
    if (contextData) {
      let context = await deserialize(contextData, '111111');
      context = await getKeys(context);

      return context;
    }

    return createContext();
  },
);

export const signUp = createAsyncThunk(
  'nk/signUp',
  async (_, { getState }) => {
    const context = getContext(getState());
    const newContext = await register(context);

    // TODO: ask for passphrase
    const serialized = await serialize(newContext, '111111');

    // save!
    localStorage.setItem('_context', serialized);

    return newContext;
  },
);

export const newNote = createAsyncThunk(
  'nk/new-note',
  async (_, { getState }) => {
    const context = getContext(getState());
    const key = newKey();
    const note = newNote();

    const newContext = await createData(context, key, noteToValue(note));

    return { key, note, context };
  },
);

const parseContextNodes = (plaintextValues) => Object.fromEntries(
  Object.entries(plaintextValues).map(
    ([k, v]) => [k, valueToNote(v)]));

const nkSlice = createSlice({
  name: 'nk',
  initialState: {
    isLoggedIn: false,
    context: createContext(),
    noteKeys: [],
    noteValues: {},
  },
  reducers: {
    logout(state) {
      return {
        ...state,
        isLoggedIn: false,
        context: createContext(),
      };
    },

    saveNote(state, action) {
      return state;
    },

    updateContext(state, action) {
      return {
        ...state,
        context: action.payload
      };
    },
  },
  extraReducers: {
    [login.fulfilled]: (state, action) => ({
      ...state,
      isLoggedIn: true,
      context: action.payload,
      noteKeys: action.payload.keyNames,
      notes: parseContextNodes(action.payload.plaintextValues),
    }),
    [login.rejected]: (state, action) => ({
      // todo: add error
      ...state,
    }),
    [signUp.fulfilled]: (state, action) => ({
      ...state,
      isLoggedIn: true,
      context: action.payload,
    }),
    [signUp.rejected]: (state, action) => ({
      // todo: add error
      ...state,
    }),
    [newNote.fulfilled]: (state, { payload: { key, note, context } }) => ({
      ...state,
      noteKeys: context.keyNames,
      noteValues: {
        ...state.noteValues,
        [key]: note,
      },
      context
    }),
    [newNote().rejected]: (state, action) => ({
      // todo: add error
      ...state,
    }),
  },
});

export const getNk = ({ nk }) => nk;
export const getContext = createSelector(getNk, ({ context }) => context);
export const getIsLoggedIn = createSelector(getNk, ({ isLoggedIn }) => isLoggedIn);
export const getNoteKeys = createSelector(getNk, ({ noteKeys }) => noteKeys);
export const getNoteValues = createSelector(getNk, ({ noteValues }) => noteValues);

export const { logout, saveNote, updateContext } = nkSlice.actions;
export default nkSlice.reducer;
