// These SVGs use layered strokes and geometry so repeated inline instances need no IDs.
const gdtSvgNamespace = 'http://www.w3.org/2000/svg';

const gdtSunBands = Array.from({ length: 51 }, (_, index) => {
  const offset = index * 2 - 50;
  const halfWidth = Math.sqrt(51 ** 2 - offset ** 2);
  const hue = 43 - index * 1.48;
  const dash = index > 29 ? ' stroke-dasharray="12 1"' : '';
  return `<path d="M${180 - halfWidth} ${61 + offset}h${2 * halfWidth}" stroke="hsl(${hue},92%,65%)" stroke-width="2.2"${dash}/>`;
}).join('');

export const SVG_GTA_TAIWAN_CREST = `<svg xmlns="${gdtSvgNamespace}" class="gdt-crest" viewBox="0 0 360 150" role="img" aria-label="Grand Theft Agency · Taipei Xinyi District">
  <path d="M16 110 46 41 106 19h148l60 22 30 69-29 28H45Z" fill="#101023" stroke="#704672"/>
  <path d="M26 105 52 48l52-20m152 0 52 20 26 57" fill="none" stroke="#43dfd5" opacity=".32" stroke-width="5"/>
  <path d="M26 105 52 48l52-20m152 0 52 20 26 57" fill="none" stroke="#79ffec"/>
  <circle cx="180" cy="61" r="56" fill="none" stroke="#f0609a" stroke-width="7" opacity=".17"/>
  <circle cx="180" cy="61" r="54" fill="none" stroke="#ffcba6" opacity=".55"/>
  ${gdtSunBands}
  <path d="M43 105V92h17v-9h16v22h16V68h13v-9h19v46h12V47l15-12 13 12v58H43Z" fill="#151a31" stroke="#8eced0"/>
  <path d="m136 47 28 26-28 26m0-26 28-26m0 52-28-26m14-37v69m-14-52h28m-28 39h28" fill="none" stroke="#6ac5cb" opacity=".7"/>
  <path d="M176 104v-14h8V72h-5l7-8h-5l7-8h-5l7-8h-5l7-8v-7h3V18h1v15h3v7l7 8h-5l7 8h-5l7 8h-5l7 8h-5v18h8v14Z" fill="#141d34" stroke="#f8bf94"/>
  <path d="M184 81h23m-21-18h18m-13-18h9m-15 49h23" stroke="#74eada" opacity=".7"/>
  <path d="M219 105V58q17-16 37 0v47Z" fill="#15172c" stroke="#6df0df"/>
  <path d="M221 102c36-12 36-24 0-36m33 36c-36-12-36-24 0-36m-34 32h36m-35-10h34m-34-10h34m-34-10h34m-32-10h30" fill="none" stroke="#ffad8b" stroke-width="1.2"/>
  <path d="M52 105q9-20 8-31-12-5-20 7 3-13 17-12-8-10-17-8 13-5 22 5 6-13 22-10-12 4-17 11 16-7 23 7-10-7-23-2 1 16-7 33Zm214 0 9-22-9-8q-11 4-13-4-7-7 4-12 3-10 13-7 6-11 18-5 10-5 16 4 12 1 13 10 10 5 3 13-6 7-18 1l-11 7 6 23h-9l-5-19-9 19Z" fill="#0a1423" stroke="#508c91"/>
  <path d="m275 82 1-10m10 11 12-12m-34 7v20m39-22v25" fill="none" stroke="#66aa9c" opacity=".55"/>
  <path d="M302 96h21l-2 9h-17Zm-2-1q12-9 25 0Zm9-5v-2h7v2" fill="#1d2230" stroke="#ffd49c"/>
  <path d="M40 105h280l-15 29H55Z" fill="#161329" stroke="#e983a9"/>
  <path d="m70 111 7 15 7-15m5 0v15m187-15 7 15 7-15m5 0v15" fill="none" stroke-width="2.5" stroke="#70f7ed"/>
  <path d="m73 111 7 15 7-15m5 0v15m187-15 7 15 7-15m5 0v15" fill="none" stroke="#fa8bb9" opacity=".78"/>
  <text x="180" y="123" text-anchor="middle" fill="#fff1d9" font-family="system-ui,sans-serif" font-size="10" font-weight="700" letter-spacing="1.25">TAIPEI · XINYI DISTRICT</text>
  <path d="M124 142h112m-88 4h64" stroke="#da729f"/>
</svg>`;

