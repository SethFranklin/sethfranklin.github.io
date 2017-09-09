
var Canvas;
var RenderContext;
var FrameInterval;

var BackgroundColor = "#000000";
var CircleColor = "#FFFFFF";

var RayAngle = 0;
var RayCount = 3;
var Rows = 12;
var CirclesPerRow = 30;
var RotateSpeed = 4;
var RowAngleOffset = Math.PI / 10;

var MinimumRadius = 5;
var MaximumRadius = 10;

var RowRadius = 30;

var TwoPi = Math.PI * 2;

var FrameRate = 60;
var DeltaTime;

function LoadPage()
{

	Canvas = document.getElementById("canvas");
	RenderContext = Canvas.getContext("2d");
	FrameInterval = setInterval(Update, 1000 / FrameRate);
	DeltaTime = 1 / FrameRate;

}

function Update()
{

	ClearScreen();

	RayAngle += DeltaTime * RotateSpeed;

	RenderCircles();

}

function ClearScreen()
{

	RenderContext.fillStyle = BackgroundColor;
	RenderContext.fillRect(0, 0, Canvas.width, Canvas.height);

}

function RenderCircles()
{

	RenderContext.fillStyle = CircleColor;

	for (RowIndex = 0; RowIndex < Rows; RowIndex++)
	{

		for (CircleIndex = 0; CircleIndex < CirclesPerRow; CircleIndex++)
		{

			var Angle = (CircleIndex / CirclesPerRow) * TwoPi;
			var CircleRadius = (RowIndex + 1) * RowRadius;
			var XValue = CircleRadius * Math.cos(Angle);
			var YValue = CircleRadius * Math.sin(Angle);
			var RenderRadius = ((MaximumRadius - MinimumRadius) * Math.acos(Math.cos(RayCount * (RayAngle - Angle + (RowAngleOffset * RowIndex)))) / Math.PI) + MinimumRadius;

			RenderContext.beginPath();
			RenderContext.ellipse(XValue + (Canvas.width / 2), YValue + (canvas.height / 2), RenderRadius, RenderRadius, 0, 0, TwoPi);
			RenderContext.fill();

		}

	}

}