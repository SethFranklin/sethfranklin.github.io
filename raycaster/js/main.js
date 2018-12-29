
var canvas;
var ctx;

var width;
var height;

var data = [];
var int;

var yaw = 0.0;
var sensitivity = 1.0;

var fov = Math.PI / 2;

var xpos;
var ypos;

var speed = 1.0;
var deltatime = 0.016666667;

var downnow = [];
var downbefore = [];

var topdown = false;
var topwidth = 50.0;

var angle;
var hovertwo;
var ix;
var iy;
var mx;
var my;
var nx;
var ny;
var ia;
var stepx;
var stepy;
var raydistance = 10;
var invmag;
var light;

window.onload = function()
{

	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	ctx.lineWidth = 1;

	width = 10;
	height = 10;

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

	xpos = 2.5;
	ypos = 0.5;

	downnow.length = 256;
	downbefore.length = 256;

	for (var i = 0; i < 256; i++)
	{

		downnow[i] = false;
		downbefore[i] = false;

	}

	divide(0, 0, width - 1, height - 1, 50);

	int = setInterval(update, 16.666666667);

}

window.onmousemove = function(e)
{

	//yaw += e.movementX * sensitivity;

}

window.onresize = function()
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

}

window.onkeydown = function(e)
{

	downnow[e.keyCode] = true;

}

window.onkeyup = function(e)
{

	downnow[e.keyCode] = false;

}

function update()
{

	dx = 0.0;
	dy = 0.0;

	if (keydown(87))
	{

		dx += Math.cos(yaw);
		dy += Math.sin(yaw);

	}

	if (keydown(83))
	{

		dx -= Math.cos(yaw);
		dy -= Math.sin(yaw);
		
	}

	if (keydown(68))
	{

		dx -= Math.sin(yaw);
		dy += Math.cos(yaw);

	}

	if (keydown(65))
	{

		dx += Math.sin(yaw);
		dy -= Math.cos(yaw);

	}

	mag = Math.sqrt((dx * dx) + (dy * dy));

	if (mag > 0)
	{

		xpos += dx * speed * deltatime / mag;
		ypos += dy * speed * deltatime / mag;

	}

	if (keydown(37))
	{

		yaw -= deltatime * sensitivity;

	}

	if (keydown(39))
	{

		yaw += deltatime * sensitivity;

	}

	if (keypressed(49)) topdown = !topdown;

	downbefore = downnow.slice(0);

	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	hovertwo = canvas.height / 2;

	for (var i = 0; i < canvas.width; i++)
	{

		angle = yaw + (-fov / 2) + (i * fov / (canvas.width - 1));

		dx = Math.cos(angle) * raydistance;
		dy = Math.sin(angle) * raydistance;

		stepx = Math.abs(dx); // dy is 1
		stepy = Math.abs(dy); // dx is 1

		dx = dx / stepy;
		dy = dy / stepx;

		mx = 0;
		my = 0;

		if (dx > 0)
		{

			nx = 1;

		}
		else
		{

			nx = -1;

		}

		ia = 1;

		while (ia <= step)
		{

			if (data[(height * Math.floor(ix)) + Math.floor(iy)])
			{

				invmag = 1 / Math.sqrt((mx * mx) + (my * my));
				light = Math.min(Math.round(invmag * 256), 256);

				ctx.beginPath();
				ctx.moveTo(i, hovertwo + (hovertwo * invmag));
				ctx.lineTo(i, hovertwo - (hovertwo * invmag));
				ctx.strokeStyle = "rgb(" + light + "," + light + "," + light + ")";
				ctx.stroke();

				break;

			}

			ix += dx;
			iy += dy;
			mx += dx;
			my += dy;
			ia += 1;

		}

	}

	if (topdown)
	{

		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, width * topwidth, height * topwidth);

		ctx.fillStyle = "#000000";

		for (var x = 0; x < width; x++)
		{

			for (var y = 0; y < width; y++)
			{

				if (data[(height * x) + y]) ctx.fillRect(x * topwidth, y * topwidth, topwidth, topwidth);

			}

		}

		ctx.beginPath();
		ctx.arc(xpos * topwidth, ypos * topwidth, 3, 0, 2 * Math.PI, false);
		ctx.fillStyle = "#ff0000";
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(xpos * topwidth, ypos * topwidth);
		ctx.lineTo((xpos * topwidth) + (Math.cos(yaw) * 3), (ypos * topwidth) + (Math.sin(yaw) * 3));
		ctx.strokeStyle = "#000000";
		ctx.stroke();

	}

}

function keydown(a)
{

	return downnow[a];

}

function keypressed(a)
{

	return (downnow[a] && !downbefore[a]);

}

function keyreleased(a)
{

	return (!downnow[a] && downbefore[a]);

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