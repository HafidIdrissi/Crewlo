import { communityLinks } from '@shared/communityLinks';

export function CommunityLinks() {
  return <details className="cth-titlebar-nodrag crewlo-community">
    <summary aria-label="Soutenir Crewlo" title="Soutenir Crewlo">♡ <span>Soutenir</span></summary>
    <div className="crewlo-community-menu">
      <strong>Faire grandir Crewlo</strong>
      <button disabled={!communityLinks.repositoryUrl} onClick={() => { if (communityLinks.repositoryUrl) void window.cth.openExternal(communityLinks.repositoryUrl); }}>☆ Star sur GitHub</button>
      <button disabled={!communityLinks.coffeeUrl} onClick={() => { if (communityLinks.coffeeUrl) void window.cth.openExternal(communityLinks.coffeeUrl); }}>☕ Buy Me a Coffee</button>
      {!communityLinks.coffeeUrl && <small>Le lien de soutien sera disponible une fois le compte du créateur configuré.</small>}
    </div>
  </details>;
}
