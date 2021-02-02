import './App.css';
import {
  Alert,
  Col,
  Container,
  Row
} from 'react-bootstrap';
import { useEffect, useRef } from 'react';

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
import { noteFromParametersFactory, noteToValue, valueToNote } from './notes';
import Fuse from 'fuse.js';
import { getQuery } from './slices/filesSlice';

function App({
  context, isLoggedIn,
  activeKey, dispatchUpdateActiveKey,
  noteKeys, noteValues, noteStatuses,
  draft, query,
  dispatchLogin, dispatchLogout, dispatchSignUp, dispatchNewNote, dispatchLoadNote, dispatchUpdateNote, dispatchDeleteNote,
}) {
  // create a search index
  const fuseRef = useRef(new Fuse(
    [],
    {
      includeScore: true,
      ignoreLocation: true,
      shouldSort: true,
      keys: ['title', 'body',],
    }));

  // update index when note statuses change
  useEffect(() => {
    const collection = noteKeys.map(key => ({ key, ...(noteValues[key] || {}) }));
    fuseRef.current.setCollection(collection);
  }, [noteStatuses]);

  let filteredKeys;
  if (query) {
    const results = fuseRef.current.search(query);
    filteredKeys = results.map(({ item: { key } }) => key);
  } else {
    // sort list of all keys by last update
    filteredKeys = [...noteKeys];
    filteredKeys.sort((i, j) => {
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
  }

  // generate file entries from list
  const files = filteredKeys.map(k => {
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

  const onLogin = async () => {
    await dispatchLogin();
  };

  const onLogout = async () => {
    await dispatchLogout();
  };

  const onCreateUser = async () => {
    await dispatchSignUp();
  };

  const onCreateNote = async from => {
    const res = await dispatchNewNote(from);

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

  const onDuplicate = async key => {
    const source = valueToNote(noteToValue(noteValues[key]));
    source.title += ' (Copy)';

    return await onCreateNote(source);
  };

  const onDelete = async () => {
    await dispatchDeleteNote(activeKey);

    // select next note
    for (let i = 0, len = filteredKeys.length; i < len; i++) {
      const k = filteredKeys[i];
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
              <NoteEditor onSave={onSave} onDuplicate={onDuplicate} onDelete={onDelete} />
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
    query: getQuery(state),
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
    dispatchNewNote: from => dispatch(newNote({ from })),
    dispatchLoadNote: key => dispatch(loadNote(key)),
    dispatchUpdateNote: async ({ key, note }) => {
      const res = await dispatch(updateNote({ key, note }));

      let value;
      try {
        value = await unwrapResult(res);
      } catch (error) {
        return res;
      }

      const { note: updatedNote } = value;
      dispatch(draftSaved({ note: updatedNote, key }));

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
