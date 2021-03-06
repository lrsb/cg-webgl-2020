async function loadModel(modelName) {
    const mesh = new OBJ.Mesh(await utils.get_objstr('models/' + modelName + '/model.obj'))

    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    program.vertexPositionAttribute = gl.getAttribLocation(program, 'in_position')
    gl.enableVertexAttribArray(program.vertexPositionAttribute)
    program.vertexNormalAttribute = gl.getAttribLocation(program, 'in_normal')
    gl.enableVertexAttribArray(program.vertexNormalAttribute)
    program.textureCoordAttribute = gl.getAttribLocation(program, 'in_uv')
    gl.enableVertexAttribArray(program.textureCoordAttribute)

    OBJ.initMeshBuffers(gl, mesh)

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer)
    gl.vertexAttribPointer(program.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0)

    if (!mesh.textures.length) {
        gl.disableVertexAttribArray(program.textureCoordAttribute)
    } else {
        gl.enableVertexAttribArray(program.textureCoordAttribute)
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer)
        gl.vertexAttribPointer(program.textureCoordAttribute, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer)
    gl.vertexAttribPointer(program.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    const textureImage = new Image()
    textureImage.src = 'models/' + modelName + '/texture.png'
    events.onLoad++
    textureImage.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.bindTexture(gl.TEXTURE_2D, null)
        events.onLoad--
        if (!events.onLoad) $('body').removeClass('loading')
    }
    return {vao, mesh, texture}
}

function drawModel(model, worldMatrix, cm, fillColor, ignoreAmbient) {
    const viewWorldMatrix = utils.multiplyMatrices(cm.viewMatrix, worldMatrix)
    const projectionMatrix = utils.multiplyMatrices(cm.perspectiveMatrix, viewWorldMatrix)

    gl.uniform3f(gl.getUniformLocation(program, 'eyePos'), cm.cameraPosition[0], cm.cameraPosition[1], cm.cameraPosition[2])
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'wo_matrix'), gl.FALSE, utils.transposeMatrix(utils.invertMatrix(worldMatrix)))
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'w_matrix'), gl.FALSE, worldMatrix)
    gl.uniformMatrix4fv(gl.getUniformLocation(program, 'matrix'), gl.FALSE, utils.transposeMatrix(projectionMatrix))

    fillColor = fillColor == null ? [0, 0, 0, 0] : [fillColor[0], fillColor[1], fillColor[2], ignoreAmbient ? 1.0 : 0.5]
    gl.uniform4f(gl.getUniformLocation(program, 'fillColor'), fillColor[0], fillColor[1], fillColor[2], fillColor[3])

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, model.texture)

    gl.bindVertexArray(model.vao)
    gl.drawElements(gl.TRIANGLES, model.mesh.indices.length, gl.UNSIGNED_SHORT, 0)
}