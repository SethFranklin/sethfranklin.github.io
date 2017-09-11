
var canvas;
var gl;
var VBO;
var Loop;
var Dimensions;
var Mouse = [];
var FrameTexture;
var BallSpeed = 0.4;
var ui, style, filter, signed;
var TextureArray;

var ScalarArray = [];

var Balls = [];
var FiltersList = [ "25Percent", "50Percent", "75Percent", "SolarEclipse", "InvertedEclipse", "Arushi", "GreenLines", "Murica", "Topographic", "Rainbow", "ThermalCamera"];

var Assets = {};

var Verticies =
[

	1.0, -1.0,
	-1.0, -1.0,
	-1.0,  1.0,
	1.0,  1.0,
	1.0, -1.0,
	-1.0,  1.0,

];

var Shader = function(Name, UniformList)
{

	var context = this;

	context.uniformmap = {};

	HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".vert").then(function(VertexSource)
	{

		HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".frag").then(function(FragmentSource)
		{

			var VertexShader = gl.createShader(gl.VERTEX_SHADER);
			var FragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

			gl.shaderSource(VertexShader, VertexSource);
			gl.shaderSource(FragmentShader, FragmentSource);

			gl.compileShader(VertexShader);
			gl.compileShader(FragmentShader);

			var VertTest = gl.getShaderParameter(VertexShader, gl.COMPILE_STATUS);
			var FragTest = gl.getShaderParameter(FragmentShader, gl.COMPILE_STATUS);

			if (!VertTest)
			{

				console.log("Vertex Shader (" + Name + ".vert) Compile Error:\n" + gl.getShaderInfoLog(VertexShader));

			}

			if (!FragTest)
			{

				console.log("Fragment Shader (" + Name + ".frag) Compile Error:\n" + gl.getShaderInfoLog(FragmentShader));

			}

			var ShaderProgram = gl.createProgram();

			gl.attachShader(ShaderProgram, VertexShader);
			gl.attachShader(ShaderProgram, FragmentShader);

			gl.linkProgram(ShaderProgram);

			var ProgramTest = gl.getProgramParameter(ShaderProgram, gl.LINK_STATUS);

			if (!ProgramTest)
			{

				console.log("Shader Program (" + Name + ") Compile Error:\n" + gl.getProgramInfoLog(ShaderProgram));

			}

			context.PositionLocation = gl.getAttribLocation(ShaderProgram, "VertexPosition");

			gl.enableVertexAttribArray(context.PositionLocation);
			gl.vertexAttribPointer(context.PositionLocation, 2, gl.FLOAT, false, 16, 0);

			for (var Uniform in UniformList)
			{

				context.uniformmap[UniformList[Uniform]] = gl.getUniformLocation(ShaderProgram, UniformList[Uniform]);

			}

			gl.deleteShader(VertexShader);
			gl.deleteShader(FragmentShader);

			context.ID = ShaderProgram;

		}, function(Reject)
		{

			console.log(Reject);

		});

	}, function(Reject)
	{

		console.log(Reject);

	});

	this.Use = function()
	{

		gl.enableVertexAttribArray(context.PositionLocation);
		gl.vertexAttribPointer(context.PositionLocation, 2, gl.FLOAT, false, 8, 0);

		gl.useProgram(context.ID);

	}

	this.SetUniform = function(Name, Value)
	{

		if (Number.isInteger(Value)) gl.uniform1i(context.uniformmap[Name], Value);
		else if (Value.length == 2) gl.uniform2f(context.uniformmap[Name], Value[0], Value[1]);
		else gl.uniform1f(context.uniformmap[Name], Value);

	}

	this.Destroy = function()
	{

		gl.deleteProgram(context.ID);
		context.ID = -1;

	}

};

