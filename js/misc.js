function getParabolicPoint(start, end, height, completion) {
    const direction = utils.subVector(end, start)
    const normDirection = utils.normalizeVector3([direction[0], 0, direction[2]])
    const distance = utils.modulusVector3(direction)

    let alpha = Math.asin((end[1] - start[1]) / distance)
    const a0_gamma = Math.atan2(0.5 * 9.81 * Math.cos(alpha), 0.5 * 9.81 * Math.sin(alpha) + distance) + alpha
    alpha = Math.min(Math.max(0.0, alpha + Math.PI / 4 * height), a0_gamma)
    const gamma = Math.atan2(0.5 * 9.81 * Math.cos(alpha), 0.5 * 9.81 * Math.sin(alpha) + distance) + alpha
    const v0 = 0.5 * 9.81 * Math.cos(alpha) / Math.sin(gamma - alpha)

    const x = v0 * completion * Math.cos(gamma)
    const y = v0 * completion * Math.sin(gamma) - 0.5 * 9.81 * Math.pow(completion, 2)

    return  utils.sumVector(start, [x * normDirection[0], y, x * normDirection[2]])
}

function getCameraAndMatrix() {
    const position = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
        [missile.end.x, missile.end.y, missile.end.z], settings.height, missile.completion)

    let viewMatrix = utils.MakeView(camera.x, camera.y, camera.z, camera.elevation, camera.angle)
    let cameraPosition = [camera.x, camera.y, camera.z]
    const perspectiveMatrix = utils.MakePerspective(55, gl.canvas.width / gl.canvas.height, 0.01, 100.0)
    if (camera.lookAt) {
        const cx = Math.sin(utils.degToRad(-camera.angle)) * Math.cos(utils.degToRad(-camera.elevation))
        const cy = Math.sin(utils.degToRad(-camera.elevation))
        const cz = Math.cos(utils.degToRad(-camera.angle)) * Math.cos(utils.degToRad(-camera.elevation))
        const v_z = utils.normalizeVector3([cx, cy, cz])
        const v_x = utils.normalizeVector3(utils.crossVector([0, Math.cos(utils.degToRad(camera.elevation)) > 0 ? 1 : -1, 0], v_z))
        const v_y = utils.crossVector(v_z, v_x)
        const view_inv =
            [v_x[0], v_y[0], v_z[0], cx * camera.zoom + position[0],
                v_x[1], v_y[1], v_z[1], cy * camera.zoom + position[1],
                v_x[2], v_y[2], v_z[2], cz * camera.zoom + position[2],
                0.0,   0.0,   0.0,   1.0]
        viewMatrix = utils.invertMatrix(view_inv)
        cameraPosition = [cx * camera.zoom + position[0], cy * camera.zoom + position[1], cz * camera.zoom + position[2]]
    }
    return { viewMatrix, perspectiveMatrix, cameraPosition }
}

function checkCollision(mesh, position, nextPos) {
    //Möller–Trumbore algorithm
    const vertices = mesh.vertices, indices = mesh.indices, e = 0.00001
    for (let i = 0; i < indices.length; i += 3) {
        const v0 = [vertices[indices[i] * 3], vertices[indices[i] * 3 + 1], vertices[indices[i] * 3 + 2]]
        const v1 = [vertices[indices[i + 1] * 3], vertices[indices[i + 1] * 3 + 1], vertices[indices[i + 1] * 3 + 2]]
        const v2 = [vertices[indices[i + 2] * 3], vertices[indices[i + 2] * 3 + 1], vertices[indices[i + 2] * 3 + 2]]

        const v1_0 = utils.subVector(v1, v0)
        const v2_0 = utils.subVector(v2, v0)
        const h = utils.crossVector(nextPos, v2_0)
        const a = utils.dotVector(v1_0, h)
        if (Math.abs(a) < e) continue

        const f = 1 / a
        const s = utils.subVector(position, v0)
        const u = f * utils.dotVector(s, h)
        if (u < 0.0 || u > 1.0) continue
        const q = utils.crossVector(s, v1_0)
        const v = f * utils.dotVector(nextPos, q)
        if (v < 0.0 || u + v > 1.0) continue

        const t = f * utils.dotVector(v2_0, q)
        if (t > e) return utils.sumVector(position, utils.scalarVector3(nextPos, t))
    }
    return false
}

function unprojectScreenPoint(model, x, y) {
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
    return checkCollision(model, cm.cameraPosition, rayEnd)
}