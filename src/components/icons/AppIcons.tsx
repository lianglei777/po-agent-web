import { SvgIcon, type IconProps } from "./SvgIcon";

export function ArrowLeftIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M19 12H5m6-6-6 6 6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="m12 3 8 4.5-8 4.5-8-4.5L12 3Zm-8 9 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </SvgIcon>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M20.4 15.2A8.5 8.5 0 0 1 8.8 3.6 8.5 8.5 0 1 0 20.4 15.2Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

export function PanelLeftIcon({
  showExpandIndicator = false,
  ...props
}: IconProps & { showExpandIndicator?: boolean }) {
  return (
    <SvgIcon {...props}>
      <rect
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="19"
        x="2.5"
        y="3"
      />
      <path
        d="M8 3v18M5.25 7h.5M5.25 10h.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      {showExpandIndicator && (
        <path
          d="m13 9 3 3-3 3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
    </SvgIcon>
  );
}

export function PanelRightIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <rect
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="19"
        x="2.5"
        y="3"
      />
      <path d="M16 3v18" stroke="currentColor" strokeWidth="1.8" />
    </SvgIcon>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <SvgIcon {...props}>
      <circle
        cx="12"
        cy="12"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </SvgIcon>
  );
}
