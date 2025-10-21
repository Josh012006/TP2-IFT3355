/**
*	[NOM: MONGAN]
*	[PRÉNOM: Josué]
*	[MATRICULE: 20290870]
*/

import * as THREE from 'three';

import Stats from './libs/stats.module.js';

import { ColladaLoader } from 'ColladaLoader';

import { OrbitControls } from 'OrbitControls'

//SPECIAL IMPORT
// THREEx.KeyboardState.js keep the current state of the keyboard.
// It is possible to query it at any time. No need of an event.
// This is particularly convenient in loop driven case, like in
// 3D demos or games.
//
// # Usage
//
// **Step 1**: Create the object
//
// ```var keyboard	= new THREEx.KeyboardState();```
//
// **Step 2**: Query the keyboard state
//
// This will return true if shift and A are pressed, false otherwise
//
// ```keyboard.pressed("shift+A")```
//
// **Step 3**: Stop listening to the keyboard
//
// ```keyboard.destroy()```
//
// NOTE: this library may be nice as standaline. independant from three.js
// - rename it keyboardForGame
//
// # Code
//

/** @namespace */
var THREEx = THREEx || {};

/**
 * - NOTE: it would be quite easy to push event-driven too
 *   - microevent.js for events handling
 *   - in this._onkeyChange, generate a string from the DOM event
 *   - use this as event name
 */
THREEx.KeyboardState = function (domElement) {
    this.domElement = domElement || document;
    // to store the current state
    this.keyCodes = {};
    this.modifiers = {};

    // create callback to bind/unbind keyboard events
    var _this = this;
    this._onKeyDown = function (event) {
        _this._onKeyChange(event)
    }
    this._onKeyUp = function (event) {
        _this._onKeyChange(event)
    }

    // bind keyEvents
    this.domElement.addEventListener("keydown", this._onKeyDown, false);
    this.domElement.addEventListener("keyup", this._onKeyUp, false);

    // create callback to bind/unbind window blur event
    this._onBlur = function () {
        for (var prop in _this.keyCodes)
            _this.keyCodes[prop] = false;
        for (var prop in _this.modifiers)
            _this.modifiers[prop] = false;
    }

    // bind window blur
    window.addEventListener("blur", this._onBlur, false);
}

/**
 * To stop listening of the keyboard events
 */
THREEx.KeyboardState.prototype.destroy = function () {
    // unbind keyEvents
    this.domElement.removeEventListener("keydown", this._onKeyDown, false);
    this.domElement.removeEventListener("keyup", this._onKeyUp, false);

    // unbind window blur event
    window.removeEventListener("blur", this._onBlur, false);
}

THREEx.KeyboardState.MODIFIERS = ['shift', 'ctrl', 'alt', 'meta'];
THREEx.KeyboardState.ALIAS = {
    'left': 37,
    'up': 38,
    'right': 39,
    'down': 40,
    'space': 32,
    'pageup': 33,
    'pagedown': 34,
    'tab': 9,
    'escape': 27
};

/**
 * to process the keyboard dom event
 */
THREEx.KeyboardState.prototype._onKeyChange = function (event) {
    // log to debug
    //console.log("onKeyChange", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)

    // update this.keyCodes
    var keyCode = event.keyCode
        var pressed = event.type === 'keydown' ? true : false
        this.keyCodes[keyCode] = pressed
        // update this.modifiers
        this.modifiers['shift'] = event.shiftKey
        this.modifiers['ctrl'] = event.ctrlKey
        this.modifiers['alt'] = event.altKey
        this.modifiers['meta'] = event.metaKey
}

/**
 * query keyboard state to know if a key is pressed of not
 *
 * @param {String} keyDesc the description of the key. format : modifiers+key e.g shift+A
 * @returns {Boolean} true if the key is pressed, false otherwise
 */
THREEx.KeyboardState.prototype.pressed = function (keyDesc) {
    var keys = keyDesc.split("+");
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
            var pressed = false
            if (THREEx.KeyboardState.MODIFIERS.indexOf(key) !== -1) {
                pressed = this.modifiers[key];
            } else if (Object.keys(THREEx.KeyboardState.ALIAS).indexOf(key) != -1) {
                pressed = this.keyCodes[THREEx.KeyboardState.ALIAS[key]];
            } else {
                pressed = this.keyCodes[key.toUpperCase().charCodeAt(0)]
            }
            if (!pressed)
                return false;
    };
    return true;
}

