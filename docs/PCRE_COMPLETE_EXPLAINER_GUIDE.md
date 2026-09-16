# PCRE Digital Twin: Complete Plain-English Explainer & Demo Guide
### Cyber-Physical Power Resilience & Cascading Failure Mitigation (SDG 11)

---

## 1. The Core Story: What Problem Are We Solving?

Imagine a large metropolitan city on a scorching $40^\circ\text{C}$ summer afternoon. Air conditioners in thousands of homes, offices, and factories are running at maximum power. 

Think of electricity in a city like **traffic on a highway network**:
* Electricity is produced at the **Main Power Plant** (the highway origin).
* It flows through **Substations** (which act like major highway interchanges and roundabouts).
* From substations, power travels along **Transmission Lines** into local buildings (Hospitals, Emergency Centers, Factories, Homes).

```
   [ POWER PLANT ]
         │
         ▼
 ┌───────────────┐
 │ Substation A  │ ──(Normal Flow)──> [ Critical Hospital ]
 └───────┬───────┘
         │
         ▼
 ┌───────────────┐
 │ Substation B  │ ──(Normal Flow)──> [ Neighborhoods & Malls ]
 └───────────────┘
```

### The Big Danger: The Domino Effect (Cascading Failure)
In an ordinary electrical grid, equipment is monitored in isolation. If a transformer at **Substation B** overheats or catches fire:
1. **The power flowing through B doesn't vanish.** Physics dictates that all that heavy electrical demand immediately forces its way through alternative routes (like Substation A and side lines).
2. **The side lines were never designed for that much traffic.** Substation A suddenly experiences a massive overload ($140\%$ of its rated capacity).
3. **Substation A begins to overheat and trip too.**
4. Within **3 seconds**, one failure triggers two, two triggers four, and suddenly the **entire city collapses into a total blackout—plunging the Hospital into darkness.**

This is called a **Cascading Failure** (where one failure becomes many).

---

## 2. What PCRE (Your Solution) Does

**PCRE (Power Cyber-Physical Resilience Engine)** acts like an ultra-smart, automated emergency reflex system that responds in **8.5 milliseconds** (much faster than a human operator can even blink):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE PCRE DEFENSE LOOP                           │
│                                                                        │
│  [ SENSE ]    --> Detects microsecond voltage drop (dV/dt)             │
│  [ DETECT ]   --> Identifies Substation B has blown up                 │
│  [ PREDICT ]  --> Computes: "Substation A will collapse in 2 seconds"   │
│  [ PRIORITIZE]--> Flags Hospital as Tier 1 (PROTECT) and Mall as Tier 3│
│  [ MITIGATE ] --> Sheds Mall power (Relieves Substation A from burden) │
│  [ VISUALIZE ]--> Live 3D Digital Twin displays cascade contained      │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Autonomous Reflex**: It senses that Substation B failed.
2. **Priority Load Shedding**: Instead of letting the whole city die, it deliberately turns off non-critical buildings (like a shopping mall or residential street lights).
3. **Relieving the Chokepoint**: Turning off that non-critical load drops the burden on Substation A back into the green safe zone ($<85\%$).
4. **Islanding Critical Assets**: It locks in an isolated, protected express line straight to the **General Hospital** and **911 HQ**, keeping them **$100\%$ online and safe**.

---

## 3. Visual Guide: What is on the 3D Screen?

