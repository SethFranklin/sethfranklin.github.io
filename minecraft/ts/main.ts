
/// <reference path = "gl-matrix.d.ts" />

declare var Promise: any;

var canvas : HTMLCanvasElement;
var gl : WebGLRenderingContext;
var Int : any;

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

	Terrain.LoadAssets();
	Terrain.Generate(Math.random(), Math.random());

	Camera.Generate();

	Input.Start();

	Camera.Position = vec3.fromValues(75, 200, 110);

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

	Terrain.Render();

	Camera.RenderCrosshair();

}

window.onunload = function() : void
{

	Terrain.UnloadAssets();

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

window.onclick = function(Event) : void
{

	canvas.requestPointerLock();

	Camera.Click(Event.which != 3);
	
}

window.onmousemove = function(Event) : void
{

	Camera.MouseMove(Event);

}

class Terrain
{

	private static Chunks : Chunk[][]; // goes x, z

	public static XChunks : number = 10;
	public static ZChunks : number = 10;

	public static LoadAssets() : void
	{

		Chunk.LoadAssets();

	}

	public static UnloadAssets() : void
	{

		Chunk.UnloadAssets();

		for (var x : number = 0; x < Terrain.XChunks; x++)
		{

			for (var z : number = 0; z < Terrain.ZChunks; z++)
			{

				Terrain.Chunks[x][z].Delete();
				
			}

		}

	}

	public static Generate(Seed1 : number, Seed2 : number) : void
	{

		//noise.seed(Seed1);

		Terrain.Chunks = [];
		Terrain.Chunks.length = Terrain.XChunks;

		for (var x : number = 0; x < Terrain.XChunks; x++)
		{

			Terrain.Chunks[x] = [];
			Terrain.Chunks[x].length = Terrain.ZChunks;

			for (var z : number = 0; z < Terrain.ZChunks; z++)
			{

				Terrain.Chunks[x][z] = new Chunk(x, z, Seed2);
				
			}

		}

		for (var x : number = 0; x < Terrain.XChunks; x++)
		{

			for (var z : number = 0; z < Terrain.ZChunks; z++)
			{

				Terrain.Chunks[x][z].UpdateMesh();
				
			}

		}

	}

	public static GetChunk(x : number, z : number) : Chunk
	{

		if (x < 0 || z < 0 || x >= Terrain.XChunks || z > Terrain.ZChunks) return null;
		else return Terrain.Chunks[x][z];

	}

	public static Render() : void
	{

		Chunk.shader.Use();

		Chunk.shader.UniformInt("Textures", 0);
		Chunk.shader.UniformMat4("ViewProjection", Camera.ViewProjection);

		Chunk.textures.Use(0);

		for (var x : number = 0; x < Terrain.XChunks; x++)
		{

			for (var z : number = 0; z < Terrain.ZChunks; z++)
			{

				Terrain.Chunks[x][z].Render();
				
			}

		}

	}

	public static GetBlock(x : number, y : number, z : number) : Block
	{

		if (x < 0 || y < 0 || z < 0 || x >= Terrain.XChunks * Chunk.XWidth || z >= Terrain.ZChunks * Chunk.ZWidth || y >= Chunk.Height) return null;
		else return Terrain.Chunks[Math.floor(x / Chunk.XWidth)][Math.floor(z / Chunk.ZWidth)].GetBlock(x % Chunk.XWidth, y, z % Chunk.ZWidth);

	}

	public static SetBlock(x : number, y : number , z : number, b : Block) : void
	{

		if (x < 0 || y < 0 || z < 0 || x >= Terrain.XChunks * Chunk.XWidth || z >= Terrain.ZChunks * Chunk.ZWidth || y >= Chunk.Height) return;

		var cx = Math.floor(x / Chunk.XWidth); // chunk x
		var cz = Math.floor(z / Chunk.ZWidth);

		var ox = x % Chunk.XWidth; // block x
		var oz = z % Chunk.ZWidth;

		Terrain.Chunks[cx][cz].SetBlock(ox, y, oz, b);

		Terrain.Chunks[cx][cz].UpdateMesh();

		if (cx != 0 && ox == 0) Terrain.Chunks[cx - 1][cz].UpdateMesh();
		if (cx != Terrain.XChunks - 1 && ox == Chunk.XWidth - 1) Terrain.Chunks[cx + 1][cz].UpdateMesh();

		if (cz != 0 && oz == 0) Terrain.Chunks[cx][cz - 1].UpdateMesh();
		if (cz != Terrain.ZChunks - 1 && oz == Chunk.ZWidth - 1) Terrain.Chunks[cx][cz + 1].UpdateMesh();

	}


}

class Chunk
{

	public static shader : Shader;
	public static textures : Texture;

	public static XWidth : number = 16; // X and Z are horizontal axis, Y is vertical
	public static ZWidth : number = 16;
	public static Height : number = 256;

	private XPosition : number;
	private ZPosition : number;

	private Blocks : Block[][][]; // goes x, y, z

	private TerrainModel : Model;

	private ModelMatrix : Float32Array;

	private static BottomTextures;
	private static SideTextures;
	private static TopTextures;

	public constructor(newx : number, newz : number, Seed1 : number)
	{

		this.XPosition = newx;
		this.ZPosition = newz;

		// Generate terrain

		this.Blocks = [];
		this.Blocks.length = Chunk.XWidth;

		var Seed = Seed1;
		var context : Chunk = this;

		for (var x : number = 0; x < Chunk.XWidth; x++) // Initializing blocks
		{

			context.Blocks[x] = [];
			context.Blocks[x].length = Chunk.Height;

			for (var y : number = 0; y < Chunk.Height; y++)
			{

				context.Blocks[x][y] = [];
				context.Blocks[x][y].length = Chunk.ZWidth;

				for (var z : number = 0; z < Chunk.ZWidth; z++)
				{

					context.Blocks[x][y][z] = Block.Air; // Fills everything with air

				}

			}

		}

		// Terrain Generation

		var GrassCount : number; // Layers of soil
		var DirtCount : number;

		var XBlocks = Chunk.XWidth * Terrain.XChunks;
		var ZBlocks = Chunk.ZWidth * Terrain.ZChunks;

		for (var x : number = 0; x < Chunk.XWidth; x++)
		{

			for (var z : number = 0; z < Chunk.ZWidth; z++)
			{

				//var h = Math.round(noise.perlin2((((Chunk.XWidth * context.XPosition) + x) / XBlocks), ((Chunk.ZWidth * context.ZPosition) * z) / ZBlocks) * 20) + 30;

				var h = 128 + Math.round(100 * (Math.cos(((Chunk.XWidth * context.XPosition) + x) / (Math.PI * Chunk.XWidth / 4))) * (Math.cos(((Chunk.ZWidth * context.ZPosition) + z) / (Math.PI * Chunk.ZWidth / 4))));

				GrassCount = 1;
				DirtCount = 5;

				while (h >= 0)
				{

					if (GrassCount > 0)
					{

						context.Blocks[x][h][z] = Block.Grass;
						GrassCount--;

					}
					else if (DirtCount > 0)
					{

						context.Blocks[x][h][z] = Block.Dirt;
						DirtCount--;

					}
					else context.Blocks[x][h][z] = Block.Stone;

					h--;

				}
				
			}

		}

		this.TerrainModel = new Model();

		this.ModelMatrix = mat4.create();

		mat4.fromTranslation(this.ModelMatrix, vec3.fromValues(this.XPosition * Chunk.XWidth, 0, this.ZPosition * Chunk.ZWidth));

		Chunk.TopTextures = {};
		Chunk.TopTextures[Block.Stone] = 3;
		Chunk.TopTextures[Block.Dirt] = 2;
		Chunk.TopTextures[Block.Grass] = 0;
		Chunk.TopTextures[Block.WoodPlank] = 4;
		Chunk.TopTextures[Block.WoodLog] = 5;
		Chunk.TopTextures[Block.Leaves] = 7;
		Chunk.TopTextures[Block.Bricks] = 8;
		Chunk.TopTextures[Block.Bookshelf] = 4;
		Chunk.TopTextures[Block.Netherrack] = 10;
		Chunk.TopTextures[Block.DiamondBlock] = 11;

		Chunk.BottomTextures = {};
		Chunk.BottomTextures[Block.Stone] = 3;
		Chunk.BottomTextures[Block.Dirt] = 2;
		Chunk.BottomTextures[Block.Grass] = 2;
		Chunk.BottomTextures[Block.WoodPlank] = 4;
		Chunk.BottomTextures[Block.WoodLog] = 5;
		Chunk.BottomTextures[Block.Leaves] = 7;
		Chunk.BottomTextures[Block.Bricks] = 8;
		Chunk.BottomTextures[Block.Bookshelf] = 4;
		Chunk.BottomTextures[Block.Netherrack] = 10;
		Chunk.BottomTextures[Block.DiamondBlock] = 11;

		Chunk.SideTextures = {};
		Chunk.SideTextures[Block.Stone] = 3;
		Chunk.SideTextures[Block.Dirt] = 2;
		Chunk.SideTextures[Block.Grass] = 1;
		Chunk.SideTextures[Block.WoodPlank] = 4;
		Chunk.SideTextures[Block.WoodLog] = 6;
		Chunk.SideTextures[Block.Leaves] = 7;
		Chunk.SideTextures[Block.Bricks] = 8;
		Chunk.SideTextures[Block.Bookshelf] = 9;
		Chunk.SideTextures[Block.Netherrack] = 10;
		Chunk.SideTextures[Block.DiamondBlock] = 11;

	}

	public static LoadAssets() : void
	{

		Chunk.shader = new Shader("terrain", ["Model", "ViewProjection", "Textures"]);
		Chunk.textures = new Texture("terrain", gl.REPEAT, gl.NEAREST);

	}

	public static UnloadAssets() : void
	{

		Chunk.shader.Delete();
		Chunk.textures.Delete();

	}

	public UpdateMesh() : void
	{

		var context : Chunk = this;

		var Verticies : number[] = [];

		var XPosChunk : Chunk = Terrain.GetChunk(this.XPosition + 1, this.ZPosition); // The four neighboor chunks
		var XNegChunk : Chunk = Terrain.GetChunk(this.XPosition - 1, this.ZPosition); // how do you spell neighboor, is that right?
		var ZPosChunk : Chunk = Terrain.GetChunk(this.XPosition, this.ZPosition + 1);
		var ZNegChunk : Chunk = Terrain.GetChunk(this.XPosition, this.ZPosition - 1);

		for (var x : number = 0; x < Chunk.XWidth; x++)
		{

			for (var y : number = 0; y < Chunk.Height; y++)
			{

				for (var z : number = 0; z < Chunk.ZWidth; z++)
				{

					if (context.Blocks[x][y][z] != Block.Air) // If there's a block there, generate verticies
					{

						var UVOffsetTop : number = 0.0625 * Chunk.TopTextures[context.Blocks[x][y][z]];
						var UVOffsetSide : number = 0.0625 * Chunk.SideTextures[context.Blocks[x][y][z]];
						var UVOffsetBottom : number = 0.0625 * Chunk.BottomTextures[context.Blocks[x][y][z]];

						if ((y + 1 < Chunk.Height && context.Blocks[x][y + 1][z] == Block.Air) || y == Chunk.Height - 1) // Top face +y
						{

							Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.0625 + UVOffsetTop, 1.0);
							Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.0625 + UVOffsetTop, 0.0);
							Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 1.0);
							
							Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.0625 + UVOffsetTop, 0.0);
							Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 0.0);
							Verticies.push(-0.5 + x, 0.5 + y,  0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 1.0);

						}

						if ((y > 0 && context.Blocks[x][y - 1][z] == Block.Air) || y == 0) // Bottom face, -y
						{

							Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.0625 + UVOffsetBottom, 1.0);
							Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 1.0);
							Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.0625 + UVOffsetBottom, 0.0);

							Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.0625 + UVOffsetBottom, 0.0);
							Verticies.push(-0.5 + x, -0.5 + y,  0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 1.0);
							Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 0.0);

						}

						if ((x + 1 < Chunk.XWidth && context.Blocks[x + 1][y][z] == Block.Air) || (x == Chunk.XWidth - 1 && (XPosChunk == null || XPosChunk.GetBlock(0, y, z) == Block.Air))) // +x face
						{

							Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
							Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
							Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 0.0);

							Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 0.0);
							Verticies.push(0.5 + x, -0.5 + y,  0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
							Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 1.0);

						}

						if ((x > 0 && context.Blocks[x - 1][y][z] == Block.Air) || (x == 0 && (XNegChunk == null || XNegChunk.GetBlock(Chunk.XWidth - 1, y, z) == Block.Air))) // -x face
						{

							Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 0.0);
							Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
							Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 1.0);

							Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
							Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
							Verticies.push(-0.5 + x, -0.5 + y,  0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 1.0);

						}

						if ((z + 1 < Chunk.ZWidth && context.Blocks[x][y][z + 1] == Block.Air) || (z == Chunk.ZWidth - 1 && (ZPosChunk == null || ZPosChunk.GetBlock(x, y, 0) == Block.Air))) // +z face
						{

							Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0625 + UVOffsetSide, 0.0);
							Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 0.0);
							Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0625 + UVOffsetSide, 1.0);

							Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0625 + UVOffsetSide, 1.0);
							Verticies.push(-0.5 + x, 0.5 + y,  0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 0.0);
							Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 1.0);

						}

						if ((z > 0 && context.Blocks[x][y][z - 1] == Block.Air) || (z == 0 && (ZNegChunk == null || ZNegChunk.GetBlock(x, y, Chunk.ZWidth - 1) == Block.Air))) // -z face
						{

							Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 0.0);
							Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 1.0);
							Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0625 + UVOffsetSide, 0.0);
							
							Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 1.0);
							Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0625 + UVOffsetSide, 1.0);
							Verticies.push(-0.5 + x, 0.5 + y,  -0.5 + z, 0.0, 0.0, -1.0, 0.0625 + UVOffsetSide, 0.0);

						}

					}

				}

			}

		}

		this.TerrainModel.UpdateMesh(Verticies);

	}

	public GetBlock(x : number, y : number , z : number) : Block
	{

		return this.Blocks[x][y][z];

	}

	public SetBlock(x : number, y : number , z : number, b : Block) : void
	{

		this.Blocks[x][y][z] = b;

	}

	public Render() : void
	{

		Chunk.shader.UniformMat4("Model", this.ModelMatrix);

		this.TerrainModel.Render(Chunk.shader);

	}

	public Delete() : void
	{

		this.TerrainModel.Delete();

	}

}

