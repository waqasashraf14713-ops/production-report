// d:\production report\oil_scada_3d.js

function initOilScada3D(containerId) {
    if (typeof THREE === 'undefined') return;
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear existing canvas elements but keep the UI buttons
    Array.from(container.children).forEach(child => {
        if (child.tagName !== 'BUTTON') {
            container.removeChild(child);
        }
    });
    
    // Make sure container is positioned relatively for absolute CSS2D labels
    container.style.position = 'relative';

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9); // Light background

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    // Zoomed in closer so models appear larger
    camera.position.set(0, 8, 22);
    camera.lookAt(0, 5, 0);

    // Main WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); 
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Tone mapping for realistic lighting
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // We add renderer to a wrapper to manage z-index with CSS2D
    container.appendChild(renderer.domElement);

    // CSS2D Renderer for Crisp HTML Labels
    let labelRenderer;
    if (THREE.CSS2DRenderer) {
        labelRenderer = new THREE.CSS2DRenderer();
        labelRenderer.setSize(width, height);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelRenderer.domElement.style.pointerEvents = 'none'; // allow clicking through labels to orbit controls
        container.appendChild(labelRenderer.domElement);
    }

    // Generate Room Environment for super realistic glass/metal reflections
    if (THREE.PMREMGenerator && THREE.RoomEnvironment) {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        scene.environment = pmremGenerator.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    }

    // Fullscreen Event
    const fsBtn = document.getElementById('btn-fullscreen-3d');
    if (fsBtn) {
        fsBtn.onclick = () => {
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(err => console.error(err));
            } else {
                document.exitFullscreen();
            }
        };
    }

    document.addEventListener('fullscreenchange', () => {
        if (fsBtn) {
            fsBtn.innerText = document.fullscreenElement ? "✖ Exit Fullscreen" : "⛶ Fullscreen";
        }
    });

    let isAnimating = true;
    const animBtn = document.getElementById('btn-anim-toggle');
    if (animBtn) {
        animBtn.onclick = () => {
            isAnimating = !isAnimating;
            animBtn.innerText = isAnimating ? "⏸ Pause Oil Flow" : "▶ Play Oil Flow";
            animBtn.style.background = isAnimating ? "rgba(234,179,8,0.8)" : "rgba(34,197,94,0.8)";
            animBtn.style.color = isAnimating ? "#000" : "#fff";
        };
    }

    let controls;
    if (THREE.OrbitControls) {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 + 0.1; 
        controls.target.set(0, 5, 0);
    }

    // --- Materials (Upgraded for hyper-realism) ---
    const matGlassCrystal = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.9, // high transmission for glass look
        thickness: 0.5,
        ior: 1.5,
        transparent: true,
        opacity: 1.0, 
        side: THREE.DoubleSide,
        clearcoat: 1.0,
        envMapIntensity: 1.5
    });
    
    const matOil = new THREE.MeshPhysicalMaterial({
        color: 0xeab308, // Rich Golden oil
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.5,
        thickness: 2.0,
        ior: 1.4,
        envMapIntensity: 1.0
    });

    const matScale = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.4,
        roughness: 0.2,
        envMapIntensity: 1.0
    });

    const matPipeGreen = new THREE.MeshStandardMaterial({ color: 0x4ade80, metalness: 0.6, roughness: 0.2, envMapIntensity: 1.2 });
    const matPipeRed = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.2, envMapIntensity: 1.2 });
    const matPipeGray = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.1, envMapIntensity: 1.5 });
    
    const matPump = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.3, envMapIntensity: 1.0 });

    const scadaGroup = new THREE.Group();
    scene.add(scadaGroup);

    // --- HTML Label Helper ---
    function addHtmlLabel(group, text, xOffset, yOffset, zOffset=0, isTank=false) {
        if (!THREE.CSS2DObject) return;
        const div = document.createElement('div');
        div.className = 'label-3d';
        
        div.innerText = text;
        
        if (isTank) {
            div.style.backgroundColor = 'transparent';
            div.style.border = 'none';
            div.style.color = '#1e293b'; 
            div.style.fontFamily = 'sans-serif';
            div.style.fontSize = '8px';
            div.style.fontWeight = 'bold';
            div.style.textShadow = '0px 0px 3px rgba(255,255,255,0.9)';
            div.style.pointerEvents = 'none';
            div.style.textAlign = 'center';
            div.style.whiteSpace = 'pre-wrap';
        } else {
            // CSS Styling for the standard label
            div.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            div.style.border = '1px solid #94a3b8'; // Lighter border
            div.style.borderRadius = '4px';
            div.style.padding = '1px 3px'; // Very small padding
            div.style.color = '#475569'; // Light black / dark grey
            div.style.fontFamily = 'sans-serif';
            div.style.fontSize = '9px';
            div.style.fontWeight = 'bold';
            div.style.textAlign = 'center';
            div.style.boxShadow = '0 1px 2px -1px rgba(0,0,0,0.1)';
            div.style.whiteSpace = 'pre-wrap';
            div.style.pointerEvents = 'none';
        }
        
        const label = new THREE.CSS2DObject(div);
        label.position.set(xOffset, yOffset, zOffset);
        group.add(label);
    }

    // --- Helpers ---
    function createTransparentCylinderTank(radius, height, matGlass, matLiquid, fillRatio, labelStr) {
        const group = new THREE.Group();
        
        const glass = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 64), matGlass);
        glass.castShadow = true;
        glass.receiveShadow = true;
        group.add(glass);
        
        const roof = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 6), matGlass);
        roof.position.y = height / 2 - radius * 0.13;
        group.add(roof);

        // Inner Liquid
        const liqHeight = height * fillRatio;
        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, liqHeight, 64), matLiquid);
        liquid.position.y = -height/2 + liqHeight/2;
        group.add(liquid);

        if (labelStr) addHtmlLabel(group, labelStr, 0, 0, radius * 0.8, true);
        return group;
    }

    function createTransparentHorizontalTank(radius, length, matGlass, matLiquid, fillRatio, labelStr) {
        const group = new THREE.Group();
        
        const glass = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 64), matGlass);
        glass.rotation.z = Math.PI / 2;
        glass.castShadow = true;
        glass.receiveShadow = true;
        group.add(glass);
        
        const cap1 = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), matGlass);
        cap1.position.x = length / 2;
        cap1.rotation.z = -Math.PI / 2;
        group.add(cap1);
        
        const cap2 = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2), matGlass);
        cap2.position.x = -length / 2;
        cap2.rotation.z = Math.PI / 2;
        group.add(cap2);

        // Inner Liquid (Horizontal cylinder approximation)
        const liqRadius = radius * 0.95;
        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(liqRadius, liqRadius, length*0.95, 64), matLiquid);
        liquid.rotation.z = Math.PI / 2;
        liquid.position.y = -radius * (1 - fillRatio);
        group.add(liquid);

        if (labelStr) addHtmlLabel(group, labelStr, 0, 0, radius * 0.8, true);
        return group;
    }

    function createTransparentBoxTank(w, h, d, matGlass, matLiquid, fillRatio, labelStr) {
        const group = new THREE.Group();
        const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matGlass);
        glass.castShadow = true;
        group.add(glass);
        
        const liqHeight = h * fillRatio;
        const liquid = new THREE.Mesh(new THREE.BoxGeometry(w*0.95, liqHeight, d*0.95), matLiquid);
        liquid.position.y = -h/2 + liqHeight/2;
        group.add(liquid);

        if (labelStr) addHtmlLabel(group, labelStr, 0, 0, d/2 * 0.8, true);
        return group;
    }

    function createHopper(w, h, mat, labelStr) {
        const group = new THREE.Group();
        const geo = new THREE.CylinderGeometry(w/2, w/4, h, 4);
        geo.rotateY(Math.PI/4);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        group.add(mesh);
        if (labelStr) addHtmlLabel(group, labelStr, 0, 0, w/2 + 0.2);
        return group;
    }

    function createPump(labelStr) {
        const group = new THREE.Group();
        
        // Pump Volute (Casing)
        const casingGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 32);
        const casing = new THREE.Mesh(casingGeo, matPump); 
        casing.rotation.x = Math.PI / 2;
        group.add(casing);
        
        // Discharge pipe (pointing up)
        const discharge = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 16), matPump);
        discharge.position.set(0, 0.35, 0);
        group.add(discharge);
        
        // Suction inlet (pointing front)
        const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16), matPump);
        inlet.rotation.x = Math.PI / 2;
        inlet.position.set(0, 0, 0.3);
        group.add(inlet);

        // Motor (attached to the back)
        const motorMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 }); 
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.8, 32), motorMat);
        motor.rotation.x = Math.PI / 2;
        motor.position.set(0, 0, -0.55);
        group.add(motor);
        
        // Motor cooling fins
        const fins = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.7, 16), new THREE.MeshBasicMaterial({ color: 0x0f172a, wireframe: true }));
        fins.rotation.x = Math.PI / 2;
        fins.position.set(0, 0, -0.55);
        group.add(fins);
        
        // Mount Base
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 1.4), motorMat);
        base.position.set(0, -0.4, -0.3);
        group.add(base);

        addHtmlLabel(group, labelStr ? `P\n${labelStr}` : 'P', 0, -0.7); 
        return group;
    }

    function createGlobeValve(labelStr, orientation = 'up') {
        const group = new THREE.Group();
        const meshGroup = new THREE.Group();
        
        // Brass/Gold material
        const bodyMat = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 0.7, roughness: 0.3, envMapIntensity: 2.0});
        
        // Central spherical body
        const center = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), bodyMat);
        meshGroup.add(center);
        
        // Body extensions to flanges
        const extLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.2, 32), bodyMat);
        extLeft.rotation.z = Math.PI / 2;
        extLeft.position.x = -0.15;
        meshGroup.add(extLeft);
        
        const extRight = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.2, 32), bodyMat);
        extRight.rotation.z = -Math.PI / 2;
        extRight.position.x = 0.15;
        meshGroup.add(extRight);
        
        // Flanges (Left and Right)
        const flangeLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32), bodyMat);
        flangeLeft.rotation.z = Math.PI / 2;
        flangeLeft.position.x = -0.27;
        meshGroup.add(flangeLeft);
        
        const flangeRight = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.05, 32), bodyMat);
        flangeRight.rotation.z = Math.PI / 2;
        flangeRight.position.x = 0.27;
        meshGroup.add(flangeRight);

        // Hexagonal nut at the base of the stem
        const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.15, 6), bodyMat);
        nut.position.y = 0.18;
        meshGroup.add(nut);
        
        // Top stem neck (brass)
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.15, 32), bodyMat);
        neck.position.y = 0.3;
        meshGroup.add(neck);
        
        // Silver stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35), new THREE.MeshStandardMaterial({color: 0xc0c0c0, metalness: 0.8, roughness: 0.2}));
        stem.position.y = 0.5;
        meshGroup.add(stem);
        
        // Prominent Red Wheel (Torus with spokes)
        const wheelGroup = new THREE.Group();
        const wheelMat = new THREE.MeshStandardMaterial({color: 0xef4444, metalness: 0.1, roughness: 0.4});
        const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.04, 16, 32), wheelMat);
        wheel.rotation.x = Math.PI/2;
        wheelGroup.add(wheel);
        
        // Spokes for the wheel
        const spoke1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16), wheelMat);
        spoke1.rotation.x = Math.PI/2;
        wheelGroup.add(spoke1);
        const spoke2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16), wheelMat);
        spoke2.rotation.z = Math.PI/2;
        spoke2.rotation.x = Math.PI/2;
        wheelGroup.add(spoke2);
        
        wheelGroup.position.y = 0.65;
        meshGroup.add(wheelGroup);
        
        group.add(meshGroup);

        // Handle Orientation and Label Placement
        let lblX = 1.2, lblY = 0; // Default (up) places label to the right
        if (orientation === 'left') {
            meshGroup.rotation.z = Math.PI / 2; 
            lblX = -1.2; lblY = 0; // Places label further left
        } else if (orientation === 'right') {
            meshGroup.rotation.z = -Math.PI / 2; 
            lblX = 1.2; lblY = 0; // Places label further right
        }

        if (labelStr) addHtmlLabel(group, labelStr, lblX, lblY); 
        return group;
    }

    function createButterflyValve(labelStr) {
        const group = new THREE.Group();
        // Blue body
        const bodyMat = new THREE.MeshStandardMaterial({color: 0x3b82f6, metalness: 0.8, roughness: 0.2, envMapIntensity: 1.5});
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32), bodyMat);
        body.rotation.z = Math.PI/2;
        group.add(body);
        
        // Grey actuator
        const actuator = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), new THREE.MeshStandardMaterial({color: 0x94a3b8, metalness: 0.6, roughness: 0.3}));
        actuator.position.y = 0.3;
        group.add(actuator);
        
        // Label firmly to the side
        if (labelStr) addHtmlLabel(group, labelStr, 1.0, 0.0);
        return group;
    }
    
    function createFilter(labelStr) {
        const group = new THREE.Group();
        
        // Main yellow body (cylinder)
        const bodyMat = new THREE.MeshStandardMaterial({color: 0xeab308, metalness: 0.4, roughness: 0.2, envMapIntensity: 1.0});
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 32), bodyMat);
        group.add(body);
        
        // Vertical ribs/fins to match the PDF icon
        for (let i = 0; i < 8; i++) {
            const rib = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.05), new THREE.MeshStandardMaterial({color: 0xca8a04, metalness: 0.3, roughness: 0.5}));
            rib.rotation.y = (Math.PI / 8) * i;
            group.add(rib);
        }
        
        // Top and bottom metallic caps
        const capMat = new THREE.MeshStandardMaterial({color: 0x94a3b8, metalness: 0.8, roughness: 0.2});
        const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32), capMat);
        capTop.position.y = 0.55;
        group.add(capTop);
        
        const capBot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.1, 32), capMat);
        capBot.position.y = -0.55;
        group.add(capBot);
        
        // Label firmly to the side
        if (labelStr) addHtmlLabel(group, labelStr, 1.2, 0);
        return group;
    }

    // --- Path/Pipe Logic with Flow Animation ---
    const animatedPipes = [];
    const canvasFlow = document.createElement('canvas');
    canvasFlow.width = 256; canvasFlow.height = 32;
    const ctxFlow = canvasFlow.getContext('2d');
    ctxFlow.fillStyle = 'rgba(255,255,255,0.8)'; // Semi-transparent white for pipe
    ctxFlow.fillRect(0,0,256,32);
    ctxFlow.fillStyle = '#eab308'; // Bright Yellow for Oil Flow
    for(let i=0; i<256; i+=32) { ctxFlow.fillRect(i, 0, 16, 32); }
    const texFlow = new THREE.CanvasTexture(canvasFlow);
    texFlow.wrapS = THREE.RepeatWrapping;
    texFlow.wrapT = THREE.RepeatWrapping;

    const canvasFlowRed = document.createElement('canvas');
    canvasFlowRed.width = 256; canvasFlowRed.height = 32;
    const ctxFlowRed = canvasFlowRed.getContext('2d');
    ctxFlowRed.fillStyle = 'rgba(255,255,255,0.8)'; 
    ctxFlowRed.fillRect(0,0,256,32);
    ctxFlowRed.fillStyle = '#ef4444'; // Red Flow for overflow
    for(let i=0; i<256; i+=32) { ctxFlowRed.fillRect(i, 0, 16, 32); }
    const texFlowRed = new THREE.CanvasTexture(canvasFlowRed);
    texFlowRed.wrapS = THREE.RepeatWrapping;
    texFlowRed.wrapT = THREE.RepeatWrapping;

    function createPipe(points, matBase) {
        const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
        const geo = new THREE.TubeGeometry(path, Math.max(10, points.length * 8), 0.15, 16, false);
        let mat = matBase.clone();
        mat.map = texFlow;
        mat.transparent = true;
        mat.opacity = 0.95;
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        scadaGroup.add(mesh);
        animatedPipes.push({mat: mat, dir: 1});
        return mesh;
    }
    
    function createPipeRed(points, matBase) {
        const path = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.1);
        const geo = new THREE.TubeGeometry(path, Math.max(10, points.length * 8), 0.15, 16, false);
        let mat = matBase.clone();
        mat.map = texFlowRed;
        mat.transparent = true;
        mat.opacity = 0.95;
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        scadaGroup.add(mesh);
        animatedPipes.push({mat: mat, dir: 1}); // Direction is forward along points, points will be drawn backwards
        return mesh;
    }

    // ==========================================
    // PAGE 1 ELEMENTS EXACT RECREATION
    // ==========================================

    const t28 = createTransparentCylinderTank(3, 10, matGlassCrystal, matOil, 0.65, 'Capacity 28tons\n(Vegetable oil Storage tank)');
    t28.position.set(-3, 5, 0);
    scadaGroup.add(t28);

    const tService = createTransparentBoxTank(3, 2.5, 2.5, matGlassCrystal, matOil, 0.4, 'Capacity 2.6 tons\n(Service tank)');
    tService.position.set(6, 13, 0);
    scadaGroup.add(tService);

    const scale1 = createHopper(2.5, 2, matScale, '300Kg\n(scale1)');
    scale1.position.set(6, 8, 0);
    scadaGroup.add(scale1);

    const scale2 = createHopper(2.5, 2, matScale, '300Kg\n(scale2)');
    scale2.position.set(6, 4, 0);
    scadaGroup.add(scale2);

    const tLoad1 = createTransparentHorizontalTank(1.5, 4.5, matGlassCrystal, matOil, 0.5, 'CAPACITY 6.5 TONS\n(Loading tank1)');
    tLoad1.rotation.y = Math.PI/2;
    tLoad1.position.set(-8, -2, 6);
    scadaGroup.add(tLoad1);

    const tLoad2 = createTransparentHorizontalTank(1.5, 4.5, matGlassCrystal, matOil, 0.7, 'CAPACITY 6.5 TONS\n(Loading tank2)');
    tLoad2.rotation.y = Math.PI/2;
    tLoad2.position.set(-2, -2, 6);
    scadaGroup.add(tLoad2);

    // Pumps, Filters & Valves
    const pumpL1 = createPump(); pumpL1.position.set(-8, 1, 6); scadaGroup.add(pumpL1);
    const pumpL2 = createPump(); pumpL2.position.set(-2, 1, 6); scadaGroup.add(pumpL2);
    
    const f1 = createFilter('(F1)'); f1.position.set(-8, 3, 6); scadaGroup.add(f1);
    const f2 = createFilter('(F2)'); f2.position.set(-2, 3, 6); scadaGroup.add(f2);
    
    const v19 = createGlobeValve('(V19)', 'left'); v19.position.set(-8, 5, 6); scadaGroup.add(v19);
    const v18 = createGlobeValve('(V18)', 'right'); v18.position.set(-2, 5, 6); scadaGroup.add(v18);
    
    // V17 on the main filling line
    const v17 = createGlobeValve('(V17)', 'left'); v17.position.set(-8, 8, 6); scadaGroup.add(v17);

    const pump259 = createPump('(259)'); pump259.position.set(2, 2, 0); scadaGroup.add(pump259);

    const v10 = createGlobeValve('(V10)', 'left'); v10.position.set(6, 11, 0); scadaGroup.add(v10);
    
    const v251core = createButterflyValve('(V251.core)'); v251core.position.set(5.5, 9.5, 0); scadaGroup.add(v251core);
    const v251fine = createButterflyValve('(V251.fine)'); v251fine.position.set(6.5, 9.5, 0); scadaGroup.add(v251fine);

    const v11 = createButterflyValve('(V11)'); v11.position.set(6, 6, 0); scadaGroup.add(v11);
    const v12 = createGlobeValve('(V12)', 'right'); v12.position.set(6, 2, 0); scadaGroup.add(v12);

    const v254 = createButterflyValve('(V254)'); v254.position.set(4, 0, 0); scadaGroup.add(v254);
    const v257 = createButterflyValve('(V257)'); v257.position.set(8, 0, 0); scadaGroup.add(v257);
    
    const v13 = createGlobeValve('(V13)', 'left'); v13.position.set(4, -1.5, 0); scadaGroup.add(v13);
    const v14 = createGlobeValve('(V14)', 'right'); v14.position.set(8, -1.5, 0); scadaGroup.add(v14);

    const f3 = createFilter('(F3)'); f3.position.set(4, -3.5, 0); scadaGroup.add(f3);
    const f4 = createFilter('(F4)'); f4.position.set(8, -3.5, 0); scadaGroup.add(f4);

    const pumpOut1 = createPump(); pumpOut1.position.set(4, -5.5, 0); scadaGroup.add(pumpOut1);
    const pumpOut2 = createPump(); pumpOut2.position.set(8, -5.5, 0); scadaGroup.add(pumpOut2);

    const v15 = createButterflyValve('(V15)'); v15.position.set(4, -7.5, 0); scadaGroup.add(v15);
    const v16 = createButterflyValve('(V16)'); v16.position.set(8, -7.5, 0); scadaGroup.add(v16);

    // ==========================================
    // ROUTING PIPES
    // ==========================================

    // Loading 1 & 2 -> Pumps -> Filters -> Valves -> 28-ton (TOP filling L-shape bend)
    createPipe([
        new THREE.Vector3(-8, -0.5, 6),
        new THREE.Vector3(-8, 11, 6),   
        new THREE.Vector3(-8, 11, 0),   
        
        // Horizontal run over the tank
        new THREE.Vector3(-5, 11, 0),
        new THREE.Vector3(-4, 11, 0), // Start of 90-degree elbow (radius 1, center -4, 10)
        new THREE.Vector3(-3.8, 10.98, 0),
        new THREE.Vector3(-3.6, 10.91, 0),
        new THREE.Vector3(-3.4, 10.8, 0),
        new THREE.Vector3(-3.2, 10.6, 0),
        new THREE.Vector3(-3.0, 10.4, 0),
        
        // Vertical drop into the tank center
        new THREE.Vector3(-3.0, 10.0, 0),
        new THREE.Vector3(-3.0, 9.0, 0)
    ], matPipeGreen);

    createPipe([
        new THREE.Vector3(-2, -0.5, 6),
        new THREE.Vector3(-2, 7, 6),
        new THREE.Vector3(-8, 7, 6) 
    ], matPipeGreen);

    // 28-ton -> Pump 259 -> Service Tank
    createPipe([
        new THREE.Vector3(0, 2, 0),
        new THREE.Vector3(2, 2, 0),
        new THREE.Vector3(2, 14, 0),
        new THREE.Vector3(4.5, 14, 0)
    ], matPipeGreen);

    // Service Tank (Top) -> Overflow -> 28-ton (Top)
    createPipeRed([
        new THREE.Vector3(6, 14.25, 0),
        new THREE.Vector3(6, 15.5, 0),
        new THREE.Vector3(-3, 15.5, 0),
        new THREE.Vector3(-3, 10, 0)
    ], matPipeRed);

    // Service Tank -> V10 -> Split(V251.core & fine) -> Scale 1
    createPipe([
        new THREE.Vector3(6, 11.75, 0),
        new THREE.Vector3(6, 11, 0),
        new THREE.Vector3(6, 10.5, 0)
    ], matPipeGray);
    createPipe([ new THREE.Vector3(6, 10.5, 0), new THREE.Vector3(5.5, 10.5, 0), new THREE.Vector3(5.5, 9.5, 0), new THREE.Vector3(5.5, 9, 0), new THREE.Vector3(6, 9, 0) ], matPipeGray);
    createPipe([ new THREE.Vector3(6, 10.5, 0), new THREE.Vector3(6.5, 10.5, 0), new THREE.Vector3(6.5, 9.5, 0), new THREE.Vector3(6.5, 9, 0), new THREE.Vector3(6, 9, 0) ], matPipeGray);

    // Scale 1 -> V11 -> Scale 2
    createPipe([ new THREE.Vector3(6, 7, 0), new THREE.Vector3(6, 6, 0), new THREE.Vector3(6, 5, 0) ], matPipeGray);

    // Scale 2 -> V12 -> Split to F3/F4 line
    createPipe([ new THREE.Vector3(6, 3, 0), new THREE.Vector3(6, 1, 0) ], matPipeGray);
    createPipe([ new THREE.Vector3(6, 1, 0), new THREE.Vector3(4, 1, 0), new THREE.Vector3(4, -8.5, 0), new THREE.Vector3(9, -8.5, 0) ], matPipeGray);
    createPipe([ new THREE.Vector3(6, 1, 0), new THREE.Vector3(8, 1, 0), new THREE.Vector3(8, -8.5, 0) ], matPipeGray);


    // Ground Plane
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8, metalness: 0.1 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0xffffff, 1.2)); 
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe2e8f0, 0.8);
    fillLight.position.set(-20, 20, -20);
    scene.add(fillLight);
    
    // --- Animation Loop ---
    let time = 0;
    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const w = entry.contentRect.width;
            const h = entry.contentRect.height;
            if (w > 0 && h > 0) {
                renderer.setSize(w, h);
                if(labelRenderer) labelRenderer.setSize(w, h);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
        }
    });
    resizeObserver.observe(container);

    (function animate() {
        requestAnimationFrame(animate);
        time += 0.015;
        
        if (isAnimating) {
            animatedPipes.forEach(p => {
                p.mat.map.offset.x -= 0.002 * p.dir; 
            });
        }

        if (controls) controls.update();
        renderer.render(scene, camera);
        if (labelRenderer) labelRenderer.render(scene, camera);
    })();
}
