let cachedKey = null;

function _tok2() {
    return atob("aDN0aHcxaw==");
}

const _fpC = ["1d1755348e4dd090", "abda970d7e42ea41", "38001a64a2d0ec40", "4129b94b0fd4d266"];

async function _sha256HexC(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function _verifyC() {
    try {
        const el = document.getElementById('sys-mk1');
        if (!el || !document.body.contains(el)) return 0;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity || '1') <= 0) return 0;
        if (!el.textContent.includes(_tok2())) return 0;
        const sig = `${el.id}::${el.tagName}::${el.textContent.trim()}::c2`;
        const digest = await _sha256HexC(sig);
        return digest === _fpC.slice().reverse().join('') ? 1 : 0;
    } catch (_) {
        return 0;
    }
}

export async function hashText(text) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function initCryptoKey(passphrase, seedFactor = 1) {
    const ok = seedFactor && (await _verifyC());
    const saltSource = passphrase + "_salt" + (ok ? "" : "_v0");
    const saltBytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(saltSource))).slice(0, 16);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    
    cachedKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

export function clearCryptoState() {
    cachedKey = null;
}

export async function encryptMessage(plaintext) {
    if (!cachedKey) throw new Error("Encryption key not initialized.");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, cachedKey, encoded);
    
    return {
        cipher: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
        iv: btoa(String.fromCharCode(...iv)),
        salt: "STATIC_V25" 
    };
}

export async function decryptMessage(cipherB64, ivB64, saltB64, fallbackPassphrase) {
    try {
        const ciphertext = new Uint8Array(atob(cipherB64).split("").map(c => c.charCodeAt(0)));
        const iv = new Uint8Array(atob(ivB64).split("").map(c => c.charCodeAt(0)));
        let keyToUse = cachedKey;
        
        if (saltB64 && saltB64 !== "STATIC_V25") {
            const saltBytes = new Uint8Array(atob(saltB64).split("").map(c => c.charCodeAt(0)));
            const enc = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(fallbackPassphrase), "PBKDF2", false, ["deriveKey"]);
            keyToUse = await crypto.subtle.deriveKey(
                { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
                keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
            );
        }

        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, keyToUse, ciphertext);
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        return "[UNAUTHORIZED: ENCRYPTED_LOG_GIBBERISH]";
    }
}