const gdtGrillePath = 'M3 62V3h59M8 55V8h47M8 37l9 5 9-5V26l11 0 5-9-5-9M8 17l9-5 9 5v9m-9-14V8m-5 18 5-9 9 9-9 9Zm5 9v7m20-16 8 5 8-5V16l-8-5-8 5m-20 26 9 5v8l-9 5-9-5';

export const SVG_IRON_GRILLE_CORNER = `<svg xmlns="${gdtSvgNamespace}" class="gdt-grille" viewBox="0 0 64 64" aria-hidden="true">
  <path d="${gdtGrillePath}" fill="none" stroke="#050b12" stroke-width="5"/>
  <path d="${gdtGrillePath}" fill="none" stroke="#20d8c0" stroke-width="4" opacity=".25"/>
  <path d="${gdtGrillePath}" fill="none" stroke="#e5b976" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M27 27c-13-2-12-15-5-12 4 2 5 7 5 12 2-13 15-12 12-5-2 4-7 5-12 5 13 2 12 15 5 12-4-2-5-7-5-12-2 13-15 12-12 5 2-4 7-5 12-5Z" fill="#123238" stroke="#92f5e0"/>
  <circle cx="27" cy="27" r="2.4" fill="#ffe0a0"/>
  <path d="M3 51v11M51 3h11M10 10h6m-6 0v6" stroke="#a0ffee"/>
</svg>`;

const gdtSealFlecks = Array.from({ length: 90 }, (_, index) => {
  const x = 23 + (index * 47 % 214);
  const y = 13 + (index * 31 % 81);
  return `<path d="M${x} ${y}h${index % 3 + 1}"/>`;
}).join('');

export const SVG_TEMPLE_STAMP_PASSED = `<svg xmlns="${gdtSvgNamespace}" class="gdt-temple-stamp" viewBox="0 0 260 110" role="img" aria-label="MISSION PASSED · 衡斷破局 · DENTSU TW">
  <rect x="7" y="7" width="246" height="96" rx="21" fill="#2a1119" stroke="#c74240" stroke-width="6" opacity=".78"/>
  <rect x="9" y="9" width="242" height="92" rx="18" fill="none" stroke="#fab877" stroke-width="1.6"/>
  <rect x="15" y="15" width="230" height="80" rx="13" fill="none" stroke="#f66d59" stroke-dasharray="10 1 3 1"/>
  <ellipse cx="130" cy="51" rx="105" ry="32" fill="none" stroke="#ff9475" opacity=".45"/>
  <ellipse cx="130" cy="51" rx="110" ry="36" fill="none" stroke="#e65448" opacity=".45" stroke-dasharray="3 1 7 2"/>
  <g stroke="#ffb485" opacity=".24">${gdtSealFlecks}</g>
  <path d="M18 54h14c10 0 10-12 3-12-6 0-6 7-2 7m209 5h-14c-10 0-10-12-3-12 6 0 6 7 2 7M21 61h17m184 0h17" fill="none" stroke="#fbb879" stroke-width="1.5"/>
  <text x="130" y="63" text-anchor="middle" fill="#ffce92" stroke="#a34036" stroke-width=".55" font-family="'Songti TC','Noto Serif CJK TC',serif" font-size="33" font-weight="800" letter-spacing="5">衡斷破局</text>
  <path d="M47 72h166l-8 16H55Z" fill="#35151b" stroke="#bc5148"/>
  <text x="130" y="83" text-anchor="middle" fill="#ffe0ad" font-family="system-ui,sans-serif" font-size="9" font-weight="800" letter-spacing="1.35">MISSION PASSED · DENTSU TW</text>
</svg>`;

