import './App.css';
import {
  Alert,
  Col,
  Container,
  Row
} from 'react-bootstrap';
import { Component, useState } from 'react';
import { createContext, register, createData, serialize, deserialize, updateData, isLoggedIn } from './nk-js';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import ProfileView from './profile';
import FileBrowser from './files';
import NoteEditor from './editor';
import { newNote, noteToValue, valueToNote } from './notes';

// taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
const newKey = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const loadContext = () => createContext();

function App() {
  const [context, setContext] = useState(loadContext());
  const [activeKey, setActiveKey] = useState('');

  const { keyNames, plaintextValues } = context;
  const note = valueToNote(plaintextValues[activeKey]);

  const onLogin = async password => {
    const contextData = localStorage.getItem('_context');
    const newContext = deserialize(contextData, password);
    setContext(newContext);
  };

  const onCreateUser = async () => {
    const newContext = await register(context);
    setContext(newContext);

    // TODO: ask for passphrase
    const serialized = await serialize(newContext, '111111');

    // save!
    localStorage.setItem('_context', serialized);
  };

  const onCreateNote = async () => {
    const key = newKey();
    const newContext = await createData(context, key, noteToValue(newNote()));

    setContext(newContext);
    setActiveKey(key);
  };

  const onSave = async updatedNote => {
    const newContext = await updateData(context, activeKey, noteToValue(updatedNote));
    setContext(newContext);
  };

  const files = keyNames.map(k => {
    if (plaintextValues[k]) {
      const { title } = valueToNote(plaintextValues[k]);
      return { name: title, isEncrypted: false };
    }

    return { name: k, isEncrypted: true };
  });

  return (
    <Container className={'h-100 mh-100'}>
      <ProfileView
        context={context}
        onLogin={onLogin}
        onLogout={() => {
          // TODO
        }}
        onCreateUser={onCreateUser}
      />

      {
        isLoggedIn(context) && (
          <Row className={'p-2 h-100'}>
            <Col className={'p-2'} xs={4}>
              <FileBrowser
                files={files}
                activeNote={activeKey}
                onCreateNote={onCreateNote}
                onNoteSelected={setActiveKey}
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
        !isLoggedIn(context) && (
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

export default App;
