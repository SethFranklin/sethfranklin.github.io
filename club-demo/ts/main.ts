
/// <reference path = "gl-matrix.d.ts" />

declare var Promise: any;

var canvas : HTMLCanvasElement;
var gl : WebGLRenderingContext;
var Int;
var Mos : Mosaic;

var Meshes : Mesh[] = [];
var Simple : Shader;

window.onload = function() : void
{

	canvas = <HTMLCanvasElement> document.getElementById("canvas"); // <T> is for type conversions
	gl = canvas.getContext("webgl");

	if (!gl)
	{

		alert("Your browser doesn't support WebGL");

		return;

	}

	gl.enable(gl.DEPTH_TEST);

	Simple = new Shader("simple", ["Model", "View", "Projection", "Color", "Light", "ViewPosition"]);

	Meshes.push(new Mesh("cone"));
	Meshes.push(new Mesh("cube"));
	Meshes.push(new Mesh("octahedron"));
	Meshes.push(new Mesh("sphere"));
	Meshes.push(new Mesh("torus"));

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

	Mos = new Mosaic("../club-demo/texture/Logo.png");

	Int = setInterval(Update, 0.0166667);

}
var Timer = 0;

function Update()
{

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	Mos.Update(0.0166667);
	Mos.Render();

}

window.onunload = function() : void
{

	for (var i : number = 0; i < Meshes.length; i++) Meshes[i].Delete();
	Simple.Delete();

}

window.onresize = function() : void
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

}

class Mosaic
{

	private Shapes : Shape[] = [];

	private MaxW : number = 40;
	private MaxH : number = 32;

	constructor(Name : string)
	{

		var context = this;

		var Img : HTMLImageElement = new Image();
		Img.src = Name;

		Img.onload = function() : void
		{

			// To get image data in an array in a web browser, you gotta draw it to a canvas and use the canvas's functions to get it :(
			// At least downscaling is easy

			var NewW : number, NewH : number;

			NewW = Img.width;
			NewH = Img.height;

			var NewCanvas : HTMLCanvasElement = document.createElement("canvas");
			NewCanvas.width = NewW;
			NewCanvas.height = NewH;

			var NewContext : CanvasRenderingContext2D = NewCanvas.getContext("2d");
			NewContext.drawImage(Img, 0, 0, NewW, NewH); // This is so fucking jank

			var DataArray : Uint8ClampedArray = NewContext.getImageData(0, 0, NewW, NewH).data;

			for (var x : number = 0; x < NewW; x++)
			{

				for (var y : number = 0; y < NewH; y++)
				{

					if (DataArray[(4 * (x + (y * NewW))) + 3] == 255) context.Shapes.push(new Shape(vec3.fromValues(x - (NewW / 2), -y + (NewH / 2), 0), vec3.fromValues(DataArray[(4 * (x + (y * NewW))) + 0] / 255.0, DataArray[(4 * (x + (y * NewW))) + 1] / 255.0, DataArray[(4 * (x + (y * NewW))) + 2] / 255.0), 0.5, Meshes[Math.floor(Math.random() * Meshes.length)]));

				}

			}

		}

	}

	public Update(DeltaTime : number) : void
	{

		for (var i : number = 0; i < this.Shapes.length; i++) this.Shapes[i].Update(DeltaTime);

	}

	public Render() : void
	{

		for (var i : number = 0; i < this.Shapes.length; i++) this.Shapes[i].Render();
		
	}

}

class Shape
{

	private Model : Mesh;
	private Position : Float32Array;
	private Rotation : Float32Array;
	private Scale : number;
	private Axis : Float32Array;
	private Color : Float32Array;
	private Timer : number;

	constructor(npos : Float32Array, ncol : Float32Array, nscale : number, nmodel : Mesh)
	{

		this.Model = nmodel;
		this.Position = npos;
		this.Rotation = vec2.create();
		this.Axis = vec3.fromValues(Math.random(), Math.random(), Math.random());
		this.Color = ncol;
		this.Timer = 0.0;
		this.Scale = nscale;

	}

	Update(DeltaTime : number) : void
	{

		this.Timer += DeltaTime;

	}

	Render() : void
	{

		var a : Float32Array = mat4.create();
		var b : Float32Array = mat4.create();
		var c : Float32Array = mat4.create();
		var model : Float32Array = mat4.create();
		var view : Float32Array = mat4.create();
		var proj : Float32Array = mat4.create();

		Timer += 0.00666667;

		mat4.fromTranslation(a, this.Position);
		mat4.fromRotation(b, this.Timer, this.Axis);
		mat4.fromScaling(c, vec3.fromValues(this.Scale, this.Scale, this.Scale));
		mat4.multiply(model, a, c);
		mat4.multiply(model, model, b);
		mat4.fromTranslation(view, new Float32Array([0.0, 0.0, -30.0]));
		mat4.perspective(proj, Math.PI / 4.0, canvas.width / canvas.height, 0.1, 100.0);

		Simple.Use();

		Simple.UniformVec3("Color", this.Color);
		Simple.UniformVec3("Light", new Float32Array([0, 0.0, 10.0]));
		Simple.UniformVec3("ViewPosition", new Float32Array([0.0, 0.0, 30.0]));

		Simple.UniformMat4("Model", model);
		Simple.UniformMat4("View", view);
		Simple.UniformMat4("Projection", proj);

		this.Model.Render(Simple.PositionLocation, Simple.NormalLocation);

	}

}



