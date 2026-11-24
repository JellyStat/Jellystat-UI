import { isRemoteIp } from './isRemoteIp';

describe('isRemoteIp', () => {
  it.each([
    '8.8.8.8',
    '203.0.113.7',
    '172.32.0.1',
    '100.128.0.1',
    '2001:4860:4860::8888',
    '::ffff:8.8.8.8',
  ])('treats %s as remote', (ip) => expect(isRemoteIp(ip)).toBe(true));

  it.each([
    '10.0.0.1',
    '172.16.5.4',
    '192.168.1.10',
    '127.0.0.1',
    '169.254.1.1',
    '100.64.0.1',
    '0.0.0.0',
    '256.1.1.1',
    '::1',
    'fe80::1%eth0',
    'fd12:3456::1',
    '::ffff:192.168.1.1',
    '',
    'not-an-ip',
  ])('treats %s as local or invalid', (ip) => expect(isRemoteIp(ip)).toBe(false));
});
