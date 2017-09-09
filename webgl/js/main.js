
var canvas;
var gl;
var VBO;
var Loop;
var hotfirebeats;

var Verticies = 
[

	1.0, -1.0,
	1.0, 0.0,
	-1.0, -1.0,
	0.0, 0.0,
	-1.0,  1.0,
	0.0, 1.0,
	1.0,  1.0,
	1.0, 1.0,
	1.0, -1.0,
	1.0, 0.0,
	-1.0,  1.0,
	0.0, 1.0

];

var Assets = {};

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
			context.UVLocation = gl.getAttribLocation(ShaderProgram, "VertexUV");

			gl.enableVertexAttribArray(context.PositionLocation);
			gl.vertexAttribPointer(context.PositionLocation, 2, gl.FLOAT, false, 16, 0);
			gl.enableVertexAttribArray(context.UVLocation);
			gl.vertexAttribPointer(context.UVLocation, 2, gl.FLOAT, false, 16, 8);

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
		gl.vertexAttribPointer(context.PositionLocation, 2, gl.FLOAT, false, 16, 0);
		gl.enableVertexAttribArray(context.UVLocation);
		gl.vertexAttribPointer(context.UVLocation, 2, gl.FLOAT, false, 16, 8);

		gl.useProgram(context.ID);

	}

	this.SetUniform = function(Name, Value)
	{

		if (Number.isInteger(Value)) gl.uniform1i(context.uniformmap[Name], Value);
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
		image.src = "/../webgl/texture/" + Name + ".png";

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

}

window.onload = function()
{

	canvas = document.getElementById("canvas");

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl = canvas.getContext("webgl");

	if (!gl)
	{

		alert("WebGL initialization failed. Your browser and/or hardware might not support WebGL.");
		return;

	}

	gl.enable(gl.DEPTH_TEST);

	VBO = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Verticies), gl.STATIC_DRAW);

	Assets.SimpleShader = new Shader("simple", ["Texture", "Noise", "Time"]);
	Assets.Arushi = new Texture("Arushi");
	Assets.Noise = new Texture("Noise");

	hotfirebeats = new Audio('/../webgl/audio/beat.mp3');
	hotfirebeats.play();

	Loop = setInterval(Render, 16.6666667);

}

window.onunload = function()
{

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.deleteBuffer(VBO);

	Assets.SimpleShader.Destroy();
	Assets.Arushi.Destroy();
	Assets.Noise.Destroy();

}

var Timer = 0;

function Render()
{

	Timer += 16.6666667;

	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	Assets.SimpleShader.Use();
	Assets.SimpleShader.SetUniform("Texture", 0);
	Assets.SimpleShader.SetUniform("Noise", 1);
	Assets.SimpleShader.SetUniform("Time", Timer);

	Assets.Arushi.Use(0);
	Assets.Noise.Use(1);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.drawArrays(gl.TRIANGLES, 0, 6);

}

window.onresize = function()
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

}

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
