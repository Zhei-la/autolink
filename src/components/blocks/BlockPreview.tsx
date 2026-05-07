import { formatPrice } from '@/lib/utils';
import { Mail, Calendar, MessageSquare, Instagram, Youtube, Twitter, MessageCircle, Music2, Globe } from 'lucide-react';
import type { Block } from '@/types';
import { EmailSubscribe } from './EmailSubscribe';
import { InquirySubmit } from './InquirySubmit';
import { ProductGridSearch } from './ProductGridSearch';

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

function ProfileBlock({ data, primaryColor }: any) {
  return (
    <div className="text-center py-4">
      {data.avatarUrl ? (
        <img src={data.avatarUrl} alt={data.name} className="w-20 h-20 mx-auto rounded-full object-cover mb-3" />
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

function LinkBlock({ block, primaryColor, isPublic }: any) {
  const { title, url, thumbnail } = block.data;
  const Wrapper: any = isPublic ? 'a' : 'div';
  const wrapperProps = isPublic
    ? { href: `/api/click/${block.id}?to=${encodeURIComponent(url || '#')}`, target: '_blank', rel: 'noopener' }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="flex items-center gap-3 p-4 bg-white border border-border rounded-2xl hover:border-primary transition cursor-pointer"
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" className="w-14 h-14 rounded-xl object-cover" />
      ) : (
        <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ backgroundColor: primaryColor + '20' }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{title || '제목 없음'}</div>
        {url && <div className="text-xs text-text-3 truncate">{url.replace(/^https?:\/\//, '').slice(0, 40)}</div>}
      </div>
    </Wrapper>
  );
}

function ProductGridBlock({ block, primaryColor, isPublic }: any) {
  const { title, products = [] } = block.data;

  return (
    <ProductGridSearch
      blockId={block.id}
      title={title}
      products={products}
      primaryColor={primaryColor}
      isPublic={isPublic}
    />
  );
}

function InquiryBlock({ block, primaryColor, isPublic }: any) {
  const { title, buttonText, options = [] } = block.data;

  if (isPublic) {
    return (
      <InquirySubmit
        blockId={block.id}
        title={title}
        buttonText={buttonText}
        options={options}
        primaryColor={primaryColor}
      />
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} /> {title || '문의하기'}
      </h3>
      <div className="space-y-2 mb-4">
        {options.map((opt: string, i: number) => (
          <label key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg">
            <input type="radio" name={`inquiry-preview-${block.id}`} disabled className="accent-primary" />
            {opt}
          </label>
        ))}
      </div>
      <button
        className="w-full h-11 rounded-xl text-white font-bold opacity-70"
        style={{ backgroundColor: primaryColor }}
        disabled
      >
        {buttonText || '보내기'}
      </button>
    </div>
  );
}

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
                <div className="text-xs text-text-3">{new Date(ev.date).toLocaleDateString('ko-KR')}</div>
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

function EmailBlock({ block, primaryColor, isPublic }: any) {
  const { title, description, buttonText } = block.data;

  if (isPublic) {
    return (
      <EmailSubscribe
        blockId={block.id}
        title={title}
        description={description}
        buttonText={buttonText}
        primaryColor={primaryColor}
      />
    );
  }

  return (
    <div className="bg-primary-soft border border-primary rounded-2xl p-5">
      <h3 className="font-bold mb-1 flex items-center gap-2">
        <Mail className="w-4 h-4" style={{ color: primaryColor }} /> {title || '구독하기'}
      </h3>
      {description && <p className="text-sm text-text-2 mb-3">{description}</p>}
      <div className="flex gap-2">
        <input type="email" placeholder="email@example.com" disabled className="flex-1 h-11 px-4 rounded-xl border border-border bg-white" />
        <button className="h-11 px-5 rounded-xl text-white font-bold opacity-70" style={{ backgroundColor: primaryColor }} disabled>
          {buttonText || '구독'}
        </button>
      </div>
    </div>
  );
}

function TextBlock({ data }: any) {
  if (data.variant === 'divider') return <hr className="border-border my-2" />;
  if (data.variant === 'heading') return <h2 className="font-black text-xl py-2">{data.text}</h2>;
  return <p className="text-text-2 text-sm py-1 whitespace-pre-wrap">{data.text}</p>;
}

function ThreadsIcon({ className = "", style }: any) {
  return (
    <span
      className={className}
      style={{
        ...style,
        fontWeight: 900,
        fontSize: "22px",
        lineHeight: 1,
        fontFamily: "Arial, sans-serif",
      }}
    >
      @
    </span>
  );
}

function SnsBlock({ data, primaryColor, isPublic }: any) {
  const links = data.links || [];

  const icons: Record<string, any> = {
    instagram: Instagram,
    youtube: Youtube,
    threads: ThreadsIcon,
    tiktok: Music2,
    twitter: Twitter,
    kakao: MessageCircle,
    blog: Globe,
  };

  const colors: Record<string, string> = {
    instagram: '#E4405F',
    youtube: '#FF0000',
    threads: '#000000',
    tiktok: '#000000',
    twitter: '#1DA1F2',
    kakao: '#FEE500',
    blog: '#03C75A',
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-2">
      {links.length === 0 ? (
        <div className="text-text-3 text-sm">SNS 링크를 추가해주세요</div>
      ) : (
        links.map((link: any, i: number) => {
          const Icon = icons[link.platform] || MessageCircle;
          const color = colors[link.platform] || primaryColor;
          const Wrapper: any = isPublic ? 'a' : 'div';
          const wrapperProps = isPublic ? { href: link.url, target: '_blank', rel: 'noopener' } : {};
          return (
            <Wrapper
              key={i}
              {...wrapperProps}
              className="w-12 h-12 rounded-full border-2 flex items-center justify-center hover:scale-110 transition cursor-pointer"
              style={{ borderColor: color, backgroundColor: color + '15' }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </Wrapper>
          );
        })
      )}
    </div>
  );
}
