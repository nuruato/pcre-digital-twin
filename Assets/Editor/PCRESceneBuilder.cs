#if UNITY_EDITOR
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using PCRE.Core;
using PCRE.Simulation;
using PCRE.Hardware;
using PCRE.UI;

namespace PCRE.Editor
{
    public class PCRESceneBuilder : EditorWindow
    {
        [MenuItem("PCRE/Build Complete 3D Digital Twin Scene")]
        public static void BuildScene()
        {
            // 1. Setup Camera and Lighting
            Camera mainCam = Camera.main;
            if (mainCam == null)
            {
                GameObject camObj = new GameObject("Main Camera");
                mainCam = camObj.AddComponent<Camera>();
                camObj.tag = "MainCamera";
            }
            mainCam.transform.position = new Vector3(0, 25, -30);
            mainCam.transform.LookAt(Vector3.zero);
            mainCam.clearFlags = CameraClearFlags.SolidColor;
            mainCam.backgroundColor = new Color(0.05f, 0.08f, 0.12f); // Dark cyber grid backdrop

            if (mainCam.GetComponent<CameraController>() == null)
            {
                mainCam.gameObject.AddComponent<CameraController>();
            }

            // Directional Light
            Light sun = FindObjectOfType<Light>();
            if (sun == null)
            {
                GameObject lightObj = new GameObject("Directional Light");
                sun = lightObj.AddComponent<Light>();
                sun.type = LightType.Directional;
            }
            sun.transform.rotation = Quaternion.Euler(50, -30, 0);
            sun.color = new Color(0.9f, 0.95f, 1f);
            sun.intensity = 1.2f;

            // 2. Ground Grid Plane
            GameObject ground = GameObject.Find("CityGroundGrid");
            if (ground == null)
            {
                ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
                ground.name = "CityGroundGrid";
                ground.transform.position = Vector3.zero;
                ground.transform.localScale = new Vector3(6f, 1f, 6f);
                Material groundMat = new Material(Shader.Find("Standard"));
                groundMat.color = new Color(0.08f, 0.11f, 0.16f);
                ground.GetComponent<MeshRenderer>().material = groundMat;
            }

            // 3. Setup Managers
            GameObject managerObj = GameObject.Find("PCRE_Systems");
            if (managerObj == null)
            {
                managerObj = new GameObject("PCRE_Systems");
            }

            CascadeEngine cascadeEngine = managerObj.GetComponent<CascadeEngine>() ?? managerObj.AddComponent<CascadeEngine>();
            MitigationEngine mitigationEngine = managerObj.GetComponent<MitigationEngine>() ?? managerObj.AddComponent<MitigationEngine>();
            HardwareBridge hardwareBridge = managerObj.GetComponent<HardwareBridge>() ?? managerObj.AddComponent<HardwareBridge>();
            UIManager uiManager = managerObj.GetComponent<UIManager>() ?? managerObj.AddComponent<UIManager>();

            // 4. Generate 12-Node Smart City Grid (including 6-8 physical testbed nodes)
            var nodeConfigs = new (int id, string name, NodeType type, Vector3 pos, bool isCrit, bool isPhys, int ch, float cap, float dem)[]
            {
                (1, "Main Power Plant (Hydro/Gas)", NodeType.PowerPlant, new Vector3(-20, 1.5f, 0), false, true, 0, 500f, 0f),
                (2, "Transmission Substation Alpha", NodeType.PrimarySubstation, new Vector3(-10, 1.2f, 5), false, true, 1, 300f, 30f),
                (3, "Substation Beta (Central)", NodeType.PrimarySubstation, new Vector3(0, 1.2f, 8), false, true, 2, 280f, 40f),
                (4, "General Hospital (Tier 1 Critical)", NodeType.CriticalHospital, new Vector3(-5, 1.0f, -8), true, true, 3, 120f, 90f),
                (5, "Emergency Operations HQ", NodeType.EmergencyCenter, new Vector3(5, 1.0f, -7), true, true, 4, 100f, 75f),
                (6, "Metropolitan Water Treatment", NodeType.WaterTreatment, new Vector3(-12, 1.0f, -12), true, true, 5, 150f, 110f),
                (7, "North Industrial Tech Park", NodeType.IndustrialZone, new Vector3(12, 1.0f, 10), false, true, 6, 200f, 160f),
                (8, "East Commercial Hub", NodeType.CommercialDistrict, new Vector3(18, 1.0f, 2), false, true, 7, 180f, 130f),
                (9, "Residential Sector A", NodeType.ResidentialSector, new Vector3(-8, 0.8f, 14), false, false, -1, 140f, 95f),
                (10, "Residential Sector B", NodeType.ResidentialSector, new Vector3(4, 0.8f, 15), false, false, -1, 140f, 90f),
                (11, "Substation Gamma (South)", NodeType.DistributionSubstation, new Vector3(8, 1.1f, -14), false, false, -1, 220f, 50f),
                (12, "South Residential District", NodeType.ResidentialSector, new Vector3(16, 0.8f, -12), false, false, -1, 130f, 85f)
            };

            Dictionary<int, GridNode> createdNodes = new Dictionary<int, GridNode>();

            foreach (var cfg in nodeConfigs)
            {
                string objName = $"Node_{cfg.id}_{cfg.name.Replace(' ', '_')}";
                GameObject nodeObj = GameObject.Find(objName);
                if (nodeObj == null)
                {
                    PrimitiveType prim = (cfg.type == NodeType.PowerPlant) ? PrimitiveType.Cylinder :
                                         (cfg.isCrit ? PrimitiveType.Capsule : PrimitiveType.Cube);
                    nodeObj = GameObject.CreatePrimitive(prim);
                    nodeObj.name = objName;
                }

                nodeObj.transform.position = cfg.pos;
                nodeObj.transform.localScale = (cfg.type == NodeType.PowerPlant) ? new Vector3(2.5f, 2.5f, 2.5f) :
                                              (cfg.isCrit ? new Vector3(2.2f, 2.2f, 2.2f) : new Vector3(1.8f, 1.8f, 1.8f));

                GridNode node = nodeObj.GetComponent<GridNode>() ?? nodeObj.AddComponent<GridNode>();
                node.nodeId = cfg.id;
                node.nodeName = cfg.name;
                node.nodeType = cfg.type;
                node.isCritical = cfg.isCrit;
                node.isPhysicalNode = cfg.isPhys;
                node.physicalChannel = cfg.ch;
                node.maxCapacityKW = cfg.cap;
                node.baseDemandKW = cfg.dem;
                node.currentLoadKW = cfg.dem;
                node.nominalVoltage = 230f;
                node.currentVoltage = 230f;

                // Add Point Light indicator
                Light indLight = nodeObj.GetComponentInChildren<Light>();
                if (indLight == null)
                {
                    GameObject lightChild = new GameObject("IndicatorLight");
                    lightChild.transform.SetParent(nodeObj.transform);
                    lightChild.transform.localPosition = new Vector3(0, 1.8f, 0);
                    indLight = lightChild.AddComponent<Light>();
                    indLight.type = LightType.Point;
                    indLight.range = 6f;
                    indLight.intensity = 2f;
                }
                node.nodeIndicatorLight = indLight;

                // Add 3D text label
                TextMesh txt = nodeObj.GetComponentInChildren<TextMesh>();
                if (txt == null)
                {
                    GameObject txtChild = new GameObject("LabelText");
                    txtChild.transform.SetParent(nodeObj.transform);
                    txtChild.transform.localPosition = new Vector3(0, 2.5f, 0);
                    txt = txtChild.AddComponent<TextMesh>();
                    txt.characterSize = 0.25f;
                    txt.fontSize = 28;
                    txt.alignment = TextAlignment.Center;
                    txt.anchor = TextAnchor.MiddleCenter;
                }
                node.labelTextMesh = txt;

                createdNodes[cfg.id] = node;
            }

            // 5. Connect Transmission Lines
            var connections = new (int a, int b, float cap)[]
            {
                (1, 2, 400f), (1, 3, 350f), (2, 3, 250f),
                (2, 4, 180f), (2, 6, 160f), (3, 5, 180f),
                (3, 7, 220f), (3, 8, 200f), (2, 9, 140f),
                (3, 10, 140f), (5, 11, 160f), (8, 11, 180f),
                (11, 12, 140f), (4, 5, 120f) // Inter-hospital backup tie-line
            };

            int lineIndex = 1;
            foreach (var conn in connections)
            {
                if (createdNodes.ContainsKey(conn.a) && createdNodes.ContainsKey(conn.b))
                {
                    string lineName = $"PowerLine_{conn.a}_{conn.b}";
                    GameObject lineObj = GameObject.Find(lineName);
                    if (lineObj == null)
                    {
                        lineObj = new GameObject(lineName);
                    }

                    PowerLine line = lineObj.GetComponent<PowerLine>() ?? lineObj.AddComponent<PowerLine>();
                    line.lineId = lineIndex++;
                    line.nodeA = createdNodes[conn.a];
                    line.nodeB = createdNodes[conn.b];
                    line.maxTransferKW = conn.cap;
                    line.currentFlowKW = conn.cap * 0.45f;

                    LineRenderer lr = lineObj.GetComponent<LineRenderer>();
                    lr.material = new Material(Shader.Find("Sprites/Default"));
                    lr.startWidth = 0.12f;
                    lr.endWidth = 0.12f;

                    createdNodes[conn.a].connectedLines.Add(line);
                    createdNodes[conn.b].connectedLines.Add(line);
                }
            }

            // 6. Refresh Cascade Engine graph registry
            cascadeEngine.RegisterGraphElements();

            EditorUtility.DisplayDialog("PCRE Digital Twin Scene Ready",
                "Successfully generated the complete 3D smart city grid with 12 nodes, transmission lines, dynamic lighting, and simulation engines!\n\nPress PLAY to run the interactive digital twin.", "OK");
        }
    }
}
#endif
