/* eslint-disable no-param-reassign */

import 'normalize.css/normalize.css';
import './static/styles/base.scss';

import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import workSans from './static/fonts/workSans.json';

// PARAMETERS

const cylinderHeight = 20;
const plainLetters = [
  ['B', 3], ['L', 4], ['A', 0], ['C', 3], ['K', 12],
  ['J', 3], ['E', 3], ['L', 3], ['L', 3], ['Y', 0],
];
const sphereMaxY = 190;
const sphereMinY = 96;
const sphereRadius = 5;
const sphereSlopeSoftener = 0.2;

// COMPUTED

const sphereCylinderMaxDist = (cylinderHeight / 2) + sphereRadius;

// CLOCK

const clock = new THREE.Clock(false);

// GLOBAL VARIABLES

let camera;
let controls;
let cylinder;
let gameLost = false;
let letters;
let renderer;
let scene;
let sphere;
let sphereDirection = 1;
let sphereSlope = 0;
let textWidth;

// FUNCTIONS

const init = () => {
  // SCENE

  scene = new THREE.Scene();

  // CAMERA

  const fov = 45;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 1000;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 100);

  // RENDERER

  renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // CONTROLS

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(0, 150, 0);

  // LIGHTS

  const light = new THREE.PointLight(0xffffff);
  light.position.set(0, 100, 100);
  scene.add(light);

  // MATERIALS

  const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x0f0f0f });
  const greyMaterial = new THREE.MeshPhongMaterial({ color: 0x969696 });

  // TEXT

  const font = new THREE.Font(workSans);
  const textGeometryParams = { font, size: 20, height: 4 };

  letters = plainLetters.map((plainLetter) => {
    const letterGeometry = new THREE.TextGeometry(plainLetter[0], textGeometryParams);
    letterGeometry.computeBoundingBox();
    const letter = new THREE.Mesh(letterGeometry, [blackMaterial, greyMaterial]);
    letter.userData = {
      spaceRight: plainLetter[1],
      width: letter.geometry.boundingBox.max.x - letter.geometry.boundingBox.min.x,
    };
    return letter;
  });

  textWidth = letters.reduce((acc, letter) => (
    acc + letter.userData.spaceRight + letter.userData.width
  ), 0);

  let nextX = -0.5 * textWidth;

  letters.forEach((letter) => {
    letter.position.set(nextX, 200, 0);
    letter.rotation.x = Math.PI / 4;
    nextX += letter.userData.spaceRight + letter.userData.width;
    scene.add(letter);
  });

  // CYLINDER

  const cylinderRadiusTop = 3;
  const cylinderRadiusBottom = 3;
  const cylinderRadialSegments = 32;
  const cylinderGeometry = new THREE.CylinderGeometry(
    cylinderRadiusTop, cylinderRadiusBottom, cylinderHeight, cylinderRadialSegments,
  );
  cylinder = new THREE.Mesh(cylinderGeometry, [blackMaterial, greyMaterial, greyMaterial]);
  cylinder.position.set(0, 90, 0);
  cylinder.rotation.z = Math.PI / 2;
  scene.add(cylinder);

  // SPHERE

  const sphereWidthSegments = 32;
  const sphereHeightSegments = 32;
  const sphereGeometry = new THREE.SphereGeometry(
    sphereRadius, sphereWidthSegments, sphereHeightSegments,
  );
  sphere = new THREE.Mesh(sphereGeometry, blackMaterial);
  sphere.position.set(0, sphereMinY, 0);
  scene.add(sphere);

  // AXES

  // const axes = new THREE.AxesHelper(300);
  // scene.add(axes);
};

const render = () => {
  renderer.render(scene, camera);
};

const updateSpherePos = (delta) => {
  sphere.position.y += delta;
  sphere.position.x += sphereDirection * delta * sphereSlope;
};

const update = () => {
  const timeDelta = clock.getDelta();
  const diffY = sphereDirection * timeDelta * 60;

  if (!gameLost) {
    const breakpoint = sphereDirection === 1 ? sphereMaxY : sphereMinY;
    const distToBreakpoint = breakpoint - sphere.position.y;
    const breakpointReached = sphereDirection * diffY >= sphereDirection * distToBreakpoint;

    if (breakpointReached) {
      if (sphereDirection === 1) {
        updateSpherePos(distToBreakpoint);
        let hits = 0;
        letters.forEach((letter, index) => {
          if (sphere.position.x >= letter.position.x - sphereRadius
            && sphere.position.x <= letter.position.x + letter.userData.width + sphereRadius) {
            letters.splice(index, 1);
            scene.remove(letter);
            hits += 1;
          }
        });
        if (hits > 0) {
          sphereDirection = -1;
          sphereSlope *= sphereSlopeSoftener;
        } else { gameLost = true; }
      } else if (sphereDirection === -1) {
        if (Math.abs(sphere.position.x - cylinder.position.x) <= sphereCylinderMaxDist) {
          updateSpherePos(distToBreakpoint);
          sphereDirection = 1;
          sphereSlope = (sphere.position.x - cylinder.position.x) / sphereCylinderMaxDist;
        } else {
          updateSpherePos(diffY);
          gameLost = true;
        }
      }
    } else { updateSpherePos(diffY); }
  } else { updateSpherePos(diffY); }

  controls.update();
};

const animate = () => {
  requestAnimationFrame(animate);
  render();
  update();
};

const onResize = () => {
  // CAMERA

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // RENDERER

  renderer.setSize(window.innerWidth, window.innerHeight);
};

const onMouseMove = (e) => {
  const { clientX } = e;

  const factor = ((clientX - window.innerWidth / 2) / (window.innerWidth / 2));

  cylinder.position.setX(factor * 90);
  gsap.to(camera.position, { duration: 1, x: factor * 20 });
  gsap.to(camera.position, { duration: 1, z: 100 - Math.abs(factor) * 30 });
};

// WHERE THE MAGIC HAPPENS

init();

window.addEventListener('resize', onResize);

clock.start();

animate();

window.addEventListener('mousemove', onMouseMove);
