import "core-js";
import "reflect-metadata";
import faker from "faker";
import request from "supertest";
import type { Application } from "express";
import type { Container } from "inversify";
import { setupContainer } from "../../config/inversify";
import { setupServer } from "../../config/server";
import "../../controllers/quotes/quotes.controllers";
import { db } from "../../db";

let app: Application;
let container: Container;

beforeAll(() => {
  container = setupContainer();
  app = setupServer(container).build();
});

describe("QuotesController#get", () => {
  it("should return quotes", async () => {
    await request(app)
      .get("/quotes")
      .expect(200)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });
  it("should fail badly formed query", async () => {
    await request(app)
      .get("/quotes?start_date=wrong")
      .expect(400)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toHaveProperty("message", "Your request query is invalid");
        expect(res.body).toHaveProperty("errors");
      });
  });
  it("should return quotes with query", async () => {
    await request(app)
      .get(`/quotes?start_date=${faker.date.past().toISOString()}`)
      .expect(200)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Array);
      });
  });

  it("should return quote by id", async () => {
    const values = {
      title: faker.lorem.sentence(),
      start_date: faker.date.past().toISOString(),
      end_date: faker.date.future().toISOString(),
    };
    const { id } = await db.insertInto("quote").values(values).returning("id").executeTakeFirstOrThrow();

    await request(app)
      .get(`/quotes/${id}`)
      .expect(200)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toHaveProperty("id", id);
        expect(res.body).toHaveProperty("title", values.title);
      });

    await db.deleteFrom("quote").where("id", "=", id).execute();
  });

  it("should fail to return quote by id", async () => {
    await request(app).get(`/quotes/${faker.datatype.uuid()}`).expect(404);
  });
});

describe("QuotesController#create", () => {
  it("should create a quote", async () => {
    const values = {
      title: faker.lorem.words(2),
      start_date: faker.date.past().toISOString(),
      end_date: faker.date.future().toISOString(),
      sections: [
        {
          title: faker.lorem.words(2),
          uuid: faker.datatype.uuid(),
          base_currency: faker.finance.currencyCode(),
          user_currency: faker.finance.currencyCode(),
          exchange_rate: faker.finance.amount(),
          basis: [
            {
              title: faker.lorem.words(2),
              uuid: faker.datatype.uuid(),
              unit_of_measure: faker.lorem.word(),
              quantity: faker.datatype.number(),
              price_per_unit: faker.finance.amount(),
            },
          ],
        },
      ],
    };

    await request(app)
      .post("/quotes")
      .send(values)
      .expect(200)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toHaveProperty("id");
        expect(res.body).toHaveProperty("title", values.title);
      });

    await db
      .deleteFrom("quote")
      .where("title", "=", values.title)
      .where("start_date", "=", new Date(values.start_date))
      .where("end_date", "=", new Date(values.end_date))
      .execute();
  });

  it("should fail to create a quote", async () => {
    await request(app).post("/quotes").send({}).expect(400);
  });
});

describe("QuotesController#update", () => {
  it("should update a quote", async () => {
    const values = {
      title: faker.lorem.words(2),
      start_date: faker.date.past().toISOString(),
      end_date: faker.date.future().toISOString(),
    };
    const { id } = await db.insertInto("quote").values(values).returning("id").executeTakeFirstOrThrow();

    const updated = {
      title: faker.lorem.words(2),
      start_date: faker.date.past().toISOString(),
      end_date: faker.date.future().toISOString(),
    };

    await request(app)
      .patch(`/quotes/${id}`)
      .send(updated)
      .expect((res) => {
        console.log({ res: res.body });
        console.log({ original: values });
        console.log({ updated: updated });
      })
      .expect(200)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toHaveProperty("id", id);
        expect(res.body).toHaveProperty("title", updated.title);
      });

    await request(app).patch(`/quotes/${id}`).send({}).expect(200);

    await request(app)
      .patch(`/quotes/${id}`)
      .send({
        sections: [
          {
            title: faker.lorem.words(2),
            uuid: faker.datatype.uuid(),
            base_currency: faker.finance.currencyCode(),
            user_currency: faker.finance.currencyCode(),
            exchange_rate: faker.finance.amount(),
            basis: [
              {
                title: faker.lorem.words(2),
                uuid: faker.datatype.uuid(),
                unit_of_measure: faker.lorem.word(),
                quantity: faker.datatype.number(),
                price_per_unit: faker.finance.amount(),
              },
            ],
          },
        ],
      })
      .expect(200)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toHaveProperty("id", id);
        expect(res.body).toHaveProperty("title", updated.title);
        expect(res.body).toHaveProperty("sections");
        expect(res.body.sections).toBeInstanceOf(Array);
        expect(res.body.sections).toHaveLength(1);
      });

    await db.deleteFrom("quote").where("id", "=", id).execute();
  });

  it("should fail to update a non existent quote", async () => {
    await request(app).patch(`/quotes/${faker.datatype.uuid()}`).send({}).expect(404);
  });

  it("should fail to update a quote with invalid data", async () => {
    const values = {
      title: faker.lorem.words(2),
      start_date: faker.date.past().toISOString(),
      end_date: faker.date.future().toISOString(),
    };
    const { id } = await db.insertInto("quote").values(values).returning("id").executeTakeFirstOrThrow();

    await request(app).patch(`/quotes/${id}`).send({ title: "" }).expect(400);
    await request(app)
      .patch(`/quotes/${id}`)
      .send({
        start_date: "wrong",
      })
      .expect(400);

    await db.deleteFrom("quote").where("id", "=", id).execute();
  });

  it("saves draft", async () => {
    const values = {
      title: faker.lorem.words(2),
      start_date: faker.date.past().toISOString(),
      end_date: faker.date.future().toISOString(),
    };
    const { id } = await db.insertInto("quote").values(values).returning("id").executeTakeFirstOrThrow();

    const draft = { sections: [{}] };
    await request(app)
      .put(`/quotes/${id}/draft`)
      .send(draft)
      .expect(200)
      .expect("Content-Type", /json/)
      .expect((res) => {
        expect(res.body).toBeInstanceOf(Object);
        expect(res.body).toHaveProperty("draft");
        expect(res.body.draft).toBeInstanceOf(Object);
        expect(res.body.draft).toEqual(draft);
      });

    await db.deleteFrom("quote").where("id", "=", id).execute();
  });
});
