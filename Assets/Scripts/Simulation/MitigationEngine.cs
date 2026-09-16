using System.Collections.Generic;
using UnityEngine;
using PCRE.Core;

namespace PCRE.Simulation
{
    public class MitigationEngine : MonoBehaviour
    {
        public static MitigationEngine Instance { get; private set; }

        [Header("PCRE Defense Configuration")]
        [Tooltip("When enabled, simulates edge-computing / ASIC closed-loop defense")]
        public bool pcreDefenseActive = true;
        public float responseTimeMs = 8.5f; // Fast sub-cycle intervention
        public float dVdtTripThreshold = -35f; // Volts per second drop triggering defense

        [Header("Defense Statistics")]
        public int cascadesPrevented = 0;
        public int loadsSheddedCount = 0;
        public float protectedCriticalMw = 0f;

        private CascadeEngine cascadeEngine;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            cascadeEngine = CascadeEngine.Instance;
            if (cascadeEngine != null)
            {
                cascadeEngine.OnCascadeStepExecuted += EvaluateGridVulnerabilities;
            }
        }

        public void SetPCREActive(bool active)
        {
            pcreDefenseActive = active;
            Debug.Log($"[PCRE] Mitigation Engine Active State changed to: {pcreDefenseActive}");
        }

        public void EvaluateGridVulnerabilities()
        {
            if (!pcreDefenseActive || cascadeEngine == null) return;

            // PCRE Autonomous SENSE -> DETECT -> PREDICT -> PRIORITIZE -> MITIGATE Algorithm
            List<GridNode> overloadedNodes = cascadeEngine.allNodes.FindAll(n => n.status == NodeStatus.Overloaded);

            if (overloadedNodes.Count > 0)
            {
                // Predict cascade hazard: overloads will collapse tier 1 loads within seconds
                ExecuteTargetedMitigation(overloadedNodes);
            }
        }

        private void ExecuteTargetedMitigation(List<GridNode> overloadedNodes)
        {
            // Priority Ranking:
            // Tier 1 (Never shed): Hospitals, Emergency Centers, Water Treatment
            // Tier 2 (Shed second): Commercial, Heavy Industry
            // Tier 3 (Shed first): Non-critical Residential sectors

            // Step 1: Find Tier 3 non-critical nodes to shed immediately
            List<GridNode> tier3Nodes = cascadeEngine.allNodes.FindAll(
                n => !n.isCritical && 
                (n.nodeType == NodeType.ResidentialSector || n.nodeType == NodeType.CommercialDistrict) && 
                n.status != NodeStatus.Tripped && 
                n.status != NodeStatus.SheddedByPCRE
            );

            // Execute controlled load shed to relieve upstream overloaded substations
            foreach (var candidate in tier3Nodes)
            {
                candidate.ShedByPCRE();
                loadsSheddedCount++;

                // Re-balance: relieve overload on closest upstream substation
                foreach (var overloadedNode in overloadedNodes)
                {
                    if (overloadedNode.currentLoadKW > overloadedNode.maxCapacityKW)
                    {
                        overloadedNode.currentLoadKW = Mathf.Max(
                            overloadedNode.maxCapacityKW * 0.88f,
                            overloadedNode.currentLoadKW - candidate.baseDemandKW
                        );
                        overloadedNode.status = NodeStatus.Healthy;
                        overloadedNode.UpdateVisuals();
                        cascadesPrevented++;
                    }
                }
            }

            // Step 2: Island critical assets (Hospitals) to guarantee 100% uninterrupted power
            List<GridNode> hospitals = cascadeEngine.allNodes.FindAll(n => n.isCritical);
            foreach (var hospital in hospitals)
            {
                if (hospital.status != NodeStatus.Tripped)
                {
                    hospital.currentVoltage = hospital.nominalVoltage;
                    hospital.status = NodeStatus.Healthy;
                    protectedCriticalMw += (hospital.currentLoadKW / 1000f);
                    hospital.UpdateVisuals();
                }
            }

            Debug.Log($"[PCRE Engine] Autonomous Mitigation Executed in {responseTimeMs}ms! Prevented Cascades: {cascadesPrevented}, Loads Shed: {loadsSheddedCount}");
        }
    }
}
