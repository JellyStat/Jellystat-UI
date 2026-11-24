const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPublicIpv4(ip: string): boolean {
  const m = IPV4.exec(ip);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if (m.slice(1).some((part) => Number(part) > 255)) return false;

  if (a === 0 || a === 10 || a === 127) return false; // "this" network, private, loopback
  if (a === 100 && b >= 64 && b <= 127) return false; // carrier-grade NAT
  if (a === 169 && b === 254) return false; // link-local
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 168) return false; // private
  if (a >= 224) return false; // multicast and reserved
  return true;
}

function isPublicIpv6(ip: string): boolean {
  const addr = ip
    .toLowerCase()
    .replace(/^\[|\]$/g, '')
    .split('%')[0];
  if (!addr.includes(':') || !/^[0-9a-f:.]+$/.test(addr)) return false;

  // IPv4-mapped (::ffff:1.2.3.4) follows the IPv4 rules
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(addr);
  if (mapped) return isPublicIpv4(mapped[1]);

  if (addr === '::' || addr === '::1') return false; // unspecified, loopback
  if (/^fe[89ab]/.test(addr)) return false; // link-local fe80::/10
  if (/^f[cd]/.test(addr)) return false; // unique local fc00::/7
  if (addr.startsWith('ff')) return false; // multicast
  return true;
}

// True when the address is a public one worth a geolocation lookup.
export function isRemoteIp(ip: string): boolean {
  const trimmed = ip.trim();
  return isPublicIpv4(trimmed) || isPublicIpv6(trimmed);
}
