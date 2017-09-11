
attribute vec2 VertexPosition;

varying highp vec2 FragPosition;

void main()
{
	
	FragPosition = VertexPosition;
	gl_Position = vec4(VertexPosition, 0.0, 1.0);

}