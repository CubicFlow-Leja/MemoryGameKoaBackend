import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as json from "koa-json";
import * as logger from "koa-logger";
import "reflect-metadata";
import router from "./server";

const app = new Koa();
const port = process.env.PORT || 3001;

app.use(json());
app.use(logger());
app.use(bodyParser());

var corsOptions = {
  origin: "*",
};
const cors = require("@koa/cors");
app.use(cors(corsOptions));

app.use(function (ctx) {
  ctx.setheader("Access-Control-Allow-Credentials", true);
  ctx.setheader("Access-Control-Allow-Origin", "*");
  ctx.setheader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  ctx.setheader(
    "Access-Control-Allow-Headers",
    "appid, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept"
  );
  ctx.next();
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`App listening on the port ${port}`);
});
