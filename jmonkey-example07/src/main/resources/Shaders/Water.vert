#import "Common/ShaderLib/GLSLCompat.glsllib"

uniform mat4 g_WorldViewProjectionMatrix;
uniform mat4 g_WorldMatrix;
uniform float g_Time;

attribute vec3 inPosition;
attribute vec2 inTexCoord;
attribute vec3 inNormal;

varying vec2 texCoord;
varying vec3 worldPos;
varying vec3 normal;

// Wave parameters
uniform float m_WaveHeight;    // Höhe der Wellen
uniform float m_WaveSpeed;     // Geschwindigkeit der Wellen
uniform float m_WaveFrequency; // Frequenz der Wellen

void main() {
    vec4 pos = vec4(inPosition, 1.0);

    // Berechne Wellen-Offset basierend auf Position und Zeit
    float wave1 = sin(pos.x * m_WaveFrequency + g_Time * m_WaveSpeed) * m_WaveHeight;
    float wave2 = cos(pos.z * m_WaveFrequency * 0.7 + g_Time * m_WaveSpeed * 0.8) * m_WaveHeight * 0.5;
    float wave3 = sin((pos.x + pos.z) * m_WaveFrequency * 0.5 + g_Time * m_WaveSpeed * 1.2) * m_WaveHeight * 0.3;

    // Addiere Wellen zur Y-Position
    pos.y += wave1 + wave2 + wave3;

    // Transformiere Position
    worldPos = (g_WorldMatrix * pos).xyz;
    gl_Position = g_WorldViewProjectionMatrix * pos;

    // Normal für Beleuchtung (vereinfacht)
    normal = inNormal;

    texCoord = inTexCoord;
}
