import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
    const isOpen = openId === id;

    return (
        <li className={`sidebar-menu-list__item has-dropdown ${active || isOpen ? 'active' : ''}`}>
            <button
                type="button"
                className="sidebar-menu-list__link w-100 border-0 bg-transparent text-start"
                onClick={() => setOpenId(isOpen ? null : id)}
            >
                <span className="icon"><i className={icon}></i></span>
                <span className="text">{label}</span>
            </button>
            <div className={`sidebar-submenu ${isOpen ? 'open-submenu' : ''}`}>{children}</div>
        </li>
    );
}

export default function BuyerSidebar({ unreadCount = 0, notificationUnreadCount = 0, open = false, onClose = () => {} }) {
    const { auth, site, routes, trialTask, template } = usePage().props;
    const buyer = auth?.buyer;
    const [openId, setOpenId] = useState('jobs');

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
                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerDashboard ?? '/customer/dashboard'} className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-home"></i></span>
                            <span className="text">Dashboard</span>
                        </Link>
                    </li>

                    <DropdownMenu
                        id="jobs"
                        icon="las la-rocket"
                        label="Jobs"
                        openId={openId}
                        setOpenId={setOpenId}
                        active
                    >
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={routes.buyerJobList ?? '/customer/job/post/index'} label="Job List" />
                            <DropdownItem href={routes.buyerJobPost ?? '/customer/job/post/job-details'} label="Post Job" />
                        </ul>
                    </DropdownMenu>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerJobList ?? '/customer/job/post/index'} className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-columns"></i></span>
                            <span className="text">Compare Quotes</span>
                        </Link>
                    </li>

                    {trialTask && (
                        <li className="sidebar-menu-list__item">
                            <Link href={routes.buyerTrialTasks ?? '/customer/trial-task'} className="sidebar-menu-list__link">
                                <span className="icon"><i className="las la-tasks"></i></span>
                                <span className="text">Trial Tasks</span>
                            </Link>
                        </li>
                    )}

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerProjects ?? '/customer/project/index'} className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-briefcase"></i></span>
                            <span className="text">My Projects</span>
                        </Link>
                    </li>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerDisputes ?? '/customer/disputes'} className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-exclamation-triangle"></i></span>
                            <span className="text">
                                Disputes
                                {(buyer?.active_disputes ?? 0) > 0 && (
                                    <span className="shake text--warning"><i className="las la-bell"></i></span>
                                )}
                            </span>
                        </Link>
                    </li>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerNotifications ?? '/customer/notifications'} className="sidebar-menu-list__link">
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

                    <DropdownMenu id="deposit" icon="las la-wallet" label="Deposit" openId={openId} setOpenId={setOpenId}>
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={routes.buyerDeposit ?? '/customer/deposit'} label="Deposit Money" />
                            <DropdownItem href={routes.buyerDepositHistory ?? '/customer/deposit/history'} label="Deposit History" />
                        </ul>
                    </DropdownMenu>

                    <DropdownMenu id="withdraw" icon="las la-money-check-alt" label="Withdraw" openId={openId} setOpenId={setOpenId}>
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={routes.buyerWithdraw ?? '/customer/withdraw'} label="Withdraw Money" />
                            <DropdownItem href={routes.buyerWithdrawHistory ?? '/customer/withdraw/history'} label="Withdraw History" />
                        </ul>
                    </DropdownMenu>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerTransactions ?? '/customer/transactions'} className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-exchange-alt"></i></span>
                            <span className="text">Transactions</span>
                        </Link>
                    </li>

                    <DropdownMenu id="support" icon="las la-ticket-alt" label="Support Ticket" openId={openId} setOpenId={setOpenId}>
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={routes.buyerTicketOpen ?? '/customer/ticket/open'} label="Create New" />
                            <DropdownItem href={routes.buyerTicketIndex ?? '/customer/ticket'} label="Ticket History" />
                        </ul>
                    </DropdownMenu>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerConversation ?? '/customer/conversation'} className="sidebar-menu-list__link">
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

                    <DropdownMenu id="settings" icon="las la-cog" label="Settings" openId={openId} setOpenId={setOpenId}>
                        <ul className="sidebar-submenu-list">
                            <DropdownItem href={routes.buyerProfileSetting ?? '/customer/profile-setting'} label="Profile Setting" />
                            <DropdownItem href={routes.buyerChangePassword ?? '/customer/change-password'} label="Change Password" />
                            <DropdownItem href={routes.buyerTwofactor ?? '/customer/twofactor'} label="2FA Security" />
                        </ul>
                    </DropdownMenu>

                    <li className="sidebar-menu-list__item">
                        <Link href={routes.buyerLogout ?? '/customer/logout'} method="get" as="button" className="sidebar-menu-list__link">
                            <span className="icon"><i className="las la-sign-out-alt"></i></span>
                            <span className="text">Logout</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}
