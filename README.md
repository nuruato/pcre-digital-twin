# PCRE: Power Cyber-Physical Resilience Engine & 3D Digital Twin
### Predictive Cascading Failure Mitigation for Sustainable Urban Grids (SDG 11)

[![SDG 11](https://img.shields.io/badge/SDG%2011-Sustainable%20Cities-orange.svg)](https://sdgs.un.org/goals/goal11)
[![Unity 6](https://img.shields.io/badge/Unity-6000.5.5f1-blue.svg)](https://unity.com/)
[![WebGL](https://img.shields.io/badge/WebGL-Three.js-green.svg)](https://threejs.org/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20ADC%20Telemetry-red.svg)](https://www.espressif.com/)

---

## Overview

Infrastructure networks—such as power grids, hospitals, and water distribution facilities—suffer from severe vulnerability to **cascading failures**: where a localized disruption propagates uncontrollably into systemic blackout.

**PCRE (Power Cyber-Physical Resilience Engine)** tackles this challenge through a hybrid cyber-physical architecture:
1. **Physical Micro-Grid Testbed**: 6 to 8 node hardware testbed monitored by an **ESP32 microcontroller**, providing real-time voltage, current, and relay state telemetry.
2. **ASIC / Edge Reflex Core**: Closed-loop predictive mitigation engine executing sub-cycle ($8.5\text{ ms}$) rate-of-change detection ($dV/dt$), priority-based load shedding, and critical infrastructure islanding.
3. **Interactive 3D Digital Twin (Unity & Three.js WebGL)**: Dynamic spatial dashboard allowing city planners and grid operators to inject faults, examine network relationships, and compare resilience scenarios.

---

## The PCRE Pipeline

```
[ SENSE ]      --> Real-time telemetry via ESP32 ADC & sensors (V, I, Temp)
[ DETECT ]     --> Sub-cycle rate-of-change (dV/dt, dI/dt) fault detection
[ PREDICT ]    --> Graph-theoretic power redistribution & thermal overload modeling
[ PRIORITIZE ] --> Hierarchical asset tagging (Tier 1: Hospitals, Tier 3: Residential)
[ MITIGATE ]   --> Sub-millisecond targeted load-shedding & smart islanding
[ VISUALIZE ]  --> 3D Digital Twin HUD for real-time planner scenario exploration
```

---

## Scenario Comparison (Hackathon Benchmark)

| Evaluation Metric | Scenario A: Unmitigated Baseline | Scenario B: PCRE Autonomous Defense |
| :--- | :--- | :--- |
| **Grid Survival Rate** | **25.0%** (Catastrophic collapse) | **91.7%** (Cascade contained) |
| **Tier 1 Critical Assets (Hospitals)** | **0% Online** (Complete blackout) | **100% Online** (Uninterrupted power) |
| **Reaction Time** | $> 1.5 - 3.0$ seconds (Too late) | **8.5 milliseconds** (Sub-cycle reflex) |
| **Unserved Energy Deficit** | **780 kW (73% loss)** | **85 kW** (Managed non-critical shed) |
| **Restoration Effort** | Black-start required | Immediate automated reclosure |

---

## Quickstart Guide

### 1. Instant 3D Web Prototype (Zero-Install)
Launch the interactive 3D WebGL simulator directly in any modern browser:
```bash
cd web_prototype
python -m http.server 8080
```
Open **`http://localhost:8080/index.html`** in your browser.
- **Left-Click & Drag**: Orbit around the 3D smart city grid.
- **Click Any Node**: Inspect live Voltage, Current, Load, and Temperature.
- **Scenario Comparison**: Click the top-right button to benchmark Scenario A vs Scenario B.

### 2. Unity 3D Engine Setup
1. Open **Unity Hub** and add this repository directory.
2. Open with **Unity 6 (`6000.5.5f1`)** or later.
3. In Unity, click the top menu bar:  
   **`PCRE` -> `Build Complete 3D Digital Twin Scene`**
4. Press **Play** to run the full simulation with interactive OnGUI controls!

### 3. ESP32 Hardware Integration
1. Flash `hardware/pcre_esp32_firmware.ino` using the Arduino IDE.
2. Connect the ESP32 via USB.
3. Configure the COM port in `HardwareBridge.cs` in Unity, or run the Python bridge:
```bash
python hardware/serial_bridge.py --port COM3
```

---

## Repository Structure

```
├── Assets/
│   ├── Editor/
│   │   └── PCRESceneBuilder.cs       # Procedural 1-click 3D scene generator
│   └── Scripts/
│       ├── Core/
│       │   ├── GridNetworkData.cs    # Data models, enums & telemetry packets
│       │   ├── GridNode.cs           # 3D Node behavior & thermal accumulation
│       │   └── PowerLine.cs          # Dynamic animated transmission lines
│       ├── Simulation/
│       │   ├── CascadeEngine.cs      # Cascading failure & graph redistribution
│       │   └── MitigationEngine.cs   # Autonomous PCRE closed-loop edge defense
│       ├── Hardware/
│       │   └── HardwareBridge.cs     # ESP32 serial bridge (with mock fallback)
│       └── UI/
│           ├── CameraController.cs   # 3D Orbit Camera
│           └── UIManager.cs          # Interactive OnGUI dashboard & inspector
├── web_prototype/                    # Standalone Three.js 3D Web Prototype
│   ├── index.html
│   ├── style.css
│   └── app.js
├── hardware/
│   ├── pcre_esp32_firmware.ino       # ESP32 8-node testbed firmware
│   └── serial_bridge.py              # Python telemetry streamer & test suite
├── docs/
│   └── PITCH_ENHANCEMENT_GUIDE.md    # Hackathon slide-by-slide pitch guide
├── launch_web_demo.bat               # Windows 1-click batch launcher
└── README.md
```

---

## License
MIT License. Built for Hackathon Prototype Demonstration.
