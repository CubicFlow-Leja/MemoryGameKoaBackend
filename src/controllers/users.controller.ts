import { BaseContext, Request } from "koa";

const users = [
  { id: 22, name: "gg" },
  { id: 24, name: "wp" },
  { id: 1, name: "2" },
];

export default class UserController {
  public static async getUsers(ctx) {
    ctx.status = 200;
    ctx.body = users;
  }

  public static async AddUser(ctx) {
    let id = ctx.request.body.id;
    let AlreadyExists = false;
    // ctx.body =  ctx.request.body;
    // ctx.status=201;
    users.map((user, index) => {
      if (user.id == id) AlreadyExists = true;
    });
    if (AlreadyExists) {
      ctx.status = 400;
      ctx.body = ["User already exists"];
    } else {
      ctx.status = 201;
      users.push({ ...ctx.request.body });
      ctx.body = users;
    }
  }
}
