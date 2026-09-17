// PCRE 3D Digital Twin Engine (Three.js Web Prototype)
// Fully dynamic power grid cascade and autonomous mitigation simulation

const NODES_DATA = [
    { id: 1, name: "Main Hydro/Gas Power Plant", type: "PowerPlant", x: -22, z: 0, capacity: 1500, baseLoad: 0, load: 0, critical: false, isPhysical: true, channel: 0, nominalV: 230 },
    { id: 2, name: "Transmission Substation Alpha", type: "PrimarySubstation", x: -11, z: 6, capacity: 500, baseLoad: 420, load: 420, critical: false, isPhysical: true, channel: 1, nominalV: 230 },
    { id: 3, name: "Substation Beta (Central)", type: "PrimarySubstation", x: 0, z: 8, capacity: 480, baseLoad: 450, load: 450, critical: false, isPhysical: true, channel: 2, nominalV: 230 },
    { id: 4, name: "Metropolitan General Hospital", type: "CriticalHospital", x: -5, z: -9, capacity: 160, baseLoad: 110, load: 110, critical: true, isPhysical: true, channel: 3, nominalV: 230 },
    { id: 5, name: "Emergency Response & 911 HQ", type: "EmergencyCenter", x: 6, z: -8, capacity: 130, baseLoad: 85, load: 85, critical: true, isPhysical: true, channel: 4, nominalV: 230 },
    { id: 6, name: "City Water Filtration Plant", type: "WaterTreatment", x: -14, z: -14, capacity: 180, baseLoad: 125, load: 125, critical: true, isPhysical: true, channel: 5, nominalV: 230 },
    { id: 7, name: "North Advanced Industrial Park", type: "IndustrialZone", x: 13, z: 12, capacity: 250, baseLoad: 180, load: 180, critical: false, isPhysical: true, channel: 6, nominalV: 230 },
    { id: 8, name: "East Commercial Mall Hub", type: "CommercialDistrict", x: 20, z: 2, capacity: 200, baseLoad: 140, load: 140, critical: false, isPhysical: true, channel: 7, nominalV: 230 },
    { id: 9, name: "North Residential Sector A", type: "ResidentialSector", x: -9, z: 16, capacity: 150, baseLoad: 100, load: 100, critical: false, isPhysical: false, channel: -1, nominalV: 230 },
    { id: 10, name: "North Residential Sector B", type: "ResidentialSector", x: 5, z: 17, capacity: 150, baseLoad: 95, load: 95, critical: false, isPhysical: false, channel: -1, nominalV: 230 },
    { id: 11, name: "Substation Gamma (South)", type: "DistributionSubstation", x: 9, z: -15, capacity: 260, baseLoad: 160, load: 160, critical: false, isPhysical: false, channel: -1, nominalV: 230 },
    { id: 12, name: "South Residential District", type: "ResidentialSector", x: 18, z: -13, capacity: 140, baseLoad: 90, load: 90, critical: false, isPhysical: false, channel: -1, nominalV: 230 }
];

const EDGES_DATA = [
    { a: 1, b: 2, cap: 600 },
    { a: 1, b: 3, cap: 550 },
    { a: 2, b: 3, cap: 350 }, // Primary Tie Line
    { a: 2, b: 4, cap: 200 }, // Alpha -> Hospital
    { a: 2, b: 6, cap: 190 }, // Alpha -> Water Plant
    { a: 3, b: 5, cap: 200 }, // Beta -> Emergency HQ
    { a: 3, b: 7, cap: 250 }, // Beta -> Industrial
    { a: 3, b: 8, cap: 220 }, // Beta -> Commercial
    { a: 2, b: 9, cap: 160 }, // Alpha -> Residential A
    { a: 3, b: 10, cap: 160 }, // Beta -> Residential B
    { a: 5, b: 11, cap: 200 },
    { a: 8, b: 11, cap: 220 },
    { a: 11, b: 12, cap: 160 },
    { a: 4, b: 5, cap: 150 }  // Hospital Backup Tie-Line
];

let scene, camera, renderer, controls;
let nodeMeshes = {}, lineObjects = [];
let selectedNode = null;
let pcreActive = true;
let chartInstance = null;
let telemetryHistory = [];

