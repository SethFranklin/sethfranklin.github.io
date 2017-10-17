
uniform highp vec3 Color;
uniform highp vec3 Light;
uniform highp vec3 ViewPosition;
uniform sampler2D Gradient;
uniform sampler2D Checker1;
uniform sampler2D Checker2;
uniform sampler2D Checker3;

varying highp vec3 FragPos;
varying highp vec3 FragNorm;

void main()
{
	
	highp float ambientStrength = 0.1;
    highp vec3 ambient = ambientStrength * vec3(1.0, 1.0, 1.0);

	highp vec3 lightDir = normalize(Light - FragPos);

	highp float diff = max(dot(FragNorm, lightDir), 0.0);
	highp vec3 diffuse = diff * vec3(1.0, 1.0, 1.0);

	highp float specularStrength = 0.5;

	highp vec3 viewDir = normalize(ViewPosition - FragPos);
	highp vec3 reflectDir = reflect(-lightDir, FragNorm);

	highp float spec = specularStrength * pow(max(dot(viewDir, reflectDir), 0.0), 2.0); 
  	
    highp float result = (ambientStrength + diff + spec);

    highp vec2 Gradient = texture2D(Gradient, vec2(result, 0.0)).xy;

    highp float finalscal = 0.0;

    if (Gradient.x == 0.0)
    {

    	finalscal = texture2D(Checker1, gl_FragCoord.xy / 4.0).r;

	}
    else if (Gradient.y == 0.0)
    {

    	finalscal = texture2D(Checker2, gl_FragCoord.xy / 4.0).r;

	}
    else
    {

    	finalscal = texture2D(Checker3, gl_FragCoord.xy / 4.0).r;

	}

	gl_FragColor = vec4(finalscal * Color, 1.0);

}