When you open the website ([http://localhost:8080](http://localhost:8080)), here is what every 3D object represents:

| 3D Object on Screen | Real-World Infrastructure | Criticality Tier |
| :--- | :--- | :--- |
| **Tall Cyan Cylinder (Far Left)** | **Main Hydro/Gas Power Plant** | Generation Origin |
| **Emerald Green Cubes (Center)** | **Transmission Substations (Alpha & Beta)** | High-Voltage Hubs |
| **Glowing Pink Cylinder with Rings** | **Metropolitan General Hospital** | **Tier 1 (NEVER SHED)** |
| **Pink Cylinder (South-East)** | **911 Emergency Response HQ** | **Tier 1 (NEVER SHED)** |
| **Azure Blue Cube (South-West)** | **Metropolitan Water Filtration Plant** | **Tier 1 (NEVER SHED)** |
| **Amber Orange Cube (East)** | **North Industrial Tech Park** | Tier 2 (Commercial) |
| **Light Green Cubes (Perimeter)** | **Residential Sectors (A & B)** | Tier 3 (Non-Critical) |

### Power Line Colors & Meaning
* **Cyan Pulse**: Line is operating normally ($< 85\%$ load).
* **Yellow Pulse**: Line is heavily loaded ($85\% - 100\%$ capacity).
* **Pulsing Red**: **DANGER!** Overloaded ($> 100\%$). The line is heating up rapidly.
* **Dark Gray**: Line is dead / severed ($0\text{ kW}$ flow).

---

## 4. Second-by-Second Event Timeline: What Happens When You Inject a Fault?

You can test two completely different realities on the website right now:

### Reality 1: Disaster Mode (PCRE Auto-Defense is OFF)
> **Setup**: Turn the toggle switch on the left panel to **OFF**. Click **"Inject Fault: Substation Beta"**.

* **$t = 0.0\text{ s}$**: Substation Beta blows up. On your screen, it turns pitch black (dead).
* **$t = 0.8\text{ s}$**: Look at the lines leading to neighboring Substation Alpha. They turn **yellow**, then **flashing red**. The power that was flowing through Beta is now violently crushing Alpha.
* **$t = 1.5\text{ s}$**: Substation Alpha starts vibrating. Click on it: its temperature on the right inspector climbs from $45^\circ\text{C} \rightarrow 72^\circ\text{C} \rightarrow 95^\circ\text{C}$.
* **$t = 2.5\text{ s}$**: **Thermal collapse.** Substation Alpha trips. It turns black.
* **$t = 3.2\text{ s}$**: With both major substations dead, power lines to the city are severed. The **General Hospital goes black**.
* **$t = 3.5\text{ s}$**: The top bar flashes **RED: "25% GRID STABILITY | HOSPITAL OFFLINE"**. Total city-wide blackout.

---

### Reality 2: Hero Mode (PCRE Auto-Defense is ON)
> **Setup**: Click **"Reset Grid"**. Turn the toggle switch on the left panel to **ON**. Click **"Inject Fault: Substation Beta"**.

* **$t = 0.0\text{ s}$**: Substation Beta blows up and turns black.
* **$t = 0.01\text{ s}$ ($8.5\text{ ms}$)**: PCRE's edge reflex algorithm detects the sudden voltage dip.
* **$t = 0.02\text{ s}$**: PCRE executes **Priority Load Shedding**. It gracefully shuts off power to **Residential Sector A** and the **East Commercial Mall**. (They turn blue, showing controlled protection).
* **$t = 0.05\text{ s}$**: Because the shopping mall was disconnected, the stress on Substation Alpha instantly drops from $140\%$ back down to $82\%$. The line turns from flashing red back to calm cyan!
* **$t = 0.1\text{ s}$**: PCRE islands the **General Hospital** with dedicated backup routing.
* **Top Bar Result**:
  * **GRID HEALTH**: **$91.7\%$ INTACT** (Cascade stopped!)
  * **CRITICAL HOSPITALS**: **$100\%$ ONLINE**
  * **REACTION TIME**: **$8.5\text{ milliseconds}$**

---

## 5. Cheat Sheet: How to Pitch This to a Hackathon Judge

### The 30-Second Hook
> *"Judges, when a major substation fails in an extreme weather event, power shifts unpredictably onto neighboring lines, triggering a domino blackout that shuts down hospitals in under three seconds.*
>
> *Our project, **PCRE**, bridges physical hardware sensors with this 3D Digital Twin. When a fault occurs, our algorithm detects it in 8.5 milliseconds, automatically sheds non-critical residential power to relieve the stress, and keeps 100% of critical hospitals online. Let me demonstrate both scenarios live on screen!"*

### How to Demo with Your Mouse
1. **Show Scenario A (No Defense)**: 
   Toggle defense OFF $\rightarrow$ Click "Inject Fault: Substation Beta" $\rightarrow$ Point to the lines turning red and the Hospital dying. Say: *"This is what happens today without intelligent cyber-physical intervention."*
2. **Show Scenario B (PCRE Active)**: 
   Click "Reset Grid" $\rightarrow$ Toggle defense ON $\rightarrow$ Click "Inject Fault: Substation Beta" again $\rightarrow$ Point to the Hospital staying green and the cascade stopping. Say: *"In 8.5 milliseconds, PCRE sacrificed one residential block to save the entire healthcare infrastructure."*
3. **Open the Comparison Table**: 
   Click **"Scenario Comparison"** in the top right to show the judge the hard numbers:
   * Grid Survival: **$25.0\%$ vs $91.7\%$**
   * Hospitals Online: **$0\%$ vs $100\%$**
   * Speed: **$8.5\text{ ms}$ vs seconds/hours**

---

## 6. How the ESP32 Hardware Fits In
* On your desk sits an **ESP32 microcontroller** wired to actual low-voltage resistors and relays representing 8 physical nodes.
* The ESP32 reads real analog voltages and currents, packaging them into JSON packets sent over USB Serial.
* When a relay trips physically on your desk, the digital node on your screen reacts in real time.
* This proves **Cyber-Physical Synergy**: you aren't just showing a video animation; you have a functioning closed-loop system connecting real hardware to a digital twin!