export const SVG_IFRUIT_CHASSIS_TOP = `<svg xmlns="${gdtSvgNamespace}" class="gdt-ifruit" viewBox="0 0 280 28" role="img" aria-label="iFruit Taiwan · 中華電信 5G 富邦A25">
  <path d="M1 28V17Q1 1 19 1h242q18 0 18 16v11Z" fill="#121724" stroke="#54667a"/>
  <path d="M4 28V17Q4 4 19 4h242q15 0 15 13v11" fill="none" stroke="#89e6df" opacity=".43"/>
  <path d="M10 25h260M22 3h30m176 0h30" stroke="#d4a86e" opacity=".42"/>
  <rect x="117" y="7" width="48" height="14" rx="7" fill="#05060b" stroke="#374452"/>
  <path d="M123 13h19m-19 2h19" stroke="#586472" stroke-dasharray="1 1"/>
  <circle cx="154" cy="14" r="4.1" fill="#1c314b" stroke="#476881"/>
  <circle cx="154" cy="14" r="2.1" fill="#07111e"/>
  <circle cx="153" cy="13" r=".8" fill="#87a8ef"/>
  <text x="13" y="19" fill="#d8efea" font-family="system-ui,sans-serif" font-size="9" font-weight="650">中華電信 5G 富邦A25</text>
  <path d="M217 18v-3m3 3v-5m3 5v-7m3 7V9" stroke="#a1f5e1" stroke-width="1.5"/>
  <path d="M232 12q5-5 10 0m-8 2q3-3 6 0m-4 2q1-1 2 0" stroke="#a1f5e1" fill="none"/>
  <rect x="247" y="10.5" width="16" height="8" rx="2" fill="none" stroke="#9ba9b2"/>
  <path d="M249 12h11v5h-11zm15 1h1v3h-1z" fill="#b8e9bd"/>
</svg>`;

const gdtRadarTicks = Array.from({ length: 72 }, (_, index) => {
  const start = index % 6 === 0 ? 86 : index % 2 === 0 ? 90 : 93;
  const color = index % 6 === 0 ? '#f5cf8c' : '#7dd6ce';
  return `<path d="M100 ${100 - start}V4" transform="rotate(${index * 5} 100 100)" stroke="${color}"/>`;
}).join('');

const gdtRadarSweep = Array.from({ length: 38 }, (_, index) => {
  const color = index >= 34 ? '#f5d58d' : '#66ffe5';
  return `<path d="M100 100V17" transform="rotate(${index * 1.4} 100 100)" stroke="${color}" stroke-width="2.2" opacity="${(.006 + .22 * (index / 37) ** 2).toFixed(3)}"/>`;
}).join('');

export const SVG_RADAR_COMPASS_RING = `<svg xmlns="${gdtSvgNamespace}" class="gdt-radar" viewBox="0 0 200 200" role="img" aria-label="戰術雷達羅盤 N E S W">
  <g fill="none">
    <circle cx="100" cy="100" r="98" stroke="#254e55"/>
    <circle cx="100" cy="100" r="96" stroke="#6ce2d7" opacity=".34" stroke-width="3"/>
    ${gdtRadarTicks}
    <circle cx="100" cy="100" r="82" stroke="#89e5d9" opacity=".5"/>
    <circle cx="100" cy="100" r="57" stroke="#89e5d9" opacity=".28" stroke-dasharray="2 4"/>
    <circle cx="100" cy="100" r="28" stroke="#89e5d9" opacity=".28"/>
    <path d="M100 31v138m-69-69h138" stroke="#89e5d9" opacity=".25" stroke-dasharray="3 5"/>
  </g>
  <g class="gdt-radar-sweep" transform="rotate(24 100 100)">
    ${gdtRadarSweep}
    <path d="M100 100V17" transform="rotate(52 100 100)" stroke="#e4ffca"/>
  </g>
  <circle cx="100" cy="100" r="3" fill="#dcffe8"/>
  <g text-anchor="middle" fill="#fbdaa1" stroke="#0d1b25" stroke-width="2" paint-order="stroke" font-family="system-ui,sans-serif" font-size="11" font-weight="800">
    <text x="100" y="28">N</text><text x="176" y="104">E</text><text x="100" y="180">S</text><text x="24" y="104">W</text>
  </g>
</svg>`;

const gdtEscapeEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function gdtEscape(value) {
  return value
    .replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '�')
    .replace(/[&<>"']/g, character => gdtEscapeEntities[character]);
}

function gdtFitRoadLabel(value, baseSize) {
  const characters = Array.from(String(value).replace(/\s+/gu, ' ').trim());
  const label = characters.length > 42 ? characters.slice(0, 41).join('') + '…' : characters.join('');
  const units = Array.from(label).reduce((width, character) => width + (/^[\x20-\x7e]$/.test(character) ? .7 : 1), 0);
  return {
    label: gdtEscape(label),
    size: Math.max(6, Math.min(baseSize, Math.floor(232 / Math.max(1, units)))),
  };
}

export function SVG_ROAD_SIGN_BADGE(roadName = "松高路 77 號", enName = "Songgao Rd. · Fubon A25") {
  const chinese = gdtFitRoadLabel(roadName, 17);
  const english = gdtFitRoadLabel(enName, 10);
  return `<svg xmlns="${gdtSvgNamespace}" class="gdt-road-sign" viewBox="0 0 280 46" role="img" aria-label="${gdtEscape(String(roadName))} · ${gdtEscape(String(enName))}">
    <rect x="1" y="1" width="278" height="44" rx="8" fill="#006b54" stroke="#e5fff1" stroke-width="2"/>
    <rect x="5" y="5" width="270" height="36" rx="5" fill="none" stroke="#d9f7e8" stroke-width=".8"/>
    <path d="M12 7h256m-256 32h256" stroke="#9ce5cd" opacity=".4"/>
    <g fill="#b1c7bd" stroke="#194b41"><circle cx="13" cy="23" r="3.6"/><circle cx="267" cy="23" r="3.6"/></g>
    <path d="m12 24 2-2m252 2 2-2" stroke="#f9fff9"/>
    <svg x="22" width="236" height="46" viewBox="0 0 236 46" overflow="hidden">
      <g fill="#fff" text-anchor="middle" font-family="system-ui,sans-serif">
        <text x="118" y="21" font-size="${chinese.size}" font-weight="750">${chinese.label}</text>
        <text x="118" y="35" font-size="${english.size}" font-weight="550">${english.label}</text>
      </g>
    </svg>
  </svg>`;
}

const gdtStatShapes = {
  liver: ['M2 8c0-4 4-5 7-4 2 1 3 0 5 0 3 0 4 2 4 4 0 3-4 3-6 4-2 2-4 4-7 3-2 0-3-3-3-7Z', 'M4 10h3l1-3 2 5 1-2h4'],
  bs: ['M3 4h14v9H9l-4 3v-3H3Z', 'm5 9 2-2 3 3 3-3 2 2'],
  incrementality: ['M3 3v14h14M6 14v-3m4 3V9m4 5V7', 'm5 8 4-3 3 1 5-3m-4 0h4v4'],
  trust: ['M10 2 17 5v5c0 3-3 6-7 8-4-2-7-5-7-8V5Z', 'm6 10 3 3 5-6'],
  judgment: ['M10 3v13m-4 1h8M4 6h12M4 6l-2 5h4Zm12 0-2 5h4Z', 'M2 11q2 4 4 0m8 0q2 4 4 0M8 4l2-2 2 2'],
  budget: ['M3 5h12l2 2v8H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 0 9-3 1 3', 'M17 9h-5v4h5m-3-2h.1'],
};

export function getStatIconSvg(statKey) {
  if (!Object.hasOwn(gdtStatShapes, statKey)) return '';
  const [outline, detail] = gdtStatShapes[statKey];
  return `<svg xmlns="${gdtSvgNamespace}" class="gdt-stat" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 1 18 5v10l-8 4-8-4V5Z" fill="#102832" opacity=".65"/>
    <g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="${outline}" stroke="#51eedb" opacity=".24" stroke-width="3"/>
      <path d="${outline}" stroke="#7ef8e6" stroke-width="1.15"/>
      <path d="${detail}" stroke="#ffcd82" stroke-width="1.2"/>
    </g>
  </svg>`;
}

const gdtFsdRails = 'M94 360Q176 257 308 170M545 360Q427 245 326 170';

export const SVG_TESLA_FSD_HUD_OVERLAY = `<svg xmlns="${gdtSvgNamespace}" viewBox="0 0 640 360" role="img" aria-label="TESLA FSD v13 · AUTOPILOT ENGAGED · 車距鎖定 18m">
  <path d="M94 360Q176 257 308 170H326Q427 245 545 360Z" fill="#157eff" opacity=".16"/>
  <path d="M173 360Q223 262 312 170h10q78 98 146 190Z" fill="#288eff" opacity=".12"/>
  <g fill="none" stroke-linecap="round">
    <path d="${gdtFsdRails}" stroke="#145cff" stroke-width="16" opacity=".13"/>
    <path d="${gdtFsdRails}" stroke="#258dff" stroke-width="7" opacity=".48"/>
    <path d="${gdtFsdRails}" stroke="#45b8ff" stroke-width="3"/>
    <path d="${gdtFsdRails}" stroke="#bbf5ff" stroke-width="1" stroke-dasharray="17 5 2 5"/>
    <path d="M316 176q-24 108 7 184" stroke="#a4edff" stroke-dasharray="2 6" opacity=".8"/>
    <path d="M304 190q11 4 24 0m-33 15q20 7 41 0m-56 27q35 14 68 0m-89 36q54 22 110 0m-146 52q91 34 176 0" stroke="#5dccff" stroke-width="2" opacity=".66"/>
    <path d="M284 212q31 9 61 0m-84 38q50 17 100 0m-130 42q81 29 151 0m-196 52q130 33 245 0" stroke="#338dff" opacity=".5"/>
  </g>
  <g fill="#0a203b" fill-opacity=".38" stroke="#83dfff" stroke-linejoin="round">
    <path d="M270 172h35v35h-35Zm0 0 8-8h35v35l-8 8m0-35 8-8m-43 43 8-8h35"/>
    <path d="M374 156h23v48h-23Zm0 0 7-7h23v48l-7 7m0-48 7-7m-30 55 7-7h23"/>
  </g>
  <g fill="none" stroke="#c1f5ff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="281" cy="194" r="3.5"/><circle cx="296" cy="194" r="3.5"/>
    <path d="m281 194 4-7h5l3-5h4m-1 12-3-12m-11 5h5"/>
    <circle cx="386" cy="166" r="3"/>
    <path d="m386 171-2 11-5 10m5-10 7 10m-5-20-7 5m7-5 5 6 4-1"/>
  </g>
  <g font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#cff5ff" stroke="#08233a" stroke-width="2" paint-order="stroke">
    <text x="270" y="158">機車 · 18m</text><text x="374" y="143">行人 · 24m</text>
    <text x="496" y="117">2026 A25 · 松仁路段</text>
  </g>
  <g transform="translate(530 143)" text-anchor="middle" font-family="system-ui, sans-serif">
    <circle r="18" fill="#0c1a2b" fill-opacity=".88" stroke="#ff7a86" stroke-width="1.8"/>
    <circle r="14.8" fill="none" stroke="#ffbac1" opacity=".45" stroke-width=".6"/>
    <text y="2" fill="#fff" font-size="15" font-weight="800">50</text>
    <text y="10" fill="#d6ecff" font-size="6">km/h</text>
  </g>
  <rect x="13" y="12" width="225" height="21" rx="10.5" fill="#09192e" fill-opacity=".87" stroke="#4db5ff" stroke-opacity=".72"/>
  <g fill="none" stroke="#87ddff" stroke-width="1.1">
    <circle cx="25" cy="22.5" r="5.7"/>
    <circle cx="25" cy="23" r="1.5"/>
    <path d="M20 21q5-2 10 0m-9 0 3 2m5-2-3 2m-1 1.5v3"/>
  </g>
  <text x="36" y="26" fill="#d6f5ff" font-family="system-ui, sans-serif" font-size="8.5" font-weight="700">TESLA FSD v13 · AUTOPILOT ENGAGED · 車距鎖定 18m</text>
</svg>`;

const gdtFubonFloors = Array.from({ length: 54 }, (_, index) => {
  const y = 13 + index * .84;
  return `<path d="M59 ${y.toFixed(2)}h24"/>`;
}).join('');

export const SVG_FUBON_A25_WIKI_BLUEPRINT = `<svg xmlns="${gdtSvgNamespace}" viewBox="0 0 180 72" role="img" aria-label="FUBON A25 266.3m · 陶朱隱園">
  <g fill="none" stroke="#78b9d5" stroke-width=".45" opacity=".34">
    <path d="M17 59h146M38 4h12m-12 55h12M42 4v55m-2-53 4-4m-4 59 4-4"/>
    <path d="M91 39.75h12m-12 19.25h12m-9-19.25V59" stroke-dasharray="1 1"/>
  </g>
  <path d="M55 59V12h32v47Z" fill="#163d53" fill-opacity=".8" stroke="#a4d9ec" stroke-width=".65"/>
  <path d="M55 12V4h30l2 2v6M57 12V6h26v6M61 6v6m5-6v6m5-6v6m5-6v6m5-6v6M55 4l2 2m28-2-2 2" fill="none" stroke="#b9e7f4" stroke-width=".55"/>
  <g stroke="#b9eafa" opacity=".55" stroke-width=".21">${gdtFubonFloors}</g>
  <path d="M61 12v47m5-47v47m5-47v47m5-47v47m5-47v47" stroke="#a6dbf3" stroke-width=".35"/>
  <path d="m55 12 5 7-5 7 5 7-5 7 5 7-5 7 4 5m28-47-5 7 5 7-5 7 5 7-5 7 5 7-4 5M60 12v47m22-47v47" fill="none" stroke="#edfbff" stroke-width=".73"/>
  <path d="M20 59V51l5-3h27v11Z" fill="#224755" stroke="#dbf3f6" stroke-width=".65"/>
  <path d="M24 59v-8m3 8V49m3 10V49m3 10V49m3 10V49m3 10V49m3 10V49m3 10V49m3 10V49" stroke="#f2ffff" stroke-width=".65"/>
  <path d="M111 59q9-5 3-10t-3-9q12-1 25 0 8 5 1 10t2 9Z" fill="#173a49" stroke="#96cadd" stroke-width=".65"/>
  <path d="M112 40c32 6 32 12 0 19m24-19c-33 6-32 12 3 19" fill="none" stroke="#cfedf4" stroke-width=".7"/>
  <path d="M113 42q12 3 24 0m-22 2.5q11 3 24 0m-23 2.5q11 2.5 23 0m-23 3q10 2 21 0m-22 2.5q10 3 21 0m-23 3q12 3 24 0" fill="none" stroke="#81c5a8" stroke-width=".65"/>
  <path d="M115 43h5m11 3h6m-21 4h4m10 3h6m-21 4h6" stroke="#c8e5a0" stroke-width="1" stroke-linecap="round"/>
  <path d="M17 60h146" stroke="#8cd9e8" stroke-width=".6"/>
  <text x="90" y="69" text-anchor="middle" fill="#c7ecf5" font-family="system-ui, sans-serif" font-size="7.5" font-weight="700" letter-spacing=".55">FUBON A25 266.3m · 陶朱隱園</text>
</svg>`;
