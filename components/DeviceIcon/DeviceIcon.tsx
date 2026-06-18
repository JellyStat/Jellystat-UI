import { API_BASE } from "@/lib/api";
import { Globe, Tv, Smartphone, Tablet, Monitor, Gamepad2, Cast } from "lucide-react";

interface DeviceIconProps {
  client: string;
  deviceName: string;
  className?: string;
  deviceIconUrl?: string | null;
}

const SvgApple = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.68.727-1.303 2.181-1.156 3.53 1.35.104 2.628-.48 3.443-1.518z" />
  </svg>
);

const SvgAndroid = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9997.4482.9997.9993.0004.5511-.4486.9997-.9997.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9997.4482.9997.9993 0 .5511-.4486.9997-.9997.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.85 12 7.85s-3.5902.3939-5.1367 1.1004L4.841 5.447a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3436-4.1021-2.6893-7.5743-6.1185-9.4396" />
  </svg>
);

const SvgWindows = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
  </svg>
);

const SvgLinux = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.458 24S.117 21.058.117 12.548C.117 4.038 4.259 0 7.37 0c3.111 0 5.445 1.555 5.445 1.555s1.944-1.555 5.056-1.555c3.111 0 7.259 4.038 7.259 12.548 0 8.51-11.342 11.452-11.342 11.452h-2.33zM7.37 5.056c-1.944 0-3.5 1.945-3.5 3.5S5.426 12.056 7.37 12.056c1.944 0 3.5-1.945 3.5-3.5S9.314 5.056 7.37 5.056zm9.26 0c-1.944 0-3.5 1.945-3.5 3.5s1.556 3.5 3.5 3.5c1.944 0 3.5-1.945 3.5-3.5s-1.556-3.5-3.5-3.5z" />
  </svg>
);

const SvgChrome = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h9.368A12 12 0 0 0 12 0zm0 17.455c-1.756 0-3.327-.832-4.301-2.134L3.003 7.15A12 12 0 0 0 12 24a11.957 11.957 0 0 0 9.585-4.814l-7.284-4.815a5.426 5.426 0 0 1-2.301 3.084zM17.455 12a5.454 5.454 0 0 1-5.455 5.455 5.426 5.426 0 0 1-2.73-.736l-3.952 6.848A11.964 11.964 0 0 0 12 24c6.627 0 12-5.373 12-12h-6.545z" />
  </svg>
);

const SvgFirefox = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.003 0C5.37 0 .003 5.37.003 12c0 6.628 5.367 12 11.99 12 6.628 0 12.007-5.372 12.007-12 0-6.63-5.379-12-12.007-12zM6.945 3.25c2.477-.732 5.253-.356 7.424 1.011 2.17 1.368 3.551 3.549 3.69 6.046a7.482 7.482 0 0 1-1.393 4.675 7.545 7.545 0 0 1-4.108 2.871c-2.49.596-5.18.066-7.185-1.42A7.514 7.514 0 0 1 2.81 9.475a7.464 7.464 0 0 1 4.135-6.225zm8.17 6.467c-.198.814-.852 1.455-1.636 1.597a1.866 1.866 0 0 1-1.921-.767 1.83 1.83 0 0 1-.225-1.916 1.815 1.815 0 0 1 1.734-.99c.797.052 1.503.582 1.776 1.341l.272.735zm-2.074-2.88c-1.303-.538-2.85-.436-4.06.268-1.21.704-1.966 1.99-1.99 3.393-.024 1.403.685 2.716 1.865 3.468 1.18.752 2.71.897 4.029.382l.46-.183-.343.356c-.66.685-1.611 1.054-2.585.999a3.54 3.54 0 0 1-2.42-.988A3.633 3.633 0 0 1 6.81 11.23a3.606 3.606 0 0 1 1.055-2.456 3.552 3.552 0 0 1 2.502-1.026c.969.015 1.894.417 2.568 1.118l.38.396-.272-.444z" />
  </svg>
);

const SvgEdge = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M1.385 11.298C1.884 5.378 6.438 1.258 11.666 1.258c4.321 0 8.006 2.548 9.544 6.304-2.617-2.618-6.666-3.238-9.878-1.428-2.427 1.368-3.797 4.164-3.415 6.948.333 2.451 1.928 4.604 4.177 5.626C6.732 17.518 3.57 14.88 1.385 11.298zm11.96 11.444a11.972 11.972 0 0 1-3.619-.556c4.545-.333 8.353-3.64 9.448-8.103a8.966 8.966 0 0 0-1.892-7.175c2.474 2.89 3.01 6.972 1.355 10.398-1.638 3.393-5.26 5.436-8.911 5.436H13.344zM11.666 0C5.223 0 0 5.223 0 11.666S5.223 23.332 11.666 23.332 23.332 18.109 23.332 11.666 18.109 0 11.666 0z" />
  </svg>
);

