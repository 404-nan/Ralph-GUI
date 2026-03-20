import { renderPanelLayout } from './layout.ts';
import { renderPanelScript } from './script/index.ts';
import { panelStyles } from './styles.ts';

export function renderPanelHtml(): string {
  return renderPanelLayout(panelStyles, renderPanelScript());
}