var Texture = function(Name)
{

	var context = this;

	{

		context.ID = gl.createTexture();

		var pixel = new Uint8Array([255, 20, 147, 255]); // Set color to pink while it loads

		gl.bindTexture(gl.TEXTURE_2D, context.ID);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		var image = new Image();
		image.src = "/../software-balls/texture/" + Name + ".png";

		image.onload = function()
		{

			gl.bindTexture(gl.TEXTURE_2D, context.ID);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		}

	}

	this.Use = function(Location)
	{

		gl.activeTexture(gl.TEXTURE0 + Location);
		gl.bindTexture(gl.TEXTURE_2D, context.ID);

	}

	this.Destroy = function()
	{

		gl.deleteTexture(context.ID);

	}

}

var Metaball = function(nx, ny, sign, nr, nt)
{

	var context = this;

	{

		if (nr == undefined || nt == undefined)
		{

			context.ready = false;

			context.Position = [nx, ny];

			context.Velocity = [0, 0];

			context.Radius = 100;

			context.sign = sign;

		}
		else
		{

			context.ready = true;

			context.Position = [nx, ny];

			context.Velocity = [BallSpeed * Math.cos(nt), BallSpeed * Math.sin(nt)];

			context.Radius = nr;

			context.sign = sign;

		}

	}

	this.Update = function(DeltaTime)
	{

		if (context.ready)
		{

			context.Position[0] += context.Velocity[0] * DeltaTime;
			context.Position[1] += context.Velocity[1] * DeltaTime;

			if (context.Position[0] >= canvas.width)
			{

				context.Position[0] = canvas.width;
				context.Velocity[0] *= -1;

			}

			if (context.Position[1] >= canvas.height)
			{

				context.Position[1] = canvas.height;
				context.Velocity[1] *= -1;

			}

			if (context.Position[0] <= 0)
			{

				context.Position[0] = 0;
				context.Velocity[0] *= -1;

			}

			if (context.Position[1] <= 0)
			{

				context.Position[1] = 0;
				context.Velocity[1] *= -1;

			}

		}
		else
		{

			context.Radius = Math.sqrt(Math.pow(context.Position[1] - Mouse[1], 2) + Math.pow(context.Position[0] - Mouse[0], 2));

		}

	}

	this.Render = function()
	{

		var Index = 0;
		var x, y, xdist, ydist;

		for (x = 0; x < canvas.width; x++)
		{

			xdist = context.Position[0] - x;
			
			for (y = 0; y < canvas.height; y++)
			{

				ydist = context.Position[1] - y;

				if (context.sign) ScalarArray[Index] -= 32 * context.Radius / ((xdist * xdist) + (ydist * ydist));
				else ScalarArray[Index] += 32 * context.Radius / ((xdist * xdist) + (ydist * ydist));

				Index += canvas.width;

				if (y == canvas.height - 1) Index = x;

			}

			Index += 1;

		}

	}

	this.Free = function()
	{

		this.ready = true;

		var Angle = Math.atan((context.Position[1] - Mouse[1]) / (context.Position[0] - Mouse[0]));
		if (context.Position[0] > Mouse[0]) Angle += Math.PI;

		context.Velocity[0] = BallSpeed * Math.cos(Angle);
		context.Velocity[1] = BallSpeed * Math.sin(Angle);

		context.Radius = Math.sqrt(Math.pow(context.Position[1] - Mouse[1], 2) + Math.pow(context.Position[0] - Mouse[0], 2));

	}

}

