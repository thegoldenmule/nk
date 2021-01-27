import './App.css';
import {
  Button, ButtonGroup, ButtonToolbar,
  Col,
  Container,
  Form, FormControl, InputGroup,
  ListGroup, ListGroupItem,
  Nav,
  Navbar, OverlayTrigger,
  Row,
  Spinner, Tooltip
} from 'react-bootstrap';
import { useRef, useState } from 'react';
import { createContext, isLoggedIn, register, createData, getKeys, serialize, deserialize, updateData } from './nk-js';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import { Editor } from '@toast-ui/react-editor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faDownload, faPlus, faSave, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import ProfileView from './profile';

// taken from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
const newKey = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const noteFromParameters = ({ title, body }) => ({ title, body });
const newNote = () => noteFromParameters({ title: 'New Note', body: '' });

const valueToNote = value => JSON.stringify(value);
const noteToValue = note => JSON.stringify(note);

const TextEditor = ({ activeNote, note = {}, onSave }) => {
  const { title, body } = note;

  const ref = useRef(null);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftBody, setDraftBody] = useState(body);

  if (!activeNote) {
    return null;
  }

  return (
    <div>
      <div className={'pb-4'}>
        <Form.Control
          size={'lg'}
          type={'text'}
          placeholder={'Title'}
          value={draftTitle}
          onChange={evt => setDraftTitle(evt.target.value)}
        />
      </div>
      <div className={'pb-4'}>
        <ButtonToolbar className={'justify-content-between'}>
          <ButtonGroup>
            <OverlayTrigger overlay={(
              <Tooltip id={'tt-save'}>Save</Tooltip>
            )}>
              <Button
                onClick={() => onSave(noteFromParameters({ title: draftTitle, body: draftBody }))}
              ><FontAwesomeIcon icon={faSave} /></Button>
            </OverlayTrigger>
            <OverlayTrigger overlay={(
              <Tooltip id={'tt-copy'}>Copy</Tooltip>
            )}>
              <Button variant={'outline-secondary'}><FontAwesomeIcon icon={faCopy} /></Button>
            </OverlayTrigger>
          </ButtonGroup>
          <ButtonGroup>
            <OverlayTrigger overlay={(
              <Tooltip id={'tt-delete'}>Delete</Tooltip>
            )}>
              <Button variant={'outline-danger'}><FontAwesomeIcon icon={faTrash} /></Button>
            </OverlayTrigger>
          </ButtonGroup>
        </ButtonToolbar>
      </div>

      <Editor
        ref={ref}
        initialValue={draftBody}
        placeholder='Start writing'
        previewStyle='vertical'
        height='600px'
        initialEditType='wysiwyg'
        useCommandShortcut={true}
        onChange={() => setDraftBody(ref.current.getInstance().getMarkdown())}
      />
    </div>
  )
}

const FileBrowser = ({
  notes = {}, activeNote, onCreateNote, onNoteSelected,
}) => {
  const listItems = [(
    <ListGroup.Item key={'__new__'}>
      <Button
        variant={'outline-success'}
        onClick={() => onCreateNote()}
      >+ New Note</Button>
    </ListGroup.Item>
  )];

  for (const [k, v] of Object.entries(notes)) {
    listItems.push(
      <ListGroup.Item
        key={k}
        active={activeNote === k}
        onClick={() => onNoteSelected(k)}
      >
        {k}
      </ListGroup.Item>);
  }

  return (
    <div>
      <div className={'pb-4'}>
        <InputGroup>
          <FormControl type={'text'} placeholder={'Search'} size={'lg'} />
          <InputGroup.Append>
            <Button variant={'outline-success'}><FontAwesomeIcon icon={faSearch} /></Button>
          </InputGroup.Append>
        </InputGroup>
      </div>

      <ListGroup>
        {listItems}
      </ListGroup>
    </div>
  );
};

const loadContext = () => createContext();

function App() {
  const [context, setContext] = useState(loadContext());
  const [activeKey, setActiveKey] = useState('');

  const { keyNames, values } = context;
  const note = valueToNote(values[activeKey]);

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

      <Row className={'p-2 h-100'}>
        <Col className={'p-2'} xs={4}>
          <FileBrowser
            notes={values}
            activeNote={activeKey}
            onCreateNote={onCreateNote}
            onNoteSelected={setActiveKey}
          />
        </Col>

        <Col className={'p-2 h-100'}>
          <TextEditor
            activeNote={activeKey}
            note={note}
            onSave={onSave}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
