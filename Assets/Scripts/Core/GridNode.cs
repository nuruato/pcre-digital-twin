using System;
using System.Collections.Generic;
using UnityEngine;
using PCRE.Core;

namespace PCRE.Core
{
    [SelectionBase]
    public class GridNode : MonoBehaviour
    {
        [Header("Identification")]
        public int nodeId;
        public string nodeName = "Substation";
        public NodeType nodeType = NodeType.DistributionSubstation;
        public bool isCritical = false;
        public bool isPhysicalNode = false;
        public int physicalChannel = -1;

        [Header("Electrical Metrics")]
        public float baseDemandKW = 100f;
        public float currentLoadKW = 100f;
        public float maxCapacityKW = 150f;
        public float nominalVoltage = 230f;
        public float currentVoltage = 230f;
        public float currentAmps = 0.43f;

        [Header("Status and Thermal Simulation")]
        public NodeStatus status = NodeStatus.Healthy;
        public float temperatureC = 45f;
        public float maxSafeTempC = 95f;
        public float tripDelaySeconds = 2.5f;
        [SerializeField] private float overloadTimer = 0f;

        [Header("Graph Connections")]
        public List<PowerLine> connectedLines = new List<PowerLine>();

        [Header("Visual Components")]
        public MeshRenderer nodeMeshRenderer;
        public Light nodeIndicatorLight;
        public TextMesh labelTextMesh;

        private Material nodeMaterial;
        private Color baseColor;

        public event Action<GridNode> OnNodeStatusChanged;
        public event Action<GridNode> OnNodeClicked;

        private void Awake()
        {
            if (nodeMeshRenderer == null)
                nodeMeshRenderer = GetComponentInChildren<MeshRenderer>();

            if (nodeIndicatorLight == null)
                nodeIndicatorLight = GetComponentInChildren<Light>();

            if (nodeMeshRenderer != null)
            {
                nodeMaterial = nodeMeshRenderer.material;
            }

            if (labelTextMesh == null)
                labelTextMesh = GetComponentInChildren<TextMesh>();

            DetermineBaseColor();
            UpdateVisuals();
        }

        private void Update()
        {
            if (status == NodeStatus.Tripped || status == NodeStatus.SheddedByPCRE)
            {
                temperatureC = Mathf.MoveTowards(temperatureC, 25f, Time.deltaTime * 5f);
                return;
            }

            // Overload detection and thermal accumulation
            if (currentLoadKW > maxCapacityKW)
            {
                status = NodeStatus.Overloaded;
                overloadTimer += Time.deltaTime;
                float overloadRatio = currentLoadKW / maxCapacityKW;
                temperatureC += overloadRatio * 15f * Time.deltaTime;

                if (overloadTimer >= tripDelaySeconds || temperatureC >= maxSafeTempC)
                {
                    TripNode("Thermal Overload Cascade");
                }
            }
            else if (currentLoadKW > maxCapacityKW * 0.85f)
            {
                status = NodeStatus.Warning;
                overloadTimer = Mathf.Max(0f, overloadTimer - Time.deltaTime * 0.5f);
                temperatureC = Mathf.MoveTowards(temperatureC, 65f, Time.deltaTime * 2f);
            }
            else
            {
                status = NodeStatus.Healthy;
                overloadTimer = Mathf.Max(0f, overloadTimer - Time.deltaTime);
                temperatureC = Mathf.MoveTowards(temperatureC, 45f, Time.deltaTime * 3f);
            }

            UpdateVisuals();
        }

        public void ApplyTelemetry(float voltage, float current, float powerKW, float tempC)
        {
            currentVoltage = voltage;
            currentAmps = current;
            currentLoadKW = powerKW > 0f ? powerKW : (voltage * current) / 1000f;
            temperatureC = tempC;

            if (currentLoadKW > maxCapacityKW)
            {
                status = NodeStatus.Overloaded;
            }
            else if (status != NodeStatus.Tripped && status != NodeStatus.SheddedByPCRE)
            {
                status = NodeStatus.Healthy;
            }

            UpdateVisuals();
            OnNodeStatusChanged?.Invoke(this);
        }

