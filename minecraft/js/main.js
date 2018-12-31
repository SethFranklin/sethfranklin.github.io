/// <reference path = "gl-matrix.d.ts" />
var canvas;
var gl;
var Int;
window.onload = function () {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
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
    Camera.Position = vec3.fromValues(78.5, 139.6, 78.5);
    Int = setInterval(Update, 16.666666667);
};
function Update() {
    // Update
    Camera.Update();
    // End of Update, render
    Input.PushBackInputs();
    Camera.CalculateMatrix();
    gl.clearColor(150 / 255, 166 / 255, 1.0, 1.0); // #96A6FF minecraft sky
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    Terrain.Render();
    Camera.RenderCrosshair();
}
window.onunload = function () {
    Terrain.UnloadAssets();
};
window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};
window.onkeydown = function (Event) {
    Input.KeyDownEvent(Event.keyCode);
};
window.onkeyup = function (Event) {
    Input.KeyUpEvent(Event.keyCode);
};
window.onclick = function (Event) {
    canvas.requestPointerLock();
    Camera.Click(Event.which != 3);
};
window.onmousemove = function (Event) {
    Camera.MouseMove(Event);
};
var Terrain = /** @class */ (function () {
    function Terrain() {
    }
    Terrain.LoadAssets = function () {
        Chunk.LoadAssets();
    };
    Terrain.UnloadAssets = function () {
        Chunk.UnloadAssets();
        for (var x = 0; x < Terrain.XChunks; x++) {
            for (var z = 0; z < Terrain.ZChunks; z++) {
                Terrain.Chunks[x][z].Delete();
            }
        }
    };
    Terrain.Generate = function (Seed1, Seed2) {
        noise.seed(Seed1);
        Terrain.Chunks = [];
        Terrain.Chunks.length = Terrain.XChunks;
        for (var x = 0; x < Terrain.XChunks; x++) {
            Terrain.Chunks[x] = [];
            Terrain.Chunks[x].length = Terrain.ZChunks;
            for (var z = 0; z < Terrain.ZChunks; z++) {
                Terrain.Chunks[x][z] = new Chunk(x, z, Seed2);
            }
        }
        for (var i = 0; i < Terrain.Trees; i++) {
            var ix = Math.floor(Math.random() * Terrain.XChunks * Chunk.XWidth);
            var iz = Math.floor(Math.random() * Terrain.ZChunks * Chunk.ZWidth);
            var iy = -1;
            var p = 0;
            while (iy == -1) {
                if (Terrain.GetBlock(ix, p, iz) == Block.Air)
                    iy = p;
                p++;
                if (p >= Chunk.Height)
                    iy = 0; // shouldn't happen
            }
            var treeheight = 5 + Math.floor(Math.random() * 3);
            for (var y = 0; y < treeheight; y++) {
                for (var x = -2; x <= 2; x++) {
                    for (var z = -2; z <= 2; z++) {
                        if (x == 0 && z == 0) {
                            if (y != treeheight - 1)
                                Terrain.SetBlock(ix + x, iy + y, iz + z, Block.WoodLog);
                            else
                                Terrain.SetBlock(ix + x, iy + y, iz + z, Block.Leaves);
                        }
                        else {
                            if (y >= treeheight - 3) {
                                if (y == treeheight - 3)
                                    Terrain.SetBlock(ix + x, iy + y, iz + z, Block.Leaves);
                                else if (y == treeheight - 2)
                                    if (!(Math.abs(x) == 2 && Math.abs(z) == 2))
                                        Terrain.SetBlock(ix + x, iy + y, iz + z, Block.Leaves);
                                    else if (y == treeheight - 1 && ((x == 0 && Math.abs(z) == 1) || (z == 0 && Math.abs(x) == 1)))
                                        Terrain.SetBlock(ix + x, iy + y, iz + z, Block.Leaves);
                            }
                        }
                    }
                }
            }
        }
        for (var x = 0; x < Terrain.XChunks; x++) {
            for (var z = 0; z < Terrain.ZChunks; z++) {
                Terrain.Chunks[x][z].UpdateMesh();
            }
        }
    };
    Terrain.GetChunk = function (x, z) {
        if (x < 0 || z < 0 || x >= Terrain.XChunks || z > Terrain.ZChunks)
            return null;
        else
            return Terrain.Chunks[x][z];
    };
    Terrain.Render = function () {
        Chunk.shader.Use();
        Chunk.shader.UniformInt("Textures", 0);
        Chunk.shader.UniformMat4("ViewProjection", Camera.ViewProjection);
        Chunk.textures.Use(0);
        for (var x = 0; x < Terrain.XChunks; x++) {
            for (var z = 0; z < Terrain.ZChunks; z++) {
                Terrain.Chunks[x][z].Render();
            }
        }
    };
    Terrain.GetBlock = function (x, y, z) {
        if (x < 0 || y < 0 || z < 0 || x >= Terrain.XChunks * Chunk.XWidth || z >= Terrain.ZChunks * Chunk.ZWidth || y >= Chunk.Height)
            return null;
        else
            return Terrain.Chunks[Math.floor(x / Chunk.XWidth)][Math.floor(z / Chunk.ZWidth)].GetBlock(x % Chunk.XWidth, y, z % Chunk.ZWidth);
    };
    Terrain.SetBlock = function (x, y, z, b) {
        if (x < 0 || y < 0 || z < 0 || x >= Terrain.XChunks * Chunk.XWidth || z >= Terrain.ZChunks * Chunk.ZWidth || y >= Chunk.Height)
            return;
        var cx = Math.floor(x / Chunk.XWidth); // chunk x
        var cz = Math.floor(z / Chunk.ZWidth);
        var ox = x % Chunk.XWidth; // block x
        var oz = z % Chunk.ZWidth;
        Terrain.Chunks[cx][cz].SetBlock(ox, y, oz, b);
        Terrain.Chunks[cx][cz].UpdateMesh();
        if (cx != 0 && ox == 0)
            Terrain.Chunks[cx - 1][cz].UpdateMesh();
        if (cx != Terrain.XChunks - 1 && ox == Chunk.XWidth - 1)
            Terrain.Chunks[cx + 1][cz].UpdateMesh();
        if (cz != 0 && oz == 0)
            Terrain.Chunks[cx][cz - 1].UpdateMesh();
        if (cz != Terrain.ZChunks - 1 && oz == Chunk.ZWidth - 1)
            Terrain.Chunks[cx][cz + 1].UpdateMesh();
    };
    Terrain.XChunks = 10;
    Terrain.ZChunks = 10;
    Terrain.Trees = 10;
    return Terrain;
}());
var Chunk = /** @class */ (function () {
    function Chunk(newx, newz, Seed1) {
        this.XPosition = newx;
        this.ZPosition = newz;
        // Generate terrain
        this.Blocks = [];
        this.Blocks.length = Chunk.XWidth;
        var context = this;
        for (var x = 0; x < Chunk.XWidth; x++) // Initializing blocks
         {
            context.Blocks[x] = [];
            context.Blocks[x].length = Chunk.Height;
            for (var y = 0; y < Chunk.Height; y++) {
                context.Blocks[x][y] = [];
                context.Blocks[x][y].length = Chunk.ZWidth;
                for (var z = 0; z < Chunk.ZWidth; z++) {
                    context.Blocks[x][y][z] = Block.Air; // Fills everything with air
                }
            }
        }
        // Terrain Generation
        var GrassCount; // Layers of soil
        var DirtCount;
        var XBlocks = Chunk.XWidth * Terrain.XChunks;
        var ZBlocks = Chunk.ZWidth * Terrain.ZChunks;
        for (var x = 0; x < Chunk.XWidth; x++) {
            for (var z = 0; z < Chunk.ZWidth; z++) {
                var h = Math.round((noise.simplex2((((Chunk.XWidth * context.XPosition) + x) * 2 / XBlocks), ((Chunk.ZWidth * context.ZPosition) + z) * 2 / ZBlocks)) * 10) + 120;
                //var h = 128 + Math.round(10 * (Math.cos(((Chunk.XWidth * context.XPosition) + x) / (Math.PI * Chunk.XWidth / 4))) * (Math.cos(((Chunk.ZWidth * context.ZPosition) + z) / (Math.PI * Chunk.ZWidth / 4))));
                GrassCount = 1;
                DirtCount = 5;
                while (h >= 0) {
                    if (GrassCount > 0) {
                        context.Blocks[x][h][z] = Block.Grass;
                        GrassCount--;
                    }
                    else if (DirtCount > 0) {
                        context.Blocks[x][h][z] = Block.Dirt;
                        DirtCount--;
                    }
                    else
                        context.Blocks[x][h][z] = Block.Stone;
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
    Chunk.LoadAssets = function () {
        Chunk.shader = new Shader("terrain", ["Model", "ViewProjection", "Textures"]);
        Chunk.textures = new Texture("terrain", gl.REPEAT, gl.NEAREST);
    };
    Chunk.UnloadAssets = function () {
        Chunk.shader.Delete();
        Chunk.textures.Delete();
    };
    Chunk.prototype.UpdateMesh = function () {
        var context = this;
        var Verticies = [];
        var XPosChunk = Terrain.GetChunk(this.XPosition + 1, this.ZPosition); // The four neighboor chunks
        var XNegChunk = Terrain.GetChunk(this.XPosition - 1, this.ZPosition); // how do you spell neighboor, is that right?
        var ZPosChunk = Terrain.GetChunk(this.XPosition, this.ZPosition + 1);
        var ZNegChunk = Terrain.GetChunk(this.XPosition, this.ZPosition - 1);
        for (var x = 0; x < Chunk.XWidth; x++) {
            for (var y = 0; y < Chunk.Height; y++) {
                for (var z = 0; z < Chunk.ZWidth; z++) {
                    if (context.Blocks[x][y][z] != Block.Air) // If there's a block there, generate verticies
                     {
                        var UVOffsetTop = 0.0625 * Chunk.TopTextures[context.Blocks[x][y][z]];
                        var UVOffsetSide = 0.0625 * Chunk.SideTextures[context.Blocks[x][y][z]];
                        var UVOffsetBottom = 0.0625 * Chunk.BottomTextures[context.Blocks[x][y][z]];
                        if ((y + 1 < Chunk.Height && context.Blocks[x][y + 1][z] == Block.Air) || y == Chunk.Height - 1) // Top face +y
                         {
                            Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.0625 + UVOffsetTop, 1.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.0625 + UVOffsetTop, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 1.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.0625 + UVOffsetTop, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 1.0);
                        }
                        if ((y > 0 && context.Blocks[x][y - 1][z] == Block.Air) || y == 0) // Bottom face, -y
                         {
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.0625 + UVOffsetBottom, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 1.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.0625 + UVOffsetBottom, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.0625 + UVOffsetBottom, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 0.0);
                        }
                        if ((x + 1 < Chunk.XWidth && context.Blocks[x + 1][y][z] == Block.Air) || (x == Chunk.XWidth - 1 && (XPosChunk == null || XPosChunk.GetBlock(0, y, z) == Block.Air))) // +x face
                         {
                            Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 1.0);
                        }
                        if ((x > 0 && context.Blocks[x - 1][y][z] == Block.Air) || (x == 0 && (XNegChunk == null || XNegChunk.GetBlock(Chunk.XWidth - 1, y, z) == Block.Air))) // -x face
                         {
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0625 + UVOffsetSide, 1.0);
                        }
                        if ((z + 1 < Chunk.ZWidth && context.Blocks[x][y][z + 1] == Block.Air) || (z == Chunk.ZWidth - 1 && (ZPosChunk == null || ZPosChunk.GetBlock(x, y, 0) == Block.Air))) // +z face
                         {
                            Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0625 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0625 + UVOffsetSide, 1.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0625 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 1.0);
                        }
                        if ((z > 0 && context.Blocks[x][y][z - 1] == Block.Air) || (z == 0 && (ZNegChunk == null || ZNegChunk.GetBlock(x, y, Chunk.ZWidth - 1) == Block.Air))) // -z face
                         {
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0625 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0625 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0625 + UVOffsetSide, 0.0);
                        }
                    }
                }
            }
        }
        this.TerrainModel.UpdateMesh(Verticies);
    };
    Chunk.prototype.GetBlock = function (x, y, z) {
        return this.Blocks[x][y][z];
    };
    Chunk.prototype.SetBlock = function (x, y, z, b) {
        this.Blocks[x][y][z] = b;
    };
    Chunk.prototype.Render = function () {
        Chunk.shader.UniformMat4("Model", this.ModelMatrix);
        this.TerrainModel.Render(Chunk.shader);
    };
    Chunk.prototype.Delete = function () {
        this.TerrainModel.Delete();
    };
    Chunk.XWidth = 16; // X and Z are horizontal axis, Y is vertical
    Chunk.ZWidth = 16;
    Chunk.Height = 256;
    return Chunk;
}());
var Camera = /** @class */ (function () {
    function Camera() {
    }
    Camera.Generate = function () {
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
    };
    Camera.Update = function () {
        var iters;
        if (Input.IsKeyPressed(17))
            Camera.Sprinting = !Camera.Sprinting;
        if (Camera.Pitch > Camera.PiOverTwo)
            Camera.Pitch = Camera.PiOverTwo;
        else if (Camera.Pitch < -Camera.PiOverTwo)
            Camera.Pitch = -Camera.PiOverTwo;
        if (Input.IsKeyDown(48))
            Camera.BlockPlace = Camera.BlockHand[9];
        for (var i = 49; i <= 57; i++) {
            if (Input.IsKeyDown(i))
                Camera.BlockPlace = Camera.BlockHand[i - 49];
        }
        Camera.FlyTimer -= Camera.DeltaTime;
        Camera.OldPosition = vec3.clone(Camera.Position);
        Camera.Acceleration = vec3.fromValues(0, 0, 0);
        if (Input.IsKeyPressed(32)) {
            if (Camera.FlyTimer > 0) {
                Camera.Flying = !Camera.Flying;
                Camera.FlyTimer = -1;
                Camera.Grounded = false;
            }
            else {
                Camera.FlyTimer = Camera.FlyWindow;
            }
            if (Camera.Grounded)
                Camera.Acceleration[1] += Camera.JumpStrength;
        }
        if (Camera.Flying) {
            if (Input.IsKeyDown(32))
                Camera.Acceleration[1] += Camera.SprintWalkAccel;
            if (Input.IsKeyDown(16))
                Camera.Acceleration[1] -= Camera.SprintWalkAccel;
        }
        else
            Camera.Acceleration[1] -= Camera.Gravity;
        var HorizontalAccel = vec3.fromValues(0, 0, 0);
        var Direction;
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
        var inter = vec3.create();
        vec3.normalize(HorizontalAccel, HorizontalAccel);
        if (Camera.Sprinting)
            vec3.scale(HorizontalAccel, HorizontalAccel, Camera.SprintWalkAccel);
        else
            vec3.scale(HorizontalAccel, HorizontalAccel, Camera.WalkAccel);
        vec3.scale(inter, Camera.Velocity, -Camera.Resistance);
        vec3.add(HorizontalAccel, HorizontalAccel, inter);
        if (!Camera.Flying)
            HorizontalAccel[1] = 0;
        vec3.add(Camera.Acceleration, Camera.Acceleration, HorizontalAccel);
        vec3.scale(inter, Camera.Acceleration, Camera.DeltaTime);
        vec3.add(Camera.Velocity, Camera.Velocity, inter);
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
        if (Camera.Collision(bx, tx, by, ty, bz, tz)) {
            if (Camera.Velocity[0] > 0) {
                dd = -1;
                Camera.Position[0] = Math.round(Camera.Position[0] + (Camera.HitboxWidth / 2)) - ((Camera.HitboxWidth + 1) / 2) - Camera.Rounding;
                Camera.Sprinting = false;
            }
            else {
                dd = 1;
                Camera.Position[0] = Math.round(Camera.Position[0] - (Camera.HitboxWidth / 2)) + ((Camera.HitboxWidth + 1) / 2) + Camera.Rounding;
                Camera.Sprinting = false;
            }
            bx = Math.max(0, Math.round(Camera.Position[0] - (Camera.HitboxWidth / 2)));
            tx = Math.min((Terrain.XChunks * Chunk.XWidth) - 1, Math.round(Camera.Position[0] + (Camera.HitboxWidth / 2)));
            loop = Camera.Collision(bx, tx, by, ty, bz, tz);
            iters = Camera.MaxIters - 2;
            while (loop && iters > 0) {
                Camera.Position[0] += dd;
                bx += dd;
                tx += dd;
                loop = Camera.Collision(bx, tx, by, ty, bz, tz);
                iters--;
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
        if (Camera.Collision(bx, tx, by, ty, bz, tz)) {
            if (Camera.Velocity[1] > 0) {
                dd = -1;
                Camera.Position[1] = Math.round(Camera.Position[1] + (Camera.HitboxHeight / 2)) - ((Camera.HitboxHeight + 1) / 2) - Camera.Rounding;
            }
            else {
                dd = 1;
                Camera.Position[1] = Math.round(Camera.Position[1] - (Camera.HitboxHeight / 2)) + ((Camera.HitboxHeight + 1) / 2) + Camera.Rounding;
                Camera.Grounded = true;
                Camera.Flying = false;
            }
            by = Math.max(0, Math.round(Camera.Position[1] - (Camera.HitboxHeight / 2)));
            ty = Math.min(Chunk.Height - 1, Math.round(Camera.Position[1] + (Camera.HitboxHeight / 2)));
            loop = Camera.Collision(bx, tx, by, ty, bz, tz);
            iters = Camera.MaxIters - 2;
            while (loop && iters > 0) {
                Camera.Position[1] += dd;
                by += dd;
                ty += dd;
                loop = Camera.Collision(bx, tx, by, ty, bz, tz);
                iters--;
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
        if (Camera.Collision(bx, tx, by, ty, bz, tz)) {
            if (Camera.Velocity[2] > 0) {
                dd = -1;
                Camera.Position[2] = Math.round(Camera.Position[2] + (Camera.HitboxWidth / 2)) - ((Camera.HitboxWidth + 1) / 2) - Camera.Rounding;
                Camera.Sprinting = false;
            }
            else {
                dd = 1;
                Camera.Position[2] = Math.round(Camera.Position[2] - (Camera.HitboxWidth / 2)) + ((Camera.HitboxWidth + 1) / 2) + Camera.Rounding;
                Camera.Sprinting = false;
            }
            bz = Math.max(0, Math.round(Camera.Position[2] - (Camera.HitboxWidth / 2)));
            tz = Math.min((Terrain.ZChunks * Chunk.ZWidth) - 1, Math.round(Camera.Position[2] + (Camera.HitboxWidth / 2)));
            loop = Camera.Collision(bx, tx, by, ty, bz, tz);
            iters = Camera.MaxIters - 2;
            while (loop && iters > 0) {
                Camera.Position[2] += dd;
                bz += dd;
                tz += dd;
                loop = Camera.Collision(bx, tx, by, ty, bz, tz);
                iters--;
            }
            Camera.Velocity[2] = 0;
        }
        if (Camera.Sprinting)
            Camera.CurrentFOV = Math.min(Camera.FOV + Camera.SprintFOVInc, Camera.CurrentFOV + (Camera.DeltaTime * Camera.FOVInterpolateRate));
        else
            Camera.CurrentFOV = Math.max(Camera.FOV, Camera.CurrentFOV - (Camera.DeltaTime * Camera.FOVInterpolateRate));
    };
    Camera.Collision = function (x0, x1, y0, y1, z0, z1) {
        for (var ix = x0; ix <= x1; ix++) {
            for (var iy = y0; iy <= y1; iy++) {
                for (var iz = z0; iz <= z1; iz++) {
                    if (Terrain.GetBlock(ix, iy, iz) != Block.Air)
                        return true;
                }
            }
        }
        return false;
    };
    Camera.MouseMove = function (Event) {
        Camera.Yaw += Event.movementX / 1000.0;
        Camera.Pitch += Event.movementY / 1000.0;
    };
    Camera.Click = function (leftclick) {
        var b = Terrain.GetBlock(Math.round(Camera.Position[0]), Math.round(Camera.Position[1] + Camera.HeadOffset), Math.round(Camera.Position[2]));
        if (b == Block.Air || b == null) {
            var Accuracy = 0.1;
            var Delta = vec3.fromValues(0, 0, Accuracy);
            vec3.rotateX(Delta, Delta, vec3.fromValues(0, 0, 0), Camera.Pitch);
            vec3.rotateY(Delta, Delta, vec3.fromValues(0, 0, 0), -Camera.Yaw + Math.PI);
            var MaxDistance = 10;
            var Distance = 0;
            var pos = vec3.fromValues(Camera.Position[0], Camera.Position[1] + Camera.HeadOffset, Camera.Position[2]);
            var lastpos = vec3.clone(pos);
            while (Distance < MaxDistance) {
                vec3.add(pos, pos, Delta);
                Distance += Accuracy;
                b = Terrain.GetBlock(Math.round(pos[0]), Math.round(pos[1]), Math.round(pos[2]));
                if (b != Block.Air && b != null) {
                    // break or place
                    if (leftclick)
                        Terrain.SetBlock(Math.round(pos[0]), Math.round(pos[1]), Math.round(pos[2]), Block.Air);
                    else {
                        var u = Math.round(lastpos[0]);
                        var v = Math.round(lastpos[1]);
                        var w = Math.round(lastpos[2]);
                        var bx, tx, by, ty, bz, tz;
                        bx = Math.max(0, Math.round(Camera.Position[0] - (Camera.HitboxWidth / 2)));
                        tx = Math.min((Terrain.XChunks * Chunk.XWidth) - 1, Math.round(Camera.Position[0] + (Camera.HitboxWidth / 2)));
                        by = Math.max(0, Math.round(Camera.Position[1] - (Camera.HitboxHeight / 2)));
                        ty = Math.min(Chunk.Height - 1, Math.round(Camera.Position[1] + (Camera.HitboxHeight / 2)));
                        bz = Math.max(0, Math.round(Camera.Position[2] - (Camera.HitboxWidth / 2)));
                        tz = Math.min((Terrain.ZChunks * Chunk.ZWidth) - 1, Math.round(Camera.Position[2] + (Camera.HitboxWidth / 2)));
                        if (!(u >= bx && u <= tx && v >= by && v <= ty && w >= bz && w <= tz))
                            Terrain.SetBlock(u, v, w, Camera.BlockPlace);
                    }
                    return;
                }
                lastpos = vec3.clone(pos);
            }
        }
    };
    Camera.CalculateMatrix = function () {
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
        mat4.perspective(Projection, Camera.CurrentFOV, canvas.width / canvas.height, 0.01, 1000.0);
        mat4.multiply(Camera.ViewProjection, Projection, View);
    };
    Camera.RenderCrosshair = function () {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE_MINUS_DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
        Camera.CursorShader.Use();
        Camera.CursorShader.UniformInt("Texture", 0);
        Camera.CursorShader.UniformFloat("Scale", 0.02);
        Camera.CursorShader.UniformFloat("Aspect", canvas.width / canvas.height);
        Camera.CursorTexture.Use(0);
        Camera.CursorModel.Render(Camera.CursorShader);
        gl.disable(gl.BLEND);
    };
    Camera.TwoPi = 2.0 * Math.PI;
    Camera.PiOverTwo = Math.PI / 2.0;
    Camera.MaxSpeed = 5;
    Camera.WalkAccel = 20;
    Camera.JumpStrength = 400;
    Camera.Gravity = 15;
    Camera.Resistance = 5;
    Camera.Grounded = false;
    Camera.Flying = false;
    Camera.FlyTimer = -1;
    Camera.FlyWindow = 0.4;
    Camera.Sprinting = false;
    Camera.SprintWalkAccel = 40;
    Camera.FOV = Math.PI / 2;
    Camera.CurrentFOV = Math.PI / 2;
    Camera.SprintFOVInc = Math.PI / 8;
    Camera.FOVInterpolateRate = 2;
    Camera.HitboxHeight = 1.8;
    Camera.HitboxWidth = 0.6;
    Camera.Rounding = 0.0001;
    Camera.MaxIters = 20;
    Camera.HeadOffset = 0.6;
    Camera.Yaw = 3 * Math.PI / 4.0;
    Camera.Pitch = 0;
    Camera.DeltaTime = 0.0166666667;
    Camera.CursorData = [
        -1, -1, -1, 0, 0, 0, 0, 0,
        1, -1, -1, 0, 0, 0, 1, 0,
        1, 1, -1, 0, 0, 0, 1, 1,
        1, 1, -1, 0, 0, 0, 1, 1,
        -1, 1, -1, 0, 0, 0, 0, 1,
        -1, -1, -1, 0, 0, 0, 0, 0,
    ];
    return Camera;
}());
var Input = /** @class */ (function () {
    function Input() {
    }
    Input.Start = function () {
        Input.DownNow.length = 256; // 256 different keycodes
        Input.DownBefore.length = 256;
        for (var i = 0; i < 256; i++) // Fils it with false statements
         {
            Input.DownNow[i] = false;
            Input.DownBefore[i] = false;
        }
    };
    Input.PushBackInputs = function () {
        Input.DownBefore = Input.DownNow.slice(0);
    };
    Input.IsKeyDown = function (Key) {
        return (Input.DownNow[Key]);
    };
    Input.IsKeyPressed = function (Key) {
        return (Input.DownNow[Key] && !Input.DownBefore[Key]);
    };
    Input.IsKeyReleased = function (Key) {
        return (!Input.DownNow[Key] && Input.DownBefore[Key]);
    };
    Input.KeyUpEvent = function (Key) {
        Input.DownNow[Key] = false;
    };
    Input.KeyDownEvent = function (Key) {
        Input.DownNow[Key] = true;
    };
    Input.DownNow = [];
    Input.DownBefore = [];
    return Input;
}());
var Block;
(function (Block) {
    Block[Block["Air"] = 0] = "Air";
    Block[Block["Stone"] = 1] = "Stone";
    Block[Block["Dirt"] = 2] = "Dirt";
    Block[Block["Grass"] = 3] = "Grass";
    Block[Block["WoodPlank"] = 4] = "WoodPlank";
    Block[Block["WoodLog"] = 5] = "WoodLog";
    Block[Block["Leaves"] = 6] = "Leaves";
    Block[Block["Bricks"] = 7] = "Bricks";
    Block[Block["Bookshelf"] = 8] = "Bookshelf";
    Block[Block["Netherrack"] = 9] = "Netherrack";
    Block[Block["DiamondBlock"] = 10] = "DiamondBlock";
})(Block || (Block = {}));
var Model // Doesn't do model matrix: Chunk.shader.UniformMat4("Model", this.ModelMatrix);
 = /** @class */ (function () {
    function Model() {
        this.VBO = gl.createBuffer();
    }
    Model.prototype.UpdateMesh = function (Verticies) {
        this.VertCount = Verticies.length / 8;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Verticies), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Model.prototype.Render = function (shad) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.enableVertexAttribArray(shad.PositionLocation);
        gl.vertexAttribPointer(shad.PositionLocation, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(shad.NormalLocation);
        gl.vertexAttribPointer(shad.NormalLocation, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(shad.UVLocation);
        gl.vertexAttribPointer(shad.UVLocation, 2, gl.FLOAT, false, 32, 24);
        gl.drawArrays(gl.TRIANGLES, 0, this.VertCount);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Model.prototype.Delete = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.deleteBuffer(this.VBO);
    };
    return Model;
}());
var Shader = /** @class */ (function () {
    function Shader(Name, UniformList) {
        this.UniformMap = {};
        var context = this;
        HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".vert").then(function (VertexSource) {
            HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".frag").then(function (FragmentSource) {
                var VertexShader = gl.createShader(gl.VERTEX_SHADER);
                var FragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(VertexShader, VertexSource);
                gl.shaderSource(FragmentShader, FragmentSource);
                gl.compileShader(VertexShader);
                gl.compileShader(FragmentShader);
                var VertTest = gl.getShaderParameter(VertexShader, gl.COMPILE_STATUS);
                var FragTest = gl.getShaderParameter(FragmentShader, gl.COMPILE_STATUS);
                if (!VertTest) {
                    console.log("Vertex Shader (" + Name + ".vert) Compile Error:\n" + gl.getShaderInfoLog(VertexShader));
                }
                if (!FragTest) {
                    console.log("Fragment Shader (" + Name + ".frag) Compile Error:\n" + gl.getShaderInfoLog(FragmentShader));
                }
                var ShaderProgram = gl.createProgram();
                gl.attachShader(ShaderProgram, VertexShader);
                gl.attachShader(ShaderProgram, FragmentShader);
                gl.linkProgram(ShaderProgram);
                var ProgramTest = gl.getProgramParameter(ShaderProgram, gl.LINK_STATUS);
                if (!ProgramTest) {
                    console.log("Shader Program (" + Name + ") Compile Error:\n" + gl.getProgramInfoLog(ShaderProgram));
                }
                context.PositionLocation = gl.getAttribLocation(ShaderProgram, "Position");
                context.NormalLocation = gl.getAttribLocation(ShaderProgram, "Normal");
                context.UVLocation = gl.getAttribLocation(ShaderProgram, "UV");
                context.UniformMap = {};
                for (var Uniform = 0; Uniform < UniformList.length; Uniform++) {
                    context.UniformMap[UniformList[Uniform]] = gl.getUniformLocation(ShaderProgram, UniformList[Uniform]);
                }
                gl.deleteShader(VertexShader);
                gl.deleteShader(FragmentShader);
                context.ID = ShaderProgram;
            }, function (Reject) {
                console.log(Reject);
            });
        }, function (Reject) {
            console.log(Reject);
        });
    }
    Shader.prototype.Use = function () {
        gl.useProgram(this.ID);
    };
    Shader.prototype.Delete = function () {
        gl.deleteProgram(this.ID);
    };
    Shader.prototype.UniformFloat = function (Name, Value) {
        gl.uniform1f(this.UniformMap[Name], Value);
    };
    Shader.prototype.UniformInt = function (Name, Value) {
        gl.uniform1i(this.UniformMap[Name], Value);
    };
    Shader.prototype.UniformVec3 = function (Name, Value) {
        gl.uniform3f(this.UniformMap[Name], Value[0], Value[1], Value[2]);
    };
    Shader.prototype.UniformVec2 = function (Name, Value) {
        gl.uniform2f(this.UniformMap[Name], Value[0], Value[1]);
    };
    Shader.prototype.UniformMat4 = function (Name, Value) {
        gl.uniformMatrix4fv(this.UniformMap[Name], false, Value);
    };
    return Shader;
}());
var Texture = /** @class */ (function () {
    function Texture(Name, NewWrap, NewFilter) {
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
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, context.ID);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            if (Texture.PowerOfTwo(image.width) && Texture.PowerOfTwo(image.height)) {
                gl.generateMipmap(gl.TEXTURE_2D);
            }
        };
    }
    Texture.prototype.Use = function (Location) {
        gl.activeTexture(gl.TEXTURE0 + Location);
        gl.bindTexture(gl.TEXTURE_2D, this.ID);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.WrapMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.WrapMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.FilterMode);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.FilterMode);
    };
    Texture.prototype.Delete = function () {
        gl.deleteTexture(this.ID);
    };
    Texture.PowerOfTwo = function (a) {
        return (a & (a - 1)) == 0;
    };
    return Texture;
}());
function HTTPRequest(RequestType, URL) {
    return new Promise(function (Resolve, Reject) {
        var XMLHTTP = new XMLHttpRequest();
        XMLHTTP.open(RequestType, URL);
        switch (RequestType) {
            case "GET":
                XMLHTTP.send();
                break;
        }
        XMLHTTP.onload = function () {
            if (XMLHTTP.status == 200)
                Resolve(XMLHTTP.response);
            else
                Reject(XMLHTTP.statusText);
        };
    });
}
