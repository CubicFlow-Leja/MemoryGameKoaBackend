let NextFreeId = 0;
let NumberOfSessions = 0;
let MaxNumberOfSessions = 50;

interface GameSession {
  id: number;
  turns: number;
  TotalFound: number;
  gameOver: boolean;
  ImagePairs: number[];
  KeyStates: number[];
  Win: boolean;
  lastInputtime: number;
}

const KeyStatesDefault = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const ImagePairsDefault = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7];
const GameoverDefault = false;
const WinDefault: boolean = false;

let Sessions: GameSession[] = [];

function NewGame() {
  if (NumberOfSessions >= MaxNumberOfSessions) {
    return { session: null, status: "SessionError" };
  }

  let TemporaryPairs = [...ImagePairsDefault];
  TemporaryPairs.sort(() => (Math.random() > 0.5 ? 1 : -1));

  let NewSession: GameSession = {
    id: NextFreeId,
    turns: 16,
    TotalFound: 0,
    gameOver: GameoverDefault,
    ImagePairs: TemporaryPairs,
    KeyStates: KeyStatesDefault, //0 je locked , 1 je unlocked jer je tocno pogodeno
    Win: WinDefault,
    lastInputtime: new Date().getTime(), //milisekunde
  };

  //dodaje session
  Sessions.push(NewSession);
  NumberOfSessions++;

  //nanovo racuna sljedeci free index
  CalculateNextFreeIndex();

  return { session: NewSession, status: "Created" };
  //ovo bi cak moga samo na clientu da on ima vizualni delay cisto radi ccs, tome je i sluzia ka
  //   setTimeout(() => {
  //     SetBlocked(false);
  //   }, 500);
}

//cisto ako legit zatriba jednog maknit
function RemoveSession(index: number) {
  let SessionsTemp = Sessions.filter((session) => session.id == index);
  Sessions = SessionsTemp;
  NumberOfSessions = Sessions.length;
  //nanovo racuna sljedeci free index
  CalculateNextFreeIndex();
}

function CalculateNextFreeIndex() {
  let Index = 0; //ide od 0, prvi kojeg nade ce radit
  while (true) {
    let ind = Sessions.find((session) => session.id == Index);
    if (!ind) break;
    Index++;
  }
  NextFreeId = Index;
}

function ResetSession(Session: GameSession) {
  let TemporaryPairs = [...ImagePairsDefault];
  TemporaryPairs.sort(() => (Math.random() > 0.5 ? 1 : -1));

  Session.turns = 16;
  Session.TotalFound = 0;
  Session.gameOver = GameoverDefault;
  Session.ImagePairs = TemporaryPairs;
  Session.KeyStates = KeyStatesDefault;
  Session.Win = WinDefault;
  Session.lastInputtime = new Date().getTime();

  return Session;
}
function GameInitRequested(OldSessionID: number) {
  //ako nije -1 client misli da ima session
  if (OldSessionID != -1) {
    //provjerit jel legit postoji taj session jos uvik
    let Old = Sessions.find((session) => session.id == OldSessionID);
    if (Old) {
      return { session: ResetSession(Old), status: "Reset" }; //ako postoji returnaj istog samo ga resetat
    }
  }
  //ako nema starog ili client nema nikakvog restarta
  return NewGame();
}

