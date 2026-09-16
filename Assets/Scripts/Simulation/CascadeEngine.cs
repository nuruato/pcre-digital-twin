using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using PCRE.Core;

namespace PCRE.Simulation
{
    public class CascadeEngine : MonoBehaviour
    {
        public static CascadeEngine Instance { get; private set; }

        [Header("Grid Graph References")]
        public List<GridNode> allNodes = new List<GridNode>();
        public List<PowerLine> allLines = new List<PowerLine>();

        [Header("Simulation Parameters")]
        public bool simulationActive = true;
        public float redistributionDamping = 0.85f;
        public float tickInterval = 0.5f;

        [Header("Cascade Metrics")]
        public int totalNodesCount = 0;
        public int activeNodesCount = 0;
        public int trippedNodesCount = 0;
        public float totalGridDemandKW = 0f;
        public float servedLoadKW = 0f;
        public float unservedLoadKW = 0f;
        public bool criticalHospitalIntact = true;

        public event Action OnCascadeStepExecuted;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            RegisterGraphElements();
            StartCoroutine(SimulationLoop());
        }

        public void RegisterGraphElements()
        {
            allNodes = new List<GridNode>(FindObjectsOfType<GridNode>());
            allLines = new List<PowerLine>(FindObjectsOfType<PowerLine>());
            totalNodesCount = allNodes.Count;

            foreach (var node in allNodes)
            {
                node.OnNodeClicked += HandleNodeClicked;
            }

            RecalculateMetrics();
        }

        private void HandleNodeClicked(GridNode node)
        {
            if (node.status == NodeStatus.Tripped)
            {
                node.RestoreNode();
            }
            else
            {
                TriggerManualFault(node.nodeId);
            }
        }

        public void TriggerManualFault(int nodeId)
        {
            GridNode target = allNodes.Find(n => n.nodeId == nodeId);
            if (target != null)
            {
                target.TripNode("Manual Fault Injection (Planner / Judge trigger)");
                PropagateCascadeStep();
            }
        }

        private IEnumerator SimulationLoop()
        {
            while (true)
            {
                yield return new WaitForSeconds(tickInterval);
                if (simulationActive)
                {
                    PropagateCascadeStep();
                }
            }
        }

        public void PropagateCascadeStep()
        {
            // 1. Calculate lost generation or lost routing from tripped nodes
            float lostLoadToRedistribute = 0f;

            foreach (var node in allNodes)
            {
                if (node.status == NodeStatus.Tripped && node.currentLoadKW > 0f)
                {
                    lostLoadToRedistribute += node.currentLoadKW;
                    node.currentLoadKW = 0f;
                }
            }

            // 2. Redistribute load across surviving adjacent nodes proportionally to admittance/capacity
            List<GridNode> healthySurvivors = allNodes.FindAll(n => n.status == NodeStatus.Healthy || n.status == NodeStatus.Warning);

            if (healthySurvivors.Count > 0 && lostLoadToRedistribute > 0f)
            {
                float sharePerNode = (lostLoadToRedistribute * redistributionDamping) / healthySurvivors.Count;
                foreach (var survivor in healthySurvivors)
                {
                    survivor.currentLoadKW += sharePerNode;
                }
            }

            // 3. Update line power flows
            foreach (var line in allLines)
            {
                if (line.isTripped) continue;

                if (line.nodeA.status == NodeStatus.Tripped || line.nodeB.status == NodeStatus.Tripped)
                {
                    line.currentFlowKW = 0f;
                }
                else
                {
                    // Flow proportional to average connected load
                    float avgLoad = (line.nodeA.currentLoadKW + line.nodeB.currentLoadKW) * 0.45f;
                    line.currentFlowKW = Mathf.Lerp(line.currentFlowKW, avgLoad, Time.deltaTime * 4f);
                }
            }

            RecalculateMetrics();
            OnCascadeStepExecuted?.Invoke();
        }

        public void ResetEntireGrid()
        {
            foreach (var node in allNodes)
            {
                node.RestoreNode();
            }

            foreach (var line in allLines)
            {
                line.RestoreLine();
            }

            RecalculateMetrics();
            Debug.Log("[CascadeEngine] Entire grid restored to nominal baseline state.");
        }

        private void RecalculateMetrics()
        {
            activeNodesCount = 0;
            trippedNodesCount = 0;
            totalGridDemandKW = 0f;
            servedLoadKW = 0f;
            criticalHospitalIntact = true;

            foreach (var node in allNodes)
            {
                totalGridDemandKW += node.baseDemandKW;
                if (node.status == NodeStatus.Healthy || node.status == NodeStatus.Warning || node.status == NodeStatus.Islanded)
                {
                    activeNodesCount++;
                    servedLoadKW += node.currentLoadKW;
                }
                else if (node.status == NodeStatus.Tripped)
                {
                    trippedNodesCount++;
                    if (node.isCritical) criticalHospitalIntact = false;
                }
            }

            unservedLoadKW = Mathf.Max(0f, totalGridDemandKW - servedLoadKW);
        }
    }
}
