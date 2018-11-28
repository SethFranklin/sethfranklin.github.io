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
    Camera.Position = vec3.fromValues(75, 200, 110);
    Int = setInterval(Update, 16.666666667);
};
function Update() {
    // Update
    Camera.Update();
    // End of Update, render
    Input.PushBackInputs();
    Camera.CalculateMatrix();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    Terrain.Render();
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
window.onclick = function () {
    canvas.requestPointerLock();
    Camera.Click(false);
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
        if (x < 0 || y < 0 || z < 0 || x >= Terrain.XChunks * Chunk.XWidth || z >= Terrain.ZChunks * Chunk.ZWidth || z >= Chunk.Height)
            return null;
        else
            return Terrain.Chunks[Math.floor(x / Chunk.XWidth)][Math.floor(z / Chunk.ZWidth)].GetBlock(x % Chunk.XWidth, y, z % Chunk.ZWidth);
    };
    Terrain.SetBlock = function (x, y, z, b) {
        var cx = Math.floor(x / Chunk.XWidth); // chunk x
        var cz = Math.floor(z / Chunk.ZWidth);
        var ox = x % Chunk.XWidth;
        var oz = z % Chunk.ZWidth;
        Terrain.Chunks[cx][cz].SetBlock(ox, y, oz, b);
        Terrain.Chunks[cx][cz].UpdateMesh();
    };
    Terrain.XChunks = 10;
    Terrain.ZChunks = 10;
    return Terrain;
}());
var Chunk = /** @class */ (function () {
    function Chunk(newx, newz, Seed1) {
        this.XPosition = newx;
        this.ZPosition = newz;
        // Generate terrain
        this.Blocks = [];
        this.Blocks.length = Chunk.XWidth;
        var Seed = Seed1;
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
                //var h = Math.round(noise.perlin2((((Chunk.XWidth * context.XPosition) + x) / XBlocks), ((Chunk.ZWidth * context.ZPosition) * z) / ZBlocks) * 20) + 30;
                var h = 128 + Math.round(100 * (Math.cos(((Chunk.XWidth * context.XPosition) + x) / (Math.PI * Chunk.XWidth / 4))) * (Math.cos(((Chunk.ZWidth * context.ZPosition) + z) / (Math.PI * Chunk.ZWidth / 4))));
                GrassCount = 1;
                DirtCount = 5;
                while (h > 0) {
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
        // Initializing Meshes (will be generated later on)
        this.VBO = gl.createBuffer();
        this.ModelMatrix = mat4.create();
        mat4.fromTranslation(this.ModelMatrix, vec3.fromValues(this.XPosition * Chunk.XWidth, 0, this.ZPosition * Chunk.ZWidth));
        Chunk.TopTextures = new Dictionary();
        Chunk.TopTextures.Push(Block.Stone, 3);
        Chunk.TopTextures.Push(Block.Dirt, 2);
        Chunk.TopTextures.Push(Block.Grass, 0);
        Chunk.BottomTextures = new Dictionary();
        Chunk.BottomTextures.Push(Block.Stone, 3);
        Chunk.BottomTextures.Push(Block.Dirt, 2);
        Chunk.BottomTextures.Push(Block.Grass, 2);
        Chunk.SideTextures = new Dictionary();
        Chunk.SideTextures.Push(Block.Stone, 3);
        Chunk.SideTextures.Push(Block.Dirt, 2);
        Chunk.SideTextures.Push(Block.Grass, 1);
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
                        var UVOffsetTop = 0.25 * Chunk.TopTextures.Get(context.Blocks[x][y][z]);
                        var UVOffsetSide = 0.25 * Chunk.SideTextures.Get(context.Blocks[x][y][z]);
                        var UVOffsetBottom = 0.25 * Chunk.BottomTextures.Get(context.Blocks[x][y][z]);
                        if ((y + 1 < Chunk.Height && context.Blocks[x][y + 1][z] == Block.Air) || y == Chunk.Height - 1) // Top face +y
                         {
                            Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.25 + UVOffsetTop, 1.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.25 + UVOffsetTop, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 1.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.25 + UVOffsetTop, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 1.0, 0.0, 0.0 + UVOffsetTop, 1.0);
                        }
                        if ((y > 0 && context.Blocks[x][y - 1][z] == Block.Air) || y == 0) // Bottom face, -y
                         {
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.25 + UVOffsetBottom, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 1.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.25 + UVOffsetBottom, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.25 + UVOffsetBottom, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 0.0, -1.0, 0.0, 0.0 + UVOffsetBottom, 0.0);
                        }
                        if ((x + 1 < Chunk.XWidth && context.Blocks[x + 1][y][z] == Block.Air) || (x == Chunk.XWidth - 1 && (XPosChunk == null || XPosChunk.GetBlock(0, y, z) == Block.Air))) // +x face
                         {
                            Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.25 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.25 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.25 + UVOffsetSide, 1.0);
                        }
                        if ((x > 0 && context.Blocks[x - 1][y][z] == Block.Air) || (x == 0 && (XNegChunk == null || XNegChunk.GetBlock(Chunk.XWidth - 1, y, z) == Block.Air))) // -x face
                         {
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.25 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.25 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 1.0, 0.0, 0.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 1.0, 0.0, 0.0, 0.25 + UVOffsetSide, 1.0);
                        }
                        if ((z + 1 < Chunk.ZWidth && context.Blocks[x][y][z + 1] == Block.Air) || (z == Chunk.ZWidth - 1 && (ZPosChunk == null || ZPosChunk.GetBlock(x, y, 0) == Block.Air))) // +z face
                         {
                            Verticies.push(0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.25 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.25 + UVOffsetSide, 1.0);
                            Verticies.push(0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.25 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(-0.5 + x, -0.5 + y, 0.5 + z, 0.0, 0.0, 1.0, 0.0 + UVOffsetSide, 1.0);
                        }
                        if ((z > 0 && context.Blocks[x][y][z - 1] == Block.Air) || (z == 0 && (ZNegChunk == null || ZNegChunk.GetBlock(x, y, Chunk.ZWidth - 1) == Block.Air))) // -z face
                         {
                            Verticies.push(0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.25 + UVOffsetSide, 0.0);
                            Verticies.push(0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.0 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, -0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.25 + UVOffsetSide, 1.0);
                            Verticies.push(-0.5 + x, 0.5 + y, -0.5 + z, 0.0, 0.0, -1.0, 0.25 + UVOffsetSide, 0.0);
                        }
                    }
                }
            }
        }
        this.VertCount = Verticies.length / 8;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Verticies), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Chunk.prototype.GetBlock = function (x, y, z) {
        return this.Blocks[x][y][z];
    };
    Chunk.prototype.SetBlock = function (x, y, z, b) {
        this.Blocks[x][y][z] = b;
    };
    Chunk.prototype.Render = function () {
        Chunk.shader.UniformMat4("Model", this.ModelMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.enableVertexAttribArray(Chunk.shader.PositionLocation);
        gl.vertexAttribPointer(Chunk.shader.PositionLocation, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(Chunk.shader.NormalLocation);
        gl.vertexAttribPointer(Chunk.shader.NormalLocation, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(Chunk.shader.UVLocation);
        gl.vertexAttribPointer(Chunk.shader.UVLocation, 2, gl.FLOAT, false, 32, 24);
        gl.drawArrays(gl.TRIANGLES, 0, this.VertCount);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Chunk.prototype.Delete = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.deleteBuffer(this.VBO);
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
        this.Position = vec3.create();
        this.ViewProjection = mat4.create();
    };
    Camera.Update = function () {
        //while (Camera.Yaw > Camera.TwoPi) Camera.Yaw -= Camera.TwoPi;
        //while (Camera.Yaw < 0) Camera.Yaw += Camera.TwoPi;
        if (Camera.Pitch > Camera.PiOverTwo)
            Camera.Pitch = Camera.PiOverTwo;
        else if (Camera.Pitch < -Camera.PiOverTwo)
            Camera.Pitch = -Camera.PiOverTwo;
        if (Input.IsKeyDown(32))
            Camera.Position[1] += Camera.Speed * 0.0166667; // space key
        if (Input.IsKeyDown(16))
            Camera.Position[1] -= Camera.Speed * 0.0166667; // shift key
        var DeltaPosition = vec3.create();
        var Direction;
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
    };
    Camera.MouseMove = function (Event) {
        Camera.Yaw += Event.movementX / 1000.0;
        Camera.Pitch += Event.movementY / 1000.0;
    };
    Camera.Click = function (leftclick) {
        console.log("click");
        if (Terrain.GetBlock(Math.floor(Camera.Position[0]), Math.floor(Camera.Position[1]), Math.floor(Camera.Position[2])) == Block.Air) {
            var Accuracy = 0.1;
            var Delta = vec3.fromValues(0, 0, Accuracy);
            vec3.rotateY(Delta, Delta, vec3.fromValues(0, 0, 0), -Camera.Yaw + Math.PI);
            vec3.rotateX(Delta, Delta, vec3.fromValues(0, 0, 0), -Camera.Pitch);
            var MaxDistance = 10;
            var Distance = 0;
            var pos = vec3.clone(Camera.Position);
            var lastpos = vec3.clone(pos);
            console.log(Camera.Yaw / Math.PI);
            while (Distance < MaxDistance) {
                vec3.add(pos, pos, Delta);
                Distance += Accuracy;
                var b = Terrain.GetBlock(Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2]));
                if (b == null)
                    return;
                if (b != Block.Air) {
                    console.log("break/place");
                    // break or place
                    if (leftclick)
                        Terrain.SetBlock(Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2]), Block.Air);
                    else
                        Terrain.SetBlock(Math.floor(lastpos[0]), Math.floor(lastpos[1]), Math.floor(lastpos[2]), Block.Stone);
                    return;
                }
                lastpos = vec3.clone(pos);
            }
        }
    };
    Camera.Raycast = function () {
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
        mat4.fromTranslation(a, vec3.fromValues(-Camera.Position[0], -Camera.Position[1], -Camera.Position[2]));
        mat4.multiply(View, b, a);
        mat4.perspective(Projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 1000.0);
        mat4.multiply(Camera.ViewProjection, Projection, View);
    };
    Camera.Speed = 20.0;
    Camera.TwoPi = 2.0 * Math.PI;
    Camera.PiOverTwo = Math.PI / 2.0;
    Camera.Yaw = 3 * Math.PI / 4.0;
    Camera.Pitch = 0;
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
})(Block || (Block = {}));
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
        image.src = "/../texture/" + Name + ".png";
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
var Dictionary = /** @class */ (function () {
    function Dictionary() {
        this.Keys = [];
        this.Values = [];
    }
    Dictionary.prototype.Push = function (NewKey, NewValue) {
        this.Keys.push(NewKey);
        this.Values.push(NewValue);
    };
    Dictionary.prototype.Get = function (KeyToFind) {
        for (var i = 0; i < this.Keys.length; i++) {
            if (this.Keys[i] == KeyToFind)
                return this.Values[i];
        }
        return null;
    };
    Dictionary.prototype.GetValues = function () {
        return this.Values;
    };
    return Dictionary;
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
