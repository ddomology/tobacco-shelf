import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import customerOrdersData from "./data/customer-orders.json";

const STORAGE_KEY = "tobacco-shelf-BL-products-v23-br-top45-merged";



function shuffleOrders(orders) {
  const arr = [...(orders ?? [])];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function getVariantWeight(variant) {
  /*
    legacy alias를 너무 희귀하게 만들지 않기 위한 가중치.
    - high: 자주 출제
    - medium: 보통보다 약간 자주
    - low: 실전 모드용이라 약하게
  */
  if (variant?.source !== "legacy-alias") return 1;

  if (variant.confidence === "high") return 3;
  if (variant.confidence === "medium") return 2;
  if (variant.confidence === "low") return 1.35;

  return 1.5;
}

function pickOrderVariant(order) {
  const variants = Array.isArray(order?.variants)
    ? order.variants.filter((variant) => variant?.text)
    : [];

  if (!variants.length) {
    return null;
  }

  const totalWeight = variants.reduce(
    (sum, variant) => sum + getVariantWeight(variant),
    0
  );

  let cursor = Math.random() * totalWeight;

  for (const variant of variants) {
    cursor -= getVariantWeight(variant);

    if (cursor <= 0) {
      return variant;
    }
  }

  return variants[variants.length - 1] ?? null;
}

function withRandomOrderVariant(order) {
  const variant = pickOrderVariant(order);

  if (!variant) {
    return order;
  }

  return {
    ...order,
    text: variant.text,
    shownVariant: variant,
    intent: variant.intent ?? order.intent,
    quantity: variant.quantity ?? order.quantity,
    unit: variant.unit ?? order.unit,
    templateKey: variant.templateKey ?? order.templateKey,
  };
}


// practice order data start
const practiceOrders = [
  { id: "practice-001", text: "센티아 골드 하나 주세요.", answerIds: ["D-T-R3-C1"] },
  { id: "practice-002", text: "테리아 유젠 주세요.", answerIds: ["E-T-R4-C2"] },
  { id: "practice-003", text: "던힐 1MG 주세요.", answerIds: ["A-B-R1-C3"] },
  { id: "practice-004", text: "아쿠아 3 하나 주세요.", answerIds: ["D-B-R4-C2"] },
  { id: "practice-005", text: "아일랜드 클릭 주세요.", answerIds: ["E-B-R4-C4", "E-B-R4-C5"] },
  { id: "practice-006", text: "오아시스 펄 주세요.", answerIds: ["E-T-R5-C1"] },
];
// practice order data end
// template order generator start

const brandSpeakMap = {
  TEREA: { spokenBrand: "테리아", aliases: ["테리아", "테라", "TEREA"] },
  SENTIA: { spokenBrand: "센티아", aliases: ["센티아", "SENTIA"] },
  Marlboro: { spokenBrand: "말보로", aliases: ["말보로", "마르보로", "Marlboro", "MARLBORO"] },
  DUNHILL: { spokenBrand: "던힐", aliases: ["던힐", "DUNHILL"] },
  MEVIUS: { spokenBrand: "메비우스", aliases: ["메비우스", "뫼비우스", "MEVIUS"] },
  ESSE: { spokenBrand: "에쎄", aliases: ["에쎄", "ESSE"] },
  KENT: { spokenBrand: "켄트", aliases: ["켄트", "KENT"] },
  neo: { spokenBrand: "네오", aliases: ["네오", "neo", "NEO"] },
  NEO: { spokenBrand: "네오", aliases: ["네오", "neo", "NEO"] },
  MIIX: { spokenBrand: "믹스", aliases: ["믹스", "MIIX"] },
  PARLIAMENT: { spokenBrand: "팔리아멘트", aliases: ["팔리아멘트", "파리아멘트", "PARLIAMENT"] },
  BOHEM: { spokenBrand: "보헴", aliases: ["보헴", "보햄", "BOHEM"] },
  Raison: { spokenBrand: "레종", aliases: ["레종", "Raison", "RAISON"] },
  CAMEL: { spokenBrand: "카멜", aliases: ["카멜", "CAMEL"] },
  "THE ONE": { spokenBrand: "더원", aliases: ["더원", "THE ONE"] },
  THIS: { spokenBrand: "디스", aliases: ["디스", "THIS"] },
  TIME: { spokenBrand: "타임", aliases: ["타임", "TIME"] },
  simple: { spokenBrand: "심플", aliases: ["심플", "simple", "SIMPLE"] },
  AFRICA: { spokenBrand: "아프리카", aliases: ["아프리카", "AFRICA"] },
  VUSE: { spokenBrand: "뷰즈", aliases: ["뷰즈", "VUSE"] },
  evo: { spokenBrand: "에보", aliases: ["에보", "evo", "EVO"] },
  EVO: { spokenBrand: "에보", aliases: ["에보", "evo", "EVO"] },
  Fiit: { spokenBrand: "핏", aliases: ["핏", "Fiit", "FIIT"] },
  AIM: { spokenBrand: "에임", aliases: ["에임", "AIM"] },
  GRANULAR: { spokenBrand: "에임", aliases: ["에임", "GRANULAR"] },
  "VAPOR STICK": { spokenBrand: "에임", aliases: ["에임", "VAPOR STICK"] },
  HYBRID: { spokenBrand: "하이브리드", aliases: ["하이브리드", "HYBRID"] },
  RAIIM: { spokenBrand: "레임", aliases: ["레임", "RAIIM"] },
  HOGSHEAD: { spokenBrand: "호그스헤드", aliases: ["호그스헤드", "HOGSHEAD"] },
  LILAC: { spokenBrand: "라일락", aliases: ["라일락", "LILAC"] },
  HALLASAN: { spokenBrand: "한라산", aliases: ["한라산", "HALLASAN"] },
  Cloud9: { spokenBrand: "클라우드9", aliases: ["클라우드9", "Cloud9"] },
  ionia: { spokenBrand: "아이오니아", aliases: ["아이오니아", "ionia", "IONIA"] },
  SIGNATURE: { spokenBrand: "시그니처", aliases: ["시그니처", "SIGNATURE"] },
  "ICE BOLT": { spokenBrand: "아이스 볼트", aliases: ["아이스 볼트", "ICE BOLT"] },
  SEASONS: { spokenBrand: "시즌", aliases: ["시즌", "SEASONS"] },
};

const orderTemplates = [
  { key: "basic", text: "{fullName} 주세요." },
  { key: "one", text: "{fullName} 하나 주세요." },
  { key: "pack", text: "{fullName} 한 갑 주세요." },
  { key: "polite", text: "{fullName}로 주세요." },
  { key: "stock", text: "{fullName} 있나요?" },
];

function normalizeOrderKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[._\-()\[\],]/g, "")
    .trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getBrandInfo(brandRaw) {
  const key = String(brandRaw ?? "").trim();

  return brandSpeakMap[key] ?? {
    spokenBrand: key,
    aliases: key ? [key] : [],
  };
}

function stripBrandFromProductName(nameRaw, brandInfo) {
  let coreName = String(nameRaw ?? "").trim();

  const aliases = [
    brandInfo.spokenBrand,
    ...(brandInfo.aliases ?? []),
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const alias of aliases) {
    const direct = new RegExp("^\\s*" + escapeRegExp(alias) + "\\s*", "i");

    if (direct.test(coreName)) {
      coreName = coreName.replace(direct, "").trim();
      break;
    }
  }

  return coreName || String(nameRaw ?? "").trim();
}

function isOrderableProduct(product) {
  const name = String(product?.name ?? "").trim();

  if (!product) return false;
  if (product.empty || product.missing) return false;
  if (!name) return false;
  if (name === "상품명" || name === "담배") return false;
  if (name.startsWith("빈")) return false;

  return true;
}

function normalizeProductForOrder(product) {
  const brandRaw = String(product?.brand ?? "").trim();
  const nameRaw = String(product?.name ?? "").trim();
  const brandInfo = getBrandInfo(brandRaw);

  const coreName = stripBrandFromProductName(nameRaw, brandInfo);
  const fullName = [brandInfo.spokenBrand, coreName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    brandRaw,
    spokenBrand: brandInfo.spokenBrand,
    brandAliases: brandInfo.aliases,
    nameRaw,
    coreName,
    fullName: fullName || nameRaw,
  };
}

function fillOrderTemplate(template, product) {
  return String(template)
    .replaceAll("{brand}", product.spokenBrand)
    .replaceAll("{coreName}", product.coreName)
    .replaceAll("{fullName}", product.fullName)
    .replace(/\s+/g, " ")
    .trim();
}

function buildTemplateOrders(productMap) {
  const groups = new Map();

  for (const [slotId, product] of Object.entries(productMap ?? {})) {
    if (!isOrderableProduct(product)) continue;

    const normalized = normalizeProductForOrder(product);

    const productKey = [
      normalized.spokenBrand,
      normalized.coreName,
      product.price ?? "",
      product.cartridge ? "cartridge" : "normal",
    ]
      .map(normalizeOrderKey)
      .join("|");

    if (!groups.has(productKey)) {
      groups.set(productKey, {
        productKey,
        answerIds: [],
        brandRaw: normalized.brandRaw,
        spokenBrand: normalized.spokenBrand,
        brandAliases: normalized.brandAliases,
        nameRawExamples: [],
        coreName: normalized.coreName,
        fullName: normalized.fullName,
        price: product.price ?? "",
        cartridge: Boolean(product.cartridge),
      });
    }

    const group = groups.get(productKey);
    group.answerIds.push(slotId);

    if (!group.nameRawExamples.includes(normalized.nameRaw)) {
      group.nameRawExamples.push(normalized.nameRaw);
    }
  }

  const products = Array.from(groups.values())
    .map((product) => ({
      ...product,
      answerIds: Array.from(new Set(product.answerIds)).sort((a, b) =>
        a.localeCompare(b, "ko-KR", { numeric: true })
      ),
    }))
    .filter((product) => product.fullName && product.answerIds.length);

  for (let i = products.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [products[i], products[j]] = [products[j], products[i]];
  }

  return products.map((product, index) => {
    const template = orderTemplates[
      Math.floor(Math.random() * orderTemplates.length)
    ] ?? orderTemplates[0];

    const text = fillOrderTemplate(template.text, product);

    return {
      id: "product-random-" + String(index + 1).padStart(4, "0"),
      text,
      answerIds: product.answerIds,
      productKey: product.productKey,
      difficulty: "easy",
      source: "product-random-template",
      templateKey: template.key,
      displayName: product.fullName,
      spokenBrand: product.spokenBrand,
      coreName: product.coreName,
    };
  });
}

// template order generator end


const shelfData = {
  id: "B-L",
  name: "중앙 검정 진열대 왼쪽 칸",
  sections: [
    {
      id: "B-L-top",
      name: "상단 전자담배 파트",
      frame: "green",
      rows: [6, 6, 6, 6, 6],
      packType: "device",
    },
    {
      id: "B-L-bottom",
      name: "하단 일반담배 파트",
      frame: "purple",
      rows: [9, 9, 9, 9],
      packType: "cigarette",
    },
  ],
};

const shelfDataRight = {
  id: "B-R",
  name: "중앙 검정 진열대 오른쪽 칸",
  sections: [
    {
      id: "B-R-top",
      name: "상단 전자담배 파트",
      frame: "green",
      rows: [6, 6, 6, 6, 6],
      packType: "device",
    },
    {
      id: "B-R-bottom",
      name: "하단 일반담배 파트",
      frame: "purple",
      rows: [9, 9, 9, 9],
      packType: "cigarette",
    },
  ],
};


const shelfDataC0 = {
  id: "C0",
  name: "B-R 오른쪽 얇은 작은 진열대",
  sections: [
    {
      id: "C0-main",
      name: "일반담배 7곽",
      frame: "thin",
      rows: [1, 1, 1, 1, 1, 1, 1],
      packType: "cigarette",
    },
  ],
};

const shelfDataC = {
  id: "C",
  name: "오른쪽 흰색/초록 테두리 진열대",
  sections: [
    {
      id: "C-top-general",
      name: "상단 일반담배 파트",
      frame: "green",
      rows: [4],
      packType: "cigarette",
    },
    {
      id: "C-device",
      name: "중단 전자담배 파트",
      frame: "green",
      rows: [4, 4],
      packType: "device",
    },
    {
      id: "C-bottom-general",
      name: "하단 일반담배 파트",
      frame: "green",
      rows: [4, 4, 4, 4],
      packType: "cigarette",
    },
  ],
};

const shelfDataD = {
  id: "D",
  name: "맨 오른쪽 흰색/빨강 테두리 진열대",
  sections: [
    {
      id: "D-device",
      name: "상단 전자담배 파트",
      frame: "red",
      rows: [3, 3, 3],
      packType: "device",
    },
    {
      id: "D-bottom-general",
      name: "하단 일반담배 파트",
      frame: "red",
      rows: [4, 4, 4, 4],
      packType: "cigarette",
    },
  ],
};

