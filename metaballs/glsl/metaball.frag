
uniform highp vec2 BallPosition;
uniform highp vec2 Dimensions;
uniform highp float Radius;

varying highp vec2 FragPosition;

void main()
{
	
	highp float Distance = distance(BallPosition, FragPosition);
	highp float Alpha = (Radius * Dimensions.y / 16.0) / (Distance * Distance);
	gl_FragColor = vec4(1.0, 1.0, 1.0, Alpha);

}