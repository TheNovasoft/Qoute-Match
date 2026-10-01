import { Link, usePage } from '@inertiajs/react';

const DEFAULT_VIDEO = '/assets/templates/basic/videos/qm-promo-bg.mp4';

/**
 * Full-bleed video background band (Fiverr-style).
 * Reusable for home promo / About hero with site styling.
 */
export default function VideoPromoSection({
    poster,
    videoSrc = DEFAULT_VIDEO,
    eyebrow = 'For customers',
    title = 'Post once. Compare quotes. Hire with confidence.',
    description = 'Find verified builders and freight forwarders — join free and start getting quotes.',
    ctaLabel = 'Join as customer',
    ctaHref,
    className = '',
}) {
    const { routes, auth } = usePage().props;
    const joinUrl = ctaHref
        || (auth?.buyer ? (routes.buyerDashboard || routes.home) : routes.buyerRegister);

    return (
        <section className={`qm-video-promo ${className}`.trim()} aria-label={ctaLabel}>
            <div className="qm-video-promo__media" aria-hidden="true">
                <video
                    className="qm-video-promo__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={poster || undefined}
                    key={videoSrc}
                >
                    <source src={videoSrc} type="video/mp4" />
                </video>
                <div className="qm-video-promo__scrim" />
            </div>

            <div className="container qm-video-promo__content">
                {eyebrow ? <p className="qm-video-promo__eyebrow">{eyebrow}</p> : null}
                <h2 className="qm-video-promo__title">{title}</h2>
                {description ? <p className="qm-video-promo__desc">{description}</p> : null}
                {ctaLabel ? (
                    <Link href={joinUrl} className="btn btn--base btn--lg qm-video-promo__cta">
                        {ctaLabel}
                    </Link>
                ) : null}
            </div>
        </section>
    );
}
