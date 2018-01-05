
uniform mat4 Model;
uniform mat4 ViewProjection;

attribute vec3 Position;
attribute vec3 Normal;
attribute vec2 UV;

varying highp vec3 FragNorm;
varying highp vec2 FragUV;

void main()
{

	gl_Position = ViewProjection * Model * vec4(Position, 1.0);

	FragNorm = (Model * vec4(Normal, 0.0)).xyz;

	FragUV = UV;

}