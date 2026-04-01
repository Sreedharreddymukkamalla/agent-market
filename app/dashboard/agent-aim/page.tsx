"use client";

import { Button, Dropdown, Separator } from "@heroui/react";
import { AgentsIcon } from "@/components/dashboard/icons";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 8v4l2.5 1.5M21 12a9 9 0 11-9-9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3v6h-6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SpeechBubbleIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M8 17l-4 3v-3H5a3 3 0 01-3-3V7a3 3 0 013-3h14a3 3 0 013 3v7a3 3 0 01-3 3H8z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zM19 10a7 7 0 01-14 0M12 19v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendUpIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M12 18V7M12 7l-4.25 4.25M12 7l4.25 4.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaperclipIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.2-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AgentAimPage() {
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAttachMenu = (key: React.Key) => {
    if (key === "add-files") {
      fileInputRef.current?.click();
      return;
    }
    if (key === "agents") {
      router.push("/dashboard/agents");
    }
  };

  return (
    <div className="relative -m-6 flex min-h-[calc(100vh-7rem)] flex-col bg-background p-6">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        aria-hidden
        tabIndex={-1}
        onChange={() => {}}
      />

      <div className="absolute right-0 top-0 z-10 flex items-center gap-0.5">
        <button
          type="button"
          aria-label="Chat history"
          className="rounded-lg p-2 text-default-500 transition-colors hover:bg-default"
        >
          <HistoryIcon />
        </button>
        <button
          type="button"
          aria-label="Conversations"
          className="rounded-lg p-2 text-default-500 transition-colors hover:bg-default"
        >
          <SpeechBubbleIcon />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-12">
        <div className="w-full max-w-2xl text-left">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-default-900 sm:text-4xl">
            Hello there!
          </h1>
          <p className="mt-2 text-base text-default-500 sm:text-lg">
            Agent Aim is here to help
          </p>
        </div>

        <div className="mt-8 w-full max-w-2xl sm:mt-10">
          <div
            className="flex min-h-[52px] items-center gap-1 rounded-full border border-divider bg-surface py-2 pl-2 pr-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12),0_4px_16px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)]"
          >
            <Dropdown>
              <Dropdown.Trigger
                aria-label="Add attachments and tools"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-foreground outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-focus data-[pressed]:opacity-90"
              >
                <PlusIcon className="text-foreground" />
              </Dropdown.Trigger>
              <Dropdown.Popover
                placement="bottom start"
                offset={8}
                className="rounded-2xl border border-divider bg-overlay p-0 shadow-[var(--overlay-shadow)]"
              >
                <Dropdown.Menu
                  aria-label="Attachments and agents"
                  className="min-w-[260px] gap-0 rounded-2xl p-1.5"
                  onAction={handleAttachMenu}
                >
                  <Dropdown.Item
                    key="add-files"
                    className="cursor-pointer rounded-xl py-2.5 pl-2 pr-3 data-[hovered=true]:bg-default"
                    textValue="Add photos and files"
                  >
                    <span className="flex items-center gap-3">
                      <PaperclipIcon className="shrink-0 text-default-700 dark:text-default-400" />
                      <span className="text-sm font-medium text-default-900">
                        Add photos &amp; files
                      </span>
                    </span>
                  </Dropdown.Item>
                  <Separator orientation="horizontal" className="my-1 h-px bg-divider" />
                  <Dropdown.Item
                    key="agents"
                    className="cursor-pointer rounded-xl py-2.5 pl-2 pr-3 data-[hovered=true]:bg-default"
                    textValue="Agents"
                  >
                    <span className="flex items-center gap-3">
                      <AgentsIcon
                        className="shrink-0 text-default-700 dark:text-default-400"
                        size={20}
                      />
                      <span className="text-sm font-medium text-default-900">
                        Agents
                      </span>
                    </span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>

            <label className="sr-only" htmlFor="agent-aim-input">
              Ask Agent Aim
            </label>
            <textarea
              id="agent-aim-input"
              rows={1}
              placeholder="Ask anything"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="max-h-32 min-h-[40px] flex-1 resize-none border-0 bg-transparent py-2.5 text-base leading-snug text-default-900 outline-none placeholder:text-default-400"
            />

            <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
              <button
                type="button"
                aria-label="Voice input"
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-default"
              >
                <MicIcon />
              </button>
              <Button
                type="button"
                variant="primary"
                isDisabled={!message.trim()}
                className="h-11 w-11 min-w-11 shrink-0 rounded-full p-0"
                aria-label="Send message"
                onPress={() => {}}
              >
                <SendUpIcon className="text-primary-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
