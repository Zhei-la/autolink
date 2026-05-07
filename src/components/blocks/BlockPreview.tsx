import { formatPrice } from '@/lib/utils';
import { Mail, Calendar, MessageSquare, Instagram, Youtube, Twitter, MessageCircle } from 'lucide-react';
import type { Block } from '@/types';

/**
 * 블록 미리보기. 편집기와 공개 페이지에서 공통 사용.
 * primaryColor를 prop으로 받아 테마 적용.
 */
export function BlockPreview({
  block,
  primaryColor = '#f97316',
  isPublic = false,
}: {
  block: Block;
  primaryColor?: string;
  isPublic?: boolean;
}) {
  switch (block.type) {
    case 'profile':
      return <ProfileBlock data={block.data} primaryColor={primaryColor} />;
    case 'link':
      return <LinkBlock block={block} primaryColor={primaryColor} isPublic={isPublic} />;
    case 'product_grid':
      return <ProductGridBlock block={block} primaryColor={primaryColor} isPublic={isPublic} />;
    case 'inquiry':
      return <InquiryBlock block={block} primaryColor={primaryColor} isPublic={isPublic} />;
    case 'calendar':
      return <CalendarBlock data={block.data} primaryColor={primaryColor} />;
    case 'email':
      return <EmailBlock block={block} primaryColor={primaryColor} isPublic={isPublic} />;
    case 'text':
      return <TextBlock data={block.data} />;
    case 'sns':
      return <SnsBlock data={block.data} primaryColor={primaryColor} isPublic={isPublic} />;
    default:
      return null;
  }
}

// ===== 1. 프로필 =====
function ProfileBlock({ data, primaryColor }: any) {
  return (
    <div className="text-center py-4">
      {data.avatarUrl ? (
        <img
          src={data.avatarUrl}
          alt={data.name}
          className="w-20 h-20 mx-auto rounded-full object-cover mb-3"
        />
      ) : (
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-white font-black text-3xl mb-3"
          style={{ backgroundColor: primaryColor }}
        >
          {data.initial || data.name?.[0] || '?'}
        </div>
      )}
      <h2 className="font-black text-xl mb-1">{data.name}</h2>
      {data.bio && <p className="text-text-2 text-sm">{data.bio}</p>}
    </div>
  );
}