class Camera
{

	private static TwoPi : number = 2.0 * Math.PI;
	private static PiOverTwo : number = Math.PI / 2.0;

	public static Position : Float32Array;
	public static Velocity : Float32Array;
	public static Acceleration : Float32Array;

	public static OldPosition : Float32Array;

	private static MaxSpeed : number = 5;
	private static WalkAccel : number = 10;
	private static JumpStrength : number = 400;
	private static Gravity : number = 10;
	private static Resistance : number = 2;

	private static Grounded : boolean = false;
	private static Flying : boolean = false;
	private static FlyTimer : number = -1;
	private static FlyWindow : number = 0.4;

	private static HitboxHeight = 1.8;
	private static HitboxWidth = 0.6;

	private static HeadOffset = 0.6;

	public static Yaw : number = 3 * Math.PI / 4.0;
	public static Pitch : number = 0;

	public static ViewProjection : Float32Array;

	private static CursorTexture : Texture;
	private static CursorModel : Model;
	public static CursorShader : Shader;

	private static BlockPlace : Block;

	private static BlockHand : Block[];

	private static DeltaTime : number = 0.0166666667;

	private static CursorData : number[] =
	[

		-1, -1, -1, 0, 0, 0, 0, 0,
		1, -1, -1, 0, 0, 0, 1, 0,
		1, 1, -1, 0, 0, 0, 1, 1,

		1, 1, -1, 0, 0, 0, 1, 1,
		-1, 1, -1, 0, 0, 0, 0, 1,
		-1, -1, -1, 0, 0, 0, 0, 0,
		

	];

