const lights = {
    x: 0.0, y: 0.0, z: 0.0,
    theta: 0.0, phi: 0.0, decay: 0.0,
    coneIn: 0.0, coneOut: 0.0,
    lightType: 0
}

function setDirectLight() {
    lights.lightType = 0
    $('#point-pane').fadeOut()
    $("#spot-pane").fadeOut(300, () => $('#direct-pane').fadeIn(300))
}

function setSpotLight() {
    lights.lightType = 1
    $('#point-pane').fadeOut(300)
    $("#direct-pane").fadeOut(300, () => $('#spot-pane').fadeIn(300))
}

function setPointLight() {
    lights.lightType = 2
    $('#spot-pane').fadeOut(300)
    $("#direct-pane").fadeOut(300, () => $('#point-pane').fadeIn(300))
}


//___---___--



// can be [1,0,0,0] for direct or [0,1,0,0] for point
let lightType = [[1,0,0,0], [0,0,0,0]];
//each element can be between -250 till 250 we have this for point
let lightPositionX = [0,0];
let lightPositionY = [0,0];
let lightPositionZ = [0,0];

// can be between -180 til 180 we have this for direct
let lightDirTheta = [90,90];
let lightDirPhi = [90,90];

// Decay factor can be between 0,2
let lightDecay = [0,0];

// for light color any hex value which is string is acceptable
//be careful we are using in different places the value of this color that is why the color
//is so dense take a look at prof coding everything will be more clear this color is for now

let lightsColor = ["ffffff","ffffff"];
let ambientLightColor = "ffffff";
let diffuseColor = "ffffff";
let specularColor = "ffffff";
let ambientMatColor = "ffffff";


let SpecShine = 200;
function unifPar(pHTML, pGLSL, type) {
    this.pHTML = pHTML;
    this.pGLSL = pGLSL;
    this.type = type;
}
function valType(gl) {
    let v = []
    if (this.pHTML == "LBlightType") {
        v = lightType[1];
    } else {
        v = lightType[0];
    }

    gl.uniform4f(program[this.pGLSL+"Uniform"], v[0], v[1], v[2], v[3]);
}
function valVec3(gl) {
    let lightPositionXs;
    let lightPositionYs;
    let lightPositionZs;
    if (this.pHTML == "LBPos") {
        lightPositionXs = lightPositionX[1];
        lightPositionYs = lightPositionY[1];
        lightPositionZs = lightPositionZ[1];
    } else {
        lightPositionXs = lightPositionX[0];
        lightPositionYs = lightPositionY[0];
        lightPositionZs = lightPositionZ[0];
    }
    let pointLight = [lightPositionXs, lightPositionYs, lightPositionZs]
    // translate to camera space
    //they are usually expressed in the world space
    // we have scaling so we need inverse transpose
    // the light is not changing so we do it once
    // we just pass the transformed light
    let lightPosMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
    let lightPositionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightPosMatrix),pointLight);
    gl.uniform3fv(program[this.pGLSL+"Uniform"],
        lightPositionTransformed)
}
function valDir(gl) {
    let t;
    let p;
    if (this.pHTML == "LBDir") {

        t = utils.degToRad(lightDirTheta[1]);
        p = utils.degToRad(lightDirPhi[1]);
    } else  {
        t = utils.degToRad(lightDirTheta[0]);
        p = utils.degToRad(lightDirPhi[0]);
    }    let directionalLight = [Math.sin(t)*Math.sin(p),
        Math.cos(t),
        Math.sin(t)*Math.cos(p)
    ];

    // translate to camera space
    //they are usually expressed in the world space
    // we have scaling so we need inverse transpose
    // the light is not changing so we do it once
    // we just pass the transformed light
    let lightDirMatrix = utils.invertMatrix(utils.transposeMatrix(viewWorldMatrix));
    let lightDirectionTransformed = utils.multiplyMatrix3Vector3(utils.sub3x3from4x4(lightDirMatrix),directionalLight);

    gl.uniform3fv(program[this.pGLSL+"Uniform"],lightDirectionTransformed);
}

function val(gl) {
    let value;
    if (this.pHTML == "LBDecay") {
        value = lightDecay[1];

    } else if (this.pHTML == "LADecay") {
        value = lightDecay[0];
    } else {
        value = SpecShine
    }

    gl.uniform1f(program[this.pGLSL+"Uniform"], value);
}

function valCol(gl) {
    let lightColor = "fffffff";
    if (this.pHTML == "LBlightColor"){
        lightColor = lightsColor[1];

    } else if (this.pHTML == "LAlightColor") {
        lightColor = lightsColor[0];
    }else if (this.pHTML == "ambientLightColor") {
        lightColor = ambientLightColor;
    } else if (this.pHTML == "diffuseColor") {
        lightColor = diffuseColor;
    } else if (this.pHTML == "specularColor")
    {
        lightColor = specularColor;
    } else {
        lightColor = ambientMatColor;
    }
    let col = lightColor;
    let R = parseInt(col.substring(0,2) ,16) / 255;
    let G = parseInt(col.substring(2,4) ,16) / 255;
    let B = parseInt(col.substring(4,6) ,16) / 255;
    gl.uniform4f(program[this.pGLSL+"Uniform"], R, G, B, 1);
}

