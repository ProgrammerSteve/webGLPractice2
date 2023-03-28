const canvas = document.querySelector("canvas");

const { mat2, mat2d, mat3, mat4, quat, quat2, vec2, vec3, vec4 } = glMatrix;
const gl = canvas.getContext("webgl");

if (!gl) {
  throw new Error("WebGL not supported");
}

function spherePointCloud(pointCount) {
  let points = [];
  for (let i = 0; i < pointCount; i++) {
    const r = () => Math.random() - 0.5; // -.5 < x < 0.5
    const inputPoint = [r(), r(), r()];
    const outputPoint = vec3.normalize(vec3.create(), inputPoint);
    points.push(...outputPoint);
  }
  return points;
}

const vertexData = spherePointCloud(1e5);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(
  vertexShader,
  `
precision mediump float;

attribute vec3 position;
varying vec3 vColor;

uniform mat4 matrix;

void main() {
  vColor = vec3(position.xy, 1);
  gl_Position = matrix * vec4(position, 1);
  gl_PointSize = 1.1; // set the point size to a larger value
}
`
);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(
  fragmentShader,
  `
precision mediump float;
varying vec3 vColor;
void main() {
    gl_FragColor = vec4(vColor, 1);
}
`
);
gl.compileShader(fragmentShader);
console.log(gl.getShaderInfoLog(fragmentShader));

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

const positionLocation = gl.getAttribLocation(program, `position`);
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

const uniformLocations = {
  matrix: gl.getUniformLocation(program, `matrix`),
};

const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();
mat4.perspective(
  projectionMatrix,
  (75 * Math.PI) / 180, //vertical field of View (angle in radians)
  canvas.width / canvas.height, //aspect ratio W/H
  1e-4, //near cull distance/plane, how close to the screen can the object get without disappearing. Usually small. Not a zero value or negative.
  1e4 //far cull distance/plane, how far an object can go without disappearing.
);

const mvMatrix = mat4.create();
const mvpMatrix = mat4.create();

mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);
mat4.translate(viewMatrix, viewMatrix, [0, 0.1, 2]);
mat4.invert(viewMatrix, viewMatrix);

function animate() {
  requestAnimationFrame(animate);
  mat4.rotateY(modelMatrix, modelMatrix, 0.03);
  //P * M

  mat4.multiply(mvMatrix, viewMatrix, modelMatrix);
  mat4.multiply(mvpMatrix, projectionMatrix, mvMatrix);
  gl.uniformMatrix4fv(uniformLocations.matrix, false, mvpMatrix);
  gl.drawArrays(gl.POINTS, 0, vertexData.length / 3);
}

animate();
