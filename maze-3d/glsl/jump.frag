
uniform sampler2D Textures;

varying highp vec2 FragUV;

void main()
{

	gl_FragColor = vec4(texture2D(Textures, FragUV).xyz, 1.0);

}