const shelfDataA = {
  id: "A",
  name: "맨 왼쪽 검정 테두리 진열대",
  sections: [
    {
      id: "A-top-general",
      name: "상단 일반담배 파트",
      frame: "black",
      rows: [5, 5],
      packType: "cigarette",
    },
    {
      id: "A-bottom-general",
      name: "하단 일반담배 파트",
      frame: "black",
      rows: [4, 4, 4],
      packType: "cigarette",
    },
  ],
};

const shelfDataE = {
  id: "E",
  name: "제일 왼쪽 독립 진열대",
  sections: [
    {
      id: "E-device",
      name: "상단 전자담배 파트",
      frame: "black",
      rows: [3, 3, 3, 3, 3],
      packType: "device",
    },
    {
      id: "E-bottom-general",
      name: "하단 일반담배 파트",
      frame: "black",
      rows: [5, 5, 5, 5],
      packType: "cigarette",
    },
  ],
};







const toneOptions = [
  "empty", "white", "black", "gray", "silver", "gold", "brown",
  "blue", "sky", "cyan", "mint", "green", "lime", "yellow",
  "orange", "red", "pink", "purple", "violet", "navy", "bamboo",

  "fiit-sparky", "fiit-icist", "fiit-coolshot", "fiit-change",
  "fiit-change-q", "fiit-change-up",

  "aim-rush", "aim-icenow", "aim-twice", "aim-mango",
  "hybrid-cart", "hybrid-cart-plus",

  "aim3-rush", "aim3-icenow", "aim3-twice", "aim3-mango",
  "aim3-icepeak", "aim3-rimo",

  "aim4-blooming", "aim4-tempgreen", "empty-holder",
  "raim-regular", "raim-ice",

  "miix-purple-some",
  "miix-red-some",
  "miix-ice",
  "miix-ice-tea",
  "miix-ice-fit",
  "miix-ice-unknown",

  "miix-mix",
  "miix-bluesome",
  "miix-ice-moa",

  "miix-r3-purple-some",
  "miix-r3-red-some",
  "miix-r3-ice",
  "miix-r3-mix",
  "miix-r3-bluesome",
  "miix-r3-ice-moa",

  "himalaya-teal",
  "hogshead-6",
  "hogshead-10",
  "ionia-coral",
  "signature-brown",


  "esse-change-w",
  "esse-change-up-br",
  "esse-change-bing-br",
  "esse-change-one-br",
  "esse-change-4-br",
  "esse-change-frozen-br",
  "esse-himalaya-1mg-br",
  "esse-himalaya-winter-br",
  "esse-change-shootingstar-br",

  "esse-noir-br",
  "esse-change-sun-br",
  "bohem-cigar-master-br",
  "bohem-cigar-mini-jazz-br",
  "bohem-cigar-no6-br",
  "bohem-cigar-no3-br",
  "bohem-cigar-no1-br",
  "bohem-cigar-mini5-br",
  "bohem-cigar-mini1-br",

  "bohem-cigar-icefit-br",
  "bohem-slimfit-brown-br",
  "bohem-cubana-shot-br",
  "bohem-cubana-double-br",
  "bohem-cigar-libre-br",
  "bohem-cigar-caribe-br",
  "theone-blue-br",
  "theone-orange-br",
  "theone-white-br",


  "bohem-pipe-scotch-w-br",
  "theone-change-w-br",
  "this-original-br",
  "this-plus-br",
  "time-mid-br",
  "simple-classic-br",
  "simple-ace1-br",
  "lilac-br",
  "hallasan-br",

  "c0-mevius-tropical-mix",

  "c0-mevius-lbs-purple",

  "c0-mevius-lbs-yellow",

  "c0-mevius-original",

  "c0-mevius-wind-blue",

  "c0-mevius-estyle6",

  "c0-mevius-estyle3",

  "c-sky-beach",
  "c-spark-5",
  "c-lbs-luxter",

  "c-evo-amber",
  "c-evo-arctic",
  "c-evo-beige-option",
  "c-evo-green-option",
  "c-evo-jade",
  "c-evo-magenta",
  "c-evo-pink-option",
  "c-evo-purple-option",

  "c-yellow-3",
  "c-yellow-1",
  "c-citro-wave",
  "c-ice-fizz",

  "c-sky-blue-longs",
  "c-sky-blue",
  "c-sky-blue-2",
  "c-mix-green",

  "c-wind-blue",
  "c-one",
  "c-ice-storm",
  "c-ice-frost",

  "c-ice-berry",
  "c-camel-paradise",
  "c-camel-filter-8",
  "c-camel-filter-5",

  "d-terea-siwon-pearl",
  "d-terea-twilight-pearl",
  "d-terea-riviera-pearl",

  "d-terea-blue",
  "d-terea-black-green",
  "d-terea-black-purple",

  "d-sentia-gold",
  "d-sentia-silver",
  "d-sentia-dark-green",

  "d-marlboro-red",
  "d-marlboro-medium",
  "d-marlboro-gold",
  "d-terea-black-ruby",

  "d-marlboro-vista-summer",
  "d-marlboro-vista",
  "d-marlboro-vista-garden",
  "d-marlboro-vista-black",

  "d-parliament-hybrid-5",
  "d-parliament-hybrid-1",
  "d-marlboro-hybrid-5",
  "d-marlboro-hybrid-1",

  "d-parliament-aqua-5",
  "d-parliament-aqua-3",
  "d-parliament-aqua-1",
  "d-marlboro-ice-blast",

  "a-neo-island-click",
  "a-neo-blush-click",
  "a-neo-purple-boost",
  "a-neo-shine-boost",
  "a-neo-boost",

  "a-neo-sunkiss-cool",
  "a-neo-dark-tobacco",
  "a-neo-tobacco-switch",
  "a-neo-fresco",

  "a-dunhill-6mg",
  "a-dunhill-3mg",
  "a-dunhill-1mg",
  "a-dunhill-frost",

  "a-dunhill-london",
  "a-dunhill-newyork",
  "a-dunhill-paris",
  "a-dunhill-mellow-crush",

  "a-dunhill-finecut-switch",
  "a-dunhill-finecut-1mg",
  "a-dunhill-finecut-ultra",
  "a-dunhill-finecut-frost",

  "e-sentia-jester-red",
  "e-terea-teak",

  "e-terea-starling-pearl",
  "e-terea-arbor-pearl",
  "e-terea-russet",

  "e-terea-silver",
  "e-terea-green",
  "e-terea-amber",

  "e-terea-green-zing",
  "e-terea-yugen",
  "e-terea-summer-wave",

  "e-terea-oasis-pearl",
  "e-terea-sun-pearl",
  "e-terea-purple-wave",

  "e-neo-purple-boost-bottom",
  "e-vuse-purple-fresh-6ml",
  "e-vuse-tropical-mix",
  "e-vuse-ruby-spark",
  "e-neo-rainbow-boost",


  "e-kent-white1",
  "e-kent-switch1",
  "e-kent-purple1",
  "e-kent-05mg",
  "e-dunhill-finecut-switch-one",

  "e-marlboro-white8",
  "e-dunhill-switch-6mg",
  "e-dunhill-switch-one",
  "e-hyper-tropical-blast",
  "e-hyper-pink-blast",

  "e-neo-tropical-boost-row4",
  "e-neo-juicy-boost",
  "e-neo-borabora-click",
  "e-neo-island-click-row4",
];

const labelOptions = [
  "black", "purple", "blue", "sky", "green", "gold", "red", "neo", "white", "empty",
  "fit-blue", "aim-purple", "hybrid-black", "hybrid-red", "raim-purple",

  "miix-black",



  "mint-tag",
  "white-tag",
  "sky-tag",
  "brown-tag",


  "br-bottom-blue",

  "br-bottom-black",
  "br-bottom-brown",
  "br-bottom-red",




  "c0-orange",

  "c0-purple",

  "c0-yellow",

  "c0-navy",

  "c0-blue",

  "c0-estyle-blue",


  "c-yellow-orange",
  "c-green",
  "c-coral",

  "c-evo-orange",
  "c-evo-blue",
  "c-evo-olive",
  "c-evo-teal",
  "c-evo-green",
  "c-evo-magenta",
  "c-evo-pink",
  "c-evo-purple",

  "c-lbs-yellow",
  "c-lbs-green",
  "c-lbs-orange",

  "c-sky-blue-label",
  "c-mix-green-label",

  "c-wind-blue-label",
  "c-one-label",
  "c-ice-blue-label",

  "c-camel-red",
  "c-camel-gold",
  "c-camel-blue",

  "d-terea-green",
  "d-terea-purple",

  "d-terea-blue",

  "d-sentia-gold",
  "d-sentia-silver",
  "d-sentia-dark-green",

  "d-marlboro-blue",
  "d-terea-sky",

  "d-vista-blue",
  "d-vista-green",

  "d-hybrid-blue",

  "d-aqua-blue",
  "d-ice-blast-blue",

  "a-neo-orange",
  "a-neo-pink",
  "a-neo-purple",
  "a-neo-green",
  "a-neo-deep-green",

  "a-neo-red",
  "a-neo-brown",
  "a-neo-sky",

  "a-dunhill-black",
  "a-dunhill-gold",
  "a-dunhill-teal",

  "a-editions-green",
  "a-editions-gold",
  "a-editions-pink",
  "a-dunhill-green",

  "a-finecut-black",
  "a-finecut-gray",
  "a-finecut-brown",
  "a-finecut-teal",

  "e-sentia-red",
  "e-terea-brown",

  "e-terea-pink",
  "e-terea-mauve",
  "e-terea-purple",

  "e-terea-silver-label",
  "e-terea-green-label",
  "e-terea-amber-label",

  "e-terea-cyan",
  "e-terea-blue",
  "e-terea-summer-blue",

  "e-terea-oasis-pink",
  "e-terea-sun-pink",
  "e-terea-wave-blue",

  "e-bottom-purple",
  "e-bottom-vuse-purple",
  "e-bottom-vuse-gold",
  "e-bottom-vuse-red",
  "e-bottom-rainbow-green",


  "e-kent-silver",
  "e-kent-blue",
  "e-kent-purple",
  "e-kent-gold",
  "e-finecut-blue",

  "e-white-green",
  "e-dunhill-switch-blue",
  "e-hyper-orange",
  "e-hyper-pink",

  "e-row4-tropical",
  "e-row4-juicy",
  "e-row4-borabora",
  "e-row4-island",
];

