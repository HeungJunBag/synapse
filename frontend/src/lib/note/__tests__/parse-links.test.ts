import { describe, it, expect } from 'vitest';
import { parseLinkTitles } from '../parse-links';

describe('parseLinkTitles', () => {
  it('본문에서 [[제목]] 패턴을 추출한다', () => {
    const content = '이 메모는 [[양자역학]]과 [[엔트로피]]를 연결한다.';
    expect(parseLinkTitles(content)).toEqual(['양자역학', '엔트로피']);
  });

  it('링크가 없으면 빈 배열을 반환한다', () => {
    expect(parseLinkTitles('링크 없는 메모')).toEqual([]);
  });

  it('중복된 [[링크]]는 한 번만 반환한다', () => {
    const content = '[[양자역학]] 그리고 다시 [[양자역학]]';
    expect(parseLinkTitles(content)).toEqual(['양자역학']);
  });

  it('빈 [[]] 는 무시한다', () => {
    expect(parseLinkTitles('[[]] 빈 링크')).toEqual([]);
  });
});
