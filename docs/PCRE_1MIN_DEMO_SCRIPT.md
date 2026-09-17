# PCRE 1-Minute Prototype Demonstration Script
### Live Presentation Cue Sheet for Hackathon Judges

* **Target Speaking Time**: Exactly 60 Seconds
* **Spoken Word Count**: ~135 Words
* **Interactive URL**: [http://localhost:8080/index.html](http://localhost:8080/index.html) *(or via your live GitHub Pages link)*

---

## 1. Pre-Demo 5-Second Checklist
Before the judges walk up to your screen:
1. Open your browser to **`http://localhost:8080/index.html`**.
2. Click **"Reset Grid"** so all nodes are green/cyan and stable.
3. Make sure the **PCRE toggle is OFF** initially to prepare for the contrast demo.
4. Position your mouse near the left control panel.

---

## 2. The 60-Second Demo Cue Sheet

| Time | On-Screen Action [WHAT YOU DO] | Spoken Script [WHAT YOU SAY] | Visual Confirmation [WHAT JUDGES OBSERVE] |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:10** | Gently orbit the 3D camera with right-click drag; point mouse at the center and the glowing pink cylinder. | *"This is our 3D Digital Twin of the city grid. On the left is our power plant, in the center are our two primary substations, and here is our highest-priority asset: the General Hospital."* | 3D smart city renders with pulsing cyan energy lines; General Hospital glows pink with emergency rings. |
| **0:10 – 0:32** | Ensure **PCRE toggle is OFF**. Click **"Inject Fault: Substation Beta"**. | *"Watch what happens in a standard grid without PCRE: Substation Beta trips.<br><br>Notice the surge—400 kilowatts violently slam into Substation Alpha. Look at Alpha **shaking and flashing red**!<br><br>In two seconds, Alpha overheats and trips too. Now look at the hospital: **its lights cut out, pitch black**. The city collapses to 8% stability."* | • Substation Beta turns pitch black.<br>• Substation Alpha shakes up and down rapidly, turning flashing red.<br>• Alpha trips black.<br>• General Hospital light cuts out completely.<br>• HUD turns bright red: **8.3% Grid Stability, 0/3 Critical Online**. |
| **0:32 – 0:52** | 1. Click **"Reset Grid"**.<br>2. Flip **PCRE toggle to ON**.<br>3. Click **"Inject Fault: Substation Beta"** again. | *"Now, we reset and enable PCRE's autonomous edge defense. I inject the exact same fault.<br><br>In just **8.5 milliseconds**, PCRE senses the surge and sheds this residential block—**it turns blue**.<br><br>That instantly relieves Substation Alpha, keeping it **calm and green**.<br><br>And look at the General Hospital: **it never loses power for even a millisecond**."* | • Substation Beta trips black.<br>• Residential blocks turn soft blue (`SHEDDED`).<br>• Substation Alpha remains calm and green.<br>• General Hospital **stays 100% illuminated and powered**.<br>• Green logs stream in bottom right. |
| **0:52 – 1:00** | Point your mouse cursor to the green top HUD header bar. | *"From a catastrophic total blackout to 100% hospital uptime in 8.5 milliseconds.<br><br>That is PCRE. Thank you!"* | HUD shows: **91.7% Grid Stability**, **3/3 Critical Assets Online (100% SAFE)**. |

---

## 3. Rapid Q&A Answers (If Judges Ask Questions Immediately)

* **"Why did the residential block turn blue?"**  
  > *"That is controlled priority load shedding. In a crisis, PCRE sacrifices non-critical residential power for a few seconds to drop line pressure so upstream transformers don't blow up."*

* **"Why 8.5 milliseconds?"**  
  > *"Because electrical overloads travel at the speed of light. Humans cannot react in seconds. Our ASIC/edge algorithm operates at sub-cycle speeds to kill the cascade before transformers can physically melt."*

* **"How does your physical ESP32 board link to this?"**  
  > *"The ESP32 reads real voltage and current from bench sensors and streams JSON packets into this twin. If a bench relay trips, the corresponding 3D node trips on screen in real time."*

---

## 4. Key Metrics Summary Card

```
┌────────────────────────────────────────────────────────┐
│               HACKATHON BENCHMARK HUD                  │
├─────────────────────────┬──────────────┬───────────────┤
│ Metric                  │ PCRE OFF     │ PCRE ON       │
├─────────────────────────┼──────────────┼───────────────┤
│ Grid Survival Rate      │ 8.3% (Death) │ 91.7% (Alive) │
│ Critical Hospital Power │ 0% (Blackout)│ 100% (Online) │
│ Cascades Prevented      │ 0            │ 100% Arrested │
│ Mitigation Latency      │ Failed (>3s) │ 8.5 ms        │
└─────────────────────────┴──────────────┴───────────────┘
```
