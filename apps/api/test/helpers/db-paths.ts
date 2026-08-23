import { resolve } from "node:path";

/** Pasta temporária dos bancos de teste (apagada no fim da suíte). */
export const TEST_DB_DIR = resolve(__dirname, "../../.tmp-test");

/** Banco modelo com as migrations aplicadas; cada arquivo de teste usa uma cópia. */
export const TEMPLATE_DB = resolve(TEST_DB_DIR, "template.db");
