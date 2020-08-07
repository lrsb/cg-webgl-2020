let program, gl, missile1, missile2, landscape, sphere

const missile = {
    start: {
        x: -2.989, y: 0.0155, z: 3.711
    }, end: {
        x: 0.523, y: 1.676, z: 1.806
    }, completion: 0.005, model1: true
}

const camera = {
    x: -2.0, y: 2.0, z: 1.0,
    elevation: 0.0,
    angle: 90.0,
    zoom: 0.2,
    lookAt: true
}

const events = {
    selecting: false, selectingStart: true, playing: false, lastDrawTimestamp: Date.now()
}

const settings = {
    flightTime: 5.0, height: 0.0
}

async function main() {
    utils.resizeCanvasToDisplaySize(gl.canvas)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(program)
    drawScene()
}

function statusUiUpdate(position, nextPosition, direction) {
    const missileAngle = utils.cartesianToSpherical(direction)

    $('#missile-x').text(position[0].toFixed(2))
    $('#missile-y').text(position[1].toFixed(2))
    $('#missile-z').text(position[2].toFixed(2))

    $('#missile-phi').text(utils.radToDeg(missileAngle.phi).toFixed(1))
    $('#missile-theta').text(utils.radToDeg(missileAngle.theta).toFixed(1))
    $('#missile-completion').text(((missile.completion - 0.005) * 100).toFixed(1))

    $('#camera-x').text(camera.x.toFixed(2))
    $('#camera-y').text(camera.y.toFixed(2))
    $('#camera-z').text(camera.z.toFixed(2))
    $('#camera-phi').text(camera.elevation.toFixed(1))
    $('#camera-theta').text(camera.angle.toFixed(1))
    $('#camera-zoom').text(camera.zoom.toFixed(2))

    $('#start-x').text(missile.start.x.toFixed(2))
    $('#start-y').text(missile.start.y.toFixed(2))
    $('#start-z').text(missile.start.z.toFixed(2))
    $('#end-x').text(missile.end.x.toFixed(2))
    $('#end-y').text(missile.end.y.toFixed(2))
    $('#end-z').text(missile.end.z.toFixed(2))
}

function drawScene() {
    const position = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
        [missile.end.x, missile.end.y, missile.end.z], settings.height, missile.completion)
    const nextPosition = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
        [missile.end.x, missile.end.y, missile.end.z], settings.height, missile.completion + 0.005)

    let viewMatrix = utils.MakeView(camera.x, camera.y, camera.z, camera.elevation, camera.angle)
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
    }

    gl.clearColor(0.7, 1, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    let maxCompletion = 10
    for (let i = 0.01; i < 10; i += 0.1 / settings.flightTime) {
        const position = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
            [missile.end.x, missile.end.y, missile.end.z], settings.height, i)
        const nextPosition = getParabolicPoint([missile.start.x, missile.start.y, missile.start.z],
            [missile.end.x, missile.end.y, missile.end.z], settings.height, i + 0.1)

        const sphereWorldMatrix = utils.MakeWorld(position[0], position[1], position[2], 0, 0, 0, 0.01)
        drawModel(sphere, sphereWorldMatrix, viewMatrix, perspectiveMatrix)
        if (checkCollision(landscape.mesh, position, nextPosition) || position[1] < -0.2) {
            maxCompletion = i
            break
        }
    }
    if (checkCollision(landscape.mesh, position, nextPosition) || missile.completion > maxCompletion) {
        events.playing = false
        updateButtons()
    }
    const missileDirection = utils.normalizeVector3(utils.subVector(nextPosition, position))
    const missileWorldMatrix = utils.MakeWorldFromBetweenVectors(position[0], position[1], position[2], [0, 0, 1], missileDirection, 0.01)
    drawModel(missile.model1 ? missile1 : missile2, missileWorldMatrix, viewMatrix, perspectiveMatrix)
    drawModel(landscape, utils.MakeWorld(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1), viewMatrix, perspectiveMatrix)
    if (camera.lookAt) {
        const sphereWorldMatrix = utils.MakeWorld(camera.x, camera.y, camera.z, 0, 0, 0, 0.05)
        drawModel(sphere, sphereWorldMatrix, viewMatrix, perspectiveMatrix)
    }
    if (events.playing) missile.completion += (Date.now() - events.lastDrawTimestamp) / (1000.0 * settings.flightTime)
    events.lastDrawTimestamp = Date.now()

    statusUiUpdate(position, nextPosition, missileDirection)
    window.requestAnimationFrame(drawScene)
}

async function init() {
    const canvas = document.getElementById('canvas')
    gl = canvas.getContext('webgl2')
    registerListeners()
    if (!gl) {
        alert('GL context not opened')
        return
    }
    await utils.loadFiles(['shaders/vs.glsl', 'shaders/fs.glsl'], (text) => program = utils.createAndCompileShaders(gl, text))
    missile1 = await loadModel('missile1')
    missile2 = await loadModel('missile2')
    sphere = await loadModel('sphere')
    landscape = await loadModel('landscape')
    await main()
    $('body').removeClass('loading')
}

window.onload = init