/**
 * return true if an event match a keyDesc
 * @param  {KeyboardEvent} event   keyboard event
 * @param  {String} keyDesc string description of the key
 * @return {Boolean}         true if the event match keyDesc, false otherwise
 */
THREEx.KeyboardState.prototype.eventMatches = function (event, keyDesc) {
    var aliases = THREEx.KeyboardState.ALIAS
        var aliasKeys = Object.keys(aliases)
        var keys = keyDesc.split("+")
        // log to debug
        // console.log("eventMatches", event, event.keyCode, event.shiftKey, event.ctrlKey, event.altKey, event.metaKey)
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var pressed = false;
            if (key === 'shift') {
                pressed = (event.shiftKey ? true : false)
            } else if (key === 'ctrl') {
                pressed = (event.ctrlKey ? true : false)
            } else if (key === 'alt') {
                pressed = (event.altKey ? true : false)
            } else if (key === 'meta') {
                pressed = (event.metaKey ? true : false)
            } else if (aliasKeys.indexOf(key) !== -1) {
                pressed = (event.keyCode === aliases[key] ? true : false);
            } else if (event.keyCode === key.toUpperCase().charCodeAt(0)) {
                pressed = true;
            }
            if (!pressed)
                return false;
        }
        return true;
}

let container, stats, clock, controls;
let lights, camera, scene, renderer, human, humanGeometry, humanMaterial, humanMesh, robot;
let skinWeight, skinIndices, boneArray, realBones, boneDict, centerOfMass;

THREE.Object3D.prototype.setMatrix = function (m) {
    this.matrixAutoUpdate = false;
    this.matrix.copy(m);
    this.matrix.decompose(this.position, this.quaternion, this.scale);
};


class Robot {
    constructor(h) {
        this.spineLength = 0.65305;
		this.chestLength = 0.46487;
		this.neckLength = 0.24523
		this.headLength = 0.39284;

		this.armLength = 0.72111;
		this.forearmLength = 0.61242;
		this.legLength = 1.16245;
		this.shinLength = 1.03432;

		this.armLeftRotation = realBones[4].rotation;
		this.forearmLeftRotation = realBones[5].rotation;
		this.armRightRotation  = realBones[6].rotation;
		this.forearmRightRotation = realBones[7].rotation;

		this.legLeftRotation = realBones[8].rotation;
		this.shinLeftRotation = realBones[9].rotation;
		this.legRightRotation = realBones[10].rotation;
		this.shinRightRotation = realBones[11].rotation;

		this.spineTranslation = realBones[0].position;
		this.chestTranslation = realBones[1].position;
		this.neckTranslation = realBones[2].position;
		this.headTranslation = realBones[3].position;

		this.armLeftTranslation = realBones[4].position;
		this.forearmLeftTranslation =  realBones[5].position;
		this.armRightTranslation  = realBones[6].position;
		this.forearmRightTranslation = realBones[7].position;

		this.legLeftTranslation =  realBones[8].position;
		this.shinLeftTranslation =  realBones[9].position;
		this.legRightTranslation=  realBones[10].position;
		this.shinRightTranslation =  realBones[11].position;


        this.bodyWidth = 0.2;
        this.bodyDepth = 0.2;


        this.neckRadius = 0.1;

        this.headRadius = 0.32;


        this.legRadius = 0.10;
        this.thighRadius = 0.1;
        this.footDepth = 0.4;
        this.footWidth = 0.25;

        this.armRadius = 0.10;

        this.handRadius = 0.1;

        // Helper for animation  
        this.animationStart = true;
        this.turningStart = true;
        this.armLeftDirection = 1;

        // Material
        this.material = new THREE.MeshNormalMaterial();
        this.human = h;
        // Initial pose
        this.initialize()
    }

    initialize() {
        // Spine geomerty
        var spineGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2,this.spineLength, 64);
        if (!this.hasOwnProperty("spine"))
            this.spine = new THREE.Mesh(spineGeometry, this.material);

