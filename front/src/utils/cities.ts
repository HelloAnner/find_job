// 城市字典（前端内置）：提供 code<->name 的双向映射与便捷编码/解码函数
// 数据来源：front/src/data/cities.json（由后端 assets/boss/city-industry-code.json 拷贝）

import citiesData from '@/data/cities.json';

// 特殊值
export const CODE_UNLIMITED = '0';
export const CODE_NATIONWIDE = '100010000';

const SPECIAL_CODE_TO_NAME: Record<string, string> = {
  [CODE_UNLIMITED]: '不限',
  [CODE_NATIONWIDE]: '全国',
};

const SPECIAL_NAME_TO_CODE: Record<string, string> = {
  '不限': CODE_UNLIMITED,
  '全国': CODE_NATIONWIDE,
};

type CityEntry = { name: string; code: number | string };

const list = (citiesData as { city: CityEntry[] }).city || [];

export const CITY_MAP_CODE_TO_NAME: Record<string, string> = list.reduce(
  (acc, { name, code }) => {
    acc[String(code)] = name;
    return acc;
  },
  { ...SPECIAL_CODE_TO_NAME } as Record<string, string>
);

export const CITY_MAP_NAME_TO_CODE: Record<string, string> = list.reduce(
  (acc, { name, code }) => {
    acc[name] = String(code);
    return acc;
  },
  { ...SPECIAL_NAME_TO_CODE } as Record<string, string>
);

export function codeToName(code: string): string {
  if (!code) return '不限';
  return CITY_MAP_CODE_TO_NAME[code] || code; // 未知编码返回原样，避免丢失
}

export function nameToCode(name: string): string {
  if (!name) return CODE_UNLIMITED;
  if (CITY_MAP_NAME_TO_CODE[name]) return CITY_MAP_NAME_TO_CODE[name];
  // 已经是编码（纯数字）则原样返回
  if (/^\d+$/.test(name)) return name;
  return CODE_UNLIMITED;
}

export function decodeCities(codes: string[]): string[] {
  return (codes || []).map(codeToName);
}

export function encodeCities(names: string[]): string[] {
  // 去重 + 过滤空白
  const uniq = Array.from(new Set((names || []).map((s) => String(s).trim()).filter(Boolean)));
  // 互斥：若包含“全国/不限”，仅保留该特殊项
  if (uniq.some((v) => v === '全国' || v === '不限' || v === CODE_NATIONWIDE || v === CODE_UNLIMITED)) {
    return [CODE_NATIONWIDE];
  }
  return uniq.map(nameToCode);
}

