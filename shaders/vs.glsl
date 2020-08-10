#version 300 es

in vec3 in_position;
in vec2 in_uv;
in vec3 in_normal;

out vec3 fs_position;
out vec2 fs_uv;
out vec3 fs_normal;

uniform mat4 matrix;

void main() {
	fs_position = in_position;
	fs_uv = in_uv;
	fs_normal = in_normal;
	gl_Position = matrix * vec4(in_position, 1.0);
}