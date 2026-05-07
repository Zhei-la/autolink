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
            <ChevronLeft className="w-4 h-4" /> ??쒕낫??          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-3xl font-black mb-2">???섏씠吏 留뚮뱾湲?/h1>
        <p className="text-text-2 mb-8">
          湲곕낯 ?뺣낫留??낅젰?섎㈃ 諛붾줈 留뚮뱾?댁졇?? ?섏쨷???몄쭛湲곗뿉???먯쑀濡?쾶 ?섏젙?????덉뼱??
        </p>

        <form action={createPage} className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-bold mb-2">
              ?섏씠吏 ?대쫫
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="??留곹겕 ?섏씠吏"
              required
              maxLength={50}
              className="w-full h-12 px-4 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <p className="text-xs text-text-3 mt-1.5">?? 猷⑦뵾???쇳븨, 泥?냼留덈?</p>
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-bold mb-2">
              URL <span className="text-text-3 font-normal">(?섏쨷??蹂寃?媛??</span>
            </label>
            <div className="flex items-center gap-1 px-4 h-12 border border-border rounded-xl focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary">
              <span className="text-text-3 text-sm">autolink.kr/p/</span>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="loopy-shop"
                pattern="[a-z0-9\-]{3,30}"
                className="flex-1 outline-none bg-transparent"
              />
            </div>
            <p className="text-xs text-text-3 mt-1.5">?곷Ц ?뚮Ц?? ?レ옄, ?섏씠?덈쭔 媛??쨌 鍮꾩썙?먮㈃ ?먮룞 ?앹꽦</p>
          </div>

          <button
            type="submit"
            className="w-full h-14 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition"
          >
            留뚮뱾湲?          </button>
        </form>
      </div>
    </main>
  );
}
