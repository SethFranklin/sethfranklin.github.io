
uniform mat4 Model;
uniform mat4 ViewProjection;
uniform highp float Timer;

attribute vec3 Position;
attribute vec3 Normal;
attribute vec2 UV;

varying highp vec2 FragUV;
varying highp vec3 FragPos;

void main()
{

	FragUV = vec2(UV.x + cos(2.0 * Timer), 1.0 - UV.y + cos(3.0 * Timer));

	gl_Position = ViewProjection * Model * vec4(Position.x, Position.y * cos(8.0 * Timer), Position.z, 1.0);

	FragPos = (Model * vec4(Position, 1.0)).xyz;

}