import './App.css';
import { Button, Col, Container, Form, ListGroup, Navbar, Row } from 'react-bootstrap';
import { useState } from 'react';
import 'codemirror/lib/codemirror.css';
import '@toast-ui/editor/dist/toastui-editor.css';

import { Editor } from '@toast-ui/react-editor';

const KeyGenView = ({ onGenKey, keyPair }) => {
  return (
    <Container>
      {
        keyPair
          ? <p>Logged in.</p>
          : <Button onClick={() => onGenKey()}>Generate Key Pair</Button>
      }
    </Container>
  )
};

const TextEditor = () => {

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

const FileBrowser = () => {
  return (
    <ListGroup>
      <ListGroup.Item>Hello World</ListGroup.Item>
      <ListGroup.Item>Secret Note</ListGroup.Item>
    </ListGroup>
  )
};

const generateKeyPair = async () => await crypto.subtle.generateKey(
  {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
  },
  true,
  ["encrypt", "decrypt"]
);

function App() {
  const [keyPair, setKeyPair] = useState();
  const isLoggedIn = keyPair !== undefined;

  return (
    <div style={{ paddingTop: '20px' }}>
      <Container>
        <Row>
          <Navbar>
            <Navbar.Brand>Nk-js Example</Navbar.Brand>
          </Navbar>
        </Row>
        <Row>
          <KeyGenView
            keyPair={keyPair}
            onGenKey={async () => {
              const result = await generateKeyPair();
              setKeyPair(result);
            }}
          />
        </Row>
        {
          isLoggedIn && (
            <Row>
              <Col xs={3}>
                <FileBrowser/>
              </Col>
              <Col>
                <TextEditor/>
              </Col>
            </Row>
          )
        }
      </Container>
    </div>
  );
}

export default App;
