let program, gl

const models = {
    missile1: null, missile2: null,
    landscape: null, sphere: null, light: null
}

const MISSILE_COMPLETION_BOUND = 0.005
const missile = {
    start: {
        x: -2.989, y: 0.0155, z: 3.711
    }, end: {
        x: 0.523, y: 1.676, z: 1.806
    }, completion: MISSILE_COMPLETION_BOUND, model1: true
}

const camera = {
    x: -2.0, y: 2.0, z: 1.0,
    elevation: -10.0, angle: 90.0,
    zoom: 0.7, lookAt: true
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

    const ambientColor = decodeColor(lights.colors.ambient)
    gl.clearColor(ambientColor[0], ambientColor[1], ambientColor[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    for (let i = 0.015; i < (events.computeMax ? 5 : events.maxCompletion); i += 0.1 / settings.flightTime) {
        const position = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
            [missile.end.x, missile.end.y, missile.end.z], settings.height, i)
        const nextPosition = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
            [missile.end.x, missile.end.y, missile.end.z], settings.height, i + 0.01)

        const sphereWorldMatrix = utils.MakeWorld(position[0], position[1], position[2], 0, 0, 0, 0.01)
        drawModel(models.sphere, sphereWorldMatrix, cm, decodeColor(lights.colors.trajectory), false)
        if (events.computeMax && (checkCollision(models.landscape.mesh, position, nextPosition) || position[1] < -0.2)) {
            events.maxCompletion = i
            events.computeMax = false
            break
        }
    }

    if (events.playing && (checkCollision(models.landscape.mesh, position, nextPosition) || missile.completion >= events.maxCompletion - MISSILE_COMPLETION_BOUND)) {
        events.playing = false
        updateButtons()
    }
    const missileDirection = utils.normalizeVector3(utils.subVector(nextPosition, position))
    const missileWorldMatrix = utils.MakeWorldFromBetweenVectors(position[0], position[1], position[2], [0, 0, 1], missileDirection, 0.01)
    drawModel(missile.model1 ? models.missile1 : models.missile2, missileWorldMatrix, cm)
    drawModel(models.landscape, utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1), cm)
    if (lights.lightType[1] === 1) {
        let lightColor = decodeColor(lights.colors.light)
        for (let i = 0; i < lightColor.length; i++) lightColor[i] *= 0.8 + lights.point.decay / 10.0
        drawModel(models.sphere, utils.MakeWorld(lights.point.x, lights.point.y, lights.point.z, 0, 0, 0, 0.05), cm, lightColor, true)
    } else if (lights.lightType[2] === 1) {
        const angle = lights.lightType[2] === 1 ? lights.spot.phi : 0
        const elevation = lights.lightType[2] === 1 ? lights.spot.theta : 0
        const vect = utils.normalizeVector3([Math.sin(elevation) * Math.sin(angle),
            Math.cos(elevation),
            Math.sin(elevation) * Math.cos(angle)])
        drawModel(models.light, utils.MakeWorldFromBetweenVectors(lights.spot.x, lights.spot.y, lights.spot.z, [0, 0, -1], vect, 0.01), cm)
    }
    if (camera.lookAt) {
        const sphereWorldMatrix = utils.MakeWorld(camera.x, camera.y, camera.z, 0, 0, 0, 0.05)
        drawModel(models.sphere, sphereWorldMatrix, cm, [0, 1, 0], true)
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
    models.missile1 = await loadModel('missile1')
    models.missile2 = await loadModel('missile2')
    models.sphere = await loadModel('sphere')
    models.light = await loadModel('light')
    models.landscape = await loadModel('landscape')

    utils.resizeCanvasToDisplaySize(gl.canvas)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.useProgram(program)

    drawScene()
}

window.onload = main