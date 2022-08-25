/* eslint-disable import/no-unresolved */
/// Zappar for ThreeJS Examples
/// Opening Transition

// In this image tracked example we'll use TweenJS to create
// an opening transition at the touch of a button

import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import TWEEN from '@tweenjs/tween.js';

import './index.css';

const targetImage = new URL('../assets/example-tracking-image.zpt', import.meta.url).href;
const doorOneTextureUrl = new URL('../assets/doorOneTexture.jpg', import.meta.url).href;
const doorTwoTextureUrl = new URL('../assets/doorTwoTexture.jpg', import.meta.url).href;

// The SDK is supported on many different browsers, but there are some that
// don't provide camera access. This function detects if the browser is supported
// For more information on support, check out the readme over at
// https://www.npmjs.com/package/@zappar/zappar-threejs
if (ZapparThree.browserIncompatible()) {
  // The browserIncompatibleUI() function shows a full-page dialog that informs the user
  // they're using an unsupported browser, and provides a button to 'copy' the current page
  // URL so they can 'paste' it into the address bar of a compatible alternative.
  ZapparThree.browserIncompatibleUI();

  // If the browser is not compatible, we can avoid setting up the rest of the page
  // so we throw an exception here.
  throw new Error('Unsupported browser');
}

// ZapparThree provides a LoadingManager that shows a progress bar while
// the assets are downloaded. You can use this if it's helpful, or use
// your own loading UI - it's up to you :-)
const manager = new ZapparThree.LoadingManager();

// Construct our ThreeJS renderer and scene as usual
const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
document.body.appendChild(renderer.domElement);

// As with a normal ThreeJS scene, resize the canvas if the window resizes
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create a Zappar camera that we'll use instead of a ThreeJS camera
const camera = new ZapparThree.Camera();

// In order to use camera and motion data, we need to ask the users for permission
// The Zappar library comes with some UI to help with that, so let's use it
ZapparThree.permissionRequestUI().then((granted) => {
  // If the user granted us the permissions we need then we can start the camera
  // Otherwise let's them know that it's necessary with Zappar's permission denied UI
  if (granted) camera.start();
  else ZapparThree.permissionDeniedUI();
});

// The Zappar component needs to know our WebGL context, so set it like this:
ZapparThree.glContextSet(renderer.getContext());

// Set the background of our scene to be the camera background texture
// that's provided by the Zappar camera
scene.background = camera.backgroundTexture;

// Set an error handler on the loader to help us check if there are issues loading content.
// eslint-disable-next-line no-console
manager.onError = (url) => console.log(`There was an error loading ${url}`);

// Create a zappar image_tracker and wrap it in an image_tracker_group for us
// to put our ThreeJS content into
// Pass our loading manager in to ensure the progress bar works correctly
const imageTracker = new ZapparThree.ImageTrackerLoader(manager).load(targetImage);
const imageTrackerGroup = new ZapparThree.ImageAnchorGroup(camera, imageTracker);

// Add our image tracker group into the ThreeJS scene
scene.add(imageTrackerGroup);

// HTML element
const PlayButton = <HTMLButtonElement>document.getElementById('PlayButton');

// Other variables
let targetSeen = false;
let doorsOpen = false;

// Load in door textures - tracking image is split in half for each door
const doorOneTexture = new THREE.TextureLoader().load(doorOneTextureUrl);
const doorTwoTexture = new THREE.TextureLoader().load(doorTwoTextureUrl);

// Create first door mesh & provide it with the right side of the target image
const doorOneMesh = new THREE.Mesh(
  new THREE.BoxBufferGeometry(1.6, 2, 0.1),
  new THREE.MeshBasicMaterial({ map: doorOneTexture }),
);
// Create actual right-side door
const doorOne = new THREE.Object3D();
doorOne.add(doorOneMesh.clone());
// Offset & position for hinge effect
doorOne.children[0].position.set(0.7, 0, 0);
doorOne.position.set(-1.5, 0, 0);

// Create second door mesh & provide it with the left side of the target image
const doorTwoMesh = new THREE.Mesh(
  new THREE.BoxBufferGeometry(1.6, 2, 0.1),
  new THREE.MeshBasicMaterial({ map: doorTwoTexture }),
);
// Create actual left-side door
const doorTwo = new THREE.Object3D();
doorTwo.add(doorTwoMesh.clone());
// Offset & position for hinge effect
doorTwo.children[0].position.set(-0.7, 0, 0);
doorTwo.position.set(1.5, 0, 0);

// Create door group & add both doorOne and doorTwo
const doors = new THREE.Group();
doors.position.set(0, 0, 0);
doors.add(doorOne, doorTwo);

// Hide on load
doors.visible = false;

// Add the door group to our tracker group
imageTrackerGroup.add(doors);

// Starting position for both doors
const doorRotation = { y: 0 };
// Ending position doorOne
const openTarget = { y: -1.6 };
// Set up our open door tween
const tweenOpenDoor = new TWEEN.Tween(doorRotation).to(openTarget, 2000)
  .easing(TWEEN.Easing.Bounce.Out).onUpdate(() => {
  // Update our doors on the y position so it swings
    doorOne.rotation.y = doorRotation.y;
    doorTwo.rotation.y = -doorRotation.y;
  })
  .onStart(() => {
    doorsOpen = true;
    PlayButton.style.display = 'none';
  });

// Set up our close door tween
const tweenCloseDoor = new TWEEN.Tween(doorRotation).to({ y: 0 }, 2000)
  .easing(TWEEN.Easing.Bounce.Out).onUpdate(() => {
  // Update our doors on the y position so it swings
    doorOne.rotation.y = doorRotation.y;
    doorTwo.rotation.y = -doorRotation.y;
  })
  .onComplete(() => {
    doorsOpen = false;
    PlayButton.style.display = 'block';
  });

// Start the tweens - in function so they can be called at will
function doorsAnim() {
  // Begin our tween
  tweenOpenDoor.start();
  // Set a timeout so the doors close in 4 seconds
  setTimeout(() => tweenCloseDoor.start(), 4000);
}

// when we lose sight of the camera, hide the scene contents.
imageTracker.onVisible.bind(() => {
  doors.visible = true;

  if (!targetSeen) {
    targetSeen = true;
  }

  if (!doorsOpen) {
    PlayButton.style.display = 'block';
  }
});
imageTracker.onNotVisible.bind(() => {
  doors.visible = false;

  if (targetSeen) {
    targetSeen = false;
  }

  PlayButton.style.display = 'none';
});

// Play button functionality
PlayButton.onclick = () => {
  doorsAnim();
};

// Use a function to render our scene as usual
function render(): void {
  // The Zappar camera must have updateFrame called every frame
  camera.updateFrame(renderer);

  // Draw the ThreeJS scene in the usual way, but using the Zappar camera
  renderer.render(scene, camera);

  // If there are any tweens, make sure to update them
  TWEEN.update();

  // Call render() again next frame
  requestAnimationFrame(render);
}

// Start things off
render();
