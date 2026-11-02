import '@onigam/lab-kit/styles.css';
import { mountLab } from '@onigam/lab-kit/ui';
import { lab } from './lab';

const mounted = mountLab(lab, {
  app: document.getElementById('app')!,
  viewport: document.getElementById('viewport')!,
  expose: import.meta.env.DEV, // window.__lab = { stage, engine, store } for debugging and tests
});

// The leaf cards of `house` use alpha to coverage, which leaves a partial alpha in the picture, and three's canvas is always transparent: without this the page shows through their edges, in pale dots on the light theme. Black adds nothing to the colour already resolved. Kit request 15.
if (mounted) mounted.stage.renderer.domElement.style.background = '#000';
