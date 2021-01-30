import './App.css';
import {
  Alert,
  Col,
  Container,
  Row
} from 'react-bootstrap';
import { useEffect } from 'react';

import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import ProfileView from './profile';
import FileBrowser from './files';
import NoteEditor from './editor';
import {
  getContext,
  getIsLoggedIn,
  login,
  logout,
  signUp,
  newNote,
  getNoteKeys,
  getNoteValues, loadNote, getErrors, getLoading, updateNote
} from './slices/nkSlice';
import { connect } from 'react-redux';
import { getActiveKey, updateActiveKey } from './slices/workspaceSlice';
import { unwrapResult } from '@reduxjs/toolkit';

const getUnloadedKey = (context, errors, loading) => {
  const { keyNames, plaintextValues } = context;
  for (const key of keyNames) {
    if (!plaintextValues[key] && !errors[key] && !loading[key]) {
      return key;
    }
  }
};

function App({
  context, isLoggedIn,
  activeKey, errors, loading, dispatchUpdateActiveKey,
  noteValues, noteKeys,
  dispatchLogin, dispatchLogout, dispatchSignUp, dispatchNewNote, dispatchLoadNote, dispatchUpdateNote,
}) {
  const note = noteValues[activeKey];

  const onLogin = async () => {
    await dispatchLogin();
  };

  const onLogout = async () => {
    await dispatchLogout();
  };

  const onCreateUser = async () => {
    await dispatchSignUp();
  };

  const onCreateNote = async () => {
    const res = await dispatchNewNote();

    let payload;
    try {
      payload = await unwrapResult(res);
    } catch (error) {
      return;
    }

    const { key } = payload;
    await dispatchUpdateActiveKey(key);
  };

  const onSave = async ({ key, note }) => {
    await dispatchUpdateNote({ key, note });
  };

  const onSelectNote = async key => {
    if (!noteValues[key]) {
      const res = await dispatchLoadNote(key)

      try {
        await unwrapResult(res);
      } catch (error) {
        // if load note doesn't work, do not update active key
        return;
      }
    }

    dispatchUpdateActiveKey(key);
  };

  const files = noteKeys.map(k => {
    const error = errors[k];
    const isLoading = loading[k];
    if (error) {
      return { key: k, name: k, isEncrypted: true, error, isLoading };
    }

    const n = noteValues[k];
    if (n) {
      const { title } = n;
      return { key: k, name: title, isEncrypted: false, isLoading };
    }

    return { key: k, name: k, isEncrypted: true, isLoading };
  });

  // run on first render
  useEffect(() => onLogin(), []);

  return (
    <Container className={'h-100 mh-100'}>
      <ProfileView
        context={context}
        onLogin={onLogin}
        onLogout={onLogout}
        onCreateUser={onCreateUser}
      />

      {
        isLoggedIn && (
          <Row className={'p-2 h-100'}>
            <Col className={'p-2'} xs={4}>
              <FileBrowser
                files={files}
                activeNote={activeKey}
                onCreateNote={onCreateNote}
                onNoteSelected={onSelectNote}
              />
            </Col>

            <Col className={'p-2 h-100'}>
              <NoteEditor
                activeNote={activeKey}
                note={note}
                onSave={onSave}
              />
            </Col>
          </Row>
        )
      }

      {
        !isLoggedIn && (
          <Row className={'pt-5'}>
            <Col>
              <Alert variant={'dark'}>Register or login to continue.</Alert>
            </Col>
          </Row>
        )
      }

    </Container>
  );
}

export default connect(
  state => ({
    context: getContext(state),
    isLoggedIn: getIsLoggedIn(state),
    activeKey: getActiveKey(state),
    noteKeys: getNoteKeys(state),
    noteValues: getNoteValues(state),
    errors: getErrors(state),
    loading: getLoading(state),
  }),
  dispatch => ({
    dispatchLogin: () => dispatch(login()),
    dispatchLogout: () => dispatch(logout()),
    dispatchSignUp: () => dispatch(signUp()),
    dispatchNewNote: () => dispatch(newNote()),
    dispatchLoadNote: key => dispatch(loadNote(key)),
    dispatchUpdateNote: ({ key, note }) => dispatch(updateNote({ key, note })),
    dispatchUpdateActiveKey: key => dispatch(updateActiveKey(key)),
  }),
)(App);
