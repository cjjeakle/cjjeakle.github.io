// Canvas creation and configuration
var canvas = document.createElement("canvas");
var context = canvas.getContext("2d");
canvas.style.border = '1px solid';
canvas.width = 450;
canvas.height = 350;

// Game components (speed is in px per sec)
var aiAccuracy; //how far ahead predictions are for the AI
var aiSpeed; //the speed of the AI's paddle movement
var playerSpeed; //the speed of the player's paddle
var ballYSpeed; //the default ball speed
var prev; //the previous value of time from "requestNextAnimationFrame()"
var paused; //whether or not the game is paused

// Paddle and ball objects
score = 0;
left = { 
	Speed: 0, 
	width: -1, 
	height: -1, 
	x: -1, 
	y: -1
};
right = { 
	Speed: 0, 
	width: -1, 
	height: -1, 
	x: -1, 
	y: -1
};
ball = { 
	xSpeed: 0, 
	ySpeed: 0, 
	width: -1, 
	height: -1, 
	x: -1, 
	y: -1
};
aiBall = { 
	xSpeed: 0, 
	ySpeed: 0, 
	width: -1, 
	height: -1, 
	x: -1, 
	y: -1
};



// Places game objects at their initial location and applies the default difficulty.
function initState(){
	score = 0;

	left.width = 10;
	left.height = 50;
	left.x = 0;
	left.y = 0,
	
	right.width = 10;
	right.height = 50;
	right.x = canvas.width - 10;
	right.y = 0;
	
	ball.xSpeed = 128;
	ball.width = 15;
	ball.height = 15;
	ball.x = left.width;
	ball.y = canvas.height / 2;

	aiBall.width = ball.width;
	aiBall.height = ball.height;
	aiBall.x = left.width;
	aiBall.y = canvas.height / 2;

	applyCurrentDifficulty();
}

// Applies the current difficulty stored in the corresponding globals.
function applyCurrentDifficulty() {
	left.speed = playerSpeed;
	right.speed = aiSpeed;
	ball.ySpeed = ballYSpeed;
	aiBall.xSpeed = (ball.xSpeed * aiAccuracy);
	aiBall.ySpeed = (ball.ySpeed * aiAccuracy);
}



//Watch for keyboard input
var up = false, dn = false;
addEventListener("keydown", function (e) {
	
	if([38, 40].indexOf(e.keyCode) > -1)
	{
		e.preventDefault(); //prevent arrow key nav on the page
	}
	if(e.keyCode == 38)
	{
		up = true;
	}
	if(e.keyCode == 40)
	{
		dn = true;
	}
}, false);

addEventListener("keyup", function (e) {
	if(e.keyCode == 38)
	{
		up = false;
	}
	if(e.keyCode == 40)
	{
		dn = false;
	}
}, false);

//watch for mouse/touch input
var mouse = false;
var mouseY = 0;
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
	if (!seconds)
	{
		//there are glitches where a browser can feed in a null time,
		//which can break absolutely everything
		return; 
	}
	var positiveSpeed = (ball.xSpeed > 0);
	var inRightCourt = (ball.x > canvas.width / 2);

	//update ball locations	
	ball.x += ball.xSpeed * seconds;
	ball.y += ball.ySpeed * seconds;
	aiBall.x += aiBall.xSpeed * seconds;
	aiBall.y += aiBall.ySpeed * seconds;

	//use keyboard and mouse input
	if (up || (mouse && mouseY < left.y + left.height / 2)) {
		left.y -= left.speed * seconds;
		if (left.y < 0)
		{
			left.y = 0;
		}
	}
	if (dn || (mouse && mouseY > left.y + left.height / 2)) {
		left.y += left.speed * seconds;
		if (left.y + left.height > canvas.height)
		{
			left.y = canvas.height - left.height;
		}
	}

	simulateAi(seconds);

	collisions(ball);
	collisions(aiBall);

	//scoring
	if (ball.x <= 0)
	{
		score -= 1;
		ball.x = (canvas.width - (right.width + ball.width));
		ball.y = Math.floor(Math.random() * canvas.height + 1);
	}
	else if (ball.x >= canvas.width)
	{
		score += 1;
		ball.x = left.width;
		ball.y = Math.floor(Math.random() * canvas.height + 1);
	}
	if ((!positiveSpeed && ball.xSpeed > 0) || 
		(inRightCourt && ball.x < canvas.width / 2 && ball.xSpeed > 0))
	{
		refreshAi();
	}
}



//simulate AI by predicting where the ball will be
function refreshAi()
{
	aiBall.x = ball.x;
	aiBall.y = ball.y;
	aiBall.xSpeed = ball.xSpeed * aiAccuracy;
	aiBall.ySpeed = ball.ySpeed * aiAccuracy;
}

function simulateAi(seconds)
{
	if(aiBall.x + aiBall.width >= canvas.width - right.width)
	{
		aiBall.xSpeed = 0;
		aiBall.ySpeed = 0;
	}
	var diff = (right.y + (right.height / 2) - aiBall.y + (aiBall.height / 2));
	if  (diff >= right.speed * seconds && aiBall.xSpeed >= 0)
	{
		right.y -= right.speed * seconds;
		if (right.y < 0)
		{
			right.y = 0;
		}
	}
	else if (diff < -right.speed * seconds && aiBall.xSpeed >= 0)
	{
		right.y += right.speed * seconds;
		if (right.y + right.height > canvas.height)
		{
			right.y = canvas.height - right.height;
		}
	}
}


