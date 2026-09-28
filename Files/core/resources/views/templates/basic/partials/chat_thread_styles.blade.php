<style>
    /* Compact chat panel — moderate height, not full viewport */
    .chat-page-shell {
        padding: 0.75rem 0 1rem;
    }

    .chatboard-chat-area .row {
        align-items: flex-start;
    }

    .chatboard-chat-left,
    .chat-box {
        height: auto;
        min-height: 0;
    }

    .chat-board-left-item {
        max-height: 420px !important;
        overflow-y: auto;
    }

    .chat-box {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    .chat-box__content {
        padding: 16px 24px;
        height: 400px;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
    }

    .chat-box__thread {
        flex: 1;
        min-height: 0;
        max-height: none !important;
        height: auto !important;
        padding: 0px 20px 0px 0px !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        display: block !important;
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.22) rgba(0, 0, 0, 0.06);
        background: transparent;
    }

    .chat-box__thread::-webkit-scrollbar {
        width: 6px;
    }

    .chat-box__thread::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.05);
        border-radius: 999px;
    }

    .chat-box__thread::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 999px;
    }

    .chat-box__thread::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.3);
    }

    .chat-box__thread .single-message {
        width: 100% !important;
        max-width: 100% !important;
        display: flex !important;
        flex-direction: row !important;
        gap: 0 !important;
        margin: 0 0 0.75rem 0 !important;
        padding: 0 !important;
    }

    .chat-box__thread .single-message:last-child {
        margin-bottom: 0 !important;
    }

    .chat-box__thread .single-message.message--left {
        justify-content: flex-start !important;
    }

    .chat-box__thread .single-message.message--right {
        justify-content: flex-end !important;
    }

    .chat-box__thread .message-content-outer {
        max-width: min(70%, 480px);
        display: flex;
        flex-direction: column;
    }

    .chat-box__thread .single-message.message--left .message-content-outer {
        align-items: flex-start !important;
        margin-right: auto !important;
        margin-left: 0 !important;
    }

    .chat-box__thread .single-message.message--right .message-content-outer {
        align-items: flex-end !important;
        margin-left: auto !important;
        margin-right: 0 !important;
    }

    .chat-box__thread .single-message .message-content {
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0.65rem 0.85rem !important;
        border-radius: 12px !important;
    }

    .chat-box__thread .single-message .message-content::before,
    .chat-box__thread .single-message .message-content::after {
        display: none !important;
    }

    .chat-box__thread .message-sender {
        font-size: 0.68rem !important;
        margin-bottom: 0.25rem !important;
    }

    .chat-box__thread .message-time {
        font-size: 0.7rem !important;
        margin-top: 0.25rem !important;
    }

    .chat-box__thread .message--left .message-sender,
    .chat-box__thread .message--left .message-time {
        text-align: left !important;
    }

    .chat-box__thread .message--right .message-sender,
    .chat-box__thread .message--right .message-time {
        text-align: right !important;
    }

    .chat-box__thread .message--left .message-content {
        background: hsl(var(--white));
        border: 1px solid hsl(var(--black) / 0.08);
    }

    .chat-box__thread .message--right .message-content {
        background: hsl(var(--base) / 0.12);
        border: 1px solid hsl(var(--base) / 0.18);
    }

    .chat-box__thread .message-content .message-text {
        color: hsl(var(--heading-color)) !important;
        font-size: 0.9rem;
        line-height: 1.45;
        margin: 0;
    }

    .chat-box__footer {
        padding: 0.75rem 1rem 1rem !important;
        flex-shrink: 0;
    }

    .chat-send-field .form--control,
    .chat-send-field textarea.form-control {
        min-height: 46px !important;
        padding: 0.65rem 0.85rem !important;
    }

    .chating-btn {
        width: 46px !important;
        height: 46px !important;
        flex-shrink: 0;
    }

    .send__msg .input-group {
        position: relative;
        flex: 1 1 auto;
        min-width: 0;
    }

    .send__msg .chat-send-btn label {
        cursor: pointer;
        margin: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .chat-box__thread .empty-message {
        margin: 2rem auto !important;
        padding: 1.5rem 1rem !important;
    }

    @media (max-width: 991px) {
        .chat-box__content {
            height: 360px;
            padding: 12px 16px;
        }

        .chat-board-left-item {
            max-height: 320px !important;
        }
    }
</style>
