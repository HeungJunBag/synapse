import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/login/actions'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">시냅스</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-gray-500 underline hover:text-black"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
        <p className="text-gray-400 text-center mt-20">
          노트 기능 구현 예정
        </p>
      </div>
    </div>
  )
}