// Detect paddle collisions and bounce the ball back.
function collisions(inputBall)
{
	//Paddle Collisions
	if ((inputBall.x < left.width && (inputBall.y + inputBall.height > left.y) && 
		(inputBall.y <= left.y + left.height)))
	{	
		inputBall.x = left.width;
		inputBall.xSpeed = -inputBall.xSpeed;
		
		if (inputBall.y >= left.y + (left.height * 9 / 10)) //intense down
		{
			if (inputBall.ySpeed > 0)
			{
				inputBall.ySpeed *= 1.20;
			}
			else
			{
				inputBall.ySpeed *= -1.20;
			}
		}
		else if (inputBall.y + inputBall.height <= left.y + (left.height / 10)) //intense up
		{
			if (inputBall.ySpeed < 0)
			{
				inputBall.ySpeed *= 1.20;
			}
			else
			{
				inputBall.ySpeed *= -1.20;
			}
		}
		else if (inputBall.y >= left.y + (left.height * 3 / 4)) //slight down
		{
			inputBall.ySpeed += ballYSpeed * .05;
		}
		else if (inputBall.y + inputBall.height <= left.y + (left.height / 4)) //slight up
		{
			inputBall.ySpeed -= ballYSpeed * .05;
		}
	}
	else if (((inputBall.x + inputBall.width > canvas.width - right.width) && 
		(inputBall.y + inputBall.height > right.y) && 
		(inputBall.y <= right.y + right.height)))
	{
		inputBall.x = canvas.width - right.width - inputBall.width;
		inputBall.xSpeed = -inputBall.xSpeed;
	}
	//Ceiling and floor collisions
	if (inputBall.y < 0)
	{
		inputBall.y = 0;
		inputBall.ySpeed = -inputBall.ySpeed;
	}
	else if (inputBall.y + inputBall.height > canvas.height)
	{
		inputBall.y = canvas.height - inputBall.height;
		inputBall.ySpeed = -inputBall.ySpeed;
	}
	return inputBall;
}



// Draw everything
function draw() {
	//Clear the canvas for the next drawing cycle
	context.clearRect(0, 0, canvas.width, canvas.height);	
	
	//The Mid-line
	context.beginPath();
	context.moveTo(canvas.width / 2 - 2, 15);
	context.lineTo(canvas.width / 2 - 2, canvas.height);
	context.moveTo(canvas.width / 2 + 2, 15);
	context.lineTo(canvas.width / 2 + 2, canvas.height);
	context.strokeStyle = 'grey';
	context.stroke();
	
	//The left paddle
	context.beginPath();
	context.rect(left.x, left.y, left.width, left.height);
	context.fillStyle = 'black';
	context.fill();
	
	//The right paddle
	context.beginPath();
	context.rect(right.x, right.y, right.width, right.height);
	context.fillStyle = 'black';
	context.fill();
	
	//The ball
	context.beginPath()
	context.rect(ball.x, ball.y, ball.width, ball.height);
	context.fillStyle = 'grey';
	context.lineWidth = 1;
	context.strokeStyle = 'black';
	context.fill();
	context.stroke();
	
	//the aiBall, for debugging
	/*
	context.beginPath()
	context.rect(aiBall.x, aiBall.y, aiBall.width, aiBall.height);
	context.fillStyle = 'red';
	context.fill();
	*/
	
	//Score
	context.fillStyle = "#000000";
	context.font = "12px Helvetica";
	context.textAlign = "center";
	context.textBaseline = "top";
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

// Get the first value of time, since it is unknown until supplied
// This is a wrapper around the 'pingPong' function
function getStartTime(time)
{
	prev = time;
	requestNextAnimationFrame(pingPong);
}


/////////// Interface used in DOM ///////////

// Create a div with 'pingPong' as it's ID
// Once that div is loaded, call this function to generate a ping pong table
function createPingPong() {
	var div = document.getElementById('pingPong');
	div.appendChild(canvas);
	div.appendChild(document.createElement("br"));
}

// Start the game
function startPingPong()
{
	document.getElementById('startBtn').style.display = 'none';
	setStyleByClass('hidden', 'display:inherit;');
	requestNextAnimationFrame(getStartTime);
}

// Resets the game
function resetPingPong()
{
	initState();
	if (paused)
	{
		togglePingPongPause();
	}
}

// Sets the game's difficulty
function setPingPongDifficulty(diff)
{
	if (diff == 'easy')
	{
		aiAccuracy = 1.0;
		aiSpeed = 100;
		playerSpeed = 1024;
		ballYSpeed = 96;
	}
	else if (diff == 'medium')
	{
		aiAccuracy = 1.15;
		aiSpeed = 115;
		playerSpeed = 192;
		ballYSpeed = 128;
	}
	else if (diff == 'hard')
	{
		aiAccuracy = 1.25;
		aiSpeed = 130;
		playerSpeed = 128;
		ballYSpeed = 255;
	}

	applyCurrentDifficulty();
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

// Run one iteration of the game to display its starting state
setPingPongDifficulty('medium');
initState();
update(0);
draw();





