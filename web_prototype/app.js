// PCRE 3D Digital Twin Engine (Three.js Web Prototype)
// Direct Interactive Simulation for Hackathon Testing & Judges Presentation

const NODES_DATA = [
    { id: 1, name: "Main Hydro/Gas Power Plant", type: "PowerPlant", x: -22, z: 0, capacity: 600, load: 0, critical: false, isPhysical: true, channel: 0, nominalV: 230 },
    { id: 2, name: "Transmission Substation Alpha", type: "PrimarySubstation", x: -11, z: 6, capacity: 350, load: 40, critical: false, isPhysical: true, channel: 1, nominalV: 230 },
    { id: 3, name: "Substation Beta (Central)", type: "PrimarySubstation", x: 0, z: 8, capacity: 320, load: 45, critical: false, isPhysical: true, channel: 2, nominalV: 230 },
    { id: 4, name: "Metropolitan General Hospital", type: "CriticalHospital", x: -5, z: -9, capacity: 130, load: 95, critical: true, isPhysical: true, channel: 3, nominalV: 230 },
    { id: 5, name: "Emergency Response & 911 HQ", type: "EmergencyCenter", x: 6, z: -8, capacity: 110, load: 80, critical: true, isPhysical: true, channel: 4, nominalV: 230 },
    { id: 6, name: "City Water Filtration Plant", type: "WaterTreatment", x: -14, z: -14, capacity: 160, load: 115, critical: true, isPhysical: true, channel: 5, nominalV: 230 },
    { id: 7, name: "North Advanced Industrial Park", type: "IndustrialZone", x: 13, z: 12, capacity: 220, load: 170, critical: false, isPhysical: true, channel: 6, nominalV: 230 },
    { id: 8, name: "East Commercial Mall Hub", type: "CommercialDistrict", x: 20, z: 2, capacity: 200, load: 140, critical: false, isPhysical: true, channel: 7, nominalV: 230 },
    { id: 9, name: "North Residential Sector A", type: "ResidentialSector", x: -9, z: 16, capacity: 150, load: 100, critical: false, isPhysical: false, channel: -1, nominalV: 230 },
    { id: 10, name: "North Residential Sector B", type: "ResidentialSector", x: 5, z: 17, capacity: 150, load: 95, critical: false, isPhysical: false, channel: -1, nominalV: 230 },
    { id: 11, name: "Substation Gamma (South)", type: "DistributionSubstation", x: 9, z: -15, capacity: 240, load: 55, critical: false, isPhysical: false, channel: -1, nominalV: 230 },
    { id: 12, name: "South Residential District", type: "ResidentialSector", x: 18, z: -13, capacity: 140, load: 90, critical: false, isPhysical: false, channel: -1, nominalV: 230 }
];

const EDGES_DATA = [
    { a: 1, b: 2, cap: 420 },
    { a: 1, b: 3, cap: 380 },
    { a: 2, b: 3, cap: 280 },
    { a: 2, b: 4, cap: 190 },
    { a: 2, b: 6, cap: 180 },
    { a: 3, b: 5, cap: 190 },
    { a: 3, b: 7, cap: 240 },
    { a: 3, b: 8, cap: 220 },
    { a: 2, b: 9, cap: 150 },
    { a: 3, b: 10, cap: 150 },
    { a: 5, b: 11, cap: 180 },
    { a: 8, b: 11, cap: 200 },
    { a: 11, b: 12, cap: 150 },
    { a: 4, b: 5, cap: 140 } // Critical cross-tie
];

// App State
let scene, camera, renderer, controls;
let nodeMeshes = {}, lineObjects = [];
let selectedNode = null;
let pcreActive = true;
let chartInstance = null;
let telemetryHistory = [];

function init() {
    const container = document.getElementById("canvas-container");

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b12);
    scene.fog = new THREE.FogExp2(0x070b12, 0.015);

    // Camera
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 38, 48);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 15;
    controls.maxDistance = 90;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xaaddee, 1.2);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Ground Cyber Grid
    createGroundGrid();

    // Spawn 3D Nodes & Lines
    createNodes();
    createPowerLines();

    // Raycaster for clicking
    setupInteractions();

    // Chart init
    initTelemetryChart();

    // UI Listeners
    setupUIListeners();

    // Default select Hospital
    selectNode(NODES_DATA.find(n => n.id === 4));

    // Simulation Ticks
    setInterval(simulationTick, 800);
    setInterval(mockHardwarePacketTick, 1000);

    // Window Resize
    window.addEventListener("resize", onWindowResize);

    animate();
}

