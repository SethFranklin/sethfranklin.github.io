
var canvas;
var context;

var width;
var height;

var data = [];

var color1;

var click1 = true;

var x1;
var y1;
var x2;
var y2;

window.onload = function()
{

	color1 = document.getElementById("color_value");
	canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");

	width = 10;
	height = 10;

	for (var i = 0; i < width * height; i++) data[i] = 0x00ff00; // numbers can hold two colors based on int max, but slower to do operations on

	render();

	canvas.onclick = function(e)
	{

		if (click1)
		{

			x1 = e.clientX;
			y1 = e.clientY;

			click1 = false;

		}
		else
		{

			x1 = e.clientX;
			y1 = e.clientY;

			click1 = true;

		}

	}

}

function render()
{

	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);

	var dx = canvas.width / width;
	var dy = canvas.height / height;

	for (var x = 0; x < width; x++)
	{

		for (var y = 0; y < height; y++)
		{

			context.fillStyle = "#" + ("00000" + data[(height * x) + y].toString(16)).substr(-6);
			context.fillRect(x * dx, y * dy, dx, dy);

		}

	}

}