const initialProducts = {
  "B-L-T-R5-C6": { brand: "RAIIM", name: "레임 벨벳", tone: "raim-velvet", label: "raim-purple", price: "4,500" },
  "B-L-T-R5-C5": { brand: "RAIIM", name: "레임 아이스 미드", tone: "raim-ice-mid", label: "raim-purple", price: "4,500" },
  "B-L-T-R5-C4": { brand: "", name: "에임 어센스", tone: "empty-holder", label: "aim-purple", price: "4,800", missing: true },
  "B-L-T-R5-C3": { brand: "", name: "에임 릴믹스", tone: "empty-holder", label: "aim-purple", price: "4,800", missing: true },
  "B-L-T-R5-C2": { brand: "GRANULAR", name: "에임 베이스", tone: "aim5-base", label: "aim-purple", price: "4,800" },
  "B-L-T-R5-C1": { brand: "AIM", name: "에임 블루밍", tone: "aim5-blooming", label: "aim-purple", price: "4,800" },
  "B-L-T-R4-C6": { brand: "RAIIM", name: "레임 아이스", tone: "raim-ice", label: "raim-purple", price: "4,500" },
  "B-L-T-R4-C5": { brand: "RAIIM", name: "레임 레귤러", tone: "raim-regular", label: "raim-purple", price: "4,500" },
  "B-L-T-R4-C4": { brand: "", name: "에임 어센스", tone: "empty-holder", label: "aim-purple", price: "4,800", missing: true },
  "B-L-T-R4-C3": { brand: "", name: "에임 릴리스", tone: "empty-holder", label: "aim-purple", price: "4,800", missing: true },
  "B-L-T-R4-C2": { brand: "AIM", name: "에임 ?", tone: "aim4-tempgreen", label: "aim-purple", price: "4,800" },
  "B-L-T-R4-C1": { brand: "AIM", name: "에임 블루밍", tone: "aim4-blooming", label: "aim-purple", price: "4,800" },
  "B-L-T-R3-C6": { brand: "AIM", name: "에임 리모", tone: "aim3-rimo", label: "aim-purple", price: "4,800" },
  "B-L-T-R3-C5": { brand: "AIM", name: "에임 아이스 피크", tone: "aim3-icepeak", label: "aim-purple", price: "4,800" },
  "B-L-T-R3-C4": { brand: "VAPOR STICK", name: "에임 망고", tone: "aim3-mango", label: "aim-purple", price: "4,800" },
  "B-L-T-R3-C3": { brand: "AIM", name: "에임 트와이스", tone: "aim3-twice", label: "aim-purple", price: "4,800" },
  "B-L-T-R3-C2": { brand: "AIM", name: "에임 아이스노우", tone: "aim3-icenow", label: "aim-purple", price: "4,800" },
  "B-L-T-R3-C1": { brand: "GRANULAR", name: "에임 어썸 러쉬", tone: "aim3-rush", label: "aim-purple", price: "4,800" },
  "B-L-T-R1-C1": { brand: "Fiit", name: "핏 스파키", tone: "fiit-sparky", label: "fit-blue", price: "4,300" },
  "B-L-T-R1-C2": { brand: "Fiit", name: "핏 아이시스트", tone: "fiit-icist", label: "fit-blue", price: "4,300" },
  "B-L-T-R1-C3": { brand: "Fiit", name: "핏 쿨 샷", tone: "fiit-coolshot", label: "fit-blue", price: "4,300" },
  "B-L-T-R1-C4": { brand: "Fiit", name: "핏 체인지", tone: "fiit-change", label: "fit-blue", price: "4,300" },
  "B-L-T-R1-C5": { brand: "Fiit", name: "핏 체인지 큐", tone: "fiit-change-q", label: "fit-blue", price: "4,300" },
  "B-L-T-R1-C6": { brand: "Fiit", name: "핏 체인지 업", tone: "fiit-change-up", label: "fit-blue", price: "4,300" },

  "B-L-T-R2-C1": { brand: "GRANULAR", name: "에임 어썸 러쉬", tone: "aim-rush", label: "aim-purple", price: "4,800" },
  "B-L-T-R2-C2": { brand: "GRANULAR", name: "에임 아이스노우", tone: "aim-icenow", label: "aim-purple", price: "4,800" },
  "B-L-T-R2-C3": { brand: "AIM", name: "에임 트와이스", tone: "aim-twice", label: "aim-purple", price: "4,800" },
  "B-L-T-R2-C4": { brand: "GRANULAR", name: "에임 망고", tone: "aim-mango", label: "aim-purple", price: "4,800" },
  "B-L-T-R2-C5": { brand: "HYBRID", name: "하이브리드 전용 카트리지", tone: "hybrid-cart", label: "hybrid-black", price: "600", cartridge: true },
  "B-L-T-R2-C6": { brand: "HYBRID", name: "하이브리드 전용 카트리지 플러스", tone: "hybrid-cart-plus", label: "hybrid-red", price: "600", cartridge: true },

  "B-L-B-R1-C1": { brand: "ESSE", name: "에쎄 로열팰리스", tone: "esse-royal-palace", label: "bottom-black", price: "10,000" },
  "B-L-B-R1-C2": { brand: "ESSE", name: "에쎄 골든리프", tone: "esse-golden-leaf", label: "bottom-black", price: "6,000" },
  "B-L-B-R1-C3": { brand: "ESSE", name: "에쎄 골든리프 1", tone: "esse-golden-leaf-1", label: "bottom-black", price: "6,000" },
  "B-L-B-R1-C4": { brand: "ESSE", name: "에쎄 골든리프 0.5", tone: "esse-golden-leaf-05", label: "bottom-black", price: "6,000" },
  "B-L-B-R1-C5": { brand: "ESSE", name: "에쎄 스페셜골드", tone: "esse-special-gold", label: "bottom-black", price: "5,500" },
  "B-L-B-R1-C6": { brand: "ESSE", name: "에쎄 스페셜골드 1", tone: "esse-special-gold-1", label: "bottom-black", price: "5,500" },
  "B-L-B-R1-C7": { brand: "ESSE", name: "에쎄 스페셜골드 0.5", tone: "esse-special-gold-05", label: "bottom-black", price: "5,500" },
  "B-L-B-R1-C8": { brand: "Cloud9", name: "클라우드9", tone: "cloud9", label: "cloud-black", price: "5,000" },
  "B-L-B-R1-C9": { brand: "Cloud9", name: "클라우드9 1", tone: "cloud9-1", label: "cloud-black", price: "5,000" },

  "B-L-B-R2-C1": { brand: "ESSE", name: "에쎄 수", tone: "esse-su", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C2": { brand: "ESSE", name: "에쎄 수 0.5", tone: "esse-su-05", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C3": { brand: "ESSE", name: "에쎄 수 0.1", tone: "esse-su-01", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C4": { brand: "ESSE", name: "에쎄 아이스1", tone: "esse-ice1", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C5": { brand: "ESSE", name: "에쎄 프라임", tone: "esse-prime", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C6": { brand: "ESSE", name: "에쎄 원", tone: "esse-one", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C7": { brand: "ESSE", name: "에쎄 이츠 딥브라운", tone: "esse-its-deepbrown", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C8": { brand: "ESSE", name: "에쎄 프리임", tone: "esse-premium-blue", label: "bottom-blue", price: "4,500" },
  "B-L-B-R2-C9": { brand: "ESSE", name: "에쎄 센스1", tone: "esse-sense1", label: "bottom-blue", price: "4,800" },

  "B-L-B-R3-C1": { brand: "Raison", name: "레종 프렌치 블랙", tone: "raison-french-black", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C2": { brand: "Raison", name: "레종 프렌치 요고", tone: "raison-french-yogo", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C3": { brand: "Raison", name: "레종 프렌치 더블", tone: "raison-french-double", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C4": { brand: "Raison", name: "레종 프렌치 썸", tone: "raison-french-some", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C5": { brand: "Raison", name: "레종 블랙", tone: "raison-black", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C6": { brand: "Raison", name: "레종 블루", tone: "raison-blue", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C7": { brand: "Raison", name: "레종 아이오니아 핑크", tone: "raison-ionia-pink", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C8": { brand: "Raison", name: "레종 아이오니아 블루", tone: "raison-ionia-blue", label: "bottom-blue", price: "4,500" },
  "B-L-B-R3-C9": { brand: "Raison", name: "레종 아이오니아 그린", tone: "raison-ionia-green", label: "bottom-blue", price: "4,500" },

  "B-L-B-R4-C1": { brand: "AFRICA", name: "아프리카 몰라", tone: "africa-mola", label: "bottom-black", price: "4,500" },
  "B-L-B-R4-C2": { brand: "AFRICA", name: "아프리카 룰라", tone: "africa-rula", label: "bottom-black", price: "4,500" },
  "B-L-B-R4-C3": { brand: "AFRICA", name: "아프리카 아이스잭", tone: "africa-icejack", label: "bottom-black", price: "4,500" },
  "B-L-B-R4-C4": { brand: "ICE BOLT", name: "아이스 볼트 GT", tone: "ice-bolt-gt", label: "bottom-black", price: "4,500" },
  "B-L-B-R4-C5": { brand: "ESSE", name: "에쎄 엣지 1", tone: "esse-edge1", label: "bottom-black", price: "4,500" },
  "B-L-B-R4-C6": { brand: "Raison", name: "블루휘바", tone: "blue-hwiba", label: "bottom-blue", price: "4,500" },
  "B-L-B-R4-C7": { brand: "SEASONS", name: "시즌", tone: "seasons", label: "bottom-blue", price: "4,500" },
  "B-L-B-R4-C8": { brand: "ESSE", name: "에쎄 체인지 린", tone: "esse-change-linn", label: "bottom-black", price: "4,500" },
  "B-L-B-R4-C9": { brand: "ESSE", name: "에쎄 체인지 그램", tone: "esse-change-gram", label: "bottom-black", price: "4,500" },
};

const brRow2Products = {
  "B-R-T-R2-C1": { brand: "MIIX", name: "믹스 퍼플썸", tone: "miix-purple-some", label: "miix-black", price: "4,500" },
  "B-R-T-R2-C2": { brand: "MIIX", name: "믹스 레드썸", tone: "miix-red-some", label: "miix-black", price: "4,500" },
  "B-R-T-R2-C3": { brand: "MIIX", name: "믹스 아이스", tone: "miix-ice", label: "miix-black", price: "4,500" },
  "B-R-T-R2-C4": { brand: "MIIX", name: "믹스 아이스티", tone: "miix-ice-tea", label: "miix-black", price: "4,500" },
  "B-R-T-R2-C5": { brand: "MIIX", name: "믹스 아이스 핏", tone: "miix-ice-fit", label: "miix-black", price: "4,500" },
  "B-R-T-R2-C6": { brand: "MIIX", name: "믹스 아이스 ?", tone: "miix-ice-unknown", label: "miix-black", price: "4,500" },
};

const brRow3Products = {
  "B-R-T-R3-C1": { brand: "MIIX", name: "믹스 퍼플썸", tone: "miix-r3-purple-some", label: "miix-black", price: "4,500" },
  "B-R-T-R3-C2": { brand: "MIIX", name: "믹스 레드썸", tone: "miix-r3-red-some", label: "miix-black", price: "4,500" },
  "B-R-T-R3-C3": { brand: "MIIX", name: "믹스 아이스", tone: "miix-r3-ice", label: "miix-black", price: "4,500" },
  "B-R-T-R3-C4": { brand: "MIIX", name: "믹스 믹스", tone: "miix-r3-mix", label: "miix-black", price: "4,500" },
  "B-R-T-R3-C5": { brand: "MIIX", name: "믹스 블루썸", tone: "miix-r3-bluesome", label: "miix-black", price: "4,500" },
  "B-R-T-R3-C6": { brand: "MIIX", name: "믹스 아이스 모아", tone: "miix-r3-ice-moa", label: "miix-black", price: "4,500" },
};

const brTop45Products = {
  "B-R-T-R4-C1": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
  "B-R-T-R4-C2": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
  "B-R-T-R4-C3": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
  "B-R-T-R4-C4": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
  "B-R-T-R4-C5": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
  "B-R-T-R4-C6": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },

  "B-R-T-R5-C1": { brand: "ESSE", name: "히말라야 샤인", tone: "himalaya-teal", label: "mint-tag", price: "4,500" },
  "B-R-T-R5-C2": { brand: "ESSE", name: "히말라야 샤인", tone: "himalaya-teal", label: "mint-tag", price: "4,500" },
  "B-R-T-R5-C3": { brand: "HOGSHEAD", name: "호그스헤드 6mg", tone: "hogshead-6", label: "white-tag", price: "4,500" },
  "B-R-T-R5-C4": { brand: "HOGSHEAD", name: "호그스헤드 10mg", tone: "hogshead-10", label: "white-tag", price: "4,500" },
  "B-R-T-R5-C5": { brand: "ionia", name: "아이오니아", tone: "ionia-coral", label: "sky-tag", price: "4,500" },
  "B-R-T-R5-C6": { brand: "SIGNATURE", name: "시그니처", tone: "signature-brown", label: "brown-tag", price: "4,500" },
};


const brBottomRow1Products = {
  "B-R-B-R1-C1": { brand: "ESSE", name: "에쎄 체인지 W", tone: "esse-change-w", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C2": { brand: "ESSE", name: "에쎄 체인지 업", tone: "esse-change-up-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C3": { brand: "ESSE", name: "에쎄 체인지 빙", tone: "esse-change-bing-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C4": { brand: "ESSE", name: "에쎄 체인지", tone: "esse-change-one-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C5": { brand: "ESSE", name: "에쎄 체인지 4", tone: "esse-change-4-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C6": { brand: "ESSE", name: "에쎄 체인지 프로즌", tone: "esse-change-frozen-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C7": { brand: "ESSE", name: "에쎄 히말라야 1mg", tone: "esse-himalaya-1mg-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C8": { brand: "ESSE", name: "에쎄 히말라야 윈터 1mg", tone: "esse-himalaya-winter-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R1-C9": { brand: "ESSE", name: "에쎄 체인지 슈팅스타", tone: "esse-change-shootingstar-br", label: "br-bottom-blue", price: "4,500" },
};


const brBottomRow2Products = {
  "B-R-B-R2-C1": { brand: "ESSE", name: "에쎄 느와르", tone: "esse-noir-br", label: "br-bottom-black", price: "5,000" },
  "B-R-B-R2-C2": { brand: "ESSE", name: "에쎄 체인지 썬", tone: "esse-change-sun-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R2-C3": { brand: "BOHEM", name: "보헴 시가마스터", tone: "bohem-cigar-master-br", label: "br-bottom-brown", price: "7,000" },
  "B-R-B-R2-C4": { brand: "BOHEM", name: "보헴 시가 미니 재즈", tone: "bohem-cigar-mini-jazz-br", label: "br-bottom-brown", price: "10,000" },
  "B-R-B-R2-C5": { brand: "BOHEM", name: "보헴 시가 NO.6", tone: "bohem-cigar-no6-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R2-C6": { brand: "BOHEM", name: "보헴 시가 NO.3", tone: "bohem-cigar-no3-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R2-C7": { brand: "BOHEM", name: "보헴 시가 NO.1", tone: "bohem-cigar-no1-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R2-C8": { brand: "BOHEM", name: "보헴 시가미니5", tone: "bohem-cigar-mini5-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R2-C9": { brand: "BOHEM", name: "보헴 시가미니1", tone: "bohem-cigar-mini1-br", label: "br-bottom-red", price: "4,500" },
};


const brBottomRow3Products = {
  "B-R-B-R3-C1": { brand: "BOHEM", name: "보헴 시가 아이스핏", tone: "bohem-cigar-icefit-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R3-C2": { brand: "BOHEM", name: "보헴 슬림핏 브라운", tone: "bohem-slimfit-brown-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R3-C3": { brand: "BOHEM", name: "보헴 쿠바나 샷", tone: "bohem-cubana-shot-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R3-C4": { brand: "BOHEM", name: "보헴 쿠바나 더블", tone: "bohem-cubana-double-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R3-C5": { brand: "BOHEM", name: "보헴 시가 리브레", tone: "bohem-cigar-libre-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R3-C6": { brand: "BOHEM", name: "보헴 시가 카리브", tone: "bohem-cigar-caribe-br", label: "br-bottom-red", price: "4,500" },
  "B-R-B-R3-C7": { brand: "THE ONE", name: "더원 블루", tone: "theone-blue-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R3-C8": { brand: "THE ONE", name: "더원 오렌지", tone: "theone-orange-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R3-C9": { brand: "THE ONE", name: "더원 화이트", tone: "theone-white-br", label: "br-bottom-blue", price: "4,500" },
};


const brBottomRow4Products = {
  "B-R-B-R4-C1": { brand: "BOHEM", name: "보헴 파이프스코치 W", tone: "bohem-pipe-scotch-w-br", label: "br-bottom-red", price: "5,000" },
  "B-R-B-R4-C2": { brand: "THE ONE", name: "더원 체인지 W", tone: "theone-change-w-br", label: "br-bottom-blue", price: "4,500" },
  "B-R-B-R4-C3": { brand: "THIS", name: "디스", tone: "this-original-br", label: "br-bottom-black", price: "4,000" },
  "B-R-B-R4-C4": { brand: "THIS", name: "디스 플러스", tone: "this-plus-br", label: "br-bottom-black", price: "4,100" },
  "B-R-B-R4-C5": { brand: "TIME", name: "타임 미드", tone: "time-mid-br", label: "br-bottom-black", price: "4,500" },
  "B-R-B-R4-C6": { brand: "simple", name: "심플 클래식", tone: "simple-classic-br", label: "br-bottom-black", price: "4,500" },
  "B-R-B-R4-C7": { brand: "simple", name: "심플 에이스 1", tone: "simple-ace1-br", label: "br-bottom-black", price: "4,500" },
  "B-R-B-R4-C8": { brand: "LILAC", name: "라일락", tone: "lilac-br", label: "br-bottom-black", price: "4,500" },
  "B-R-B-R4-C9": { brand: "HALLASAN", name: "한라산", tone: "hallasan-br", label: "br-bottom-black", price: "4,500" },
};



const c0Products = {
  "C0-T-R1-C1": { brand: "MEVIUS", name: "뫼비우스 트로피컬 믹스", tone: "c0-mevius-tropical-mix", label: "c0-orange", price: "4,500" },
  "C0-T-R2-C1": { brand: "MEVIUS", name: "메비우스 LBS 퍼플", tone: "c0-mevius-lbs-purple", label: "c0-purple", price: "4,500" },
  "C0-T-R3-C1": { brand: "MEVIUS", name: "뫼비우스 LBS 옐로우 수퍼슬림", tone: "c0-mevius-lbs-yellow", label: "c0-yellow", price: "4,500" },
  "C0-T-R4-C1": { brand: "MEVIUS", name: "뫼비우스 오리지널 8", tone: "c0-mevius-original", label: "c0-navy", price: "4,500" },
  "C0-T-R5-C1": { brand: "MEVIUS", name: "뫼비우스 윈드 블루", tone: "c0-mevius-wind-blue", label: "c0-blue", price: "4,500" },
  "C0-T-R6-C1": { brand: "MEVIUS", name: "뫼비우스 E-스타일 6", tone: "c0-mevius-estyle6", label: "c0-estyle-blue", price: "4,300" },
  "C0-T-R7-C1": { brand: "MEVIUS", name: "뫼비우스 E-스타일 3", tone: "c0-mevius-estyle3", label: "c0-estyle-blue", price: "4,300" },
};

const cTopRow1Products = {
  "C-T-R1-C1": { brand: "MEVIUS", name: "스카이 비치", tone: "c-sky-beach", label: "c-yellow-orange", price: "4,500" },
  "C-T-R1-C2": { brand: "MEVIUS", name: "스파크 5", tone: "c-spark-5", label: "c-green", price: "4,500" },
  "C-T-R1-C3": { brand: "MEVIUS", name: "LBS 럭스터", tone: "c-lbs-luxter", label: "c-coral", price: "4,500" },
  "C-T-R1-C4": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
};

const cDeviceProducts = {
  "C-E-R1-C1": { brand: "evo", name: "에보 엠버", tone: "c-evo-amber", label: "c-evo-orange", price: "4,500" },
  "C-E-R1-C2": { brand: "evo", name: "에보 아틱", tone: "c-evo-arctic", label: "c-evo-blue", price: "4,500" },
  "C-E-R1-C3": { brand: "evo", name: "에보베이즈옵션", tone: "c-evo-beige-option", label: "c-evo-olive", price: "4,500" },
  "C-E-R1-C4": { brand: "evo", name: "에보그린옵션", tone: "c-evo-green-option", label: "c-evo-teal", price: "4,500" },

  "C-E-R2-C1": { brand: "evo", name: "에보 제이드", tone: "c-evo-jade", label: "c-evo-green", price: "4,500" },
  "C-E-R2-C2": { brand: "evo", name: "에보 마젠타", tone: "c-evo-magenta", label: "c-evo-magenta", price: "4,500" },
  "C-E-R2-C3": { brand: "evo", name: "에보핑크옵션", tone: "c-evo-pink-option", label: "c-evo-pink", price: "4,500" },
  "C-E-R2-C4": { brand: "evo", name: "에보퍼플옵션", tone: "c-evo-purple-option", label: "c-evo-purple", price: "4,500" },
};

const cBottomRow1Products = {
  "C-B-R1-C1": { brand: "MEVIUS", name: "옐로우 3", tone: "c-yellow-3", label: "c-lbs-yellow", price: "4,500" },
  "C-B-R1-C2": { brand: "MEVIUS", name: "옐로우 1", tone: "c-yellow-1", label: "c-lbs-yellow", price: "4,500" },
  "C-B-R1-C3": { brand: "MEVIUS", name: "시트로 웨이브", tone: "c-citro-wave", label: "c-lbs-green", price: "4,600" },
  "C-B-R1-C4": { brand: "MEVIUS", name: "아이스 피즈", tone: "c-ice-fizz", label: "c-lbs-orange", price: "4,600" },
};

const cBottomRow2Products = {
  "C-B-R2-C1": { brand: "MEVIUS", name: "스카이 블루 롱스", tone: "c-sky-blue-longs", label: "c-sky-blue-label", price: "4,500" },
  "C-B-R2-C2": { brand: "MEVIUS", name: "스카이 블루", tone: "c-sky-blue", label: "c-sky-blue-label", price: "4,500" },
  "C-B-R2-C3": { brand: "MEVIUS", name: "스카이 블루", tone: "c-sky-blue-2", label: "c-sky-blue-label", price: "4,500" },
  "C-B-R2-C4": { brand: "MEVIUS", name: "믹스 그린", tone: "c-mix-green", label: "c-mix-green-label", price: "4,500" },
};

const cBottomRow3Products = {
  "C-B-R3-C1": { brand: "MEVIUS", name: "윈드블루", tone: "c-wind-blue", label: "c-wind-blue-label", price: "4,500" },
  "C-B-R3-C2": { brand: "MEVIUS", name: "원", tone: "c-one", label: "c-one-label", price: "4,500" },
  "C-B-R3-C3": { brand: "MEVIUS", name: "아이스 스톰", tone: "c-ice-storm", label: "c-ice-blue-label", price: "4,500" },
  "C-B-R3-C4": { brand: "MEVIUS", name: "아이스 프로스트", tone: "c-ice-frost", label: "c-ice-blue-label", price: "4,500" },
};

const cBottomRow4Products = {
  "C-B-R4-C1": { brand: "MEVIUS", name: "아이스 베리", tone: "c-ice-berry", label: "c-lbs-yellow", price: "4,500" },
  "C-B-R4-C2": { brand: "CAMEL", name: "카멜 파라다이스", tone: "c-camel-paradise", label: "c-camel-red", price: "4,300" },
  "C-B-R4-C3": { brand: "CAMEL", name: "카멜 필터 8", tone: "c-camel-filter-8", label: "c-camel-gold", price: "4,300" },
  "C-B-R4-C4": { brand: "CAMEL", name: "카멜 필터 5", tone: "c-camel-filter-5", label: "c-camel-blue", price: "4,300" },
};

const dTopRow1Products = {
  "D-T-R1-C1": { brand: "TEREA", name: "시원 펄", tone: "d-terea-siwon-pearl", label: "d-terea-green", price: "4,800" },
  "D-T-R1-C2": { brand: "TEREA", name: "트와일라잇 펄", tone: "d-terea-twilight-pearl", label: "d-terea-purple", price: "4,800" },
  "D-T-R1-C3": { brand: "TEREA", name: "리비에라 펄", tone: "d-terea-riviera-pearl", label: "d-terea-purple", price: "4,800" },
};

const dTopRow2Products = {
  "D-T-R2-C1": { brand: "TEREA", name: "블루", tone: "d-terea-blue", label: "d-terea-blue", price: "4,800" },
  "D-T-R2-C2": { brand: "TEREA", name: "블랙 그린", tone: "d-terea-black-green", label: "d-terea-green", price: "4,800" },
  "D-T-R2-C3": { brand: "TEREA", name: "블랙 퍼플", tone: "d-terea-black-purple", label: "d-terea-purple", price: "4,800" },
};

const dTopRow3Products = {
  "D-T-R3-C1": { brand: "SENTIA", name: "센티아 골드", brandLabel: "SENTIA", tone: "d-sentia-gold", label: "d-sentia-gold", price: "4,500" },
  "D-T-R3-C2": { brand: "SENTIA", name: "센티아 실버", brandLabel: "SENTIA", tone: "d-sentia-silver", label: "d-sentia-silver", price: "4,500" },
  "D-T-R3-C3": { brand: "SENTIA", name: "센티아 다크 그린", brandLabel: "SENTIA", tone: "d-sentia-dark-green", label: "d-sentia-dark-green", price: "4,500" },
};

const dBottomRow1Products = {
  "D-B-R1-C1": { brand: "Marlboro", name: "레드", tone: "d-marlboro-red", label: "d-marlboro-blue", price: "4,500" },
  "D-B-R1-C2": { brand: "Marlboro", name: "미디엄", tone: "d-marlboro-medium", label: "d-marlboro-blue", price: "4,500" },
  "D-B-R1-C3": { brand: "Marlboro", name: "골드", tone: "d-marlboro-gold", label: "d-marlboro-blue", price: "4,500" },
  "D-B-R1-C4": { brand: "TEREA", name: "블랙 루비", tone: "d-terea-black-ruby", label: "d-terea-sky", price: "4,800" },
};

const dBottomRow2Products = {
  "D-B-R2-C1": { brand: "Marlboro", name: "비스타 썸머", tone: "d-marlboro-vista-summer", label: "d-vista-blue", price: "4,500" },
  "D-B-R2-C2": { brand: "Marlboro", name: "비스타", tone: "d-marlboro-vista", label: "d-vista-blue", price: "4,500" },
  "D-B-R2-C3": { brand: "Marlboro", name: "비스타 가든", tone: "d-marlboro-vista-garden", label: "d-vista-green", price: "4,500" },
  "D-B-R2-C4": { brand: "Marlboro", name: "비스타 블랙", tone: "d-marlboro-vista-black", label: "d-vista-blue", price: "4,500" },
};

const dBottomRow3Products = {
  "D-B-R3-C1": { brand: "PARLIAMENT", name: "하이브리드 5", tone: "d-parliament-hybrid-5", label: "d-hybrid-blue", price: "4,500" },
  "D-B-R3-C2": { brand: "PARLIAMENT", name: "하이브리드", tone: "d-parliament-hybrid-1", label: "d-hybrid-blue", price: "4,500" },
  "D-B-R3-C3": { brand: "Marlboro", name: "하이브리드 5", tone: "d-marlboro-hybrid-5", label: "d-hybrid-blue", price: "4,500" },
  "D-B-R3-C4": { brand: "Marlboro", name: "말보로 하이브리드 1", tone: "d-marlboro-hybrid-1", label: "d-hybrid-blue", price: "4,500" },
};

const dBottomRow4Products = {
  "D-B-R4-C1": { brand: "PARLIAMENT", name: "아쿠아 5", tone: "d-parliament-aqua-5", label: "d-aqua-blue", price: "4,500" },
  "D-B-R4-C2": { brand: "PARLIAMENT", name: "아쿠아 3", tone: "d-parliament-aqua-3", label: "d-aqua-blue", price: "4,500" },
  "D-B-R4-C3": { brand: "PARLIAMENT", name: "아쿠아 1", tone: "d-parliament-aqua-1", label: "d-aqua-blue", price: "4,500" },
  "D-B-R4-C4": { brand: "Marlboro", name: "아이스 블라스트", tone: "d-marlboro-ice-blast", label: "d-ice-blast-blue", price: "4,500" },
};

const aTopRow1Products = {
  "A-T-R1-C1": { brand: "neo", name: "아일랜드 클릭", tone: "a-neo-island-click", label: "a-neo-orange", price: "4,800" },
  "A-T-R1-C2": { brand: "neo", name: "블러쉬 클릭", tone: "a-neo-blush-click", label: "a-neo-pink", price: "4,800" },
  "A-T-R1-C3": { brand: "neo", name: "퍼플부스트", tone: "a-neo-purple-boost", label: "a-neo-purple", price: "4,800" },
  "A-T-R1-C4": { brand: "neo", name: "샤인 부스트", tone: "a-neo-shine-boost", label: "a-neo-green", price: "4,800" },
  "A-T-R1-C5": { brand: "neo", name: "부스트", tone: "a-neo-boost", label: "a-neo-deep-green", price: "4,800" },
};

const aTopRow2Products = {
  "A-T-R2-C1": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
  "A-T-R2-C2": { brand: "neo", name: "썬키스 쿨", tone: "a-neo-sunkiss-cool", label: "a-neo-red", price: "4,800" },
  "A-T-R2-C3": { brand: "neo", name: "다크토바코", tone: "a-neo-dark-tobacco", label: "a-neo-brown", price: "4,800" },
  "A-T-R2-C4": { brand: "neo", name: "토바코스위치", tone: "a-neo-tobacco-switch", label: "a-neo-sky", price: "4,800" },
  "A-T-R2-C5": { brand: "neo", name: "프레스코", tone: "a-neo-fresco", label: "a-neo-sky", price: "4,800" },
};

const aBottomRow1Products = {
  "A-B-R1-C1": { brand: "DUNHILL", name: "던힐 6MG", tone: "a-dunhill-6mg", label: "a-dunhill-black", price: "4,500" },
  "A-B-R1-C2": { brand: "DUNHILL", name: "던힐 3MG", tone: "a-dunhill-3mg", label: "a-dunhill-gold", price: "4,500" },
  "A-B-R1-C3": { brand: "DUNHILL", name: "던힐 1MG", tone: "a-dunhill-1mg", label: "a-dunhill-black", price: "4,500" },
  "A-B-R1-C4": { brand: "DUNHILL", name: "던힐 프로스트", tone: "a-dunhill-frost", label: "a-dunhill-teal", price: "4,500" },
};

const aBottomRow2Products = {
  "A-B-R2-C1": { brand: "DUNHILL", name: "런던", tone: "a-dunhill-london", label: "a-editions-green", price: "4,500" },
  "A-B-R2-C2": { brand: "DUNHILL", name: "뉴욕", tone: "a-dunhill-newyork", label: "a-editions-gold", price: "4,500" },
  "A-B-R2-C3": { brand: "DUNHILL", name: "파리", tone: "a-dunhill-paris", label: "a-editions-pink", price: "4,500" },
  "A-B-R2-C4": { brand: "DUNHILL", name: "멜로우 크러쉬", tone: "a-dunhill-mellow-crush", label: "a-dunhill-green", price: "4,500" },
};

const aBottomRow3Products = {
  "A-B-R3-C1": { brand: "DUNHILL", name: "파인컷 스위치", tone: "a-dunhill-finecut-switch", label: "a-finecut-black", price: "4,500" },
  "A-B-R3-C2": { brand: "DUNHILL", name: "파인컷 1MG", tone: "a-dunhill-finecut-1mg", label: "a-finecut-gray", price: "4,500" },
  "A-B-R3-C3": { brand: "DUNHILL", name: "파인컷 울트라 0.1MG", tone: "a-dunhill-finecut-ultra", label: "a-finecut-brown", price: "4,500" },
  "A-B-R3-C4": { brand: "DUNHILL", name: "파인컷 프로스트 1MG", tone: "a-dunhill-finecut-frost", label: "a-finecut-teal", price: "4,500" },
};

const eTopRow1Products = {
  "E-T-R1-C1": { brand: "SENTIA", name: "센티아 제스터 레드", tone: "e-sentia-jester-red", label: "e-sentia-red", price: "4,500" },
  "E-T-R1-C2": { brand: "TEREA", name: "티크", tone: "e-terea-teak", label: "e-terea-brown", price: "4,800" },
  "E-T-R1-C3": { brand: "", name: "", tone: "empty-holder", label: "empty", price: "", empty: true, missing: true },
};

const eTopRow2Products = {
  "E-T-R2-C1": { brand: "TEREA", name: "스타링 펄", tone: "e-terea-starling-pearl", label: "e-terea-pink", price: "4,800" },
  "E-T-R2-C2": { brand: "TEREA", name: "아버 펄", tone: "e-terea-arbor-pearl", label: "e-terea-mauve", price: "4,800" },
  "E-T-R2-C3": { brand: "TEREA", name: "러셋", tone: "e-terea-russet", label: "e-terea-purple", price: "4,800" },
};

const eTopRow3Products = {
  "E-T-R3-C1": { brand: "TEREA", name: "실버", tone: "e-terea-silver", label: "e-terea-silver-label", price: "4,800" },
  "E-T-R3-C2": { brand: "TEREA", name: "그린", tone: "e-terea-green", label: "e-terea-green-label", price: "4,800" },
  "E-T-R3-C3": { brand: "TEREA", name: "앰버", tone: "e-terea-amber", label: "e-terea-amber-label", price: "4,800" },
};

const eTopRow4Products = {
  "E-T-R4-C1": { brand: "TEREA", name: "그린 징", tone: "e-terea-green-zing", label: "e-terea-cyan", price: "4,800" },
  "E-T-R4-C2": { brand: "TEREA", name: "유젠", tone: "e-terea-yugen", label: "e-terea-blue", price: "4,800" },
  "E-T-R4-C3": { brand: "TEREA", name: "썸머 웨이브", tone: "e-terea-summer-wave", label: "e-terea-summer-blue", price: "4,800" },
};

const eTopRow5Products = {
  "E-T-R5-C1": { brand: "TEREA", name: "오아시스 펄", tone: "e-terea-oasis-pearl", label: "e-terea-oasis-pink", price: "4,800" },
  "E-T-R5-C2": { brand: "TEREA", name: "썬 펄", tone: "e-terea-sun-pearl", label: "e-terea-sun-pink", price: "4,800" },
  "E-T-R5-C3": { brand: "TEREA", name: "퍼플 웨이브", tone: "e-terea-purple-wave", label: "e-terea-wave-blue", price: "4,800" },
};

const eBottomRow1Products = {
  "E-B-R1-C1": { brand: "neo", name: "퍼플 부스트", tone: "e-neo-purple-boost-bottom", label: "e-bottom-purple", price: "4,500" },
  "E-B-R1-C2": { brand: "VUSE", name: "퍼플 프레시 6ML", tone: "e-vuse-purple-fresh-6ml", label: "e-bottom-vuse-purple", price: "25,000" },
  "E-B-R1-C3": { brand: "VUSE", name: "트로피컬 믹스", tone: "e-vuse-tropical-mix", label: "e-bottom-vuse-gold", price: "10,000" },
  "E-B-R1-C4": { brand: "VUSE", name: "루비 스파크", tone: "e-vuse-ruby-spark", label: "e-bottom-vuse-red", price: "10,000" },
  "E-B-R1-C5": { brand: "neo", name: "레인보우 부스트", tone: "e-neo-rainbow-boost", label: "e-bottom-rainbow-green", price: "4,500" },
};

const eBottomRow2Products = {
  "E-B-R2-C1": { brand: "KENT", name: "켄트 화이트1", tone: "e-kent-white1", label: "e-kent-silver", price: "4,500" },
  "E-B-R2-C2": { brand: "KENT", name: "켄트 스위치1", tone: "e-kent-switch1", label: "e-kent-blue", price: "4,500" },
  "E-B-R2-C3": { brand: "KENT", name: "켄트 퍼플1", tone: "e-kent-purple1", label: "e-kent-purple", price: "4,500" },
  "E-B-R2-C4": { brand: "KENT", name: "켄트 0.5MG", tone: "e-kent-05mg", label: "e-kent-gold", price: "4,500" },
  "E-B-R2-C5": { brand: "DUNHILL", name: "파인컷 스위치 ONE", tone: "e-dunhill-finecut-switch-one", label: "e-finecut-blue", price: "4,500" },
};

const eBottomRow3Products = {
  "E-B-R3-C1": { brand: "Marlboro", name: "화이트 업", tone: "e-marlboro-white8", label: "e-white-green", price: "4,500" },
  "E-B-R3-C2": { brand: "DUNHILL", name: "던힐 스위치 6MG", tone: "e-dunhill-switch-6mg", label: "e-dunhill-switch-blue", price: "4,500" },
  "E-B-R3-C3": { brand: "DUNHILL", name: "던힐 스위치 ONE", tone: "e-dunhill-switch-one", label: "e-dunhill-switch-blue", price: "4,500" },
  "E-B-R3-C4": { brand: "HYPER", name: "트로피컬 블라스트", tone: "e-hyper-tropical-blast", label: "e-hyper-orange", price: "4,800" },
  "E-B-R3-C5": { brand: "HYPER", name: "핑크 블라스트", tone: "e-hyper-pink-blast", label: "e-hyper-pink", price: "4,800" },
};

const eBottomRow4Products = {
  "E-B-R4-C1": { brand: "neo", name: "트로피컬 부스트", tone: "e-neo-tropical-boost-row4", label: "e-row4-tropical", price: "4,800" },
  "E-B-R4-C2": { brand: "neo", name: "쥬시 부스트", tone: "e-neo-juicy-boost", label: "e-row4-juicy", price: "4,800" },
  "E-B-R4-C3": { brand: "neo", name: "보라보라 클릭", tone: "e-neo-borabora-click", label: "e-row4-borabora", price: "4,800" },
  "E-B-R4-C4": { brand: "neo", name: "아일랜드 클릭", tone: "e-neo-island-click-row4", label: "e-row4-island", price: "4,800" },
  "E-B-R4-C5": { brand: "neo", name: "아일랜드 클릭", tone: "e-neo-island-click-row4", label: "e-row4-island", price: "4,800" },
};

function makeSlotId(zoneId, sectionIndex, rowIndex, colIndex) {
  let sectionLabel;

  if (zoneId === "C") {
    sectionLabel = sectionIndex === 0 ? "T" : sectionIndex === 1 ? "E" : "B";
  } else {
    sectionLabel = sectionIndex === 0 ? "T" : "B";
  }

  return `${zoneId}-${sectionLabel}-R${rowIndex + 1}-C${colIndex + 1}`;
}

function getDefaultProduct(section) {
  return {
    brand: section.packType === "device" ? "BRAND" : "담배",
    name: "상품명",
    tone: "empty",
    label: section.packType === "device" ? "neo" : "black",
    price: "4,500",
    empty: true,
  };
}

function buildAllSlots() {
  const slots = [];

  shelfData.sections.forEach((section, sectionIndex) => {
    section.rows.forEach((count, rowIndex) => {
      Array.from({ length: count }).forEach((_, colIndex) => {
        const id = makeSlotId(shelfData.id, sectionIndex, rowIndex, colIndex);
        slots.push({ id, section, sectionIndex, rowIndex, colIndex });
      });
    });
  });

  return slots;
}

const allSlots = buildAllSlots();
const allSlotIds = allSlots.map((slot) => slot.id);

function createInitialProducts() {
  const base = {};
  for (const slot of allSlots) {
    base[slot.id] = {
      ...getDefaultProduct(slot.section),
      ...(initialProducts[slot.id] ?? {}),
    };
  }
  return base;
}


function buildEmptyShelfProducts(shelf) {
  const base = {};

  shelf.sections.forEach((section, sectionIndex) => {
    section.rows.forEach((count, rowIndex) => {
      Array.from({ length: count }).forEach((_, colIndex) => {
        const id = makeSlotId(shelf.id, sectionIndex, rowIndex, colIndex);

        base[id] = {
          brand: "",
          name: "",
          tone: "empty-holder",
          label: "empty",
          price: "",
          empty: true,
          missing: true,
        };
      });
    });
  });

  return base;
}

function getSectionForSlot(id) {
  if (id.startsWith("E-")) {
    return id.includes("-T-") ? shelfDataE.sections[0] : shelfDataE.sections[1];
  }

  if (id.startsWith("A-")) {
    return id.includes("-T-") ? shelfDataA.sections[0] : shelfDataA.sections[1];
  }

  if (id.startsWith("C0-")) return shelfDataC0.sections[0];

  if (id.startsWith("C-")) {
    if (id.includes("-T-")) return shelfDataC.sections[0];
    if (id.includes("-E-")) return shelfDataC.sections[1];
    return shelfDataC.sections[2];
  }

  if (id.startsWith("D-")) {
    return id.includes("-T-") ? shelfDataD.sections[0] : shelfDataD.sections[1];
  }

  const shelf =
    id.startsWith("B-R-") ? shelfDataRight :
    shelfData;

  return id.includes("-T-") ? shelf.sections[0] : shelf.sections[1];
}

function FitLabel({ text }) {
  const cellRef = useRef(null);
  const textRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const update = () => {
      const cell = cellRef.current;
      const label = textRef.current;
      if (!cell || !label) return;

      const available = Math.max(1, cell.clientWidth - 2);
      const needed = Math.max(1, label.scrollWidth);
      setScale(Math.max(0.42, Math.min(1, available / needed)));
    };

    update();

    const ro = new ResizeObserver(update);
    if (cellRef.current) ro.observe(cellRef.current);

    return () => ro.disconnect();
  }, [text]);

  return (
    <span className="rail-fit-cell" ref={cellRef}>
      <span className="rail-fit-text" ref={textRef} style={{ transform: `scaleX(${scale})` }}>
        {text}
      </span>
    </span>
  );
}

function Pack({ id, section, product, selected, onClick }) {
  return (
    <button
      className={[
        "pack",
        `tone-${product.tone}`,
        `label-${product.label}`,
        section.packType === "device" ? "pack-device" : "pack-cigarette",
        selected ? "selected" : "",
        product.empty ? "is-empty" : "",
        product.missing ? "is-missing" : "",
        product.cartridge ? "is-cartridge" : "",
      ].join(" ")}
      data-slot-id={id}
      onClick={() => onClick(id)}
      title={`${id} ${product.brand} ${product.name}`}
    >
      <div className="warning-strip">
        <span>경고</span>
      </div>

      <div className="pack-face">
        <div className="pack-brand">{product.brand}</div>
        <div className="pack-name">{product.name}</div>
      </div>

      <div className="pack-bottom">
        <span>{product.price}</span>
      </div>
    </button>
  );
}

function ShelfRow({ zoneId, section, sectionIndex, rowIndex, count, selectedId, onSelect, products }) {
  return (
    <div className="shelf-row">
      <div className="pack-grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
        {Array.from({ length: count }).map((_, colIndex) => {
          const id = makeSlotId(zoneId, sectionIndex, rowIndex, colIndex);
          const product = products[id];

          return (
            <div className={["slot", product.cartridge ? "is-cartridge-slot" : "", product.missing ? "is-missing-slot" : ""].join(" ")} key={id}>
              <Pack id={id} section={section} product={product} selected={selectedId === id} onClick={onSelect} />
              <button
                className={["price-rail", `label-${product.label}`, product.cartridge ? "is-cartridge-rail" : ""].join(" ")}
                data-slot-id={id}
                onClick={() => onSelect(id)}
                title={`${product.name} ${product.price}`}
              >
                <FitLabel text={product.name} />
                <b>{product.price}</b>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}




function PromoMergedShelfRow({ zoneId, section, sectionIndex, selectedId, onSelect, products }) {
  const cigaretteSection = { ...section, packType: "cigarette" };

  const ids = Array.from({ length: 6 }).map((_, colIndex) =>
    makeSlotId(zoneId, sectionIndex, 4, colIndex)
  );

  return (
    <div className="shelf-row promo-merged-row">
      <div className="promo-ad-card">
        <div className="promo-ad-badge">신제품</div>
        <div className="promo-ad-brand">에쎄</div>
        <div className="promo-ad-name">
          <span className="promo-ad-name-main">히말라야</span>
          <span className="promo-ad-name-accent">샤인</span>
        </div>
        <div className="promo-ad-strip" />
      </div>

      <div className="promo-cig-grid">
        {ids.map((id) => {
          const product = products[id];

          return (
            <div
              className={[
                "slot",
                "promo-cig-slot",
                product.cartridge ? "is-cartridge-slot" : "",
                product.missing ? "is-missing-slot" : "",
              ].join(" ")}
              key={id}
            >
              <Pack
                id={id}
                section={cigaretteSection}
                product={product}
                selected={selectedId === id}
                onClick={onSelect}
              />
              <button
                className={[
                  "price-rail",
                  `label-${product.label}`,
                  product.cartridge ? "is-cartridge-rail" : "",
                ].join(" ")}
                data-slot-id={id}
                onClick={() => onSelect(id)}
                title={`${product.name} ${product.price}`}
              >
                <FitLabel text={product.name} />
                <b>{product.price}</b>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}





function EShelf({ selectedId, onSelect, products }) {
  const deviceSection = shelfDataE.sections[0];
  const bottomSection = shelfDataE.sections[1];

  return (
    <div className="shelf-unit shelf-unit-e" data-zone="E">
      <section className="display-case e-display-case">
        <div className="section-head e-section-head">
          <div>
            <h2>{shelfDataE.name}</h2>
            <p>전자담배 5행×3열 · 일반담배 4행×5열</p>
          </div>
          <div className="case-code">E</div>
        </div>

        <div className="e-stack">
          {deviceSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={"E-device-" + rowIndex}
              zoneId={shelfDataE.id}
              section={deviceSection}
              sectionIndex={0}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}

          {bottomSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={"E-bottom-" + rowIndex}
              zoneId={shelfDataE.id}
              section={bottomSection}
              sectionIndex={1}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AShelf({ selectedId, onSelect, products }) {
  const topSection = shelfDataA.sections[0];
  const bottomSection = shelfDataA.sections[1];

  return (
    <div className="shelf-unit shelf-unit-a" data-zone="A">
      <section className="display-case a-display-case">
        <div className="section-head a-section-head">
          <div>
            <h2>{shelfDataA.name}</h2>
            <p>상단 5열×2행 · 광고 · 하단 4열×3행</p>
          </div>
          <div className="case-code">A</div>
        </div>

        <div className="a-stack">
          {topSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={"A-top-" + rowIndex}
              zoneId={shelfDataA.id}
              section={topSection}
              sectionIndex={0}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}

          <div className="a-ad-row">
            <div className="a-ad-kicker">광고</div>
            <div className="a-ad-main">일반담배 광고 영역</div>
            <div className="a-ad-sub">사진 주면 실제 문구/색상으로 교체</div>
          </div>

          {bottomSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={"A-bottom-" + rowIndex}
              zoneId={shelfDataA.id}
              section={bottomSection}
              sectionIndex={1}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function DShelf({ selectedId, onSelect, products }) {
  const deviceSection = shelfDataD.sections[0];
  const bottomSection = shelfDataD.sections[1];

  return (
    <div className="shelf-unit shelf-unit-d" data-zone="D">
      <section className="display-case red-frame d-display-case">
        <div className="section-head d-section-head">
          <div>
            <h2>{shelfDataD.name}</h2>
            <p>전자담배 3행×3열 · 일반담배 4행×4열</p>
          </div>
          <div className="case-code">D</div>
        </div>

        <div className="d-stack">
          {deviceSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={"D-device-" + rowIndex}
              zoneId={shelfDataD.id}
              section={deviceSection}
              sectionIndex={0}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}

          {bottomSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={"D-bottom-" + rowIndex}
              zoneId={shelfDataD.id}
              section={bottomSection}
              sectionIndex={1}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function CShelf({ selectedId, onSelect, products }) {
  const topSection = shelfDataC.sections[0];
  const deviceSection = shelfDataC.sections[1];
  const bottomSection = shelfDataC.sections[2];

  return (
    <div className="shelf-unit shelf-unit-c" data-zone="C">
      <section className="display-case green-frame c-display-case">
        <div className="section-head c-section-head">
          <div>
            <h2>{shelfDataC.name}</h2>
            <p>4열 · 일반 1행 + 광고 + 전자 2행 + 일반 4행</p>
          </div>
          <div className="case-code">C</div>
        </div>

        <div className="c-stack">
          <ShelfRow
            zoneId={shelfDataC.id}
            section={topSection}
            sectionIndex={0}
            rowIndex={0}
            count={4}
            selectedId={selectedId}
            onSelect={onSelect}
            products={products}
          />

                              <div className="c-ad-row c-evo-ad c-evo-ad-text-only">
            <div className="c-evo-text-panel">
              <div className="c-evo-copy">플룸 아우라 전용 스틱</div>
              <div className="c-evo-logo">evo</div>
            </div>
          </div>

          {deviceSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={`C-device-${rowIndex}`}
              zoneId={shelfDataC.id}
              section={deviceSection}
              sectionIndex={1}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}

          {bottomSection.rows.map((count, rowIndex) => (
            <ShelfRow
              key={`C-bottom-${rowIndex}`}
              zoneId={shelfDataC.id}
              section={bottomSection}
              sectionIndex={2}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function Section({ zoneId, section, sectionIndex, selectedId, onSelect, products }) {
  return (
    <section className={["display-case", section.frame === "green" ? "green-frame" : "purple-frame"].join(" ")}>
      <div className="section-head">
        <div>
          <h2>{section.name}</h2>
          <p>{section.rows.length}행 · {section.rows.reduce((a, b) => a + b, 0)}칸</p>
        </div>
        <div className="case-code">{section.id}</div>
      </div>

      <div className="rows">
        {section.rows.map((count, rowIndex) => {
          if (section.id === "B-R-top" && rowIndex === 3) {
            return (
              <PromoMergedShelfRow
                key="B-R-top-promo-merged"
                zoneId={zoneId}
                section={section}
                sectionIndex={sectionIndex}
                selectedId={selectedId}
                onSelect={onSelect}
                products={products}
              />
            );
          }

          if (section.id === "B-R-top" && rowIndex === 4) {
            return null;
          }

          return (
            <ShelfRow
              key={rowIndex}
              zoneId={zoneId}
              section={section}
              sectionIndex={sectionIndex}
              rowIndex={rowIndex}
              count={count}
              selectedId={selectedId}
              onSelect={onSelect}
              products={products}
            />
          );
        })}
      </div>
    </section>
  );
}

function DebugPanel({ selectedId, setSelectedId, products, setProducts }) {
  const [filter, setFilter] = useState("");
  const [jsonOpen, setJsonOpen] = useState(false);

  const selectedProduct = selectedId ? products[selectedId] : null;
  const filteredSlotIds = Object.keys(products).sort().filter((id) => {
    const p = products[id];
    if (!p) return false;
    const haystack = `${id} ${p.brand} ${p.name} ${p.price}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });

  function updateSelected(field, value) {
    if (!selectedId) return;
    setProducts((prev) => ({
      ...prev,
      [selectedId]: {
        ...prev[selectedId],
        [field]: value,
        empty: false,
      },
    }));
  }

  function resetSelected() {
    if (!selectedId) return;
    const section = getSectionForSlot(selectedId);
    setProducts((prev) => ({
      ...prev,
      [selectedId]: {
        ...getDefaultProduct(section),
        ...(initialProducts[selectedId] ?? {}),
      },
    }));
  }

  function clearSelected() {
    if (!selectedId) return;
    const section = getSectionForSlot(selectedId);
    setProducts((prev) => ({
      ...prev,
      [selectedId]: {
        ...getDefaultProduct(section),
        empty: true,
      },
    }));
  }

  function resetAll() {
    if (!window.confirm("B-L 수정값 전체 초기화할까?")) return;
    const fresh = createInitialProducts();
    setProducts(fresh);
    localStorage.removeItem(STORAGE_KEY);
  }

  async function copyJson() {
    await navigator.clipboard.writeText(JSON.stringify(products, null, 2));
    alert("products JSON 복사 완료");
  }

  return (
    <aside className="debug-panel">
      <div className="debug-title">
        <div>
          <div className="debug-kicker">DEBUG TAB</div>
          <h2>담배 이름 수정</h2>
        </div>
        <button className="mini-button" onClick={resetAll}>전체 초기화</button>
      </div>

      <label className="field">
        <span>칸 검색</span>
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="예: 스페셜, R1-C5, ESSE" />
      </label>

      <label className="field">
        <span>수정할 칸</span>
        <select value={selectedId ?? ""} onChange={(event) => setSelectedId(event.target.value)}>
          <option value="" disabled>칸 선택</option>
          {filteredSlotIds.map((id) => (
            <option key={id} value={id}>
              {id} · {products[id].brand} {products[id].name}
            </option>
          ))}
        </select>
      </label>

      {selectedProduct ? (
        <div className="edit-card">
          <div className="slot-code">{selectedId}</div>

          <label className="field">
            <span>브랜드</span>
            <input value={selectedProduct.brand} onChange={(event) => updateSelected("brand", event.target.value)} />
          </label>

          <label className="field">
            <span>상품명 / 라벨명</span>
            <input value={selectedProduct.name} onChange={(event) => updateSelected("name", event.target.value)} />
          </label>

          <label className="field">
            <span>가격</span>
            <input value={selectedProduct.price} onChange={(event) => updateSelected("price", event.target.value)} />
          </label>

          <div className="two-cols">
            <label className="field">
              <span>담뱃갑 색</span>
              <select value={selectedProduct.tone} onChange={(event) => updateSelected("tone", event.target.value)}>
                {toneOptions.map((tone) => <option key={tone} value={tone}>{tone}</option>)}
              </select>
            </label>

            <label className="field">
              <span>가격표 색</span>
              <select value={selectedProduct.label} onChange={(event) => updateSelected("label", event.target.value)}>
                {labelOptions.map((label) => <option key={label} value={label}>{label}</option>)}
              </select>
            </label>
          </div>

          <div className="debug-actions">
            <button onClick={resetSelected}>이 칸 원복</button>
            <button onClick={clearSelected}>빈칸 처리</button>
          </div>
        </div>
      ) : (
        <div className="empty-debug">진열대에서 담배곽이나 가격표를 누르면 여기서 수정 가능.</div>
      )}

      <button className="json-toggle" onClick={() => setJsonOpen((v) => !v)}>
        {jsonOpen ? "JSON 닫기" : "JSON 보기"}
      </button>

      {jsonOpen && (
        <div className="json-box">
          <button onClick={copyJson}>전체 JSON 복사</button>
          <textarea readOnly value={JSON.stringify(products, null, 2)} />
        </div>
      )}
    </aside>
  );
}



function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function PanZoomStage({ children }) {
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const justDraggedRef = useRef(false);
  const animRef = useRef(null);
  const viewRef = useRef({ x: 24, y: 24, scale: 1 });

  const [viewState, setViewState] = useState({ x: 24, y: 24, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [autoFocusing, setAutoFocusing] = useState(false);

  function setView(next) {
    viewRef.current = next;
    setViewState(next);
  }

  useEffect(() => {
    viewRef.current = viewState;
  }, [viewState]);

  useEffect(() => {
    return () => {
      if (animRef.current) {
        window.cancelAnimationFrame(animRef.current);
      }
    };
  }, []);

  function cancelFocusAnimation() {
    if (animRef.current) {
      window.cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    setAutoFocusing(false);
  }

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateViewTo(targetView, duration = 2600) {
    cancelFocusAnimation();

    const startView = { ...viewRef.current };
    const startTime = performance.now();

    setAutoFocusing(true);

    function step(now) {
      const raw = Math.min(1, (now - startTime) / duration);
      const t = easeInOutCubic(raw);

      const next = {
        x: startView.x + (targetView.x - startView.x) * t,
        y: startView.y + (targetView.y - startView.y) * t,
        scale: startView.scale + (targetView.scale - startView.scale) * t,
      };

      setView(next);

      if (raw < 1) {
        animRef.current = window.requestAnimationFrame(step);
      } else {
        animRef.current = null;
        setAutoFocusing(false);
      }
    }

    animRef.current = window.requestAnimationFrame(step);
  }

  function resetView() {
    cancelFocusAnimation();
    setView({ x: 24, y: 24, scale: 1 });
  }

  function zoomAtClientPoint(clientX, clientY, factor) {
    cancelFocusAnimation();

    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();

    const anchorX = clientX - rect.left;
    const anchorY = clientY - rect.top;

    const prev = viewRef.current;
    const oldScale = prev.scale || 1;
    const nextScale = clamp(oldScale * factor, 0.25, 4);

    const worldX = (anchorX - prev.x) / oldScale;
    const worldY = (anchorY - prev.y) / oldScale;

    setView({
      scale: nextScale,
      x: anchorX - worldX * nextScale,
      y: anchorY - worldY * nextScale,
    });
  }

  function zoomAtCenter(factor) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    zoomAtClientPoint(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
  }

  function focusSlotIntoView(slotId, options = {}) {
    const viewport = viewportRef.current;
    if (!viewport || !slotId) return;

    const nodes = Array.from(document.querySelectorAll('[data-slot-id="' + slotId + '"]'));
    const target =
      nodes.find((node) => node.classList.contains("pack")) ||
      nodes.find((node) => node.classList.contains("price-rail")) ||
      nodes[0];

    if (!target) return;

    const viewportRect = viewport.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const current = viewRef.current;

    const targetScreenX = targetRect.left + targetRect.width / 2 - viewportRect.left;
    const targetScreenY = targetRect.top + targetRect.height / 2 - viewportRect.top;

    const worldX = (targetScreenX - current.x) / current.scale;
    const worldY = (targetScreenY - current.y) / current.scale;

    const targetScale = Number(options.scale ?? 0.95);
    const keepLargerScale = options.keepLargerScale ?? true;

    const nextScale = clamp(
      keepLargerScale ? Math.max(current.scale, targetScale) : targetScale,
      0.25,
      4
    );

    const nextView = {
      scale: nextScale,
      x: viewportRect.width * 0.50 - worldX * nextScale,
      y: viewportRect.height * 0.42 - worldY * nextScale,
    };

    animateViewTo(nextView, Number(options.duration ?? 2600));
  }

  useEffect(() => {
    window.__focusTobaccoSlot = focusSlotIntoView;

    return () => {
      if (window.__focusTobaccoSlot === focusSlotIntoView) {
        delete window.__focusTobaccoSlot;
      }
    };
  });

  function handleWheel(event) {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 0.88;
    zoomAtClientPoint(event.clientX, event.clientY, factor);
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return;

    const target = event.target;
    if (target?.closest?.(".panzoom-toolbar")) return;
    if (target?.closest?.("input, select, textarea, button.price-rail, button.pack")) {
      return;
    }

    cancelFocusAnimation();

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    justDraggedRef.current = false;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      viewX: viewRef.current.x,
      viewY: viewRef.current.y,
    };
  }

  function handlePointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (Math.abs(dx) + Math.abs(dy) > 3) {
      justDraggedRef.current = true;
    }

    setView({
      ...viewRef.current,
      x: drag.viewX + dx,
      y: drag.viewY + dy,
    });
  }

  function handlePointerUp(event) {
    const drag = dragRef.current;
    if (drag && drag.pointerId === event.pointerId) {
      dragRef.current = null;
      setDragging(false);
    }
  }

  function handleClickCapture(event) {
    if (!justDraggedRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    justDraggedRef.current = false;
  }

  const view = viewState;

  return (
    <section
      className={[
        "panzoom-viewport",
        dragging ? "is-dragging" : "",
        autoFocusing ? "is-auto-focusing" : "",
      ].filter(Boolean).join(" ")}
      ref={viewportRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleClickCapture}
      onDoubleClick={resetView}
    >
      <div className="panzoom-toolbar">
        <button type="button" onClick={() => zoomAtCenter(1.15)}>+</button>
        <button type="button" onClick={() => zoomAtCenter(0.85)}>-</button>
        <button type="button" onClick={resetView}>reset</button>
        <span>{Math.round(view.scale * 100)}%</span>
      </div>

      <div
        className="panzoom-stage"
        style={{
          "--pz-x": Math.round(view.x) + "px",
          "--pz-y": Math.round(view.y) + "px",
          "--pz-scale": String(view.scale),
        }}
      >
        {children}
      </div>
    </section>
  );
}


// practice OrderPanel component start
function PracticeOrderPanel({
  currentOrder,
  orderResult,
  pickedProduct,
  answerProducts,
  onNext,
  onReveal,
}) {
  const statusText =
    orderResult === "correct" ? "정답! 다음 손님으로 넘어갈게." :
    orderResult === "wrong" ? "오답. 초록색 위치가 정답이야." :
    orderResult === "revealed" ? "정답 위치를 표시했어." :
    "담배를 선택하세요.";

  const pickedText = pickedProduct?.name
    ? (pickedProduct.brand ? pickedProduct.brand + " " : "") + pickedProduct.name
    : "";

  const answerText = answerProducts.length
    ? answerProducts
        .map(({ id, product }) => product?.name ? (product.brand ? product.brand + " " : "") + product.name : id)
        .join(" / ")
    : "정답 데이터 없음";

  const variantBadgeText =
    currentOrder?.shownVariant?.source === "legacy-alias"
      ? "구형명/현장 별칭"
      : currentOrder?.shownVariant?.intent === "availability"
        ? "재고 확인"
        : "";

  return (
    <aside className={["practice-order-panel", orderResult].join(" ")}>
      <div className="order-panel-left">
        <div className="order-kicker">손님 요청</div>
        <div className="order-text">“{currentOrder?.text ?? "주문 없음"}”</div>
        {variantBadgeText && (
          <div className="order-variant-badge">{variantBadgeText}</div>
        )}
        <div className="order-status">{statusText}</div>

        {orderResult === "wrong" && pickedText && (
          <div className="order-picked">네가 고른 것: {pickedText}</div>
        )}

        {(orderResult === "wrong" || orderResult === "revealed") && (
          <div className="order-answer">정답: {answerText}</div>
        )}
      </div>

      <div className="order-panel-right compact">
        <div className="order-buttons">
          <button type="button" onClick={onReveal}>정답 보기</button>
          <button type="button" onClick={onNext}>다음 손님</button>
        </div>
      </div>
    </aside>
  );
}
// practice OrderPanel component end



// answer arrow helper start
function clearAnswerArrows() {
  document.getElementById("answer-arrow-layer")?.remove();
}

function drawAnswerArrows() {
  clearAnswerArrows();
}
// answer arrow helper end

function App() {
  const [selectedId, setSelectedId] = useState(null);

  const [products, setProducts] = useState(() => {
    const fresh = createInitialProducts();

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return fresh;
      return { ...fresh, ...JSON.parse(saved) };
    } catch {
      return fresh;
    }
  });

  const [rightProducts, setRightProducts] = useState(() => {
    const fresh = {
      ...buildEmptyShelfProducts(shelfDataE),
      ...eTopRow1Products,
      ...eTopRow2Products,
      ...eTopRow3Products,
      ...eTopRow4Products,
      ...eTopRow5Products,
      ...eBottomRow1Products,
      ...eBottomRow2Products,
      ...eBottomRow3Products,
      ...eBottomRow4Products,
      ...buildEmptyShelfProducts(shelfDataA),
      ...aTopRow1Products,
      ...aTopRow2Products,
      ...aBottomRow1Products,
      ...aBottomRow2Products,
      ...aBottomRow3Products,
      ...buildEmptyShelfProducts(shelfDataRight),
      ...buildEmptyShelfProducts(shelfDataC0),
      ...buildEmptyShelfProducts(shelfDataC),
      ...buildEmptyShelfProducts(shelfDataD),
      ...dTopRow1Products,
      ...dTopRow2Products,
      ...dTopRow3Products,
      ...dBottomRow1Products,
      ...dBottomRow2Products,
      ...dBottomRow3Products,
      ...dBottomRow4Products,
      ...cTopRow1Products,
      ...cDeviceProducts,
      ...cBottomRow1Products,
      ...cBottomRow2Products,
      ...cBottomRow3Products,
      ...cBottomRow4Products,
      ...c0Products,
      ...brBottomRow1Products,
      ...brBottomRow2Products,
      ...brBottomRow3Products,
      ...brBottomRow4Products,
      ...brTop45Products,
      ...brRow2Products,
      ...brRow3Products,

      "B-R-T-R1-C1": { brand: "MIIX", name: "믹스 시가 컬렉션", tone: "miix-cigar", label: "miix-black", price: "4,800" },
      "B-R-T-R1-C2": { brand: "MIIX", name: "믹스 보니타", tone: "miix-bonita", label: "miix-black", price: "4,500" },
      "B-R-T-R1-C3": { brand: "MIIX", name: "믹스 업투", tone: "miix-up2", label: "miix-black", price: "4,500" },
      "B-R-T-R1-C4": { brand: "MIIX", name: "믹스 콤보", tone: "miix-combo", label: "miix-black", price: "4,500" },
      "B-R-T-R1-C5": { brand: "MIIX", name: "믹스 ?", tone: "miix-blue-red", label: "miix-black", price: "4,500" },
      "B-R-T-R1-C6": { brand: "MIIX", name: "믹스 클래시", tone: "miix-classy", label: "miix-black", price: "4,500" },
    };

    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-BR`);
      if (!saved) return fresh;
      return { ...fresh, ...JSON.parse(saved) };
    } catch {
      return fresh;
    }
  });

  // migrate A row2 DUNHILL brand fix start
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-a-row2-dunhill-brand-fix-v2`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      const fixes = {
        "A-B-R2-C1": { brand: "DUNHILL", name: "런던" },
        "A-B-R2-C2": { brand: "DUNHILL", name: "뉴욕" },
        "A-B-R2-C3": { brand: "DUNHILL", name: "파리" },
        "A-B-R2-C4": { brand: "DUNHILL", name: "멜로우 크러쉬" },
      };

      let changed = false;
      const next = { ...prev };

      for (const [id, patch] of Object.entries(fixes)) {
        if (!next[id]) continue;

        next[id] = {
          ...next[id],
          ...patch,
          empty: false,
          missing: false,
        };

        changed = true;
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  // migrate A row2 DUNHILL brand fix end

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }, [products]);
  // migrate C device rows when empty
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-C-device-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(cDeviceProducts)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("C ") ||
          currentName.startsWith("C-") ||
          currentName.startsWith("빈") ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  // migrate C bottom row1 when empty
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-C-bottom-row1-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(cBottomRow1Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("C ") ||
          currentName.startsWith("C-") ||
          currentName.startsWith("빈") ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  // migrate C bottom row2 when empty
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-C-bottom-row2-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(cBottomRow2Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("C ") ||
          currentName.startsWith("C-") ||
          currentName.startsWith("빈") ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  // migrate C bottom row3 when empty
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-C-bottom-row3-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(cBottomRow3Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("C ") ||
          currentName.startsWith("C-") ||
          currentName.startsWith("빈") ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  // migrate C bottom row4 when empty
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-C-bottom-row4-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(cBottomRow4Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("C ") ||
          currentName.startsWith("C-") ||
          currentName.startsWith("빈") ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  // migrate D top row1 when empty
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-D-top-row1-terea-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(dTopRow1Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("D ") ||
          currentName.startsWith("D-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  // migrate D top row2 when empty
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-D-top-row2-terea-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(dTopRow2Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("D ") ||
          currentName.startsWith("D-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-D-top-row3-sentia-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(dTopRow3Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("D ") ||
          currentName.startsWith("D-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배" ||
          currentName === "센티아" ||
          currentName === "센티아 골" ||
          currentName === "센티아 실" ||
          currentName === "센티아 다크";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-D-bottom-row1-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(dBottomRow1Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("D ") ||
          currentName.startsWith("D-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-D-bottom-row2-vista-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(dBottomRow2Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("D ") ||
          currentName.startsWith("D-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-D-bottom-row3-hybrid-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(dBottomRow3Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("D ") ||
          currentName.startsWith("D-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-D-bottom-row4-aqua-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(dBottomRow4Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("D ") ||
          currentName.startsWith("D-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-A-top-row1-neo-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(aTopRow1Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("A ") ||
          currentName.startsWith("A-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-A-top-row2-neo-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(aTopRow2Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("A ") ||
          currentName.startsWith("A-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-A-bottom-row1-dunhill-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(aBottomRow1Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("A ") ||
          currentName.startsWith("A-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-A-bottom-row2-dunhill-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(aBottomRow2Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("A ") ||
          currentName.startsWith("A-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-A-bottom-row3-finecut-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(aBottomRow3Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("A ") ||
          currentName.startsWith("A-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-top-row1-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eTopRow1Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-top-row2-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eTopRow2Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-top-row3-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eTopRow3Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-top-row4-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eTopRow4Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-top-row5-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eTopRow5Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-bottom-row1-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eBottomRow1Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-bottom-row2-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eBottomRow2Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-bottom-row3-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eBottomRow3Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);
  useEffect(() => {
    const migrationKey = `${STORAGE_KEY}-E-bottom-row4-migrated-v1`;
    if (localStorage.getItem(migrationKey)) return;

    setRightProducts((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [id, product] of Object.entries(eBottomRow4Products)) {
        const current = next[id];
        const currentName = String(current?.name ?? "").trim();

        const looksEmpty =
          !current ||
          current.empty ||
          current.missing ||
          currentName === "" ||
          currentName.startsWith("E ") ||
          currentName.startsWith("E-") ||
          currentName.startsWith("빈") ||
          currentName === "상품명" ||
          currentName === "담배";

        if (looksEmpty) {
          next[id] = product;
          changed = true;
        }
      }

      localStorage.setItem(migrationKey, "1");
      return changed ? next : prev;
    });
  }, []);



























useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-BR`, JSON.stringify(rightProducts));
  }, [rightProducts]);

  const combinedProducts = useMemo(
    () => ({ ...products, ...rightProducts }),
    [products, rightProducts]
  );

  const selectedProduct = selectedId ? combinedProducts[selectedId] : null;

  function setCombinedProducts(updater) {
    const combinedPrev = { ...products, ...rightProducts };
    const combinedNext =
      typeof updater === "function" ? updater(combinedPrev) : updater;

    const nextLeft = { ...products };
    const nextRight = { ...rightProducts };

    for (const key of Object.keys(nextLeft)) {
      if (combinedNext[key]) nextLeft[key] = combinedNext[key];
    }

    for (const key of Object.keys(nextRight)) {
      if (combinedNext[key]) nextRight[key] = combinedNext[key];
    }

    setProducts(nextLeft);
    setRightProducts(nextRight);
  }
// practice order game state start
const [orderIndex, setOrderIndex] = useState(0);
  const [pickedId, setPickedId] = useState(null);
  const [revealedAnswerIds, setRevealedAnswerIds] = useState([]);
  const [orderResult, setOrderResult] = useState("idle");

  // generated active order list start
  const importedCustomerOrders = customerOrdersData?.orders ?? [];
  const [orderDeckSeed, setOrderDeckSeed] = useState(0);

  const activeOrders = useMemo(() => {
    const baseOrders = importedCustomerOrders.length
      ? importedCustomerOrders
      : practiceOrders;

    return shuffleOrders(baseOrders).map((order) => withRandomOrderVariant(order));
  }, [importedCustomerOrders, orderDeckSeed]);

  const currentOrder = activeOrders.length
    ? activeOrders[orderIndex % activeOrders.length]
    : null;
  // generated active order list end
const pickedProduct = pickedId ? combinedProducts[pickedId] : null;


  // active order index guard start
  useEffect(() => {
    if (!activeOrders.length) return;
    setOrderIndex((value) => value % activeOrders.length);
  }, [activeOrders.length]);
  // active order index guard end

  const answerProducts = useMemo(() => {
    return (currentOrder?.answerIds ?? []).map((id) => ({
      id,
      product: combinedProducts[id],
    }));
  }, [currentOrder, combinedProducts]);

  useEffect(() => {
    document.querySelectorAll(".answer-correct, .answer-wrong").forEach((node) => {
      node.classList.remove("answer-correct", "answer-wrong");
    });

    for (const id of revealedAnswerIds) {
      document.querySelectorAll('[data-slot-id="' + id + '"]').forEach((node) => {
        node.classList.add("answer-correct");
      });
    }

    if (orderResult === "wrong" && pickedId) {
      document.querySelectorAll('[data-slot-id="' + pickedId + '"]').forEach((node) => {
        node.classList.add("answer-wrong");
      });
    }
  }, [revealedAnswerIds, pickedId, orderResult]);

  // answer arrow effect start
  useEffect(() => {
    clearAnswerArrows();

    if (orderResult !== "wrong" && orderResult !== "revealed") return;
    if (!revealedAnswerIds.length) return;

    const draw = () => drawAnswerArrows(revealedAnswerIds);

    const frame = window.requestAnimationFrame(draw);
    const timer1 = window.setTimeout(draw, 80);
    const timer2 = window.setTimeout(draw, 240);

    window.addEventListener("resize", draw);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.removeEventListener("resize", draw);
      clearAnswerArrows();
    };
  }, [revealedAnswerIds, orderResult]);
  // answer arrow effect end

useEffect(() => {
    if (orderResult !== "correct") return;

    const timer = window.setTimeout(() => {
      goNextOrder();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [orderResult]);

  function resetOrderFeedback() {
    setPickedId(null);
    setRevealedAnswerIds([]);
    setOrderResult("idle");
  }

  function handleSelectProduct(id) {
    setSelectedId(id);

    if (!currentOrder) return;
    if (orderResult !== "idle") return;

    setPickedId(id);

    const isCorrect = currentOrder.answerIds.includes(id);

    if (isCorrect) {
      setOrderResult("correct");
      setRevealedAnswerIds([id]);
    } else {
      setOrderResult("wrong");
      setRevealedAnswerIds(currentOrder?.answerIds ?? []);
      // auto focus wrong answer start
      window.setTimeout(() => {
        window.__focusTobaccoSlot?.(currentOrder?.answerIds?.[0], {
          scale: 0.95,
          keepLargerScale: true,
        });
      }, 140);
      // auto focus wrong answer end
    }
  }

  function revealCurrentAnswer() {
    if (!currentOrder) return;

    setPickedId(null);
    setRevealedAnswerIds(currentOrder?.answerIds ?? []);
    setOrderResult("revealed");
    // auto focus revealed answer start
    window.setTimeout(() => {
      window.__focusTobaccoSlot?.(currentOrder?.answerIds?.[0], {
        scale: 0.95,
        keepLargerScale: true,
      });
    }, 140);
    // auto focus revealed answer end
  }

  function goNextOrder() {
    const length = Math.max(1, activeOrders.length);
    const nextIndex = (orderIndex + 1) % length;

    if (nextIndex === 0 && activeOrders.length > 1) {
      setOrderDeckSeed((seed) => seed + 1);
    }

    setOrderIndex(nextIndex);
    resetOrderFeedback();
  }
  // practice order game state end


  return (
    <main className="page">
      <div className="layout">
        <div className="shelf-column">
          <PanZoomStage>
            <div className="main-case shelf-map">
              <EShelf
                selectedId={selectedId}
                onSelect={handleSelectProduct}
                products={rightProducts}
              />


              <AShelf
                selectedId={selectedId}
                onSelect={handleSelectProduct}
                products={rightProducts}
              />

              <div className="shelf-unit shelf-unit-left" data-zone="B-L">
                {shelfData.sections.map((section, sectionIndex) => (
                  <Section
                    key={section.id}
                    zoneId={shelfData.id}
                    section={section}
                    sectionIndex={sectionIndex}
                    selectedId={selectedId}
                    onSelect={handleSelectProduct}
                    products={products}
                  />
                ))}
              </div>

              <div className="shelf-unit shelf-unit-right" data-zone="B-R">
                {shelfDataRight.sections.map((section, sectionIndex) => (
                  <Section
                    key={section.id}
                    zoneId={shelfDataRight.id}
                    section={section}
                    sectionIndex={sectionIndex}
                    selectedId={selectedId}
                    onSelect={handleSelectProduct}
                    products={rightProducts}
                  />
                ))}
              </div>

              <div className="shelf-unit shelf-unit-c0" data-zone="C0">
                {shelfDataC0.sections.map((section, sectionIndex) => (
                  <Section
                    key={section.id}
                    zoneId={shelfDataC0.id}
                    section={section}
                    sectionIndex={sectionIndex}
                    selectedId={selectedId}
                    onSelect={handleSelectProduct}
                    products={rightProducts}
                  />
                ))}
              </div>
              <CShelf
                selectedId={selectedId}
                onSelect={handleSelectProduct}
                products={rightProducts}
              />

            
              <DShelf
                selectedId={selectedId}
                onSelect={handleSelectProduct}
                products={rightProducts}
              />
</div>
          </PanZoomStage>
        </div>
</div>
      {/* practice order panel start */}
      <PracticeOrderPanel
        currentOrder={currentOrder}
        orderResult={orderResult}
        pickedProduct={pickedProduct}
        answerProducts={answerProducts}
        onNext={goNextOrder}
        onReveal={revealCurrentAnswer}
      />
      {/* practice order panel end */}

    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);





