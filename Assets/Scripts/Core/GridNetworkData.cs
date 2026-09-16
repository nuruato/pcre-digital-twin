using System;

namespace PCRE.Core
{
    public enum NodeType
    {
        PowerPlant,
        PrimarySubstation,
        DistributionSubstation,
        CriticalHospital,
        EmergencyCenter,
        WaterTreatment,
        IndustrialZone,
        CommercialDistrict,
        ResidentialSector
    }

    public enum NodeStatus
    {
        Healthy,
        Warning,
        Overloaded,
        Tripped,
        SheddedByPCRE,
        Islanded
    }

    [Serializable]
    public class TelemetryPacket
    {
        public int nodeId;
        public float voltage;
        public float current;
        public float powerKW;
        public float temperature;
        public string status;
    }
}