const SvgSafari = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.12 7.68l-2.56 9.6a.64.64 0 0 1-.787.453l-9.6-2.56a.64.64 0 0 1-.453-.787l2.56-9.6a.64.64 0 0 1 .787-.453l9.6 2.56a.64.64 0 0 1 .453.787zm-5.76 2.56a1.92 1.92 0 1 0 0 3.84 1.92 1.92 0 0 0 0-3.84z" />
  </svg>
);

const SvgPlayStation = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21.058 15.65c-.097-.07-6.024-2.158-6.024-2.158l-.053 5.28c.033.02 1.48.513 2.656.513 1.56 0 2.213-.393 2.457-.594.33-.275.405-.705.405-1.127 0-.584-.287-1.306-1.488-1.554.492.203.951.52.951 1.05 0 .248-.113.623-.88.857-.611.185-1.572.221-2.1-.22v-3.79s3.045 1.06 4.148 1.472c.433.161.78.337.915.54.195.295.166.726-.062 1.026-.255.335-.86.602-1.896.791a8.47 8.47 0 0 1-2.528.188v1.398a12.873 12.873 0 0 0 3.29-.272c1.471-.322 2.372-.828 2.802-1.392.427-.557.51-1.282.207-1.884-.337-.674-1.168-1.077-2.766-1.636zm-8.835-13.64c0-.448-.363-.805-.804-.805-.444 0-.806.357-.806.805v15.228a.807.807 0 0 0 .806.806.808.808 0 0 0 .804-.806V2.01zm-4.78 11.238c-1.385.452-2.316.89-2.705 1.258-.293.277-.384.621-.384.945 0 .445.244.975 1.137 1.346.745.31 1.764.444 2.89.444.606 0 1.25-.038 1.93-.11v-1.666a7.665 7.665 0 0 1-1.745.2c-.895 0-1.61-.1-2.073-.245-.558-.175-.764-.378-.764-.593 0-.171.127-.37.527-.584.582-.31 1.62-.647 2.888-1.026v-1.272c-.886.291-1.8.625-2.704.993-.82.336-1.57.734-2.128 1.137-.775.56-.99 1.213-.99 1.76 0 .825.568 1.62 1.83 2.155 1.23.518 2.923.754 4.887.754a14.28 14.28 0 0 0 2.222-.163v-1.62a11.166 11.166 0 0 1-1.782.146 11.15 11.15 0 0 1-1.928-.159v-3.791c-1.037.337-2.138.68-3.238.995zM14.636.314A10.744 10.744 0 0 0 9.774 0c-3.111 0-6.177 1.111-8.243 2.502a3.784 3.784 0 0 0-1.267 1.627c-.201.488-.266.974-.266 1.455 0 1.482.906 2.766 2.68 3.666a12.87 12.87 0 0 0 3.253 1.118v-1.7c-.506-.076-1.042-.185-1.573-.346-.967-.291-1.56-.632-1.78-1.023-.195-.347-.197-.732-.01-1.122.257-.542.923-1.066 1.954-1.536C6.732 3.633 9.49 2.71 12.186 2.71c.795 0 1.58.07 2.348.196L14.635.314z" />
  </svg>
);

const SvgXbox = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.973 0C5.358 0 0 5.361 0 11.973c0 6.615 5.358 11.973 11.973 11.973 6.612 0 11.973-5.358 11.973-11.973C23.946 5.361 18.585 0 11.973 0zM12 21.688c-1.378 0-4.04-1.282-5.46-2.176-1.01-.634-1.776-1.428-2.316-2.072 2.75 1.164 6.002 1.258 7.697 1.258 1.705 0 5.068-.087 7.82-1.25-1.066 1.242-2.35 2.062-2.35 2.062-1.42 1.05-4.04 2.178-5.39 2.178zm7.397-5.023c-1.89-1.503-4.145-2.222-6.626-2.225h-1.56c-2.43.003-4.64.72-6.52 2.176-1.636-2.5-1.565-5.59-1.565-5.59 1.902 2.302 4.417 3.86 7.425 4.363 3.037-.53 5.48-2.022 7.488-4.323 0 0 .152 3.064-1.642 5.599z" />
  </svg>
);

