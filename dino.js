let board;
let boardWidth = 400;
let boardHeight = 550;
let context;

// player objectをここで作る。
let playerWidth = 88;
let playerHeight = 94;
let playerX = 0;
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

// 障害物の横の大きさをここで定義する。
let obstacle1Width = 55;
let obstacle2Width = 140;
let obstacle3Width = 102;

let obstacleHeight = 55; // おおよそろくおの頭の大きさくらいに設定
let obstacle2Height = 140;
let obstacleX = 400;
// let obstacleY = boardHeight - obstacleHeight;
// obstacleYかなあとは、、、

let obstacle1Img;
let obstacle2Img;
let obstacle3Img;

// let velocityX = -6; // 障害物の速さ（左方向へ動いていく） scoreの値によって変動させていく。
let velocityY = 0; // playerのジャンプ力。
let gravity = 0.35; // playerの重力。 0.1とかににすると月面空間を飛んでいるような挙動になる。 これもscoreの値によって変動させていく。

let gameOver = false;
let score = 0;

let jumpCount = 0;
const defaultAvailableJumpCount = 2;
let jumpRest = defaultAvailableJumpCount;

window.onload = function () {
  board = document.getElementById('board');
  board.height = boardHeight;
  board.width = boardWidth;

  context = board.getContext('2d'); // 画面の描画
  // context.fillStyle="green";
  // context.fillRect(player.x, player.y, player.width, player.height);

  playerImg = new Image();
  playerImg.src = 'https://cdn.shopify.com/s/files/1/0066/0360/4086/files/60__minigame_1.png?v=1711333289';
  playerImg.onload = function () {
    context.drawImage(playerImg, player.x, player.y, player.width, player.height);
  };

  obstacle1Img = new Image();
  obstacle1Img.src = 'https://cdn.shopify.com/s/files/1/0066/0360/4086/files/60__minigame_3.png?v=1711333288';

  obstacle2Img = new Image();
  obstacle2Img.src = './Images/ball.png';

  requestAnimationFrame(update);
  setInterval(generateObstacle, 1100);
  document.addEventListener('click', dodgeObstacle);
  setInterval(seeScore, 100);
  setInterval(recoverJump, 100);
};

function update() {
  requestAnimationFrame(update);
  if (gameOver) {
    return;
  }
  context.clearRect(0, 0, board.width, board.height);

  velocityY += gravity;
  player.y = Math.min(player.y + velocityY, playerY);
  context.drawImage(playerImg, player.x, player.y, player.width, player.height);

  for (let i = 0; i < obstacles.length; i++) {
    let obstacle = obstacles[i];
    obstacle.x += obstacle.velocityX;
    // 以下でballを回転させるアニメーションを加える
    context.save();
    context.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
    context.rotate((obstacle.rotationAngle * Math.PI) / 180);
    context.drawImage(obstacle.img, -obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height);
    context.restore();

    // decrementだと反時計回りに、incrementだと時計回りになる。
    obstacle.rotationAngle -= 6;

    if (detectCollision(player, obstacle)) {
      gameOver = true;
      playerImg.src = 'https://cdn.shopify.com/s/files/1/0066/0360/4086/files/60__minigame_2-2.png?v=1711333288';
      playerImg.onload = function () {
        // context.drawImage(playerImg, player.x, player.y, player.width, player.height);
        context.clearRect(player.x, player.y, player.width, player.height); // Clear previous player image
        context.drawImage(playerImg, player.x, player.y, 200, 100);
      };
    }
  }

  // scoreの描画
  context.fillStyle = 'black';
  context.font = '80px courier';
  context.fillText(`${score}p`, 150, 70);
}

function generateObstacle() {
  if (gameOver) {
    return;
  }

  const obstacle = {
    id: obstacleId,
    img: null,
    x: obstacleX,
    y: null,
    width: null,
    height: null,
    isDodged: false,
    velocityX: -6,
  };
  obstacleId += 1;

  // obstacleの種類は全部で3つ。1体、2体連結, 3体連結
  let obstacleChance = Math.random(); // 0 - 0.9999...
  if (obstacleChance > 0.6) {
    obstacle.img = obstacle1Img;
    obstacle.width = obstacle1Width;
    obstacle.height = obstacleHeight;
    obstacle.y = boardHeight - obstacleHeight;
    obstacle.rotationAngle = 0;
    obstacles.push(obstacle);
  }

  // if (obstacleChance < 0.4 && obstacleChance >= 0.1) {
  //   obstacle.img = obstacle1Img;
  //   obstacle.width = obstacle1Width;
  //   obstacle.height = obstacleHeight;
  //   obstacle.y = boardHeight - obstacleHeight;
  //   obstacle.velocityX = -8;
  //   obstacle.rotationAngle = 0;
  //   obstacles.push(obstacle);
  // }

  // 一割の確率で、障害物のスピードに緩急をつける。(少し遅いものと早いもの)
  if (obstacleChance < 0.1) {
    let which = Math.random();
    if (which > 0.5) {
      obstacle.img = obstacle1Img;
      obstacle.width = obstacle1Width;
      obstacle.height = obstacleHeight;
      obstacle.y = boardHeight - obstacleHeight;
      obstacle.velocityX = -4;
      obstacle.rotationAngle = -2;
      obstacles.push(obstacle);
    } else {
      obstacle.img = obstacle1Img;
      obstacle.width = obstacle1Width;
      obstacle.height = obstacleHeight;
      obstacle.y = boardHeight - obstacleHeight;
      obstacle.velocityX = -8;
      obstacle.rotationAngle = 5;
      obstacles.push(obstacle);
    }
  }

  if (obstacles.length > 5) {
    obstacles.shift(); // 配列は無限に長くならないように、5より大きい場合は最初を削る。
  }
}

// aとbがぶつかったかを判定する役。ぶつかっていたらtrueを返す。基本的に、playerとobstacleに使うことになる。
function detectCollision(a, b) {
  // 以下4条件を全部満たしている場合は、trueを返し部使っている判定をする。
  return (
    a.x < b.x + b.width && // aの左上がbの右上に達していないこと
    a.x + a.width - 15 > b.x && // aの右上がbの左上を通り過ぎていること
    a.y < b.y + b.height && // aの左上がbの左下に達していないこと
    a.y + a.height - 15 > b.y // aの左下がbの左上を通っていること
  );
}

function dodgeObstacle() {
  if (jumpRest === 0) {
    return;
  }
  velocityY = -10;
  jumpRest -= 1;
}

function isLocatedLeft(a, b) {
  return a.x > b.x + b.width;
}

// obstacleが通ったかを監視する役
function seeScore() {
  for (let i = 0; i < obstacles.length; i++) {
    let obstacle = obstacles[i];
    if (!obstaclesTable[obstacle.id]) {
      if (isLocatedLeft(player, obstacle)) {
        score += 10;
        // scoreが100の倍数になるにつれて0.3上げていく、そんで、playerの重力も下げていく方がいいかも。
        if (score % 100 === 0) {
          velocityX -= 0.2;
        }
        // if (velocityX <= 7) {
        //   gravity -= 1;
        // }
        obstaclesTable[obstacle.id] = true;
      }
    } else {
    }
  }
}

// playerが地面に着いたら, jumpできる回数を回復させる
function recoverJump() {
  if (player.y === playerY) {
    jumpRest = 2;
  }
}

// function getResult(){}
