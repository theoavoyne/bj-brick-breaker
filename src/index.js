import 'normalize.css/normalize.css';
import './static/styles/base.scss';

import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import workSans from './static/fonts/workSans.json';

// GLOBAL VARIABLES

let camera;
let controls;
let cylinder;
let renderer;
let scene;

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

  const sphereSize = 1;
  const pointLightHelper = new THREE.PointLightHelper(light, sphereSize);
  scene.add(pointLightHelper);

  // MATERIALS

  const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x0f0f0f });
  const greyMaterial = new THREE.MeshPhongMaterial({ color: 0x969696 });

  // TEXT

  const font = new THREE.Font(workSans);
  const textGeometry = new THREE.TextGeometry('BLACK JELLY', { font, size: 20, height: 4 });
  const textMesh = new THREE.Mesh(textGeometry, [blackMaterial, greyMaterial]);
  textGeometry.computeBoundingBox();
  const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
  textMesh.position.set(-0.5 * textWidth, 200, 0);
  textMesh.rotation.x = Math.PI / 4;
  scene.add(textMesh);

  // CYLINDER

  const cylinderRadiusTop = 3;
  const cylinderRadiusBottom = 3;
  const cylinderHeight = 20;
  const cylinderRadialSegments = 32;
  const cylinderGeometry = new THREE.CylinderGeometry(
    cylinderRadiusTop, cylinderRadiusBottom, cylinderHeight, cylinderRadialSegments,
  );
  cylinder = new THREE.Mesh(cylinderGeometry, [blackMaterial, greyMaterial, greyMaterial]);
  cylinder.position.set(0, 90, 0);
  cylinder.rotation.z = Math.PI / 2;
  scene.add(cylinder);

  // AXES

  // const axes = new THREE.AxesHelper(100);
  // scene.add(axes);
};

const render = () => {
  renderer.render(scene, camera);
};

const update = () => {
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

  cylinder.position.setX(factor * 70);
  gsap.to(camera.position, { duration: 1, x: factor * 20 });
  gsap.to(camera.position, { duration: 1, z: 100 - Math.abs(factor) * 30 });
};

// WHERE THE MAGIC HAPPENS

init();

window.addEventListener('resize', onResize);

animate();

window.addEventListener('mousemove', onMouseMove);
