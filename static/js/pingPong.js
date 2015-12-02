// Note: Coordinates are from the top left, eg:
/*

  0 ____\ x = n
  |     /
  |
 \ /
y = n

*/

// Create canvas
var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");

// Game state variables (speed is in px per sec)
var debug = false;  //whether any debug tools should be enabled
var prev = 0;       //the previous value of time from "requestNextAnimationFrame()"
var paused = false; //whether or not the game is paused
var up = false;     //whether the up arrow is currently pressed
var dn = false;     //whether the down arrow is currently pressed
var mouse = false;  //whether mouse input is being provided
var mouseY = 0;     //the current mouse y-index in the canvas
var initialBallXSpeed; //the x-axis speed to apply to the ball when serving
var initialBallYSpeed; //the y-axis speed to apply to the ball when serving

// Paddle and ball objects
// Initialized with nonsense values
var score = 0;
var leftPaddle = {
    Speed: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    getMidpoint: function() { return this.y + this.height / 2; },
    getTop: function() { return this.y; },
    getBottom: function() { return this.y + this.height; },
    getLeft: function() { return this.x; },
    getRight: function() { return this.x + this.width; },
    isPastHorizontalThreshold: function(inputBall) { return inputBall.getLeft() < this.getRight(); },
    isWithinVerticalRange: function(inputBall) { return (inputBall.getTop() <= this.getBottom()) && (inputBall.getBottom() >= this.getTop()); }
};
var rightPaddle = {
    Speed: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    getMidpoint: function() { return this.y + this.height / 2; },
    getTop: function() { return this.y; },
    getBottom: function() { return this.y + this.height; },
    getLeft: function() { return this.x; },
    getRight: function() { return this.x + this.width; },
    isPastHorizontalThreshold: function(inputBall) { return inputBall.getRight() > this.getLeft(); },
    isWithinVerticalRange: function(inputBall) { return (inputBall.getTop() <= this.getBottom()) && (inputBall.getBottom() >= this.getTop()); }
};
var ball = {
    xSpeed: 0,
    ySpeed: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    getTop: function() { return this.y; },
    getBottom: function() { return this.y + this.height; },
    getLeft: function() { return this.x; },
    getRight: function() { return this.x + this.width; },
};
var aiBall = {
    lookaheadRate: 0,
    xSpeed: 0,
    ySpeed: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    getTop: function() { return this.y; },
    getBottom: function() { return this.y + this.height; },
    getLeft: function() { return this.x; },
    getRight: function() { return this.x + this.width; },
    calculatedXSpeed: function() { return this.xSpeed * this.lookaheadRate; },
    calculatedYSpeed: function() { return this.ySpeed * this.lookaheadRate; }
};

// "Magic values", the basic constants the game is built upon
var easyName = 'easy';
var mediumName = 'medium';
var hardName = 'hard';
var defaultDifficulty = mediumName;

var intenseBounceModifier = 1.2;
var modestBounceModifier = 1.05;

var maxWidth = 450;
var minWidth = 0;
var lowestPoint_highestVal = 350;
var highestPoint_lowestVal = 0;

var leftGoal = minWidth;
var rightGoal = maxWidth;
var paddleWidth = 10;
var paddleHeight = 50;
var ballWidth = 15;
var ballHeight = 15;

var upArrowKeyCode = 38;
var dnArrowKeyCode = 40;

var midlineColor = 'grey';
var paddleColor = 'black';
var ballColor = 'grey';
var ballOutline = 'black';
var debugBallColor = 'red';

var fieldColor = '#000000';
var scoreFont = '12px Helvetica';
var scoreXAlign = 'center';
var scoreYAlign = 'top';


/////////// Utilities ///////////


function startOnLeft()
{
    ball.xSpeed = initialBallXSpeed;
    ball.ySpeed = randomNegOrPos() * initialBallYSpeed;
    ball.x = leftPaddle.getRight();
    ball.y = leftPaddle.getMidpoint() - Math.floor(ball.height / 2);
    resetAi();
}

function startOnRight()
{
    ball.xSpeed = -1 * initialBallXSpeed;
    ball.ySpeed = randomNegOrPos() * initialBallYSpeed;
    ball.x = rightPaddle.getLeft();
    ball.y = rightPaddle.getMidpoint() - Math.floor(ball.height / 2);
    resetAi();
}

