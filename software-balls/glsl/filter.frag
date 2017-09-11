
uniform sampler2D BallTexture;
uniform sampler2D FilterTexture;

varying highp vec2 FragPosition;

void main()
{
	
	gl_FragColor = texture2D(FilterTexture, vec2(texture2D(BallTexture, (FragPosition + 1.0) / 2.0).r, 0.0));

}