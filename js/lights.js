const lights = {
    lightType: [1, 0, 0], shiny: 200.0, tMix: 1.0,
    direct: {
        theta: 6.28, phi: 0.0
    },
    point: {
        x: -0.1, y: 1.4, z: 0.8, decay: 0.0
    },
    spot: {
        x: -1.3, y: 0.9, z: 3.0, decay: 0.0,
        theta: 1.44, phi: 1.51,
        coneIn: 60.0, coneOut: 150.0
    },
    colors: {
        light: '#ffffff',
        ambient: '#000000',
        diffuse: '#ffffff',
        material: '#ffffff',
        specular: '#ffffff'
    }
}

function setUniforms() {
    gl.uniform4f(gl.getUniformLocation(program, 'LAlightType'), lights.lightType[0], lights.lightType[1], lights.lightType[2], 0)
    if (lights.lightType[1] === 1) gl.uniform3f(gl.getUniformLocation(program, 'LAPos'), lights.point.x, lights.point.y, lights.point.z)
    else if (lights.lightType[2] === 1) gl.uniform3f(gl.getUniformLocation(program, 'LAPos'), lights.spot.x, lights.spot.y, lights.spot.z)
    if (lights.lightType[0] === 1)
        gl.uniform3f(gl.getUniformLocation(program, 'LADir'), Math.sin(lights.direct.theta) * Math.sin(lights.direct.phi),
            Math.cos(lights.direct.theta),
            Math.sin(lights.direct.theta) * Math.cos(lights.direct.phi))
    else if (lights.lightType[2] === 1)
        gl.uniform3f(gl.getUniformLocation(program, 'LADir'), Math.sin(lights.spot.theta) * Math.sin(lights.spot.phi),
            Math.cos(lights.spot.theta),
            Math.sin(lights.spot.theta) * Math.cos(lights.spot.phi))
    gl.uniform1f(gl.getUniformLocation(program, 'LAConeOut'), lights.spot.coneOut)
    gl.uniform1f(gl.getUniformLocation(program, 'LAConeIn'), lights.spot.coneIn / 100.0)
    if (lights.lightType[1] === 1) gl.uniform1f(gl.getUniformLocation(program, 'LADecay'), lights.point.decay)
    else if (lights.lightType[2] === 1) gl.uniform1f(gl.getUniformLocation(program, 'LADecay'), lights.spot.decay)
    const lightColor = decodeColor(lights.colors.light)
    gl.uniform4f(gl.getUniformLocation(program, 'LAlightColor'), lightColor[0], lightColor[1], lightColor[2], 1)
    const ambientLightColor = decodeColor(lights.colors.ambient)
    gl.uniform4f(gl.getUniformLocation(program, 'ambientLightColor'), ambientLightColor[0], ambientLightColor[1], ambientLightColor[2], 1)
    const diffuseColor = decodeColor(lights.colors.diffuse)
    gl.uniform4f(gl.getUniformLocation(program, 'diffuseColor'), diffuseColor[0], diffuseColor[1], diffuseColor[2], 1)
    const specularColor = decodeColor(lights.colors.specular)
    gl.uniform4f(gl.getUniformLocation(program, 'specularColor'), specularColor[0], specularColor[1], specularColor[2], 1)
    const ambientMatColor = decodeColor(lights.colors.material)
    gl.uniform4f(gl.getUniformLocation(program, 'ambientMatColor'), ambientMatColor[0], ambientMatColor[1], ambientMatColor[2], 1)
    gl.uniform1f(gl.getUniformLocation(program, 'SpecShine'), lights.shiny)
    gl.uniform1f(gl.getUniformLocation(program, 'DTexMix'), lights.tMix)
}

function decodeColor(colorString) {
    const color = colorString.substring(1, 7)
    return [parseInt(color.substring(0, 2), 16) / 255,
        parseInt(color.substring(2, 4), 16) / 255,
        parseInt(color.substring(4, 6), 16) / 255]
}

//SETTERS

function setDirectLight() {
    lights.lightType = [1, 0, 0]
    $('#point-pane').hide()
    $('#spot-pane').hide()
    $('#direct-pane').show()
}

function setPointLight() {
    lights.lightType = [0, 1, 0]
    $('#point-pane').show()
    $('#spot-pane').hide()
    $('#direct-pane').hide()
}

function setSpotLight() {
    lights.lightType = [0, 0, 1]
    $('#point-pane').hide()
    $('#spot-pane').show()
    $('#direct-pane').hide()
}

function changeDirectLight() {
    lights.direct.phi = utils.degToRad($('#direct-light-position-phi').val())
    lights.direct.theta = utils.degToRad($('#direct-light-position-theta').val())
}

function changePointLight() {
    lights.point.x = $('#point-light-position-x').val()
    lights.point.y = $('#point-light-position-y').val()
    lights.point.z = $('#point-light-position-z').val()
    lights.point.decay = $('#point-light-decay').val()
}

function changeSpotLight() {
    lights.spot.x = $('#spot-light-position-x').val()
    lights.spot.y = $('#spot-light-position-y').val()
    lights.spot.z = $('#spot-light-position-z').val()
    lights.spot.decay = $('#spot-light-decay').val()
    lights.spot.phi = utils.degToRad($('#spot-light-position-phi').val())
    lights.spot.theta = utils.degToRad($('#spot-light-position-theta').val())
    lights.spot.coneIn = $('#spot-light-cone-in').val()
    lights.spot.coneOut = $('#spot-light-cone-out').val()
}

function setColor() {
    lights.colors.light = $('#light-color').val()
    lights.colors.ambient = $('#ambient-color').val()
    lights.colors.diffuse = $('#diffuse-color').val()
    lights.colors.material = $('#ambient-mat-color').val()
    lights.colors.specular = $('#specular-color').val()
}

function setSpecShine() {
    lights.shiny = $('#specular-shiny').val()
}

function setTextureMix() {
    lights.tMix = $('#texture-mix').val()
}