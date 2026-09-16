# Hackathon Pitch Enhancement & Presentation Guide
## Project: PCRE (Power Cyber-Physical Resilience Engine)
**Theme**: Sustainable Cities and Communities (SDG 11)  
**Problem Statement**: *Cascading Failure: When One Failure Becomes Many*

---

## 1. Executive Summary of Changes
Based on the hackathon problem statement and judges' scoring criteria, the original slide deck (`sample-ppt.pdf`) had deep VLSI/hardware rigor but was missing the **interactive human-in-the-loop scenario planning** explicitly demanded by the prompt:

> *"The system should allow users to examine relationships, introduce one or more failures, estimate wider effects, identify disproportionately important assets or connections, and compare alternative scenarios. The goal is to help planners understand where intervention could have the greatest effect."*

We elevated the project by:
1. **Adding VISUALIZE to the pipeline**: `SENSE → DETECT → PREDICT → PRIORITIZE → MITIGATE → VISUALIZE`.
2. **Integrating the 3D Digital Twin**: Bridging the 6-8 node ESP32 hardware testbed with an interactive 3D virtual city grid.
3. **Providing a Dedicated Scenario Comparison Slide**: Side-by-side contrast of **Scenario A (Unmitigated Domino Cascade)** vs **Scenario B (PCRE Autonomous Mitigation)**.
4. **Clarifying Edge/ASIC vs Digital Twin Roles**:
   - **ASIC / Edge hardware**: Sub-millisecond (8.5ms) autonomous closed-loop reflex (fault detection, priority load-shedding, islanding).
   - **Digital Twin**: Macro-level situational awareness and predictive "what-if" scenario testing for city planners.

---

## 2. Slide-by-Slide Deck Revisions (for sample-ppt.pdf)

### Slide 1: Title & SDG Alignment
- **Title**: PCRE: Cyber-Physical Power Resilience Engine & Digital Twin
- **Subtitle**: Predictive Cascading Failure Mitigation for Sustainable Urban Grids
- **SDG Target**: SDG 11 (Sustainable Cities and Communities) & SDG 9 (Resilient Infrastructure).

### Slide 2: The Core Problem – Beyond Isolated Monitoring
- **The Gap**: Traditional utilities monitor transformers in isolation. When one fails, power shifts unpredictably, overloading adjacent transmission lines and causing catastrophic domino blackouts (e.g., 2003 Northeast Blackout, 2021 Texas Freeze).
- **The Challenge**: Planners lack dynamic tools to visualize how a localized trip propagates into system-wide paralysis.

### Slide 3: The PCRE Cyber-Physical Solution Architecture
- **Dual-Layer Ecosystem**:
  1. **Physical Testbed**: 6-8 node physical micro-grid powered by ESP32 sensors (measuring real voltage, current, and relay states).
  2. **ASIC / Edge Core**: Closed-loop high-speed predictive mitigation algorithm.
  3. **3D Digital Twin (Unity & WebGL)**: Interactive spatial dashboard mapping power flows, thermal accumulation, and real-time intervention points.

### Slide 4: Core Workflow Pipeline (Updated!)
Emphasize the expanded 6-stage pipeline:
```
[ SENSE ]      --> Real-time telemetry via ESP32 ADC & sensors (V, I, Temp)
[ DETECT ]     --> Sub-cycle rate-of-change (dV/dt, dI/dt) fault detection
[ PREDICT ]    --> Graph-theoretic power redistribution & thermal overload modeling
[ PRIORITIZE ] --> Hierarchical asset tagging (Tier 1: Hospitals, Tier 3: Residential)
[ MITIGATE ]   --> Sub-millisecond targeted load-shedding & smart islanding
[ VISUALIZE ]  --> 3D Digital Twin HUD for real-time planner scenario exploration
```

