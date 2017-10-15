
/// <reference path = "gl-matrix.d.ts" />

declare var Promise: any;

var canvas : HTMLCanvasElement;
var gl : WebGLRenderingContext;
var Int;

var Letters : Character[] = [];

var test : Character;

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

	Character.Load();

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

	Letters.push(new Character("f", vec3.fromValues(-1.5, 0.0, 0.0), vec3.fromValues(1.0, 1.0, 1.0)));
	Letters.push(new Character("u", vec3.fromValues(-1.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 1.0)));
	Letters.push(new Character("c", vec3.fromValues(-0.5, 0.0, 0.0), vec3.fromValues(1.0, 1.0, 1.0)));
	Letters.push(new Character("c", vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(1.0, 1.0, 0.0)));
	Letters.push(new Character("b", vec3.fromValues(0.5, 0.0, 0.0), vec3.fromValues(1.0, 1.0, 1.0)));
	Letters.push(new Character("o", vec3.fromValues(1.0, 0.0, 0.0), vec3.fromValues(1.0, 0.07843137254, 0.57647058823)));
	Letters.push(new Character("i", vec3.fromValues(1.5, 0.0, 0.0), vec3.fromValues(1.0, 1.0, 1.0)));

	Camera.Position = vec3.fromValues(0.0, 0.0, 3.0);

	Int = setInterval(Update, 0.0166667);

}
var Timer = 0;

function Update()
{

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	Camera.GenerateMatricies();

	for (var i : number = 0; i < Letters.length; i++) Letters[i].Render();

}

window.onunload = function() : void
{

	Character.Unload();

}

window.onresize = function() : void
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

}

class Character
{

	private Color : Float32Array;
	private Position : Float32Array;
	private Rotation : number;

	private Model : Mesh;

	private static MeshPool : Dictionary<string, Mesh>;
	private static CharShader : Shader;
	private static readonly ToLoad : string = "abcdefghijklmnopqrstuvwxyz0123456789-_=+()'";

	constructor(NewChar : string, NewPos : Float32Array, NewColor : Float32Array)
	{

		this.Model = Character.MeshPool.Get(NewChar);
		this.Color = NewColor;
		this.Position = NewPos;
		this.Rotation = Math.random() * Math.PI * 2.0;

	}

	public Render() : void
	{

		var model : Float32Array = mat4.create();
		var view : Float32Array = Camera.ViewMatrix();
		var proj : Float32Array = Camera.ProjectionMatrix();

		this.Rotation += 0.0166667;

		var trans : Float32Array = mat4.create();
		var rot : Float32Array = mat4.create();

		mat4.fromTranslation(trans, this.Position);
		mat4.fromRotation(rot, Math.sin(this.Rotation), vec3.fromValues(0.0, 1.0, 0.0));

		mat4.fromRotation(model, Math.PI / 2.0, vec3.fromValues(1.0, 0.0, 0.0));
		mat4.multiply(model, model, trans);
		mat4.multiply(model, model, rot);

		Character.CharShader.Use();

		Character.CharShader.UniformVec3("Color", this.Color);
		Character.CharShader.UniformVec3("Light", new Float32Array([0.0, 1.0, 1.0]));
		Character.CharShader.UniformVec3("ViewPosition", Camera.Position);

		Character.CharShader.UniformMat4("Model", model);
		Character.CharShader.UniformMat4("View", view);
		Character.CharShader.UniformMat4("Projection", proj);

		this.Model.Render(Character.CharShader.PositionLocation, Character.CharShader.NormalLocation);

	}

	public static Load() : void
	{

		Character.MeshPool = new Dictionary<string, Mesh>();

		for (var i : number = 0; i < Character.ToLoad.length; i++)
		{

			var a : string = Character.ToLoad[i];
			Character.MeshPool.Push(a, new Mesh(a));

		}

		Character.CharShader = new Shader("char", ["Model", "View", "Projection", "Color", "Light", "ViewPosition"]);

	}

	public static Unload() : void
	{

		var array : Mesh[] = Character.MeshPool.GetValues();

		for (var i : number = 0; i < array.length; i++)
		{

			array[i].Delete();

		}

		Character.CharShader.Delete();

	}

}

class Camera
{

	public static Position : Float32Array = vec3.create();
	public static FOV = Math.PI / 4.0;

	private static View : Float32Array = mat4.create();
	private static Projection : Float32Array = mat4.create();

	public static GenerateMatricies()
	{

		mat4.fromTranslation(Camera.View, vec3.fromValues(-Camera.Position[0], -Camera.Position[1], -Camera.Position[2]));

		mat4.perspective(Camera.Projection, Camera.FOV, canvas.width / canvas.height, 0.1, 100.0);
		

	}

	public static ViewMatrix()
	{

		return Camera.View;

	}

	public static ProjectionMatrix()
	{

		return Camera.Projection;
		
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