	public static Generate() : void
	{

		Camera.Position = vec3.create();
		Camera.Velocity = vec3.create();
		Camera.Acceleration = vec3.create();
		Camera.ViewProjection = mat4.create();

		Camera.BlockPlace = Block.Stone;

		Camera.BlockHand =
		[

			Block.Stone,
			Block.Dirt,
			Block.Grass,
			Block.WoodPlank,
			Block.WoodLog,
			Block.Leaves,
			Block.Bricks,
			Block.Bookshelf,
			Block.Netherrack,
			Block.DiamondBlock

		];

		Camera.CursorTexture = new Texture("cursor", gl.CLAMP_TO_EDGE, gl.NEAREST);
		Camera.CursorModel = new Model();
		Camera.CursorModel.UpdateMesh(Camera.CursorData);
		Camera.CursorShader = new Shader("cursor", ["Textures", "Scale", "Aspect"]);

	}

	public static Update() : void
	{

		if (Camera.Pitch > Camera.PiOverTwo) Camera.Pitch = Camera.PiOverTwo;
		else if (Camera.Pitch < -Camera.PiOverTwo) Camera.Pitch = -Camera.PiOverTwo;

		if (Input.IsKeyDown(48)) Camera.BlockPlace = Camera.BlockHand[9];

		for (var i : number = 49; i <= 57; i++)
		{

			if (Input.IsKeyDown(i)) Camera.BlockPlace = Camera.BlockHand[i - 49];

		}

		Camera.FlyTimer -= Camera.DeltaTime;

		Camera.OldPosition = vec3.clone(Camera.Position);

		Camera.Acceleration = vec3.fromValues(0, 0, 0);

		if (Input.IsKeyPressed(32))
		{

			if (Camera.FlyTimer > 0)
			{

				Camera.Flying = !Camera.Flying;
				Camera.FlyTimer = -1;
				Camera.Grounded = false;

			}
			else
			{

				Camera.FlyTimer = Camera.FlyWindow

			}

			if (Camera.Grounded) Camera.Acceleration[1] += Camera.JumpStrength;

		}

		if (Camera.Flying)
		{

			if (Input.IsKeyDown(32)) Camera.Acceleration[1] += Camera.WalkAccel;
			if (Input.IsKeyDown(16)) Camera.Acceleration[1] -= Camera.WalkAccel;

		}
		else Camera.Acceleration[1] -= Camera.Gravity;

		var HorizontalAccel : Float32Array = vec3.fromValues(0, 0, 0);
		var Direction : Float32Array;

		if (Input.IsKeyDown(87)) // w key
		{

			Direction = vec3.fromValues(0, 0, -1);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(HorizontalAccel, HorizontalAccel, Direction);

		}

		if (Input.IsKeyDown(83)) // s key
		{

			Direction = vec3.fromValues(0, 0, 1);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(HorizontalAccel, HorizontalAccel, Direction);

		}

		if (Input.IsKeyDown(68)) // d key
		{

			Direction = vec3.fromValues(1, 0, 0);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(HorizontalAccel, HorizontalAccel, Direction);
			
		}

		if (Input.IsKeyDown(65)) // a key
		{

			Direction = vec3.fromValues(-1, 0, 0);
			vec3.rotateY(Direction, Direction, vec3.fromValues(0, 0, 0), -Camera.Yaw);
			vec3.add(HorizontalAccel, HorizontalAccel, Direction);
			
		}

		vec3.normalize(HorizontalAccel, HorizontalAccel);
		vec3.scale(HorizontalAccel, HorizontalAccel, Camera.WalkAccel)

		vec3.add(Camera.Acceleration, Camera.Acceleration, HorizontalAccel);

		var inter : Float32Array = vec3.create();

		vec3.scale(inter, Camera.Acceleration, Camera.DeltaTime);
		vec3.add(Camera.Velocity, Camera.Velocity, inter);

		inter = vec3.fromValues(Camera.Velocity[0], 0, Camera.Velocity[2]);

		if (vec3.length(inter) > Camera.MaxSpeed)
		{

			vec3.normalize(inter, inter);
			vec3.scale(inter, inter, Camera.MaxSpeed);

		}

		Camera.Velocity[0] = inter[0];
		Camera.Velocity[2] = inter[2];

		vec3.scale(inter, Camera.Velocity, Camera.DeltaTime);
		vec3.add(Camera.Position, Camera.Position, inter);

		// Collision detection/response

		// X direction

		var bx, tx, by, ty, bz, tz;
		var loop;
		var dd;

		bx = Math.max(0, Math.round(Camera.Position[0] - (Camera.HitboxWidth / 2)));
		tx = Math.min((Terrain.XChunks * Chunk.XWidth) - 1, Math.round(Camera.Position[0] + (Camera.HitboxWidth / 2)));
		by = Math.max(0, Math.round(Camera.OldPosition[1] - (Camera.HitboxHeight / 2)));
		ty = Math.min(Chunk.Height - 1, Math.round(Camera.OldPosition[1] + (Camera.HitboxHeight / 2)));
		bz = Math.max(0, Math.round(Camera.OldPosition[2] - (Camera.HitboxWidth / 2)));
		tz = Math.min((Terrain.ZChunks * Chunk.ZWidth) - 1, Math.round(Camera.OldPosition[2] + (Camera.HitboxWidth / 2)));

		if (Camera.Collision(bx, tx, by, ty, bz, tz))
		{

			if (Camera.Velocity[0] > 0)
			{

				dd = -1;
				Camera.Position[0] = Math.round(Camera.Position[0] + (Camera.HitboxWidth / 2)) - ((Camera.HitboxWidth + 1) / 2);

			}
			else
			{

				dd = 1;
				Camera.Position[0] = Math.round(Camera.Position[0] - (Camera.HitboxWidth / 2)) + ((Camera.HitboxWidth + 1) / 2);

			}

			bx = Math.max(0, Math.round(Camera.Position[0] - (Camera.HitboxWidth / 2)));
			tx = Math.min((Terrain.XChunks * Chunk.XWidth) - 1, Math.round(Camera.Position[0] + (Camera.HitboxWidth / 2)));

			loop = Camera.Collision(bx, tx, by, ty, bz, tz);

			while (loop)
			{

				Camera.Position[0] += dd;

				bx += dd;
				tx += dd;

				loop = Camera.Collision(bx, tx, by, ty, bz, tz);

			}

			Camera.Velocity[0] = 0;

		}

		// Y direction

		bx = Math.max(0, Math.round(Camera.OldPosition[0] - (Camera.HitboxWidth / 2)));
		tx = Math.min((Terrain.XChunks * Chunk.XWidth) - 1, Math.round(Camera.OldPosition[0] + (Camera.HitboxWidth / 2)));
		by = Math.max(0, Math.round(Camera.Position[1] - (Camera.HitboxHeight / 2)));
		ty = Math.min(Chunk.Height - 1, Math.round(Camera.Position[1] + (Camera.HitboxHeight / 2)));
		bz = Math.max(0, Math.round(Camera.OldPosition[2] - (Camera.HitboxWidth / 2)));
		tz = Math.min((Terrain.ZChunks * Chunk.ZWidth) - 1, Math.round(Camera.OldPosition[2] + (Camera.HitboxWidth / 2)));

		if (Camera.Collision(bx, tx, by, ty, bz, tz))
		{

			if (Camera.Velocity[1] > 0)
			{

				dd = -1;
				Camera.Position[1] = Math.round(Camera.Position[1] + (Camera.HitboxHeight / 2)) - ((Camera.HitboxHeight + 1) / 2);

			}
			else
			{

				dd = 1;
				Camera.Position[1] = Math.round(Camera.Position[1] - (Camera.HitboxHeight / 2)) + ((Camera.HitboxHeight + 1) / 2);

				Camera.Grounded = true;
				Camera.Flying = false;

			}

			by = Math.max(0, Math.round(Camera.Position[1] - (Camera.HitboxHeight / 2)));
			ty = Math.min(Chunk.Height - 1, Math.round(Camera.Position[1] + (Camera.HitboxHeight / 2)));

			loop = Camera.Collision(bx, tx, by, ty, bz, tz);

			while (loop)
			{

				Camera.Position[1] += dd;

				by += dd;
				ty += dd;

				loop = Camera.Collision(bx, tx, by, ty, bz, tz);

			}

			Camera.Velocity[1] = 0;

		}

		// Z direction

		bx = Math.max(0, Math.round(Camera.OldPosition[0] - (Camera.HitboxWidth / 2)));
		tx = Math.min((Terrain.XChunks * Chunk.XWidth) - 1, Math.round(Camera.OldPosition[0] + (Camera.HitboxWidth / 2)));
		by = Math.max(0, Math.round(Camera.OldPosition[1] - (Camera.HitboxHeight / 2)));
		ty = Math.min(Chunk.Height - 1, Math.round(Camera.OldPosition[1] + (Camera.HitboxHeight / 2)));
		bz = Math.max(0, Math.round(Camera.Position[2] - (Camera.HitboxWidth / 2)));
		tz = Math.min((Terrain.ZChunks * Chunk.ZWidth) - 1, Math.round(Camera.Position[2] + (Camera.HitboxWidth / 2)));

		if (Camera.Collision(bx, tx, by, ty, bz, tz))
		{

			if (Camera.Velocity[2] > 0)
			{

				dd = -1;
				Camera.Position[2] = Math.round(Camera.Position[2] + (Camera.HitboxWidth / 2)) - ((Camera.HitboxWidth + 1) / 2);

			}
			else
			{

				dd = 1;
				Camera.Position[2] = Math.round(Camera.Position[2] - (Camera.HitboxWidth / 2)) + ((Camera.HitboxWidth + 1) / 2);

			}

			bz = Math.max(0, Math.round(Camera.Position[2] - (Camera.HitboxWidth / 2)));
			tz = Math.min((Terrain.ZChunks * Chunk.ZWidth) - 1, Math.round(Camera.Position[2] + (Camera.HitboxWidth / 2)));

			loop = Camera.Collision(bx, tx, by, ty, bz, tz);

			while (loop)
			{

				Camera.Position[2] += dd;

				bz += dd;
				tz += dd;

				loop = Camera.Collision(bx, tx, by, ty, bz, tz);

			}

			Camera.Velocity[2] = 0;

		}

	}

