// スマホのサイズは480 * 800
//　画面のサイズ
let board;
let boardWidth = 980;
let boardHeight = 600;
let context;

// player objectをここで作る。
let playerWidth = 88;
let playerHeight = 94;
let playerX = 20;
let playerY = boardHeight - playerHeight; // 600 - 94
let playerImg;

let player = {
  x: playerX,
  y: playerY,
  width: playerWidth,
  height: playerHeight,
};

let obstacles = [];
let obstacleId = 1;
const obstaclesTable = {};

let jumpTicket = 2;
// 地面についていたら、つまり初期のdinoYの一にいる場合は常にjumpTicketが2の状態になる感じ。一回jumpするごとにtikcetを切る。

// さぼてんの横の大きさをここで定義している。
let obstacle1Width = 70;
let obstacle2Width = 160;
let obstacle3Width = 102;

let obstacleHeight = 80;
//最初、サボテンがどの位置で始めるかをここで定義しているのね。
let obstacleX = 980;
let obstacleY = boardHeight - obstacleHeight;

let obstacle1Img;
let obstacle2Img;
let obstacle3Img;

//physics
let velocityX = -8; //cactus moving left speed // これを
let velocityY = 0;
let gravity = 0.4;
let jumpSuccess = false;

let gameOver = false;
let score = 0;

let jumpCount = 0;
let availableJumpCount = 2; //jumpCount

window.onload = function () {
  board = document.getElementById('board');
  board.height = boardHeight;
  board.width = boardWidth;

  context = board.getContext('2d'); //used for drawing on the board

  //draw initial dinosaur
  // context.fillStyle="green";
  // context.fillRect(dino.x, dino.y, dino.width, dino.height);

  playerImg = new Image();
  playerImg.src = './img/mario_8bit.png';
  playerImg.onload = function () {
    context.drawImage(playerImg, player.x, player.y, player.width, player.height);
  };

  obstacle1Img = new Image();
  obstacle1Img.src = './img/peach.png';

  obstacle2Img = new Image();
  obstacle2Img.src = './img/cactus2.png';

  obstacle3Img = new Image();
  obstacle3Img.src = './img/cactus3.png';

  // まあ、とにかくこの3つはブラウザが開いた瞬間にブラウザで登録されるやつね。
  // 1. うえから順に、再描画できるタイミングでupdate関数を出す。
  // 2. 1000秒ごとに障害物をランダムに作る
  // 3. clickおしたら、dionをジャンプさせる
  // これら３つのfunctionを登録している。
  requestAnimationFrame(update);
  setInterval(placeCactus, 1000); //1000 milliseconds = 1 second
  // 毎1秒ごとにcactusをpushしている、ただそれだけのことよね。そんで、lengthが5以上になったら最初のやつだけ取り除いている、っていうただそれだけよ。
  // そうだから、arrayの中身は最初と全く変わるものになるっていうんだわな。。。どんどん古いものは捨てられていくってうことね。
  // document.addEventListener('keydown', moveDino); // 最初のコード
  // document.addEventListener('click', jumpDino); // 次、俺のjumpでのscreo更新
  // これ、今の状態だと、無限ジャンプできちゃうね。。。
  document.addEventListener('click', dodgeObstacle);
  setInterval(seeScore, 100);
  setInterval(isJumpAvailable, 100);
  // document.addEventListener('click', dodgeObstacle);
};

// place cactusがわからんよな。。。
// 1000秒ごとに

// scoreの更新は、障害物をうまく避けたらっていうロジックだが、、、
// これrecursion的な感じなのね。。。
// これで、毎回毎回再描画する感じ。

function update() {
  requestAnimationFrame(update);
  if (gameOver) {
    return;
  }
  context.clearRect(0, 0, board.width, board.height);

  //dino
  velocityY += gravity;
  player.y = Math.min(player.y + velocityY, playerY); //apply gravity to current dino.y, making sure it doesn't exceed the ground
  context.drawImage(playerImg, player.x, player.y, player.width, player.height);

  //cactus
  for (let i = 0; i < obstacles.length; i++) {
    let obstacle = obstacles[i];
    obstacle.x += velocityX;
    context.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

    if (detectCollision(player, obstacle)) {
      gameOver = true;
      playerImg.src = './img/mario_8bit_dead.png';
      playerImg.onload = function () {
        context.drawImage(playerImg, player.x, player.y, player.width, player.height);
      };
    }
  }

  //score
  context.fillStyle = 'black';
  context.font = '20px courier';
  context.fillText(`${score}p`, 5, 20);
}

