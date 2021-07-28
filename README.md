<h1 align="center">
<br>
<img src="https://github.com/lrsb/cg-webgl-2020/blob/master/favicon.png" alt="Missile simulator" width="50">
<br>
Missile simulator
</h1>
<h3 align="center">Ballistic trajectory missile simulator.</h3>
<h5 align="center">A pure Javascript implementation of a missile simulator with GLSL shaders.</h5>

<p align="center">
  <a href="#description">Description</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#demo">Demo</a> •
  <a href="#license">License</a>
</p>

## Description

The project renders a mesh of some hills with a missile. When start is pressed the missile completes a parabolic trajectory until it crash.

The position in the trajectory is calculated in 2D on a parabola and then projected into 3D space on a plane that lays on the start and end points.

A `height` parameter is used to modify the apex of the parabola.

```javascript
function getParabolicPoint(start, end, height, completion) {
    //Ballistic trajectory
    const direction = utils.subVector(end, start)
    const normDirection = utils.normalizeVector3([direction[0], 0, direction[2]])
    const distance = utils.modulusVector3(direction)
    const g = 9.81 * height

    const alpha = Math.asin((end[1] - start[1]) / distance)
    const gamma = Math.atan2(0.5 * g * Math.cos(alpha), 0.5 * g * Math.sin(alpha) + distance) + alpha
    const v0 = 0.5 * g * Math.cos(alpha) / Math.sin(gamma - alpha)

    const x = v0 * completion * Math.cos(gamma)
    const y = v0 * completion * Math.sin(gamma) - 0.5 * g * Math.pow(completion, 2)

    return utils.sumVector(start, [x * normDirection[0], y, x * normDirection[2]])
}
```

To select the start and ending point a ray is unprojected from where the user clicked into the 3D world.

The ray vector (a point into 2D space is a line in 3D space) is extended `utils.scalarVector3(dirNorm, 1000)` to intersect the hills' mesh.

```javascript
function unprojectScreenPoint(mesh, x, y) {
    //Ray-tracing algorithm
    const cm = getCameraAndMatrix()
    const worldMatrix = utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1)
    const viewWorldMatrix = utils.multiplyMatrices(worldMatrix, cm.viewMatrix)
    const projectionMatrix = utils.multiplyMatrices(cm.perspectiveMatrix, viewWorldMatrix)

    const unprojectMatrix = utils.invertMatrix(projectionMatrix)
    const screenCoords = [x, y, 1.0, 1.0]
    const unprojectedRaypoint = utils.multiplyMatrixVector(unprojectMatrix, screenCoords)
    const normUnprojectedRaypoint = [unprojectedRaypoint[0] / unprojectedRaypoint[3],
        unprojectedRaypoint[1] / unprojectedRaypoint[3],
        unprojectedRaypoint[2] / unprojectedRaypoint[3]]

    const dirNorm = utils.normalizeVector3(utils.subVector(normUnprojectedRaypoint, cm.cameraPosition))
    const dirMax = utils.scalarVector3(dirNorm, 1000)
    const rayEnd = utils.sumVector(dirMax, cm.cameraPosition)
    return checkCollision(mesh, cm.cameraPosition, rayEnd)
}
```

To check is there was a collision between them is used the Möller–Trumbore algorithm, to cite Wikipedia:

> The Möller–Trumbore ray-triangle intersection algorithm, named after its inventors Tomas Möller and Ben Trumbore, is a fast method for calculating the intersection of a ray and a triangle in three dimensions without needing precomputation of the plane equation of the plane containing the triangle.

The point is later placed on the point where the collision happened.

```javascript
function checkCollision(mesh, position, nextPosition) {
    //Möller–Trumbore algorithm
    const vertices = mesh.vertices, indices = mesh.indices, e = 0.0001
    for (let i = 0; i < indices.length; i += 3) {
        const v0 = [vertices[indices[i] * 3], vertices[indices[i] * 3 + 1], vertices[indices[i] * 3 + 2]]
        const v1 = [vertices[indices[i + 1] * 3], vertices[indices[i + 1] * 3 + 1], vertices[indices[i + 1] * 3 + 2]]
        const v2 = [vertices[indices[i + 2] * 3], vertices[indices[i + 2] * 3 + 1], vertices[indices[i + 2] * 3 + 2]]

        const v1_0 = utils.subVector(v1, v0)
        const v2_0 = utils.subVector(v2, v0)
        const h = utils.crossVector(nextPosition, v2_0)
        const a = utils.dotVector(v1_0, h)
        if (Math.abs(a) < e) continue

        const f = 1 / a
        const s = utils.subVector(position, v0)
        const u = f * utils.dotVector(s, h)
        if (u < 0.0 || u > 1.0) continue
        const q = utils.crossVector(s, v1_0)
        const v = f * utils.dotVector(nextPosition, q)
        if (v < 0.0 || u + v > 1.0) continue

        const t = f * utils.dotVector(v2_0, q)
        if (t > e) return utils.sumVector(position, utils.scalarVector3(nextPosition, t))
    }
    return false
}
```

## How To Use

You can find it [here](https://lrsb.xyz/cg-webgl-2020).

## Demo

![](demo.gif)

## License

MIT
