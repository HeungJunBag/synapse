"use client";

import { useState } from "react";
import { signIn, signUp } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const action = mode === "signin" ? signIn : signUp;
    const result = await action(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm space-y-6 p-8 bg-slate-900 rounded-lg border border-slate-800 shadow-xl">
        <h1 className="text-2xl font-bold text-center text-white">시냅스</h1>

        <form action={handleSubmit} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="이메일"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="password"
            type="password"
            placeholder="비밀번호 (6자 이상)"
            required
            minLength={6}
            className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {pending ? "처리 중..." : mode === "signin" ? "로그인" : "회원가입"}
          </button>
        </form>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="w-full text-sm text-slate-400 hover:text-slate-200 underline transition-colors"
        >
          {mode === "signin"
            ? "계정이 없으신가요? 회원가입"
            : "이미 계정이 있으신가요? 로그인"}
        </button>
      </div>
    </div>
  );
}
