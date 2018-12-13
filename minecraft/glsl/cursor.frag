
uniform sampler2D Textures;

varying highp vec2 FragUV;

void main()
{

	highp float c = texture2D(Textures, FragUV).x;
	gl_FragColor = vec4(c, c, c, c);

}