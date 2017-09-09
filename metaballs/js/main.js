
var canvas;
var gl;
var VBO;
var FBO;
var RBO;
var FrameTexture;
var Loop;
var Dimensions;
var Mouse;
var BallSpeed = 0.1;
var ui, style, filter;

var Balls = [];
var FiltersList = [ "25Percent", "50Percent", "75Percent", "SolarEclipse", "InvertedEclipse", "Arushi", "GreenLines", "Murica", "Topographic", "Rainbow"];

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
		else if (Value.length == 2) gl.uniform2f(context.uniformmap[Name], Value.x, Value.y);
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
		image.src = "/../metaballs/texture/" + Name + ".png";

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

var Metaball = function(nx, ny, nr, nt)
{

	var context = this;

	{

		if (nr == undefined || nt == undefined)
		{

			context.ready = false;

			context.Position = vec2.create();
			context.Position.x = nx;
			context.Position.y = ny;

			context.Velocity = vec2.create();

			context.Radius = 100;

		}
		else
		{

			context.ready = true;

			context.Position = vec2.create();
			context.Position.x = nx;
			context.Position.y = ny;

			context.Velocity = vec2.create();
			context.Velocity.x = BallSpeed * Math.cos(nt);
			context.Velocity.y = BallSpeed * Math.sin(nt);

			context.Radius = nr;

		}

	}

	this.Update = function(DeltaTime)
	{

		if (context.ready)
		{

			context.Position.x += context.Velocity.x * DeltaTime;
			context.Position.y += context.Velocity.y * DeltaTime;

			if (context.Position.x >= canvas.width)
			{

				context.Position.x = canvas.width;
				context.Velocity.x *= -1;

			}

			if (context.Position.y >= canvas.height)
			{

				context.Position.y = canvas.height;
				context.Velocity.y *= -1;

			}

			if (context.Position.x <= 0)
			{

				context.Position.x = 0;
				context.Velocity.x *= -1;

			}

			if (context.Position.y <= 0)
			{

				context.Position.y = 0;
				context.Velocity.y *= -1;

			}

		}
		else
		{

			context.Radius = Math.sqrt(Math.pow(context.Position.y - Mouse.y, 2) + Math.pow(context.Position.x - Mouse.x, 2));

		}

	}

	this.Render = function()
	{

		Assets.MetaballShader.Use();
		Assets.MetaballShader.SetUniform("BallPosition", context.Position);
		Assets.MetaballShader.SetUniform("Radius", context.Radius + 0.0000000000001);
		Assets.MetaballShader.SetUniform("Dimensions", Dimensions);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

	}

	this.Free = function()
	{

		this.ready = true;

		var Angle = Math.atan((context.Position.y - Mouse.y) / (context.Position.x - Mouse.x));
		if (context.Position.x > Mouse.x) Angle += Math.PI;

		context.Velocity.x = BallSpeed * Math.cos(Angle);
		context.Velocity.y = BallSpeed * Math.sin(Angle);

		context.Radius = Math.sqrt(Math.pow(context.Position.y - Mouse.y, 2) + Math.pow(context.Position.x - Mouse.x, 2));

	}

}

window.onload = function()
{

	canvas = document.getElementById("canvas");
	ui = document.getElementById("ui");
	style = document.getElementById("style");
	filter = document.getElementById("filter");

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
		console.log(Assets[Name]);

	}

	Dimensions = vec2.create();
	Mouse = vec2.create();

	//Balls.push(new Metaball(canvas.width / 2, canvas.height/ 2, 100, 0));
	//Balls.push(new Metaball(0.4, 0, 100, 45));

	FBO = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
	FBO.width = canvas.width;
	FBO.height = canvas.height;

	FrameTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, FrameTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FBO.width, FBO.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	RBO = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, RBO);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, FBO.width, FBO.height);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, FrameTexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, RBO);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

	Loop = setInterval(Render, 16.6666667);

	canvas.onmousedown = function()
	{

		if (!MouseDown)
		{

			MouseDown = true;

			MouseBall = new Metaball(Mouse.x, Mouse.y);

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

		Mouse.x = Arg.pageX;
		Mouse.y = -Arg.pageY + canvas.height;

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

	gl.deleteFramebuffer(FBO);
	gl.deleteTexture(FrameTexture);
	gl.deleteRenderbuffer(RBO);

}

var Timer = 0;

function Render()
{

	Timer += 16.6666667;

	for (var Ball in Balls)
	{

		Balls[Ball].Update(16.6666667);

	}

	Dimensions.x = canvas.width;
	Dimensions.y = canvas.height;

	FBO.width = canvas.width;
	FBO.height = canvas.height;

	gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	for (var Ball in Balls)
	{

		Balls[Ball].Render();

	}


	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

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

	FBO.width = canvas.width;
	FBO.height = canvas.height;

	gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);

	gl.deleteTexture(FrameTexture);
	gl.deleteRenderbuffer(RBO);

	FrameTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, FrameTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, FBO.width, FBO.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

	RBO = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, RBO);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, FBO.width, FBO.height);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, FrameTexture, 0);
	gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, RBO);

	gl.bindTexture(gl.TEXTURE_2D, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);

}

var MouseDown = false;
var MouseBall;



function Frame()
{

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

}

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