class Mesh
{

	private mesh : any;

	constructor(Name : string)
	{

		var context = this;

		HTTPRequest("GET", window.location.href + "/../obj/" + Name + ".obj").then(function(MeshData : string)
		{

			context.mesh = new OBJ.Mesh(MeshData);
			OBJ.initMeshBuffers(gl, context.mesh);

		}, function(Reject : string)
		{

			console.log(Reject);

		});

	}

	Render(Position : GLint, Normal : GLint) : void
	{

		gl.enableVertexAttribArray(Position);
		gl.enableVertexAttribArray(Normal);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(Position, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(Normal, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
		gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

	}

	Delete() : void
	{

		OBJ.deleteMeshBuffers(gl, this.mesh);

	}

}

class Shader
{

	private ID : WebGLProgram;
	private UniformMap : Dictionary<string, WebGLUniformLocation>;
	public PositionLocation : GLint;
	public NormalLocation : GLint;

	constructor(Name : string, UniformList : string[])
	{

		var context = this;

		HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".vert").then(function(VertexSource : string)
		{

			HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".frag").then(function(FragmentSource : string)
			{

				var VertexShader : WebGLShader = gl.createShader(gl.VERTEX_SHADER);
				var FragmentShader : WebGLShader = gl.createShader(gl.FRAGMENT_SHADER);

				gl.shaderSource(VertexShader, VertexSource);
				gl.shaderSource(FragmentShader, FragmentSource);

				gl.compileShader(VertexShader);
				gl.compileShader(FragmentShader);

				var VertTest : GLenum = gl.getShaderParameter(VertexShader, gl.COMPILE_STATUS);
				var FragTest : GLenum = gl.getShaderParameter(FragmentShader, gl.COMPILE_STATUS);

				if (!VertTest)
				{

					console.log("Vertex Shader (" + Name + ".vert) Compile Error:\n" + gl.getShaderInfoLog(VertexShader));

				}

				if (!FragTest)
				{

					console.log("Fragment Shader (" + Name + ".frag) Compile Error:\n" + gl.getShaderInfoLog(FragmentShader));

				}

				var ShaderProgram : WebGLProgram = gl.createProgram();

				gl.attachShader(ShaderProgram, VertexShader);
				gl.attachShader(ShaderProgram, FragmentShader);

				gl.linkProgram(ShaderProgram);

				var ProgramTest : GLenum = gl.getProgramParameter(ShaderProgram, gl.LINK_STATUS);

				if (!ProgramTest)
				{

					console.log("Shader Program (" + Name + ") Compile Error:\n" + gl.getProgramInfoLog(ShaderProgram));

				}

				context.PositionLocation = gl.getAttribLocation(ShaderProgram, "Position");
				context.NormalLocation = gl.getAttribLocation(ShaderProgram, "Normal");

				context.UniformMap = new Dictionary<string, WebGLUniformLocation>();

				for (var Uniform : number = 0; Uniform < UniformList.length; Uniform++)
				{

					context.UniformMap.Push(UniformList[Uniform], gl.getUniformLocation(ShaderProgram, UniformList[Uniform]));

				}

				gl.deleteShader(VertexShader);
				gl.deleteShader(FragmentShader);

				context.ID = ShaderProgram;

			}, function(Reject : string)
			{

				console.log(Reject);

			});

		}, function(Reject : string)
		{

			console.log(Reject);

		});

	}
	
	Use() : void
	{

		gl.useProgram(this.ID);

	}

	Delete() : void
	{

		gl.deleteProgram(this.ID);

	}

	UniformFloat(Name : string, Value : number) : void // Typescript allows overloading, but when compiled to javascript it doesn't work.
	{

		gl.uniform1f(this.UniformMap.Get(Name), Value);

	}

	UniformInt(Name : string, Value : number) : void
	{

		gl.uniform1i(this.UniformMap.Get(Name), Value);

	}

	UniformVec3(Name : string, Value : Float32Array) : void
	{

		gl.uniform3f(this.UniformMap.Get(Name), Value[0], Value[1], Value[2]);

	}

	UniformMat4(Name : string, Value : Float32Array) : void
	{

		gl.uniformMatrix4fv(this.UniformMap.Get(Name), false, Value);

	}

}

class Dictionary<T, U> // TypeScript generics
{

	private Keys : T[];
	private Values : U[];

	constructor()
	{

		this.Keys = [];
		this.Values = [];

	}

	Push(NewKey : T, NewValue : U) : void
	{

		this.Keys.push(NewKey);
		this.Values.push(NewValue);

	}

	Get(KeyToFind : T) : U
	{

		for (var i : number = 0; i < this.Keys.length; i++)
		{

			if (this.Keys[i] == KeyToFind) return this.Values[i];

		}

		return null;

	}

	GetValues() : U[]
	{

		return this.Values;

	}

}

function HTTPRequest(RequestType, URL) : Promise<any>
{

	return new Promise(function(Resolve, Reject)
	{

		var XMLHTTP : XMLHttpRequest = new XMLHttpRequest();

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
