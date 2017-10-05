
uniform mat4 Model;
uniform mat4 View;
uniform mat4 Projection;

attribute vec3 Position;
attribute vec3 Normal;

varying highp vec3 FragPos;
varying highp vec3 FragNorm;

void main()
{
	
	gl_Position = Projection * View * Model * vec4(Position, 1.0);
	FragPos = (Model * vec4(Position, 1.0)).xyz;
	FragNorm = normalize((Model * vec4(Normal, 0.0)).xyz);

}