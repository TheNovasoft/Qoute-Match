import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import VerificationBadges from '@/Components/Shared/VerificationBadges';
import ConfirmModal from '@/Components/Shared/ConfirmModal';
import { notify } from '@/utils/helpers';

function formatMessageHtml(value) {
    if (!value) return '';
    const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    return escaped.replace(/\n/g, '<br>');
}

function ChatMessage({ message, fileBaseUrl }) {
    const styleClass = message.side ? `message--${message.side}` : 'message--left';

    return (
        <div className={`single-message ${styleClass}`} data-message-id={message.id}>
            <div className="message-content-outer">
                <span className="message-sender">{message.senderName}</span>
                <div className="message-content">
                    {message.message && (
                        <p
                            className="message-text"
                            dangerouslySetInnerHTML={{
                                __html: `${message.action === 1 ? 'Action: ' : ''}${formatMessageHtml(message.message)}`,
                            }}
                        />
                    )}
                    {message.files?.length > 0 && (
                        <small className="message-box__text">
                            {message.files.map((file) => (
                                <a key={file} href={`${fileBaseUrl}/${file}`} download>
                                    <i className="las la-file" /> {file}
                                </a>
                            ))}
                        </small>
                    )}
                </div>
                <span className="message-time d-block mt-1">{message.time}</span>
            </div>
        </div>
    );
}

