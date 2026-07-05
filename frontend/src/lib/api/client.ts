import { cookies } from 'next/headers'

const API_URL = process.env.API_URL || 'http://localhost:8080'

/**
 * Spring Boot API 공통 fetch 클라이언트 (Server-side 전용).
 * httpOnly 쿠키에서 access_token을 읽어 Bearer 헤더에 자동 추가.
 */
export async function apiClient<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    cache: 'no-store',
  })

  const json = await res.json()

  if (!res.ok || !json.success) {
    throw new Error(json.message || '요청에 실패했습니다.')
  }

  return json.data as T
}
