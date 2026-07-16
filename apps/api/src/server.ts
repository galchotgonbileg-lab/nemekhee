import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import routes from "./routes";
import { ensureSchema } from "./schema";

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.get("/health", (_request, response) => {
  response.json({ ok: true, service: "warehouse-api" });
});

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Warehouse API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database schema:", error);
    process.exit(1);
  });
