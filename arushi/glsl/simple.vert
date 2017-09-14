
uniform mat4 Model;
uniform mat4 View;
uniform mat4 Projection;

attribute vec3 VertexPosition;
attribute vec2 VertexUV;

varying highp vec2 FragUV;

void main()
{
	
	gl_Position = Projection * View * Model * vec4(VertexPosition, 1.0);
	FragUV = vec2(VertexUV.x, -VertexUV.y);

}