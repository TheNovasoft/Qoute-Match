import { isNavActive } from '@/utils/helpers';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function DropdownItem({ href, label, active }) {
    return (
        <li className={`sidebar-submenu-list__item ${active ? 'active' : ''}`}>
            <Link href={href} className="sidebar-submenu-list__link">
                <span className="text">{label}</span>
            </Link>
        </li>
    );
}

function DropdownMenu({ id, icon, label, openId, setOpenId, active, children }) {
    const isOpen = openId === id || active;

    return (
        <li className={`sidebar-menu-list__item has-dropdown${active ? ' active' : ''}`}>
            <button
                type="button"
                className={`sidebar-menu-list__link w-100 border-0 bg-transparent text-start${active ? ' active' : ''}`}
                onClick={() => setOpenId(isOpen && openId === id && !active ? null : id)}
            >
                <span className="icon"><i className={icon}></i></span>
                <span className="text">{label}</span>
            </button>
            <div className={`sidebar-submenu ${isOpen ? 'open-submenu' : ''}`}>{children}</div>
        </li>
    );
}

export default function BuyerSidebar({ unreadCount = 0, notificationUnreadCount = 0, open = false, onClose = () => {} }) {
    const { url, props } = usePage();
    const { auth, site, routes, trialTask, template } = props;
    const buyer = auth?.buyer;

    const jobListHref = routes.buyerJobList ?? '/buyer/job/post/index';
    const jobPostHref = routes.buyerJobPost ?? '/buyer/job/post/job-details';
    const depositHref = routes.buyerDeposit ?? '/buyer/deposit';
    const depositHistoryHref = routes.buyerDepositHistory ?? '/buyer/deposit/history';
    const withdrawHref = routes.buyerWithdraw ?? '/buyer/withdraw';
    const withdrawHistoryHref = routes.buyerWithdrawHistory ?? '/buyer/withdraw/history';
    const ticketOpenHref = routes.buyerTicketOpen ?? '/buyer/ticket/open';
    const ticketIndexHref = routes.buyerTicketIndex ?? '/buyer/ticket';
    const profileHref = routes.buyerProfileSetting ?? '/buyer/profile-setting';
    const passwordHref = routes.buyerChangePassword ?? '/buyer/change-password';
    const twofactorHref = routes.buyerTwofactor ?? '/buyer/twofactor';

    const sectionOpen = useMemo(() => {
        if (isNavActive(url, jobListHref) || isNavActive(url, jobPostHref)) return 'jobs';
        if (isNavActive(url, depositHref) || isNavActive(url, depositHistoryHref)) return 'deposit';
        if (isNavActive(url, withdrawHref) || isNavActive(url, withdrawHistoryHref)) return 'withdraw';
        if (isNavActive(url, ticketOpenHref) || isNavActive(url, ticketIndexHref)) return 'support';
        if (isNavActive(url, profileHref) || isNavActive(url, passwordHref) || isNavActive(url, twofactorHref)) return 'settings';
        return null;
    }, [
        url, jobListHref, jobPostHref, depositHref, depositHistoryHref,
        withdrawHref, withdrawHistoryHref, ticketOpenHref, ticketIndexHref,
        profileHref, passwordHref, twofactorHref,
    ]);

    const [openId, setOpenId] = useState(sectionOpen ?? 'jobs');

    useEffect(() => {
        if (sectionOpen) setOpenId(sectionOpen);
    }, [sectionOpen]);

    const currentOpenId = openId ?? sectionOpen;

    return (
        <div className={`sidebar-menu flex-between${open ? ' show-sidebar' : ''}`}>
            <div className="sidebar-menu__inner">
                <span
                    className="sidebar-menu__close d-lg-none d-block"
                    onClick={onClose}
                    role="button"
                    tabIndex={0}
                >
                    <i className="fas fa-times"></i>
                </span>

                <div className="sidebar-logo">
                    <Link href={routes.home} className="sidebar-logo__link">
                        <img src={site.logoDark || site.logo} alt={site.name} />
                    </Link>
                </div>

                <div className="sidebar-menu__top">
                    <div className="shape">
                        <img src={`${template.assetPath}shape/d-shape.png`} alt="" />
                    </div>
                    <span className="icon"><i className="las la-wallet"></i></span>
                    <div className="content">
                        <span className="title">Balance</span>
                        <h6 className="number">{buyer?.balance_formatted ?? buyer?.balance ?? '0.00'}</h6>
                    </div>
                </div>

                <ul className="sidebar-menu-list">
                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerDashboard ?? '/buyer/dashboard', { exact: true }) ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerDashboard ?? '/buyer/dashboard'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerDashboard ?? '/buyer/dashboard', { exact: true }) ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-home"></i></span>
                            <span className="text">Dashboard</span>
                        </Link>
                    </li>

                    <DropdownMenu
                        id="jobs"
                        icon="las la-rocket"
                        label="Jobs"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'jobs'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={jobListHref} label="Job List" active={isNavActive(url, jobListHref)} />
                            <DropdownItem href={jobPostHref} label="Post Job" active={isNavActive(url, jobPostHref)} />
                        </ul>
                    </DropdownMenu>

                    <li className={`sidebar-menu-list__item${isNavActive(url, jobListHref) ? ' active' : ''}`}>
                        <Link href={jobListHref} className={`sidebar-menu-list__link${isNavActive(url, jobListHref) ? ' active' : ''}`}>
                            <span className="icon"><i className="las la-columns"></i></span>
                            <span className="text">Compare Quotes</span>
                        </Link>
                    </li>

                    {trialTask && (
                        <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerTrialTasks ?? '/buyer/trial-task') ? ' active' : ''}`}>
                            <Link
                                href={routes.buyerTrialTasks ?? '/buyer/trial-task'}
                                className={`sidebar-menu-list__link${isNavActive(url, routes.buyerTrialTasks ?? '/buyer/trial-task') ? ' active' : ''}`}
                            >
                                <span className="icon"><i className="las la-tasks"></i></span>
                                <span className="text">Trial Tasks</span>
                            </Link>
                        </li>
                    )}

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerProjects ?? '/buyer/projects') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerProjects ?? '/buyer/projects'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerProjects ?? '/buyer/projects') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-briefcase"></i></span>
                            <span className="text">My Projects</span>
                        </Link>
                    </li>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerDisputes ?? '/buyer/disputes') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerDisputes ?? '/buyer/disputes'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerDisputes ?? '/buyer/disputes') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-exclamation-triangle"></i></span>
                            <span className="text">
                                Disputes
                                {(buyer?.active_disputes ?? 0) > 0 && (
                                    <span className="shake text--warning"><i className="las la-bell"></i></span>
                                )}
                            </span>
                        </Link>
                    </li>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerNotifications ?? '/buyer/notifications') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerNotifications ?? '/buyer/notifications'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerNotifications ?? '/buyer/notifications') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-bell"></i></span>
                            <span className="text">
                                Notifications
                                {notificationUnreadCount > 0 && (
                                    <span className="shake text--warning ms-1">
                                        <i className="las la-bell"></i>
                                        <span className="sidebar-chat-notify__count">
                                            {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
                                        </span>
                                    </span>
                                )}
                            </span>
                        </Link>
                    </li>

                    <DropdownMenu
                        id="deposit"
                        icon="las la-wallet"
                        label="Deposit"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'deposit'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={depositHref} label="Deposit Money" active={isNavActive(url, depositHref, { exact: true })} />
                            <DropdownItem href={depositHistoryHref} label="Deposit History" active={isNavActive(url, depositHistoryHref)} />
                        </ul>
                    </DropdownMenu>

                    <DropdownMenu
                        id="withdraw"
                        icon="las la-money-check-alt"
                        label="Withdraw"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'withdraw'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={withdrawHref} label="Withdraw Money" active={isNavActive(url, withdrawHref, { exact: true })} />
                            <DropdownItem href={withdrawHistoryHref} label="Withdraw History" active={isNavActive(url, withdrawHistoryHref)} />
                        </ul>
                    </DropdownMenu>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerTransactions ?? '/buyer/transactions') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerTransactions ?? '/buyer/transactions'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerTransactions ?? '/buyer/transactions') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="las la-exchange-alt"></i></span>
                            <span className="text">Transactions</span>
                        </Link>
                    </li>

                    <DropdownMenu
                        id="support"
                        icon="las la-ticket-alt"
                        label="Support Ticket"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'support'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={ticketOpenHref} label="Create New" active={isNavActive(url, ticketOpenHref)} />
                            <DropdownItem href={ticketIndexHref} label="Ticket History" active={isNavActive(url, ticketIndexHref)} />
                        </ul>
                    </DropdownMenu>

                    <li className={`sidebar-menu-list__item${isNavActive(url, routes.buyerConversation ?? '/buyer/conversation') ? ' active' : ''}`}>
                        <Link
                            href={routes.buyerConversation ?? '/buyer/conversation'}
                            className={`sidebar-menu-list__link${isNavActive(url, routes.buyerConversation ?? '/buyer/conversation') ? ' active' : ''}`}
                        >
                            <span className="icon"><i className="lab la-rocketchat"></i></span>
                            <span className="text">
                                Chat
                                <span
                                    className={`sidebar-chat-notify ${unreadCount > 0 ? 'shake text--warning' : 'd-none'}`}
                                    data-sidebar-chat-notify
                                >
                                    {unreadCount > 0 && (
                                        <>
                                            <i className="las la-bell"></i>
                                            <span className="sidebar-chat-notify__count">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        </>
                                    )}
                                </span>
                            </span>
                        </Link>
                    </li>

                    <DropdownMenu
                        id="settings"
                        icon="las la-cog"
                        label="Settings"
                        openId={currentOpenId}
                        setOpenId={setOpenId}
                        active={sectionOpen === 'settings'}
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={profileHref} label="Profile Setting" active={isNavActive(url, profileHref)} />
                            <DropdownItem href={passwordHref} label="Change Password" active={isNavActive(url, passwordHref)} />
                            <DropdownItem href={twofactorHref} label="2FA Security" active={isNavActive(url, twofactorHref)} />
                        </ul>
                    </DropdownMenu>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerLogout ?? '/buyer/logout'} method="get" as="button" className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-sign-out-alt"></i></span>
                            <span className="text">Logout</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}