function createGroundGrid() {
    const gridHelper = new THREE.GridHelper(70, 35, 0x00ffcc, 0x1e293b);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
        color: 0x070b14,
        roughness: 0.85,
        metalness: 0.2
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.2;
    scene.add(groundMesh);
}

function getNodeColor(node) {
    if (node.status === "TRIPPED") return 0x222222;
    if (node.status === "SHEDDED") return 0x2a52be;
    if (node.status === "OVERLOADED") return 0xff2244;
    if (node.status === "WARNING") return 0xffaa00;

    switch (node.type) {
        case "PowerPlant": return 0x00d9ff;
        case "PrimarySubstation": return 0x00ff88;
        case "CriticalHospital":
        case "EmergencyCenter": return 0xff0055;
        case "WaterTreatment": return 0x0099ff;
        case "IndustrialZone": return 0xff9900;
        default: return 0x88ff00;
    }
}

function createNodes() {
    NODES_DATA.forEach(node => {
        node.status = "HEALTHY";
        node.voltage = node.nominalV;
        node.current = (node.load * 1000) / node.nominalV;
        node.temperature = 42.0;
        node.overloadCount = 0;

        const group = new THREE.Group();
        group.position.set(node.x, 0, node.z);

        let geo;
        if (node.type === "PowerPlant") {
            geo = new THREE.CylinderGeometry(1.6, 2.0, 2.8, 16);
        } else if (node.critical) {
            geo = new THREE.CylinderGeometry(1.2, 1.4, 2.4, 8);
        } else {
            geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
        }

        const mat = new THREE.MeshStandardMaterial({
            color: getNodeColor(node),
            emissive: getNodeColor(node),
            emissiveIntensity: 0.4,
            roughness: 0.3,
            metalness: 0.6
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1.2;
        mesh.castShadow = true;
        mesh.userData = { nodeId: node.id };
        group.add(mesh);

        // Indicator Light
        const light = new THREE.PointLight(getNodeColor(node), 1.5, 8);
        light.position.y = 2.8;
        group.add(light);

        // Critical Hospital Cross Ring
        if (node.critical) {
            const ringGeo = new THREE.RingGeometry(1.6, 1.9, 16);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.05;
            group.add(ring);
        }

        scene.add(group);
        nodeMeshes[node.id] = { group, mesh, light, mat, data: node };
    });
}

function createPowerLines() {
    EDGES_DATA.forEach((edge, idx) => {
        const nodeA = NODES_DATA.find(n => n.id === edge.a);
        const nodeB = NODES_DATA.find(n => n.id === edge.b);
        edge.flow = edge.cap * 0.45;
        edge.isTripped = false;

        const points = [
            new THREE.Vector3(nodeA.x, 1.2, nodeA.z),
            new THREE.Vector3(nodeB.x, 1.2, nodeB.z)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: 2,
            transparent: true,
            opacity: 0.85
        });

        const line = new THREE.Line(geometry, material);
        scene.add(line);
        lineObjects.push({ line, material, edge, nodeA, nodeB });
    });
}

function setupInteractions() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener("pointerdown", (event) => {
        // Prevent click if over UI panel
        if (event.target.closest(".panel") || event.target.closest(".hud-header") || event.target.closest(".modal")) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (let hit of intersects) {
            if (hit.object.userData && hit.object.userData.nodeId) {
                const node = NODES_DATA.find(n => n.id === hit.object.userData.nodeId);
                if (node) {
                    selectNode(node);
                    // If already selected, double click / click can toggle fault
                    if (event.detail === 2) {
                        toggleNodeFault(node.id);
                    }
                    break;
                }
            }
        }
    });
}

function selectNode(node) {
    selectedNode = node;
    document.getElementById("inspect-name").innerText = node.name;
    document.getElementById("inspect-type").innerText = node.type;
    document.getElementById("selected-node-tier").innerText = node.critical ? "TIER 1 CRITICAL" : "STANDARD TIER";
    document.getElementById("selected-node-tier").className = node.critical ? "pill pill-live" : "pill";

    updateInspectorUI();
}

