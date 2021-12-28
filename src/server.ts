import * as Router from "koa-router";
import MemoryGameController from "./controllers/MemoryGameController";

const router = new Router();

//Samo eto
router.get("/", MemoryGameController.ServerWorkingCheck);

//memorygame
//nek ovo bude get zasad
router.patch("/MemoryGameInit", MemoryGameController.InitGame);

//ovo mora bit patch request jer saljen input koji minja resource koji postoji
router.patch("/GameTick", MemoryGameController.GameTick);

export default router;
