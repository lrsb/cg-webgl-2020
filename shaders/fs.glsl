#version 300 es

precision highp float;

in vec3 fs_position;
in vec2 fs_uv;
in vec3 fs_normal;

out vec4 out_color;

uniform mat4 wo_matrix;
uniform mat4 two_matrix;
uniform vec3 eyePos;
uniform sampler2D u_texture;

uniform vec4 LAlightType;
uniform vec3 LAPos;
uniform vec3 LADir;
uniform float LAConeOut;
uniform float LAConeIn;
uniform float LADecay;
uniform vec4 LAlightColor;

uniform float DTexMix;
uniform vec4 ambientLightColor;
uniform vec4 diffuseColor;
uniform vec4 specularColor;
uniform float SpecShine;
uniform vec4 ambientMatColor;

vec3 compLightDir(vec3 LPos, vec3 LDir, vec4 lightType) {
    vec3 pointLightDir = normalize(LPos - fs_position);
    vec3 directLightDir = LDir;
    vec3 spotLightDir = normalize(LPos - fs_position);

    return directLightDir * lightType.x + pointLightDir * lightType.y + spotLightDir * lightType.z;
}

vec4 compLightColor(vec4 lightColor, float LDecay, vec3 LPos, vec3 LDir, float LConeOut, float LConeIn, vec4 lightType) {
    float LCosOut = cos(radians(LConeOut / 2.0));
    float LCosIn = cos(radians(LConeOut * LConeIn / 2.0));

    vec4 pointLightCol = lightColor * pow(2.5 / length(LPos - fs_position), LDecay);
    vec4 directLightCol = lightColor;
    vec3 spotLightDir = normalize(LPos - fs_position);

    float CosAngle = dot(spotLightDir, LDir);
    vec4 spotLightCol = lightColor * pow(2.5 / length(LPos - fs_position), LDecay) * clamp((CosAngle - LCosOut) / (LCosIn - LCosOut), 0.0, 1.0);

    return directLightCol * lightType.x + pointLightCol * lightType.y + spotLightCol * lightType.z;
}

vec4 compDiffuse(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec4 diffColor) {
    return lightCol * clamp(dot(normalVec, lightDir), 0.0, 1.0) * diffColor;
}

vec4 compSpecular(vec3 lightDir, vec4 lightCol, vec3 normalVec, vec3 eyedirVec) {
    vec3 reflection = -reflect(lightDir, normalVec);
    vec4 specularPhong = lightCol * pow(max(dot(reflection, eyedirVec), 0.0), SpecShine) * specularColor;

    return specularPhong;
}

void main() {
    vec4 texcol = texture(u_texture, fs_uv);
    vec4 diffColor = diffuseColor * (1.0 - DTexMix) + texcol * DTexMix;
    vec4 ambColor = ambientMatColor * (1.0 - DTexMix) + texcol * DTexMix;

    vec3 objEyePos = (wo_matrix * vec4(eyePos.xyz, 1.0)).xyz;
    vec3 normalVec = normalize(fs_normal);
    vec3 eyedirVec = normalize(objEyePos - fs_position);

    vec3 objLAPos = (wo_matrix * vec4(LAPos.xyz, 1.0)).xyz;
    vec3 objLADir = normalize((two_matrix * vec4(LADir.xyz, 1.0)).xyz);
    vec3 LAlightDir = compLightDir(objLAPos, objLADir, LAlightType);
    vec4 LAlightCol = compLightColor(LAlightColor, LADecay, objLAPos, objLADir, LAConeOut, LAConeIn, LAlightType);

    vec4 ambient = ambientLightColor * ambColor;
    vec4 diffuse = compDiffuse(LAlightDir, LAlightCol, normalVec, diffColor);
    vec4 specular = compSpecular(LAlightDir, LAlightCol, normalVec, eyedirVec);

    vec4 outColor = clamp(ambient + diffuse + specular, 0.0, 1.0);
    out_color = vec4(outColor.rgb, 1.0);
}