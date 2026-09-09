# 🌐 Campus-Nexus 3D — Virtual Interactive Campus Exploration Platform

A high-performance, fully functional interactive 3D virtual campus digital twin application built with **Three.js**, **GSAP**, and modern vanilla ES modules.

---

## 🚀 Features

- **High-Fidelity 3D Environment:**
  - Realistic outdoor sun lighting with soft shadow mapping (`PCFSoftShadowMap`) and hemisphere ambient bounce.
  - Atmospheric depth fog seamlessly matched to background sky colors.
  - Water reflecting pool with specular reflections and soft shimmering animation.
  - Complete road network, pedestrian avenues, landscaped quads, and low-poly foliage (pine & deciduous trees).
  - 8 distinct procedural architectural buildings with dynamic emissive night-lighting.
  - Animated 3D floating beacon pins and pulsing ground ripple markers above all key structures.

- **Dynamic Atmospheric Lighting Engine:**
  - Instant transition between **☀️ Day**, **🌅 Golden Hour Sunset**, and **🌙 Cyber Midnight** with smooth GSAP color/intensity interpolation.

- **Precision Raycasting & Spatial Navigation:**
  - Mouse hover detection with emissive cyan outline tint and custom pointer feedback.
  - Screen-projected floating 3D tooltips showing real-time building metadata.
  - Cinematic GSAP camera fly-to transitions targeting specific building focal points.

- **Modern Glassmorphism HUD Overlay:**
  - **Top Bar:** Digital Twin branding, dynamic multi-field search bar with autocomplete dropdown and `/` shortcut key.
  - **Side Slide-Over Card / Drawer:** Opens upon building selection with architectural overview, floor counts, capacity, opening hours, facilities cloud, and department lists.
  - **Quick Navigation Dock:** Fast travel pills to jump between Overview, Main Gate, Academic Quad, Central Library, Turing Hall, The Hive, and Sports Arena.

- **Custom 3D Model Hook:**
  - Integrated `loadCustomCampusModel(url)` using `GLTFLoader` to drop in custom university models exported from Blender (`.glb` / `.gltf`).

---

## 📁 Project Directory Structure

```
campus-3d/
├── index.html        # Clean HTML5 layout, HUD glassmorphism overlay, import maps
├── style.css         # Responsive glassmorphism tokens, animations, responsive drawer
├── campusData.js     # Centralized JSON/JS dataset: coordinates, focal points, metadata
├── main.js           # Three.js scene, procedural generator, raycasting & GSAP controls
├── package.json      # Optional NPM scripts for Vite or local static dev servers
└── README.md         # Documentation & quick start guide
```

---

## 🏃 How to Run Locally

Because the application uses native browser **ES Modules** and **Import Maps**, you can run it using any simple local HTTP server or Vite.

### Option 1: Using Node / Vite (Recommended)

From inside the `campus-3d/` directory:

```bash
# Using npx (zero installation required)
npx vite

# Or install dependencies once
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Option 2: Using Node `serve` / `http-server`

```bash
npx serve .
# Or
npx http-server -p 8080
```

### Option 3: Using Python Built-in Server

```bash
# Python 3
python -m http.server 8000
```

Open `http://localhost:8000` in your web browser.

---

## 🎮 Navigation & Keyboard Controls

| Input | Action |
| :--- | :--- |
| **Left Click + Drag** | Orbit & rotate camera around campus |
| **Right Click + Drag** | Pan camera across campus plane |
| **Mouse Wheel / Pinch** | Zoom in & out (clamped to prevent clipping) |
| **Left Click on Building** | Focus camera & open detailed inspection drawer |
| **`/` (Forward Slash)** | Focus search bar immediately |
| **`Escape`** | Close inspection drawer / dismiss search results |

---

## 🎨 How to Drop in Custom Blender Models (`.glb` / `.gltf`)

To replace the procedural fallback geometry with a custom 3D campus model exported from Blender:

1. Place your exported file (e.g. `campus_nexus.glb`) in the `campus-3d/` folder (or assets folder).
2. Open `main.js` and call the pre-configured loader:

```javascript
window.campusApp.loadCustomCampusModel(
  './campus_nexus.glb',
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
  },
  (error) => {
    console.error('Error loading custom campus model:', error);
  }
);
```

The system will automatically hide the procedural fallback environment and map your mesh names or `userData.buildingId` to the `campusData.js` catalog!
