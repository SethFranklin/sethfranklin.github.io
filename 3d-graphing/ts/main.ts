
/// <reference path = "gl-matrix.d.ts" />

declare var Promise: any;

var canvas : HTMLCanvasElement;
var gl : WebGLRenderingContext;
var Int : any;

var MainGraph : Graph;
var CurveShader : Shader; // @TODO: assets class

window.onload = function() : void
{

	canvas = <HTMLCanvasElement> document.getElementById("canvas");
	gl = canvas.getContext("webgl");

	if (!gl)
	{

		alert("Your browser doesn't support WebGL");

		return;

	}

	gl.enable(gl.DEPTH_TEST);

	//gl.enable(gl.CULL_FACE);
	//gl.cullFace(gl.BACK);

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

	canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

	Camera.Generate();

	Camera.Position = vec3.fromValues(0, 0, 0);

	Input.Start();

	Camera.Position = vec3.fromValues(75, 200, 110);

	CurveShader = new Shader("curve", ["Model", "ViewProjection"]);

	MainGraph = new Graph();
	MainGraph.AddCurve(new Curve("10 - ((x * x) + (y * y))"));

	Int = setInterval(Update, 16.666666667);

}

function Update()
{

	// Update

	Camera.Update();

	// End of Update, render

	Input.PushBackInputs();

	Camera.CalculateMatrix();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	MainGraph.Render();

}

window.onunload = function() : void
{

	MainGraph.Delete();
	CurveShader.Delete();

}

window.onresize = function() : void
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

}

window.onkeydown = function(Event) : void
{

	Input.KeyDownEvent(Event.keyCode);

}

window.onkeyup = function(Event) : void
{

	Input.KeyUpEvent(Event.keyCode);
	
}

window.onclick = function() : void
{

	canvas.requestPointerLock();
	
}

window.onmousemove = function(Event) : void
{

	Camera.MouseMove(Event);

}

class Graph
{

	private Curves : Curve[] = [];

	public XMin = -10;
	public XMax = 10;
	public XSub = 8; // subdivisions

	public YMin = -10;
	public YMax = 10;
	public YSub = 8;

	public ZScale = 1;

	public constructor()
	{



	}

	public Render() : void
	{

		this.RenderAxis();

		CurveShader.Use();

		CurveShader.UniformMat4("ViewProjection", Camera.ViewProjection);
		CurveShader.UniformMat4("Model", mat4.create());

		for (var i : number = 0; i < this.Curves.length; i++)
		{

			this.Curves[i].Render();

		}

	}

	public AddCurve(New : Curve) : void
	{

		New.ParentGraph = this;
		this.Curves.push(New);

		New.UpdateGeometry();

	}

	public UpdateGeometry() : void
	{

		for (var i : number = 0; i < this.Curves.length; i++)
		{

			this.Curves[i].UpdateGeometry();

		}

	}

	public Delete() : void
	{

		for (var i : number = 0; i < this.Curves.length; i++)
		{

			this.Curves[i].Delete();

		}

	}

	private RenderAxis() : void
	{



	}

}

class Curve
{

	private CurveModel : Model;

	public ParentGraph : Graph;
	public EvalString : string;

	public constructor(neweval : string)
	{

		this.EvalString = neweval;

		this.CurveModel = new Model();

	}

	public Render() : void
	{

		this.CurveModel.Render();

	}

	public ChangeCurve(neweval : string) : void
	{

		this.EvalString = neweval;

		this.UpdateGeometry();

	}

