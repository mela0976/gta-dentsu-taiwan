using UnityEngine;

namespace Dentsu.GTA.Taiwan
{
    /// <summary>
    /// Unity 6 3-lane arcade controller for Grandma Scooter Rush
    /// (阿嬤買菜電動車大暴走), matching the HTML5 Canvas minigame lanes & pickups.
    /// </summary>
    public class GrandmaScooterController : MonoBehaviour
    {
        [Header("Taipei Neon 3-Lane Movement")]
        public float laneWidth = 3.2f;
        public float laneSwitchSpeed = 14f;
        public float forwardSpeed = 18f;

        [Header("Runtime State")]
        [Range(0, 2)] public int currentLane = 1;
        public int score = 0;
        public int hp = 3;
        public float tatungShieldRemaining = 0f;

        private Vector3 _targetPosition;

        private void Start()
        {
            _targetPosition = transform.position;
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A))
            {
                ShiftLane(-1);
            }
            else if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D))
            {
                ShiftLane(1);
            }

            if (tatungShieldRemaining > 0f)
            {
                tatungShieldRemaining = Mathf.Max(0f, tatungShieldRemaining - Time.deltaTime);
            }

            float targetX = (currentLane - 1) * laneWidth;
            _targetPosition = new Vector3(targetX, transform.position.y, transform.position.z + forwardSpeed * Time.deltaTime);
            transform.position = Vector3.Lerp(transform.position, _targetPosition, Time.deltaTime * laneSwitchSpeed);
        }

        public void ShiftLane(int delta)
        {
            currentLane = Mathf.Clamp(currentLane + delta, 0, 2);
        }

        public void CollectPickup(string itemId)
        {
            switch (itemId)
            {
                case "tatung":
                    tatungShieldRemaining = 4.5f;
                    score += 300;
                    break;
                case "milktea":
                    hp = Mathf.Min(3, hp + 1);
                    score += 150;
                    break;
                case "trust":
                    score += 220;
                    break;
                case "rmn":
                case "slop":
                case "cookie":
                    if (tatungShieldRemaining > 0f)
                    {
                        score += 120;
                    }
                    else
                    {
                        hp = Mathf.Max(0, hp - 1);
                        score = Mathf.Max(0, score - 80);
                    }
                    break;
            }
        }
    }
}
