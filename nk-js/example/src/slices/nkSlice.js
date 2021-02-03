import {
  createContext,
  createData, deleteData,
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
  saving: 'saving',
  deleting: 'deleting',
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

export const saveContext = createAsyncThunk(
  'nk/saveContext',
  async (password, { getState }) => {
    const context = getContext(getState());
    const serialized = await serialize(context, password);

    // save!
    localStorage.setItem('_context', serialized);
  },
);

export const newNote = createAsyncThunk(
  'nk/new-note',
  async ({ from }, { getState, rejectWithValue }) => {
    const context = getContext(getState());
    const key = newKey();
    const note = from || noteFactory();

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

    const note = valueToNote(newContext.plaintextValues[key])

    return { key, note, context: newContext };
  }
);

export const updateNote = createAsyncThunk(
  'nk/update-note',
  async ({ key, note }, { getState, rejectedWithValue }) => {
    // get note out of local
    const notes = getNoteValues(getState());
    const existingNote = notes[key];

    // update
    note.createdAt = existingNote.createdAt || new Date().getTime();
    note.lastUpdatedAt = new Date().getTime();

    const value = noteToValue(note);
    const context = getContext(getState());
    let newContext;
    try {
      newContext = await updateData(context, key, value);
    } catch (error) {
      return rejectedWithValue({ key, error });
    }

    return { key, note, context: newContext };
  },
);

export const deleteNote = createAsyncThunk(
  'nk/delete-note',
  async (key, { getState, rejectedWithValue }) => {
    let newContext;
    try {
      newContext = await deleteData(getContext(getState()), key);
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
);

const parseContextNodes = (plaintextValues) => Object.fromEntries(
  Object.entries(plaintextValues).map(
    ([k, v]) => [k, valueToNote(v)]));

const nkSlice = createSlice({
  name: 'nk',
  initialState,
  reducers: {
    initializeContext(state, { payload: context }) {
      return {
        ...state,
        context,
        isLoggedIn: isLoggedIn(context),
        noteKeys: context.keyNames,
        notes: parseContextNodes(context.plaintextValues),
        noteStatuses: Object.fromEntries(context.keyNames.map(n => [n, context.plaintextValues[n] ? noteStatus.loaded : noteStatus.unloaded])),
      };
    },
    logout(state) {
      return {
        ...state,
        isLoggedIn: false,
        context: createContext(),
      };
    },
  },
  extraReducers: {
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
    [loadNote.fulfilled]: (state, { payload: { key, context, note } }) => ({
      ...state,
      context,
      noteValues: {
        ...state.noteValues,
        [key]: note,
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
    [updateNote.pending]: (state, { meta: { arg: { key } } }) => {
      return {
        ...state,
        noteStatuses: {
          ...state.noteStatuses,
          [key]: noteStatus.saving,
        },
      };
    },
    [updateNote.fulfilled]: (state, { payload: { key, note, context } }) => {
      return {
        ...state,
        context,
        noteStatuses: {
          ...state.noteStatuses,
          [key]: noteStatus.loaded,
        },
        noteValues: {
          ...state.noteValues,
          [key]: note,
        }
      };
    },
    [updateNote.rejected]: (state, { key, error }) => {
      return {
        ...state,
        noteStatuses: {
          ...state.noteStatuses,
          [key]: noteStatus.error,
        },
      };
    },
    [deleteNote.pending]: (state, { meta: { arg: key } }) => ({
      ...state,
      noteStatuses: {
        ...state.noteStatuses,
        [key]: noteStatus.deleting,
      },
    }),
    [deleteNote.fulfilled]: (state, { payload: { key, context } }) => {
      const {
        noteStatuses: { [key]: s, ...noteStatuses },
        noteValues: { [key]: v, ...noteValues },
      } = state;

      const { keyNames: noteKeys } = context;

      return {
        ...state,
        context,
        noteKeys,
        noteStatuses,
        noteValues,
      };
    },
    [deleteNote.rejected]: (state, { key }) => ({
      ...state,
      noteStatuses: {
        ...state.noteStatuses,
        [key]: noteStatus.error,
      },
    }),
  },
});

export const getNk = ({ nk }) => nk;
export const getContext = createSelector(getNk, ({ context }) => context);
export const getIsLoggedIn = createSelector(getNk, ({ isLoggedIn }) => isLoggedIn);
export const getNoteKeys = createSelector(getNk, ({ noteKeys }) => noteKeys);
export const getNoteValues = createSelector(getNk, ({ noteValues }) => noteValues);
export const getNoteStatuses = createSelector(getNk, ({ noteStatuses }) => noteStatuses);

export const { initializeContext, logout, } = nkSlice.actions;
export default nkSlice.reducer;
