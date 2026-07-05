// Spring Boot API 응답 기반 타입

export interface NoteWithTags {
  id: string
  title: string
  content: string
  tags: string[]       // Spring Boot는 태그명 string[] 반환
  created_at: string
  updated_at: string
}

export interface LinkData {
  outgoing: Array<{ id: string; title: string }>
  backlinks: Array<{ id: string; title: string }>
}

export interface GraphData {
  nodes: Array<{ id: string; title: string }>
  links: Array<{ source: string; target: string }>
}
