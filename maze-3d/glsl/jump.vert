
uniform highp float Timer;

attribute vec3 Position;
attribute vec3 Normal;
attribute vec2 UV;

varying highp vec2 FragUV;

void main()
{

	FragUV = vec2(UV.x, 1.0 - UV.y);

	gl_Position = vec4(Position.xy * ((0.2 * cos(20.0 * Timer)) + 0.9), Position.z, 1.0);

}