import {
  createContext,
  createData,
  deserialize,
  getData,
  getKeys,
  isLoggedIn,
  register,
  serialize,
  updateData
} from '../nk-js';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { noteFactory, noteToValue, valueToNote } from '../notes';

export const noteStatus = {
  unloaded: 'unloaded',
  loading: 'loading',
  loaded: 'loaded',
  error: 'error',
};

const initialState = {
  isLoggedIn: false,
  context: createContext(),
  noteKeys: [],
  noteValues: {},
  noteStatuses: {},
};

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
  async (_, { getState, rejectWithValue }) => {
    const context = getContext(getState());
    const key = newKey();
    const note = noteFactory();

    let newContext;
    try {
      newContext = await createData(context, key, noteToValue(note));
    } catch (error) {
      return rejectWithValue(error);
    }

    return { key, note, context: newContext };
  },
);

export const loadNote = createAsyncThunk(
  'nk/load-note',
  async (key, { getState, rejectWithValue }) => {
    const context = getContext(getState());
    let newContext;
    try {
      newContext = await getData(context, key);
    } catch (error) {
      return rejectWithValue({ key, error });
    }

    return { key, context: newContext };
  }
);

export const updateNote = createAsyncThunk(
  'nk/update-note',
  async ({ key, note }, { getState, rejectedWithValue }) => {
    const value = noteToValue(note);
    const context = getContext(getState());
    let newContext;
    try {
      newContext = await updateData(context, key, value);
    } catch (error) {
      return rejectedWithValue({ key, error });
    }

    return { key, context: newContext };
  },
);

export const echo = createAsyncThunk(
  'nk/echo',
  async (_, { getState, rejectedWithValue }) => {
    const length = Math.max(6, Math.floor(Math.random() * 1000));
    const buf = new Uint8Array(length);
    await crypto.getRandomValues(buf);

    const form = new FormData();
    form.append('Payload', new Blob([buf]));

    let echoBuf;
    try {
      const res = await fetch(
        `${getContext(getState()).url}/utilities/echo`,
        {
          method: 'post',
          body: form,
        });
      echoBuf = await res.arrayBuffer();
    } catch (error) {
      return rejectedWithValue(error);
    }

    const a = new Uint8Array(buf);
    const b = new Uint8Array(echoBuf);
    for (let i = 0, len = a.length; i < len; i++) {
      if (a[i] != b[i]) {
        console.log('FAILED', length, a, b);
        return rejectedWithValue(`Values don't match.`);
      }
    }

    console.log('SUCCEEDED');
  }
)

const parseContextNodes = (plaintextValues) => Object.fromEntries(
  Object.entries(plaintextValues).map(
    ([k, v]) => [k, valueToNote(v)]));

const nkSlice = createSlice({
  name: 'nk',
  initialState,
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
      isLoggedIn: isLoggedIn(action.payload),
      context: action.payload,
      noteKeys: action.payload.keyNames,
      notes: parseContextNodes(action.payload.plaintextValues),
      noteStatuses: Object.fromEntries(action.payload.keyNames.map(n => [n, action.payload.plaintextValues[n] ? noteStatus.loaded : noteStatus.unloaded])),
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
    [newNote.pending]: (state, action) => {
      const { meta: { arg } } = action;

      return {
        ...state,
        noteStatuses: {
          ...state.noteStatuses,
          [arg]: noteStatus.loading,
        },
      };
    },
    [newNote.fulfilled]: (state, { payload: { key, note, context } }) => ({
      ...state,
      noteKeys: context.keyNames,
      noteValues: {
        ...state.noteValues,
        [key]: note,
      },
      noteStatus: {
        ...state.noteStatuses,
        [key]: noteStatus.loaded,
      },
      context
    }),
    [newNote.rejected]: (state, action) => ({
      ...state,
      // TODO: add error
    }),
    [loadNote.pending]: (state, action) => {
      const { meta: { arg } } = action;
      return {
        ...state,
        nodeStatuses: {
          ...state.noteStatuses,
          [arg]: noteStatus.loading,
        },
      };
    },
    [loadNote.fulfilled]: (state, { payload: { key, context } }) => ({
      ...state,
      noteValues: {
        ...state.noteValues,
        [key]: valueToNote(context.plaintextValues[key]),
      },
      noteStatuses: {
        ...state.noteStatuses,
        [key]: noteStatus.loaded
      },
    }),
    [loadNote.rejected]: (state, { payload: { key, error } }) => ({
      ...state,
      noteStatuses: {
        ...state.noteStatuses,
        [key]: noteStatus.error
      },
    }),
    [updateNote.fulfilled]: (state, { payload: { key, context } }) => {
      return {
        ...state,
        context,
      };
    },
    [updateNote.rejected]: (state, { key, error }) => {
      return {
        ...state,
        // TODO: add error
      };
    }
  },
});

export const getNk = ({ nk }) => nk;
export const getContext = createSelector(getNk, ({ context }) => context);
export const getIsLoggedIn = createSelector(getNk, ({ isLoggedIn }) => isLoggedIn);
export const getNoteKeys = createSelector(getNk, ({ noteKeys }) => noteKeys);
export const getNoteValues = createSelector(getNk, ({ noteValues }) => noteValues);
export const getNoteStatuses = createSelector(getNk, ({ noteStatuses }) => noteStatuses);

export const { logout, saveNote } = nkSlice.actions;
export default nkSlice.reducer;
