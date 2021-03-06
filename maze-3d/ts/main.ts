
/// <reference path = "gl-matrix.d.ts" />

declare var Promise: any;

var canvas : HTMLCanvasElement;
var gl : WebGLRenderingContext;
var Int : any;

var width : number = 20;
var height : number = 20;

var CielingHeight = 1;

var data : boolean[] = [];

var MazeModel : Model;
var MainShader : Shader;
var MainTexture : Texture;

var noclip = false;

var wackymode = false;
var timer = 0;

var Cube : EndCube;

var unitimer = 0;

var GameOver = false;

var JumpShader : Shader;
var JumpModel : Model;
var JumpTexture : Texture;

var JumpVert = 
[

	-1, -1, -1, 0, 0, 0, 0, 0,
	1, -1, -1, 0, 0, 0, 1, 0,
	1, 1, -1, 0, 0, 0, 1, 1,

	1, 1, -1, 0, 0, 0, 1, 1,
	-1, 1, -1, 0, 0, 0, 0, 1,
	-1, -1, -1, 0, 0, 0, 0, 0,
	

];

var Sound : any;

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

	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

	canvas.requestPointerLock = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;

	MazeModel = new Model();
	MainShader = new Shader("main", ["Model", "ViewProjection", "Textures", "Camera", "LightScale", "Timer"]);
	MainTexture = new Texture("walls", gl.REPEAT, gl.NEAREST);

	JumpModel = new Model();
	JumpModel.UpdateMesh(JumpVert);
	JumpShader = new Shader("jump", ["Textures", "Timer"]);
	JumpTexture = new Texture("jump", gl.CLAMP_TO_EDGE, gl.LINEAR);

	Sound = new Audio("../maze-3d/sound/scream.mp3");

	Cube = new EndCube(vec3.fromValues(width - 0.5, 0.5, height - 2.5));

	GenerateMaze();

	Camera.Generate();

	Input.Start();

	Camera.Position = vec3.fromValues(2.5, 0.25, 0.5);

	Int = setInterval(Update, 16.666666667);

}

function Update()
{

	if (wackymode) timer += 0.0166666667;
	unitimer += 0.0166666667;

	// Update

	Camera.Update();

	if (!GameOver && Math.floor(Camera.Position[0]) == width - 1 && Math.floor(Camera.Position[2]) == height - 3)
	{

		GameOver = true;

		// Play scream sound

		Sound.play();

	}

	// End of Update, render

	Input.PushBackInputs();

	Camera.CalculateMatrix();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Render maze

	RenderMaze();

	Cube.Render();

	if (GameOver) // Render jump
	{

		JumpShader.Use();

		JumpShader.UniformInt("Texture", 0);
		JumpShader.UniformFloat("Timer", unitimer);

		JumpTexture.Use(0);

		JumpModel.Render();

	}

}

