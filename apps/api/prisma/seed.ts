/**
 * Cria um usuário de demonstração com metas e histórico de check-ins,
 * passando pelos mesmos serviços da API (regras e troféus incluídos).
 *
 *   pnpm --filter @foco/api seed
 *   Login: demo@foco.app / foco1234
 */
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { addDays } from "@foco/shared";
import { AppModule } from "../src/app.module";
import { PasswordService } from "../src/auth/password.service";
import { CheckinsService } from "../src/checkins/checkins.service";
import { Clock } from "../src/common/clock/clock";
import { GoalsService } from "../src/goals/goals.service";
import { SettingsService } from "../src/settings/settings.service";
import { UsersService } from "../src/users/users.service";

const EMAIL = "demo@foco.app";
const PASSWORD = "foco1234";

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
  try {
    const users = app.get(UsersService);
    if (await users.findByEmail(EMAIL)) {
      console.log(`Usuário ${EMAIL} já existe — nada a fazer.`);
      return;
    }

    const today = app.get(Clock).todayISO();
    const user = await users.create({
      name: "Kawan",
      email: EMAIL,
      passwordHash: await app.get(PasswordService).hash(PASSWORD),
    });
    await app.get(SettingsService).update(user.id, { restDays: [0] });

    const goals = app.get(GoalsService);
    const seeds = [
      { title: "Maratona 10k", stepTitle: "Correr 3 km", start: -20, due: 42 },
      { title: "12 livros no ano", stepTitle: "Ler 20 páginas", start: -60, due: 130 },
      { title: "Fluência B2", stepTitle: "Estudar inglês 25 min", start: -14, due: 90 },
      { title: "Hábito diário", stepTitle: "Beber 2L de água", start: -30, due: null },
    ];
    const ids: string[] = [];
    for (const g of seeds) {
      const goal = await goals.create(user.id, {
        title: g.title,
        stepTitle: g.stepTitle,
        startDate: addDays(today, g.start),
        dueDate: g.due == null ? null : addDays(today, g.due),
      });
      ids.push(goal.id);
    }

    // últimos 12 dias: quase tudo feito (gera sequência e alguns troféus)
    const checkins = app.get(CheckinsService);
    const notes = ["Rendeu bem.", "Cansado, mas fiz.", null, "Melhor dia da semana.", null, "Quase pulei, mas não."];
    for (let d = 12; d >= 1; d--) {
      const date = addDays(today, -d);
      for (const [i, goalId] of ids.entries()) {
        if ((d * 7 + i) % 9 === 0) continue; // alguns buracos
        await checkins.upsert(user.id, {
          goalId,
          date,
          done: true,
          difficulty: ((d * 3 + i) % 5) + 1,
          note: notes[(d + i) % notes.length],
        });
      }
    }
    // hoje: 2 de 4 feitos
    await checkins.upsert(user.id, { goalId: ids[0], date: today, done: true, difficulty: 3, note: "Corrida leve." });
    await checkins.upsert(user.id, { goalId: ids[1], date: today, done: true, difficulty: 2 });

    console.log(`Seed concluído.\n  e-mail: ${EMAIL}\n  senha:  ${PASSWORD}`);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
