import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from "supertest";
import app from "../src/app.js";

let mongoServer;
let token;
let taskId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Task User",
      email: "task@example.com",
      password: "123456"
    });

  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email: "task@example.com",
      password: "123456"
    });

  token = res.body.token;
}, 30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Task Routes", () => {

  it("should not allow access without token", async () => {
    const res = await request(app)
      .get("/api/tasks");

    expect(res.statusCode).toBe(401);
  });

  it("should create a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Task",
        description: "Testing"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe("Test Task");

    taskId = res.body._id;
  });

  it("should get user tasks only", async () => {
    const res = await request(app)
      .get("/api/tasks")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

});