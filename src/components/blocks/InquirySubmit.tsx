'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

interface Props {
  blockId: string;
  title: string;
  buttonText: string;
  options: string[];
  primaryColor: string;
}

export function InquirySubmit({ blockId, title, buttonText, options, primaryColor }: Props) {
  const [selected, setSelected] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) {
      setMessage('카테고리를 선택해주세요');
      return;
    }

    setStatus('loading');
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, selectedOption: selected }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('문의 접수 완료! 빠르게 답변 드릴게요 ✨');
      } else {
        setStatus('error');
        setMessage('잠시 후 다시 시도해주세요');
      }
    } catch {
      setStatus('error');
      setMessage('네트워크 오류. 다시 시도해주세요');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 text-center text-green-700">
          {message}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} /> {title || '문의하기'}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="space-y-2 mb-4">
          {options.map((opt, i) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer text-sm p-2 hover:bg-primary-soft rounded-lg">
              <input
                type="radio"
                name={`inquiry-${blockId}`}
                value={opt}
                checked={selected === opt}
                onChange={(e) => setSelected(e.target.value)}
                className="accent-primary"
              />
              {opt}
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full h-11 rounded-xl text-white font-bold disabled:opacity-50"
          style={{ backgroundColor: primaryColor }}
        >
          {status === 'loading' ? '...' : buttonText || '보내기'}
        </button>
        {message && status !== 'success' && (
          <p className="text-xs text-red-500 mt-2 text-center">{message}</p>
        )}
      </form>
    </div>
  );
}