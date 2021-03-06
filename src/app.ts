import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as json from "koa-json";
import * as logger from "koa-logger";
import "reflect-metadata";
import router from "./server";

// const Whitelist =
//   "https://61cb2ca5eeb7a40007974394--serene-lewin-e9bb18.netlify.app";
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (!origin || Whitelist.indexOf(origin) !== -1) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };
// var options = {
//   origin: "*",
// };

const app = new Koa();
const port = process.env.PORT || 3001;

app.use(json());
app.use(logger());
app.use(bodyParser());

const cors = require("@koa/cors");
app.use(cors());

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`App listening on the port ${port}`);
});
