
uniform sampler2D Textures;
uniform highp vec3 Camera;
uniform highp float LightScale;

varying highp vec2 FragUV;
varying highp vec3 FragPos;

void main()
{

	gl_FragColor = vec4(LightScale * texture2D(Textures, FragUV).xyz / length(Camera - FragPos), 1.0);

}