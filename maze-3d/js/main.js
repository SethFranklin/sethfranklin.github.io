/// <reference path = "gl-matrix.d.ts" />
var canvas;
var gl;
var Int;
var width = 10;
var height = 10;
var CielingHeight = 1;
var data = [];
var MazeModel;
var MainShader;
var MainTexture;
window.onload = function () {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
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
    MazeModel = new Model();
    MainShader = new Shader("main", ["Model", "ViewProjection", "Textures", "Camera", "LightScale"]);
    MainTexture = new Texture("walls", gl.REPEAT, gl.NEAREST);
    GenerateMaze();
    Camera.Generate();
    Input.Start();
    Camera.Position = vec3.fromValues(0, CielingHeight / 2, 0);
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
    // Render maze
    RenderMaze();
}
window.onunload = function () {
    MainTexture.Delete();
    MainShader.Delete();
    MazeModel.Delete();
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
};
window.onmousemove = function (Event) {
    Camera.MouseMove(Event);
};
function GenerateMaze() {
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            data[(height * x) + y] = false;
        }
    }
    for (var i = 0; i < width; i++) {
        data[(height * i)] = true;
        data[(height * i) + height - 1] = true;
    }
    for (var i = 0; i < height; i++) {
        data[i] = true;
        data[(height * (width - 1)) + i] = true;
    }
    data[(height * 2)] = false;
    data[(height * (width - 1) + height - 3)] = false;
    divide(0, 0, width - 1, height - 1, 50);
    genmesh();
}
function divide(x1, y1, x2, y2, iters) {
    var includeX = [];
    var includeY = [];
    for (var x = x1 + 2; x < x2 - 1; x++) {
        if (data[(height * x) + y1] && data[(height * x) + y2])
            includeX.push(x);
    }
    for (var y = y1 + 2; y < y2 - 1; y++) {
        if (data[(height * x1) + y] && data[(height * x2) + y])
            includeY.push(y);
    }
    var randomY;
    var randomX;
    if (includeX.length <= 0 && includeY.length <= 0)
        return; // exit
    if (includeY.length > 0) {
        randomY = includeY[Math.floor(Math.random() * includeY.length)];
        for (var x = x1 + 1; x < x2; x++) {
            data[(height * x) + randomY] = true;
        }
    }
    if (includeX.length > 0) {
        var randomX = includeX[Math.floor(Math.random() * includeX.length)];
        for (var y = y1 + 1; y < y2; y++) {
            data[(height * randomX) + y] = true;
        }
    }
    iters--;
    if (includeX.length > 0 && includeY.length > 0) {
        data[(height * randomX) + Math.floor(Math.random() * (randomY - y1 - 1)) + y1 + 1] = false;
        data[(height * randomX) + Math.floor(Math.random() * (y2 - randomY - 1)) + randomY + 1] = false;
        data[(height * (Math.floor(Math.random() * (randomX - x1 - 1)) + x1 + 1)) + randomY] = false;
        data[(height * (Math.floor(Math.random() * (x2 - randomX - 1)) + randomX + 1)) + randomY] = false;
        if (iters <= 0)
            return; // exit
        divide(x1, y1, randomX, randomY, iters);
        divide(randomX, y1, x2, randomY, iters);
        divide(x1, randomY, randomX, y2, iters);
        divide(randomX, randomY, x2, y2, iters);
    }
    else if (includeX.length > 0) // No more y split
     {
        data[(height * randomX) + Math.floor(Math.random() * (y2 - y1 - 1)) + y1 + 1] = false;
        if (iters <= 0)
            return; // exit
        divide(x1, y1, randomX, y2, iters);
        divide(randomX, y1, x2, y2, iters);
    }
    else // no more x split (includeY.length > 0)
     {
        data[(height * (Math.floor(Math.random() * (x2 - x1 - 1)) + x1 + 1)) + randomY] = false;
        if (iters <= 0)
            return; // exit
        divide(x1, y1, x2, randomY, iters);
        divide(x1, randomY, x2, y2, iters);
    }
}
function genmesh() {
    var Verticies = [];
    // Floor
    Verticies.push(0, 0, 0, 0, 1, 0, 0, 0);
    Verticies.push(width, 0, 0, 0, 1, 0, 0.25, 0);
    Verticies.push(width, 0, height, 0, 1, 0, 0.25, 0.25);
    Verticies.push(0, 0, height, 0, 1, 0, 0, 0.25);
    Verticies.push(width, 0, height, 0, 1, 0, 0.25, 0.25);
    Verticies.push(0, 0, 0, 0, 1, 0, 0, 0);
    // Cieling
    Verticies.push(0, CielingHeight, 0, 0, 1, 0, 0, 0);
    Verticies.push(width, CielingHeight, 0, 0, 1, 0, 0.25, 0);
    Verticies.push(width, CielingHeight, height, 0, 1, 0, 0.25, 0.25);
    Verticies.push(0, CielingHeight, height, 0, 1, 0, 0, 0.25);
    Verticies.push(width, CielingHeight, height, 0, 1, 0, 0.25, 0.25);
    Verticies.push(0, CielingHeight, 0, 0, 1, 0, 0, 0);
    // Walls
    for (var x = 0; x < width; x++) // switch dimensions from the generation part, made in different parts RIP xy to xz
     {
        for (var z = 0; z < height; z++) {
        }
    }
    MazeModel.UpdateMesh(Verticies);
}
function RenderMaze() {
    MainShader.Use();
    MainShader.UniformInt("Texture", 0);
    MainShader.UniformMat4("ViewProjection", Camera.ViewProjection);
    MainShader.UniformMat4("Model", mat4.create());
    MainShader.UniformFloat("LightScale", 1);
    MainShader.UniformVec3("Camera", Camera.Position);
    MainTexture.Use(0);
    MazeModel.Render();
}
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
    Camera.Speed = 1.0;
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
    Model.prototype.Render = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
        gl.enableVertexAttribArray(MainShader.PositionLocation);
        gl.vertexAttribPointer(MainShader.PositionLocation, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(MainShader.NormalLocation);
        gl.vertexAttribPointer(MainShader.NormalLocation, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(MainShader.UVLocation);
        gl.vertexAttribPointer(MainShader.UVLocation, 2, gl.FLOAT, false, 32, 24);
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
        image.src = "/../maze-3d/texture/" + Name + ".png";
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
