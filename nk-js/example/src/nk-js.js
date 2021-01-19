const getKeyMaterial = async password => await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  { name: 'PBKDF2' },
  false,
  ["deriveBits", "deriveKey"]
);

const deriveKey = async (keyMaterial, salt) => await crypto.subtle.deriveKey(
  {
    "name": "PBKDF2",
    salt,
    "iterations": 100000,
    "hash": "SHA-256"
  },
  keyMaterial,
  { "name": "AES-KW", "length": 256},
  true,
  [ "wrapKey", "unwrapKey" ]
);

const serializeKey = async (key, password) => {
  const keyMaterial = await getKeyMaterial(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await deriveKey(keyMaterial, salt);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const wrapped = await crypto.subtle.wrapKey(
    "pkcs8",
    key,
    wrappingKey,
    {
      name: "AES-GCM",
      iv: iv
    }
  );

  return arrayBufferToBase64String(wrapped);
};

const serialize = async (context, password) => {
  const copy = JSON.parse(JSON.stringify(context));

  copy.keys.signing = {};
  copy.keys.signing.privateKey = await serializeKey(context.keys.signing.privateKey, password);
  copy.keys.signing.publicKey = await serializeKey(context.keys.signing.publicKey, password);
  copy.keys.encryption = await serializeKey(context.keys.encryption, password);

  return copy;
};

const deserialize = async (data, password) => {
  const context = JSON.parse(data);

  // todo replace keys with imports

  return context;
};

const generateSigningPair = async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
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

const arrayBufferToBase64String = buffer => btoa(
  String.fromCharCode.apply(
    null,
    new Uint8Array(buffer)));

const exportPublicPEM = async (publicKey) => {
  let exportedPublic;
  try {
    exportedPublic = await crypto.subtle.exportKey('spki', publicKey);
  } catch (error) {
    throw new Error(`Could not export public key: ${error}.`);
  }

  const key = arrayBufferToBase64String(exportedPublic)
    .match(/.{1,64}/g)
    .join('\n');

  return `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
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

const contextWithKeyNames = (context, keyNames) => ({
  ...context,
  keyNames
});

const contextWithUserId = (context, userId) => ({
  ...context,
  userId
});

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

  // export
  const key = await exportPublicPEM(signingKeys.publicKey);

  // create user
  const headers = new Headers();
  headers.append("Content-Type", "text/plain");

  let json;
  try {
    const res = await fetch(
      `${context.url}/user`,
      {
        method: 'post',
        body: key,
        headers,
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

const proveFetch = async (context, url, options) => {
  let json;
  try {
    const res = await fetch(
      `${context.url}/proof/${context.userId}`,
      {
        method: 'post',
      }
    );

    json = await res.json();
  } catch (error) {
    throw new Error(`Could not fetch proof: ${error}.`);
  }

  const { success, error, value } = json;
  if (!success) {
    throw new Error(`Could not fetch proof: ${error}.`);
  }

  // sign
  const signature = await crypto.subtle.sign(
    {
      name: 'RSASSA-PKCS1-v1_5',
      saltLength: 32
    },
    context.keys.signing.privateKey,
    new TextEncoder().encode(value));
  const signatureString = arrayBufferToBase64String(signature);

  // create headers object
  if (!options) {
    options = {};
  }
  if (!options.headers) {
    options.headers = {};
  }

  // append proof + signature
  options.headers['X-Nk-Proof'] = value;
  options.headers['X-Nk-Proof-Sig'] = signatureString;

  return await fetch(url, options);
};

const getKeys = async (context) => {
  let json;
  try {
    const res = await proveFetch(
      context,
      `${context.url}/data/${context.userId}`
    );

    json = await res.json();
  } catch (error) {
    throw new Error(`Could not get keys: ${error}.`);
  }

  const { success, error, keys } = json;
  if (!success) {
    throw new Error(`Could not get keys: ${error}.`);
  }

  return contextWithKeyNames(context, keys);
};

const createData = async (context, keyName, value) => {
  // create Uint8Array from value
  const enc = new TextEncoder();
  const encodedValue = enc.encode(value);

  // encrypt with hard symmetric encryption
  let cipher;
  try {
    cipher = await crypto.subtle.encrypt(
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
      {
        name: 'RSASSA-PKCS1-v1_5',
      },
      context.keys.signing.privateKey,
      new Uint8Array(cipher),
    );
  } catch (error) {
    throw new Error(`Could not sign value: ${error}.`);
  }

  const cipherTextString = arrayBufferToBase64String(cipher);
  const signatureString = arrayBufferToBase64String(signature);

  // send
  let json;
  try {
    const res = await fetch(`${context.url}/data/${context.userId}`,
      {
        method: 'post',
        body: JSON.stringify({
          Key: keyName,
          Payload: cipherTextString,
          Sig: signatureString,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
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

export { isLoggedIn, createContext, register, createData, getKeys, serialize, deserialize };
