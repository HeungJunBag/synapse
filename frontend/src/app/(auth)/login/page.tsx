'use client'

import { useState } from 'react'
import { signIn, signUp } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    const action = mode === 'signin' ? signIn : signUp
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6 p-8 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-center">시냅스</h1>

        <form action={handleSubmit} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="이메일"
            required
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호 (6자 이상)"
            required
            minLength={6}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-black text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {pending ? '처리 중...' : mode === 'signin' ? '로그인' : '회원가입'}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
          }}
          className="w-full text-sm text-gray-500 underline"
        >
          {mode === 'signin'
            ? '계정이 없으신가요? 회원가입'
            : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>
    </div>
  )
}
