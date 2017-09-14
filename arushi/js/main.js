
var canvas;
var gl;
var VBO;
var Loop;
var music;

var model;
var view;
var projection;

var Mouse;

var Verticies = 
[

	-1.0, -1.0, -1.0,  0.0, 0.0,
     1.0, -1.0, -1.0,  1.0, 0.0,
     1.0,  1.0, -1.0,  1.0, 1.0,
     1.0,  1.0, -1.0,  1.0, 1.0,
    -1.0,  1.0, -1.0,  0.0, 1.0,
    -1.0, -1.0, -1.0,  0.0, 0.0,

    -1.0, -1.0,  1.0,  0.0, 0.0,
     1.0, -1.0,  1.0,  1.0, 0.0,
     1.0,  1.0,  1.0,  1.0, 1.0,
     1.0,  1.0,  1.0,  1.0, 1.0,
    -1.0,  1.0,  1.0,  0.0, 1.0,
    -1.0, -1.0,  1.0,  0.0, 0.0,

    -1.0,  1.0,  1.0,  1.0, 0.0,
    -1.0,  1.0, -1.0,  1.0, 1.0,
    -1.0, -1.0, -1.0,  0.0, 1.0,
    -1.0, -1.0, -1.0,  0.0, 1.0,
    -1.0, -1.0,  1.0,  0.0, 0.0,
    -1.0,  1.0,  1.0,  1.0, 0.0,

     1.0,  1.0,  1.0,  1.0, 0.0,
     1.0,  1.0, -1.0,  1.0, 1.0,
     1.0, -1.0, -1.0,  0.0, 1.0,
     1.0, -1.0, -1.0,  0.0, 1.0,
     1.0, -1.0,  1.0,  0.0, 0.0,
     1.0,  1.0,  1.0,  1.0, 0.0,

    -1.0, -1.0, -1.0,  0.0, 1.0,
     1.0, -1.0, -1.0,  1.0, 1.0,
     1.0, -1.0,  1.0,  1.0, 0.0,
     1.0, -1.0,  1.0,  1.0, 0.0,
    -1.0, -1.0,  1.0,  0.0, 0.0,
    -1.0, -1.0, -1.0,  0.0, 1.0,

    -1.0,  1.0, -1.0,  0.0, 1.0,
     1.0,  1.0, -1.0,  1.0, 1.0,
     1.0,  1.0,  1.0,  1.0, 0.0,
     1.0,  1.0,  1.0,  1.0, 0.0,
    -1.0,  1.0,  1.0,  0.0, 0.0,
    -1.0,  1.0, -1.0,  0.0, 1.0

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
			gl.vertexAttribPointer(context.PositionLocation, 3, gl.FLOAT, false, 20, 0);
			gl.enableVertexAttribArray(context.UVLocation);
			gl.vertexAttribPointer(context.UVLocation, 2, gl.FLOAT, false, 20, 12);

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
		gl.vertexAttribPointer(context.PositionLocation, 3, gl.FLOAT, false, 20, 0);
		gl.enableVertexAttribArray(context.UVLocation);
		gl.vertexAttribPointer(context.UVLocation, 2, gl.FLOAT, false, 20, 12);

		gl.useProgram(context.ID);

	}

	this.SetUniform = function(Name, Value)
	{

		if (Number.isInteger(Value)) gl.uniform1i(context.uniformmap[Name], Value);
		else gl.uniformMatrix4fv(context.uniformmap[Name], false, Value);

	}

	this.Destroy = function()
	{

		gl.deleteProgram(context.ID);
		context.ID = -1;

	}

};


function PowerOfTwo(a)
{

	return (a & (a - 1)) == 0;

}


var Texture = function(Name)
{

	var context = this;

	{

		context.ID = gl.createTexture();

		var pixel = new Uint8Array([255, 20, 147, 255]); // Set color to pink while it loads

		gl.bindTexture(gl.TEXTURE_2D, context.ID);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		var image = new Image();
		image.src = "/../arushi/texture/" + Name + ".png";

		image.onload = function()
		{

			gl.bindTexture(gl.TEXTURE_2D, context.ID);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

			if (PowerOfTwo(image.width) && PowerOfTwo(image.height))
			{

				gl.generateMipmap(gl.TEXTURE_2D);

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

			}
			else
			{

				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

			}

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

	Assets.SimpleShader = new Shader("simple", ["Texture", "Model", "View", "Projection"]);
	Assets.Arushi = new Texture("Arushi");

	model = mat4.create();
	view = mat4.create();
	projection = mat4.create();

	Mouse = vec2.create();

	hotfirebeats = new Audio('/../arushi/audio/cdplayer.mp3');
	hotfirebeats.play();

	Loop = setInterval(Render, 16.6666667);

}

window.onunload = function()
{

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.deleteBuffer(VBO);

	Assets.SimpleShader.Destroy();
	Assets.Arushi.Destroy();

}

var Angle = 0;

function Render()
{

	Angle += 0.1;

	model = mat4.create();

	mat4.rotateY(model, model, Mouse[0]);
	mat4.rotateX(model, model, Mouse[1]);

	mat4.fromTranslation(view, [0, 0, -3]);
	mat4.perspective(projection, Math.PI / 2, canvas.width / canvas.height, 1, 1000);

	Assets.SimpleShader.Use();
	Assets.SimpleShader.SetUniform("Texture", 0);
	Assets.SimpleShader.SetUniform("Model", model);
	Assets.SimpleShader.SetUniform("View", view);
	Assets.SimpleShader.SetUniform("Projection", projection);	

	Assets.Arushi.Use(0);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.drawArrays(gl.TRIANGLES, 0, 36);

}

window.onresize = function()
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

}

window.onmousemove = function(a)
{

	Mouse = vec2.fromValues(((a.clientX / canvas.width) * 2.0) - 1.0, ((a.clientY / canvas.height) * 2.0) - 1.0);

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
