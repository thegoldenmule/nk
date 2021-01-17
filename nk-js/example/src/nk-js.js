const generateSigningPair = async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-512',
    },
    true,
    ['sign', 'verify'],
  );

  return pair;
};

const generateSymmetricKey = async () => await crypto.subtle.generateKey(
  {
    name: 'AES-GCM',
    length: 256,
  },
  true,
  ['encrypt', 'decrypt']);

const exportPublicKey = async (publicKey) => {
  let exportedPublic;
  try {
    exportedPublic = await crypto.subtle.exportKey('spki', publicKey);
  } catch (error) {
    throw new Error(`Could not export public key: ${error}.`);
  }

  return btoa(
    String.fromCharCode.apply(
      null,
      new Uint8Array(exportedPublic)));
};

const aesParameters = () => ({
  name: 'AES-GCM',
  iv: window.crypto.getRandomValues(new Uint8Array(12)),
  tagLength: 128,
});

const createContext = () => ({
  url: 'http://localhost:5000',
  userId: undefined,
  keys: {
    signing: undefined,
    encryption: undefined,
  },
  keyNames: [],
});

const contextWithKeys = (context, signing, encryption) => ({
  ...context,
  keys: {
    signing,
    encryption,
  },
});

const contextWithUserId = (context, userId) => ({
  ...context,
  userId
});

const createContextFrom = data => createContext();

const isLoggedIn = context => context.userId !== undefined;

const register = async (context) => {
  // generate signing pair
  let signingKeys;
  try {
    signingKeys = await generateSigningPair();
  } catch (error) {
    throw new Error(`Could not generate signing key pair: ${error}.`);
  }

  // generate symmetric key
  let encryptionKey;
  try {
    encryptionKey = await generateSymmetricKey();
  } catch (error) {
    throw new Error(`Could not generate encryption key: ${error}.`);
  }

  // create user
  let json;
  try {
    const res = await fetch(
      `${context.url}/user`,
      {
        method: 'post',
        body: exportPublicKey(signingKeys.publicKey),
      });
    json = await res.json();
  } catch (e) {
    throw e;
  }

  return contextWithKeys(
    contextWithUserId(context, json.userId),
    signingKeys,
    encryptionKey,
  );
};

const createData = async (context, keyName, value) => {
  const enc = new TextEncoder();
  const encodedValue = enc.encode(value);

  // encrypt
  let cipherText;
  try {
    cipherText = await crypto.subtle.encrypt(
      aesParameters(),
      context.keys.encryption,
      encodedValue
    );
  } catch (error) {
    throw new Error(`Could not encrypt value: ${error}.`);
  }

  // sign ciphertext with signing key
  let signature;
  try {
    signature = await window.crypto.subtle.sign(
      'RSA-OAEP',
      context.keys.signing.privateKey,
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
          Key: keyName,
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
    keyNames: [...context.keyNames, keyName],
  };
};

export { isLoggedIn, createContext, createContextFrom, register, createData };
