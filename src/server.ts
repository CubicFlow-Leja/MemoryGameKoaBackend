import * as Router from "koa-router";
import IndexController from "./controllers/index.controller";
import MemoryGameController from "./controllers/MemoryGameController";
import UserController from "./controllers/users.controller";
import UsersController from "./controllers/users.controller";

const router = new Router();

//testovi
router.get("/", IndexController.getIndex);

router.get("/users", UsersController.getUsers);

router.post("/users/add", UserController.AddUser);

//memorygame
router.get("/MemoryGameInit", MemoryGameController.InitGame);
router.post("/MemoryGameInit", MemoryGameController.ButtonPressed);

export default router;
