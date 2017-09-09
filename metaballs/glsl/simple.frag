
uniform sampler2D Texture;
uniform sampler2D Noise;
uniform highp float Time;

varying highp vec2 FragUV;

void main()
{
	
	highp vec2 UV = vec2(FragUV.x, FragUV.y + 2.0 * sin((Time + (FragUV.x * 200.0)) / 400.0));
	highp vec2 UV2 = vec2(FragUV.x + (Time / 300.0), FragUV.y);
	gl_FragColor = texture2D(Texture, UV) * texture2D(Noise, UV2);

}