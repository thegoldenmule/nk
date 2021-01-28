import './App.css';
import {
  Alert,
  Col,
  Container,
  Row
} from 'react-bootstrap';
import { useEffect, useState } from 'react';
import {
  createContext,
  register,
  createData,
  serialize,
  deserialize,
  updateData,
  isLoggedIn,
  getKeys,
  getData
} from './nk-js';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import ProfileView from './profile';
import FileBrowser from './files';
import NoteEditor from './editor';
import { newNote, noteToValue, valueToNote } from './notes';

// taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
const newKey = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const getUnloadedKey = context => {
  const { keyNames, plaintextValues } = context;
  for (const key of keyNames) {
    if (!plaintextValues[key]) {
      return key;
    }
  }
};

function App() {
  const [context, setContext] = useState(createContext());
  const [activeKey, setActiveKey] = useState('');

  const { keyNames, plaintextValues } = context;
  const note = valueToNote(plaintextValues[activeKey]);

  const onLogin = async () => {
    const contextData = localStorage.getItem('_context');
    if (contextData) {
      let newContext = await deserialize(contextData, '111111');
      newContext = await getKeys(newContext);
      setContext(newContext);
      /*
      let unloadedKey = getUnloadedKey(newContext);
      while (unloadedKey) {
        newContext = await getData(newContext, unloadedKey);
        unloadedKey = getUnloadedKey(newContext);
      }
      */
    }
  };

  const onLogout = () => {
    setContext(createContext())
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

  const onSelectNote = async key => {
    const { plaintextValues } = context;
    if (!plaintextValues[key]) {
      const newContext = await getData(context, key);
      setContext(newContext);
    }
  };

  const files = keyNames.map(k => {
    if (plaintextValues[k]) {
      const { title } = valueToNote(plaintextValues[k]);
      return { name: title, isEncrypted: false };
    }

    return { name: k, isEncrypted: true };
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
        isLoggedIn(context) && (
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