		var chestGeometry = new THREE.CylinderGeometry(0.5*this.bodyWidth / 2, this.bodyWidth / 2, this.chestLength, 64);
		if (!this.hasOwnProperty("chest"))
            this.chest = new THREE.Mesh(chestGeometry, this.material);

        // Neck geomerty
        var neckGeometry = new THREE.CylinderGeometry(0.5*this.neckRadius, this.neckRadius, this.neckLength, 64);
        if (!this.hasOwnProperty("neck"))
            this.neck = new THREE.Mesh(neckGeometry, this.material);

        // Head geomerty
        var headGeometry = new THREE.SphereGeometry(this.headLength/2, 64, 3);
        if (!this.hasOwnProperty("head"))
            this.head = new THREE.Mesh(headGeometry, this.material);

        // ArmLeft geometry
        var armLeftGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.armLength, 64);
		if (!this.hasOwnProperty("armLeft"))
            this.armLeft = new THREE.Mesh(armLeftGeometry, this.material);

        // ArmRight geometry
        var armRightGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.armLength, 64);
		if (!this.hasOwnProperty("armRight"))
            this.armRight = new THREE.Mesh(armRightGeometry, this.material);

        // ForearmLeft geometry
        var forearmLeftGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.forearmLength, 64);
		if (!this.hasOwnProperty("forearmLeft"))
            this.forearmLeft = new THREE.Mesh(forearmLeftGeometry, this.material);

        // ForearmLeft geometry
        var forearmRightGeometry = new THREE.CylinderGeometry(0.5*this.armRadius, this.armRadius, this.forearmLength, 64);
		if (!this.hasOwnProperty("forearmRight"))
            this.forearmRight = new THREE.Mesh(forearmRightGeometry, this.material);

        // HandLeft geometry
        var handLeftGeometry = new THREE.SphereGeometry(this.handRadius);
        if (!this.hasOwnProperty("handLeft"))
            this.handLeft = new THREE.Mesh(handLeftGeometry, this.material);

        // HandRight geometry
        var handRightGeometry = new THREE.SphereGeometry(this.handRadius);
        if (!this.hasOwnProperty("handRight"))
            this.handRight = new THREE.Mesh(handRightGeometry, this.material);

        // LegLeft geometry
        var legLeftGeometry = new THREE.CylinderGeometry(0.5*this.thighRadius, this.thighRadius, this.legLength, 64);
		if (!this.hasOwnProperty("legLeft"))
            this.legLeft = new THREE.Mesh(legLeftGeometry, this.material);

        // LegRight geometry
        var legRightGeometry = new THREE.CylinderGeometry(0.5*this.thighRadius, this.thighRadius, this.legLength, 64);
		if (!this.hasOwnProperty("legRight"))
            this.legRight = new THREE.Mesh(legRightGeometry, this.material);

        // ShinLeft geometry
        var shinLeftGeometry = new THREE.CylinderGeometry(0.5*this.legRadius, this.legRadius, this.shinLength, 64);
		if (!this.hasOwnProperty("shinLeft"))
            this.shinLeft = new THREE.Mesh(shinLeftGeometry, this.material);

        // ShinRight geometry
        var shinRightGeometry = new THREE.CylinderGeometry(0.5*this.legRadius, this.legRadius, this.shinLength, 64);
		if (!this.hasOwnProperty("shinRight"))
            this.shinRight = new THREE.Mesh(shinRightGeometry, this.material);

        // FootLeft geometry
        var footLeftGeometry = new THREE.BoxGeometry(this.footWidth, 0.1, this.footDepth);
        if (!this.hasOwnProperty("footLeft"))
            this.footLeft = new THREE.Mesh(footLeftGeometry, this.material);

        // FootRight geometry
        var footRightGeometry = new THREE.BoxGeometry(this.footWidth, 0.1, this.footDepth);
        if (!this.hasOwnProperty("footRight"))
            this.footRight = new THREE.Mesh(footRightGeometry, this.material);



        // Spine matrix
        this.spineMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.spineTranslation.y+this.spineLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        

        // Chest matrix
		var chestMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.chestTranslation.y-this.spineLength/2+this.chestLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
		chestMatrix =  new THREE.Matrix4().multiplyMatrices(this.spineMatrix, chestMatrix);
        this.chestMatrix = chestMatrix;


        // Neck matrix
        var neckMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.neckTranslation.y-this.chestLength/2+this.neckLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        neckMatrix = new THREE.Matrix4().multiplyMatrices(this.chestMatrix, neckMatrix);
        this.neckMatrix = neckMatrix;


        // Head matrix
        var headMatrix = new THREE.Matrix4().set(
                1, 0, 0, 0,
                0, 1, 0, this.headTranslation.y-this.neckLength/2+this.headLength/2,
                0, 0, 1, 0,
                0, 0, 0, 1);
        headMatrix = new THREE.Matrix4().multiplyMatrices(this.neckMatrix, headMatrix);
        this.headMatrix = headMatrix;
        
        // ArmLeft matrix
        var armLeftMatrix = translation(
            this.armLeftTranslation.x,
            this.armLeftTranslation.y - this.chestLength/2,
            0
        );
        armLeftMatrix = matMul(this.chestMatrix, armLeftMatrix);
        armLeftMatrix = matMul(armLeftMatrix, rotZ(-pi/2));
        armLeftMatrix = matMul(armLeftMatrix, translation(0, this.armLength/2, 0));
        this.armLeftMatrix = armLeftMatrix;

        // ForearmLeft matrix
        var forearmLeftMatrix = translation(
            0,
            this.forearmLeftTranslation.y - this.armLength/2 + this.forearmLength/2,
            0,
        );
        forearmLeftMatrix = matMul(this.armLeftMatrix, forearmLeftMatrix);
        this.forearmLeftMatrix = forearmLeftMatrix;

        // HandLeft matrix
        var handLeftMatrix = translation(
            0,
            this.forearmLength/2 + this.handRadius,
            0
        );
        handLeftMatrix = matMul(this.forearmLeftMatrix, handLeftMatrix);
        this.handLeftMatrix = handLeftMatrix;

        // ArmRight matrix
        var armRightMatrix = translation(
            this.armRightTranslation.x,
            this.armRightTranslation.y - this.chestLength/2,
            0
        );
        armRightMatrix = matMul(this.chestMatrix, armRightMatrix);
        armRightMatrix = matMul(armRightMatrix, rotZ(pi/2));
        armRightMatrix = matMul(armRightMatrix, translation(0, this.armLength/2, 0));
        this.armRightMatrix = armRightMatrix;

        // ForearmRight matrix
        var forearmRightMatrix = translation(
            0,
            this.forearmRightTranslation.y - this.armLength/2 + this.forearmLength/2,
            0,
        );
        forearmRightMatrix = matMul(this.armRightMatrix, forearmRightMatrix);
        this.forearmRightMatrix = forearmRightMatrix;

        // HandRight matrix
        var handRightMatrix = translation(
            0,
            this.forearmLength/2 + this.handRadius,
            0
        );
        handRightMatrix = matMul(this.forearmRightMatrix, handRightMatrix);
        this.handRightMatrix = handRightMatrix;

        // LegLeft matrix
        var legLeftMatrix = translation(
            this.legLeftTranslation.x,
            this.legLeftTranslation.y - this.spineLength/2,
            0
        );
        legLeftMatrix = matMul(this.spineMatrix, legLeftMatrix);
        legLeftMatrix = matMul(legLeftMatrix, rotZ(-pi));
        legLeftMatrix = matMul(legLeftMatrix, translation(0, this.legLength/2, 0));
        this.legLeftMatrix = legLeftMatrix;

        // ShinLeft matrix
        var shinLeftMatrix = translation(
            0,
            this.shinLeftTranslation.y - this.legLength/2 + this.shinLength/2,
            0,
        );
        shinLeftMatrix = matMul(this.legLeftMatrix, shinLeftMatrix);
        this.shinLeftMatrix = shinLeftMatrix;

        // FootLeft matrix
        var footLeftMatrix = translation(
            0,
            this.shinLength/2 + this.footWidth/2,
            0,
        );
        footLeftMatrix = matMul(this.shinLeftMatrix, footLeftMatrix);
        this.footLeftMatrix = footLeftMatrix;

        // LegRight matrix
        var legRightMatrix = translation(
            this.legRightTranslation.x,
            this.legRightTranslation.y - this.spineLength/2,
            0
        );
        legRightMatrix = matMul(this.spineMatrix, legRightMatrix);
        legRightMatrix = matMul(legRightMatrix, rotZ(pi));
        legRightMatrix = matMul(legRightMatrix, translation(0, this.legLength/2, 0));
        this.legRightMatrix = legRightMatrix;

        // ShinLeft matrix
        var shinRightMatrix = translation(
            0,
            this.shinRightTranslation.y - this.legLength/2 + this.shinLength/2,
            0,
        );
        shinRightMatrix = matMul(this.legRightMatrix, shinRightMatrix);
        this.shinRightMatrix = shinRightMatrix;

        // FootRight matrix
        var footRightMatrix = translation(
            0,
            this.shinLength/2 + this.footWidth/2,
            0,
        );
        footRightMatrix = matMul(this.shinRightMatrix, footRightMatrix);
        this.footRightMatrix = footRightMatrix;






        // Apply transformation
        this.spine.setMatrix(this.spineMatrix);
        if (scene.getObjectById(this.spine.id) === undefined)
            scene.add(this.spine);

		this.chest.setMatrix(this.chestMatrix);
        if (scene.getObjectById(this.chest.id) === undefined)
            scene.add(this.chest);

        this.neck.setMatrix(this.neckMatrix);
        if (scene.getObjectById(this.neck.id) === undefined)
            scene.add(this.neck);

        this.head.setMatrix(this.headMatrix);
        if (scene.getObjectById(this.head.id) === undefined)
            scene.add(this.head);

        this.armLeft.setMatrix(this.armLeftMatrix);
        if (scene.getObjectById(this.armLeft.id) === undefined)
            scene.add(this.armLeft);

        this.forearmLeft.setMatrix(this.forearmLeftMatrix);
        if (scene.getObjectById(this.forearmLeft.id) === undefined)
            scene.add(this.forearmLeft);

        this.handLeft.setMatrix(this.handLeftMatrix);
        if (scene.getObjectById(this.handLeft.id) === undefined)
            scene.add(this.handLeft);

        this.armRight.setMatrix(this.armRightMatrix);
        if (scene.getObjectById(this.armRight.id) === undefined)
            scene.add(this.armRight);

        this.forearmRight.setMatrix(this.forearmRightMatrix);
        if (scene.getObjectById(this.forearmRight.id) === undefined)
            scene.add(this.forearmRight);

        this.handRight.setMatrix(this.handRightMatrix);
        if (scene.getObjectById(this.handRight.id) === undefined)
            scene.add(this.handRight);

        this.legLeft.setMatrix(this.legLeftMatrix);
        if (scene.getObjectById(this.legLeft.id) === undefined)
            scene.add(this.legLeft);

        this.shinLeft.setMatrix(this.shinLeftMatrix);
        if (scene.getObjectById(this.shinLeft.id) === undefined)
            scene.add(this.shinLeft);

        this.footLeft.setMatrix(this.footLeftMatrix);
        if (scene.getObjectById(this.footLeft.id) === undefined)
            scene.add(this.footLeft);

        this.legRight.setMatrix(this.legRightMatrix);
        if (scene.getObjectById(this.legRight.id) === undefined)
            scene.add(this.legRight);

        this.shinRight.setMatrix(this.shinRightMatrix);
        if (scene.getObjectById(this.shinRight.id) === undefined)
            scene.add(this.shinRight);

        this.footRight.setMatrix(this.footRightMatrix);
        if (scene.getObjectById(this.footRight.id) === undefined)
            scene.add(this.footRight);

    }
    hideRobot() {
        this.spine.visible = false;
        this.chest.visible = false;
        this.neck.visible = false;
        this.head.visible = false;
        this.armLeft.visible = false;
        this.forearmLeft.visible = false;
        this.handLeft.visible = false;
        this.armRight.visible = false;
        this.forearmRight.visible = false;
        this.handRight.visible = false;
        this.legLeft.visible = false;
        this.shinLeft.visible = false;
        this.footLeft.visible = false;
        this.legRight.visible = false;
        this.shinRight.visible = false;
        this.footRight.visible = false;
    }
    hideHuman() {
        this.human.visible = false;
    }

    showRobot() {
        this.spine.visible = true;
        this.chest.visible = true;
        this.neck.visible = true;
        this.head.visible = true;
        this.armLeft.visible = true;
        this.forearmLeft.visible = true;
        this.handLeft.visible = true;
        this.armRight.visible = true;
        this.forearmRight.visible = true;
        this.handRight.visible = true;
        this.legLeft.visible = true;
        this.shinLeft.visible = true;
        this.footLeft.visible = true;
        this.legRight.visible = true;
        this.shinRight.visible = true;
        this.footRight.visible = true;
    }
    showHuman() {
        this.human.visible = true;
    }

	pose1(){
		// TODO DEFINIR LA PREMIERE POSE ICI
	}

	pose2(){
		// TODO DEFINIR LA DEUXIEME POSE ICI
	}

    animate(t) {
        // Positionner les membres dans une pose initiale de course
        var runArmLeftMatrix = matMul(this.armLeftMatrix, translation(0, -this.armLength/2, 0));
        runArmLeftMatrix = matMul(runArmLeftMatrix, rotZ(-pi/2));
        runArmLeftMatrix = matMul(runArmLeftMatrix, translation(0, this.armLength/2, 0));
        this.armLeft.setMatrix(runArmLeftMatrix);

        var runForearmLeftMatrix = matMul(invert(this.armLeftMatrix), this.forearmLeftMatrix);
        runForearmLeftMatrix = matMul(runArmLeftMatrix, runForearmLeftMatrix);
        runForearmLeftMatrix = matMul(runForearmLeftMatrix, translation(0, -this.forearmLength/2, 0));
        runForearmLeftMatrix = matMul(runForearmLeftMatrix, rotX(pi/2));
        runForearmLeftMatrix = matMul(runForearmLeftMatrix, translation(0, this.forearmLength/2, 0));
        this.forearmLeft.setMatrix(runForearmLeftMatrix);

        var runHandLeftMatrix = matMul(invert(this.forearmLeftMatrix), this.handLeftMatrix);
        runHandLeftMatrix = matMul(runForearmLeftMatrix, runHandLeftMatrix);
        this.handLeft.setMatrix(runHandLeftMatrix);
        
        var runArmRightMatrix = matMul(this.armRightMatrix, translation(0, -this.armLength/2, 0));
        runArmRightMatrix = matMul(runArmRightMatrix, rotZ(pi/2));
        runArmRightMatrix = matMul(runArmRightMatrix, translation(0, this.armLength/2, 0));
        this.armRight.setMatrix(runArmRightMatrix);

        var runForearmRightMatrix = matMul(invert(this.armRightMatrix), this.forearmRightMatrix);
        runForearmRightMatrix = matMul(runArmRightMatrix, runForearmRightMatrix);
        runForearmRightMatrix = matMul(runForearmRightMatrix, translation(0, -this.forearmLength/2, 0));
        runForearmRightMatrix = matMul(runForearmRightMatrix, rotX(pi/2));
        runForearmRightMatrix = matMul(runForearmRightMatrix, translation(0, this.forearmLength/2, 0));
        this.forearmRight.setMatrix(runForearmRightMatrix);

        var runHandRightMatrix = matMul(invert(this.forearmRightMatrix), this.handRightMatrix);
        runHandRightMatrix = matMul(runForearmRightMatrix, runHandRightMatrix);
        this.handRight.setMatrix(runHandRightMatrix);
        
    }

}