// Randomly returns either 1 or -1
function randomNegOrPos()
{
    return Math.floor(Math.random() * 2) > 0 ? 1 : -1;
}

function resetAi ()
{
    aiBall.xSpeed = ball.xSpeed;
    aiBall.ySpeed = ball.ySpeed;
    aiBall.x = ball.x;
    aiBall.y = ball.y;
}


/////////// Game Implementation ///////////


// Sets the game's difficulty
function setPingPongDifficulty(diff)
{
    var lookaheadRate;
    var aiPaddleSpeed;
    var playerPaddleSpeed;
    var ballXSpeed;
    var ballYSpeed;

    if (diff == easyName)
    {
        lookaheadRate = 1.0;
        aiPaddleSpeed = 100;
        playerPaddleSpeed = 1024;
        ballXSpeed = 128;
        ballYSpeed = 96;
    }
    else if (diff == mediumName)
    {
        lookaheadRate = 1.15;
        aiPaddleSpeed = 115;
        playerPaddleSpeed = 192;
        ballXSpeed = 192;
        ballYSpeed = 128;
    }
    else if (diff == hardName)
    {
        lookaheadRate = 1.25;
        aiPaddleSpeed = 130;
        playerPaddleSpeed = 128;
        ballXSpeed = 256;
        ballYSpeed = 256;
    }

    initialBallXSpeed = ballXSpeed;
    initialBallYSpeed = ballYSpeed;

    if (ball.xSpeed < 0) {
        ballXSpeed *= -1;
    }
    if (ball.ySpeed < 0) {
        ballYSpeed *= -1;
    }

    leftPaddle.speed = playerPaddleSpeed;
    rightPaddle.speed = aiPaddleSpeed;

    ball.xSpeed = ballXSpeed;
    ball.ySpeed = ballYSpeed;
    
    aiBall.lookaheadRate = lookaheadRate;
    resetAi();
}

// Places game objects at their initial location and applies the default difficulty.
function initState(){
    score = 0;

    leftPaddle.width = paddleWidth;
    leftPaddle.height = paddleHeight;
    leftPaddle.x = minWidth;
    leftPaddle.y = Math.floor(lowestPoint_highestVal / 2 - leftPaddle.height / 2);
    
    rightPaddle.width = paddleWidth;
    rightPaddle.height = paddleHeight;
    rightPaddle.x = maxWidth - rightPaddle.width;
    rightPaddle.y = Math.floor(lowestPoint_highestVal / 2 - rightPaddle.height / 2);
    
    ball.width = ballWidth;
    ball.height = ballHeight;
    
    aiBall.width = ball.width;
    aiBall.height = ball.height;

    startOnLeft();
}

//Watch for keyboard input
addEventListener("keydown", function (e) {
    if([upArrowKeyCode, dnArrowKeyCode].indexOf(e.keyCode) > -1)
    {
        e.preventDefault(); //prevent arrow key nav on the page
    }
    if(e.keyCode == upArrowKeyCode)
    {
        up = true;
    }
    if(e.keyCode == dnArrowKeyCode)
    {
        dn = true;
    }
}, false);
addEventListener("keyup", function (e) {
    if(e.keyCode == upArrowKeyCode)
    {
        up = false;
    }
    if(e.keyCode == dnArrowKeyCode)
    {
        dn = false;
    }
}, false);

//watch for mouse/touch input
canvas.addEventListener("mousemove", function (e) {
    mouse = true;
    mouseY = e.offsetY; 
    if (!mouseY)
    {
        var bound = canvas.getBoundingClientRect();
        mouseY = e.clientY - bound.top;
    }
}, false);
canvas.addEventListener("mouseout", function (e) {
    mouse = false;
}, false);

//Update game objects
function update(seconds) {
    applyKeyboardInput(seconds);
    applyMouseInput(seconds);

    if(!isPointScored(ball))
    {
        updateBall(seconds);
        updateAiBall(seconds);
        applyCollisions(ball);
        applyCollisions(aiBall);
    }    
}

function applyKeyboardInput(seconds)
{
    if (up) {
        movePaddleUp(leftPaddle, seconds);
    }
    if (dn) {
        movePaddleDown(leftPaddle, seconds);
    }
}

