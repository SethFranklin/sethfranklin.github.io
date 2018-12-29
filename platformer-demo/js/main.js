
var canvas;
var context;
var interval;

var width;
var height;

var downnow = [];
var downbefore = [];

var data = [];

var pwidth = 0.75;
var pheight = 1.75;

var px; // position
var py;
var vx; // velocity
var vy;
var ax; // acceleration
var ay;

var bx; // top boundary box
var by;
var tx; // bottom boundary box
var ty;

var ox; // old position
var oy;
var dx;
var dy;

var grounded = false;
var flying = false;

var flywindow = 0.4;
var flytimer = -1;

var maxspeed = 5;
var walkaccel = 10;
var jump = 400;
var grav = 10;
var resistance = 2;

var loop = false;

var dt = 0.0166666667;

window.onload = function()
{

	canvas = document.getElementById("canvas");
	context = canvas.getContext("2d");

	width = 21;
	height = 15;

	px = 5;
	py = 5;
	vx = 0;
	vy = 0;

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

	downnow.length = 256;
	downbefore.length = 256;

	for (var i = 0; i < 256; i++)
	{

		downnow[i] = false;
		downbefore[i] = false;

	}

	interval = setInterval(frame, 16.666666667);

	canvas.onclick = function(e)
	{

		var a = Math.floor(e.clientX * width / canvas.width);
		var b = Math.floor(e.clientY * height / canvas.height);

		if (a >= 0 && b >= 0 && a < width && b < width) data[(height * a) + b] = !data[(height * a) + b];
		
	}

}

window.onkeydown = function(e)
{

	downnow[e.keyCode] = true;

}

window.onkeyup = function(e)
{

	downnow[e.keyCode] = false;

}

function frame()
{

	update();

	downbefore = downnow.slice(0);

	render();

}

function update()
{

	flytimer -= dt;

	ox = px;
	oy = py;

	ax = 0;
	ay = 0;

	// input

	if (keydown(68)) ax += walkaccel;
	if (keydown(65)) ax -= walkaccel;
	if (keypressed(87))
	{

		if (flytimer > 0)
		{

			flying = !flying;
			flytimer = -1;
			grounded = false;

		}
		else
		{

			flytimer = flywindow;

		}

		if (grounded) ay = -jump;

	}

	ax += -resistance * vx;
	if (flying) ay += -resistance * vy;

	if (flying && keydown(83)) ay += walkaccel;
	if (flying && keydown(87)) ay -= walkaccel;

	if (!flying) ay += grav;

	vx += ax * dt;
	vx = Math.min(Math.max(-maxspeed, vx), maxspeed);
	px += vx * dt;

	bx = Math.max(0, Math.floor(px));
	tx = Math.min(width, Math.ceil(px + pwidth));
	by = Math.max(0, Math.floor(oy));
	ty = Math.min(height, Math.ceil(oy + pheight));

	if (collision())
	{

		if (vx > 0)
		{

			dx = -1;
			px = Math.floor(px + pwidth) - pwidth;

		}
		else
		{

			dx = 1;
			px = Math.ceil(px);

		}

		bx = Math.max(0, Math.floor(px));
		tx = Math.min(width, Math.ceil(px + pwidth));

		loop = collision();

		while (loop)
		{

			px += dx;

			bx += dx;
			tx += dx;

			loop = collision();

		}

		vx = 0;

	}

	vy += ay * dt;
	if (flying) vy = Math.min(Math.max(-maxspeed, vy), maxspeed);
	py += vy * dt;

	bx = Math.max(0, Math.floor(ox));
	tx = Math.min(width, Math.ceil(ox + pwidth));
	by = Math.max(0, Math.floor(py));
	ty = Math.min(height, Math.ceil(py + pheight));

	grounded = false;

	if (collision())
	{

		if (vy > 0)
		{

			dy = -1;
			py = Math.floor(py + pheight) - pheight;

			grounded = true;
			flying = false;

		}
		else
		{

			dy = 1;
			py = Math.ceil(py);

		}

		by = Math.max(0, Math.floor(py));
		ty = Math.min(height, Math.ceil(py + pheight));

		loop = collision();

		while (loop)
		{

			py += dy;

			by += dy;
			ty += dy;

			loop = collision();

		}

		vy = 0;

	}

}

function collision()
{

	for (var ix = bx; ix < tx; ix++)
	{

		for (var iy = by; iy < ty; iy++)
		{

			if (data[(height * ix) + iy]) return true;

		}

	}

	return false;

}

function render()
{

	context.fillStyle = "#ffffff";
	context.fillRect(0, 0, canvas.width, canvas.height);

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

	context.fillStyle = "#0000ff";

	context.fillRect(px * deltax, py * deltay, pwidth * deltax, pheight * deltay);

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