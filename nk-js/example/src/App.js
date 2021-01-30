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
  updateContext,
  newNote,
  getNoteKeys,
  getNoteValues
} from './slices/nkSlice';
import { connect } from 'react-redux';
import { getActiveKey, updateActiveKey } from './slices/workspaceSlice';

const getUnloadedKey = context => {
  const { keyNames, plaintextValues } = context;
  for (const key of keyNames) {
    if (!plaintextValues[key]) {
      return key;
    }
  }
};

function App({
  context, isLoggedIn, dispatchUpdateContext,
  activeKey, dispatchUpdateActiveKey,
  noteValues, noteKeys,
  dispatchLogin, dispatchLogout, dispatchSignUp, dispatchNewNote,
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
    await dispatchNewNote();
  };

  const onSave = async updatedNote => {
    /*const newContext = await updateData(context, activeKey, noteToValue(updatedNote));
    setContext(newContext);*/
  };

  const onSelectNote = async key => {
    /*const { plaintextValues } = context;
    if (!plaintextValues[key]) {
      const newContext = await getData(context, key);
      setContext(newContext);
    }*/
  };

  const files = noteKeys.map(k => {
    const n = noteValues[k];
    if (n) {
      const { title } = n;
      return { name: title, isEncrypted: false };
    }

    return { name: k, isEncrypted: true };
  });

  // run on first render
  useEffect(() => onLogin(), []);

  const unloadedKey = getUnloadedKey(context);
  if (unloadedKey) {
    //getData(context, unloadedKey).then(setContext);
  }

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
  }),
  dispatch => ({
    dispatchLogin: () => dispatch(login()),
    dispatchLogout: () => dispatch(logout()),
    dispatchSignUp: () => dispatch(signUp()),
    dispatchNewNote: () => dispatch(newNote()),
    dispatchUpdateContext: ctx => dispatch(updateContext(ctx)),
    dispatchUpdateActiveKey: key => dispatch(updateActiveKey(key)),
  }),
)(App);
