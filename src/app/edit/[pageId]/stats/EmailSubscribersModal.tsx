"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";

export function EmailSubscribersModal({
  subscribers,
}: {
  subscribers: { email: string; created_at: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left border border-border rounded-2xl p-4 hover:border-primary hover:bg-primary-soft transition"
      >
        <Mail className="w-5 h-5 text-primary mb-2" />

        <div className="text-2xl font-black">
          {subscribers.length.toLocaleString()}
        </div>

        <div className="text-xs text-text-3">
          이메일 수집
        </div>

        <div className="text-xs text-primary font-bold mt-2">
          클릭해서 목록 보기
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-bold">이메일 구독자</h2>

                <p className="text-xs text-text-3">
                  총 {subscribers.length.toLocaleString()}명
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-full hover:bg-primary-soft flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {subscribers.length === 0 ? (
              <div className="p-6 text-sm text-text-3 text-center">
                아직 수집된 이메일이 없어요
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                {subscribers.map((item, idx) => (
                  <div
                    key={`${item.email}-${idx}`}
                    className="px-4 py-3 border-b border-border last:border-b-0"
                  >
                    <div className="font-bold text-sm break-all">
                      {item.email}
                    </div>

                    <div className="text-xs text-text-3 mt-1">
                      {new Date(item.created_at).toLocaleDateString("ko-KR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}