	public UpdateGeometry() : void // from [-1, 1] in x, y
	{

		var Verticies : number[] = [];

		var deltax : number = 2 / (this.ParentGraph.XSub + 1);
		var deltay : number = 2 / (this.ParentGraph.YSub + 1);

		var x : number;
		var y : number;
		var z : number;

		var Points : number[] = []; // value(x, y, z) at (xi * (this.ParentGraph.YSub + 2)) + yi

		for (var xi : number = 0; xi < this.ParentGraph.XSub + 2; xi++)
		{

			for (var yi : number = 0; yi < this.ParentGraph.YSub + 2; yi++)
			{

				x = -1 + (deltax * xi);
				y = -1 + (deltay * yi);

				z = eval(this.EvalString);

				if (isNaN(z)) z = 0; // handling DNE, set to zero

				Points.push(x, y, eval(this.EvalString));

			}

		}

		var P1 : Float32Array = vec3.create();
		var P2 : Float32Array = vec3.create();
		var P3 : Float32Array = vec3.create();
		var P4 : Float32Array = vec3.create();

		var PM : Float32Array = vec3.create(); // mid point of four

		var CrossA1 : Float32Array = vec3.create(); // vectors used in cross product
		var CrossB1 : Float32Array = vec3.create();
		var CrossA2 : Float32Array = vec3.create();
		var CrossB2 : Float32Array = vec3.create();
		var CrossA3 : Float32Array = vec3.create();
		var CrossB3 : Float32Array = vec3.create();
		var CrossA4 : Float32Array = vec3.create();
		var CrossB4 : Float32Array = vec3.create();

		var index1 : number;
		var index2 : number;
		var index3 : number;
		var index4 : number;

		for (var xi : number = 0; xi < this.ParentGraph.XSub + 1; xi++)
		{

			for (var yi : number = 0; yi < this.ParentGraph.YSub + 1; yi++)
			{

				index1 = (xi * (this.ParentGraph.YSub + 2)) + yi;
				index2 = ((xi + 1) * (this.ParentGraph.YSub + 2)) + yi;
				index3 = (xi * (this.ParentGraph.YSub + 2)) + (yi + 1);
				index4 = ((xi + 1) * (this.ParentGraph.YSub + 2)) + (yi + 1);

				P1 = vec3.fromValues(Points[index1 * 3], Points[(index1 * 3) + 1], Points[(index1 * 3) + 2]);
				P2 = vec3.fromValues(Points[index2 * 3], Points[(index2 * 3) + 1], Points[(index2 * 3) + 2]);
				P3 = vec3.fromValues(Points[index3 * 3], Points[(index3 * 3) + 1], Points[(index3 * 3) + 2]);
				P4 = vec3.fromValues(Points[index4 * 3], Points[(index4 * 3) + 1], Points[(index4 * 3) + 2]);

				PM = vec3.fromValues((P1[0] + P4[0]) / 2, (P1[1] + P4[1]) / 2, (P1[2] + P2[2] + P3[2] + P4[2]) / 4);

				// Find normal of four triangles (later find point normals, continuous smooth surface with smooth shading,
				// less vectors sent using indices):
				
				vec3.subtract(CrossA1, P1, PM);
				vec3.subtract(CrossB1, P2, PM);

				vec3.subtract(CrossA2, P2, PM);
				vec3.subtract(CrossB2, P4, PM);

				vec3.subtract(CrossA3, P3, PM);
				vec3.subtract(CrossB3, P1, PM);

				vec3.subtract(CrossA4, P4, PM);
				vec3.subtract(CrossB4, P3, PM);

				vec3.cross(CrossA1, CrossA1, CrossB1);
				vec3.cross(CrossA2, CrossA2, CrossB2);
				vec3.cross(CrossA3, CrossA3, CrossB3);
				vec3.cross(CrossA4, CrossA4, CrossB4);

				vec3.normalize(CrossA1, CrossA1);
				vec3.normalize(CrossA2, CrossA2);
				vec3.normalize(CrossA3, CrossA3);
				vec3.normalize(CrossA4, CrossA4);

				// Add four triangles (12 points in total)

				// 12

				Verticies.push(P1[0], P1[1], P1[2], CrossA1[0], CrossA1[1], CrossA1[2], xi / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
				Verticies.push(P2[0], P2[1], P2[2], CrossA1[0], CrossA1[1], CrossA1[2], (xi + 1) / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
				Verticies.push(PM[0], PM[1], PM[2], CrossA1[0], CrossA1[1], CrossA1[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));

				// 24

				Verticies.push(P2[0], P2[1], P2[2], CrossA2[0], CrossA2[1], CrossA2[2], (xi + 1) / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
				Verticies.push(P4[0], P4[1], P4[2], CrossA2[0], CrossA2[1], CrossA2[2], (xi + 1) / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
				Verticies.push(PM[0], PM[1], PM[2], CrossA2[0], CrossA2[1], CrossA2[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));

				// 31

				Verticies.push(P3[0], P3[1], P3[2], CrossA3[0], CrossA3[1], CrossA3[2], xi / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
				Verticies.push(P1[0], P1[1], P1[2], CrossA3[0], CrossA3[1], CrossA3[2], xi / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
				Verticies.push(PM[0], PM[1], PM[2], CrossA3[0], CrossA3[1], CrossA3[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));

				// 43

				Verticies.push(P4[0], P4[1], P4[2], CrossA4[0], CrossA4[1], CrossA4[2], (xi + 1) / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
				Verticies.push(P3[0], P3[1], P3[2], CrossA4[0], CrossA4[1], CrossA4[2], xi / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
				Verticies.push(PM[0], PM[1], PM[2], CrossA4[0], CrossA4[1], CrossA4[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));

				console.log(PM);

			}

		}

		this.CurveModel.UpdateMesh(Verticies);

	}

	public Delete() : void
	{

		this.CurveModel.Delete();

	}

}

class Model // Doesn't do model matrix: Chunk.shader.UniformMat4("Model", this.ModelMatrix);
{

	private VBO : WebGLBuffer;
	private VertCount : number;
	private ModelMatrix : Float32Array;

	public constructor()
	{

		this.VBO = gl.createBuffer();

	}

	public UpdateMesh(Verticies : number[]) : void
	{

		this.VertCount = Verticies.length / 8;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Verticies), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

	}

	public Render() : void
	{

		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);

		gl.enableVertexAttribArray(CurveShader.PositionLocation);
		gl.vertexAttribPointer(CurveShader.PositionLocation, 3, gl.FLOAT, false, 32, 0);

		gl.enableVertexAttribArray(CurveShader.NormalLocation);
		gl.vertexAttribPointer(CurveShader.NormalLocation, 3, gl.FLOAT, false, 32, 12);

		gl.enableVertexAttribArray(CurveShader.UVLocation);
		gl.vertexAttribPointer(CurveShader.UVLocation, 2, gl.FLOAT, false, 32, 24);

		gl.drawArrays(gl.TRIANGLES, 0, this.VertCount);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);

	}

	public Delete() : void
	{

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.deleteBuffer(this.VBO);

	}

}

class Camera
{

	private static Speed : number = 20.0;
	private static TwoPi : number = 2.0 * Math.PI;
	private static PiOverTwo : number = Math.PI / 2.0;

	public static Position : Float32Array;

	public static Yaw : number = 0;
	public static Pitch : number = 0;

	public static ViewProjection : Float32Array;

	public static Generate() : void
	{

		this.Position = vec3.create();
		this.ViewProjection = mat4.create();

	}

	public static Update() : void
	{

		//while (Camera.Yaw > Camera.TwoPi) Camera.Yaw -= Camera.TwoPi;
		//while (Camera.Yaw < 0) Camera.Yaw += Camera.TwoPi;

		if (Camera.Pitch > Camera.PiOverTwo) Camera.Pitch = Camera.PiOverTwo;
		else if (Camera.Pitch < -Camera.PiOverTwo) Camera.Pitch = -Camera.PiOverTwo;

		if (Input.IsKeyDown(32)) Camera.Position[0] += Camera.Speed * 0.0166667; // space key
		if (Input.IsKeyDown(16)) Camera.Position[0] -= Camera.Speed * 0.0166667; // shift key

		var DeltaPosition : Float32Array = vec3.create();
		var Direction : Float32Array;

		if (Input.IsKeyDown(87)) // w key
		{

			Direction = vec3.fromValues(0, 0, -Camera.Speed * 0.0166667);
			vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);

		}

		if (Input.IsKeyDown(83)) // s key
		{

			Direction = vec3.fromValues(0, 0, Camera.Speed * 0.0166667);
			vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);

		}

		if (Input.IsKeyDown(68)) // d key
		{

			Direction = vec3.fromValues(Camera.Speed * 0.0166667, 0, 0);
			vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);
			
		}

		if (Input.IsKeyDown(65)) // a key
		{

			Direction = vec3.fromValues(-Camera.Speed * 0.0166667, 0, 0);
			vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);
			
		}

		vec3.add(Camera.Position, Camera.Position, DeltaPosition);

	}

	public static MouseMove(Event : MouseEvent) : void
	{

		Camera.Yaw += Event.movementX / 1000.0;
		Camera.Pitch += Event.movementY / 1000.0;

	}

	public static CalculateMatrix() : void
	{

		var View = mat4.create();
		var Projection = mat4.create();
		var a = mat4.create();
		var b = mat4.create();
		var c = mat4.create();

		mat4.fromZRotation(b, Camera.Yaw);
		mat4.fromXRotation(c, Camera.Pitch);
		mat4.multiply(b, c, b);
		mat4.fromTranslation(a, vec3.fromValues(-Camera.Position[0], -Camera.Position[1], -Camera.Position[2]));
		mat4.multiply(View, b, a);
		mat4.perspective(Projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 1000.0);

		mat4.multiply(Camera.ViewProjection, Projection, View);

	}

}

class Input
{

