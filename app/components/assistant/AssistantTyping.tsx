"use client";

export default function AssistantTyping() {
  return (
    <div className="flex w-full items-start px-1 py-1">
      <div className="instagram-typing-bubble" aria-label="Assistant is typing">
        <span className="sr-only">Assistant is typing</span>

        <span className="typing-dot typing-dot-1" />
        <span className="typing-dot typing-dot-2" />
        <span className="typing-dot typing-dot-3" />
      </div>

      <style jsx>{`
        .instagram-typing-bubble {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5.5px;
          min-width: 54px;
          height: 30px;
          padding: 0 13px;
          border-radius: 999px;
          background: #272727;
          box-shadow:
            0 6px 16px rgba(0, 0, 0, 0.14),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #c9c9d3;
          animation: instagramTyping 1.05s infinite ease-in-out;
        }

        .typing-dot-1 {
          animation-delay: 0ms;
        }

        .typing-dot-2 {
          animation-delay: 150ms;
        }

        .typing-dot-3 {
          animation-delay: 300ms;
        }

        @keyframes instagramTyping {
          0%,
          60%,
          100% {
            transform: translateY(0);
            opacity: 0.52;
          }

          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .typing-dot {
            animation: none !important;
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  );
}