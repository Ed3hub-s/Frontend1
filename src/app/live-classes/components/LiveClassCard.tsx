import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Clock3, UsersRound } from 'lucide-react';
import { formatClassDate, LiveClass, money } from '@/lib/liveClasses';

export default function LiveClassCard({ item, featured = false }: { item: LiveClass; featured?: boolean }) {
  return (
    <article className={featured ? 'lc-card lc-card-featured' : 'lc-card'}>
      <Link href={`/live-classes/${item.slug}`} className="lc-card-media" aria-label={`View ${item.title}`}>
        {item.cover_image_url ? (
          <Image src={item.cover_image_url} alt="" fill sizes={featured ? '(max-width: 800px) 100vw, 55vw' : '(max-width: 800px) 100vw, 33vw'} />
        ) : (
          <span className="lc-card-placeholder" aria-hidden="true">{item.category.slice(0, 2).toUpperCase()}</span>
        )}
        <span className={item.access_type === 'free' ? 'lc-price is-free' : 'lc-price'}>
          {item.access_type === 'free' ? 'Free' : money(item.price, item.currency)}
        </span>
        {item.status === 'live' && <span className="lc-live-pill">Live now</span>}
      </Link>
      <div className="lc-card-body">
        <div className="lc-meta-line"><span>{item.category}</span><span>{item.level.replace('_', ' ')}</span></div>
        <h2><Link href={`/live-classes/${item.slug}`}>{item.title}</Link></h2>
        <p className="lc-educator">with {item.educator.name}</p>
        <div className="lc-card-facts">
          <span><Clock3 aria-hidden="true" />{formatClassDate(item.starts_at)}</span>
          <span><UsersRound aria-hidden="true" />{item.available_spaces} spaces left</span>
        </div>
        <Link href={`/live-classes/${item.slug}`} className="lc-text-link">
          {item.access_type === 'free' ? 'Register for class' : 'Buy access'} <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
