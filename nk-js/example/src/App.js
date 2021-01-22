import './App.css';
import { Button, ButtonGroup, Col, Container, Form, InputGroup, ListGroup, Navbar, Row } from 'react-bootstrap';
import { useRef, useState } from 'react';
import { createContext, isLoggedIn, register, createData, getKeys, serialize, deserialize, updateData } from './nk-js';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import { Editor } from '@toast-ui/react-editor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faPlus, faSave } from '@fortawesome/free-solid-svg-icons';
import { FileBadgeIcon } from '@primer/octicons-react';

// taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
const newKey = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const newNote = () => ({
  title: '',
  body: '',
});
const valueToNote = value => JSON.stringify(value);
const noteToValue = note => JSON.stringify(note);

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
                disabled
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

const TextEditor = ({ activeNote, note = {}, onSave }) => {
  const { title, body } = note;

  const ref = useRef(null);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftBody, setDraftBody] = useState(body);

  if (!activeNote) {
    return null;
  }

  return (
    <Container className={"p-2"}>
      <Row className={"p-2"}>
        <Col>
          <Button
            onClick={async () => onSave({ title: draftTitle, body: draftBody })}
          >
            <FontAwesomeIcon icon={faSave} />
          </Button>
        </Col>
      </Row>
      <Row className={"p-2"}>
        <Col>
          <Form>
            <Form.Control
              size="lg"
              type="text"
              placeholder="Title"
              value={title}
              onChange={evt => setDraftTitle(evt.target.value)}
            />
          </Form>
        </Col>
      </Row>
      <Row className={"p-2"}>
        <Col>
          <Editor
            ref={ref}
            initialValue={body}
            placeholder="Start writing"
            previewStyle="vertical"
            height="600px"
            initialEditType="wysiwyg"
            useCommandShortcut={true}
            onChange={() => setDraftBody(ref.current.getInstance().getMarkdown())}
          />
        </Col>
      </Row>
    </Container>
  )
}

const FileBrowser = ({
  notes, activeNote,
  onCreateNote, onRefreshNotes, onNoteSelected
}) => {
  return (
    <Container className={"p-2"}>
      <Row className={"p-2"}>
        <Button
          onClick={onCreateNote}
        ><FontAwesomeIcon icon={faPlus} /></Button>
        <Button
          variant='secondary'
          onClick={onRefreshNotes}
        ><FontAwesomeIcon icon={faDownload} /></Button>
      </Row>
      <Row className={"p-2"}>
        <ListGroup>
          {
            notes.map((note, i) => (
              <ListGroup.Item
                key={i}
                action
                active={note === activeNote}
                onClick={() => onNoteSelected(note)}
              >
                {note}
              </ListGroup.Item>
            ))
          }
        </ListGroup>
      </Row>
    </Container>
  );
};

const loadContext = () => createContext();

function App() {
  const [context, setContext] = useState(loadContext());
  const [activeKey, setActiveKey] = useState('');

  const { keyNames, values } = context;
  const note = valueToNote(values[activeKey]);

  return (
    <div style={{ paddingTop: '20px' }}>
      <Container>
        <Row className="p-2">
          <Navbar>
            <Navbar.Brand>Nk-js Example</Navbar.Brand>
          </Navbar>
        </Row>
        <Row className="p-2">
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
            <Row className="p-2">
              <Col xs={3} className="p-2">
                <FileBrowser
                  notes={keyNames}
                  activeNote={activeKey}
                  onCreateNote={async () => {
                    const key = newKey();
                    const newContext = await createData(context, key, noteToValue(newNote()));

                    setContext(newContext);
                    setActiveKey(key);
                  }}
                  onRefreshNotes={async() => {
                    const newContext = await getKeys(context);
                    setContext(newContext);
                  }}
                  onNoteSelected={note => setActiveKey(note)}
                />
              </Col>
              <Col className="p-2">
                <TextEditor
                  activeNote={activeKey}
                  note={note}
                  onSave={async updatedNote => {
                    const newContext = await updateData(context, activeKey, noteToValue(updatedNote))
                    setContext(newContext);
                  }}
                />
              </Col>
            </Row>
          )
        }
      </Container>
    </div>
  );
}

export default App;
