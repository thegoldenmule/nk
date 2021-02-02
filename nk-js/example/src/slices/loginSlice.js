import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createContext, deserialize, getKeys } from '../nk-js';
import { getContext, getNoteValues, initializeContext, loadNote } from './nkSlice';
import { updateActiveKey } from './workspaceSlice';
import { newDraft } from './draftSlice';

export const loginPhases = {
  uninitialized: 'uninitialized',
  requestingCredentials: 'requestingCredentials',
  decrypting: 'decrypting',
  completeLoggedIn: 'completeLoggedIn',
  completeAnonymous: 'completeAnon',
};

// uninit
//  init -> requestCredentials
//    updatePassword
//    submitPassword -> decrypting
//      failed -> requestCredentials
//      complete
//  init -> complete

const initialState = {
  phase: loginPhases.uninitialized,
  value: '',
  error: '',
  contextData: '',
  context: null,
};

export const submitPassword = createAsyncThunk(
  'login/submit',
  async (_, { getState, dispatch, rejectWithValue, }) => {
    const { value, contextData } = getLogin(getState());

    const { decrypt } = loginSlice.actions;
    dispatch(decrypt());

    let context;
    try {
      context = await deserialize(contextData, value);
    } catch (error) {
      return rejectWithValue('Invalid password.');
    }

    try {
      context = await getKeys(context);
    } catch (error) {
      return;
    }

    dispatch(initializeContext(context));
    await dispatch(loadAll());

    return;
  });

export const loadAll = createAsyncThunk(
  'login/loadAll',
  async (action, { getState, dispatch }) => {
    const { keyNames } = getContext(getState());
    for (const key of keyNames) {
      await dispatch(loadNote(key));
    }

    const notes = getNoteValues(getState());
    const [first, ..._] = keyNames;
    if (first) {
      dispatch(updateActiveKey(first));
      dispatch(newDraft({ key: first, note: notes[first] }));
    }
  },
);

const loginSlice = createSlice({
  name: 'login',
  initialState,
  reducers: {
    init: (state, action) => {
      const contextData = localStorage.getItem('_context');
      if (!contextData) {
        return {
          ...state,
          phase: loginPhases.completeAnonymous,
          context: createContext(),
          error: '',
        };
      }

      return {
        ...state,
        phase: loginPhases.requestingCredentials,
        contextData,
        value: '',
        error: '',
      };
    },
    decrypt: (state) => ({
      ...state,
      phase: loginPhases.decrypting,
    }),
    updatePassword: (state, { payload }) => ({ ...state, value: payload, }),
  },

  extraReducers: {
    [submitPassword.rejected]: (state, { payload: error }) => ({
      ...state,
      error,
    }),
    [submitPassword.fulfilled]: () => ({
      phase: loginPhases.completeLoggedIn,
    }),
  },
});

export const getLogin = ({ login }) => login;
export const getPassword = ({ value }) => value;

export const { init, updatePassword } = loginSlice.actions;
export default loginSlice.reducer;