	private static DownNow : boolean[] = [];
	private static DownBefore : boolean[] = [];

	public static Start() : void
	{

		Input.DownNow.length = 256; // 256 different keycodes
		Input.DownBefore.length = 256;

		for (var i : number = 0; i < 256; i++) // Fils it with false statements
		{

			Input.DownNow[i] = false;
			Input.DownBefore[i] = false;

		}

	}

	public static PushBackInputs() : void
	{

		Input.DownBefore = Input.DownNow.slice(0);

	}

	public static IsKeyDown(Key : number) : boolean
	{

		return (Input.DownNow[Key]);

	}

	public static IsKeyPressed(Key : number) : boolean
	{

		return (Input.DownNow[Key] && !Input.DownBefore[Key]);

	}

	public static IsKeyReleased(Key : number) : boolean
	{

		return (!Input.DownNow[Key] && Input.DownBefore[Key]);

	}

	public static KeyUpEvent(Key : number) : void
	{

		Input.DownNow[Key] = false;

	}

	public static KeyDownEvent(Key : number) : void
	{

		Input.DownNow[Key] = true;

	}

}

class Shader
{

	private ID : WebGLProgram;
	private UniformMap : any = {};
	public PositionLocation : GLint;
	public NormalLocation : GLint;
	public UVLocation : GLint;

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
				context.UVLocation = gl.getAttribLocation(ShaderProgram, "UV");

