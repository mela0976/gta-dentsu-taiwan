using System;
using System.Collections.Generic;
using UnityEngine;

namespace Dentsu.GTA.Taiwan
{
    public enum AgencyRoleId
    {
        Account,
        Planner,
        Creative,
        Media,
        GrandmaMaster
    }

    [Serializable]
    public struct AgencyStats
    {
        [Range(0, 100)] public int stamina;
        [Range(0, 100)] public int streetCred;
        [Range(0, 100)] public int realLift;
        [Range(0, 100)] public int brandTrust;
        [Range(0, 100)] public int judgment;
        [Range(0, 5)] public int wantedStars;
    }

    [Serializable]
    public class ChapterBrief
    {
        public int chapterIndex;
        public int yearbookYear;
        public string timeSlot;
        public string taipeiLocation;
        public string bookTitle;
        public string conflictSummary;
        public string grandmaMarketProverb;
        public string cutsceneVideoClipName;
    }

    /// <summary>
    /// Unity 6 companion campaign state controller mirroring the Web HTML5
    /// Grand Theft Agency: Dentsu Taiwan One-Day Odyssey (2018-2026 Intelligent Decision).
    /// </summary>
    public class DecisionWisdomCampaign : MonoBehaviour
    {
        [Header("Role & Grandma Mod")]
        public AgencyRoleId selectedRole = AgencyRoleId.Planner;
        public bool grandmaModUnlocked = false;
        public int currentChapterIndex = 0;
        public AgencyStats stats;

        [Header("10-Time-Slot Agency Day")]
        public List<ChapterBrief> chapters = new List<ChapterBrief>();

        private string _cheatBuffer = string.Empty;
        private const string GrandmaCheatCode = "AMA666";

        public event Action<AgencyStats> OnStatsChanged;
        public event Action<string> OnGrandmaRescueTriggered;

        private void Awake()
        {
            InitializeRoleStats(selectedRole);
            if (chapters.Count == 0)
            {
                SeedDefaultChapters();
            }
        }

        private void Update()
        {
            if (string.IsNullOrEmpty(Input.inputString)) return;
            foreach (char c in Input.inputString)
            {
                if (!char.IsLetterOrDigit(c)) continue;
                _cheatBuffer = (_cheatBuffer + char.ToUpperInvariant(c));
                if (_cheatBuffer.Length > GrandmaCheatCode.Length)
                {
                    _cheatBuffer = _cheatBuffer.Substring(_cheatBuffer.Length - GrandmaCheatCode.Length);
                }
                if (_cheatBuffer == GrandmaCheatCode)
                {
                    ActivateGrandmaMod();
                }
            }
        }

        public void InitializeRoleStats(AgencyRoleId role)
        {
            selectedRole = role;
            stats = role switch
            {
                AgencyRoleId.Account => new AgencyStats { stamina = 85, streetCred = 90, realLift = 55, brandTrust = 65, judgment = 65, wantedStars = 1 },
                AgencyRoleId.Planner => new AgencyStats { stamina = 80, streetCred = 70, realLift = 70, brandTrust = 85, judgment = 80, wantedStars = 1 },
                AgencyRoleId.Creative => new AgencyStats { stamina = 75, streetCred = 85, realLift = 60, brandTrust = 90, judgment = 75, wantedStars = 1 },
                AgencyRoleId.Media => new AgencyStats { stamina = 80, streetCred = 75, realLift = 85, brandTrust = 60, judgment = 75, wantedStars = 1 },
                AgencyRoleId.GrandmaMaster => new AgencyStats { stamina = 100, streetCred = 99, realLift = 95, brandTrust = 99, judgment = 99, wantedStars = 0 },
                _ => new AgencyStats { stamina = 80, streetCred = 75, realLift = 70, brandTrust = 75, judgment = 75, wantedStars = 1 }
            };
            OnStatsChanged?.Invoke(stats);
        }

        public void ActivateGrandmaMod()
        {
            grandmaModUnlocked = true;
            TriggerGrandmaTatungRescue("秘技 AMA666 啟動！阿嬤騎電動車提大同電鍋直接支援信義區！");
        }

        public void ApplyDecisionDelta(int staminaDelta, int credDelta, int liftDelta, int trustDelta, int judgmentDelta, int wantedDelta)
        {
            stats.stamina = Mathf.Clamp(stats.stamina + staminaDelta, 0, 100);
            stats.streetCred = Mathf.Clamp(stats.streetCred + credDelta, 0, 100);
            stats.realLift = Mathf.Clamp(stats.realLift + liftDelta, 0, 100);
            stats.brandTrust = Mathf.Clamp(stats.brandTrust + trustDelta, 0, 100);
            stats.judgment = Mathf.Clamp(stats.judgment + judgmentDelta, 0, 100);
            stats.wantedStars = Mathf.Clamp(stats.wantedStars + wantedDelta, 0, 5);

            if (stats.wantedStars >= 5 || stats.stamina <= 0)
            {
                TriggerGrandmaTatungRescue("有一種餓，叫阿嬤覺得你爆肝了！大同電鍋滷肉飯清空五星通緝！");
            }
            else
            {
                OnStatsChanged?.Invoke(stats);
            }
        }

        public void TriggerGrandmaTatungRescue(string reason)
        {
            stats.wantedStars = 0;
            stats.stamina = 100;
            stats.judgment = Mathf.Clamp(stats.judgment + 8, 0, 100);
            OnGrandmaRescueTriggered?.Invoke(reason);
            OnStatsChanged?.Invoke(stats);
        }

        private void SeedDefaultChapters()
        {
            chapters.Add(new ChapterBrief { chapterIndex = 1, yearbookYear = 2018, timeSlot = "08:30 AM", taipeiLocation = "台北橋機車瀑布 ➔ 松仁路超商", bookTitle = "2018《智慧的轉變》", cutsceneVideoClipName = "intro-taipei" });
            chapters.Add(new ChapterBrief { chapterIndex = 2, yearbookYear = 2019, timeSlot = "10:00 AM", taipeiLocation = "信義區 12F 玻璃帷幕會議室", bookTitle = "2019《轉型的狂潮》", cutsceneVideoClipName = "boardroom-push" });
            chapters.Add(new ChapterBrief { chapterIndex = 6, yearbookYear = 2023, timeSlot = "05:30 PM", taipeiLocation = "內湖廣告攝影棚＆AI 文案砍價戰", bookTitle = "2023《AI 賦能・邁向卓越》", cutsceneVideoClipName = "grandma-rescue" });
            chapters.Add(new ChapterBrief { chapterIndex = 10, yearbookYear = 2026, timeSlot = "11:45 PM", taipeiLocation = "午夜戰情室終局衡斷拍板", bookTitle = "2026《Agentic 時代・衡斷力終局》", cutsceneVideoClipName = "" });
        }
    }
}