	private static Collision(x0, x1, y0, y1, z0, z1) : boolean // AABB
	{

		for (var ix : number = x0; ix <= x1; ix++)
		{

			for (var iy : number = y0; iy <= y1; iy++)
			{

				for (var iz : number = z0; iz <= z1; iz++)
				{

					if (Terrain.GetBlock(ix, iy, iz) != Block.Air) return true;

				}

			}

		}

		return false;

	}

	public static MouseMove(Event : MouseEvent) : void
	{

		Camera.Yaw += Event.movementX / 1000.0;
		Camera.Pitch += Event.movementY / 1000.0;

	}

	public static Click(leftclick : boolean) : void
	{

		var b : Block = Terrain.GetBlock(Math.round(Camera.Position[0]), Math.round(Camera.Position[1] + Camera.HeadOffset), Math.round(Camera.Position[2]));

		if (b == Block.Air || b == null)
		{

			var Accuracy = 0.1;

			var Delta : Float32Array = vec3.fromValues(0, 0, Accuracy);

			vec3.rotateX(Delta, Delta, vec3.fromValues(0, 0, 0), Camera.Pitch);
			vec3.rotateY(Delta, Delta, vec3.fromValues(0, 0, 0), -Camera.Yaw + Math.PI);

			var MaxDistance : number = 10;

			var Distance = 0;
			var pos : Float32Array = vec3.fromValues(Camera.Position[0], Camera.Position[1] + Camera.HeadOffset, Camera.Position[2]);
			var lastpos : Float32Array = vec3.clone(pos);

			while (Distance < MaxDistance)
			{

				vec3.add(pos, pos, Delta);

				Distance += Accuracy;

				b = Terrain.GetBlock(Math.round(pos[0]), Math.round(pos[1]), Math.round(pos[2]));

				if (b != Block.Air && b != null)
				{

					// break or place

					if (leftclick) Terrain.SetBlock(Math.round(pos[0]), Math.round(pos[1]), Math.round(pos[2]), Block.Air);
					else Terrain.SetBlock(Math.round(lastpos[0]), Math.round(lastpos[1]), Math.round(lastpos[2]), Camera.BlockPlace);

					return;

				}

				lastpos = vec3.clone(pos);

			}

		}

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
		mat4.fromTranslation(a, vec3.fromValues(-Camera.Position[0], -Camera.Position[1] - Camera.HeadOffset, -Camera.Position[2]));
		mat4.multiply(View, b, a);
		mat4.perspective(Projection, Math.PI / 2, canvas.width / canvas.height, 0.01, 1000.0);

		mat4.multiply(Camera.ViewProjection, Projection, View);

	}