var keyboard = new THREEx.KeyboardState();
var channel = 'p';
var pi = Math.PI;

function init() {

    container = document.getElementById('container');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(8, 10, 8);
    camera.lookAt(0, 3, 0);

    scene = new THREE.Scene();
    scene.add(camera);

    controls = new OrbitControls(camera, container);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;

    clock = new THREE.Clock();

    boneDict = {}

    boneArray = new Float32Array(12 * 16);

    humanMaterial = new THREE.ShaderMaterial({
        uniforms: {
            bones: {
                value: boneArray
            }
        }
    });

    const shaderLoader = new THREE.FileLoader();
    shaderLoader.load('glsl/human.vs.glsl',
        function (data) {
        humanMaterial.vertexShader = data;
    })
    shaderLoader.load('glsl/human.fs.glsl',
        function (data) {
        humanMaterial.fragmentShader = data;
    })

    // loading manager

    const loadingManager = new THREE.LoadingManager(function () {
        scene.add(humanMesh);
    });

    // collada
    humanGeometry = new THREE.BufferGeometry();
    const loader = new ColladaLoader(loadingManager);
    loader.load('./model/human.dae', function (collada) {
		skinIndices = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinIndex.array;
        skinWeight = collada.library.geometries['human-mesh'].build.triangles.data.attributes.skinWeight.array;
		realBones = collada.library.nodes.human.build.skeleton.bones;

        buildSkeleton();
        buildShaderBoneMatrix();
        humanGeometry.setAttribute('position', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.position.array, 3));
        humanGeometry.setAttribute('skinWeight', new THREE.BufferAttribute(skinWeight, 4));
        humanGeometry.setAttribute('skinIndex', new THREE.BufferAttribute(skinIndices, 4));
        humanGeometry.setAttribute('normal', new THREE.BufferAttribute(collada.library.geometries['human-mesh'].build.triangles.data.attributes.normal.array, 3));

        humanMesh = new THREE.Mesh(humanGeometry, humanMaterial);
        robot = new Robot(humanMesh);
        robot.hideHuman();

    });

    //

    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0).normalize();
    scene.add(directionalLight);

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    //

    window.addEventListener('resize', onWindowResize);
    lights = [];
    lights[0] = new THREE.PointLight(0xffffff, 1, 0);
    lights[1] = new THREE.PointLight(0xffffff, 1, 0);
    lights[2] = new THREE.PointLight(0xffffff, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set( - 100,  - 200,  - 100);

    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    var floorTexture = new THREE.TextureLoader().load('textures/hardwood2_diffuse.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);

    var floorMaterial = new THREE.MeshBasicMaterial({
        map: floorTexture,
        side: THREE.DoubleSide
    });
    var floorGeometry = new THREE.PlaneGeometry(30, 30);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y -= 2.5;
    scene.add(floor);

}


function buildSkeleton() {
	boneDict["Spine"] = new THREE.Bone();
	boneDict["Chest"] = new THREE.Bone();
	boneDict["Neck"] = new THREE.Bone();
	boneDict["Head"] = new THREE.Bone();
	boneDict["Arm_L"] = new THREE.Bone();
	boneDict["Forearm_L"] = new THREE.Bone();
	boneDict["Arm_R"] = new THREE.Bone();
	boneDict["Forearm_R"] = new THREE.Bone();
	boneDict["Leg_L"] = new THREE.Bone();
	boneDict["Shin_L"] = new THREE.Bone();
	boneDict["Leg_R"] = new THREE.Bone();
	boneDict["Shin_R"] = new THREE.Bone();

 	boneDict['Chest'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[1].matrix);
	boneDict['Neck'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[2].matrix);
	boneDict['Head'].matrixWorld = matMul(boneDict['Neck'].matrixWorld, realBones[3].matrix);
	boneDict['Arm_L'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[4].matrix);
	boneDict['Forearm_L'].matrixWorld = matMul(boneDict['Arm_L'].matrixWorld, realBones[5].matrix);
	boneDict['Arm_R'].matrixWorld = matMul(boneDict['Chest'].matrixWorld, realBones[6].matrix);
	boneDict['Forearm_R'].matrixWorld = matMul(boneDict['Arm_R'].matrixWorld, realBones[7].matrix);
	boneDict['Leg_L'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[8].matrix);
	boneDict['Shin_L'].matrixWorld = matMul(boneDict['Leg_L'].matrixWorld, realBones[9].matrix);
	boneDict['Leg_R'].matrixWorld = matMul(boneDict['Spine'].matrixWorld, realBones[10].matrix);
	boneDict['Shin_R'].matrixWorld = matMul(boneDict['Leg_R'].matrixWorld, realBones[11].matrix);

}

/**
* Fills the Float32Array boneArray with the bone matrices to be passed to
* the vertex shader
*/
function buildShaderBoneMatrix() {
    var c = 0;
    for (var key in boneDict) {
        for (var i = 0; i < 16; i++) {
            boneArray[c++] = boneDict[key].matrix.elements[i];
        }
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    checkKeyboard();

    updateBody();
    requestAnimationFrame(animate);
    render();
    stats.update();

}

function render() {

    const delta = clock.getDelta();

    renderer.render(scene, camera);

}

/**
* Returns a new Matrix4 as a multiplcation of m1 and m2
*
* @param {Matrix4} m1 The first matrix
* @param {Matrix4} m2 The second matrix
* @return {Matrix4} m1 x m2
*/
function matMul(m1, m2) {
    return new THREE.Matrix4().multiplyMatrices(m1, m2);
}

/**
* Returns a new Matrix4 as a scalar multiplcation of s and m
*
* @param {number} s The scalar
* @param {Matrix4} m The  matrix
* @return {Matrix4} s * m2
*/
function scalarMul(s, m) {
    var r = m;
    return r.multiplyScalar(s)
}

/**
* Returns an array containing the x,y and z translation component
* of a transformation matrix
*
* @param {Matrix4} M The transformation matrix
* @return {Array} x,y,z translation components
*/
function getTranslationValues(M) {
    var elems = M.elements;
    return elems.slice(12, 15);
}

/**
* Returns a new Matrix4 as a translation matrix of [x,y,z]
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The translation matrix of [x,y,z]
*/
function translation(x, y, z) {
	let translationMatrix = new THREE.Matrix4();
    translationMatrix.set(
        1, 0, 0, x,
        0, 1, 0, y,
        0, 0, 1, z,
        0, 0, 0, 1
    )
    return translationMatrix;
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the x-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the x-axis
*/
function rotX(theta) {
	let rotXMatrix = new THREE.Matrix4();
    rotXMatrix.set(
        1, 0, 0, 0,
        0, cos(theta), -sin(theta), 0,
        0, sin(theta), cos(theta), 0,
        0, 0, 0, 1
    )
    return rotXMatrix;
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the y-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the y-axis
*/
function rotY(theta) {
	let rotYMatrix = new THREE.Matrix4();
    rotYMatrix.set(
        cos(theta), 0, sin(theta), 0,
        0, 1, 0, 0,
        -sin(theta), 0, cos(theta), 0,
        0, 0, 0, 1
    )
    return rotYMatrix;
}

/**
* Returns a new Matrix4 as a rotation matrix of theta radians around the z-axis
*
* @param {number} theta The angle expressed in radians
* @return {Matrix4} The rotation matrix of theta rad around the z-axis
*/
function rotZ(theta) {
	let rotZMatrix = new THREE.Matrix4();
    rotZMatrix.set(
        cos(theta), -sin(theta), 0, 0,
        sin(theta), cos(theta), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    )
    return rotZMatrix;
}

/**
* Returns a new Matrix4 as a scaling matrix with factors of x,y,z
*
* @param {number} x x component
* @param {number} y y component
* @param {number} z z component
* @return {Matrix4} The scaling matrix with factors of x,y,z
*/
function scale(x, y, z) {
	let scalingMatrix = new THREE.Matrix4();
    scalingMatrix.set(
        x, 0, 0, 0,
        0, y, 0, 0,
        0, 0, z, 0,
        0, 0, 0, 1
    )
    return scalingMatrix;
}

function invert(m) {
    return m.clone().invert();
}

function cos(angle) {
    return Math.cos(angle);
}

function sin(angle) {
    return Math.sin(angle);
}

function checkKeyboard() {
    for (var i = 0; i < 10; i++) {
        if (keyboard.pressed(i.toString())) {
            channel = i;
            break;
        }
    }
}
function updateBody() {

    switch (channel) {
    case 0:
        var t = clock.getElapsedTime();
        robot.animate(t);
        break;

        // TODO add poses here:
    case 1:
        break;

    case 2:
        break;

    case 3:
        break;

    case 4:
        break;

    case 5:
        break;
    case 6:
        robot.hideRobot();
        break;
    case 7:
        robot.showRobot();
        break;
    case 8:
        robot.hideHuman();
        break;
    case 9:
        robot.showHuman();
        break;
    default:
        break;
    }
}

init();
animate();
