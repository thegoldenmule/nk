import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createContext, register } from '../nk-js';
import { initializeContext, saveContext } from './nkSlice';

export const registrationPhases = {
  uninitialized: 'uninitialized',
  requestingCredentials: 'requestingCredentials',
  registering: 'registering',
  completeRegistration: 'completeRegistration',
};

const initialState = {
  phase: registrationPhases.uninitialized,
  value: '',
  valueConfirmation: '',
  error: '',
};

export const submitPasswordRegister = createAsyncThunk(
  'register/submit',
  async (action, { getState, dispatch, rejectedWithValue }) => {
    let context;
    try {
      context = await register(createContext())
    } catch (error) {
      return rejectedWithValue(error);
    }

    dispatch(initializeContext(context));

    const { value } = getRegister(getState());
    await dispatch(saveContext(value))

    return { context };
  },
);

const registerSlice = createSlice(
  {
    name: 'register',
    initialState,
    reducers: {
      initRegister: (state, action) => ({
        ...state,
        phase: registrationPhases.requestingCredentials,
      }),
      updatePasswordRegister: (state, { payload: value }) => ({
        ...state,
        value,
      }),
      updatePasswordConfirmationRegister: (state, { payload: valueConfirmation }) => ({
        ...state,
        valueConfirmation,
      }),
    },
    extraReducers: {
      [submitPasswordRegister.pending]: (state) => ({
        ...state,
        phase: registrationPhases.registering,
      }),
      [submitPasswordRegister.rejected]: (state, error) => ({
        phase: registrationPhases.requestingCredentials,
        error,
      }),
      [submitPasswordRegister.fulfilled]: () => ({
        phase: registrationPhases.completeRegistration,
      }),
    },
  },
);

export const getRegister = ({ register }) => register;

export const { initRegister, updatePasswordRegister, updatePasswordConfirmationRegister } = registerSlice.actions;
export default registerSlice.reducer;
