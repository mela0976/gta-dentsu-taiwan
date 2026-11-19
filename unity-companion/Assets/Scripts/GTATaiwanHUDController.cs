using UnityEngine;
using UnityEngine.Video;

namespace Dentsu.GTA.Taiwan
{
    /// <summary>
    /// Manages the GTA 6 Taiwanese HUD telemetry, VideoPlayer cutscenes
    /// generated via Higgsfield (intro-taipei, boardroom-push, grandma-rescue),
    /// and GPS minimap focus points.
    /// </summary>
    public class GTATaiwanHUDController : MonoBehaviour
    {
        public DecisionWisdomCampaign campaign;
        public VideoPlayer cutscenePlayer;

        public string activeWantedDisplay = "☆☆☆☆☆";
        public string lastStatusBanner = "08:30 AM 台北橋機車瀑布 ➔ 松仁路超商";

        private void OnEnable()
        {
            if (campaign == null) return;
            campaign.OnStatsChanged += RefreshHud;
            campaign.OnGrandmaRescueTriggered += HandleGrandmaRescue;
        }

        private void OnDisable()
        {
            if (campaign == null) return;
            campaign.OnStatsChanged -= RefreshHud;
            campaign.OnGrandmaRescueTriggered -= HandleGrandmaRescue;
        }

        public void RefreshHud(AgencyStats s)
        {
            activeWantedDisplay = new string('★', s.wantedStars) + new string('☆', Mathf.Max(0, 5 - s.wantedStars));
        }

        public void HandleGrandmaRescue(string message)
        {
            lastStatusBanner = message;
            PlayCutsceneByName("grandma-rescue");
        }

        public void PlayCutsceneByName(string clipName)
        {
            if (cutscenePlayer == null || string.IsNullOrEmpty(clipName)) return;
            cutscenePlayer.url = $"Assets/Video/{clipName}.mp4";
            cutscenePlayer.Play();
        }
    }
}
