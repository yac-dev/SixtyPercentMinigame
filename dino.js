// スマホのサイズは480 * 800
//board
let board;
let boardWidth = 480;
let boardHeight = 600;
let context;

//dino
let dinoWidth = 88;
let dinoHeight = 94;
let dinoX = 20;
let dinoY = boardHeight - dinoHeight; // 600 - 94
let dinoImg;

// dinoのobjectをここで作っているのね。
// 実際に、今dinoがどこにいるかの情報をここで持っている。
let dino = {
  x: dinoX,
  y: dinoY,
  width: dinoWidth,
  height: dinoHeight,
};

//cactus
let cactusArray = [];

// さぼてんの横の大きさをここで定義している。
let cactus1Width = 80;
let cactus2Width = 160;
let cactus3Width = 102;

let cactusHeight = 70;
//最初、サボテンがどの位置で始めるかをここで定義しているのね。
let cactusX = 480;
let cactusY = boardHeight - cactusHeight;

let cactus1Img;
let cactus2Img;
let cactus3Img;

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

  dinoImg = new Image();
  dinoImg.src = './img/mario_8bit.png';
  dinoImg.onload = function () {
    context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
  };

  cactus1Img = new Image();
  cactus1Img.src = './img/Basketball.png';

  cactus2Img = new Image();
  cactus2Img.src = './img/cactus2.png';

  cactus3Img = new Image();
  cactus3Img.src = './img/cactus3.png';

  // まあ、とにかくこの3つはブラウザが開いた瞬間にブラウザで登録されるやつね。
  // 1. うえから順に、再描画できるタイミングでupdate関数を出す。
  // 2. 1000秒ごとに障害物をランダムに作る
  // 3. clickおしたら、dionをジャンプさせる
  // これら３つのfunctionを登録している。
  requestAnimationFrame(update);
  setInterval(placeCactus, 1000); //1000 milliseconds = 1 second
  // document.addEventListener('keydown', moveDino); // 最初のコード
  // document.addEventListener('click', jumpDino); // 次、俺のjumpでのscreo更新
  // これ、今の状態だと、無限ジャンプできちゃうね。。。
  document.addEventListener('click', dodgeObstacle);
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
  dino.y = Math.min(dino.y + velocityY, dinoY); //apply gravity to current dino.y, making sure it doesn't exceed the ground
  context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);

  //cactus
  for (let i = 0; i < cactusArray.length; i++) {
    let cactus = cactusArray[i];
    cactus.x += velocityX;
    context.drawImage(cactus.img, cactus.x, cactus.y, cactus.width, cactus.height);

    if (detectCollision(dino, cactus)) {
      gameOver = true;
      dinoImg.src = './img/mario_8bit_dead.png';
      dinoImg.onload = function () {
        context.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
      };
    }
  }

  //score
  // score += 10; // これだと、再描画のたびにscoreを更新し続けちゃうのか。。。。。
  context.fillStyle = 'black';
  context.font = '20px courier';
  context.fillText(`${score}p`, 5, 20);
}

// ballを飛び越えたかの判定をしたいよね。。。
function moveDino(e) {
  if (gameOver) {
    return;
  }

  if ((e.code == 'Space' || e.code == 'ArrowUp') && dino.y == dinoY) {
    //jump
    velocityY = -10;
    if (!gameOver) {
      score += 10;
    }
  } else if (e.code == 'ArrowDown' && dino.y == dinoY) {
    //duck
  }
}

function placeCactus() {
  if (gameOver) {
    return;
  }

  //place cactus
  let cactus = {
    img: null,
    x: cactusX,
    y: cactusY,
    width: null,
    height: cactusHeight,
  };

  //ここはそんな気にしなくてよくて、、、
  let placeCactusChance = Math.random(); // 0 - 0.9999...

  if (placeCactusChance > 0.5) {
    // 50% you get cactus1
    cactus.img = cactus1Img;
    cactus.width = cactus1Width;
    cactusArray.push(cactus);
  }

  // ここのcactus arrayがよくわからないんだよな。。。
  // console.log('cactuses -> ', cactusArray);
  // memoryめちゃくちゃ食うし、そのために減らしているんだね。
  if (cactusArray.length > 5) {
    cactusArray.shift(); //remove the first element from the array so that the array doesn't constantly grow
  }
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width && //a's top left corner doesn't reach b's top right corner
    a.x + a.width > b.x && //a's top right corner passes b's top left corner
    a.y < b.y + b.height && //a's top left corner doesn't reach b's bottom left corner
    a.y + a.height > b.y
  ); //a's bottom left corner passes b's top left corner
}

// -----以下の俺のコード
function dodged(a, b) {}

// jumpして避けるみたいな動作を加えようか。。。
function dodgeObstacle() {
  velocityY = -10;
  // if(){} //サボテン一つに対してのぶつかったかぶつからなかったか判定する関数をここで実行していきたい。。。
  console.log('array is this -> ', cactusArray);
  for (let i = 0; i < cactusArray.length; i++) {
    let cactus = cactusArray[i];
    if (!detectCollision(dino, cactus)) {
      score += 10;
    }
  }
}

// 障害物を避けたっていう判定が必要なんだよね。ここをどうするかなんだが、、、、
function jumpDino(e) {
  velocityY = -10;
  score += 10;
}

// もうさ、シンプルにarrayでもつのやめようかね。その代わり、
// ballの種類を1 - 4つまでにしてrandom製にするかんじ。そっちの方が実装が楽かも。。。
