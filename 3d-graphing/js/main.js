/// <reference path = "gl-matrix.d.ts" />
var canvas;
var gl;
var Int;
var MainGraph;
var CurveShader; // @TODO: assets class
var ArushiTexture;
var EquationText;
var Button;
window.onload = function () {
    EquationText = document.getElementById("equation");
    Button = document.getElementById("button");
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
    Camera.Generate();
    Input.Start();
    CurveShader = new Shader("curve", ["Model", "ViewProjection", "Texture"]);
    ArushiTexture = new Texture("Arushi", gl.REPEAT, gl.LINEAR);
    MainGraph = new Graph();
    MainGraph.AddCurve(new Curve("Math.sin(x) * Math.sin(y)"));
    Int = setInterval(Update, 16.666666667);
    Button.onclick = function () {
        MainGraph.Curves[0].ChangeCurve(EquationText.value);
    };
    canvas.onclick = function () {
        canvas.requestPointerLock();
    };
    canvas.onmousemove = function (Event) {
        Camera.MouseMove(Event);
    };
};
function Update() {
    // Update
    Camera.Update();
    // End of Update, render
    Input.PushBackInputs();
    Camera.CalculateMatrix();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    MainGraph.Render();
}
window.onunload = function () {
    MainGraph.Delete();
    CurveShader.Delete();
    ArushiTexture.Delete();
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
var Graph = /** @class */ (function () {
    function Graph() {
        this.Curves = [];
        this.XMin = -20;
        this.XMax = 20;
        this.XSub = 100; // subdivisions
        this.YMin = -20;
        this.YMax = 20;
        this.YSub = 100;
        this.ZScale = 10;
    }
    Graph.prototype.Render = function () {
        this.RenderAxis();
        CurveShader.Use();
        CurveShader.UniformInt("Texture", 0);
        CurveShader.UniformMat4("ViewProjection", Camera.ViewProjection);
        CurveShader.UniformMat4("Model", mat4.create());
        ArushiTexture.Use(0);
        for (var i = 0; i < this.Curves.length; i++) {
            this.Curves[i].Render();
        }
    };
    Graph.prototype.AddCurve = function (New) {
        New.ParentGraph = this;
        this.Curves.push(New);
        New.UpdateGeometry();
    };
    Graph.prototype.UpdateGeometry = function () {
        for (var i = 0; i < this.Curves.length; i++) {
            this.Curves[i].UpdateGeometry();
        }
    };
    Graph.prototype.Delete = function () {
        for (var i = 0; i < this.Curves.length; i++) {
            this.Curves[i].Delete();
        }
    };
    Graph.prototype.RenderAxis = function () {
    };
    return Graph;
}());
var Curve = /** @class */ (function () {
    function Curve(neweval) {
        this.EvalString = neweval;
        this.CurveModel = new Model();
    }
    Curve.prototype.Render = function () {
        this.CurveModel.Render();
    };
    Curve.prototype.ChangeCurve = function (neweval) {
        this.EvalString = neweval;
        this.UpdateGeometry();
    };
    Curve.prototype.UpdateGeometry = function () {
        var Verticies = [];
        var deltax = (this.ParentGraph.XMax - this.ParentGraph.XMin) / (this.ParentGraph.XSub + 1);
        var deltay = (this.ParentGraph.YMax - this.ParentGraph.YMin) / (this.ParentGraph.YSub + 1);
        var x;
        var y;
        var z;
        var Points = []; // value(x, y, z) at (xi * (this.ParentGraph.YSub + 2)) + yi
        for (var xi = 0; xi < this.ParentGraph.XSub + 2; xi++) {
            for (var yi = 0; yi < this.ParentGraph.YSub + 2; yi++) {
                x = this.ParentGraph.XMin + (deltax * xi);
                y = this.ParentGraph.YMin + (deltay * yi);
                z = eval(this.EvalString) * this.ParentGraph.ZScale;
                if (isNaN(z))
                    z = 0; // handling DNE, set to zero
                Points.push(x, y, eval(this.EvalString));
            }
        }
        var P1 = vec3.create();
        var P2 = vec3.create();
        var P3 = vec3.create();
        var P4 = vec3.create();
        var PM = vec3.create(); // mid point of four
        var CrossA1 = vec3.create(); // vectors used in cross product
        var CrossB1 = vec3.create();
        var CrossA2 = vec3.create();
        var CrossB2 = vec3.create();
        var CrossA3 = vec3.create();
        var CrossB3 = vec3.create();
        var CrossA4 = vec3.create();
        var CrossB4 = vec3.create();
        var index1;
        var index2;
        var index3;
        var index4;
        for (var xi = 0; xi < this.ParentGraph.XSub + 1; xi++) {
            for (var yi = 0; yi < this.ParentGraph.YSub + 1; yi++) {
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
                // Add four triangles (12 points in total) multiplied by two for back surfaces with negative normals
                // Front sides:
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
                // Back sides:
                Verticies.push(P1[0], P1[1], P1[2], -CrossA1[0], -CrossA1[1], -CrossA1[2], xi / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
                Verticies.push(PM[0], PM[1], PM[2], -CrossA1[0], -CrossA1[1], -CrossA1[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));
                Verticies.push(P2[0], P2[1], P2[2], -CrossA1[0], -CrossA1[1], -CrossA1[2], (xi + 1) / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
                // 24
                Verticies.push(P2[0], P2[1], P2[2], -CrossA2[0], -CrossA2[1], -CrossA2[2], (xi + 1) / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
                Verticies.push(PM[0], PM[1], PM[2], -CrossA2[0], -CrossA2[1], -CrossA2[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));
                Verticies.push(P4[0], P4[1], P4[2], -CrossA2[0], -CrossA2[1], -CrossA2[2], (xi + 1) / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
                // 31
                Verticies.push(P3[0], P3[1], P3[2], -CrossA3[0], -CrossA3[1], -CrossA3[2], xi / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
                Verticies.push(PM[0], PM[1], PM[2], -CrossA3[0], -CrossA3[1], -CrossA3[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));
                Verticies.push(P1[0], P1[1], P1[2], -CrossA3[0], -CrossA3[1], -CrossA3[2], xi / (this.ParentGraph.XSub + 1), yi / (this.ParentGraph.YSub + 1));
                // 43
                Verticies.push(P4[0], P4[1], P4[2], -CrossA4[0], -CrossA4[1], -CrossA4[2], (xi + 1) / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
                Verticies.push(PM[0], PM[1], PM[2], -CrossA4[0], -CrossA4[1], -CrossA4[2], (xi + 0.5) / (this.ParentGraph.XSub + 1), (yi + 0.5) / (this.ParentGraph.YSub + 1));
                Verticies.push(P3[0], P3[1], P3[2], -CrossA4[0], -CrossA4[1], -CrossA4[2], xi / (this.ParentGraph.XSub + 1), (yi + 1) / (this.ParentGraph.YSub + 1));
            }
        }
        this.CurveModel.UpdateMesh(Verticies);
    };
    Curve.prototype.Delete = function () {
        this.CurveModel.Delete();
    };
    return Curve;
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
        gl.enableVertexAttribArray(CurveShader.PositionLocation);
        gl.vertexAttribPointer(CurveShader.PositionLocation, 3, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(CurveShader.NormalLocation);
        gl.vertexAttribPointer(CurveShader.NormalLocation, 3, gl.FLOAT, false, 32, 12);
        gl.enableVertexAttribArray(CurveShader.UVLocation);
        gl.vertexAttribPointer(CurveShader.UVLocation, 2, gl.FLOAT, false, 32, 24);
        gl.drawArrays(gl.TRIANGLES, 0, this.VertCount);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    };
    Model.prototype.Delete = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.deleteBuffer(this.VBO);
    };
    return Model;
}());
var Camera = /** @class */ (function () {
    function Camera() {
    }
    Camera.Generate = function () {
        Camera.Position = vec3.create();
        Camera.ViewProjection = mat4.create();
    };
    Camera.Update = function () {
        //while (Camera.Yaw > Camera.TwoPi) Camera.Yaw -= Camera.TwoPi;
        //while (Camera.Yaw < 0) Camera.Yaw += Camera.TwoPi;
        //if (Camera.Pitch > Math.PI) Camera.Pitch = Math.PI;
        //else if (Camera.Pitch < Camera.TwoPi) Camera.Pitch = 0;
        if (Input.IsKeyDown(32))
            Camera.Position[2] += Camera.Speed * 0.0166667; // space key
        if (Input.IsKeyDown(16))
            Camera.Position[2] -= Camera.Speed * 0.0166667; // shift key
        var DeltaPosition = vec3.create();
        var Direction;
        if (Input.IsKeyDown(87)) // w key
         {
            Direction = vec3.fromValues(0, Camera.Speed * 0.0166667, 0);
            vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), Camera.Yaw);
            vec3.add(DeltaPosition, DeltaPosition, Direction);
        }
        if (Input.IsKeyDown(83)) // s key
         {
            Direction = vec3.fromValues(0, -Camera.Speed * 0.0166667, 0);
            vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), Camera.Yaw);
            vec3.add(DeltaPosition, DeltaPosition, Direction);
        }
        if (Input.IsKeyDown(68)) // d key
         {
            Direction = vec3.fromValues(-Camera.Speed * 0.0166667, 0, 0);
            vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), Camera.Yaw);
            vec3.add(DeltaPosition, DeltaPosition, Direction);
        }
        if (Input.IsKeyDown(65)) // a key
         {
            Direction = vec3.fromValues(Camera.Speed * 0.0166667, 0, 0);
            vec3.rotateZ(Direction, Direction, vec3.fromValues(0, 0, 0), Camera.Yaw);
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
        mat4.fromZRotation(b, Camera.Yaw);
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
    Camera.Yaw = 0;
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
        image.src = "/../3d-graphing/texture/" + Name + ".png";
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
