import { panelComponentStyles } from './styles/components.ts';
import { panelLayoutStyles } from './styles/layout.ts';
import { panelStyleTokens } from './styles/tokens.ts';

export const panelStyles = [panelStyleTokens, panelLayoutStyles, panelComponentStyles].join('\n');
