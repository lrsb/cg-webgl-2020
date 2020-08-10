let program, gl, missile1, missile2, landscape, sphere, light

const missile = {
    start: {
        x: -2.989, y: 0.0155, z: 3.711
    }, end: {
        x: 0.523, y: 1.676, z: 1.806
    }, completion: 0.005, model1: true
}

const camera = {
    x: -2.0, y: 2.0, z: 1.0,
    elevation: -10.0, angle: 90.0,
    zoom: 0.7, lookAt: true
}

const events = {
    selecting: false, selectingStart: true, playing: false, lastDrawTimestamp: Date.now()
}

const settings = {
    flightTime: 5.0, height: 0.0
}

function drawScene() {
    setUniforms()
    const cm = getCameraAndMatrix()

    const position = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
        [missile.end.x, missile.end.y, missile.end.z], settings.height, missile.completion)
    const nextPosition = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
        [missile.end.x, missile.end.y, missile.end.z], settings.height, missile.completion + 0.01)

    const color = decodeColor(lights.colors.ambient)
    gl.clearColor(color[0], color[1], color[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    let maxCompletion = 5
    for (let i = 0.01; i < 5; i += 0.1 / settings.flightTime) {
        const position = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
            [missile.end.x, missile.end.y, missile.end.z], settings.height, i)
        const nextPosition = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
            [missile.end.x, missile.end.y, missile.end.z], settings.height, i + 0.01)

        const sphereWorldMatrix = utils.MakeWorld(position[0], position[1], position[2], 0, 0, 0, 0.01)
        drawModel(sphere, sphereWorldMatrix, cm)
        if (checkCollision(landscape.mesh, position, nextPosition) || position[1] < -0.2) {
            maxCompletion = i
            break
        }
    }

    if (events.playing && (checkCollision(landscape.mesh, position, nextPosition) || missile.completion > maxCompletion)) {
        events.playing = false
        updateButtons()
    }
    const missileDirection = utils.normalizeVector3(utils.subVector(nextPosition, position))
    const missileWorldMatrix = utils.MakeWorldFromBetweenVectors(position[0], position[1], position[2], [0, 0, 1], missileDirection, 0.01)
    drawModel(missile.model1 ? missile1 : missile2, missileWorldMatrix, cm)
    drawModel(landscape, utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1), cm)
    if (lights.lightType[1] === 1 || lights.lightType[2] === 1) {
        const angle = lights.lightType[2] === 1 ? lights.spot.phi : 0
        const elevation = lights.lightType[2] === 1 ? lights.spot.theta : 0
        const vect = utils.normalizeVector3([Math.sin(elevation) * Math.sin(angle),
            Math.cos(elevation),
            Math.sin(elevation) * Math.cos(angle)])
        drawModel(light, utils.MakeWorldFromBetweenVectors(
            lights.lightType[1] === 1 ? lights.point.x : lights.spot.x,
            lights.lightType[1] === 1 ? lights.point.y : lights.spot.y,
            lights.lightType[1] === 1 ? lights.point.z : lights.spot.z,
            [0, 0, -1], vect, 0.01), cm)
    }
    if (camera.lookAt) {
        const sphereWorldMatrix = utils.MakeWorld(camera.x, camera.y, camera.z, 0, 0, 0, 0.05)
        drawModel(sphere, sphereWorldMatrix, cm)
    }
    if (events.playing) missile.completion += (Date.now() - events.lastDrawTimestamp) / (1000.0 * settings.flightTime)
    events.lastDrawTimestamp = Date.now()

    statusUiUpdate(position, missileDirection)
    window.requestAnimationFrame(drawScene)
}

async function main() {
    const canvas = document.getElementById('canvas')
    gl = canvas.getContext('webgl2')

    if (!gl) {
        alert('WebGL not supported')
        return
    }
    registerListeners()

    await utils.loadFiles(['shaders/vs.glsl', 'shaders/fs.glsl'], (text) => program = utils.createAndCompileShaders(gl, text))
    missile1 = await loadModel('missile1')
    missile2 = await loadModel('missile2')
    sphere = await loadModel('sphere')
    light = await loadModel('light')
    landscape = await loadModel('landscape')

    utils.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.useProgram(program)

    drawScene()
}

window.onload = main