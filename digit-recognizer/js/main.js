
var calculated = false;
var canvas;
var button;
var output;
var context;
var interval;

var width = 300;
var height = 300;

var constants = null;

var imagedata;

var mousedown = false;
var mousedownlast = false;
var mousex = 0;
var mousey = 0;
var lastx = 0;
var lasty = 0;
var canvasrect;
var HERMITE;

window.onload = function()
{

	canvas = document.getElementById("canvas");
	button = document.getElementById("button");
	output = document.getElementById("output");

	context = canvas.getContext('2d');
	canvasrect = canvas.getBoundingClientRect();

	HERMITE = new Hermite_class();

	context.fillStyle = "#000000";
	context.strokeStyle = "#ffffff";
	context.lineWidth = 20;
	context.lineCap = "round";
	context.fillRect(0, 0, width, height);

	interval = setInterval(update, 0.01666666667);

	HTTPRequest("GET", window.location.href + "/../js/constants.json").then(function(constantsource)
	{

		constants = JSON.parse(constantsource);

	});

	canvas.onmousedown = function()
	{

		mousedown = true;

	}

	canvas.onmouseup = function()
	{

		mousedown = false;

	}

	canvas.onmousemove = function(e)
	{

		mousex = e.clientX - canvasrect.left;
		mousey = e.clientY - canvasrect.top;

	}

	button.onclick = function()
	{

		if (!calculated)
		{

			if (constants != null)
			{

				HERMITE.resample_single(canvas, 28, 28, false);
				var data = context.getImageData(0, 0, 28, 28).data;
				imagedata = [];
				for (var i = 0; i < 784; i++) imagedata.push(data[i * 4]);
				var color;
				var boxx = width / 28;
				var boxy = height / 28;

				for (var x = 0; x < 28; x++)
				{

					for (var y = 0; y < 28; y++)
					{

						color = imagedata[(y * 28) + x]
						context.fillStyle = "rgb(" + color + "," + color + "," + color + ")";
						context.fillRect(x * boxx, y * boxy, boxx, boxy);

					}

				}

				var results = evaluate_network();
				var outputstring = "";

				var max = 0;
				var maxvalue = results[0];

				for (var i = 1; i < 10; i++)
				{

					if (results[i] > maxvalue)
					{

						max = i;
						maxvalue = results[i];

					}

				}

				var softsum = 0;
				for (var i = 0; i < 10; i++) softsum += results[i];
				for (var i = 0; i < 10; i++) results[i] *= 100.0 / softsum; // softmax

				outputstring += "Prediced number: " + max + " (" + results[max].toFixed(2) + "%)<br>";

				for (var i = 0; i < 10; i++) outputstring += "Probability of a " + i + ": " + results[i].toFixed(2) + "%<br>";

				output.innerHTML = outputstring;

				calculated = true;
				button.innerHTML = "Reset";

			}

		}
		else
		{

			context.fillStyle = "#000000";
			context.fillRect(0, 0, width, height);

			output.innerHTML = "";

			calculated = false;
			button.innerHTML = "Find digit";

		}

	}

}

function update()
{

	if (!calculated)
	{

		if (mousedown && mousedownlast && mousex > 0 && mousex < width && mousey > 0 && mousey < height && lastx > 0 && lastx < width && lasty > 0 && lasty < height)
		{

			context.beginPath();
			context.moveTo(lastx, lasty);
			context.lineTo(mousex, mousey);
			context.stroke();

		}

		mousedownlast = mousedown;
		lastx = mousex;
		lasty = mousey;

	}

}

function evaluate_network()
{

	var eval = [];
	var evaled = [];
	var c = 0;

	for (var i = 0; i < 16; i++)
	{

		sum = constants[c];
		c++;

		for (var j = 0; j < 784; j++)
		{

			sum += (imagedata[j] / 255) * constants[c];
			c++;

		}

		evaled.push(sigmoid(sum));

	}

	for (var i = 0; i < 16; i++)
	{

		sum = constants[c];
		c++;

		for (var j = 0; j < 16; j++)
		{

			sum += evaled[j] * constants[c];
			c++;

		}

		eval.push(sigmoid(sum));

	}

	evaled = [];

	for (var i = 0; i < 10; i++)
	{

		sum = constants[c];
		c++;

		for (var j = 0; j < 16; j++)
		{

			sum += eval[j] * constants[c];
			c++;

		}

		evaled.push(sigmoid(sum));

	}

	return evaled;


}

function sigmoid(x)
{

	return 1 / (1 + Math.exp(-x));

}

function HTTPRequest(RequestType, URL)
{

	return new Promise(function(Resolve, Reject)
	{

		var XMLHTTP = new XMLHttpRequest();

		XMLHTTP.open(RequestType, URL);

		switch (RequestType)
		{

			case "GET":	

				XMLHTTP.send();

				break;

		}

		XMLHTTP.onload = function()
		{

			if (XMLHTTP.status == 200) Resolve(XMLHTTP.response);
			else Reject(XMLHTTP.statusText);

		}

	});

}