window.onload = function()
{

	canvas = document.getElementById("canvas");
	ui = document.getElementById("ui");
	style = document.getElementById("style");
	filter = document.getElementById("filter");
	signed = document.getElementById("signed");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl = canvas.getContext("webgl");

	if (!gl)
	{

		alert("WebGL initialization failed. Your browser and/or hardware might not support WebGL.");
		return;

	}

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	VBO = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Verticies), gl.STATIC_DRAW);

	Assets.MetaballShader = new Shader("metaball", ["BallPosition", "Radius", "Dimensions"]);
	Assets.FilterShader = new Shader("filter", ["BallTexture", "FilterTexture"]);

	for (var i in FiltersList)
	{

		var Name = FiltersList[i];
		style.innerHTML += "<option value = '" + Name + "'>" + Name + "</option>";
		Assets[Name] = new Texture(Name);

	}

	Dimensions = vec2.create();
	Mouse = vec2.create();

	for (var i = 0; i < canvas.width * canvas.height; i++) ScalarArray.push(0);

	TextureArray = new Uint8Array(3 * canvas.width * canvas.height);

	//Balls.push(new Metaball(canvas.width / 2, canvas.height/ 2, 100, 0));
	//Balls.push(new Metaball(0.4, 0, 100, 45));

	FrameTexture = gl.createTexture();

	Loop = setInterval(Render, 16.6666667);

	canvas.onmousedown = function()
	{

		if (!MouseDown)
		{

			MouseDown = true;

			MouseBall = new Metaball(Mouse[0], Mouse[1], signed.checked);

			Balls.push(MouseBall);

		}

	}

	canvas.onmouseup = function()
	{

		if (MouseDown)
		{

			MouseBall.Free();
			MouseBall = null;
			MouseDown = false;

		}
		
	}

	canvas.onmousemove = function(Arg)
	{

		Mouse[0] = Arg.pageX;
		Mouse[1] = -Arg.pageY + canvas.height;

	}

	window.onkeypress = function(Arg)
	{

		if (Arg.key == "Enter")
		{

			if (ui.style.visibility == "visible") ui.style.visibility = "hidden";
			else ui.style.visibility = "visible";

		}

	}

}

window.onunload = function()
{

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.deleteBuffer(VBO);

	for (var i in Assets) Assets[i].Destroy();

}

var Timer = 0;

function Render()
{

	Timer += 16.6666667;

	for (var i = 0; i < Balls.length; i++)
	{

		Balls[i].Update(16.6666667);

	}

	Dimensions.x = canvas.width;
	Dimensions.y = canvas.height;

	for (var i = 0; i < ScalarArray.length; i++) ScalarArray[i] = 0;

	for (var i = 0; i < Balls.length; i++)
	{

		Balls[i].Render();

	}

	for (var i = 0; i < ScalarArray.length; i++)
	{

		TextureArray[i * 3] = Math.max(Math.min(ScalarArray[i] * 255, 255), 0);

	}

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	Assets[style.value].Use(1);

	var Filtering = gl.NEAREST;
	if (filter.checked) Filtering = gl.LINEAR;

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, Filtering);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, Filtering);

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, FrameTexture);

	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, canvas.width, canvas.height, 0, gl.RGB, gl.UNSIGNED_BYTE, TextureArray);

	Assets.FilterShader.Use();
	Assets.FilterShader.SetUniform("BallTexture", 0);
	Assets.FilterShader.SetUniform("FilterTexture", 1);

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

}

window.onresize = function()
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	ScalarArray = [];
	for (var i = 0; i < canvas.width * canvas.height; i++) ScalarArray.push(0);

	TextureArray = new Uint8Array(3 * canvas.width * canvas.height);

}

var MouseDown = false;
var MouseBall;

function HTTPRequest(RequestType, URL, Argument)
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

			case "POST":

				XMLHTTP.send(ObjectToFormData(Argument));

				break;

		}

		XMLHTTP.onload = function()
		{

			if (XMLHTTP.status == 200) Resolve(XMLHTTP.response);
			else Reject(XMLHttpRequest.statusText);

		}

	});

	function ObjectToFormData(ObjectToChange)
	{

		var NewData = new FormData();

		var Keys = Object.keys(ObjectToChange);
		var Values = Object.values(ObjectToChange);

		for (var DataKey in Keys)
		{

			NewData.append(Keys[DataKey], Values[DataKey]);

		}

		return NewData;

	}

}