function init() {
    const container = document.getElementById("canvas-container");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b12);
    scene.fog = new THREE.FogExp2(0x070b12, 0.012);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 38, 48);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 15;
    controls.maxDistance = 90;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xaaddee, 1.3);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    createGroundGrid();
    createNodes();
    createPowerLines();
    setupInteractions();
    initTelemetryChart();
    setupUIListeners();

    selectNode(NODES_DATA.find(n => n.id === 4)); // Select Hospital by default

    // Run simulation loop every 500ms
    setInterval(simulationTick, 500);
    setInterval(mockHardwarePacketTick, 1000);

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
    if (node.status === "TRIPPED" || node.status === "BLACKOUT") return 0x1a1a1a;
    if (node.status === "SHEDDED") return 0x2563eb; // Protected blue
    if (node.status === "OVERLOADED") return 0xff1133; // Vibrant alert red
    if (node.status === "WARNING") return 0xffaa00; // Amber warning

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
        node.load = node.baseLoad;
        node.voltage = node.nominalV;
        node.current = (node.load * 1000) / node.nominalV;
        node.temperature = 42.0;
        node.overloadTicks = 0;

        const group = new THREE.Group();
        group.position.set(node.x, 0, node.z);

        let geo;
        if (node.type === "PowerPlant") {
            geo = new THREE.CylinderGeometry(1.8, 2.2, 3.0, 16);
        } else if (node.critical) {
            geo = new THREE.CylinderGeometry(1.3, 1.5, 2.5, 8);
        } else {
            geo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
        }

        const mat = new THREE.MeshStandardMaterial({
            color: getNodeColor(node),
            emissive: getNodeColor(node),
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.6
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 1.2;
        mesh.castShadow = true;
        mesh.userData = { nodeId: node.id };
        group.add(mesh);

        // Indicator Light
        const light = new THREE.PointLight(getNodeColor(node), 1.8, 10);
        light.position.y = 3.0;
        group.add(light);

        // Critical Hospital Glowing Rings
        let rings = [];
        if (node.critical) {
            const ringGeo = new THREE.RingGeometry(1.8, 2.2, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = 0.05;
            group.add(ring);
            rings.push(ring);
        }

        scene.add(group);
        nodeMeshes[node.id] = { group, mesh, light, mat, rings, data: node };
    });
}

