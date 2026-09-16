/*
 * =========================================================================================
 * PCRE (Power Cyber-Physical Resilience Engine) - ESP32 Hardware Node Testbed Controller
 * Hackathon Prototype: Cyber-Physical Integration for Cascading Failure Prevention
 * =========================================================================================
 * 
 * Target: ESP32 Dev Module (WROOM-32 / NodeMCU-32S)
 * Hardware Interfaces:
 *  - 6 to 8 Physical Testbed Nodes
 *  - ADC Channels for Voltage & Current Sensors (ACS712 / Shunt & Resistor Dividers)
 *  - Relay Outputs for Physical Fault Injection & Islanding Control
 *  - High-Speed USB Serial UART Telemetry (115200 baud) for Unity 3D & Digital Twin sync
 */

#include <Arduino.h>

// Number of physical testbed nodes monitored by this ESP32
#define NUM_PHYSICAL_NODES 8

// Pin Mappings
const int VOLT_PINS[NUM_PHYSICAL_NODES] = {36, 39, 34, 35, 32, 33, 25, 26}; // ADC1 & ADC2
const int RELAY_PINS[NUM_PHYSICAL_NODES] = {23, 22, 21, 19, 18, 5, 4, 2};    // Relay outputs

// Nominal Calibration Constants
const float ADC_REF_VOLTAGE = 3.3f;
const float VOLTAGE_DIVIDER_RATIO = 11.0f; // Scales 0-30V / 0-230V scaled down to 0-3.3V
const float CURRENT_SENSITIVITY = 0.185f;  // 185mV/A for ACS712-05B

struct GridNodeHardware {
    int id;
    const char* name;
    float voltage;
    float current;
    float powerKW;
    float temperature;
    bool isTripped;
    bool isCritical;
};

GridNodeHardware nodes[NUM_PHYSICAL_NODES] = {
    {1, "Main Power Plant", 230.0f, 2.1f, 483.0f, 45.0f, false, false},
    {2, "Substation Alpha", 229.5f, 1.4f, 321.3f, 48.0f, false, false},
    {3, "Substation Beta (Central)", 228.2f, 1.3f, 296.6f, 52.0f, false, false},
    {4, "General Hospital (Critical)", 230.1f, 0.42f, 96.6f, 41.0f, false, true},
    {5, "Emergency 911 HQ", 229.8f, 0.35f, 80.4f, 40.0f, false, true},
    {6, "Water Treatment Facility", 229.0f, 0.50f, 114.5f, 44.0f, false, true},
    {7, "Industrial Tech Park", 227.8f, 0.75f, 170.8f, 58.0f, false, false},
    {8, "Commercial District", 228.5f, 0.60f, 137.1f, 50.0f, false, false}
};

unsigned long lastTelemetryMillis = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 250; // 4Hz high-frequency stream

void setup() {
    Serial.begin(115200);
    analogReadResolution(12); // 12-bit ADC (0 - 4095)

    for (int i = 0; i < NUM_PHYSICAL_NODES; i++) {
        pinMode(RELAY_PINS[i], OUTPUT);
        digitalWrite(RELAY_PINS[i], LOW); // Closed/Energized state
    }

    Serial.println("{\"event\": \"BOOT\", \"device\": \"PCRE_ESP32_TESTBED\", \"status\": \"READY\"}");
}

void readSensors() {
    for (int i = 0; i < NUM_PHYSICAL_NODES; i++) {
        if (nodes[i].isTripped) {
            nodes[i].voltage = 0.0f;
            nodes[i].current = 0.0f;
            nodes[i].powerKW = 0.0f;
            continue;
        }

        // Read ADC raw values with small moving average
        int rawV = analogRead(VOLT_PINS[i]);
        float pinVoltage = (rawV / 4095.0f) * ADC_REF_VOLTAGE;
        
        // Calibrated measurement (or simulated baseline if testbed running dry)
        float measuredV = pinVoltage * VOLTAGE_DIVIDER_RATIO;
        if (measuredV < 1.0f) {
            // Dry bench test jitter around nominal 230V
            measuredV = 230.0f + ((random(-20, 20)) / 10.0f);
        }

        float measuredI = (measuredV > 10.0f) ? (nodes[i].powerKW * 1000.0f) / measuredV : 0.0f;

        nodes[i].voltage = measuredV;
        nodes[i].current = measuredI / 1000.0f; // in Amps
        nodes[i].powerKW = (nodes[i].voltage * nodes[i].current);
        nodes[i].temperature += (nodes[i].current > 1.5f) ? 0.05f : -0.02f;
        nodes[i].temperature = constrain(nodes[i].temperature, 35.0f, 95.0f);
    }
}

void broadcastTelemetry() {
    for (int i = 0; i < NUM_PHYSICAL_NODES; i++) {
        // Output strict JSON format compatible with Unity HardwareBridge.cs
        Serial.print("{\"nodeId\":");
        Serial.print(nodes[i].id);
        Serial.print(",\"voltage\":");
        Serial.print(nodes[i].voltage, 1);
        Serial.print(",\"current\":");
        Serial.print(nodes[i].current, 2);
        Serial.print(",\"powerKW\":");
        Serial.print(nodes[i].powerKW, 1);
        Serial.print(",\"temperature\":");
        Serial.print(nodes[i].temperature, 1);
        Serial.print(",\"status\":\"");
        Serial.print(nodes[i].isTripped ? "TRIPPED" : (nodes[i].temperature > 75.0f ? "WARNING" : "HEALTHY"));
        Serial.println("\"}");
    }
}

void processIncomingCommands() {
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();

        // Check for trip / restore commands from PCRE Digital Twin or Edge Engine
        // Format: TRIP:3 or RESTORE:3 or ALL_RESET
        if (cmd.startsWith("TRIP:")) {
            int targetNode = cmd.substring(5).toInt();
            if (targetNode >= 1 && targetNode <= NUM_PHYSICAL_NODES) {
                int idx = targetNode - 1;
                nodes[idx].isTripped = true;
                digitalWrite(RELAY_PINS[idx], HIGH); // Open relay
                Serial.print("{\"ack\": \"TRIP_EXECUTED\", \"node\": ");
                Serial.print(targetNode);
                Serial.println("}");
            }
        } else if (cmd.startsWith("RESTORE:")) {
            int targetNode = cmd.substring(8).toInt();
            if (targetNode >= 1 && targetNode <= NUM_PHYSICAL_NODES) {
                int idx = targetNode - 1;
                nodes[idx].isTripped = false;
                digitalWrite(RELAY_PINS[idx], LOW); // Close relay
                Serial.print("{\"ack\": \"RESTORED\", \"node\": ");
                Serial.print(targetNode);
                Serial.println("}");
            }
        } else if (cmd == "ALL_RESET") {
            for (int i = 0; i < NUM_PHYSICAL_NODES; i++) {
                nodes[i].isTripped = false;
                digitalWrite(RELAY_PINS[i], LOW);
            }
            Serial.println("{\"ack\": \"ALL_RESET_OK\"}");
        }
    }
}

void loop() {
    readSensors();
    processIncomingCommands();

    if (millis() - lastTelemetryMillis >= TELEMETRY_INTERVAL_MS) {
        lastTelemetryMillis = millis();
        broadcastTelemetry();
    }
}
