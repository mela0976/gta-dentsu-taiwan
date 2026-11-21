import { ROLE_ACCOUNT_CH1 } from './role-account-ch1.js';
import { ROLE_ACCOUNT_CH2 } from './role-account-ch2.js';
import { ROLE_ACCOUNT_CH3 } from './role-account-ch3.js';
import { ROLE_ACCOUNT_CH4 } from './role-account-ch4.js';
import { ROLE_ACCOUNT_CH5 } from './role-account-ch5.js';
import { ROLE_ACCOUNT_CH6 } from './role-account-ch6.js';
import { ROLE_ACCOUNT_CH7 } from './role-account-ch7.js';
import { ROLE_ACCOUNT_CH8 } from './role-account-ch8.js';
import { ROLE_ACCOUNT_CH9 } from './role-account-ch9.js';
import { ROLE_ACCOUNT_CH10 } from './role-account-ch10.js';

import { ROLE_PLANNER_CH1 } from './role-planner-ch1.js';
import { ROLE_PLANNER_CH2 } from './role-planner-ch2.js';
import { ROLE_PLANNER_CH3 } from './role-planner-ch3.js';
import { ROLE_PLANNER_CH4 } from './role-planner-ch4.js';
import { ROLE_PLANNER_CH5 } from './role-planner-ch5.js';
import { ROLE_PLANNER_CH6 } from './role-planner-ch6.js';
import { ROLE_PLANNER_CH7 } from './role-planner-ch7.js';
import { ROLE_PLANNER_CH8 } from './role-planner-ch8.js';
import { ROLE_PLANNER_CH9 } from './role-planner-ch9.js';
import { ROLE_PLANNER_CH10 } from './role-planner-ch10.js';

import { ROLE_CREATIVE_CH1 } from './role-creative-ch1.js';
import { ROLE_CREATIVE_CH2 } from './role-creative-ch2.js';
import { ROLE_CREATIVE_CH3 } from './role-creative-ch3.js';
import { ROLE_CREATIVE_CH4 } from './role-creative-ch4.js';
import { ROLE_CREATIVE_CH5 } from './role-creative-ch5.js';
import { ROLE_CREATIVE_CH6 } from './role-creative-ch6.js';
import { ROLE_CREATIVE_CH7 } from './role-creative-ch7.js';
import { ROLE_CREATIVE_CH8 } from './role-creative-ch8.js';
import { ROLE_CREATIVE_CH9 } from './role-creative-ch9.js';
import { ROLE_CREATIVE_CH10 } from './role-creative-ch10.js';

import { ROLE_MEDIA_CH1 } from './role-media-ch1.js';
import { ROLE_MEDIA_CH2 } from './role-media-ch2.js';
import { ROLE_MEDIA_CH3 } from './role-media-ch3.js';
import { ROLE_MEDIA_CH4 } from './role-media-ch4.js';
import { ROLE_MEDIA_CH5 } from './role-media-ch5.js';
import { ROLE_MEDIA_CH6 } from './role-media-ch6.js';
import { ROLE_MEDIA_CH7 } from './role-media-ch7.js';
import { ROLE_MEDIA_CH8 } from './role-media-ch8.js';
import { ROLE_MEDIA_CH9 } from './role-media-ch9.js';
import { ROLE_MEDIA_CH10 } from './role-media-ch10.js';

import { ROLE_GRANDMA_CH1 } from './role-grandma-ch1.js';
import { ROLE_GRANDMA_CH2 } from './role-grandma-ch2.js';
import { ROLE_GRANDMA_CH3 } from './role-grandma-ch3.js';
import { ROLE_GRANDMA_CH4 } from './role-grandma-ch4.js';
import { ROLE_GRANDMA_CH5 } from './role-grandma-ch5.js';
import { ROLE_GRANDMA_CH6 } from './role-grandma-ch6.js';
import { ROLE_GRANDMA_CH7 } from './role-grandma-ch7.js';
import { ROLE_GRANDMA_CH8 } from './role-grandma-ch8.js';
import { ROLE_GRANDMA_CH9 } from './role-grandma-ch9.js';
import { ROLE_GRANDMA_CH10 } from './role-grandma-ch10.js';

