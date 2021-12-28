import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as json from "koa-json";
import * as logger from "koa-logger";
import "reflect-metadata";
import router from "./server";

const app = new Koa();
const port = process.env.PORT;

app.use(json());
app.use(logger());
app.use(bodyParser());

const cors = require("@koa/cors");
app.use(cors());

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`🚀 App listening on the port ${port}`);
});
