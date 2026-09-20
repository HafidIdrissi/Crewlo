import { type SidebarTab } from '@/store/store';
import { type AccentColorName } from '@/design/tokens';
import { StudioPanelNav } from './StudioPanelNav';
export interface SidebarTabsProps {
  current: SidebarTab; accent: AccentColorName; onChange: (tab: SidebarTab) => void;
}
export function SidebarTabs({ current, onChange }: SidebarTabsProps) {
  return <StudioPanelNav current={current} onChange={key => onChange(key as SidebarTab)}
    tools={[{ key: 'threads', label: 'Thread replies' }, { key: 'git', label: 'Git & changes' }, { key: 'traces', label: 'Tool traces' }]} />;
}