	public static RenderCrosshair()
	{

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.ONE_MINUS_DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);

		Camera.CursorShader.Use();

		Camera.CursorShader.UniformInt("Texture", 0);
		Camera.CursorShader.UniformFloat("Scale", 0.02);
		Camera.CursorShader.UniformFloat("Aspect", canvas.width / canvas.height);

		Camera.CursorTexture.Use(0);

		Camera.CursorModel.Render(Camera.CursorShader);

		gl.disable(gl.BLEND);

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

enum Block
{

	Air,
	Stone,
	Dirt,
	Grass,
	WoodPlank,
	WoodLog,
	Leaves,
	Bricks,
	Bookshelf,
	Netherrack,
	DiamondBlock

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

	public Render(shad : Shader) : void
	{

		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);

		gl.enableVertexAttribArray(shad.PositionLocation);
		gl.vertexAttribPointer(shad.PositionLocation, 3, gl.FLOAT, false, 32, 0);

		gl.enableVertexAttribArray(shad.NormalLocation);
		gl.vertexAttribPointer(shad.NormalLocation, 3, gl.FLOAT, false, 32, 12);

		gl.enableVertexAttribArray(shad.UVLocation);
		gl.vertexAttribPointer(shad.UVLocation, 2, gl.FLOAT, false, 32, 24);

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
		image.src = "/../minecraft/texture/" + Name + ".png";

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