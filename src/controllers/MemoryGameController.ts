import { time } from "console";
import { BaseContext } from "koa";
import { body } from "koa-swagger-decorator";
import internal = require("stream");

//moga bi napravi session koji sadrzi samo index i ime neko u json formatu, pa kasnie
// gasit taj session kad player izgubi game
let NextFreeId = 0;
let NumberOfSessions = 0;
let MaxNumberOfSessions = 200;
//TRIBA BRISAT SESSIONE KOJI NISU IN USE ako neko ugasi stranicu dok session postoji
//dodat neki timeLastInput unutar sessiona, ako je time  > threshold rip session
interface ScoreInterface {
  Won: boolean;
}
interface GameSession {
  id: number;
  turns: number;
  TotalFound: number;
  gameOver: boolean;
  blocked: boolean;
  prevIndex: number; //nece tribat
  currentIndex: number; //nece tribat
  ImagePairs: number[];
  KeyStates: number[];
  Score: ScoreInterface;
  blockedDelay: number; //nece tribat
  lastInputtime: number;
}

const KeyStatesDefault = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const ImagePairsDefault = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
const PrevIndexDefault = -1;
const CurrentIndexDefault = -1;
const blockedDefault = false;
const GameoverDefault = false;
const maxTurnsDefault = 16;
const TotalFoundMaxDefault = 8;
const ScoreDefault: ScoreInterface = { Won: false };

let Sessions: GameSession[] = [];

function RestartGame() {
  if (NumberOfSessions >= MaxNumberOfSessions) {
    return null;
  }

  let TemporaryPairs = [...ImagePairsDefault];
  TemporaryPairs.sort(() => (Math.random() > 0.5 ? 1 : -1));

  let NewSession: GameSession = {
    id: NextFreeId,
    turns: 16,
    TotalFound: 0,
    gameOver: GameoverDefault,
    blocked: blockedDefault,
    prevIndex: PrevIndexDefault,
    currentIndex: CurrentIndexDefault,
    ImagePairs: ImagePairsDefault,
    KeyStates: KeyStatesDefault,
    Score: ScoreDefault,
    blockedDelay: 500,
    lastInputtime: new Date().getTime(), //milisekunde
  };

  //dodaje session
  Sessions.push(NewSession);
  NumberOfSessions++;

  //sljedeci free index
  let Index = 0; //ide od 0, prvi kojeg nade ce radit
  while (true) {
    let ind = Sessions.find((session) => session.id == Index);
    if (!ind) break;
    Index++;
  }
  NextFreeId = Index;
  return NewSession;
  //ovo bi cak moga samo na clientu da on ima vizualni delay cisto radi ccs, tome je i sluzia ka
  //   setTimeout(() => {
  //     SetBlocked(false);
  //   }, 500);
}

function RemoveSession(index: number) {
  let SessionsTemp = Sessions.filter((session) => session.id == index);
  Sessions = SessionsTemp;
  NumberOfSessions--;
  //nanovo racuna sljedeci free index
  let Index = 0; //ide od 0, prvi kojeg nade ce radit
  while (true) {
    let ind = Sessions.find((session) => session.id == Index);
    if (!ind) break;
    Index++;
  }

  NextFreeId = Index;
}

function GameInitRequested(OldSession: any) {
  if (OldSession.id != -1) RemoveSession(OldSession.id);
  return RestartGame();
}

function ButtonPress(FESessionData: any) {
  //   let tempStates = [...KeyStates];
  //   let Temp = {
  //     TurnsLeft: Score.TurnsLeft,
  //     TotalFound: Score.TotalFound,
  //   };
  //   if (PrevIndex == -1) {
  //     SetPrevIndex(index);
  //     tempStates[index] = 1;
  //   } else {
  //     Temp.TurnsLeft -= 1;
  //     if (ImageUrlPairs[index] == ImageUrlPairs[PrevIndex]) {
  //       tempStates[index] = 2;
  //       tempStates[PrevIndex] = 2;
  //       Temp.TotalFound += 1;
  //       SetPrevIndex(-1);
  //     } else {
  //       tempStates[index] = 1;
  //       tempStates[PrevIndex] = 1;
  //       SetBlocked(true);
  //       setTimeout(() => {
  //         MissDelay(index, PrevIndex);
  //       }, 1000);
  //     }
  //   }
  //   if (Temp.TotalFound > 7 || Temp.TurnsLeft < 1) {
  //     let finished = true;
  //     setGameOver(finished);
  //   }
  //   SetScore(Temp);
  //   SetKeyStates(tempStates);
  // }
  // async function MissDelay(index1: number, index2: number) {
  //   let tempStates = [...KeyStates];
  //   tempStates[index1] = 0;
  //   tempStates[index2] = 0;
  //   SetKeyStates(tempStates);
  //   setTimeout(() => {
  //     SetPrevIndex(-1);
  //     if (Score.TurnsLeft > 1 && Score.TotalFound < 8) SetBlocked(false);
  //     else {
  //       let finished = true;
  //       setGameOver(finished);
  //     }
  //   }, 250);
  return null;
}

export default class MemoryGameController {
  public static async InitGame(ctx) {
    //ctx.body = ctx.request.body;
    let Temporary = GameInitRequested(ctx.request.body);
    if (Temporary != null) {
      ctx.status = 200;
      ctx.body = Sessions;
    } else {
      ctx.status = 400;
      ctx.body = "Wait Untill A Session Frees Up";
    }
  }

  public static async ButtonPressed(ctx: BaseContext) {
    let Temporary = ButtonPress(ctx);
    //buttonpress sa svin podacima
  }
}

//Sleep za brisanje sesssiona
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

DeleteOld();
///Brisanje Starih sessiona
async function DeleteOld() {
  while (true) {
    let tempTime = new Date().getTime();
    let TemporarySessions = Sessions.filter(
      (sessions) => tempTime - sessions.lastInputtime < 60000 * 5
    ); //200000
    Sessions = TemporarySessions;
    console.log("Sessions running :", Sessions.length);
    await sleep(60000);
  }
}
