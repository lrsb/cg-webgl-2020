#version 300 es

in vec3 in_position;
in vec2 in_uv;
in vec3 in_normal;
out vec2 uvFS;

uniform mat4 matrix;

void main() {
	uvFS = in_uv;
	gl_Position = matrix * vec4(in_position,1.0);
}
/*

uniform mat4 pMatrix;
uniform mat4 wMatrix;

out vec3 fs_pos;
out vec3 fs_norm;
out vec2 fs_uv;

void main() {
	fs_pos = (wMatrix * vec4(in_pos, 1.0)).xyz;
	fs_norm = (wMatrix * vec4(in_norm, 0.0)).xyz;
	fs_uv = vec2(in_uv.x, 1.0-in_uv.y);

	gl_Position = pMatrix * vec4(in_pos, 1.0);
}*/