import './App.css';
import { Button, Col, Container, Form, ListGroup, Navbar, Row } from 'react-bootstrap';
import { useState } from 'react';
import { createContext, isLoggedIn, register, createData, getKeys, serialize, deserialize } from './nk-js';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import { Editor } from '@toast-ui/react-editor';
import { ArrowSwitchIcon, PlusIcon } from '@primer/octicons-react';

const ProfileView = ({ context, onCreateUser, onLogin }) => {
  return (
    <Container>
      <Row>
        <Col>
          {
            isLoggedIn(context)
              ? <p>{`Logged in. UserId: '${context.userId}'.`}</p>
              : <Button onClick={() => onCreateUser()}>Create Account</Button>
          }
        </Col>
        <Col>
          {
            !isLoggedIn(context) && (
              <Button
                onClick={() => onLogin('111111')}
              >Login
              </Button>
            )
          }
        </Col>
      </Row>
    </Container>
  )
};

const TextEditor = ({ activeNote }) => {
  if (!activeNote) {
    return null;
  }

  return (
    <Container>
      <Row>
        <Col>
          <Form>
            <Form.Control size="lg" type="text" placeholder="Title" />
          </Form>
        </Col>
      </Row>
      <Row>
        <Col>
          <Editor
            initialValue=""
            placeholder="Start writing"
            previewStyle="vertical"
            height="600px"
            initialEditType="wysiwyg"
            useCommandShortcut={true}
          />
        </Col>
      </Row>
    </Container>
  )
}

const FileBrowser = ({ notes, activeNote, onNoteSelected }) => {
  return (
    <ListGroup>
      {
        notes.map((note, i) => (
          <ListGroup.Item key={i} action active={i === activeNote} onClick={() => onNoteSelected(note)}>{note}</ListGroup.Item>
        ))
      }
    </ListGroup>
  );
};

const getNote = (notes, noteId) => notes.find(n => n.key === noteId);

/**
 * notes: [
 * {
 *   "name",
 *   "value"
 * },
 * ...]
 *
 */

const loadContext = () => createContext();

function App() {
  const [context, setContext] = useState(loadContext());
  const { keyNames } = context;
  const [activeNote, setActiveNote] = useState('');
  //const note = getNote(notes, activeNote);

  return (
    <div style={{ paddingTop: '20px' }}>
      <Container>
        <Row>
          <Navbar>
            <Navbar.Brand>Nk-js Example</Navbar.Brand>
          </Navbar>
        </Row>
        <Row>
          <ProfileView
            context={context}
            onLogin={async password => {
              const contextData = localStorage.getItem('_context');
              const newContext = deserialize(contextData, password);
              setContext(newContext);
            }}
            onCreateUser={async () => {
              const newContext = await register(context);
              setContext(newContext);

              // TODO: ask for passphrase
              const serialized = await serialize(newContext, '111111');

              // save!
              localStorage.setItem('_context', serialized);
            }}
          />
        </Row>
        {
          isLoggedIn(context) && (
            <Row>
              <Col xs={3}>
                <Button
                  onClick={async () => {
                    const newContext = await createData(context, "Test", "New Note");
                    setContext(newContext);
                  }}
                ><PlusIcon /></Button>
                <Button
                  variant='secondary'
                  onClick={async() => {
                    const newContext = await getKeys(context);
                    setContext(newContext);
                  }}
                ><ArrowSwitchIcon /></Button>
                <FileBrowser activeNote={activeNote} notes={keyNames} />
              </Col>
              <Col>
                <TextEditor activeNote={activeNote} />
              </Col>
            </Row>
          )
        }
      </Container>
    </div>
  );
}

export default App;
