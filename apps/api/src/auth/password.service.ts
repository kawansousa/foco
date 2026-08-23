import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Injectable } from "@nestjs/common";

const scrypt = promisify(scryptCb) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Hash de senha com scrypt (nativo do Node) no formato `salt:hash` (hex). */
@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const key = await scrypt(password, salt, KEY_LENGTH);
    return `${salt}:${key.toString("hex")}`;
  }

  async verify(password: string, stored: string): Promise<boolean> {
    const [salt, hex] = stored.split(":");
    if (!salt || !hex) return false;
    const expected = Buffer.from(hex, "hex");
    const key = await scrypt(password, salt, KEY_LENGTH);
    return key.length === expected.length && timingSafeEqual(key, expected);
  }
}
