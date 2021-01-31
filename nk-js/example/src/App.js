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
  getNoteValues, loadNote, updateNote, getNoteStatuses, noteStatus, deleteNote
} from './slices/nkSlice';
import { connect } from 'react-redux';
import { getActiveKey, loadAll, updateActiveKey } from './slices/workspaceSlice';
import { unwrapResult } from '@reduxjs/toolkit';
import { draftSaved, getDraft, newDraft } from './slices/draftSlice';
import { noteFromParametersFactory } from './notes';
import { getKeys } from './nk-js';

function App({
  context, isLoggedIn,
  activeKey, dispatchUpdateActiveKey,
  noteKeys, noteValues, noteStatuses,
  draft,
  dispatchLogin, dispatchLogout, dispatchSignUp, dispatchNewNote, dispatchLoadNote, dispatchUpdateNote, dispatchDeleteNote,
}) {
  // sort list of keys by last update
  const sortedKeys = [...noteKeys];
  sortedKeys.sort((i, j) => {
    const a = noteValues[i];
    const b = noteValues[j];

    if (!a) {
      return 1;
    }

    if (!b) {
      return -1;
    }

    return b.lastUpdatedAt - a.lastUpdatedAt;
  });

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

  const onDelete = async () => {
    await dispatchDeleteNote(activeKey);

    // select next note
    for (let i = 0, len = sortedKeys.length; i < len; i++) {
      const k = sortedKeys[i];
      if (k !== activeKey) {
        return await dispatchUpdateActiveKey({
          key: k,
          note: noteValues[k],
        });
      }
    }
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

  const files = sortedKeys.map(k => {
    const status = noteStatuses[k];
    const { isDirty } = draft.drafts[k] || {};
    const { lastUpdatedAt } = noteValues[k] || {};

    const n = noteValues[k];
    if (n) {
      const { title } = n;
      return { key: k, name: `${title}${isDirty ? '*' : ''}`, status, lastUpdatedAt };
    }

    return { key: k, name: k, status, lastUpdatedAt };
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
              <NoteEditor onSave={onSave} onDelete={onDelete} />
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
    dispatchLogin: async () => {
      const res = await dispatch(login());

      let ctx;
      try {
        ctx = await unwrapResult(res);
      } catch (error) {
        return;
      }

      await dispatch(loadAll(ctx.keyNames));
    },
    dispatchLogout: () => dispatch(logout()),
    dispatchSignUp: () => dispatch(signUp()),
    dispatchNewNote: () => dispatch(newNote()),
    dispatchLoadNote: key => dispatch(loadNote(key)),
    dispatchUpdateNote: async ({ key, note }) => {
      const res = await dispatch(updateNote({ key, note }));
      dispatch(draftSaved(key))
      return res;
    },
    dispatchDeleteNote: async (key) => {
      await dispatch(deleteNote(key));
    },
    dispatchUpdateActiveKey: ({ key, note }) => {
      dispatch(updateActiveKey(key));
      dispatch(newDraft({ key, note }));
    },
  }),
)(App);
