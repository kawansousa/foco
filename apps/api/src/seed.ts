/**
 * Cria um usuário de demonstração com metas e histórico de check-ins.
 *   pnpm --filter @foco/api seed
 * Login: demo@foco.app / foco1234
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { addDays, todayISO } from "@foco/shared";
import { db, schema } from "./db";
import { hashPassword } from "./lib/auth";
import { upsertCheckin } from "./services/foco";

const EMAIL = "demo@foco.app";
const PASSWORD = "foco1234";

async function main() {
  const existing = db.select().from(schema.users).where(eq(schema.users.email, EMAIL)).get();
  if (existing) {
    console.log(`Usuário ${EMAIL} já existe — nada a fazer.`);
    return;
  }

  const today = todayISO();
  const user = db
    .insert(schema.users)
    .values({ id: randomUUID(), name: "Kawan", email: EMAIL, passwordHash: await hashPassword(PASSWORD) })
    .returning()
    .get();
  db.insert(schema.settings).values({ userId: user.id, restDays: "[0]" }).run();

  const goalsSeed = [
    { title: "Maratona 10k", stepTitle: "Correr 3 km", start: -20, due: 42 },
    { title: "12 livros no ano", stepTitle: "Ler 20 páginas", start: -60, due: 130 },
    { title: "Fluência B2", stepTitle: "Estudar inglês 25 min", start: -14, due: 90 },
    { title: "Hábito diário", stepTitle: "Beber 2L de água", start: -30, due: null },
  ];

  const ids: string[] = [];
  for (const g of goalsSeed) {
    const row = db
      .insert(schema.goals)
      .values({
        id: randomUUID(),
        userId: user.id,
        title: g.title,
        stepTitle: g.stepTitle,
        startDate: addDays(today, g.start),
        dueDate: g.due == null ? null : addDays(today, g.due),
      })
      .returning()
      .get();
    ids.push(row.id);
  }

  // últimos 12 dias: quase tudo feito (gera sequência e alguns troféus)
  const notes = ["Rendeu bem.", "Cansado, mas fiz.", null, "Melhor dia da semana.", null, "Quase pulei, mas não."];
  for (let d = 12; d >= 1; d--) {
    const date = addDays(today, -d);
    for (const [i, goalId] of ids.entries()) {
      const skip = (d * 7 + i) % 9 === 0; // alguns buracos
      if (skip) continue;
      upsertCheckin(user.id, {
        goalId,
        date,
        done: true,
        difficulty: ((d * 3 + i) % 5) + 1,
        note: notes[(d + i) % notes.length],
      });
    }
  }
  // hoje: 2 de 4 feitos
  upsertCheckin(user.id, { goalId: ids[0], date: today, done: true, difficulty: 3, note: "Corrida leve." });
  upsertCheckin(user.id, { goalId: ids[1], date: today, done: true, difficulty: 2 });

  console.log(`Seed concluído.\n  e-mail: ${EMAIL}\n  senha:  ${PASSWORD}`);
}

main().then(() => process.exit(0));
