
uniform highp vec2 Dimensions;

attribute vec2 VertexPosition;

varying highp vec2 FragPosition;

void main()
{
	
	highp vec2 Norm = (VertexPosition + 1.0) / 2.0;
	FragPosition = vec2(Norm.x * Dimensions.x, Norm.y * Dimensions.y);
	gl_Position = vec4(VertexPosition, 0.0, 1.0);

}