window.onunload = function() : void
{

	MainTexture.Delete();
	MainShader.Delete();
	MazeModel.Delete();
	EndCube.Delete();
	JumpModel.Delete();
	JumpShader.Delete();
	JumpTexture.Delete();

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

function GenerateMaze() : void
{

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

	data[(height * 2)] = false;
	data[(height * (width - 1) + height - 3)] = false;

	divide(0, 0, width - 1, height - 1, 50);

	genmesh();

}

function divide(x1, y1, x2, y2, iters) // recursive function
{

	var includeX = [];
	var includeY = [];

	for (var x = x1 + 2; x < x2 - 1; x++)
	{

		if (data[(height * x) + y1] && data[(height * x) + y2]) includeX.push(x);

	}

	for (var y = y1 + 2; y < y2 - 1; y++)
	{

		if (data[(height * x1) + y] && data[(height * x2) + y]) includeY.push(y);

	}

	var randomY;
	var randomX;

	if (includeX.length <= 0 && includeY.length <= 0) return; // exit

	if (includeY.length > 0)
	{

		randomY = includeY[Math.floor(Math.random() * includeY.length)];

		for (var x = x1 + 1; x < x2; x++)
		{

			data[(height * x) + randomY] = true;

		}

	}

	if (includeX.length > 0)
	{

		var randomX = includeX[Math.floor(Math.random() * includeX.length)];

		for (var y = y1 + 1; y < y2; y++)
		{

			data[(height * randomX) + y] = true;

		}

	}

	iters--;

	if (includeX.length > 0 && includeY.length > 0)
	{

		data[(height * randomX) + Math.floor(Math.random() * (randomY - y1 - 1)) + y1 + 1] = false;
		data[(height * randomX) + Math.floor(Math.random() * (y2 - randomY - 1)) + randomY + 1] = false;

		data[(height * (Math.floor(Math.random() * (randomX - x1 - 1)) + x1 + 1)) + randomY] = false;
		data[(height * (Math.floor(Math.random() * (x2 - randomX - 1)) + randomX + 1)) + randomY] = false;

		if (iters <= 0) return; // exit

		divide(x1, y1, randomX, randomY, iters);
		divide(randomX, y1, x2, randomY, iters);
		divide(x1, randomY, randomX, y2, iters);
		divide(randomX, randomY, x2, y2, iters);
	
	}
	else if (includeX.length > 0) // No more y split
	{

		data[(height * randomX) + Math.floor(Math.random() * (y2 - y1 - 1)) + y1 + 1] = false;

		if (iters <= 0) return; // exit

		divide(x1, y1, randomX, y2, iters);
		divide(randomX, y1, x2, y2, iters);

	}
	else // no more x split (includeY.length > 0)
	{

		data[(height * (Math.floor(Math.random() * (x2 - x1 - 1)) + x1 + 1)) + randomY] = false;

		if (iters <= 0) return; // exit

		divide(x1, y1, x2, randomY, iters);
		divide(x1, randomY, x2, y2, iters);

	}

}

function genmesh()
{

	var Verticies : number[] = [];

	// Walls

	for (var x : number = 0; x < width; x++) // switch dimensions from the generation part, made in different parts RIP xy to xz
	{

		for (var z : number = 0; z < height; z++)
		{

			if (!data[(height * x) + z]) // Add the four possible walls if empty
			{

				// Floor

				Verticies.push(x, 0, z, 0, 1, 0, 0, 0);
				Verticies.push(x + 1, 0, z + 1, 0, 1, 0, 0.5, 0.5);
				Verticies.push(x + 1, 0, z, 0, 1, 0, 0.5, 0);

				Verticies.push(x, 0, z + 1, 0, 1, 0, 0, 0.5);
				Verticies.push(x + 1, 0, z + 1, 0, 1, 0, 0.5, 0.5);
				Verticies.push(x, 0, z, 0, 1, 0, 0, 0);

				// Cieling

				Verticies.push(x, CielingHeight, z, 0, -1, 0, 0, 0.5);
				Verticies.push(x + 1, CielingHeight, z, 0, -1, 0, 0.5, 0.5);
				Verticies.push(x + 1, CielingHeight, z + 1, 0, -1, 0, 0.5, 1);

				Verticies.push(x, CielingHeight, z + 1, 0, -1, 0, 0, 1);
				Verticies.push(x, CielingHeight, z, 0, -1, 0, 0, 0.5);
				Verticies.push(x + 1, CielingHeight, z + 1, 0, -1, 0, 0.5, 1);

				if (x == 0 || data[(height * (x - 1)) + z])
				{

					Verticies.push(x, 0, z, 1, 0, 0, 1, 0.5);
					Verticies.push(x, CielingHeight, z + 1, 1, 0, 0, 0.5, 1);
					Verticies.push(x, 0, z + 1, 1, 0, 0, 0.5, 0.5);

					Verticies.push(x, 0, z, 1, 0, 0, 1, 0.5);
					Verticies.push(x, CielingHeight, z, 1, 0, 0, 1, 1);
					Verticies.push(x, CielingHeight, z + 1, 1, 0, 0, 0.5, 1);

				}

				if (x == width - 1 || data[(height * (x + 1)) + z])
				{

					Verticies.push(x + 1, 0, z, -1, 0, 0, 0.5, 0.5);
					Verticies.push(x + 1, 0, z + 1, -1, 0, 0, 1, 0.5);
					Verticies.push(x + 1, CielingHeight, z + 1, -1, 0, 0, 1, 1);

					Verticies.push(x + 1, 0, z, -1, 0, 0, 0.5, 0.5);
					Verticies.push(x + 1, CielingHeight, z + 1, -1, 0, 0, 1, 1);
					Verticies.push(x + 1, CielingHeight, z, -1, 0, 0, 0.5, 1);
					
				}

				if (z == 0 || data[(height * x) + z - 1])
				{

					Verticies.push(x, 0, z, 0, 0, 1, 0.5, 0.5);
					Verticies.push(x + 1, 0, z, 0, 0, 1, 1, 0.5);
					Verticies.push(x + 1, CielingHeight, z, 0, 0, 1, 1, 1);

					Verticies.push(x, CielingHeight, z, 0, 0, 1, 0.5, 1);
					Verticies.push(x, 0, z, 0, 0, 1, 0.5, 0.5);
					Verticies.push(x + 1, CielingHeight, z, 0, 0, 1, 1, 1);

				}

				if (z == height - 1 || data[(height * x) + z + 1])
				{

					Verticies.push(x, 0, z + 1, 0, 0, -1, 1, 0.5);
					Verticies.push(x + 1, CielingHeight, z + 1, 0, 0, -1, 0.5, 1);
					Verticies.push(x + 1, 0, z + 1, 0, 0, -1, 0.5, 0.5);

					Verticies.push(x, CielingHeight, z + 1, 0, 0, -1, 1, 1);
					Verticies.push(x + 1, CielingHeight, z + 1, 0, 0, -1, 0.5, 1);
					Verticies.push(x, 0, z + 1, 0, 0, -1, 1, 0.5);
					
				}

			}

		}

	}

	MazeModel.UpdateMesh(Verticies);

}

function RenderMaze()
{

	MainShader.Use();

	MainShader.UniformInt("Texture", 0);

	MainShader.UniformMat4("ViewProjection", Camera.ViewProjection);
	MainShader.UniformMat4("Model", mat4.create());
	MainShader.UniformFloat("LightScale", 1);
	MainShader.UniformFloat("Timer", timer);
	MainShader.UniformVec3("Camera", Camera.Position);

	MainTexture.Use(0);

	MazeModel.Render();
	
}

class EndCube
{

	private static VData =
	[

		// bottom y

		-1, -1, -1, 0, -1, 0, 0.5, 0,
		1, -1, -1, 0, -1, 0, 1, 0,
		-1, -1, 1, 0, -1, 0, 0.5, 0.5,

		-1, -1, 1, 0, -1, 0, 0.5, 0.5,
		1, -1, -1, 0, -1, 0, 1, 0,
		1, -1, 1, 0, -1, 0, 1, 0.5,

		// top

		-1, 1, -1, 0, 1, 0, 1, 0,
		-1, 1, 1, 0, 1, 0, 1, 0.5,
		1, 1, -1, 0, 1, 0, 0.5, 0,

		-1, 1, 1, 0, 1, 0, 1, 0.5,
		1, 1, 1, 0, 1, 0, 0.5, 0.5,
		1, 1, -1, 0, 1, 0, 0.5, 0,

		// left x

		-1, -1, -1, -1, 0, 0, 1, 0,
		-1, -1, 1, -1, 0, 0, 1, 0.5,
		-1, 1, -1, -1, 0, 0, 0.5, 0,

		-1, -1, 1, -1, 0, 0, 1, 0.5,
		-1, 1, 1, -1, 0, 0, 0.5, 0.5,
		-1, 1, -1, -1, 0, 0, 0.5, 0,

		// right

		1, -1, -1, 1, 0, 0, 0.5, 0,
		1, 1, -1, 1, 0, 0, 1, 0,
		1, -1, 1, 1, 0, 0, 0.5, 0.5,

		1, -1, 1, 1, 0, 0, 0.5, 0.5,
		1, 1, -1, 1, 0, 0, 1, 0,
		1, 1, 1, 1, 0, 0, 1, 0.5,

		// front z

		-1, -1, -1, 0, 0, -1, 1, 0,
		-1, 1, -1, 0, 0, -1, 1, 0.5,
		1, -1, -1, 0, 0, -1, 0.5, 0,

		1, -1, -1, 0, 0, -1, 0.5, 0,
		-1, 1, -1, 0, 0, -1, 1, 0.5,
		1, 1, -1, 0, 0, -1, 0.5, 0.5,

		// back

		-1, -1, 1, 0, 0, 1, 0.5, 0,
		1, -1, 1, 0, 0, 1, 1, 0,
		-1, 1, 1, 0, 0, 1, 0.5, 0.5,

		1, -1, 1, 0, 0, 1, 1, 0,
		1, 1, 1, 0, 0, 1, 1, 0.5,
		-1, 1, 1, 0, 0, 1, 0.5, 0.5

	];

	private static CubeModel = null;

	private Position;
	private static Scale = 0.2;

	constructor(newpos : Float32Array)
	{

		this.Position = newpos;

		if (EndCube.CubeModel == null)
		{

			EndCube.CubeModel = new Model();
			EndCube.CubeModel.UpdateMesh(EndCube.VData);

		}

	}

	public Render() : void
	{

		var ModelMatrix : Float32Array = mat4.create();
		var scal : Float32Array = mat4.create();
		var rot : Float32Array = mat4.create();
		var c : Float32Array = mat4.create();

		mat4.fromTranslation(ModelMatrix, this.Position);
		mat4.fromScaling(scal, vec3.fromValues(EndCube.Scale, EndCube.Scale, EndCube.Scale));
		mat4.fromRotation(rot, unitimer, vec3.fromValues(1, 1, 1))

		mat4.multiply(c, rot, scal);
		mat4.multiply(ModelMatrix, ModelMatrix, c);

		MainShader.Use();

		MainShader.UniformInt("Texture", 0);

		MainShader.UniformMat4("ViewProjection", Camera.ViewProjection);
		MainShader.UniformMat4("Model", ModelMatrix);
		MainShader.UniformFloat("LightScale", 1);
		MainShader.UniformFloat("Timer", timer);
		MainShader.UniformVec3("Camera", Camera.Position);

		MainTexture.Use(0);

		EndCube.CubeModel.Render();

	}

	public static Delete()
	{

		EndCube.CubeModel.Delete();

	}

}

class Camera
{

	private static Speed : number = 0.8;
	private static TwoPi : number = 2.0 * Math.PI;
	private static PiOverTwo : number = Math.PI / 2.0;

	public static Position : Float32Array;

	public static Yaw : number = Math.PI;
	public static Pitch : number = 0;

	public static CollisionAccuracy = 0.1;

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

		var DeltaPosition : Float32Array = vec3.create();
		var Direction : Float32Array;

		if (Input.IsKeyDown(87)) // w key
		{

			Direction = vec3.fromValues(0, 0, -Camera.Speed * 0.0166667);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);

		}

		if (Input.IsKeyDown(83)) // s key
		{

			Direction = vec3.fromValues(0, 0, Camera.Speed * 0.0166667);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);

		}

		if (Input.IsKeyDown(68)) // d key
		{

			Direction = vec3.fromValues(Camera.Speed * 0.0166667, 0, 0);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);
			
		}

		if (Input.IsKeyDown(65)) // a key
		{

			Direction = vec3.fromValues(-Camera.Speed * 0.0166667, 0, 0);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(DeltaPosition, DeltaPosition, Direction);
			
		}

		vec3.add(Camera.Position, Camera.Position, DeltaPosition);

		// Crappy collision detection

		if (!noclip)
		{

			Camera.Speed = 0.8;

			var Backwards : Float32Array = vec3.clone(DeltaPosition);
			vec3.scale(Backwards, Backwards, -Camera.CollisionAccuracy);

			while (Camera.Position[0] < 0 || Camera.Position[2] < 0 || Camera.Position[0] > width || Camera.Position[2] > height || data[(height * Math.floor(Camera.Position[0])) + Math.floor(Camera.Position[2])])
			{

				vec3.add(Camera.Position, Camera.Position, Backwards);

			}

		}
		else // hax
		{

			Camera.Speed = 5;

			if (Input.IsKeyDown(32)) Camera.Position[1] += Camera.Speed * 0.0166667; // space key
			if (Input.IsKeyDown(16)) Camera.Position[1] -= Camera.Speed * 0.0166667; // shift key

		}

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

		mat4.fromYRotation(b, Camera.Yaw);
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

		gl.enableVertexAttribArray(MainShader.PositionLocation);
		gl.vertexAttribPointer(MainShader.PositionLocation, 3, gl.FLOAT, false, 32, 0);

		gl.enableVertexAttribArray(MainShader.NormalLocation);
		gl.vertexAttribPointer(MainShader.NormalLocation, 3, gl.FLOAT, false, 32, 12);

		gl.enableVertexAttribArray(MainShader.UVLocation);
		gl.vertexAttribPointer(MainShader.UVLocation, 2, gl.FLOAT, false, 32, 24);

		gl.drawArrays(gl.TRIANGLES, 0, this.VertCount);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);

	}

	public Delete() : void
	{

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.deleteBuffer(this.VBO);

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
		image.src = "/../maze-3d/texture/" + Name + ".png";

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