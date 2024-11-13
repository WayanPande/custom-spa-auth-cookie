import Cookies from "js-cookie";

const ENCRYPTION_KEY_NAME = import.meta.env.VITE_AUTH_SECRET;
const COOKIE_NAME = import.meta.env.VITE_COOKIE_NAME;
const KEY_COOKIE_OPTIONS = {
  expires: 1, // 1 day
  secure: import.meta.env.MODE === "production", // Use secure in production
  sameSite: "strict" as const,
  path: "/",
  // cannot use httpOnly when using the js-cookie library, because the library access the cookie via a js bot http
  // httpOnly: true,
};

export class CryptoUtils {
  private static readonly PBKDF2_ITERATIONS = 100000;
  private static readonly SALT_LENGTH = 16;

  private static async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    // Convert password string to key material
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    return await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: this.PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  private static async generateRandomPassword(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }

  static async encrypt(data: any): Promise<string> {
    try {
      const password = await this.generateRandomPassword();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));

      const key = await this.deriveKey(password, salt);
      const encodedData = new TextEncoder().encode(JSON.stringify(data));

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
          tagLength: 128,
        },
        key,
        encodedData
      );

      // Combine salt, IV and encrypted data
      const resultArray = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength
      );
      resultArray.set(salt, 0);
      resultArray.set(iv, salt.length);
      resultArray.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // Store the password securely
      const sessionKey = JSON.stringify({ password, timestamp: Date.now() });
      Cookies.set(ENCRYPTION_KEY_NAME, sessionKey, KEY_COOKIE_OPTIONS);

      return btoa(String.fromCharCode(...resultArray));
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Encryption failed");
    }
  }

  static async decrypt(encryptedData: string): Promise<any> {
    try {
      const sessionData = Cookies.get(ENCRYPTION_KEY_NAME);
      if (!sessionData) {
        throw new Error("Session expired");
      }

      const { password } = JSON.parse(sessionData);

      const encrypted = new Uint8Array(
        atob(encryptedData)
          .split("")
          .map((char) => char.charCodeAt(0))
      );

      const salt = encrypted.slice(0, this.SALT_LENGTH);
      const iv = encrypted.slice(this.SALT_LENGTH, this.SALT_LENGTH + 12);
      const data = encrypted.slice(this.SALT_LENGTH + 12);

      const key = await this.deriveKey(password, salt);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
          tagLength: 128,
        },
        key,
        data
      );

      return JSON.parse(new TextDecoder().decode(decryptedData));
    } catch (error) {
      console.error("Decryption error:", error);
      this.clearAuthData();
      throw new Error("Decryption failed");
    }
  }

  static clearAuthData(): void {
    try {
      Cookies.remove(ENCRYPTION_KEY_NAME, { path: "/" });
      Cookies.remove(COOKIE_NAME, { path: "/" });
    } catch (error) {
      console.error("Error clearing auth data:", error);
    }
  }
}