function applyMouseInput(seconds)
{
    if (mouse && mouseY < leftPaddle.getMidpoint()) {
        movePaddleUp(leftPaddle, seconds);
    }
    if (mouse && mouseY > leftPaddle.getMidpoint()) {
        movePaddleDown(leftPaddle, seconds);
    }
}

function movePaddleUp(inputPaddle, seconds)
{
    inputPaddle.y -= inputPaddle.speed * seconds;
    if (inputPaddle.getTop() < highestPoint_lowestVal)
    {
        inputPaddle.y = highestPoint_lowestVal;
    }
}

function movePaddleDown(inputPaddle, seconds)
{
    inputPaddle.y += inputPaddle.speed * seconds;
    if (inputPaddle.getBottom() > lowestPoint_highestVal)
    {
        inputPaddle.y = lowestPoint_highestVal - inputPaddle.height;
    }
}

function isPointScored()
{
    var pointScored = false;
    if (ball.x <= leftGoal)
    {
        score -= 1;
        startOnLeft();
        pointScored = true;
    }
    else if (ball.x >= rightGoal)
    {
        score += 1;
        startOnRight();
        pointScored = true;
    }
    return pointScored;
}

function updateBall(seconds)
{
    ball.x += ball.xSpeed * seconds;
    ball.y += ball.ySpeed * seconds;
    aiBall.x += aiBall.calculatedXSpeed() * seconds;
    aiBall.y += aiBall.calculatedYSpeed() * seconds;
}

function updateAiBall(seconds)
{
    if(aiBall.x + aiBall.width >= canvas.width - rightPaddle.width)
    {
        aiBall.xSpeed = 0;
        aiBall.ySpeed = 0;
    }
    var diff = (rightPaddle.y + (rightPaddle.height / 2) - aiBall.y + (aiBall.height / 2));
    if  (diff >= rightPaddle.speed * seconds && aiBall.calculatedXSpeed() >= 0)
    {
        rightPaddle.y -= rightPaddle.speed * seconds;
        if (rightPaddle.y < 0)
        {
            rightPaddle.y = 0;
        }
    }
    else if (diff < -rightPaddle.speed * seconds && aiBall.calculatedXSpeed() >= 0)
    {
        rightPaddle.y += rightPaddle.speed * seconds;
        if (rightPaddle.y + rightPaddle.height > canvas.height)
        {
            rightPaddle.y = canvas.height - rightPaddle.height;
        }
    }
}

// Detect collisions and bounce the ball back.
function applyCollisions(inputBall)
{
    //Paddle applyCollisions
    if (leftPaddle.isPastHorizontalThreshold(inputBall) && leftPaddle.isWithinVerticalRange(inputBall))
    {
        inputBall.x = leftPaddle.width;
        inputBall.xSpeed = -inputBall.xSpeed;
        applyPaddleAngleOfAttack(inputBall, leftPaddle);
        resetAi();
    }
    else if (rightPaddle.isPastHorizontalThreshold(inputBall) && rightPaddle.isWithinVerticalRange(inputBall))
    {
        inputBall.x = maxWidth - rightPaddle.width - inputBall.width;
        inputBall.xSpeed = -inputBall.xSpeed;
        applyPaddleAngleOfAttack(inputBall, rightPaddle);
    }

    //Ceiling and floor applyCollisions
    if (bottomCollision(inputBall))
    {
        inputBall.y = lowestPoint_highestVal - inputBall.height;
        inputBall.ySpeed = -inputBall.ySpeed;
    }
    else if (topCollision(inputBall))
    {
        inputBall.y = highestPoint_lowestVal;
        inputBall.ySpeed = -inputBall.ySpeed;
    }
}