function ButtonsPressed(FESessionData: any) {
  //bilo bi gg da client ima svoj session nekakav kojeg samo server updejta
  //tako da ne moran minjat kako se buttoni ponasaju i da on moze sam stavit da je kliknut
  //i onda ako server rece nop samo ga vrati cin server da odluku
  //ali da client samo moze imat 2 koja je sam prominia i automatski salje req servuer
  //ako server nesto vidi da nevalja vrati mu stari session sa ta 2 kao sta su na server ne na clientu
  let Id = FESessionData.id;
  let Click1 = FESessionData.ClickedIndex1;
  let Click2 = FESessionData.ClickedIndex2;
  //  console.log("id clicka =", Id);
  let CurrentSession = Sessions.find((session) => session.id == Id);
  //ako ne postoji session onda nesto nevalja
  if (CurrentSession == null)
    return { session: CurrentSession, status: "SessionError" };

  //ako postoji session bitno je da updejtan time pa nema veze sta se dalje dogodi bitno je da user radi nesto
  //sta znaci da mu nesmin brejkat session
  CurrentSession.lastInputtime = new Date().getTime();

  //ako ide patchat a igra je gotova
  if (CurrentSession.gameOver || CurrentSession.Win)
    return { session: CurrentSession, status: "FaultyInput" };

  //ako nesto nije uredu samo returna isti session pa client nakon delaya dopusti igru opet
  if (Click1 == Click2 || Click1 == -1 || Click2 == -1)
    return { session: CurrentSession, status: "FaultyInput" };

  //uzme stateove da je lakse racunat
  let tempStates = [...CurrentSession.KeyStates];

  //provjeri oba
  let StateClick1 = tempStates[Click1];
  let StateClick2 = tempStates[Click2];

  //ako je bilo koji vec unlockan nesto nije uredno pa returna i client sam reseta css efekte
  if (StateClick1 == 1 || StateClick2 == 1)
    return { session: CurrentSession, status: "FaultyInput" };

  //ako je sve k,
  //provjeri jesu li parovi tocni
  let CorrectPairs =
    CurrentSession.ImagePairs[Click1] == CurrentSession.ImagePairs[Click2];

  //oduzme turn i ako nevalja
  CurrentSession.turns--;

  //ako nema turnova game over
  if (CurrentSession.turns <= 0) CurrentSession.gameOver = true;

  //ako su netocni return stari sessions sa WrongPairs
  if (!CorrectPairs) return { session: CurrentSession, status: "WrongPair" };

  //ako su tocni
  //postavi ta 2 statea na 1
  //podigne score

  tempStates[Click1] = 1;
  tempStates[Click2] = 1;
  CurrentSession.KeyStates = tempStates;
  CurrentSession.TotalFound++;

  //ako je sve pronadeno onda je win
  if (CurrentSession.TotalFound >= 8) CurrentSession.Win = true;

  //ako je ili game over ili win returna endgame
  if (CurrentSession.gameOver || CurrentSession.Win)
    return { session: CurrentSession, status: "EndGame" };

  //returna updated session
  return { session: CurrentSession, status: "Updated" };
}

export default class MemoryGameController {
  public static async InitGame(ctx) {
    //requesta session create/reset
    let Temporary = GameInitRequested(ctx.request.body.id);

    switch (Temporary.status) {
      case "Created": //201 -> Created new game
        ctx.body = Temporary.session;
        ctx.status = 201;
        break;
      case "Reset": //201 -> Created jer je isto kao da je modified/reset, bitno je da vrati clientu session
        ctx.body = Temporary.session;
        ctx.status = 201;
        break;
      case "SessionError": //503 -> Service Unavailable , ako je maxsession pa nemoze vise kreirat
        ctx.body = JSON.stringify({
          text: "Session limit exceeded, try again later",
        });
        ctx.status = 503;
        break;
    }
  }

  public static async GameTick(ctx) {
    //pritisnute 2 slike sa ClickedIndex1 i ClickedIndex2 sa svin podacima
    let Temporary = ButtonsPressed(ctx.request.body);
    ctx.set({
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    console.log(ctx.request.body);
    switch (Temporary.status) {
      case "Updated": //201 -> Create i modify ista stvar, pritisnuta tocna kombinacija i vrati result kao novi json session file
        ctx.body = Temporary.session;
        ctx.status = 201;
        break;
      case "WrongPair": //201-> modify, izgubia je turn
        ctx.body = Temporary.session;
        ctx.status = 201;
        break;
      case "FaultyInput": //304 -> cached verzija je ista ka server verzija , client samo triba css sredit
        ctx.body = JSON.stringify({
          text: "Cached session still viable",
        });
        //ctx.body = Temporary.session;
        ctx.status = 304;
        break;
      case "EndGame": //201 -> modify/create , win/lose, ugl igra gotova
        ctx.body = Temporary.session;
        ctx.status = 201;
        break;
      case "SessionError": //410 -> Gone, session timeout
        ctx.body = JSON.stringify({
          text: "Session timeout.",
        });
        ctx.status = 410;
        break;
    }
  }

  public static async ServerWorkingCheck(ctx) {
    ctx.status = 200;
    ctx.body = JSON.stringify({
      text: "all good",
    });
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
      (sessions) => tempTime - sessions.lastInputtime < 60000 * 1
    ); //200000
    Sessions = TemporarySessions;
    NumberOfSessions = Sessions.length;
    //nanovo racuna sljedeci free index
    CalculateNextFreeIndex();
    console.log("Sessions running :", Sessions.length);
    console.log("Next Free Session Id :", NextFreeId);
    await sleep(60000 / 10);
  }
}