        public void TripNode(string reason)
        {
            if (status == NodeStatus.Tripped) return;

            status = NodeStatus.Tripped;
            currentLoadKW = 0f;
            currentVoltage = 0f;
            currentAmps = 0f;
            Debug.LogWarning($"[PCRE] Node {nodeId} ({nodeName}) TRIPPED! Reason: {reason}");

            UpdateVisuals();
            OnNodeStatusChanged?.Invoke(this);
        }

        public void ShedByPCRE()
        {
            if (status == NodeStatus.Tripped) return;

            status = NodeStatus.SheddedByPCRE;
            currentLoadKW = 0f;
            currentVoltage = 0f;
            currentAmps = 0f;
            Debug.Log($"[PCRE Auto-Defense] Controlled load-shed executed on Node {nodeId} ({nodeName}) to isolate cascade.");

            UpdateVisuals();
            OnNodeStatusChanged?.Invoke(this);
        }

        public void RestoreNode()
        {
            status = NodeStatus.Healthy;
            currentLoadKW = baseDemandKW;
            currentVoltage = nominalVoltage;
            currentAmps = (nominalVoltage > 0f) ? (currentLoadKW * 1000f) / nominalVoltage : 1f;
            overloadTimer = 0f;
            temperatureC = 45f;

            UpdateVisuals();
            OnNodeStatusChanged?.Invoke(this);
        }

        private void OnMouseDown()
        {
            OnNodeClicked?.Invoke(this);
        }

        private void DetermineBaseColor()
        {
            switch (nodeType)
            {
                case NodeType.PowerPlant:
                    baseColor = new Color(0.2f, 0.8f, 1f); // Cyan
                    break;
                case NodeType.PrimarySubstation:
                    baseColor = new Color(0.3f, 0.9f, 0.4f); // Emerald
                    break;
                case NodeType.CriticalHospital:
                case NodeType.EmergencyCenter:
                    baseColor = new Color(1f, 0.25f, 0.5f); // Red / Magenta Alert
                    break;
                case NodeType.WaterTreatment:
                    baseColor = new Color(0.1f, 0.6f, 0.95f); // Azure Blue
                    break;
                case NodeType.IndustrialZone:
                    baseColor = new Color(0.95f, 0.6f, 0.2f); // Amber Orange
                    break;
                default:
                    baseColor = new Color(0.4f, 0.85f, 0.35f); // Light Green
                    break;
            }
        }

        public void UpdateVisuals()
        {
            Color displayColor = baseColor;

            switch (status)
            {
                case NodeStatus.Healthy:
                    displayColor = baseColor;
                    break;
                case NodeStatus.Warning:
                    displayColor = Color.yellow;
                    break;
                case NodeStatus.Overloaded:
                    float pulse = Mathf.PingPong(Time.time * 6f, 1f);
                    displayColor = Color.Lerp(new Color(1f, 0.4f, 0f), Color.red, pulse);
                    break;
                case NodeStatus.Tripped:
                    displayColor = new Color(0.18f, 0.18f, 0.18f); // Severed / Blacked out
                    break;
                case NodeStatus.SheddedByPCRE:
                    displayColor = new Color(0.25f, 0.45f, 0.85f); // Soft protected blue
                    break;
                case NodeStatus.Islanded:
                    displayColor = new Color(0.65f, 0.25f, 0.85f); // Purple
                    break;
            }

            if (nodeMaterial != null)
            {
                nodeMaterial.color = displayColor;
                if (nodeMaterial.HasProperty("_EmissionColor"))
                {
                    Color emission = (status == NodeStatus.Tripped) ? Color.black : displayColor * 1.5f;
                    nodeMaterial.SetColor("_EmissionColor", emission);
                }
            }

            if (nodeIndicatorLight != null)
            {
                nodeIndicatorLight.color = displayColor;
                nodeIndicatorLight.intensity = (status == NodeStatus.Tripped) ? 0f : 2.5f;
            }

            if (labelTextMesh != null)
            {
                float loadPercent = (maxCapacityKW > 0f) ? (currentLoadKW / maxCapacityKW) * 100f : 0f;
                string critBadge = isCritical ? "[CRITICAL HOSP] " : (isPhysicalNode ? "[ESP32 HARDWARE] " : "");
                labelTextMesh.text = $"{critBadge}{nodeName}\n{status} | {loadPercent:F0}%\n{temperatureC:F1} C";
                labelTextMesh.color = (status == NodeStatus.Tripped) ? Color.red : Color.white;
            }
        }
    }
}
