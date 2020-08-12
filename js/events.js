let mouseDown = false, invalidateClick = false, lastMouseX = -100, lastMouseY = -100, mouseDownTimestamp = Date.now()

function registerListeners() {
    const canvas = document.getElementById('canvas')
    canvas.addEventListener('mousedown', onMouseDown, false)
    canvas.addEventListener('mouseup', onMouseUp, false)
    canvas.addEventListener('mousemove', onMouseMove, false)
    canvas.addEventListener('mousewheel', onMouseWheel, false)
    document.addEventListener('keypress', onKeyPress, false)
}

function onMouseDown(event) {
    mouseDown = true
    invalidateClick = false
    mouseDownTimestamp = Date.now()
    lastMouseX = event.pageX
    lastMouseY = event.pageY
}

function onMouseUp(event) {
    if (!invalidateClick && Date.now() - mouseDownTimestamp < 500) {
        const x = 2 * event.pageX / gl.canvas.width - 1.0, y = -2 * event.pageY / gl.canvas.height + 1.0
        const point = unprojectScreenPoint(landscape.mesh, x, y)

        if (events.selecting) {
            if (events.selectingStart) {
                missile.start.x = point[0]
                missile.start.y = point[1]
                missile.start.z = point[2]
            } else {
                missile.end.x = point[0]
                missile.end.y = point[1]
                missile.end.z = point[2]
            }
            events.computeMax = true
            events.selecting = false
            updateButtons()
        }
    }
    lastMouseX = -100
    lastMouseY = -100
    mouseDown = false
}

function onMouseMove(event) {
    const canvas = document.getElementById('canvas')
    if (mouseDown) {
        invalidateClick = true
        const dx = event.pageX - lastMouseX
        const dy = lastMouseY - event.pageY
        if (event.pageX <= canvas.clientWidth) {
            camera.angle += 0.5 * dx
            camera.elevation += 0.5 * dy
        }
        lastMouseX = event.pageX
        lastMouseY = event.pageY
    }
}

function onMouseWheel(event) {
    event.preventDefault()
    if (camera.lookAt) camera.zoom = Math.max(camera.zoom - event.wheelDelta / 2000.0, 0.05)
}

function onKeyPress(event) {
    switch (event.key) {
        case 'w':
        case 'W':
            camera.x += camera.lookAt ? 0.0 : 0.1
            break
        case 's':
        case 'S':
            camera.x -= camera.lookAt ? 0.0 : 0.1
            break
        case 'a':
        case 'A':
            camera.z -= camera.lookAt ? 0.0 : 0.1
            break
        case 'd':
        case 'D':
            camera.z += camera.lookAt ? 0.0 : 0.1
            break
        case 'q':
        case 'Q':
            camera.y -= camera.lookAt ? 0.0 : 0.1
            break
        case 'e':
        case 'E':
            camera.y += camera.lookAt ? 0.0 : 0.1
            break
    }
}

function setTexture(texture) {
    missile.model1 = texture
}

function setCamera(camera1) {
    camera.lookAt = camera1
}

function toggleStartPoint() {
    events.selecting = !(events.selecting && events.selectingStart)
    events.selectingStart = true
    updateButtons()
}

function toggleEndPoint() {
    events.selecting = !(events.selecting && !events.selectingStart)
    events.selectingStart = false
    updateButtons()
}

function updateButtons() {
    const startButton = $('#start-point')
    startButton.attr('class', events.selecting && events.selectingStart ? 'btn btn-danger' : 'btn btn-success')
    startButton.text(events.selecting && events.selectingStart ? 'Stop' : 'Set')
    const endButton = $('#end-point')
    endButton.attr('class', events.selecting && !events.selectingStart ? 'btn btn-danger' : 'btn btn-success')
    endButton.text(events.selecting && !events.selectingStart ? 'Stop' : 'Set')
    const playButton = $('#play')
    playButton.attr('class', events.playing ? 'btn btn-danger btn-lg' : 'btn btn-success btn-lg')
    playButton.text(events.playing ? 'Stop' : 'Play')
}

function play() {
    events.selecting = false
    events.playing = !events.playing
    updateButtons()
}

function reset() {
    events.playing = false
    missile.completion = 0.005
    updateButtons()
}

function flightTimeChanged() {
    settings.flightTime = $('#flight-time').val()
}

function heightChanged() {
    settings.height = $('#height').val()
    events.computeMax = true
}

function statusUiUpdate(position, direction) {
    const missileAngle = utils.cartesianToSpherical(direction)

    $('#missile-x').text(position[0].toFixed(2))
    $('#missile-y').text(position[1].toFixed(2))
    $('#missile-z').text(position[2].toFixed(2))

    $('#missile-phi').text(utils.radToDeg(missileAngle.phi).toFixed(1))
    $('#missile-theta').text(utils.radToDeg(missileAngle.theta).toFixed(1))
    $('#missile-completion').text((missile.completion * 100).toFixed(1))

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