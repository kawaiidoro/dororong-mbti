import { CHARACTER_STORIES } from './stories.js?v=3';

export const FAMILIES = {
  "NT": {
    "name": "생각이 반짝이는 분석형",
    "short": "분석형",
    "color": "#e9e2fa",
    "ink": "#6b50a1"
  },
  "NF": {
    "name": "마음이 몽글한 외교형",
    "short": "외교형",
    "color": "#e1eee6",
    "ink": "#496958"
  },
  "SJ": {
    "name": "든든하게 지켜주는 관리형",
    "short": "관리형",
    "color": "#e2eaf7",
    "ink": "#4f6588"
  },
  "SP": {
    "name": "매일이 새로운 탐험형",
    "short": "탐험형",
    "color": "#faedce",
    "ink": "#877037"
  }
};

export const PROFILES = {
  INTJ: {
    "title": "작전 짜는 도로롱",
    "subtitle": "조용히 세상을 정복할 계획 중",
    "quote": "귀여운 것도 다 계획이 있어.",
    "tags": [
      "큰 그림 담당",
      "혼자서도 척척",
      "은근한 야망"
    ],
    "item": "별 지도를 품은 동그란 안경",
    ...CHARACTER_STORIES.INTJ
  },
  INTP: {
    "title": "물음표 도로롱",
    "subtitle": "잠깐, 그건 왜 그런 건데?",
    "quote": "궁금해서 찾아보다가 새벽이 됐어.",
    "tags": [
      "호기심 과다",
      "생각의 꼬리",
      "몰입 천재"
    ],
    "item": "아이디어가 켜지는 작은 노트북",
    ...CHARACTER_STORIES.INTP
  },
  ENTJ: {
    "title": "대장 도로롱",
    "subtitle": "우리, 이왕이면 멋지게 해 보자",
    "quote": "따라와. 귀여운 미래로 갈 거야.",
    "tags": [
      "목표는 선명하게",
      "추진력 만렙",
      "작은 대장"
    ],
    "item": "작지만 당당한 황금 왕관",
    ...CHARACTER_STORIES.ENTJ
  },
  ENTP: {
    "title": "엉뚱박사 도로롱",
    "subtitle": "이렇게 해 보면 더 재미있지 않을까?",
    "quote": "그런데 반대로 하면 어떻게 돼?",
    "tags": [
      "아이디어 폭죽",
      "말장난 장인",
      "새로운 게 좋아"
    ],
    "item": "새로운 실험을 기다리는 장난감 로켓",
    ...CHARACTER_STORIES.ENTP
  },
  INFJ: {
    "title": "마음읽는 도로롱",
    "subtitle": "네가 말하지 않은 마음도 궁금해",
    "quote": "괜찮아. 천천히 얘기해도 돼.",
    "tags": [
      "조용한 다정함",
      "깊은 대화",
      "나만의 의미"
    ],
    "item": "달빛을 담은 작은 수정구슬",
    ...CHARACTER_STORIES.INFJ
  },
  INFP: {
    "title": "몽글몽글 도로롱",
    "subtitle": "머릿속에 작은 동화가 살아요",
    "quote": "별것 아닌 순간도, 내겐 작은 동화야.",
    "tags": [
      "상상은 무한대",
      "마음은 말랑해",
      "취향은 확실해"
    ],
    "item": "꿈을 폭 안아 주는 달 쿠션과 꽃 왕관",
    ...CHARACTER_STORIES.INFP
  },
  ENFJ: {
    "title": "응원단장 도로롱",
    "subtitle": "너 잘하고 있어, 내가 봤잖아!",
    "quote": "네가 반짝이면 나도 기분이 좋아.",
    "tags": [
      "응원은 진심",
      "함께 크는 중",
      "따뜻한 리더"
    ],
    "item": "친구를 향해 흔드는 하트 응원 깃발",
    ...CHARACTER_STORIES.ENFJ
  },
  ENFP: {
    "title": "두근두근 도로롱",
    "subtitle": "세상엔 재미있는 게 너무 많아!",
    "quote": "일단 가 보자! 재미있을 것 같아!",
    "tags": [
      "설렘 수집가",
      "친구는 어디에나",
      "자유로운 영혼"
    ],
    "item": "설렘을 담은 무지개 가방",
    ...CHARACTER_STORIES.ENFP
  },
  ISTJ: {
    "title": "차곡차곡 도로롱",
    "subtitle": "작은 약속도 꼼꼼하게 지켜요",
    "quote": "체크 완료. 이제 마음 놓고 도로롱.",
    "tags": [
      "믿음직한 루틴",
      "꼼꼼한 기록",
      "약속은 소중해"
    ],
    "item": "작은 체크리스트와 잘 깎은 연필",
    ...CHARACTER_STORIES.ISTJ
  },
  ISFJ: {
    "title": "포근포근 도로롱",
    "subtitle": "네가 좋아하는 차, 기억해 뒀어",
    "quote": "따뜻한 거 마실래? 내가 준비했어.",
    "tags": [
      "기억하는 다정함",
      "조용한 배려",
      "편안한 친구"
    ],
    "item": "마음을 데워 주는 작은 찻잔",
    ...CHARACTER_STORIES.ISFJ
  },
  ESTJ: {
    "title": "척척박사 도로롱",
    "subtitle": "정리하고, 움직이고, 해내고!",
    "quote": "자, 하나씩 하면 할 수 있어.",
    "tags": [
      "현실적인 해결",
      "일단 정리부터",
      "든든한 책임감"
    ],
    "item": "준비 완료를 알려 주는 노란 안전모",
    ...CHARACTER_STORIES.ESTJ
  },
  ESFJ: {
    "title": "다정다감 도로롱",
    "subtitle": "다 같이 먹으면 더 맛있잖아",
    "quote": "네 몫도 챙겨 뒀지!",
    "tags": [
      "분위기 메이커",
      "살뜰한 챙김",
      "함께라서 좋아"
    ],
    "item": "친구 몫까지 담긴 하트 쿠키 접시",
    ...CHARACTER_STORIES.ESFJ
  },
  ISTP: {
    "title": "뚝딱뚝딱 도로롱",
    "subtitle": "말보다는 손이 먼저 움직여",
    "quote": "잠깐 줘 봐. 내가 한번 해 볼게.",
    "tags": [
      "차분한 해결사",
      "직접 해 봐야 해",
      "자유가 소중해"
    ],
    "item": "작은 문제를 해결하는 은빛 스패너",
    ...CHARACTER_STORIES.ISTP
  },
  ISFP: {
    "title": "감성화가 도로롱",
    "subtitle": "오늘 마음은 무슨 색일까?",
    "quote": "이 색, 오늘의 나랑 닮았어.",
    "tags": [
      "섬세한 취향",
      "지금의 아름다움",
      "조용한 자유"
    ],
    "item": "오늘의 마음을 담은 작은 팔레트",
    ...CHARACTER_STORIES.ISFP
  },
  ESTP: {
    "title": "씽씽 도로롱",
    "subtitle": "재미있는 일? 내가 먼저 갈게!",
    "quote": "생각했으면 한번 해 봐야지!",
    "tags": [
      "지금 바로 출발",
      "순간의 센스",
      "도전이 즐거워"
    ],
    "item": "바람을 타는 민트색 스케이트보드",
    ...CHARACTER_STORIES.ESTP
  },
  ESFP: {
    "title": "반짝반짝 도로롱",
    "subtitle": "오늘도 무대는 바로 여기!",
    "quote": "분위기 좋다! 한 곡 더 갈까?",
    "tags": [
      "즐거움 전염",
      "표현은 솔직하게",
      "현재를 반짝이게"
    ],
    "item": "오늘의 무대를 여는 작은 마이크",
    ...CHARACTER_STORIES.ESFP
  }
};

export const TYPES = Object.keys(PROFILES);
export function parseMbti(value) {
  const type = String(value ?? '').trim().toUpperCase().replace(/\s+/g, '').replace(/-[AT]$/, '');
  return Object.hasOwn(PROFILES, type) ? type : null;
}
export function familyOf(type) {
  if (type[1] === 'N') return 'N' + type[2];
  return 'S' + type[3];
}
const LIMB_REVISED_TYPES = new Set(['INTJ', 'ISTJ', 'ISFJ', 'ESFJ', 'ISFP', 'ESFP', 'INFJ']);
export function imagePath(type) {
  const suffix = LIMB_REVISED_TYPES.has(type) ? '-v2' : '';
  return `assets/${type.toLowerCase()}${suffix}.png`;
}
export function makeResultUrl(base, type, name = '') {
  const url = new URL(base);
  url.search = '';
  url.hash = '';
  url.searchParams.set('mbti', type);
  if (name) url.searchParams.set('name', name.slice(0, 12));
  return url.toString();
}
