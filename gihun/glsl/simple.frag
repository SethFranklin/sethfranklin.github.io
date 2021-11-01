
uniform sampler2D Texture;

varying highp vec2 FragUV;

void main()
{
	
	gl_FragColor = texture2D(Texture, FragUV);

}