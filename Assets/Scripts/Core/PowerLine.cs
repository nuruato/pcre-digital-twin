using UnityEngine;
using PCRE.Core;

namespace PCRE.Core
{
    [RequireComponent(typeof(LineRenderer))]
    public class PowerLine : MonoBehaviour
    {
        public int lineId;
        public GridNode nodeA;
        public GridNode nodeB;
        public float maxTransferKW = 200f;
        public float currentFlowKW = 80f;
        public bool isTripped = false;

        private LineRenderer lineRenderer;
        private Material lineMaterial;
        private float textureOffset = 0f;

        private void Awake()
        {
            lineRenderer = GetComponent<LineRenderer>();
            lineRenderer.positionCount = 2;
            lineRenderer.useWorldSpace = true;
            lineMaterial = lineRenderer.material;
        }

        private void Update()
        {
            if (nodeA == null || nodeB == null) return;

            // Keep positions updated
            lineRenderer.SetPosition(0, nodeA.transform.position);
            lineRenderer.SetPosition(1, nodeB.transform.position);

            // If either node is tripped or line tripped, flow is 0
            if (isTripped || nodeA.status == NodeStatus.Tripped || nodeB.status == NodeStatus.Tripped)
            {
                currentFlowKW = 0f;
                lineRenderer.startColor = new Color(0.2f, 0.2f, 0.2f, 0.4f);
                lineRenderer.endColor = new Color(0.2f, 0.2f, 0.2f, 0.4f);
                lineRenderer.startWidth = 0.08f;
                lineRenderer.endWidth = 0.08f;
                return;
            }

            // Power flow animation
            float flowRate = (maxTransferKW > 0f) ? (currentFlowKW / maxTransferKW) : 0.5f;
            textureOffset -= Time.deltaTime * flowRate * 3f;
            if (lineMaterial != null && lineMaterial.HasProperty("_MainTex"))
            {
                lineMaterial.SetTextureOffset("_MainTex", new Vector2(textureOffset, 0));
            }

            // Line stress coloring
            Color lineColor;
            if (currentFlowKW > maxTransferKW)
            {
                float pulse = Mathf.PingPong(Time.time * 8f, 1f);
                lineColor = Color.Lerp(Color.yellow, Color.red, pulse);
                lineRenderer.startWidth = 0.25f;
                lineRenderer.endWidth = 0.25f;

                // Line thermal trip if sustained overload
                if (currentFlowKW > maxTransferKW * 1.35f)
                {
                    TripLine();
                }
            }
            else if (currentFlowKW > maxTransferKW * 0.85f)
            {
                lineColor = Color.yellow;
                lineRenderer.startWidth = 0.18f;
                lineRenderer.endWidth = 0.18f;
            }
            else
            {
                lineColor = new Color(0.2f, 0.9f, 1f, 0.85f); // Cyan pulse
                lineRenderer.startWidth = 0.12f;
                lineRenderer.endWidth = 0.12f;
            }

            lineRenderer.startColor = lineColor;
            lineRenderer.endColor = lineColor;
        }

        public void TripLine()
        {
            isTripped = true;
            currentFlowKW = 0f;
            Debug.LogWarning($"[PowerLine] Transmission Line {lineId} between {nodeA.nodeName} and {nodeB.nodeName} TRIPPED!");
        }

        public void RestoreLine()
        {
            isTripped = false;
        }
    }
}