export default function ChatInbox({
    role,
    conversations = [],
    activeConversationId,
    peer,
    messages: initialMessages = [],
    storeUrl,
    pollUrl,
    fileBaseUrl,
    deleteUrl,
    blockUrl,
}) {
    const [messages, setMessages] = useState(initialMessages);
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const knownIds = useRef(new Set(initialMessages.map((m) => m.id)));
    const threadRef = useRef(null);

    useEffect(() => {
        setMessages(initialMessages);
        knownIds.current = new Set(initialMessages.map((m) => m.id));
    }, [activeConversationId, initialMessages]);

    useEffect(() => {
        if (threadRef.current) {
            threadRef.current.scrollTop = threadRef.current.scrollHeight;
        }
    }, [messages]);

    const appendMessage = (data) => {
        if (data.id && knownIds.current.has(data.id)) return;
        if (data.id) knownIds.current.add(data.id);
        setMessages((prev) => [...prev, data]);
    };

    useEffect(() => {
        if (!pollUrl) return undefined;

        const poll = async () => {
            try {
                const response = await window.axios.get(pollUrl, { headers: { Accept: 'application/json' } });
                const payload = response.data?.data?.messages ?? response.data?.data?.messages;
                if (response.data?.status === 'success' && Array.isArray(response.data?.data?.messages)) {
                    response.data.data.messages.forEach(appendMessage);
                } else if (Array.isArray(payload)) {
                    payload.forEach(appendMessage);
                }
            } catch {
                // ignore polling errors
            }
        };

        poll();
        const timer = window.setInterval(poll, 3000);
        return () => clearInterval(timer);
    }, [pollUrl]);

    const sendMessage = async (event) => {
        event.preventDefault();
        if (!storeUrl) {
            notify('error', 'Choose a conversation before sending a message.');
            return;
        }
        if (!text.trim() && files.length === 0) {
            notify('error', 'Type a message or attach a file before sending.');
            return;
        }

        const formData = new FormData();
        formData.append('message', text);
        files.forEach((file) => formData.append('message_files[]', file));

        setSending(true);
        try {
            const response = await window.axios.post(storeUrl, formData, {
                headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
            });
            if (response.data?.status === 'success') {
                setText('');
                setFiles([]);
                if (response.data?.data?.message) {
                    appendMessage(response.data.data.message);
                }
            } else {
                const errorMessage = response.data?.message?.error?.[0]
                    || response.data?.message?.error
                    || 'We could not send your message. Try again in a moment.';
                notify('error', errorMessage);
            }
        } catch (error) {
            const payload = error.response?.data || {};
            notify('error', payload.message?.error?.[0] || payload.message || 'We could not send your message. Check your connection and try again.');
        } finally {
            setSending(false);
        }
    };

    const handleDelete = () => {
        if (!deleteUrl) return;
        setConfirmDelete(true);
    };

    const confirmDeleteConversation = () => {
        if (!deleteUrl) return;
        router.post(deleteUrl, {}, { onFinish: () => setConfirmDelete(false) });
    };

    const handleBlock = () => {
        if (!blockUrl) return;
        router.post(blockUrl);
    };

    return (
        <div className="buyer-panel-content chat-page-shell">
            <div className="container-fluid px-0">
                <div className="chatboard-chat-area">
                    <div className="row gy-3 flex-wrap-reverse">
                        <div className="col-xl-4 col-lg-12 col-md-5">
                            <div className="chatboard-chat-left">
                                <div className="chatboard-chat-left__title justify-content-between gap-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="las la-comments" />
                                        <span>Messages</span>
                                    </div>
                                    <span className="load-icon">
                                        <i
                                            className="las la-sync-alt pageReload"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => router.reload({ only: ['conversations', 'messages', 'peer', 'activeConversationId'] })}
                                            onKeyDown={(e) => e.key === 'Enter' && router.reload()}
                                        />
                                    </span>
                                </div>
                                <ul className="chat-board-left-item">
                                    {conversations.length === 0 ? (
                                        <li className="text-center text-muted py-4">No conversations yet.</li>
                                    ) : (
                                        conversations.map((conv) => (
                                            <li
                                                key={conv.id}
                                                className={`${conv.active ? 'active' : ''} ${conv.blocked ? 'disabled' : ''}`}
                                            >
                                                <Link href={conv.url} className="user__wrapper text-decoration-none text-reset">
                                                    <span className="icon">
                                                        <img src={conv.peer?.image} alt="" />
                                                    </span>
                                                    <div className="chat-item">
                                                        <h4 className="title mb-1 d-flex align-items-center flex-wrap gap-1">
                                                            <span>{conv.peer?.fullname}</span>
                                                            {conv.peer?.verificationBadges && (
                                                                <VerificationBadges badges={conv.peer.verificationBadges} compact />
                                                            )}
                                                        </h4>
                                                        <span className={`desc fs-12 ${conv.unreadCount ? 'text--base' : 'text--secondary'}`}>
                                                            {conv.lastPreview}
                                                        </span>
                                                        <span className={`d-block time ${conv.unreadCount ? 'text--base' : 'text--secondary'}`}>
                                                            <i className="las la-clock" /> {conv.lastTime}
                                                        </span>
                                                    </div>
                                                </Link>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        </div>

                        <div className="col-xl-8 col-lg-12 col-md-7">
                            <div className="chat-box">
                                <div className="chat-box__content">
                                    {peer && (
                                        <div className="chat-box__header d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-bottom">
                                            <div className="d-flex align-items-center gap-2">
                                                <img src={peer.image} alt="" className="rounded-circle" width="40" height="40" />
                                                <div>
                                                    <h6 className="mb-0">
                                                        {peer.fullname}
                                                        {peer.verificationBadges && (
                                                            <VerificationBadges badges={peer.verificationBadges} compact className="ms-1" />
                                                        )}
                                                    </h6>
                                                    {peer.profileUrl && (
                                                        <a href={peer.profileUrl} className="small text-muted" target="_blank" rel="noreferrer">
                                                            @{peer.username}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                {blockUrl && (
                                                    <button type="button" className="btn btn--sm btn-outline--danger" onClick={handleBlock}>
                                                        Block
                                                    </button>
                                                )}
                                                {deleteUrl && (
                                                    <button type="button" className="btn btn--sm btn-outline--dark" onClick={handleDelete}>
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="chat-box__thread" id="chatThread" ref={threadRef}>
                                        {messages.length === 0 ? (
                                            <div className="empty-message text-center py-5">
                                                <i className="las la-comments fs-1 text-muted" />
                                                <span className="d-flex justify-content-center mt-2">Start conversations!</span>
                                            </div>
                                        ) : (
                                            messages.map((message) => (
                                                <ChatMessage key={message.id} message={message} fileBaseUrl={fileBaseUrl} />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {activeConversationId && storeUrl && (
                                    <div className="chat-box__footer">
                                        <div className="chat-send-area">
                                            <form className="send__msg" id="messageForm" onSubmit={sendMessage} data-store-url={storeUrl}>
                                                {files.length > 0 && (
                                                    <div className="files-here show">
                                                        <span>
                                                            Selected <b>{files.length}</b> Files
                                                            <i
                                                                className="las la-times removeFile"
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => setFiles([])}
                                                            />
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="d-flex align-center gap-2">
                                                    <div className="input-group">
                                                        <textarea
                                                            className="form--control form-control"
                                                            id="messageInput"
                                                            name="message"
                                                            value={text}
                                                            onChange={(e) => setText(e.target.value)}
                                                            placeholder="Type your message here ..."
                                                            rows={1}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    sendMessage(e);
                                                                }
                                                            }}
                                                        />
                                                        <span className="btn--base btn-sm chat-send-btn">
                                                            <label htmlFor="chatFileUpload">
                                                                <i className="las la-paperclip" />
                                                            </label>
                                                            <input
                                                                className="messageFileUpload"
                                                                id="chatFileUpload"
                                                                type="file"
                                                                hidden
                                                                multiple
                                                                accept="image/jpg,image/jpeg,image/png,.pdf,.docx,.doc"
                                                                onChange={(e) => setFiles([...e.target.files])}
                                                            />
                                                        </span>
                                                    </div>
                                                    <button className="chating-btn" type="submit" disabled={sending}>
                                                        <i className="las la-paper-plane" />
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmModal
                show={confirmDelete}
                title="Remove this chat?"
                message="This conversation will be removed from your inbox. You can start a new chat later if needed."
                confirmLabel="Remove chat"
                confirmClass="btn-outline--danger"
                onConfirm={confirmDeleteConversation}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    );
}
