const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.z = 2.5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('avatar-canvas'),
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 2, 3);
scene.add(light);

// Loaders
let avatar = null;
const loader = new THREE.GLTFLoader();

loader.load(
  './models/Avocado.glb',
  (gltf) => {
    avatar = gltf.scene;
    fitAvatarToView(avatar);
    scene.add(avatar);
  },
  undefined,
  (error) => console.error('Failed to load default model:', error)
);

// Upload
document.getElementById('modelUpload').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  loader.load(
    url,
    (gltf) => {
      if (avatar) scene.remove(avatar);
      avatar = gltf.scene;
      fitAvatarToView(avatar);
      scene.add(avatar);
    },
    undefined,
    (error) => console.error('Failed to load uploaded model:', error)
  );
});

// Fit and center
function fitAvatarToView(model) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const pivot = new THREE.Group();
  pivot.add(model);
  model.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 2 / maxDim;
  pivot.scale.setScalar(scale);

  if (avatar) scene.remove(avatar);
  avatar = pivot;
  scene.add(avatar);

  camera.position.set(0, 0, 2.5);
  camera.lookAt(0, 0, 0);
}

// Rotation drag
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

renderer.domElement.addEventListener('mousedown', (e) => {
  isDragging = true;
  previousMousePosition = { x: e.clientX, y: e.clientY };
});

renderer.domElement.addEventListener('mousemove', (e) => {
  if (!isDragging || !avatar) return;

  const delta = {
    x: e.clientX - previousMousePosition.x,
    y: e.clientY - previousMousePosition.y
  };

  const speed = 0.005;
  avatar.rotation.y += delta.x * speed;
  avatar.rotation.x += delta.y * speed;

  previousMousePosition = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => isDragging = false);
renderer.domElement.addEventListener('mouseleave', () => isDragging = false);

// Zoom
renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.position.z += e.deltaY * 0.001;
  camera.position.z = Math.min(Math.max(camera.position.z, 0.1), 20);
});

// Up/Down
document.getElementById('upBtn').addEventListener('click', () => {
  camera.position.y += 0.1;
});
document.getElementById('downBtn').addEventListener('click', () => {
  camera.position.y -= 0.1;
});

// Theme
const themeToggle = document.getElementById('themeToggle');

function isLight() {
  return document.body.classList.contains('light-mode');
}

function updateBackground() {
  const bgColor = isLight() ? 0xf0f0f0 : 0x111111;
  renderer.setClearColor(bgColor);
  scene.fog = null;
}

themeToggle.addEventListener('change', () => {
  document.body.classList.toggle('light-mode');
  document.body.classList.toggle('dark-mode');
  updateBackground();
});
updateBackground();

// Animations
let animationMode = 'off';
let clock = new THREE.Clock();

document.querySelectorAll('.anim-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.anim-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    animationMode = btn.dataset.anim;
  });
});

// Animate Loop
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const t = clock.getElapsedTime();

  if (avatar) {
    switch (animationMode) {
      case 'turn':
        avatar.rotation.y += delta;
        break;
      case 'hover':
        avatar.position.y = Math.sin(t * 2) * 0.1;
        break;
    }
  }

  renderer.render(scene, camera);
}
animate();
