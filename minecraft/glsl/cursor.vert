
uniform highp float Scale;
uniform highp float Aspect;

attribute vec3 Position;
attribute vec3 Normal;
attribute vec2 UV;

varying highp vec2 FragUV;

void main()
{

	FragUV = vec2(UV.x, 1.0 - UV.y);

	gl_Position = vec4(Position.x * Scale, Position.y * Scale * Aspect, Position.z, 1.0);

}