### Slide 5: The Interactive Digital Twin in Action
- Show high-resolution screenshots from the Unity/WebGL 3D twin.
- Call out key interactive features:
  - **Click-to-Fail**: Planners can click any substation or line to inject stress.
  - **Dynamic Thermal Modeling**: Nodes heat up before tripping, visualizing the cascade window.
  - **Asset Telemetry Card**: Live inspection of Voltage, Current, Load %, and Hardware Link.

### Slide 6: Scenario Comparison (JUDGES' CRITICAL SLIDE)
Include this exact comparison table:

| Evaluation Metric | Scenario A: No Mitigation (Baseline) | Scenario B: PCRE Active (Our Solution) |
| :--- | :--- | :--- |
| **Grid Survival Rate** | **25.0%** (Catastrophic collapse) | **91.7%** (Cascade contained) |
| **Tier 1 Critical Assets (Hospitals)** | **0% Online** (Complete blackout) | **100% Online** (Uninterrupted power) |
| **Reaction Time** | $> 1.5 - 3.0$ seconds (Too late) | **8.5 milliseconds** (Sub-cycle reflex) |
| **Unserved Energy Deficit** | **780 kW (73% loss)** | **85 kW** (Managed non-critical shed) |
| **Black Start / Restoration** | Hours / Days required | Immediate automated reclose |

---

## 3. Live Pitch Scripts

### 2-Minute Elevator Pitch (Semi-Finals / Booth Demo)
> *"Judges, imagine a major substation in your city fails due to extreme heat. Within three seconds, the load violently surges into neighboring routes. Secondary transformers overheat and trip. Within minutes, traffic signals fail, water pumps die, and hospitals are thrown onto emergency generators. This is a cascading failure—where one failure becomes many.*
>
> *Today, we introduce **PCRE**: the Cyber-Physical Power Resilience Engine. PCRE bridges a real-world 8-node physical hardware testbed running on an ESP32 with an ASIC-oriented edge processing core and a high-fidelity 3D Digital Twin.*
>
> *Our pipeline senses the fault, predicts where the cascade will travel using graph theory, prioritizes critical infrastructure like hospitals, and executes sub-millisecond targeted load shedding on non-critical sectors—all within 8.5 milliseconds!*
>
> *Right here on our 3D Digital Twin, city planners can introduce failures at any asset, test alternative mitigation scenarios, and watch in real-time as PCRE stops the domino effect, preserving 91.7% of the grid and keeping 100% of critical hospitals online. Thank you!"*

---

## 4. Tough Questions Judges Will Ask & How to Answer

### Q1: "Why do you need both an ASIC/Edge engine AND a Digital Twin?"
**Answer**:
> *"They solve two distinct time domains. The cascade happens in sub-second intervals—human operators cannot click buttons fast enough to stop an electrical cascade. That requires our ASIC/edge hardware engine executing in 8.5 milliseconds. But city planners and grid operators need macro-level situational awareness to understand systemic vulnerabilities, pre-plan defenses, and test 'what-if' scenarios before disasters strike. The Digital Twin is the bridge between edge physics and human decision-making."*

### Q2: "How does the physical ESP32 testbed communicate with the 3D model?"
**Answer**:
> *"The ESP32 samples high-speed ADC voltage dividers and ACS712 current sensors across 8 physical channels. It packages this telemetry into JSON packets streamed over USB UART at 115200 baud directly into our Unity HardwareBridge. If a physical relay opens on the bench, the corresponding 3D node immediately reflects the trip in the digital twin."*

### Q3: "What algorithm determines which loads to shed during mitigation?"
**Answer**:
> *"We implement a hierarchical multi-tier prioritization matrix. Tier 1 assets (Hospitals, 911 Centers, Water Filtration) are marked immune to shedding and are dynamically islanded with dedicated tie-lines. Tier 3 non-critical loads (residential blocks, commercial centers) are gracefully shedded first to shed precisely the margin of megawatts needed to bring upstream transformers back under their 100% thermal capacity."*
