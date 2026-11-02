// CipherNest - Cryptographic Operations

const MAGIC = new TextEncoder().encode("SFED1");
const ITERATIONS = 600000;

// Derive AES-256 key using PBKDF2-SHA256

async function deriveKey(password, salt) {

    const passwordKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: ITERATIONS,
            hash: "SHA-256"
        },
        passwordKey,
        {
            name: "AES-GCM",
            length: 256
        },
        false,
        ["encrypt", "decrypt"]
    );
}

// Encrypt file data

export async function encryptData(data, password) {

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    const key = await deriveKey(password, salt);

    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: nonce,
            additionalData: MAGIC,
            tagLength: 128
        },
        key,
        data
    );

    // File format:
    // MAGIC (5 bytes) + SALT (16 bytes)
    // + NONCE (12 bytes) + CIPHERTEXT

    const output = new Uint8Array(
        5 + 16 + 12 + encrypted.byteLength
    );

    output.set(MAGIC, 0);
    output.set(salt, 5);
    output.set(nonce, 21);
    output.set(new Uint8Array(encrypted), 33);

    return output;
}

// Decrypt encrypted file data

export async function decryptData(data, password) {

    const input = new Uint8Array(data);

    if (input.length < 49) {
        throw new Error("Invalid encrypted file.");
    }

    // Verify CipherNest file format

    for (let i = 0; i < MAGIC.length; i++) {

        if (input[i] !== MAGIC[i]) {
            throw new Error("Invalid CipherNest file.");
        }
    }

    const salt = input.slice(5, 21);
    const nonce = input.slice(21, 33);
    const ciphertext = input.slice(33);

    const key = await deriveKey(password, salt);

    // AES-GCM automatically verifies the authentication tag

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: nonce,
            additionalData: MAGIC,
            tagLength: 128
        },
        key,
        ciphertext
    );

    return decrypted;
}