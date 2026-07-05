'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const API_URL = process.env.API_URL || 'http://localhost:8080'

export async function signIn(
  formData: FormData
): Promise<{ error: string } | never> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.get('email'),
      password: formData.get('password'),
    }),
  })

  const json = await res.json()

  if (!res.ok || !json.success) {
    return { error: json.message || '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('access_token', json.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400,
    path: '/',
  })
  // 이메일은 UI 표시용으로 별도 저장 (non-httpOnly)
  cookieStore.set('user_email', formData.get('email') as string, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 86400,
    path: '/',
  })

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUp(
  formData: FormData
): Promise<{ error: string } | never> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.get('email'),
      password: formData.get('password'),
    }),
  })

  const json = await res.json()

  if (!res.ok || !json.success) {
    return { error: json.message || '회원가입에 실패했습니다.' }
  }

  // 회원가입 성공 → 바로 로그인
  return signIn(formData)
}

export async function signOut(): Promise<never> {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('user_email')
  revalidatePath('/', 'layout')
  redirect('/login')
}
