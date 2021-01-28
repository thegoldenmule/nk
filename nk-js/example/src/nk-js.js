const uintBufferToBase64String = buffer => btoa(String.fromCharCode.apply(null, buffer));
const arrayBufferToBase64String = buffer => uintBufferToBase64String(new Uint8Array(buffer));
const base64StringToUintBuffer = str => {
  const binary = atob(str);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

const arrayBufferToString = buf => {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
};

const stringToArrayBuffer = str => {
  const buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }

  return buf;
};

const getKeyMaterial = password => crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  { name: 'PBKDF2' },
  false,
  ["deriveBits", "deriveKey"]
);

const deriveKey = (keyMaterial, salt, alg) => crypto.subtle.deriveKey(
  {
    "name": "PBKDF2",
    salt,
    "iterations": 100000,
    "hash": "SHA-256"
  },
  keyMaterial,
  { "name": alg, "length": 256},
  true,
  [ "wrapKey", "unwrapKey" ]
);

const deserializePrivateKey = async ({ bytes }, password) => {
  const str2ab = (str) => {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  };

  // todo: decrypt bytes

  const binaryDerString = window.atob(bytes);
  const binaryDer = str2ab(binaryDerString);

  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-512',
    },
    true,
    ['sign']);
};

async function getUnwrappingKey(password, saltBuffer) {
  const keyMaterial = await getKeyMaterial(password);

  return window.crypto.subtle.deriveKey(
    {
      "name": "PBKDF2",
      salt: saltBuffer,
      "iterations": 100000,
      "hash": "SHA-256"
    },
    keyMaterial,
    { "name": "AES-KW", "length": 256},
    true,
    [ "wrapKey", "unwrapKey" ]
  );
}

const deserializeEncryptionKey = async ({ salt, bytes }, password) => {
  const saltBuffer = new Uint8Array(stringToArrayBuffer(salt));
  const wrappedKeyBuffer = stringToArrayBuffer(bytes);

  const unwrappingKey = await getUnwrappingKey(password, saltBuffer);

  return window.crypto.subtle.unwrapKey(
    "raw",
    wrappedKeyBuffer,
    unwrappingKey,
    "AES-KW",
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
};

const serializePrivateKey = async (key, password) => {
  // TODO: encrypt
  const exportKey = await crypto.subtle.exportKey("pkcs8", key);

  const payload = {
    bytes: arrayBufferToBase64String(exportKey),
  };

  return payload;
}

const serializeEncryptionKey = async (key, password) => {
  const keyMaterial = await getKeyMaterial(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const wrappingKey = await deriveKey(keyMaterial, salt, 'AES-KW');

  const wrapped = await crypto.subtle.wrapKey(
    'raw',
    key,
    wrappingKey,
    'AES-KW',
  );

  console.log(salt);
  console.log(wrapped)

  return {
    salt: arrayBufferToString(salt.buffer),
    bytes: arrayBufferToString(wrapped),
  };
};

const serialize = async (context, password) => {
  const copy = JSON.parse(JSON.stringify(context));

  copy.keys.signing = {};
  try {
    copy.keys.signing.privateKey = await serializePrivateKey(context.keys.signing.privateKey, password);
  } catch (error) {
    console.log('Could not serialize private key.', error);
  }

  try {
    copy.keys.encryption = await serializeEncryptionKey(context.keys.encryption, password);
  } catch (error) {
    console.log('Could not serialize encryption key.', error)
  }

  return JSON.stringify(copy);
};

const deserialize = async (data, password) => {
  const context = JSON.parse(data);

  const { signing: { privateKey }, encryption } = context.keys;
  context.keys = {
    signing: {},
  };

  try {
    context.keys.signing.privateKey = await deserializePrivateKey(privateKey, password);
  } catch (error) {
    console.error(`Could not create private key: ${error}.`);
  }

  try {
    context.keys.encryption = await deserializeEncryptionKey(encryption, password);
  } catch (error) {
    console.log('Could not create encryption key.', error)
  }

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
  url: 'https://nk-server.thegoldenmule.com',
  userId: undefined,
  keys: {
    signing: undefined,
    encryption: undefined,
  },
  keyNames: [],
  plaintextValues: {},
});

const contextWithConfig = (context, { url }) => ({
  ...context,
  url
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
  keyNames: [...new Set(keyNames)],
});

const contextWithUserId = (context, userId) => ({
  ...context,
  userId,
});

const contextWithValue = (context, keyName, value) => contextWithKeyNames({
  ...context,
  plaintextValues: {
    ...context.plaintextValues,
    [keyName]: value
  }
}, [...context.keyNames, keyName]);

const isLoggedIn = context => context.userId !== undefined;

const encrypt = async (context, value) => {
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

  return {
    value: arrayBufferToBase64String(cipher),
    signature: arrayBufferToBase64String(signature),
  }
};

const decrypt = async (context, value) => {
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt(
      aesParameters(),
      context.keys.encryption,
      base64StringToUintBuffer(value).buffer,
    );
  } catch (error) {
    throw new Error(`Could not decrypt value: ${error}.`);
  }

  return plaintext;
};

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
  const { value: cipherValue, signature } = await encrypt(context, value);

  // send
  let json;
  try {
    const res = await fetch(`${context.url}/data/${context.userId}`,
      {
        method: 'post',
        body: JSON.stringify({
          Key: keyName,
          Payload: cipherValue,
          Sig: signature,
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

  return contextWithValue(context, keyName, value);
};

const getData = async (context, keyName) => {
  let json;
  try {
    const res = await proveFetch(
      context,
      `${context.url}/data/${context.userId}/${keyName}`
    );

    json = await res.json();
  } catch (error) {
    throw new Error(`Could not get data: ${error}.`);
  }

  const { success, value: cipherValue } = json;
  if (!success) {
    throw new Error(`Could not get data.`);
  }

  const plaintext = await decrypt(context, cipherValue);
  return contextWithValue(context, keyName, plaintext);
};

const updateData = async (context, keyName, value) => {
  const { value: cipherValue, signature } = await encrypt(context, value);

  // send
  let json;
  try {
    const res = await fetch(`${context.url}/data/${context.userId}/${keyName}`,
      {
        method: 'put',
        body: JSON.stringify({
          Key: keyName,
          Payload: cipherValue,
          Sig: signature,
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

    json = await res.json();
  } catch (error) {
    throw new Error(`Could not update data: ${error}.`);
  }

  if (!json.success) {
    throw new Error('Could not update data: server returned false.');
  }

  return contextWithValue(context, keyName, value);
};

export { createContext, contextWithConfig, isLoggedIn, register, createData, updateData, getData, getKeys, serialize, deserialize };
