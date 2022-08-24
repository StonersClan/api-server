import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import routes from "./routes";
import validator from "./middlewares/validator";
import { initMessagingQueue } from "./utils/initQueue";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

initMessagingQueue();

app.use(express.json());
// app.use(validator);
app.use(routes);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
