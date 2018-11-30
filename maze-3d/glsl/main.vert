
uniform mat4 Model;
uniform mat4 ViewProjection;

attribute vec3 Position;
attribute vec3 Normal;
attribute vec2 UV;

varying highp vec2 FragUV;
varying highp vec3 FragPos;

void main()
{

	FragUV = UV;

	gl_Position = ViewProjection * Model * vec4(Position, 1.0);

	FragPos = (Model * vec4(Position, 1.0)).xyz;

}