unifParArray =[

    new unifPar("LAlightType","LAlightType", valType),
    new unifPar("LAPos","LAPos", valVec3),
    new unifPar("LADir","LADir", valDir),
    new unifPar("LADecay","LADecay", val),
    new unifPar("LAlightColor","LAlightColor", valCol),

    new unifPar("LBlightType","LBlightType", valType),
    new unifPar("LBPos","LBPos", valVec3),
    new unifPar("LBDir","LBDir", valDir),
    new unifPar("LADecay","LADecay", val),
    new unifPar("LBlightColor","LBlightColor", valCol),

    new unifPar("ambientLightColor","ambientLightColor", valCol),
    new unifPar("diffuseColor","diffuseColor", valCol),
    new unifPar("specularColor","specularColor", valCol),
    new unifPar("ambientMatColor","ambientMatColor", valCol),
    new unifPar("SpecShine","SpecShine", val),
];


function changeLightColor() {
    lightsColor[getLightType()] = getColorNumber($('#light-color').val())
}

function setAmbientLightColor() {
    ambientLightColor = getColorNumber($('#ambient-color').val())
}

function setDiffuseColor() {
    diffuseColor = getColorNumber($('#diffuse-color').val())
}

function setSpecularColor() {
    specularColor = getColorNumber($('#specular-color').val())
}

function setAmbientMatColor() {
    ambientMatColor = getColorNumber($('#ambient-mat-color').val())
}

function setSpecShine() {
    SpecShine = $('#specular-shiny').val()
}

function changeLightPositionPoint() {
    lightPositionX[getLightType()] = $("#point-light-position-x").val();
    lightPositionY[getLightType()] = $("#point-light-position-y").val();
    lightPositionZ[getLightType()] = $("#point-light-position-z").val();
}

function changeLightPositionDirect() {

    lightDirPhi[getLightType()] = $("#direct-light-position-phi").val();
    lightDirTheta[getLightType()] = $("#direct-light-position-theta").val();
}

let lastLightTypeSelected = 0;

function changeToDirectLight() {
    $("#point-pane").slideUp();
    setTimeout(function () {
        $("#direct-pane").slideDown()
    }, 500);

    lastLightTypeSelected = 0;
    if(getLightEnableStatus()) {
        lightType[getLightType()] = [1, 0 , 0, 0];
    } else {
        lightType[getLightType()] = [0, 0 , 0, 0];
    }
    // lastLightType = [1, 0, 0, 0];
    // getLightsArray();

}

function changeToPointLight() {
    $("#direct-pane").slideUp();
    setTimeout(function () {
        $("#point-pane").slideDown()
    }, 500);

    lastLightTypeSelected = 1;
    if(getLightEnableStatus()) {
        lightType[getLightType()] = [0, 1 , 0, 0];
    } else {
        lightType[getLightType()] = [0, 0 , 0, 0];
    }
    // lastLightType = [0, 1, 0, 0];
    // getLightsArray();

}

function changeLightDecay() {
    lightDecay[getLightType()] = $("#light-decay").val();
}


function getLightType() {
    return $("#light-selector").val();
}

function lightEnableChange() {
    getLightsArray();
}

function getLightEnableStatus() {
    return $("#enable-checkbox").prop("checked")
}


function setLightEnableState(state) {
    $("#enable-checkbox").prop("checked", state)
}

function getLightsArray() {
    if (getLightEnableStatus()) {
        switch (lastLightTypeSelected) {
            case 0:
                lightType[getLightType()] = [1, 0, 0, 0];
                break;
            case 1:
                lightType[getLightType()] = [0, 1, 0, 0];
                break;
        }

    } else {
        lightType[getLightType()] = [0, 0, 0, 0];
    }
}

function getColorNumber(color) {
    return color.substr(1);
}

function restoreLightParameters(lightNo) {
    // restore the light color
    $('#light-color').val(`#${lightsColor[lightNo]}`);

    // direction of the point light
    $("#point-light-position-x").val(lightPositionX[lightNo]);
    $("#point-light-position-y").val(lightPositionY[lightNo]);
    $("#point-light-position-z").val(lightPositionZ[lightNo]);

    // fdecay of point light
    $("#light-decay").val(lightDecay[lightNo]);

    // direction of the direct light
    $("#direct-light-position-phi").val(lightDirPhi[lightNo]);
    $("#direct-light-position-theta").val(lightDirTheta[lightNo]);

    // restore the enable checkbox and light type
    console.log(lightNo, lightType[lightNo]);
    if ((lightType[lightNo][0] + lightType[lightNo][1]) === 0) {
        setLightEnableState(false);

    } else if (lightType[lightNo][0] === 1) {
        setLightEnableState(true);

        if(lastLightTypeSelected === 1) {
            changeToDirectLight();

            $("#direct-light").prop("checked", true);
            $("#direct-light").parent().addClass("active");

            $("#point-light").prop("checked", false);
            $("#point-light").parent().removeClass("active");
        }

    } else if (lightType[lightNo][1] === 1) {
        setLightEnableState(true);

        $("#direct-light").prop("checked", false);
        $("#direct-light").parent().removeClass("active");

        $("#point-light").prop("checked", true);
        $("#point-light").parent().addClass("active");

        if(lastLightTypeSelected === 0) {
            changeToPointLight();
        }
    }
}