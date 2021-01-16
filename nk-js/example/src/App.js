import './App.css';
import { Button, Col, Container, Navbar, Row } from 'react-bootstrap';
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

const TextEditor = ({ isEnabled }) => (
  isEnabled
    ? <Editor
        initialValue="hello react editor world!"
        previewStyle="vertical"
        height="600px"
        initialEditType="wysiwyg"
        useCommandShortcut={true}
      />
    : <p>Generate a key to start.</p>
)

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
        <Row>
          <Container>
            <TextEditor isEnabled={keyPair !== undefined}/>
          </Container>
        </Row>
      </Container>
    </div>
  );
}

export default App;
