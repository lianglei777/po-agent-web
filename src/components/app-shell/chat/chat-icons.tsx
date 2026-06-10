type ChatIconName = "attach" | "send" | "stop" | "sound";

const iconPaths: Record<ChatIconName, string> = {
  attach:
    "M8.5 12.5 15.7 5.3a3 3 0 0 1 4.2 4.2l-9.2 9.2a5 5 0 0 1-7.1-7.1l8.7-8.7M6.8 14.2l8.5-8.5",
  send: "m4 4 17 8-17 8 3-8-3-8Zm3 8h14",
  stop: "M7 7h10v10H7z",
  sound:
    "M5 10v4h3l4 3V7l-4 3H5Zm10.5-.5a4 4 0 0 1 0 5m2-7a7 7 0 0 1 0 9",
};

export function ChatIcon({
  name,
  size = 15,
}: {
  name: ChatIconName;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d={iconPaths[name]}
        fill={name === "stop" ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

