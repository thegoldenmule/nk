const generateKeyPair = async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  console.log('Generated key.');

  const api = await crypto.subtle.exportKey('pkcs8', pair.publicKey);

  console.log('Exported key.');

  return { ...pair, api };
};

const aesParameters = () => ({
  name: 'AES-GCM',
  iv: window.crypto.getRandomValues(new Uint8Array(12)),
  tagLength: 128,
});

const generateSymmetricKey = async () => await crypto.subtle.generateKey(
    aesParameters(),
    true,
    ['encrypt', 'decrypt']);

const createContext = () => ({
  url: 'http://localhost:5000',
  keys: [],
});

const createContextFrom = data => createContext();

const isLoggedIn = context => context.userId !== undefined;

const register = async (context) => {
  // generate pair
  let pair;
  try {
    pair = await generateKeyPair();
  } catch (error) {
    throw new Error(`Could not generate key pair: ${error}.`)
  }

  // generate symmetric key
  const symmetricKey = await generateSymmetricKey();

  // create user
  let json;
  try {
    const res = await fetch(
      `${context.url}/user`,
      {
        method: 'post',
        body: pair.api,
      });
    json = await res.json();
  } catch (e) {
    throw e;
  }

  return {
    ...context,
    pair,
    symmetricKey,
    userId: json.userId,
  };
};

const createData = async (context, key, value) => {
  const enc = new TextEncoder();
  const encodedValue = enc.encode(value);

  // encrypt
  let cipherText;
  try {
    cipherText = await crypto.subtle.encrypt(
      aesParameters(),
      context.symmetricKey,
      encodedValue
    );
  } catch (error) {
    throw new Error(`Could not encrypt value: ${error}.`);
  }

  // sign ciphertext
  let signature;
  try {
    signature = await window.crypto.subtle.sign(
      'RSA-OAEP',
      context.pair.private,
      enc.encode(cipherText),
    )
  } catch (error) {
    throw new Error(`Could not sign value: ${error}.`)
  }

  // send
  let json;
  try {
    const res = await fetch(`${context.url}/data/${context.userId}`,
      {
        method: 'post',
        body: JSON.stringify({
          Key: key,
          Payload: cipherText,
          Sig: signature
        })
      });

    json = await res.json();
  } catch (error) {
    throw new Error(`Could not create data: ${error}.`);
  }

  if (!json.success) {
    throw new Error('Could not create data: server returned false.');
  }

  return {
    ...context,
    keys: [...context.keys, key],
  };
};

export { isLoggedIn, createContext, createContextFrom, register, createData };
