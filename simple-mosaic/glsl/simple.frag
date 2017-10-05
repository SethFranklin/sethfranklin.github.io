
uniform highp vec3 Color;
uniform highp vec3 Light;
uniform highp vec3 ViewPosition;

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

	highp float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
	highp vec3 specular = specularStrength * spec * vec3(1.0, 1.0, 1.0);  
  	
    highp vec3 result = (ambient + diffuse) * Color;
    gl_FragColor = vec4(result, 1.0);

}