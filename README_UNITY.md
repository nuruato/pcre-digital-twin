# PCRE Unity 3D Digital Twin - Setup & Execution Guide

## Prerequisites
- Unity Editor 6 (`6000.5.5f1` or later) — *Already installed at `C:\Program Files\Unity\Hub\Editor\6000.5.5f1\Editor\Unity.exe`*
- Standard 3D Built-in or URP template

---

## Quick Setup Instructions

### Step 1: Open or Create Project in Unity Hub
1. Open **Unity Hub**.
2. Click **Open** -> **Add project from disk**.
3. Select this folder:
   `C:\Users\manis\.gemini\antigravity\scratch\PCRE_DigitalTwin`
4. If opening as an existing project for the first time, Unity will automatically generate `ProjectSettings` and compile the scripts located in `Assets/Scripts/`.

### Step 2: One-Click Scene Generation
1. Once Unity finishes compiling scripts, look at the top menu bar.
2. Click on the custom menu:
   **`PCRE` -> `Build Complete 3D Digital Twin Scene`**
3. In under 2 seconds, the Editor script will procedurally generate:
   - Complete 12-node 3D Smart City Grid (Power plant, substations, hospitals, emergency HQ, water plant, industrial & residential districts).
   - Dynamic 3D Transmission Lines with line renderers.
   - Point lighting and material emission shaders.
   - Orbit Camera rig (`CameraController.cs`).
   - Core simulation engines (`CascadeEngine.cs`, `MitigationEngine.cs`, `HardwareBridge.cs`, `UIManager.cs`).
4. Save the scene as `Assets/Scenes/PCRE_MainScene.unity`.

### Step 3: Press Play!
1. Click the **Play** button in Unity.
2. Left-click any 3D node to inspect its telemetry or trigger a fault injection.
3. Right-click and drag the mouse to orbit around the city in 3D.
4. Scroll the mouse wheel to zoom in and out.
5. Watch the cascade failure propagate or test the PCRE automated defense!

---

## Hardware Testbed Integration (ESP32)
1. Flash `hardware/pcre_esp32_firmware.ino` to your ESP32 board using Arduino IDE.
2. Connect the ESP32 to your PC via USB.
3. Check the COM port in Windows Device Manager (e.g. `COM3` or `COM4`).
4. In Unity, select the `PCRE_Systems` GameObject in the hierarchy:
   - On the `HardwareBridge` component:
     - Set **Port Name** to your COM port (e.g., `COM3`).
     - Check **Connect On Start**.
5. If the ESP32 is unplugged, `HardwareBridge` will automatically run in **Mock Emulation Mode**, ensuring your demo never crashes or freezes during presentations!