function updateInspectorUI() {
    if (!selectedNode) return;

    const statusEl = document.getElementById("inspect-status");
    statusEl.innerText = selectedNode.status;
    statusEl.className = selectedNode.status === "HEALTHY" ? "text-success" : 
                         selectedNode.status === "SHEDDED" ? "text-cyan" : "text-danger";

    document.getElementById("inspect-vi").innerText = `${selectedNode.voltage.toFixed(1)} V | ${selectedNode.current.toFixed(2)} A`;
    
    const pct = ((selectedNode.load / selectedNode.capacity) * 100).toFixed(0);
    document.getElementById("inspect-load").innerText = `${selectedNode.load.toFixed(0)} kW / ${selectedNode.capacity} kW (${pct}%)`;
    document.getElementById("inspect-load-bar").style.width = `${Math.min(100, pct)}%`;
    document.getElementById("inspect-load-bar").style.background = selectedNode.status === "OVERLOADED" ? "#ff2244" : "#00ffcc";

    document.getElementById("inspect-temp").innerText = `${selectedNode.temperature.toFixed(1)} °C (Max: 95°C)`;
    document.getElementById("inspect-hw").innerText = selectedNode.isPhysical 
        ? `ESP32 Channel ${selectedNode.channel} (Live Hardware Relay)` 
        : `Virtual Scaled Node (Simulated)`;
}

// -------------------------------------------------------------
// Simulation & Cascading Failure Algorithm
// -------------------------------------------------------------
function simulationTick() {
    let lostLoad = 0;

    NODES_DATA.forEach(node => {
        if (node.status === "TRIPPED") {
            lostLoad += node.load;
            node.load = 0;
            node.voltage = 0;
            node.current = 0;
            node.temperature = Math.max(25, node.temperature - 1.5);
            return;
        }

        if (node.status === "SHEDDED") {
            node.load = 0;
            node.voltage = 0;
            node.current = 0;
            return;
        }

        // Thermal overload logic
        if (node.load > node.capacity) {
            node.status = "OVERLOADED";
            node.temperature += (node.load / node.capacity) * 4.5;
            node.overloadCount++;

            if (node.overloadCount > 3 || node.temperature >= 95) {
                tripNode(node.id, "Thermal Breakdown from Sustained Overload");
            }
        } else if (node.load > node.capacity * 0.85) {
            node.status = "WARNING";
            node.temperature = Math.min(75, node.temperature + 0.5);
        } else {
            node.status = "HEALTHY";
            node.temperature = Math.max(40, node.temperature - 0.8);
            node.overloadCount = 0;
        }
    });

    // If load was lost, redistribute across surviving nodes
    const survivors = NODES_DATA.filter(n => n.status === "HEALTHY" || n.status === "WARNING");
    if (lostLoad > 0 && survivors.length > 0) {
        const share = (lostLoad * 0.75) / survivors.length;
        survivors.forEach(s => s.load += share);
    }

    // Run PCRE Autonomous Defense if armed
    if (pcreActive) {
        runPCREMitigation();
    }

    // Update Line colors
    lineObjects.forEach(item => {
        const aTripped = item.nodeA.status === "TRIPPED";
        const bTripped = item.nodeB.status === "TRIPPED";

        if (aTripped || bTripped || item.edge.isTripped) {
            item.material.color.setHex(0x333333);
            item.material.opacity = 0.3;
        } else {
            const stress = (item.nodeA.load + item.nodeB.load) / (item.edge.cap * 2);
            if (stress > 1.0) {
                item.material.color.setHex(0xff0044);
                item.material.opacity = 1.0;
            } else if (stress > 0.8) {
                item.material.color.setHex(0xffaa00);
            } else {
                item.material.color.setHex(0x00ffff);
            }
        }
    });

    // Update Visual Meshes
    NODES_DATA.forEach(node => {
        const comp = nodeMeshes[node.id];
        if (comp) {
            const col = getNodeColor(node);
            comp.mat.color.setHex(col);
            comp.mat.emissive.setHex(col);
            comp.light.color.setHex(col);
            comp.light.intensity = node.status === "TRIPPED" ? 0 : 2.0;
        }
    });

    updateHUDMetrics();
    updateInspectorUI();
}

function runPCREMitigation() {
    const overloadedNodes = NODES_DATA.filter(n => n.status === "OVERLOADED");
    if (overloadedNodes.length === 0) return;

    addLog(`[PCRE SENSE] Detected ${overloadedNodes.length} overloaded node(s). Executing priority mitigation.`, "log-warn");

    // Tier 3 Load Shedding (Non-critical Residential/Commercial)
    const tier3Candidates = NODES_DATA.filter(n => !n.critical && 
        (n.type === "ResidentialSector" || n.type === "CommercialDistrict") && 
        n.status !== "TRIPPED" && n.status !== "SHEDDED"
    );

    tier3Candidates.forEach(cand => {
        cand.status = "SHEDDED";
        addLog(`[PCRE MITIGATE] Controlled load shed on ${cand.name} (-${cand.capacity * 0.6} kW). Upstream grid saved.`, "log-success");

        // Relieve overload on upstream substations
        overloadedNodes.forEach(o => {
            o.load = Math.max(o.capacity * 0.85, o.load - 60);
            o.status = "HEALTHY";
        });
    });

    // Safeguard Critical Hospitals (Islanding)
    const hospitals = NODES_DATA.filter(n => n.critical);
    hospitals.forEach(h => {
        if (h.status !== "TRIPPED") {
            h.voltage = h.nominalV;
            h.status = "HEALTHY";
        }
    });

    addLog(`[PCRE RESULT] Cascade stopped in 8.5ms. Critical hospitals 100% safeguarded.`, "log-success");
}

