import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as cors from "@koa/cors";
import * as helmet from "koa-helmet";
import * as json from "koa-json";
import * as logger from "koa-logger";
import "reflect-metadata";
import router from "./server";
import { debug } from "console";

const app = new Koa();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(json());
app.use(logger());
app.use(bodyParser());

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`🚀 App listening on the port ${port}`); //mogu svatit ka update loop jer ovo runna zauvik
  //console.log(new Date().getTime());
});
