/// <reference path = "gl-matrix.d.ts" />
var canvas;
var gl;
var Loader;
var Int;
var Mos;
var Meshes = [];
var Simple;
window.onload = function () {
    canvas = document.getElementById("canvas"); // <T> is for type conversions
    gl = canvas.getContext("webgl");
    if (!gl) {
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
    Mos = new Mosaic("../simple-mosaic/texture/MonaLisa.jpeg");
    Loader = document.getElementById("Image");
    Int = setInterval(Update, 0.0166667);
    Loader.onchange = function (event) {
        Mos = new Mosaic(URL.createObjectURL(event.target.files[0]));
    };
};
var Timer = 0;
function Update() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    Mos.Update(0.0166667);
    Mos.Render();
}
window.onunload = function () {
    for (var i = 0; i < Meshes.length; i++)
        Meshes[i].Delete();
    Simple.Delete();
};
window.onresize = function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
};
var Mosaic = (function () {
    function Mosaic(Name) {
        this.Shapes = [];
        this.MaxW = 40;
        this.MaxH = 32;
        var context = this;
        var Img = new Image();
        Img.src = Name;
        Img.onload = function () {
            // To get image data in an array in a web browser, you gotta draw it to a canvas and use the canvas's functions to get it :(
            // At least downscaling is easy
            var NewW, NewH;
            if (Img.width > Img.height) {
                if (Img.width > context.MaxW) {
                    NewW = context.MaxW;
                    NewH = Math.round((Img.height * context.MaxW) / Img.width);
                }
                else {
                    NewW = Img.width;
                    NewH = Img.height;
                }
            }
            else {
                if (Img.height > context.MaxH) {
                    NewH = context.MaxH;
                    NewW = Math.round((Img.width * context.MaxH) / Img.height);
                }
                else {
                    NewW = Img.width;
                    NewH = Img.height;
                }
            }
            var NewCanvas = document.createElement("canvas");
            NewCanvas.width = NewW;
            NewCanvas.height = NewH;
            var NewContext = NewCanvas.getContext("2d");
            NewContext.drawImage(Img, 0, 0, NewW, NewH); // This is so fucking jank
            var DataArray = NewContext.getImageData(0, 0, NewW, NewH).data;
            for (var x = 0; x < NewW; x++) {
                for (var y = 0; y < NewH; y++) {
                    context.Shapes.push(new Shape(vec3.fromValues(x - (NewW / 2), -y + (NewH / 2), 0), vec3.fromValues(DataArray[(4 * (x + (y * NewW))) + 0] / 255.0, DataArray[(4 * (x + (y * NewW))) + 1] / 255.0, DataArray[(4 * (x + (y * NewW))) + 2] / 255.0), 0.5, Meshes[Math.floor(Math.random() * Meshes.length)]));
                }
            }
        };
    }
    Mosaic.prototype.Update = function (DeltaTime) {
        for (var i = 0; i < this.Shapes.length; i++)
            this.Shapes[i].Update(DeltaTime);
    };
    Mosaic.prototype.Render = function () {
        for (var i = 0; i < this.Shapes.length; i++)
            this.Shapes[i].Render();
    };
    return Mosaic;
}());
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
        mat4.fromScaling(c, vec3.fromValues(this.Scale, this.Scale, this.Scale));
        mat4.multiply(model, a, c);
        mat4.multiply(model, model, b);
        mat4.fromTranslation(view, new Float32Array([0.0, 0.0, -40.0]));
        mat4.perspective(proj, Math.PI / 4.0, canvas.width / canvas.height, 0.1, 100.0);
        Simple.Use();
        Simple.UniformVec3("Color", this.Color);
        Simple.UniformVec3("Light", new Float32Array([0, 0.0, 10.0]));
        Simple.UniformVec3("ViewPosition", new Float32Array([0.0, 0.0, 40.0]));
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
