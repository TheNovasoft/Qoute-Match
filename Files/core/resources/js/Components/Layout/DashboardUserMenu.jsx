import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function DashboardUserMenu({
    user,
    roleLabel,
    conversationUrl,
    notificationsUrl,
    unreadCount = 0,
    notificationUnreadCount = 0,
    menuItems = [],
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const onDocClick = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };

        const onEscape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onEscape);
        };
    }, []);

    if (!user) return null;

    const displayName = user.fullname || [user.firstname, user.lastname].filter(Boolean).join(' ');

    return (
        <div className={`user-info dashboard-user-menu ${open ? 'is-open' : ''}`} ref={rootRef}>
            <div className="user-info__right">
                {notificationsUrl && (
                    <div className="notification">
                        <Link
                            className="notification-link dashboard-user-menu__notify"
                            href={notificationsUrl}
                            onClick={(event) => event.stopPropagation()}
                            aria-label="Notifications"
                            data-inbox-notify-link
                        >
                            <i className="las la-bell"></i>
                            {notificationUnreadCount > 0 && (
                                <span className="notification-number">
                                    {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                </span>
                            )}
                        </Link>
                    </div>
                )}
                <div className="notification">
                    <Link
                        className="notification-link dashboard-user-menu__notify position-relative"
                        href={conversationUrl}
                        onClick={(event) => event.stopPropagation()}
                        aria-label={unreadCount > 0 ? `Messages, ${unreadCount} unread` : 'Messages'}
                        data-message-notify-link
                    >
                        <i className="las la-envelope"></i>
                        {unreadCount > 0 && (
                            <span className="notification-number">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                    </Link>
                </div>
                <button
                    type="button"
                    className="user-info__button user-info__trigger border-0 bg-transparent p-0"
                    aria-expanded={open}
                    aria-haspopup="true"
                    aria-label="Account menu"
                    onClick={() => setOpen((value) => !value)}
                >
                    <div className="user-info__thumb">
                        {user.image ? (
                            <img
                                src={user.image}
                                alt={displayName}
                                onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                    event.currentTarget.nextElementSibling?.classList.remove('d-none');
                                }}
                            />
                        ) : null}
                        <i className={`las la-user-circle fs-2 text--base ${user.image ? 'd-none' : ''}`} />
                    </div>
                    <span className="user-info__chevron" aria-hidden="true">
                        <i className={`las ${open ? 'la-angle-up' : 'la-angle-down'}`}></i>
                    </span>
                </button>
            </div>

            <div className={`user-info-dropdown dashboard-user-menu__dropdown ${open ? 'show' : ''}`}>
                <div className="dashboard-user-menu__header">
                    <div className="dashboard-user-menu__avatar">
                        {user.image ? (
                            <img src={user.image} alt={displayName} />
                        ) : (
                            <i className="las la-user-circle"></i>
                        )}
                    </div>
                    <div className="dashboard-user-menu__meta">
                        <div className="dashboard-user-menu__name">{displayName}</div>
                        <span className="dashboard-user-menu__role">{roleLabel}</span>
                    </div>
                </div>

                <ul className="dashboard-user-menu__list">
                    {menuItems.map((item) => (
                        <li
                            key={item.label}
                            className={`user-info-dropdown__item ${item.danger ? 'is-danger' : ''}`}
                        >
                            {item.external ? (
                                <a
                                    className="user-info-dropdown__link"
                                    href={item.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setOpen(false)}
                                >
                                    <span className="icon"><i className={item.icon}></i></span>
                                    <span className="text">{item.label}</span>
                                </a>
                            ) : (
                                <Link
                                    className="user-info-dropdown__link"
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                >
                                    <span className="icon"><i className={item.icon}></i></span>
                                    <span className="text">{item.label}</span>
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