import { ROLE_EPILOGUE_ACCOUNT } from './role-epilogue-account.js';
import { ROLE_EPILOGUE_PLANNER } from './role-epilogue-planner.js';
import { ROLE_EPILOGUE_CREATIVE } from './role-epilogue-creative.js';
import { ROLE_EPILOGUE_MEDIA, ROLE_EPILOGUE_GRANDMA } from './role-epilogue-media-grandma.js';

export const ROLE_CHAPTER_STORIES = {
  account: {
    epilogue: ROLE_EPILOGUE_ACCOUNT,
    chapters: {
      1: ROLE_ACCOUNT_CH1,
      2: ROLE_ACCOUNT_CH2,
      3: ROLE_ACCOUNT_CH3,
      4: ROLE_ACCOUNT_CH4,
      5: ROLE_ACCOUNT_CH5,
      6: ROLE_ACCOUNT_CH6,
      7: ROLE_ACCOUNT_CH7,
      8: ROLE_ACCOUNT_CH8,
      9: ROLE_ACCOUNT_CH9,
      10: ROLE_ACCOUNT_CH10,
    },
  },
  planner: {
    epilogue: ROLE_EPILOGUE_PLANNER,
    chapters: {
      1: ROLE_PLANNER_CH1,
      2: ROLE_PLANNER_CH2,
      3: ROLE_PLANNER_CH3,
      4: ROLE_PLANNER_CH4,
      5: ROLE_PLANNER_CH5,
      6: ROLE_PLANNER_CH6,
      7: ROLE_PLANNER_CH7,
      8: ROLE_PLANNER_CH8,
      9: ROLE_PLANNER_CH9,
      10: ROLE_PLANNER_CH10,
    },
  },
  creative: {
    epilogue: ROLE_EPILOGUE_CREATIVE,
    chapters: {
      1: ROLE_CREATIVE_CH1,
      2: ROLE_CREATIVE_CH2,
      3: ROLE_CREATIVE_CH3,
      4: ROLE_CREATIVE_CH4,
      5: ROLE_CREATIVE_CH5,
      6: ROLE_CREATIVE_CH6,
      7: ROLE_CREATIVE_CH7,
      8: ROLE_CREATIVE_CH8,
      9: ROLE_CREATIVE_CH9,
      10: ROLE_CREATIVE_CH10,
    },
  },
  media: {
    epilogue: ROLE_EPILOGUE_MEDIA,
    chapters: {
      1: ROLE_MEDIA_CH1,
      2: ROLE_MEDIA_CH2,
      3: ROLE_MEDIA_CH3,
      4: ROLE_MEDIA_CH4,
      5: ROLE_MEDIA_CH5,
      6: ROLE_MEDIA_CH6,
      7: ROLE_MEDIA_CH7,
      8: ROLE_MEDIA_CH8,
      9: ROLE_MEDIA_CH9,
      10: ROLE_MEDIA_CH10,
    },
  },
  grandma: {
    epilogue: ROLE_EPILOGUE_GRANDMA,
    chapters: {
      1: ROLE_GRANDMA_CH1,
      2: ROLE_GRANDMA_CH2,
      3: ROLE_GRANDMA_CH3,
      4: ROLE_GRANDMA_CH4,
      5: ROLE_GRANDMA_CH5,
      6: ROLE_GRANDMA_CH6,
      7: ROLE_GRANDMA_CH7,
      8: ROLE_GRANDMA_CH8,
      9: ROLE_GRANDMA_CH9,
      10: ROLE_GRANDMA_CH10,
    },
  },
};

export function getRoleChapterStory(roleId = 'planner', chapterId = 1, lang = 'zh') {
  const rk = ROLE_CHAPTER_STORIES[roleId] ? roleId : 'planner';
  const ch = ROLE_CHAPTER_STORIES[rk]?.chapters?.[chapterId];
  return ch?.[lang] || ch?.zh || null;
}

export function getRoleEpilogueData(roleId = 'planner', lang = 'zh') {
  const rk = ROLE_CHAPTER_STORIES[roleId] ? roleId : 'planner';
  const ep = ROLE_CHAPTER_STORIES[rk]?.epilogue;
  return ep?.[lang] || ep?.zh || null;
}
