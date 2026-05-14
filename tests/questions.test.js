const { resetDb, registerAndLogin, request, app, prisma } = require("./helpers");
beforeEach(resetDb);

describe("post tests", () => {
it("returns 401 without a token", async () => {
  const res = await request(app).get("/api/questions");
  expect(res.status).toBe(401);
});

it("returns 404 for unknown post", async () => {
  const token = await registerAndLogin();
  const res = await request(app).get("/api/questions/99999")
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(404);
  expect(res.body.message).toBe("Post not found");
});

it("returns 400 for invalid post body", async () => {
  const token = await registerAndLogin();
  const res = await request(app).question("/api/questions")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "" });
  expect(res.status).toBe(400);
});
});
