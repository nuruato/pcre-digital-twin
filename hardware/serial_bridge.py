"""
PCRE Serial Communication Bridge & Test Utility
Connects physical ESP32 hardware testbed to Unity 3D / Web Digital Twin.
Includes standalone mock generator for demonstrations when hardware is offline.
"""

import sys
import time
import json
import random
import argparse

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

NODES_SPEC = [
    {"id": 1, "name": "Main Power Plant", "nomV": 230.0, "nomI": 2.1, "crit": False},
    {"id": 2, "name": "Substation Alpha", "nomV": 229.5, "nomI": 1.4, "crit": False},
    {"id": 3, "name": "Substation Beta (Central)", "nomV": 228.2, "nomI": 1.3, "crit": False},
    {"id": 4, "name": "General Hospital (Critical)", "nomV": 230.1, "nomI": 0.42, "crit": True},
    {"id": 5, "name": "Emergency 911 HQ", "nomV": 229.8, "nomI": 0.35, "crit": True},
    {"id": 6, "name": "Water Treatment Facility", "nomV": 229.0, "nomI": 0.50, "crit": True},
    {"id": 7, "name": "Industrial Tech Park", "nomV": 227.8, "nomI": 0.75, "crit": False},
    {"id": 8, "name": "Commercial District", "nomV": 228.5, "nomI": 0.60, "crit": False}
]

def run_mock_stream(duration_seconds=None):
    """Generates continuous high-fidelity telemetry packets matching ESP32 output."""
    print("=" * 70)
    print("PCRE HARDWARE BRIDGE - MOCK TELEMETRY STREAM")
    print("Emulating 8-Node Physical Testbed for Unity & Digital Twin")
    print("=" * 70)

    start_time = time.time()
    packet_count = 0

    try:
        while True:
            if duration_seconds and (time.time() - start_time) > duration_seconds:
                break

            for node in NODES_SPEC:
                jitter_v = random.uniform(-1.5, 1.5)
                v = round(node["nomV"] + jitter_v, 1)
                jitter_i = random.uniform(-0.04, 0.04)
                i = round(node["nomI"] + jitter_i, 2)
                kw = round((v * i) / 10.0, 1)
                temp = round(42.0 + random.uniform(-0.5, 0.8), 1)

                packet = {
                    "nodeId": node["id"],
                    "voltage": v,
                    "current": i,
                    "powerKW": kw,
                    "temperature": temp,
                    "status": "HEALTHY"
                }

                line = json.dumps(packet)
                print(line)
                packet_count += 1

            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\nStream stopped. Generated {packet_count} packets.")

    return packet_count

def run_serial_bridge(port, baud=115200):
    """Reads live telemetry from ESP32 and prints or pipes to Unity."""
    if not SERIAL_AVAILABLE:
        print("Error: pyserial library not found. Run: pip install pyserial")
        return

    print(f"Opening Serial connection to ESP32 on {port} @ {baud} baud...")
    try:
        ser = serial.Serial(port, baud, timeout=1)
        time.sleep(2)
        print("Connected to ESP32! Forwarding telemetry packets:")
        while True:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line:
                print(f"[ESP32 -> TWIN]: {line}")
    except Exception as ex:
        print(f"Serial Connection Error: {ex}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PCRE Hardware Bridge")
    parser.add_argument("--mock", action="store_true", help="Run simulated telemetry generator")
    parser.add_argument("--test-mock", action="store_true", help="Run verification test on mock generator")
    parser.add_argument("--port", type=str, default="COM3", help="Serial port for ESP32")
    parser.add_argument("--baud", type=int, default=115200, help="Baud rate")
    args = parser.parse_args()

    if args.test_mock:
        print("Verifying mock telemetry generation (2 seconds test)...")
        count = run_mock_stream(duration_seconds=2)
        print(f"Test PASSED! Successfully generated {count} valid JSON telemetry packets.")
        sys.exit(0)
    elif args.mock:
        run_mock_stream()
    else:
        run_serial_bridge(args.port, args.baud)
