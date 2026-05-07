'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

interface Props {
  blockId: string;
  title: string;
  description: string;
  buttonText: string;
  primaryColor: string;
}

export function EmailSubscribe({ blockId, title, description, buttonText, primaryColor }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId, email, consent: true }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.alreadySubscribed ? '이미 구독 중이에요' : '구독 완료! 감사합니다 ✨');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error === 'invalid email' ? '올바른 이메일을 입력해주세요' : '잠시 후 다시 시도해주세요');
      }
    } catch {
      setStatus('error');
      setMessage('네트워크 오류. 다시 시도해주세요');
    }
  }

  return (
    <div className="bg-primary-soft border border-primary rounded-2xl p-5">
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4" style={{ color: primaryColor }} /> {title || '구독하기'}
      </h3>
      {description && <p className="text-sm text-text-2 mb-3">{description}</p>}

      {status === 'success' ? (
        <div className="bg-white border border-green-300 rounded-xl p-3 text-sm text-green-700 text-center">
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            required
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-white text-text"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email}
            className="h-11 px-5 rounded-xl text-white font-bold disabled:opacity-50 transition"
            style={{ backgroundColor: primaryColor }}
          >
            {status === 'loading' ? '...' : (buttonText || '구독')}
          </button>
        </form>
      )}

      {status === 'error' && (
        <p className="text-xs text-red-500 mt-2">{message}</p>
      )}
    </div>
  );
}
