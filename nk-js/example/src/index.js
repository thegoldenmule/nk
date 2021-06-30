import React from 'react';
import ReactDOM from 'react-dom';
import { configureStore } from '@reduxjs/toolkit';
import { HashRouter } from 'react-router-dom';

import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import App from './App';

import nkReducer from './slices/nkSlice';
import workspaceReducer from './slices/workspaceSlice';
import draftReducer from './slices/draftSlice';
import filesReducer from './slices/filesSlice';
import loginReducer from './slices/loginSlice';
import registerReducer from './slices/registerSlice';

import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import { logger } from 'redux-logger/src';

const store = configureStore({
  reducer: {
    nk: nkReducer,
    workspace: workspaceReducer,
    draft: draftReducer,
    files: filesReducer,
    login: loginReducer,
    register: registerReducer,
  },
  middleware: [thunk, logger],
});

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