const SvgSwitch = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6.864 0a6.85 6.85 0 0 0-6.86 6.864v10.272A6.85 6.85 0 0 0 6.863 24V0h.001zm10.272 0v24a6.85 6.85 0 0 0 6.864-6.864V6.864A6.85 6.85 0 0 0 17.136 0zm-1.848 3.528a2.536 2.536 0 1 1 0 5.072 2.536 2.536 0 0 1 0-5.072zM5.384 10.992a2.536 2.536 0 1 1 0 5.072 2.536 2.536 0 0 1 0-5.072z" />
  </svg>
);

const SvgRoku = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zM8.91 16.44H6.38V7.57h4.88c1.86 0 3.31 1.45 3.31 3.3 0 1.6-1.12 2.94-2.61 3.25l2.76 2.32h-3.15l-2.42-2.14h-.24v2.14zm0-4h2.35c.67 0 1.21-.54 1.21-1.21 0-.67-.54-1.21-1.21-1.21H8.91v2.42z" />
  </svg>
);

// Evaluated top-to-bottom. Most specific targets MUST be at the top!
const DEVICE_RULES = [
  // Browsers
  { regex: /(chrome|chromium)/i, icon: SvgChrome, color: "text-yellow-400" },
  { regex: /(firefox)/i, icon: SvgFirefox, color: "text-orange-500" },
  { regex: /(edge|edg)/i, icon: SvgEdge, color: "text-sky-400" },
  { regex: /(safari)/i, icon: SvgSafari, color: "text-blue-400" },

  // Consoles
  { regex: /(playstation|ps[345]|psvita)/i, icon: SvgPlayStation, color: "text-blue-500" },
  { regex: /(xbox)/i, icon: SvgXbox, color: "text-green-500" },
  { regex: /(nintendo|switch)/i, icon: SvgSwitch, color: "text-red-500" },
  { regex: /(gamepad|console)/i, icon: Gamepad2, color: "text-brand-purple" },

  // Streaming Sticks & Specific TVs
  { regex: /(roku)/i, icon: SvgRoku, color: "text-purple-500" },
  { regex: /(chromecast|cast)/i, icon: Cast, color: "text-brand-cyan" },
  { regex: /(fire(\s)?tv|amazon|kindle)/i, icon: SvgAndroid, color: "text-orange-500" },

  // Primary OS Ecosystems
  { regex: /(apple|mac(os)?|imac|macbook|ios|ipad|iphone|tvos|infuse|swiftfin)/i, icon: SvgApple, color: "text-gray-200" },
  { regex: /(android|shield|findroid|symfonium)/i, icon: SvgAndroid, color: "text-emerald-500" },
  { regex: /(windows|win10|win11)/i, icon: SvgWindows, color: "text-sky-500" },
  { regex: /(linux|ubuntu|debian|arch|mint|fedora|centos|manjaro)/i, icon: SvgLinux, color: "text-yellow-200" },

  // Generic Form Factors (Fallbacks)
  { regex: /(web|browser)/i, icon: Globe, color: "text-brand-purple" },
  { regex: /(tv|bravia|vizio|hisense|tcl|smarttv|lg|webos|samsung|tizen)/i, icon: Tv, color: "text-brand-cyan" },
  { regex: /(tablet)/i, icon: Tablet, color: "text-gray-300" },
  { regex: /(mobile|phone)/i, icon: Smartphone, color: "text-gray-300" },
];

export default function DeviceIcon({ client, deviceName, deviceIconUrl, className = "w-10 h-10" }: DeviceIconProps) {
  if (deviceIconUrl != null && deviceIconUrl !== "") {
    return <img src={deviceIconUrl} alt={`${client} ${deviceName}`} className={`${className} rounded-md object-cover`} />;
  }
  const combinedString = `${client} ${deviceName}`.toLowerCase();

  const matchedRule = DEVICE_RULES.find((rule) => rule.regex.test(combinedString));

  if (matchedRule) {
    const IconComponent = matchedRule.icon;
    return <IconComponent className={`${matchedRule.color} ${className}`} />;
  }

  // Final Fallback for entirely unknown devices
  return <Monitor className={`text-gray-400 ${className}`} />;
}
