
uniform highp vec3 SkyColor;
uniform highp vec3 HorizonColor;
uniform highp vec2 AngleRange;
uniform highp float Pitch;
uniform highp float VFOV;

varying highp float FragPitch;

void main()
{

	gl_FragColor = vec4(mix(HorizonColor, SkyColor, clamp((FragPitch * VFOV) - Pitch, AngleRange.x, AngleRange.y) / (AngleRange.y - AngleRange.x)), 1.0);

}