				context.UniformMap = {};

				for (var Uniform : number = 0; Uniform < UniformList.length; Uniform++)
				{

					context.UniformMap[UniformList[Uniform]] = gl.getUniformLocation(ShaderProgram, UniformList[Uniform]);

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

		gl.uniform1f(this.UniformMap[Name], Value);

	}

	UniformInt(Name : string, Value : number) : void
	{

		gl.uniform1i(this.UniformMap[Name], Value);

	}

	UniformVec3(Name : string, Value : Float32Array) : void
	{

		gl.uniform3f(this.UniformMap[Name], Value[0], Value[1], Value[2]);

	}

	UniformVec2(Name : string, Value : Float32Array) : void
	{

		gl.uniform2f(this.UniformMap[Name], Value[0], Value[1]);

	}

	UniformMat4(Name : string, Value : Float32Array) : void
	{

		gl.uniformMatrix4fv(this.UniformMap[Name], false, Value);

	}

}

class Texture
{

	private ID : WebGLTexture;
	private WrapMode : GLenum;
	private FilterMode : GLenum;

	constructor(Name : string, NewWrap : GLenum, NewFilter : GLenum)
	{

		var context = this;

		context.ID = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.ID);

		context.WrapMode = NewWrap;
		context.FilterMode = NewFilter;

		var pixel = new Uint8Array([0, 0, 0, 0]); // Set color to pink while it loads

		gl.bindTexture(gl.TEXTURE_2D, context.ID);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		var image = new Image();
		image.src = "/../texture/" + Name + ".png";

		image.onload = function()
		{

			gl.bindTexture(gl.TEXTURE_2D, context.ID);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

			if (Texture.PowerOfTwo(image.width) && Texture.PowerOfTwo(image.height))
			{

				gl.generateMipmap(gl.TEXTURE_2D);

				

			}

		}

	}

	Use(Location : GLint) : void
	{

		gl.activeTexture(gl.TEXTURE0 + Location);
		gl.bindTexture(gl.TEXTURE_2D, this.ID);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.WrapMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.WrapMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.FilterMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.FilterMode);

	}

	Delete() : void
	{

		gl.deleteTexture(this.ID);

	}

	private static PowerOfTwo(a : number) : boolean
	{

		return (a & (a - 1)) == 0;

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