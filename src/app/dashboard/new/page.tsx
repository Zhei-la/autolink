import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createPage } from '@/lib/db/pages';

export default function NewPagePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="h-2 bg-primary" />

      <header className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text">
            <ChevronLeft className="w-4 h-4" /> 대시보드
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-black mb-2">새 페이지 만들기</h1>
        <p className="text-text-2 mb-8">
          기본 정보만 입력하면 바로 만들어져요. 나중에 편집기에서 자유롭게 수정할 수 있어요.
        </p>

        <form action={createPage} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-bold mb-2">
              페이지 이름
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="내 링크 페이지"
              required
              maxLength={50}
              className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <p className="text-xs text-text-3 mt-1.5">예: 루피의 쇼핑, 청소마녀</p>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-bold mb-2">
              URL <span className="text-text-3 font-normal">(나중에 변경 가능)</span>
            </label>
            <div className="flex items-center gap-1 px-4 h-12 border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
              <span className="text-text-3 text-sm">autolink.kr/p/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="loopy-shop"
                pattern="[a-z0-9-]{3,30}"
                className="flex-1 outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-text-3 mt-1.5">영문 소문자, 숫자, 하이픈만 가능 · 비워두면 자동 생성</p>
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
          >
            만들기
          </button>
        </form>
      </div>
    </main>
  );
}
