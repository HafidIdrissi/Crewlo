import links from '../../docs/crewlo-links.json';

/** Public project links only. Never substitute the upstream project's beneficiary. */
export function validatedCommunityLinks(input: { repositoryUrl?: unknown; coffeeUrl?: unknown }) {
  const safe = (value: unknown, hosts: string[], path: RegExp): string | undefined => {
    if (typeof value !== 'string') return undefined;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password && !url.port && !url.search && !url.hash && path.test(url.pathname) ? url.href : undefined;
    } catch { return undefined; }
  };
  return {
    repositoryUrl: safe(input.repositoryUrl, ['github.com'], /^\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+\/?$/),
    coffeeUrl: safe(input.coffeeUrl, ['buymeacoffee.com', 'www.buymeacoffee.com'], /^\/[A-Za-z0-9_-]+\/?$/)
  };
}
export const communityLinks = validatedCommunityLinks(links);
