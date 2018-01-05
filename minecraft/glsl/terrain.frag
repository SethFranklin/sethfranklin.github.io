
uniform sampler2D Textures;

varying highp vec3 FragNorm;
varying highp vec2 FragUV;

void main()
{

	gl_FragColor = vec4(texture2D(Textures, FragUV).xyz, 1.0) * (max(dot(FragNorm, normalize(vec3(0.5, 1, 1.4))), 0.0) + 0.3);

}