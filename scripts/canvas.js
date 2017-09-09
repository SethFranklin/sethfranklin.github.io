
var Canvas;
var RenderContext;
var Balls = [];
var Masses = [];
var FrameInterval;
var MinimumRadius = 1;
var MaximumRadius = 5;
var FallSpeed = 1;
var BallRadius = 3;
var MassRadius = 2;
var MassConstant = 1000000;
var FrameRate = 60;

var MouseX;
var MouseY;

function LoadPage()
{

	Canvas = document.getElementById("canvas");
	RenderContext = Canvas.getContext("2d");

	Balls.push(Canvas.width / 3, Canvas.height / 2, 0, 40);

	for (i = 0; i < 30; i++)
	{

		Balls.push(Math.random() * Canvas.width, Math.random() * Canvas.height, (Math.random() * 100) - 50, (Math.random() * 100) - 50);

	}

	Masses.push(Canvas.width / 2, Canvas.height / 2);

	FrameInterval = setInterval(Update, 1000 / FrameRate);
	Canvas.addEventListener("click", NewMass, false);
	Canvas.addEventListener("mousemove", MouseMoved, false);

}

function Update()
{

	ClearScreen("#000000");
	MoveBalls(1 / FrameRate);
	RenderBalls();
	RenderMasses();

}

function MoveBalls(DeltaTime)
{

	for (var SnowFlakeIndex = 0; SnowFlakeIndex < Balls.length / 4; SnowFlakeIndex++)
	{

		var XValue = Balls[(SnowFlakeIndex * 4)];
		var YValue = Balls[(SnowFlakeIndex * 4) + 1];
		var XVelocity = Balls[(SnowFlakeIndex * 4) + 2];
		var YVelocity = Balls[(SnowFlakeIndex * 4) + 3];

		var XAcceleration = 0;
		var YAcceleration = 0;

		for (var MassIndex = 0; MassIndex < Masses.length / 2; MassIndex++)
		{

			var MassX = Masses[(MassIndex * 2)];
			var MassY = Masses[(MassIndex * 2) + 1];

			var YDifference = MassY - YValue;
			var XDifference = MassX - XValue;
			var Magnitude = Math.sqrt(Math.pow(YDifference, 2) + Math.pow(XDifference, 2));

			var Acceleration = MassConstant / Math.pow(Magnitude, 2);

			if (Magnitude > 10)
			{

				XAcceleration += Acceleration * XDifference / Magnitude;
				YAcceleration += Acceleration * YDifference / Magnitude;

			}

		}

		XVelocity += XAcceleration * DeltaTime;
		YVelocity += YAcceleration * DeltaTime;

		XValue += XVelocity * DeltaTime;
		YValue += YVelocity * DeltaTime;

		Balls[(SnowFlakeIndex * 4)] = XValue;
		Balls[(SnowFlakeIndex * 4) + 1] = YValue;
		Balls[(SnowFlakeIndex * 4) + 2] = XVelocity;
		Balls[(SnowFlakeIndex * 4) + 3] = YVelocity;

	}

}

function RenderBalls()
{

	RenderContext.fillStyle = "#FFFFFF";

	for (var SnowFlakeIndex = 0; SnowFlakeIndex < Balls.length / 4; SnowFlakeIndex++)
	{

		var XValue = Balls[SnowFlakeIndex * 4];
		var YValue = Balls[(SnowFlakeIndex * 4) + 1];

		RenderContext.beginPath();
		RenderContext.ellipse(XValue, YValue, BallRadius, BallRadius, 0, 0, 2 * Math.PI);
		RenderContext.fill();

	}

}

function RenderMasses()
{

	RenderContext.fillStyle = "#00FF00";

	for (var SnowFlakeIndex = 0; SnowFlakeIndex < Masses.length / 2; SnowFlakeIndex++)
	{

		var XValue = Masses[SnowFlakeIndex * 2];
		var YValue = Masses[(SnowFlakeIndex * 2) + 1];

		RenderContext.beginPath();
		RenderContext.ellipse(XValue, YValue, MassRadius, MassRadius, 0, 0, 2 * Math.PI);
		RenderContext.fill();

	}

	RenderContext.beginPath();
	RenderContext.ellipse(MouseX, MouseY, MassRadius, MassRadius, 0, 0, 2 * Math.PI);
	RenderContext.fill();

}

function ClearScreen(Color)
{

	RenderContext.fillStyle = Color;

	RenderContext.fillRect(0, 0, Canvas.width, Canvas.height);

}

function RandomIntTwoValues(Minimum, Maximum)
{

	return Math.round(Math.random() * (Maximum - Minimum)) + Minimum;

}

function NewBall()
{

	Balls.push(MouseX, MouseY, 0, 0);

}

function NewMass()
{

	Masses.push(MouseX, MouseY);

}

function MouseMoved(Mouse)
{

	var Rectangle = Canvas.getBoundingClientRect();
	MouseX = Mouse.clientX - Rectangle.left;
	MouseY = Mouse.clientY - Rectangle.top;

}
