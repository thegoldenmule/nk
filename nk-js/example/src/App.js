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
  getNoteValues, loadNote, updateNote, getNoteStatuses, noteStatus
} from './slices/nkSlice';
import { connect } from 'react-redux';
import { getActiveKey, updateActiveKey } from './slices/workspaceSlice';
import { unwrapResult } from '@reduxjs/toolkit';
import { draftSaved, getDraft, newDraft } from './slices/draftSlice';
import { noteFromParametersFactory } from './notes';

const getUnloadedKey = (noteStatuses) => {
  for (const [k, status] of Object.entries(noteStatuses)) {
    if (status === noteStatus.unloaded) {
      return k;
    }
  }
};

function App({
  context, isLoggedIn,
  activeKey, dispatchUpdateActiveKey,
  noteKeys, noteValues, noteStatuses,
  draft,
  dispatchLogin, dispatchLogout, dispatchSignUp, dispatchNewNote, dispatchLoadNote, dispatchUpdateNote,
}) {
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

    const { key, note } = payload;
    dispatchUpdateActiveKey({ key, note });
  };

  const onSave = async () => {
    await dispatchUpdateNote({
      key: activeKey,
      note: noteFromParametersFactory({
        title: draft.drafts[activeKey].title,
        body: draft.drafts[activeKey].body,
      }),
    });
  };

  const onSelectNote = async key => {
    let note = noteValues[key];
    if (!note) {
      let res = await dispatchLoadNote(key)

      try {
        res = unwrapResult(res);
        note = res.note;
      } catch (error) {
        // if load note doesn't work, do not update active key
        return;
      }
    }

    dispatchUpdateActiveKey({ key, note });
  };

  const files = noteKeys.map(k => {
    const status = noteStatuses[k];
    const { isDirty } = draft.drafts[k] || {};

    const n = noteValues[k];
    if (n) {
      const { title } = n;
      return { key: k, name: `${title}${isDirty ? '*' : ''}`, status };
    }

    return { key: k, name: k, status };
  });

  // run on first render
  useEffect(() => onLogin(), []);

  const unloadedNote = getUnloadedKey(noteStatuses);
  if (unloadedNote) {
    //dispatchLoadNote(unloadedNote);
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
              <NoteEditor onSave={onSave} />
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
    noteStatuses: getNoteStatuses(state),
    draft: getDraft(state),
  }),
  dispatch => ({
    dispatchLogin: () => dispatch(login()),
    dispatchLogout: () => dispatch(logout()),
    dispatchSignUp: () => dispatch(signUp()),
    dispatchNewNote: () => dispatch(newNote()),
    dispatchLoadNote: key => dispatch(loadNote(key)),
    dispatchUpdateNote: async ({ key, note }) => {
      const res = await dispatch(updateNote({ key, note }));
      dispatch(draftSaved(key))
      return res;
    },
    dispatchUpdateActiveKey: ({ key, note }) => {
      const { title, body } = note;
      dispatch(updateActiveKey(key));
      dispatch(newDraft({ key, title, body }));
    },
  }),
)(App);