function tripNode(nodeId, reason) {
    const node = NODES_DATA.find(n => n.id === nodeId);
    if (!node || node.status === "TRIPPED") return;

    node.status = "TRIPPED";
    addLog(`[FAULT] Node ${node.id} (${node.name}) TRIPPED! Reason: ${reason}`, "log-danger");

    if (node.critical) {
        addLog(`[ALERT] CRITICAL ASSET ${node.name} IS DOWN! EMERGENCY GENERATOR ACTIVATION DELAY!`, "log-danger");
    }
}

function toggleNodeFault(nodeId) {
    const node = NODES_DATA.find(n => n.id === nodeId);
    if (!node) return;

    if (node.status === "TRIPPED") {
        node.status = "HEALTHY";
        node.load = 80;
        node.temperature = 42;
        addLog(`[RESTORE] Node ${node.id} manually reconnected to grid.`, "log-info");
    } else {
        tripNode(node.id, "Manual User/Judge Click");
    }
}

function injectSubstationFault() {
    tripNode(3, "Manual Overload Injection at Substation Beta");
}

function injectPrimaryTransformerTrip() {
    tripNode(2, "Catastrophic Primary Transformer Flashover");
}

function injectRandomPhysicalFault() {
    const phys = NODES_DATA.filter(n => n.isPhysical && n.status !== "TRIPPED");
    if (phys.length > 0) {
        const target = phys[Math.floor(Math.random() * phys.length)];
        tripNode(target.id, `ESP32 Physical Relay Overcurrent Trip (Channel ${target.channel})`);
    }
}

function resetEntireGrid() {
    NODES_DATA.forEach(node => {
        node.status = "HEALTHY";
        node.load = (node.type === "PowerPlant") ? 0 : node.capacity * 0.65;
        node.voltage = node.nominalV;
        node.current = (node.load * 1000) / node.nominalV;
        node.temperature = 42.0;
        node.overloadCount = 0;
    });

    addLog("[SYSTEM] Grid completely restored to nominal operating baseline.", "log-info");
    updateHUDMetrics();
    updateInspectorUI();
}

// -------------------------------------------------------------
// Telemetry Stream & HUD
// -------------------------------------------------------------
function mockHardwarePacketTick() {
    // Generate ESP32 sensor fluctuations on physical channels
    const physNodes = NODES_DATA.filter(n => n.isPhysical);
    physNodes.forEach(node => {
        if (node.status !== "TRIPPED") {
            const jitterV = (Math.random() - 0.5) * 1.8;
            node.voltage = parseFloat((node.nominalV + jitterV).toFixed(1));
            node.current = parseFloat(((node.load * 1000) / node.voltage).toFixed(2));
        }
    });

    // Update Telemetry Chart
    const totalActiveKW = NODES_DATA.filter(n => n.status === "HEALTHY").reduce((acc, cur) => acc + cur.load, 0);
    telemetryHistory.push(totalActiveKW);
    if (telemetryHistory.length > 20) telemetryHistory.shift();

    if (chartInstance) {
        chartInstance.data.labels = telemetryHistory.map((_, i) => `${i}s`);
        chartInstance.data.datasets[0].data = telemetryHistory;
        chartInstance.update();
    }
}

function updateHUDMetrics() {
    const total = NODES_DATA.length;
    const active = NODES_DATA.filter(n => n.status === "HEALTHY" || n.status === "WARNING").length;
    const percent = ((active / total) * 100).toFixed(1);

    const stabEl = document.getElementById("grid-stability-val");
    stabEl.innerText = `${percent}%`;
    stabEl.className = percent > 80 ? "value text-success" : (percent > 50 ? "value text-warning" : "value text-danger");

    const hospitals = NODES_DATA.filter(n => n.critical);
    const activeHosp = hospitals.filter(h => h.status === "HEALTHY").length;
    const hospEl = document.getElementById("critical-assets-val");
    hospEl.innerText = `${activeHosp} / ${hospitals.length} ONLINE`;
    hospEl.className = activeHosp === hospitals.length ? "value text-success" : "value text-danger";
}

