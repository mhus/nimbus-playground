#import "Common/ShaderLib/GLSLCompat.glsllib"

uniform vec4 m_Color;
uniform float g_Time;

varying vec2 texCoord;
varying vec3 worldPos;
varying vec3 normal;

void main() {
    // Basis-Farbe
    vec4 color = m_Color;

    // Leichtes Flimmern basierend auf Zeit und Position
    float shimmer = sin(worldPos.x * 0.5 + g_Time * 2.0) * 0.1 +
                    cos(worldPos.z * 0.5 + g_Time * 1.5) * 0.1;

    color.rgb += shimmer;

    gl_FragColor = color;
}
