import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import routes from "./routes";
import validator from "./middlewares/validator";
import { initMessagingQueue } from "./utils/initQueue";
import auth from "./middlewares/auth";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

initMessagingQueue();

app.use((req: Request, res: Response, next: Function) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(express.json());
app.use(auth);
app.use(validator);
app.use(routes);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});