function createPowerLines() {
    EDGES_DATA.forEach(edge => {
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
            linewidth: 3,
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
                         selectedNode.status === "SHEDDED" ? "text-cyan" : 
                         selectedNode.status === "OVERLOADED" ? "text-danger" : "text-danger";

    document.getElementById("inspect-vi").innerText = `${selectedNode.voltage.toFixed(1)} V | ${selectedNode.current.toFixed(2)} A`;
    
    const pct = ((selectedNode.load / selectedNode.capacity) * 100).toFixed(0);
    document.getElementById("inspect-load").innerText = `${selectedNode.load.toFixed(0)} kW / ${selectedNode.capacity} kW (${pct}%)`;
    document.getElementById("inspect-load-bar").style.width = `${Math.min(100, pct)}%`;
    document.getElementById("inspect-load-bar").style.background = selectedNode.status === "OVERLOADED" ? "#ff1133" : 
                                                                 selectedNode.status === "SHEDDED" ? "#2563eb" : "#00ffcc";

    document.getElementById("inspect-temp").innerText = `${selectedNode.temperature.toFixed(1)} °C (Max: 95°C)`;
    document.getElementById("inspect-hw").innerText = selectedNode.isPhysical 
        ? `ESP32 Channel ${selectedNode.channel} (Live Hardware Relay)` 
        : `Virtual Scaled Node (Simulated)`;
}

// -------------------------------------------------------------
// DYNAMIC GRAPH CASCADE ENGINE
// -------------------------------------------------------------
function simulationTick() {
    const nodeAlpha = NODES_DATA.find(n => n.id === 2);
    const nodeBeta = NODES_DATA.find(n => n.id === 3);
    const nodeHospital = NODES_DATA.find(n => n.id === 4);
    const nodeEmergency = NODES_DATA.find(n => n.id === 5);
    const nodeWater = NODES_DATA.find(n => n.id === 6);

    // 1. Check if both Primary Substations are dead -> CATASTROPHIC CITY BLACKOUT
    const alphaDead = (nodeAlpha.status === "TRIPPED");
    const betaDead = (nodeBeta.status === "TRIPPED");

    if (alphaDead && betaDead) {
        // City loses all power!
        NODES_DATA.forEach(n => {
            if (n.id !== 1 && n.status !== "TRIPPED") { // Node 1 is power plant
                n.status = "BLACKOUT";
                n.load = 0;
                n.voltage = 0;
                n.current = 0;
                n.temperature = Math.max(25, n.temperature - 1.0);
            }
        });
    } 
    // 2. If Substation Beta is TRIPPED, its heavy load surges onto Substation Alpha
    else if (betaDead && !alphaDead) {
        if (nodeAlpha.status !== "SHEDDED") {
            // Unmitigated surge: Beta's 450 kW diverts into Alpha
            const divertedLoad = 380;
            const targetLoad = nodeAlpha.baseLoad + divertedLoad; // 420 + 380 = 800 kW!
            nodeAlpha.load = targetLoad;

            // Alpha's capacity is 500kW -> It is severely OVERLOADED (160%)!
            if (nodeAlpha.load > nodeAlpha.capacity) {
                nodeAlpha.status = "OVERLOADED";
                nodeAlpha.temperature += 8.5; // Rapid heating
                nodeAlpha.overloadTicks++;

                // If PCRE is active, trigger immediate sub-cycle mitigation
                if (pcreActive) {
                    runPCREMitigation();
                } 
                // If PCRE is OFF, thermal breakdown trips Alpha after ~2 seconds
                else if (nodeAlpha.overloadTicks >= 4 || nodeAlpha.temperature >= 95) {
                    tripNode(2, "Catastrophic Overload Flashover (Alpha Thermal Breakdown)");
                }
            }
        }
    } 
    // 3. If Substation Alpha is TRIPPED, its load surges onto Substation Beta
    else if (alphaDead && !betaDead) {
        const divertedLoad = 380;
        nodeBeta.load = nodeBeta.baseLoad + divertedLoad;

        if (nodeBeta.load > nodeBeta.capacity) {
            nodeBeta.status = "OVERLOADED";
            nodeBeta.temperature += 8.5;
            nodeBeta.overloadTicks++;

            if (pcreActive) {
                runPCREMitigation();
            } else if (nodeBeta.overloadTicks >= 4 || nodeBeta.temperature >= 95) {
                tripNode(3, "Catastrophic Overload Flashover (Beta Thermal Breakdown)");
            }
        }
    }
    // 4. Nominal Stable Flow
    else {
        NODES_DATA.forEach(n => {
            if (n.status === "HEALTHY") {
                n.load = n.baseLoad;
                n.temperature = Math.max(42.0, n.temperature - 0.5);
                n.overloadTicks = 0;
            }
        });
    }

    // Update Line visual stress
    lineObjects.forEach(item => {
        const aTripped = (item.nodeA.status === "TRIPPED" || item.nodeA.status === "BLACKOUT");
        const bTripped = (item.nodeB.status === "TRIPPED" || item.nodeB.status === "BLACKOUT");

        if (aTripped || bTripped || item.edge.isTripped) {
            item.material.color.setHex(0x222222);
            item.material.opacity = 0.25;
        } else if (item.nodeA.status === "OVERLOADED" || item.nodeB.status === "OVERLOADED") {
            item.material.color.setHex(0xff1133); // Flashing red line
            item.material.opacity = 1.0;
        } else if (item.nodeA.load > item.nodeA.capacity * 0.85 || item.nodeB.load > item.nodeB.capacity * 0.85) {
            item.material.color.setHex(0xffaa00);
            item.material.opacity = 0.9;
        } else {
            item.material.color.setHex(0x00ffff);
            item.material.opacity = 0.85;
        }
    });

    // Update Visual 3D Meshes & Lights
    NODES_DATA.forEach(node => {
        const comp = nodeMeshes[node.id];
        if (comp) {
            const col = getNodeColor(node);
            comp.mat.color.setHex(col);
            comp.mat.emissive.setHex(col);
            comp.mat.emissiveIntensity = (node.status === "TRIPPED" || node.status === "BLACKOUT") ? 0.0 : 0.6;
            comp.light.color.setHex(col);
            comp.light.intensity = (node.status === "TRIPPED" || node.status === "BLACKOUT") ? 0 : 2.2;

            if (comp.rings && comp.rings.length > 0) {
                comp.rings[0].visible = (node.status !== "TRIPPED" && node.status !== "BLACKOUT");
            }
        }
    });

    updateHUDMetrics();
    updateInspectorUI();
}

function runPCREMitigation() {
    const nodeAlpha = NODES_DATA.find(n => n.id === 2);
    const nodeBeta = NODES_DATA.find(n => n.id === 3);
    const overloaded = (nodeAlpha.status === "OVERLOADED") ? nodeAlpha : (nodeBeta.status === "OVERLOADED" ? nodeBeta : null);

    if (!overloaded) return;

    addLog(`[PCRE SENSE] Sudden dV/dt surge detected on ${overloaded.name} (${overloaded.load.toFixed(0)} kW / ${overloaded.capacity} kW).`, "log-warn");

    // Tier 3 Load Shedding: Shed Residential A (Node 9) and Commercial Mall (Node 8)
    const candidates = NODES_DATA.filter(n => (n.id === 8 || n.id === 9 || n.id === 10) && n.status !== "SHEDDED" && n.status !== "TRIPPED");

    let shedTotal = 0;
    candidates.forEach(cand => {
        cand.status = "SHEDDED";
        cand.load = 0;
        cand.voltage = 0;
        cand.current = 0;
        shedTotal += cand.baseLoad;
        addLog(`[PCRE MITIGATE] Controlled load shed: ${cand.name} (-${cand.baseLoad} kW). Priority Tier 3 disconnected.`, "log-success");
    });

    // Relieve overloaded substation back to safe operating envelope
    overloaded.load = Math.max(overloaded.capacity * 0.82, overloaded.load - shedTotal);
    overloaded.status = "HEALTHY";
    overloaded.temperature = 55.0;
    overloaded.overloadTicks = 0;

    // Guarantee 100% power to Hospitals & 911 HQ via Islanding
    const hospital = NODES_DATA.find(n => n.id === 4);
    const emergency = NODES_DATA.find(n => n.id === 5);
    hospital.status = "HEALTHY";
    hospital.voltage = hospital.nominalV;
    emergency.status = "HEALTHY";
    emergency.voltage = emergency.nominalV;

    addLog(`[PCRE RESULT] Cascade stopped in 8.5ms! Overload relieved. 100% Critical Hospitals & Emergency HQ protected.`, "log-success");
}

function tripNode(nodeId, reason) {
    const node = NODES_DATA.find(n => n.id === nodeId);
    if (!node || node.status === "TRIPPED") return;

    node.status = "TRIPPED";
    node.load = 0;
    node.voltage = 0;
    node.current = 0;

    addLog(`[FAULT] ${node.name} TRIPPED! Reason: ${reason}`, "log-danger");

    if (node.critical) {
        addLog(`[CRITICAL ALERT] ${node.name} LOST POWER! EMERGENCY SYSTEM ENGAGED!`, "log-danger");
    }

    updateHUDMetrics();
    updateInspectorUI();
}

function toggleNodeFault(nodeId) {
    const node = NODES_DATA.find(n => n.id === nodeId);
    if (!node) return;

    if (node.status === "TRIPPED" || node.status === "BLACKOUT") {
        node.status = "HEALTHY";
        node.load = node.baseLoad;
        node.voltage = node.nominalV;
        node.temperature = 42;
        addLog(`[RESTORE] ${node.name} restored to nominal state.`, "log-info");
    } else {
        tripNode(node.id, "Manual User Interaction");
    }
}

function injectSubstationFault() {
    tripNode(3, "Manual Overload Injection at Substation Beta");
}

function injectPrimaryTransformerTrip() {
    tripNode(2, "Catastrophic Flashover at Substation Alpha");
}

function injectRandomPhysicalFault() {
    const candidates = NODES_DATA.filter(n => n.isPhysical && n.status !== "TRIPPED");
    if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        tripNode(target.id, `ESP32 Physical Relay Trip on Channel ${target.channel}`);
    }
}

function resetEntireGrid() {
    NODES_DATA.forEach(node => {
        node.status = "HEALTHY";
        node.load = node.baseLoad;
        node.voltage = node.nominalV;
        node.current = (node.load * 1000) / node.nominalV;
        node.temperature = 42.0;
        node.overloadTicks = 0;
    });

    addLog("[SYSTEM] Grid completely restored to nominal operating baseline (100% Online).", "log-info");
    updateHUDMetrics();
    updateInspectorUI();
}

function mockHardwarePacketTick() {
    const physNodes = NODES_DATA.filter(n => n.isPhysical && n.status === "HEALTHY");
    physNodes.forEach(node => {
        const jitterV = (Math.random() - 0.5) * 1.5;
        node.voltage = parseFloat((node.nominalV + jitterV).toFixed(1));
        node.current = parseFloat(((node.load * 1000) / node.voltage).toFixed(2));
    });

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
    if (stabEl) {
        stabEl.innerText = `${percent}%`;
        stabEl.className = percent > 80 ? "value text-success" : (percent > 50 ? "value text-warning" : "value text-danger");
    }

    const hospitals = NODES_DATA.filter(n => n.critical);
    const activeHosp = hospitals.filter(h => h.status === "HEALTHY").length;
    const hospEl = document.getElementById("critical-assets-val");
    if (hospEl) {
        hospEl.innerText = `${activeHosp} / ${hospitals.length} ONLINE`;
        hospEl.className = activeHosp === hospitals.length ? "value text-success" : "value text-danger";
    }
}

function addLog(msg, typeClass = "log-info") {
    const logBox = document.getElementById("event-log");
    if (!logBox) return;
    const d = new Date();
    const timeStr = `${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${Math.floor(d.getMilliseconds()/100)}`;
    
    const entry = document.createElement("div");
    entry.className = `log-entry ${typeClass}`;
    entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${msg}`;
    logBox.prepend(entry);
}

function initTelemetryChart() {
    const canvas = document.getElementById("telemetryChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
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
    const toggle = document.getElementById("pcre-toggle");
    if (toggle) {
        toggle.addEventListener("change", (e) => {
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
    }

    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) resetBtn.addEventListener("click", resetEntireGrid);

    const modal = document.getElementById("comparison-modal");
    const compareBtn = document.getElementById("scenario-compare-btn");
    const closeBtn = document.getElementById("modal-close-btn");

    if (compareBtn && modal) {
        compareBtn.addEventListener("click", () => modal.classList.add("show"));
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.classList.remove("show"));
    }
}

// Scenarios for Benchmark Modal
function runBenchmarkScenarioA() {
    const modal = document.getElementById("comparison-modal");
    if (modal) modal.classList.remove("show");

    const toggle = document.getElementById("pcre-toggle");
    if (toggle) toggle.checked = false;
    pcreActive = false;

    const box = document.getElementById("pcre-status-box");
    if (box) {
        box.className = "status-box disabled";
        box.innerHTML = `<span class="dot dot-disabled"></span><strong>STATUS: PCRE DISABLED</strong><p>Testing unmitigated domino blackout.</p>`;
    }

    resetEntireGrid();
    addLog("[BENCHMARK] Executing Scenario A: Unmitigated Cascade Test...", "log-danger");

    setTimeout(() => {
        tripNode(3, "Substation Beta Trips");
    }, 400);
}

function runBenchmarkScenarioB() {
    const modal = document.getElementById("comparison-modal");
    if (modal) modal.classList.remove("show");

    const toggle = document.getElementById("pcre-toggle");
    if (toggle) toggle.checked = true;
    pcreActive = true;

    const box = document.getElementById("pcre-status-box");
    if (box) {
        box.className = "status-box";
        box.innerHTML = `<span class="dot dot-active"></span><strong>STATUS: PCRE ACTIVE</strong><p>Sub-cycle reaction armed.</p>`;
    }

    resetEntireGrid();
    addLog("[BENCHMARK] Executing Scenario B: PCRE Autonomous Defense Test...", "log-success");

    setTimeout(() => {
        tripNode(3, "Substation Beta Trips under PCRE Defense");
    }, 400);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const time = Date.now() * 0.003;
    Object.values(nodeMeshes).forEach(comp => {
        if (comp.data.status === "OVERLOADED") {
            // Rapid violent vibration
            comp.mesh.position.y = 1.2 + Math.sin(time * 12) * 0.22;
        } else if (comp.data.status !== "TRIPPED" && comp.data.status !== "BLACKOUT") {
            comp.mesh.position.y = 1.2 + Math.sin(time + comp.data.id) * 0.04;
        } else {
            comp.mesh.position.y = 0.5; // Dropped / dead
        }
    });

    renderer.render(scene, camera);
}

window.onload = init;