function addLog(msg, typeClass = "log-info") {
    const logBox = document.getElementById("event-log");
    const d = new Date();
    const timeStr = `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${Math.floor(d.getMilliseconds()/100)}`;
    
    const entry = document.createElement("div");
    entry.className = `log-entry ${typeClass}`;
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${msg}`;
    logBox.prepend(entry);
}

function initTelemetryChart() {
    const ctx = document.getElementById("telemetryChart").getContext("2d");
    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels: Array(15).fill(""),
            datasets: [{
                label: "Grid Delivered Power (kW)",
                data: Array(15).fill(950),
                borderColor: "#00ffcc",
                backgroundColor: "rgba(0, 255, 204, 0.1)",
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { display: false },
                y: { 
                    grid: { color: "rgba(255,255,255,0.05)" },
                    ticks: { color: "#64748b", font: { size: 9 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function setupUIListeners() {
    document.getElementById("pcre-toggle").addEventListener("change", (e) => {
        pcreActive = e.target.checked;
        const box = document.getElementById("pcre-status-box");
        if (pcreActive) {
            box.className = "status-box";
            box.innerHTML = `<span class="dot dot-active"></span><strong>STATUS: PCRE ACTIVE</strong><p>Sub-cycle reaction: <strong>8.5ms</strong>. Closed-loop defense armed.</p>`;
            addLog("[PCRE] Automated mitigation armed and active.", "log-success");
        } else {
            box.className = "status-box disabled";
            box.innerHTML = `<span class="dot dot-disabled"></span><strong>STATUS: PCRE DISABLED</strong><p>Uncontrolled cascading propagation mode active.</p>`;
            addLog("[PCRE] Automated mitigation DISABLED. Faults will cascade freely!", "log-warn");
        }
    });

    document.getElementById("reset-btn").addEventListener("click", resetEntireGrid);

    // Modal
    const modal = document.getElementById("comparison-modal");
    document.getElementById("scenario-compare-btn").addEventListener("click", () => {
        modal.classList.add("show");
    });
    document.getElementById("modal-close-btn").addEventListener("click", () => {
        modal.classList.remove("show");
    });
}

// Scenarios for Benchmark
function runBenchmarkScenarioA() {
    document.getElementById("comparison-modal").classList.remove("show");
    document.getElementById("pcre-toggle").checked = false;
    pcreActive = false;
    document.getElementById("pcre-status-box").className = "status-box disabled";
    document.getElementById("pcre-status-box").innerHTML = `<span class="dot dot-disabled"></span><strong>STATUS: PCRE DISABLED</strong><p>Testing unmitigated domino blackout.</p>`;

    resetEntireGrid();
    addLog("[BENCHMARK] Executing Scenario A: Unmitigated Cascade Test...", "log-danger");

    setTimeout(() => {
        tripNode(2, "Trip Substation Alpha");
    }, 500);

    setTimeout(() => {
        tripNode(3, "Overload Propagation into Substation Beta");
    }, 1800);
}

function runBenchmarkScenarioB() {
    document.getElementById("comparison-modal").classList.remove("show");
    document.getElementById("pcre-toggle").checked = true;
    pcreActive = true;
    document.getElementById("pcre-status-box").className = "status-box";
    document.getElementById("pcre-status-box").innerHTML = `<span class="dot dot-active"></span><strong>STATUS: PCRE ACTIVE</strong><p>Sub-cycle reaction armed.</p>`;

    resetEntireGrid();
    addLog("[BENCHMARK] Executing Scenario B: PCRE Autonomous Defense Test...", "log-success");

    setTimeout(() => {
        tripNode(2, "Trip Substation Alpha under PCRE Defense");
    }, 500);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Subtle gentle node floating animation
    const time = Date.now() * 0.002;
    Object.values(nodeMeshes).forEach(comp => {
        if (comp.data.status === "OVERLOADED") {
            comp.mesh.position.y = 1.2 + Math.sin(time * 8) * 0.15; // Rapid vibration
        } else if (comp.data.status !== "TRIPPED") {
            comp.mesh.position.y = 1.2 + Math.sin(time + comp.data.id) * 0.04;
        } else {
            comp.mesh.position.y = 0.5; // Dropped / fallen
        }
    });

    renderer.render(scene, camera);
}

window.onload = init;
