import './App.css';
import { Button, Col, Container, Form, ListGroup, Navbar, Row } from 'react-bootstrap';
import { useState } from 'react';
import { createContext, isLoggedIn, register, createData } from './nk-js';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import { Editor } from '@toast-ui/react-editor';

const ProfileView = ({ context, onCreateUser }) => {
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

const FileBrowser = ({ notes }) => {
  return (
    <ListGroup>
      {
        notes.map((note, i) => (
          <ListGroup.Item key={i}>note</ListGroup.Item>
        ))
      }
    </ListGroup>
  );
};

const getNote = (notes, noteId) => notes.find(n => n.key === noteId);

function App() {
  const [context, setContext] = useState(createContext());
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState('');
  const note = getNote(notes, activeNote);

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
            onCreateUser={async () => {
              const newContext = await register(context);
              setContext(newContext);
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
                >+</Button>
                <FileBrowser notes={notes} />
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
