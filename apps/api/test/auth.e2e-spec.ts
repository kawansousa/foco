import { JwtService } from "@nestjs/jwt";
import { DEFAULT_SETTINGS } from "@foco/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bearer, checkin, createGoal, createTestApp, registerUser, TODAY, type TestApp } from "./helpers/test-app";

describe("autenticação", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  describe("POST /auth/register", () => {
    it("cria a conta, devolve token + usuário + configurações padrão e não expõe a senha", async () => {
      const res = await t.http
        .post("/auth/register")
        .send({ name: "  Ana Souza ", email: "Ana@Exemplo.com", password: "senha-forte-123" })
        .expect(201);

      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toEqual({
        id: expect.any(String),
        name: "Ana Souza",
        email: "ana@exemplo.com",
        avatar: null,
        createdAt: expect.any(String),
      });
      expect(res.body.settings).toEqual({ ...DEFAULT_SETTINGS, restDays: [] });
      expect(res.body.trophyCount).toBe(0);
      expect(JSON.stringify(res.body)).not.toMatch(/password|senha-forte/i);
    });

    it("e-mail repetido (mesmo com outra caixa) responde 409", async () => {
      await registerUser(t.http, { email: "dup@exemplo.com" });
      const res = await t.http
        .post("/auth/register")
        .send({ name: "Outra", email: "DUP@exemplo.com", password: "senha-forte-123" })
        .expect(409);
      expect(res.body).toEqual({ error: "Já existe uma conta com esse e-mail." });
    });

    it("valida nome, e-mail e senha com a lista de problemas", async () => {
      const res = await t.http.post("/auth/register").send({ name: "A", email: "x", password: "123" }).expect(400);
      expect(res.body.error).toEqual(expect.any(String));
      expect(res.body.issues.map((i: { path: string }) => i.path).sort()).toEqual(["email", "name", "password"]);
    });
  });

  describe("POST /auth/login", () => {
    it("autentica e devolve o mesmo formato do cadastro", async () => {
      const user = await registerUser(t.http, { email: "login@exemplo.com", password: "minha-senha-1" });
      const res = await t.http.post("/auth/login").send({ email: "LOGIN@exemplo.com", password: "minha-senha-1" }).expect(200);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.settings).toBeDefined();
      expect(res.body.trophyCount).toBe(0);
    });

    it("login devolve o total de troféus conquistados", async () => {
      const user = await registerUser(t.http, { email: "trofeus@exemplo.com", password: "minha-senha-1" });
      const goal = await createGoal(t.http, user);
      await checkin(t.http, user, goal.id, TODAY, { difficulty: 5 }); // primeiro_passo + superacao + sem_folga
      const res = await t.http.post("/auth/login").send({ email: "trofeus@exemplo.com", password: "minha-senha-1" }).expect(200);
      expect(res.body.trophyCount).toBe(3);
    });

    it("senha errada e e-mail inexistente dão a MESMA resposta 401 (não revela contas)", async () => {
      await registerUser(t.http, { email: "alvo@exemplo.com", password: "minha-senha-1" });
      const wrong = await t.http.post("/auth/login").send({ email: "alvo@exemplo.com", password: "errada-123" }).expect(401);
      const unknown = await t.http.post("/auth/login").send({ email: "ninguem@exemplo.com", password: "errada-123" }).expect(401);
      expect(wrong.body).toEqual({ error: "E-mail ou senha incorretos." });
      expect(unknown.body).toEqual(wrong.body);
    });

    it("corpo incompleto é 400, não 401", async () => {
      await t.http.post("/auth/login").send({ email: "alvo@exemplo.com" }).expect(400);
    });
  });

  describe("GET /me e proteção das rotas", () => {
    it("com token válido devolve usuário e configurações", async () => {
      const user = await registerUser(t.http);
      const res = await t.http.get("/me").set(user.auth).expect(200);
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.settings.restDays).toEqual([]);
      expect(res.body.trophyCount).toBe(0);
    });

    it.each([
      ["sem header", {}],
      ["esquema errado", { Authorization: "Basic abc" }],
      ["token inválido", bearer("nao.e.jwt")],
      ["Bearer vazio", { Authorization: "Bearer " }],
    ])("%s → 401 com mensagem em português", async (_label, headers) => {
      const res = await t.http.get("/me").set(headers).expect(401);
      expect(res.body).toEqual({ error: "Faça login para continuar." });
    });

    it("token expirado → 401", async () => {
      const user = await registerUser(t.http);
      const jwt = t.app.get(JwtService);
      const expired = await jwt.signAsync({}, { subject: user.id, expiresIn: -10 });
      await t.http.get("/me").set(bearer(expired)).expect(401);
    });

    it("token assinado com outro segredo → 401", async () => {
      const user = await registerUser(t.http);
      const forged = await new JwtService({ secret: "outro-segredo" }).signAsync({}, { subject: user.id, expiresIn: "1h" });
      await t.http.get("/me").set(bearer(forged)).expect(401);
    });

    it("token de usuário apagado → 401 (conta não existe mais)", async () => {
      const user = await registerUser(t.http);
      await t.prisma.user.delete({ where: { id: user.id } });
      const res = await t.http.get("/me").set(user.auth).expect(401);
      expect(res.body).toEqual({ error: "Faça login para continuar." });
    });

    it("todas as rotas de domínio exigem token", async () => {
      for (const [method, path] of [
        ["get", "/goals"],
        ["post", "/goals"],
        ["get", "/today"],
        ["put", "/checkins"],
        ["get", "/checkins"],
        ["get", "/trophies"],
        ["get", "/settings"],
        ["put", "/settings"],
        ["get", "/stats"],
        ["get", "/fo/schedule"],
        ["patch", "/me"],
      ] as const) {
        const res = await t.http[method](path);
        expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401);
      }
    });
  });

  describe("PATCH /me (perfil)", () => {
    const AVATAR = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/";

    it("atualiza nome e foto e devolve o perfil completo", async () => {
      const user = await registerUser(t.http, { name: "Nome Antigo" });
      const res = await t.http.patch("/me").set(user.auth).send({ name: "  Nome Novo ", avatar: AVATAR }).expect(200);
      expect(res.body.user).toMatchObject({ id: user.id, name: "Nome Novo", avatar: AVATAR });
      expect(res.body.settings).toBeDefined();
      expect(res.body.trophyCount).toBe(0);

      const me = await t.http.get("/me").set(user.auth).expect(200);
      expect(me.body.user.avatar).toBe(AVATAR);
    });

    it("campo ausente não muda; avatar null remove a foto", async () => {
      const user = await registerUser(t.http, { name: "Fixo" });
      await t.http.patch("/me").set(user.auth).send({ avatar: AVATAR }).expect(200);
      const onlyName = await t.http.patch("/me").set(user.auth).send({}).expect(200);
      expect(onlyName.body.user).toMatchObject({ name: "Fixo", avatar: AVATAR });
      const removed = await t.http.patch("/me").set(user.auth).send({ avatar: null }).expect(200);
      expect(removed.body.user).toMatchObject({ name: "Fixo", avatar: null });
    });

    it.each([
      ["nome curto", { name: "A" }],
      ["avatar que não é data URL de imagem", { avatar: "https://site.com/foto.jpg" }],
      ["avatar com tipo não suportado", { avatar: "data:image/gif;base64,R0lGOD" }],
      ["avatar grande demais", { avatar: `data:image/png;base64,${"A".repeat(400_001)}` }],
    ])("rejeita %s com 400", async (_label, body) => {
      const user = await registerUser(t.http);
      const res = await t.http.patch("/me").set(user.auth).send(body).expect(400);
      expect(res.body.issues).toBeDefined();
    });

    it("não altera o perfil de outro usuário", async () => {
      const a = await registerUser(t.http, { name: "Pessoa A" });
      const b = await registerUser(t.http, { name: "Pessoa B" });
      await t.http.patch("/me").set(a.auth).send({ name: "Mudou A" }).expect(200);
      const meB = await t.http.get("/me").set(b.auth).expect(200);
      expect(meB.body.user.name).toBe("Pessoa B");
    });
  });
});
