"use client";

import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

type BubblePhase = "hidden" | "typing" | "message";

const getRandomDelay = (min: number, max: number) =>
  Math.round(min + Math.random() * (max - min));

export default function AssistantLauncher({
  open,
  onClick,
  onQuestionClick,
  productPage = false,
  allowAutoOpen = false,
  questions = [],
}: {
  open: boolean;
  onClick: () => void;
  onQuestionClick?: (question: string) => void;
  productPage?: boolean;
  allowAutoOpen?: boolean;
  questions?: string[];
}) {
  const autoOpenedRef = useRef(false);
  const bubbleRef = useRef<HTMLButtonElement | null>(null);
  const timersRef = useRef<number[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [bubblePhase, setBubblePhase] = useState<BubblePhase>("hidden");

  useEffect(() => {
    if (!allowAutoOpen) return;
    if (autoOpenedRef.current) return;

    autoOpenedRef.current = true;

    if (open) return;

    const timer = window.setTimeout(() => {
      onClick();
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [allowAutoOpen, open, onClick]);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  useEffect(() => {
    clearTimers();
    setBubblePhase("hidden");

    if (open || questions.length === 0) return undefined;

    const runCycle = () => {
      const startTimer = window.setTimeout(() => {
        setBubblePhase("typing");

        const messageTimer = window.setTimeout(() => {
          setQuestionIndex((current) => {
            if (questions.length <= 1) return 0;
            let next = Math.floor(Math.random() * questions.length);
            if (next === current) next = (next + 1) % questions.length;
            return next;
          });
          setBubblePhase("message");

          const hideTimer = window.setTimeout(() => {
            setBubblePhase("hidden");
            runCycle();
          }, getRandomDelay(6200, 9200));
          timersRef.current.push(hideTimer);
        }, getRandomDelay(900, 1400));
        timersRef.current.push(messageTimer);
      }, getRandomDelay(1800, 5200));

      timersRef.current.push(startTimer);
    };

    runCycle();

    return clearTimers;
  }, [open, questions]);

  useEffect(() => {
    setQuestionIndex(0);
  }, [questions]);

  useEffect(() => {
    if (bubblePhase !== "message") return;
    const bubble = bubbleRef.current;
    if (!bubble) return;
    bubble.classList.remove("assistant-question-bubble-animate");
    void bubble.offsetWidth;
    bubble.classList.add("assistant-question-bubble-animate");
  }, [bubblePhase, questionIndex]);

  const activeQuestion = questions[questionIndex] || questions[0] || "";
  const handleQuestionClick = () => {
    if (onQuestionClick && activeQuestion) {
      onQuestionClick(activeQuestion);
      return;
    }

    onClick();
  };

  return (
    <div
      data-assistant-launcher="true"
      className={`assistant-launcher fixed right-4 z-[45] flex items-end gap-2 md:right-5 ${
        productPage ? "bottom-20 md:bottom-5" : "bottom-5 md:bottom-5"
      } ${open ? "hidden" : "flex"}`}
    >
      {bubblePhase === "typing" ? (
        <button
          type="button"
          onClick={onClick}
          className="assistant-question-bubble assistant-question-bubble-typing"
          aria-label="Open shopping assistant"
        >
          <span />
          <span />
          <span />
        </button>
      ) : null}

      {bubblePhase === "message" && activeQuestion ? (
        <button
          ref={bubbleRef}
          type="button"
          data-question={activeQuestion}
          onClick={handleQuestionClick}
          className="assistant-question-bubble assistant-question-bubble-message assistant-question-bubble-animate"
          aria-label="Open shopping assistant suggestion"
        />
      ) : null}

      <button
        type="button"
        aria-label="Open shopping assistant"
        onClick={onClick}
        className="assistant-launcher-button grid h-14 w-14 shrink-0 place-items-center rounded-full bg-green-700 text-white shadow-[0_18px_45px_rgba(15,23,42,0.28)] transition hover:bg-green-800 active:scale-[0.96]"
      >
        <Bot size={30} />
      </button>

      <style jsx>{`
        .assistant-question-bubble {
          position: relative;
          max-width: min(260px, calc(100vw - 96px));
          min-height: 44px;
          border: 1px solid rgba(15, 23, 42, 0.09);
          border-radius: 16px 16px 5px 16px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
          padding: 11px 14px;
          color: #0f172a;
          box-shadow:
            0 16px 42px rgba(15, 23, 42, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          cursor: pointer;
          transform-origin: right bottom;
          text-align: left;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .assistant-question-bubble::after {
          content: "";
          position: absolute;
          right: -6px;
          bottom: 10px;
          width: 12px;
          height: 12px;
          border-right: 1px solid rgba(15, 23, 42, 0.09);
          border-bottom: 1px solid rgba(15, 23, 42, 0.09);
          background: #f8fafc;
          transform: rotate(-45deg);
        }

        .assistant-question-bubble-message::before {
          content: attr(data-question);
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.35;
        }

        .assistant-question-bubble-typing {
          display: inline-flex;
          width: auto;
          min-width: 62px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 13px 16px;
        }

        .assistant-question-bubble-typing span {
          display: block;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #0f172a;
          opacity: 0.35;
          animation: assistantTypingDot 980ms ease-in-out infinite;
        }

        .assistant-question-bubble-typing span:nth-child(2) {
          animation-delay: 140ms;
        }

        .assistant-question-bubble-typing span:nth-child(3) {
          animation-delay: 280ms;
        }

        .assistant-question-bubble-animate {
          animation: assistantBubbleIn 620ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes assistantTypingDot {
          0%,
          70%,
          100% {
            transform: translateY(0);
            opacity: 0.32;
          }

          35% {
            transform: translateY(-4px);
            opacity: 0.9;
          }
        }

        @keyframes assistantBubbleIn {
          0% {
            opacity: 0;
            clip-path: inset(0 100% 0 0 round 16px);
            transform: translateX(14px) translateY(6px) scale(0.96);
          }

          58% {
            opacity: 1;
            clip-path: inset(0 0 0 0 round 16px);
            transform: translateX(-2px) translateY(0) scale(1.01);
          }

          100% {
            opacity: 1;
            clip-path: inset(0 0 0 0 round 16px);
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        @media (max-width: 380px) {
          .assistant-question-bubble {
            max-width: calc(100vw - 88px);
            padding: 10px 12px;
          }

          .assistant-question-bubble-message::before {
            font-size: 11.5px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .assistant-question-bubble-animate,
          .assistant-question-bubble-typing span {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