// ballを飛び越えたかの判定をしたいよね。。。
function placeCactus() {
  if (gameOver) {
    return;
  }

  //place cactus
  let obstacle = {
    id: obstacleId,
    img: null,
    x: obstacleX,
    y: obstacleY,
    width: null,
    height: obstacleHeight,
    isDodged: false,
  };
  obstacleId += 1;

  //ここはそんな気にしなくてよくて、、、
  let placeCactusChance = Math.random(); // 0 - 0.9999...

  if (placeCactusChance > 0.5) {
    // 50% you get cactus1
    obstacle.img = obstacle1Img;
    obstacle.width = obstacle1Width;
    obstacles.push(obstacle);
  }

  // ここのcactus arrayがよくわからないんだよな。。。
  // console.log('cactuses -> ', cactusArray);
  // memoryめちゃくちゃ食うし、そのために減らしているんだね。
  if (obstacles.length > 5) {
    obstacles.shift(); //remove the first element from the array so that the array doesn't constantly grow
  }
}

// 要はぶつかったかどうかの判定をするコード。ぶつかっている状態ならgame overにするっていうロジック。
function detectCollision(a, b) {
  return (
    a.x < b.x + b.width && // a's top left corner doesn't reach b's top right corner
    a.x + a.width > b.x && // a's top right corner passes b's top left corner
    a.y < b.y + b.height && // a's top left corner doesn't reach b's bottom left corner
    a.y + a.height > b.y
  ); // a's bottom left corner passes b's top left corner
}

function detectCollision(a, b) {
  if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) {
    // ぶつかっています！！
    return true;
  } else {
    if (!b.isDodged) {
    }
  }
}

// -----以下の俺のコード
function dodged(a, b) {}

// jumpして避けるみたいな動作を加えようか。。。

// jumpをしてobstacleを飛び越えたみたいな関数をどうしよう。。。
function dodgeObstacle() {
  if (jumpTicket === 0) {
    return;
  }
  velocityY = -10;
  let collision = false;
  // if(){} //サボテン一つに対してのぶつかったかぶつからなかったか判定する関数をここで実行していきたい。。。
  // console.log('array is this -> ', cactusArray);
  // つまりだ、、、古くて左にすでに流れているものに関してもjumpをやっちゃっているよね。。。つまり、自分よりすでに左にあるものに関しては何もやらなくていんじゃね？？？？そうだよな。。
  for (let i = 0; i < obstacles.length; i++) {
    // 毎回のjumpの度に自分より左にあるものを消すのか。。。。どうやろうか・・・
    // if (isLocatedLeft(dino, cactus)) {
    //   cactusArray.splice(i, 1);
    //   console.log('after splice', cactusArray);
    // }
    // if(detectCollisionVer2(dino, cactus)){
    //   console.log('logging')
    // }
  }
  jumpTicket -= 1;

  console.log('jump rest', jumpTicket);
  if (!jumpTicket) {
    return;
  } else {
  }
  // console.log(collision);
  // if (!collision) {
  //   score += 10;
  // }
}

// 障害物を避けたっていう判定が必要なんだよね。ここをどうするかなんだが、、、、
function jumpDino(e) {
  velocityY = -10;
  score += 10;
}

// もうさ、シンプルにarrayでもつのやめようかね。その代わり、
// ballの種類を1 - 4つまでにしてrandom製にするかんじ。そっちの方が実装が楽かも。。。

// これで、飛び越えたかの判定をする。
function detectCollisionVer2() {
  return (
    a.x > b.x + b.width && //a's top left corner doesn't reach b's top right corner
    a.x + a.width < b.x && //a's top right corner passes b's top left corner
    a.y > b.y + b.height && //a's top left corner doesn't reach b's bottom left corner
    a.y + a.height < b.y
  );
}

// cactus arrayそれぞれに対してclick eventを発生させたい、ただそれだけよね。。
function isLocatedLeft(a, b) {
  return a.x > b.x + b.width;
}

// それより、arrayじゃなくてもう普通のobjectでいんじゃないかな。。。
// それとはまた別で
// arrayの状態を見るやつをまた別で置いておけばいいのか。。。
function seeScore() {
  for (let i = 0; i < obstacles.length; i++) {
    let obstacle = obstacles[i];
    if (!obstaclesTable[obstacle.id]) {
      if (isLocatedLeft(player, obstacle)) {
        score += 10;
        obstaclesTable[obstacle.id] = true;
      }
    } else {
    }
  }
}

// この感じで、jumpを監視するfunctionもあるといいのかもな。。。
function isJumpAvailable() {
  if (player.y === playerY) {
    jumpTicket = 2;
  }
}
