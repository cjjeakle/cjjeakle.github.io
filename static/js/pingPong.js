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
var prev = 0;       //the previous value of time from "requestAnimationFrame()"
var paused = false; //whether or not the game is paused
var mouse = false;  //whether mouse input is being provided
var mouseY = 0;     //the current mouse y-index in the canvas
var touch = false;  //whether touch input is being provided
var touchY = 0;     //the current touch y-index in the canvas
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

var desiredWidthToHeightRatio = 10 / 7;
var maxWidth = 450;
var minWidth = 0;
var lowestPoint_highestVal = Math.floor(maxWidth / desiredWidthToHeightRatio);
var highestPoint_lowestVal = 0;

var leftGoalLocation = function() { return minWidth; };
var rightGoalLocation = function() { return maxWidth; };
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


// Randomly returns either 1 or -1
function randomNegOrPos()
{
    return Math.floor(Math.random() * 2) > 0 ? 1 : -1;
}

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
    ball.x = rightPaddle.getLeft() - ball.width;
    ball.y = rightPaddle.getMidpoint() - Math.floor(ball.height / 2);
    resetAi();
}

function resetAi()
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
        aiPaddleSpeed = 125;
        playerPaddleSpeed = 192;
        ballXSpeed = 192;
        ballYSpeed = 128;
    }
    else if (diff == hardName)
    {
        lookaheadRate = 1.25;
        aiPaddleSpeed = 175;
        playerPaddleSpeed = 128;
        ballXSpeed = 256;
        ballYSpeed = 256;
    }
    else
    {
        throw "Invalid difficulty value: " + diff;
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

// Watch for mouse input
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

// Watch for touch input
canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    mouse = false; // touch input overrides mouse input
    touch = true;
    var bound = canvas.getBoundingClientRect();
    touchY = e.targetTouches[0].clientY - bound.top; // Only use the first touch if user is multi-touching
}, false);
canvas.addEventListener('ontouchend', function (e) {
    touch = false;
}, false);

//Update game objects
function update(seconds) {
    applyMouseInput(seconds);
    applyTouchInput(seconds);

    if(!isPointScored(ball))
    {
        updateBall(seconds);
        updateAiBall(seconds);
        applyCollisions(ball);
        applyCollisions(aiBall);
    }
}

function applyMouseInput(seconds)
{
    if (mouse) {
        movePaddleTowardCoordinate(seconds, leftPaddle, mouseY);
    }
}

function applyTouchInput(seconds)
{
    if (touch) {
        movePaddleTowardCoordinate(seconds, leftPaddle, touchY);
    }
}

function movePaddleTowardCoordinate(seconds, inputPaddle, yIndex)
{
    var displacement = Math.ceil(inputPaddle.speed * seconds);

    if (Math.abs(inputPaddle.getMidpoint() - yIndex) <= displacement) { // move the paddle to the given index if possible
        snapPaddleToCoordinate(inputPaddle, yIndex);
    } else if (yIndex < inputPaddle.getMidpoint()) { // move the paddle up toward the given index
        movePaddleUp(inputPaddle, displacement);
    } else if (yIndex > inputPaddle.getMidpoint()) { // move the paddle up toward the given index
        movePaddleDown(inputPaddle, displacement);
    }

    enforcePaddleUpperBound(inputPaddle);
    enforcePaddleLowerBound(inputPaddle);
}

function snapPaddleToCoordinate(inputPaddle, yIndex)
{
    inputPaddle.y = yIndex - Math.floor(inputPaddle.height / 2);
}

function movePaddleUp(inputPaddle, displacement)
{
    inputPaddle.y -= displacement;
    
}

function movePaddleDown(inputPaddle, displacement)
{
    inputPaddle.y += displacement;
}

function enforcePaddleUpperBound(inputPaddle)
{
    if (inputPaddle.getTop() < highestPoint_lowestVal) {
        inputPaddle.y = highestPoint_lowestVal;
    }
}

function enforcePaddleLowerBound(inputPaddle)
{
    if (inputPaddle.getBottom() > lowestPoint_highestVal) {
        inputPaddle.y = lowestPoint_highestVal - inputPaddle.height;
    }
}

function isPointScored()
{
    var pointScored = false;
    if (ball.x <= leftGoalLocation())
    {
        score -= 1;
        startOnLeft();
        pointScored = true;
    }
    else if (ball.x >= rightGoalLocation())
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
    if (inputBall.getTop() >= inputPaddle.getBottom() - Math.floor(inputPaddle.height / 5)) //intense down
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
    else if (inputBall.getBottom() <= inputPaddle.getTop() + Math.ceil(inputPaddle.height / 5)) //intense up
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
    else if (inputBall.getTop() >= inputPaddle.getBottom() - Math.floor(inputPaddle.height / 3)) //slight down
    {
        inputBall.ySpeed *= modestBounceModifier;
    }
    else if (inputBall.getBottom() <= inputPaddle.getTop() + Math.ceil(inputPaddle.height / 3)) //slight up
    {
        inputBall.ySpeed *= 1 + (1 - modestBounceModifier);
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
    requestAnimationFrame(pingPong);
}

// A wrapper call to get the initial time from requestAnimationFrame 
function beginPingPong(time)
{
    prev = time;
    requestAnimationFrame(pingPong);
}


/////////// Interface used in DOM ///////////


// Create a div with 'pingPong' as it's ID
// Once that div is loaded, call this function to generate a ping pong table
function createPingPong() {
    // Add the canvas to the DOM in the pingPong div
    var div = document.getElementById('pingPong');
    div.appendChild(canvas);
    div.appendChild(document.createElement("br"));

    // Configure the canvas
    canvas.style.border = '1px solid';
    canvas.width = maxWidth;
    canvas.height = lowestPoint_highestVal;

    // Run one iteration of the game to display its starting state
    initState();
    setPingPongDifficulty(defaultDifficulty);
    update(0);
    draw();
}

// Start the game
function startPingPong()
{
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('gameControls').style.display = 'inherit';
    requestAnimationFrame(beginPingPong);
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


/////////// Initialize the game ///////////


createPingPong();
setPingPongDifficulty('medium');