// Apply a speed modifier to the ball based on how intense an angle the ball was hit at
function applyPaddleAngleOfAttack(inputBall, inputPaddle)
{
    if (inputBall.y >= inputPaddle.y + Math.floor(inputPaddle.height * 9 / 10)) //intense down
    {
        if (inputBall.ySpeed > 0)
        {
            inputBall.ySpeed *= intenseBounceModifier;
        }
        else
        {
            inputBall.ySpeed *= -intenseBounceModifier;
        }
    }
    else if (inputBall.y + inputBall.height <= inputPaddle.y + Math.ceil(inputPaddle.height / 10)) //intense up
    {
        if (inputBall.ySpeed < 0)
        {
            inputBall.ySpeed *= intenseBounceModifier;
        }
        else
        {
            inputBall.ySpeed *= -intenseBounceModifier;
        }
    }
    else if (inputBall.y >= inputPaddle.y + Math.floor(inputPaddle.height * 3 / 4)) //slight down
    {
        inputBall.ySpeed *= modestBounceModifier;
    }
    else if (inputBall.y + inputBall.height <= inputPaddle.y + Math.ceil(inputPaddle.height / 4)) //slight up
    {
        inputBall.ySpeed -= inputBall.ySpeed * .05;
    }
}

function bottomCollision(inputBall)
{
    return inputBall.getBottom() > lowestPoint_highestVal;
}

function topCollision(inputBall)
{
    return inputBall.getTop() < highestPoint_lowestVal;
}

// Draw everything
function draw() {
    // Clear the canvas for the next drawing cycle
    context.clearRect(0, 0, canvas.width, canvas.height);   
    
    // The Mid-line
    context.beginPath();
    context.moveTo(canvas.width / 2 - 2, 15);
    context.lineTo(canvas.width / 2 - 2, canvas.height);
    context.moveTo(canvas.width / 2 + 2, 15);
    context.lineTo(canvas.width / 2 + 2, canvas.height);
    context.strokeStyle = midlineColor;
    context.stroke();
    
    // The left paddle
    context.beginPath();
    context.rect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
    context.fillStyle = paddleColor;
    context.fill();
    
    // The right paddle
    context.beginPath();
    context.rect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
    context.fillStyle = paddleColor;
    context.fill();
    
    // The ball
    context.beginPath()
    context.rect(ball.x, ball.y, ball.width, ball.height);
    context.fillStyle = ballColor;
    context.lineWidth = 1;
    context.strokeStyle = ballOutline;
    context.fill();
    context.stroke();
    
    // The aiBall, for debugging
    if(debug)
    {
        context.beginPath()
        context.rect(aiBall.x, aiBall.y, aiBall.width, aiBall.height);
        context.fillStyle = debugBallColor;
        context.fill();
    }

    // Score
    context.fillStyle = fieldColor;
    context.font = scoreFont;
    context.textAlign = scoreXAlign;
    context.textBaseline = scoreYAlign;
    context.fillText("Score: " + score, canvas.width / 2.02, 0);
}

// Game driving function
function pingPong(time)
{
    var timer = time - prev;
    
    if (!paused)
    {
        update(timer / 1000);
        draw();
    }

    prev = time;
    requestNextAnimationFrame(pingPong);
}

// A wrapper call to get the initial time from requestNextAnimationFrame 
function beginPingPong(time)
{
    prev = time;
    requestNextAnimationFrame(pingPong);
}


/////////// Interface used in DOM ///////////


// Create a div with 'pingPong' as it's ID
// Once that div is loaded, call this function to generate a ping pong table
function createPingPong() {
    // Configure the canvas
    canvas.style.border = '1px solid';
    canvas.width = maxWidth;
    canvas.height = lowestPoint_highestVal;

    // Run one iteration of the game to display its starting state
    initState();
    setPingPongDifficulty(defaultDifficulty);
    update(0);
    draw();
    
    // Add the canvas to the DOM in the pingPong div
    var div = document.getElementById('pingPong');
    div.appendChild(canvas);
    div.appendChild(document.createElement("br"));
}

// Start the game
function startPingPong()
{
    document.getElementById('startBtn').style.display = 'none';
    setStyleByClass('hidden', 'display:inherit;');
    requestNextAnimationFrame(beginPingPong);
}

// Resets the game
function resetPingPong()
{
    setPingPongDifficulty(defaultDifficulty);
    initState();
    if (paused)
    {
        togglePingPongPause();
    }
}

// Pauses and un-pauses the game
function togglePingPongPause()
{
    paused = !paused;
    if (paused)
    {
        document.getElementById('pauseBtn').innerHTML = '&nbsp;Resume&nbsp;';
    }
    else
    {
        document.getElementById('pauseBtn').innerHTML = '&nbsp;Pause&nbsp;';
    }
}
