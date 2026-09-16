using System;
using System.Collections;
using System.Reflection;
using UnityEngine;
using PCRE.Core;
using PCRE.Simulation;

namespace PCRE.Hardware
{
    public class HardwareBridge : MonoBehaviour
    {
        public static HardwareBridge Instance { get; private set; }

        [Header("Serial Port Configuration (ESP32)")]
        public string portName = "COM3";
        public int baudRate = 115200;
        public bool connectOnStart = false;
        public bool isConnected = false;

        [Header("Mock Hardware Emulation")]
        [Tooltip("Generates mock ESP32 packets if physical board is not plugged in")]
        public bool useMockHardwareIfNoPort = true;

        private object serialPortInstance;
        private MethodInfo openMethod;
        private MethodInfo closeMethod;
        private MethodInfo readLineMethod;
        private PropertyInfo isOpenProperty;

        private CascadeEngine cascadeEngine;

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        private void Start()
        {
            cascadeEngine = CascadeEngine.Instance;

            if (connectOnStart)
            {
                TryConnectSerial();
            }

            if (!isConnected && useMockHardwareIfNoPort)
            {
                Debug.Log("[HardwareBridge] Running in Mock ESP32 Hardware Emulation Mode.");
                StartCoroutine(MockHardwareStream());
            }
        }

        public void TryConnectSerial()
        {
            try
            {
                // Dynamic lookup of SerialPort to avoid compile-time assembly dependency
                Type spType = Type.GetType("System.IO.Ports.SerialPort, System") 
                           ?? Type.GetType("System.IO.Ports.SerialPort, System.IO.Ports")
                           ?? Type.GetType("System.IO.Ports.SerialPort");

                if (spType == null)
                {
                    Debug.LogWarning("[HardwareBridge] System.IO.Ports not found in current .NET profile. Using Emulation mode.");
                    isConnected = false;
                    return;
                }

                serialPortInstance = Activator.CreateInstance(spType, portName, baudRate);
                openMethod = spType.GetMethod("Open");
                closeMethod = spType.GetMethod("Close");
                readLineMethod = spType.GetMethod("ReadLine", Type.EmptyTypes);
                isOpenProperty = spType.GetProperty("IsOpen");

                PropertyInfo timeoutProp = spType.GetProperty("ReadTimeout");
                if (timeoutProp != null) timeoutProp.SetValue(serialPortInstance, 50);

                if (openMethod != null)
                {
                    openMethod.Invoke(serialPortInstance, null);
                    isConnected = true;
                    Debug.Log($"[HardwareBridge] Connected to ESP32 on {portName} @ {baudRate} baud.");
                    StartCoroutine(SerialReadLoop());
                }
            }
            catch (Exception ex)
            {
                isConnected = false;
                Debug.LogWarning($"[HardwareBridge] Could not open {portName}: {ex.Message}. Falling back to emulation.");
            }
        }

        private IEnumerator SerialReadLoop()
        {
            while (isConnected && serialPortInstance != null)
            {
                bool isOpen = (bool)(isOpenProperty?.GetValue(serialPortInstance) ?? false);
                if (!isOpen) break;

                string line = null;
                try
                {
                    line = (string)readLineMethod?.Invoke(serialPortInstance, null);
                }
                catch (TargetInvocationException tie)
                {
                    if (tie.InnerException is TimeoutException) { /* normal polling timeout */ }
                    else Debug.LogWarning($"[HardwareBridge] Serial error: {tie.InnerException?.Message}");
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"[HardwareBridge] Serial error: {ex.Message}");
                }

                if (!string.IsNullOrEmpty(line))
                {
                    ProcessTelemetryString(line);
                }

                yield return null;
            }
        }

        public void ProcessTelemetryString(string jsonString)
        {
            try
            {
                TelemetryPacket packet = JsonUtility.FromJson<TelemetryPacket>(jsonString);
                if (packet != null && cascadeEngine != null)
                {
                    GridNode matchedNode = cascadeEngine.allNodes.Find(n => n.nodeId == packet.nodeId || n.physicalChannel == packet.nodeId);
                    if (matchedNode != null)
                    {
                        matchedNode.ApplyTelemetry(packet.voltage, packet.current, packet.powerKW, packet.temperature);
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[HardwareBridge] Failed parsing telemetry: {ex.Message} -> {jsonString}");
            }
        }

        private IEnumerator MockHardwareStream()
        {
            while (true)
            {
                yield return new WaitForSeconds(0.8f);

                if (cascadeEngine != null)
                {
                    var physicalNodes = cascadeEngine.allNodes.FindAll(n => n.isPhysicalNode);
                    foreach (var node in physicalNodes)
                    {
                        float jitterV = UnityEngine.Random.Range(-1.5f, 1.5f);
                        float jitterI = UnityEngine.Random.Range(-0.05f, 0.05f);

                        float v = (node.status == NodeStatus.Tripped) ? 0f : (node.nominalVoltage + jitterV);
                        float i = (node.status == NodeStatus.Tripped) ? 0f : (node.currentAmps + jitterI);
                        float kw = (v * i) / 1000f;
                        float temp = node.temperatureC + UnityEngine.Random.Range(-0.2f, 0.3f);

                        node.ApplyTelemetry(v, i, kw, temp);
                    }
                }
            }
        }

        private void OnDestroy()
        {
            if (serialPortInstance != null && closeMethod != null)
            {
                try
                {
                    closeMethod.Invoke(serialPortInstance, null);
                }
                catch { }
            }
        }
    }
}
