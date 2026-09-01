/**
 * crypto.js
 * ---------
 * Vaultify's Zero-Knowledge Crypto Library — frontend copy.
 *
 * Runs entirely in the browser. The Master Password and Encryption
 * Key NEVER get sent anywhere. Only the Auth Key (a one-way-derived
 * hex string) and the encrypted blob ever reach the server.
 */

async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveKey", "deriveBits"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

/**
 * Derives the Auth Key — a value safe to send to the server for
 * login verification. Unlike the Encryption Key (an AES CryptoKey
 * object that can never leave the browser), this needs to travel
 * over the network as plain text, so we derive it as a hex string
 * using a SEPARATE PBKDF2 pass with different "info" mixed into the
 * password — this keeps it cryptographically unrelated to the real
 * Encryption Key, even though both come from the same password+salt.
 */
async function deriveAuthKey(password, salt) {
  const encoder = new TextEncoder();
  // Mixing in a fixed label before deriving ensures this produces a
  // completely different key than deriveKeyFromPassword(), even with
  // the identical password and salt.
  const passwordBytes = encoder.encode("auth:" + password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );

  // Convert the raw bytes into a hex string, since that's what we
  // can actually send in JSON over the network.
  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}

// Converts a salt (Uint8Array) to/from a string, so it can be sent
// over the network and stored in the database as plain text.
function saltToHex(salt) {
  return Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToSalt(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function encryptData(key, data) {
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(JSON.stringify(data));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    plaintextBytes
  );

  return {
    iv: Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join(""),
    ciphertext: Array.from(new Uint8Array(ciphertextBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  };
}

async function decryptData(key, ivHex, ciphertextHex) {
  const iv = hexToSalt(ivHex);
  const ciphertext = hexToSalt(ciphertextHex);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBuffer));
}

export {
  deriveKeyFromPassword,
  deriveAuthKey,
  generateSalt,
  saltToHex,
  hexToSalt,
  encryptData,
  decryptData,
};