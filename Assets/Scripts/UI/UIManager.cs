using UnityEngine;
using PCRE.Core;
using PCRE.Simulation;
using PCRE.Hardware;

namespace PCRE.UI
{
    public class UIManager : MonoBehaviour
    {
        public static UIManager Instance { get; private set; }

        [Header("Built-in Instant OnGUI Overlay")]
        public bool showOnGUIOverlay = true;

        private CascadeEngine cascadeEngine;
        private MitigationEngine mitigationEngine;
        private GridNode currentlySelectedNode;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            cascadeEngine = CascadeEngine.Instance;
            mitigationEngine = MitigationEngine.Instance;

            if (cascadeEngine != null)
            {
                foreach (var n in cascadeEngine.allNodes)
                {
                    n.OnNodeClicked += InspectNode;
                }
            }
        }

        public void InspectNode(GridNode node)
        {
            currentlySelectedNode = node;
        }

        public void OnInjectFaultClicked()
        {
            if (currentlySelectedNode != null)
            {
                currentlySelectedNode.TripNode("Manual Fault Injected via UI");
            }
            else if (cascadeEngine != null && cascadeEngine.allNodes.Count > 0)
            {
                var target = cascadeEngine.allNodes.Find(n => n.nodeType == NodeType.PrimarySubstation) ?? cascadeEngine.allNodes[0];
                target.TripNode("Primary Substation Failure Injection");
            }
        }

        public void OnResetGridClicked()
        {
            if (cascadeEngine != null)
            {
                cascadeEngine.ResetEntireGrid();
            }
        }

        public void OnToggleMitigation(bool active)
        {
            if (mitigationEngine != null)
            {
                mitigationEngine.SetPCREActive(active);
            }
        }

        // Built-in Immediate Mode GUI overlay: Renders with zero package dependencies
        private void OnGUI()
        {
            if (!showOnGUIOverlay || cascadeEngine == null) return;

            GUI.backgroundColor = new Color(0.08f, 0.12f, 0.18f, 0.95f);

            // 1. Top HUD Bar
            GUI.Box(new Rect(10, 10, Screen.width - 20, 52), "");
            GUI.Label(new Rect(25, 15, 350, 20), "<b><size=14>PCRE DIGITAL TWIN - SDG 11 RESILIENCE</size></b>");
            
            float intactPercent = (cascadeEngine.totalNodesCount > 0) 
                ? ((float)cascadeEngine.activeNodesCount / cascadeEngine.totalNodesCount) * 100f 
                : 0f;
            string hospStatus = cascadeEngine.criticalHospitalIntact 
                ? "<color=#00ff88><b>100% ONLINE</b></color>" 
                : "<color=#ff3366><b>OFFLINE (CRITICAL)</b></color>";
            GUI.Label(new Rect(25, 34, 750, 22), $"Grid Health: <b>{intactPercent:F1}% Intact</b> ({cascadeEngine.activeNodesCount}/{cascadeEngine.totalNodesCount} Nodes) | Critical Hospitals: {hospStatus} | Served: {cascadeEngine.servedLoadKW:F0} kW");

            // Reset Button on top right
            if (GUI.Button(new Rect(Screen.width - 130, 20, 110, 32), "Reset Grid"))
            {
                OnResetGridClicked();
            }

            // 2. Left Control Panel (Automated Defense & Fault Injection)
            GUI.Box(new Rect(10, 72, 270, 260), "<b>PCRE Defense Control</b>");

            if (mitigationEngine != null)
            {
                string toggleText = mitigationEngine.pcreDefenseActive 
                    ? "[X] PCRE Active (Auto-Defense ON)" 
                    : "[  ] PCRE Disabled (Raw Cascade)";
                if (GUI.Button(new Rect(20, 100, 250, 32), toggleText))
                {
                    mitigationEngine.SetPCREActive(!mitigationEngine.pcreDefenseActive);
                }

                GUI.Label(new Rect(20, 138, 250, 42), mitigationEngine.pcreDefenseActive 
                    ? "<color=#00ffff>Autonomous 8.5ms Reflex Armed.\nIslanding & Targeted Shedding active.</color>" 
                    : "<color=#ff99aa>Warning: Faults will cascade freely into domino blackout!</color>");
            }

            GUI.Label(new Rect(20, 185, 250, 20), "<b>Fault Injection (Planner / Judge):</b>");
            if (GUI.Button(new Rect(20, 210, 250, 28), "Inject Fault: Substation Beta"))
            {
                cascadeEngine.TriggerManualFault(3);
            }
            if (GUI.Button(new Rect(20, 242, 250, 28), "Trip Transformer Alpha"))
            {
                cascadeEngine.TriggerManualFault(2);
            }
            if (GUI.Button(new Rect(20, 274, 250, 28), "Simulate Hardware Relay Trip"))
            {
                cascadeEngine.TriggerManualFault(7);
            }

            // 3. Right Panel (Node Inspector & Scenario Comparison)
            GUI.Box(new Rect(Screen.width - 300, 72, 290, 270), "<b>Telemetry Inspector</b>");

            if (currentlySelectedNode != null)
            {
                float loadRatio = (currentlySelectedNode.maxCapacityKW > 0f) 
                    ? (currentlySelectedNode.currentLoadKW / currentlySelectedNode.maxCapacityKW) * 100f 
                    : 0f;
                string details = $"<b>Name:</b> {currentlySelectedNode.nodeName}\n" +
                                 $"<b>Type:</b> {currentlySelectedNode.nodeType}\n" +
                                 $"<b>Status:</b> {currentlySelectedNode.status}\n" +
                                 $"<b>Load:</b> {currentlySelectedNode.currentLoadKW:F0} / {currentlySelectedNode.maxCapacityKW:F0} kW ({loadRatio:F0}%)\n" +
                                 $"<b>Voltage:</b> {currentlySelectedNode.currentVoltage:F1} V | <b>Amps:</b> {currentlySelectedNode.currentAmps:F2} A\n" +
                                 $"<b>Thermal:</b> {currentlySelectedNode.temperatureC:F1}°C (Trip: {currentlySelectedNode.maxSafeTempC}°C)\n" +
                                 $"<b>Link:</b> {(currentlySelectedNode.isPhysicalNode ? "ESP32 Ch " + currentlySelectedNode.physicalChannel : "Virtual Twin Node")}";
                GUI.Label(new Rect(Screen.width - 290, 100, 270, 150), details);

                if (GUI.Button(new Rect(Screen.width - 290, 255, 270, 28), currentlySelectedNode.status == NodeStatus.Tripped ? "Restore Node" : "Trip Selected Node"))
                {
                    if (currentlySelectedNode.status == NodeStatus.Tripped) currentlySelectedNode.RestoreNode();
                    else currentlySelectedNode.TripNode("Inspector User Click");
                }
            }
            else
            {
                GUI.Label(new Rect(Screen.width - 290, 120, 270, 80), "<i>Click any 3D node in the scene to inspect live telemetry or inject faults.</i>");
            }

            // Navigation Hint
            GUI.Label(new Rect(Screen.width / 2 - 200, Screen.height - 30, 400, 22), "<color=#aaaaaa>Controls: Right-Click Drag to Orbit | Scroll to Zoom | Left-Click Node</color>");
        }
    }
}
