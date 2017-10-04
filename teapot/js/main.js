/// <reference path = "gl-matrix.d.ts" />
var canvas;
var gl;
var Int;
var Octa;
var Teapot;
var Simple;
var Music;
var Shapes = [];
window.onload = function () {
    canvas = document.getElementById("canvas"); // <T> is for type conversions
    gl = canvas.getContext("webgl");
    if (!gl) {
        alert("Your browser doesn't support WebGL");
        return;
    }
    gl.enable(gl.DEPTH_TEST);
    Simple = new Shader("simple", ["Model", "View", "Projection", "Color", "Light", "ViewPosition"]);
    Octa = new Mesh("octahedron");
    Teapot = new Mesh("teapot");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < 10; i++) {
        var a = hslToRgb(i / 10.0, 0.5, 0.5);
        if (i % 2 == 0)
            Shapes.push(new Shape(new Float32Array([2.0 * i, 0.0, 0.0]), new Float32Array([a[0], a[1], a[2]]), new Float32Array([1.0, 1.0, 1.0]), Octa));
        else
            Shapes.push(new Shape(new Float32Array([2.0 * i, 0.0, 0.0]), new Float32Array([a[0], a[1], a[2]]), new Float32Array([0.5, 0.5, 0.5]), Teapot));
    }
    Music = new Audio("../teapot/audio/music.mp3");
    Music.play();
    Int = setInterval(Update, 0.0166667);
};
function hslToRgb(h, s, l) {
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    }
    else {
        var hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0)
                t += 1;
            if (t > 1)
                t -= 1;
            if (t < 1 / 6)
                return p + (q - p) * 6 * t;
            if (t < 1 / 2)
                return q;
            if (t < 2 / 3)
                return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b];
}
var Timer = 0;
function Update() {
    for (var i = 0; i < Shapes.length; i++)
        Shapes[i].Update(0.0166667);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    for (var i = 0; i < Shapes.length; i++)
        Shapes[i].Render();
}
window.onunload = function () {
    Octa.Delete();
    Simple.Delete();
};
window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};
var Shape = (function () {
    function Shape(npos, ncol, nscale, nmodel) {
        this.Model = nmodel;
        this.Position = npos;
        this.Rotation = vec2.create();
        this.Axis = vec3.fromValues(Math.random(), Math.random(), Math.random());
        this.Color = ncol;
        this.Timer = 0.0;
        this.Scale = nscale;
    }
    Shape.prototype.Update = function (DeltaTime) {
        this.Timer += DeltaTime;
    };
    Shape.prototype.Render = function () {
        var a = mat4.create();
        var b = mat4.create();
        var c = mat4.create();
        var model = mat4.create();
        var view = mat4.create();
        var proj = mat4.create();
        Timer += 0.00666667;
        mat4.fromTranslation(a, this.Position);
        mat4.fromRotation(b, this.Timer, this.Axis);
        mat4.fromScaling(c, this.Scale);
        mat4.multiply(model, a, c);
        mat4.multiply(model, model, b);
        mat4.fromTranslation(view, new Float32Array([-9.0, 0.0, -15.0]));
        mat4.perspective(proj, Math.PI / 4.0, canvas.width / canvas.height, 0.1, 100.0);
        Simple.Use();
        Simple.UniformVec3("Color", this.Color);
        Simple.UniformVec3("Light", new Float32Array([1.0, 0.0, 2.0]));
        Simple.UniformVec3("ViewPosition", new Float32Array([9.0, 0.0, -15.0]));
        Simple.UniformMat4("Model", model);
        Simple.UniformMat4("View", view);
        Simple.UniformMat4("Projection", proj);
        this.Model.Render(Simple.PositionLocation, Simple.NormalLocation);
    };
    return Shape;
}());
var Mesh = (function () {
    function Mesh(Name) {
        var context = this;
        HTTPRequest("GET", window.location.href + "/../obj/" + Name + ".obj").then(function (MeshData) {
            context.mesh = new OBJ.Mesh(MeshData);
            OBJ.initMeshBuffers(gl, context.mesh);
        }, function (Reject) {
            console.log(Reject);
        });
    }
    Mesh.prototype.Render = function (Position, Normal) {
        gl.enableVertexAttribArray(Position);
        gl.enableVertexAttribArray(Normal);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
        gl.vertexAttribPointer(Position, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
        gl.vertexAttribPointer(Normal, this.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    };
    Mesh.prototype.Delete = function () {
        OBJ.deleteMeshBuffers(gl, this.mesh);
    };
    return Mesh;
}());
var Shader = (function () {
    function Shader(Name, UniformList) {
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
                context.UniformMap = new Dictionary();
                for (var Uniform = 0; Uniform < UniformList.length; Uniform++) {
                    context.UniformMap.Push(UniformList[Uniform], gl.getUniformLocation(ShaderProgram, UniformList[Uniform]));
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
        gl.uniform1f(this.UniformMap.Get(Name), Value);
    };
    Shader.prototype.UniformInt = function (Name, Value) {
        gl.uniform1i(this.UniformMap.Get(Name), Value);
    };
    Shader.prototype.UniformVec3 = function (Name, Value) {
        gl.uniform3f(this.UniformMap.Get(Name), Value[0], Value[1], Value[2]);
    };
    Shader.prototype.UniformMat4 = function (Name, Value) {
        gl.uniformMatrix4fv(this.UniformMap.Get(Name), false, Value);
    };
    return Shader;
}());
var Dictionary = (function () {
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
