
var canvas;
var context;

var width;
var height;

var data = [];

window.onload = function()
{

	canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");

	width = 50;
	height = 50;

	for (var x = 0; x < width; x++)
	{

		for (var y = 0; y < height; y++)
		{

			data[(height * x) + y] = false;

		}

	}

	for (var i = 0; i < width; i++)
	{

		data[(height * i)] = true;
		data[(height * i) + height - 1] = true;

	}

	for (var i = 0; i < height; i++)
	{

		data[i] = true;
		data[(height * (width - 1)) + i] = true;

	}

	data[(height * 2)] = false;
	data[(height * (width - 1) + height - 3)] = false;

	divide(0, 0, width - 1, height - 1, 50);

	render();

}

function divide(x1, y1, x2, y2, iters) // recursive function
{

	var includeX = [];
	var includeY = [];

	for (var x = x1 + 2; x < x2 - 1; x++)
	{

		if (data[(height * x) + y1] && data[(height * x) + y2]) includeX.push(x);

	}

	for (var y = y1 + 2; y < y2 - 1; y++)
	{

		if (data[(height * x1) + y] && data[(height * x2) + y]) includeY.push(y);

	}

	var randomY;
	var randomX;

	if (includeX.length <= 0 && includeY.length <= 0) return; // exit

	if (includeY.length > 0)
	{

		randomY = includeY[Math.floor(Math.random() * includeY.length)];

		for (var x = x1 + 1; x < x2; x++)
		{

			data[(height * x) + randomY] = true;

		}

	}

	if (includeX.length > 0)
	{

		var randomX = includeX[Math.floor(Math.random() * includeX.length)];

		for (var y = y1 + 1; y < y2; y++)
		{

			data[(height * randomX) + y] = true;

		}

	}

	iters--;

	if (includeX.length > 0 && includeY.length > 0)
	{

		data[(height * randomX) + Math.floor(Math.random() * (randomY - y1 - 1)) + y1 + 1] = false;
		data[(height * randomX) + Math.floor(Math.random() * (y2 - randomY - 1)) + randomY + 1] = false;

		data[(height * (Math.floor(Math.random() * (randomX - x1 - 1)) + x1 + 1)) + randomY] = false;
		data[(height * (Math.floor(Math.random() * (x2 - randomX - 1)) + randomX + 1)) + randomY] = false;

		if (iters <= 0) return; // exit

		divide(x1, y1, randomX, randomY, iters);
		divide(randomX, y1, x2, randomY, iters);
		divide(x1, randomY, randomX, y2, iters);
		divide(randomX, randomY, x2, y2, iters);
	
	}
	else if (includeX.length > 0) // No more y split
	{

		data[(height * randomX) + Math.floor(Math.random() * (y2 - y1 - 1)) + y1 + 1] = false;

		if (iters <= 0) return; // exit

		divide(x1, y1, randomX, y2, iters);
		divide(randomX, y1, x2, y2, iters);

	}
	else // no more x split (includeY.length > 0)
	{

		data[(height * (Math.floor(Math.random() * (x2 - x1 - 1)) + x1 + 1)) + randomY] = false;

		if (iters <= 0) return; // exit

		divide(x1, y1, x2, randomY, iters);
		divide(x1, randomY, x2, y2, iters);

	}

}

function render()
{

	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, width, height);

	context.fillStyle = "#000000";

	var deltax = canvas.width / width;
	var deltay = canvas.height / height;

	for (var x = 0; x < width; x++)
	{

		for (var y = 0; y < height; y++)
		{

			if (data[(height * x) + y]) context.fillRect(x * deltax, y * deltay, deltax, deltay);

		}

	}

}