using UnityEngine;

namespace PCRE.UI
{
    public class CameraController : MonoBehaviour
    {
        public Transform target;
        public float distance = 35f;
        public float xSpeed = 120.0f;
        public float ySpeed = 120.0f;
        public float yMinLimit = 15f;
        public float yMaxLimit = 80f;
        public float distanceMin = 10f;
        public float distanceMax = 80f;

        private float x = 45.0f;
        private float y = 45.0f;

        private void Start()
        {
            Vector3 angles = transform.eulerAngles;
            x = angles.y;
            y = angles.x;

            if (target == null)
            {
                GameObject center = new GameObject("CameraCenterTarget");
                center.transform.position = new Vector3(0, 0, 0);
                target = center.transform;
            }
        }

        private void LateUpdate()
        {
            if (target == null) return;

            // Right click or Alt+Left click to orbit
            if (Input.GetMouseButton(1) || (Input.GetKey(KeyCode.LeftAlt) && Input.GetMouseButton(0)))
            {
                x += Input.GetAxis("Mouse X") * xSpeed * 0.02f;
                y -= Input.GetAxis("Mouse Y") * ySpeed * 0.02f;
                y = ClampAngle(y, yMinLimit, yMaxLimit);
            }

            // Scroll to zoom
            distance = Mathf.Clamp(distance - Input.GetAxis("Mouse ScrollWheel") * 10f, distanceMin, distanceMax);

            Quaternion rotation = Quaternion.Euler(y, x, 0);
            Vector3 negDistance = new Vector3(0.0f, 0.0f, -distance);
            Vector3 position = rotation * negDistance + target.position;

            transform.rotation = rotation;
            transform.position = position;
        }

        private static float ClampAngle(float angle, float min, float max)
        {
            if (angle < -360F) angle += 360F;
            if (angle > 360F) angle -= 360F;
            return Mathf.Clamp(angle, min, max);
        }
    }
}
