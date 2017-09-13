
var canvas;
var gl;
var VBO;
var Loop;

var BotLeftTransform;
var BotRightTransform;
var TopMidTransform;
var RotateTransform;

var IdentityMatrix;

var Parent;
var ToRender = [];

var Verticies = 
[

	-1.0, -1.0,
	1.0, -1.0,
	0.0, 1.0,

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

			gl.enableVertexAttribArray(context.PositionLocation);
			gl.vertexAttribPointer(context.PositionLocation, 2, gl.FLOAT, false, 8, 0);

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
		gl.vertexAttribPointer(context.PositionLocation, 2, gl.FLOAT, false, 0, 0);

		gl.useProgram(context.ID);

	}

	this.SetUniform = function(Name, Value)
	{

		if (Number.isInteger(Value)) gl.uniform1i(context.uniformmap[Name], Value);
		else gl.uniformMatrix3fv(context.uniformmap[Name], false, Value);		

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
		image.src = "/../sierpinski-triangle/texture/" + Name + ".png";

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

var Triangle = function(Count, TopParent, NewTransformation)
{

	var context = this;

	context.BotLeft = null;
	context.BotRight = null;
	context.TopMid = null;
	context.IsParent = TopParent;
	context.Rotation = 0;
	context.Transformation = NewTransformation;

	{

		if (Count > 0)
		{

			if (context.IsParent == true)
			{

				context.BotLeft = new Triangle(Count - 1, false, BotLeftTransform);
				context.BotRight = new Triangle(Count - 1, false, BotRightTransform);
				context.TopMid = new Triangle(Count - 1, false, TopMidTransform);

			}
			else
			{

				var a1 = mat3.create();
				var a2 = mat3.create();
				var a3 = mat3.create();

				mat3.multiply(a1, BotLeftTransform, context.Transformation);
				mat3.multiply(a2, BotRightTransform, context.Transformation);
				mat3.multiply(a3, TopMidTransform, context.Transformation);

				context.BotLeft = new Triangle(Count - 1, false, a1);
				context.BotRight = new Triangle(Count - 1, false, a2);
				context.TopMid = new Triangle(Count - 1, false, a3);

			}

			if (Count == 1)
			{

				ToRender.push(context.BotLeft);
				ToRender.push(context.BotRight);
				ToRender.push(context.TopMid);

			}

		}

	}

	context.Update = function()
	{

		if (context.IsParent == true)
		{

			context.Rotation += 0.01;

			mat3.fromRotation(RotateTransform, context.Rotation);

		}

	}

	context.Render = function()
	{

		var finalmat3 = mat3.create();

		mat3.multiply(finalmat3, RotateTransform, context.Transformation);

		Assets.SimpleShader.SetUniform("Transform", finalmat3);

		Assets.SimpleShader.Use();
		Assets.SimpleShader.SetUniform("Texture", 0);

		Assets.Fish.Use(0);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		gl.drawArrays(gl.TRIANGLES, 0, 3);

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

	Assets.SimpleShader = new Shader("simple", ["Texture", "Transform"]);
	Assets.Fish = new Texture("Fish");

	BotLeftTransform = mat3.create();
	BotRightTransform = mat3.create();
	TopMidTransform = mat3.create();
	RotateTransform = mat3.create();

	IdentityMatrix = mat3.create();

	var Scaling = mat3.create();
	var v1 = vec3.create();
	var v2 = vec3.create();
	var v3 = vec3.create();
	var trans1 = mat3.create();
	var trans2 = mat3.create();
	var trans3 = mat3.create();
	mat3.fromScaling(Scaling, [0.5, 0.5]);

	v1 = vec2.fromValues(-0.5, -0.5);
	v2 = vec2.fromValues(0.5, -0.5);
	v3 = vec2.fromValues(0, 0.5);

	mat3.fromTranslation(trans1, v1);
	mat3.fromTranslation(trans2, v2);
	mat3.fromTranslation(trans3, v3);

	mat3.multiply(BotLeftTransform, trans1, Scaling);
	mat3.multiply(BotRightTransform, trans2, Scaling);
	mat3.multiply(TopMidTransform, trans3, Scaling);

	IdentityMatrix = mat3.create();

	Parent = new Triangle(7, true, IdentityMatrix);

	Loop = setInterval(Render, 16.6666667);

}

window.onunload = function()
{

	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	gl.deleteBuffer(VBO);

	Assets.SimpleShader.Destroy();
	Assets.Fish.Destroy();

}

function Render()
{

	Parent.Update();

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for (var i = 0; i < ToRender.length; i++) ToRender[i].Render();

}

window.onresize = function()
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

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
