
attribute vec2 VertexPosition;

uniform mat3 Transform;

varying highp vec2 FragUV;

void main()
{
	
	gl_Position = vec4((Transform * vec3(VertexPosition.xy, 1.0)).xy, 0.0, 1.0);

	FragUV = (vec2(gl_Position.x, -gl_Position.y) + 1.0) / 2.0;

}