// ===== 2. 링크 =====
function LinkBlock({ block, primaryColor, isPublic }: any) {
  const { title, url, thumbnail } = block.data;
  const Wrapper = isPublic ? 'a' : 'div';
  const wrapperProps = isPublic
    ? { href: `/api/click/${block.id}?to=${encodeURIComponent(url)}`, target: '_blank', rel: 'noopener' }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="flex items-center gap-3 p-4 bg-white border border-border rounded-2xl hover:border-primary transition cursor-pointer"
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover" />
      ) : (
        <div
          className="w-14 h-14 rounded-xl flex-shrink-0"
          style={{ backgroundColor: primaryColor + '20' }}
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{title || '제목 없음'}</div>
        {url && (
          <div className="text-xs text-text-3 truncate">
            {url.replace(/^https?:\/\//, '').slice(0, 40)}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

// ===== 3. 상품 그리드 =====
function ProductGridBlock({ block, primaryColor, isPublic }: any) {
  const { title, products = [] } = block.data;

  return (
    <div className="space-y-3">
      {title && <h3 className="font-bold">{title}</h3>}
      {products.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-xl text-text-3 text-sm">
          상품을 추가해주세요
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product: any) => {
            const Wrapper = isPublic ? 'a' : 'div';
            const wrapperProps = isPublic
              ? { href: `/api/click/${block.id}?to=${encodeURIComponent(product.url || '#')}`, target: '_blank', rel: 'noopener' }
              : {};
            return (
              <Wrapper
                key={product.id}
                {...wrapperProps}
                className="bg-white border border-border rounded-xl overflow-hidden hover:border-primary transition cursor-pointer"
              >
                <div className="aspect-square bg-text-3/10">
                  {product.thumbnail && (
                    <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <div className="text-sm font-bold line-clamp-2 mb-1">{product.title}</div>
                  {product.discount > 0 && (
                    <span className="text-xs font-bold text-red-500 mr-1">{product.discount}%</span>
                  )}
                  {product.price > 0 && (
                    <span className="text-sm font-bold">{formatPrice(product.price)}</span>
                  )}
                </div>
              </Wrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== 4. 문의 양식 =====
function InquiryBlock({ block, primaryColor, isPublic }: any) {
  const { title, buttonText, options = [] } = block.data;
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} /> {title || '문의하기'}
      </h3>
      <div className="space-y-2 mb-4">
        {options.map((opt: string, i: number) => (
          <label key={i} className="flex items-center gap-2 cursor-pointer text-sm p-2 hover:bg-primary-soft rounded-lg">
            <input
              type="radio"
              name={`inquiry-${block.id}`}
              value={opt}
              className="accent-primary"
              disabled={!isPublic}
            />
            {opt}
          </label>
        ))}
      </div>
      <button
        className="w-full h-11 rounded-xl text-white font-bold"
        style={{ backgroundColor: primaryColor }}
        disabled={!isPublic}
      >
        {buttonText || '보내기'}
      </button>
    </div>
  );
}

// ===== 5. 달력 =====
function CalendarBlock({ data, primaryColor }: any) {
  const events = data.events || [];

  function ddayLabel(date: string) {
    const target = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'D-day';
    if (diff > 0) return `D-${diff}`;
    return `D+${-diff}`;
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4" style={{ color: primaryColor }} /> 일정
      </h3>
      {events.length === 0 ? (
        <div className="text-sm text-text-3">일정을 추가해주세요</div>
      ) : (
        <div className="space-y-2">
          {events.map((ev: any) => (
            <div key={ev.id} className="flex items-center gap-3 p-2">
              <span className="text-2xl">{ev.emoji || '📅'}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{ev.title}</div>
                <div className="text-xs text-text-3">
                  {new Date(ev.date).toLocaleDateString('ko-KR')}
                </div>
              </div>
              <span
                className="text-xs font-bold px-2 py-1 rounded"
                style={{ backgroundColor: primaryColor + '20', color: primaryColor }}
              >
                {ddayLabel(ev.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== 6. 이메일 수집 =====
function EmailBlock({ block, primaryColor, isPublic }: any) {
  const { title, description, buttonText } = block.data;
  return (
    <div className="bg-primary-soft border border-primary rounded-2xl p-5">
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4" style={{ color: primaryColor }} /> {title || '구독하기'}
      </h3>
      {description && <p className="text-sm text-text-2 mb-3">{description}</p>}
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="email@example.com"
          disabled={!isPublic}
          className="flex-1 h-11 px-4 rounded-xl border border-border bg-white"
        />
        <button
          className="h-11 px-5 rounded-xl text-white font-bold"
          style={{ backgroundColor: primaryColor }}
          disabled={!isPublic}
        >
          {buttonText || '구독'}
        </button>
      </div>
    </div>
  );
}

// ===== 7. 텍스트 =====
function TextBlock({ data }: any) {
  if (data.variant === 'divider') {
    return <hr className="border-border my-2" />;
  }
  if (data.variant === 'heading') {
    return <h2 className="font-black text-xl py-2">{data.text}</h2>;
  }
  return <p className="text-text-2 text-sm py-1 whitespace-pre-wrap">{data.text}</p>;
}

// ===== 8. SNS 링크 =====
function SnsBlock({ data, primaryColor, isPublic }: any) {
  const links = data.links || [];

  const icons: Record<string, any> = {
    instagram: Instagram,
    youtube: Youtube,
    twitter: Twitter,
    threads: MessageCircle,
    tiktok: MessageCircle,
    kakao: MessageCircle,
    blog: MessageCircle,
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2">
      {links.length === 0 ? (
        <div className="text-text-3 text-sm">SNS 링크를 추가해주세요</div>
      ) : (
        links.map((link: any, i: number) => {
          const Icon = icons[link.platform] || MessageCircle;
          const Wrapper = isPublic ? 'a' : 'div';
          const wrapperProps = isPublic ? { href: link.url, target: '_blank', rel: 'noopener' } : {};
          return (
            <Wrapper
              key={i}
              {...wrapperProps}
              className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:border-primary cursor-pointer"
              style={{ color: primaryColor }}
            >
              <Icon className="w-5 h-5" />
            </Wrapper>
          );
        })
      )}
    </div>
  );
}
