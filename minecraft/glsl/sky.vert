
attribute vec3 Position;
attribute vec3 Normal;
attribute vec2 UV;

varying highp float FragPitch;

void main()
{

	FragPitch = Position.y;

	gl_Position = vec4(Position.xy, 0.999999, 1.0);

}