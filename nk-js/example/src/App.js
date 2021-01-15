import './App.css';
import { Button, Col, Container, Navbar, Row } from 'react-bootstrap';
import { useState } from 'react';

const KeyGenView = ({ onGenKey, keyPair }) => {
  console.log(keyPair)
  return (
    <Container>
      <Button onClick={() => onGenKey()}>Generate Key Pair</Button>
      <p>{keyPair ? 'Key generated.' : 'No key found.'}</p>
    </Container>
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
      </Container>
    </div>
  );
}

export default App;
