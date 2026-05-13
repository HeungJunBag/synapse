/**
 * 메모 본문에서 [[제목]] 패턴을 추출하여 고유 제목 배열로 반환한다.
 */
export function parseLinkTitles(content: string): string[] {
  const matches = content.matchAll(/\[\[(.+?)\]\]/g);
  const titles = Array.from(matches, (m) => m[1].trim()).filter(Boolean);
  return [...new Set(titles)];
}
