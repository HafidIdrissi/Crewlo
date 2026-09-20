import { PixelPanel } from './PixelPanel';

export function SettingsHeroCard() {
  return <PixelPanel style={{ padding: 20, marginBottom: 16 }}>
    <h2 style={{ margin: '0 0 8px', fontSize: 24, letterSpacing: -1 }}>Crewlo</h2>
    <p style={{ margin: '0 0 12px' }}>A shared studio for real work with AI agents.</p>
    <p style={{ fontSize: 12, color: 'var(--cth-ink-500)', margin: 0 }}>
      An independent visual fork of <a href="https://github.com/chaitanyagiri/munder-difflin" target="_blank" rel="noreferrer">Munder Difflin</a>, by Chaitanya Giri and contributors (MIT).
      Crewlo’s original studio and figurines are MIT-licensed procedural artwork.
      Bundled legacy tilesets by <a href="https://limezu.itch.io/" target="_blank" rel="noreferrer">LimeZu</a> retain their separate license.
      Inter and JetBrains Mono are distributed under the SIL Open Font License.
    </p>
  </PixelPanel>;
}
