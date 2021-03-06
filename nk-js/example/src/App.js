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
  newNote,
  getNoteKeys,
  getNoteValues, loadNote, updateNote, getNoteStatuses, deleteNote, noteStatus
} from './slices/nkSlice';
import { connect } from 'react-redux';
import { getActiveKey, loadAll, updateActiveKey } from './slices/workspaceSlice';
import { unwrapResult } from '@reduxjs/toolkit';
import { draftSaved, getDraft, newDraft } from './slices/draftSlice';
import { noteFromParametersFactory, noteToValue, valueToNote } from './notes';
import Fuse from 'fuse.js';
import { getQuery } from './slices/filesSlice';
import { getLogin } from './slices/loginSlice';

export const getSortedKeys = (noteKeys, noteValues) => {
  const filteredKeys = [...noteKeys];
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

  return filteredKeys;
};

function App({
  context, isLoggedIn,
  activeKey, dispatchUpdateActiveKey,
  noteKeys, noteValues, noteStatuses,
  draft, query,
  dispatchNewNote, dispatchLoadNote, dispatchUpdateNote, dispatchDeleteNote,
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

  // filter and sort keys
  let filteredKeys;
  if (query) {
    const results = fuseRef.current.search(query);
    filteredKeys = results.map(({ item: { key } }) => key);
  } else {
    // sort list of all keys by last update
    filteredKeys = getSortedKeys(noteKeys, noteValues);
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

  return (
    <Container className={'h-100 mh-100'}>
      <ProfileView
        context={context}
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
    login: getLogin(state),
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
