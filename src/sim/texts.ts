import type { SiteId, SkyMode } from './climate';
import type { Absorber, BoostMode, Circuit } from './machine';
import type { AlarmKey, PresetId, ScenarioId } from './types';

// The words the simulation owns, French and English written together. Plain data: the panel registers them with the kit.

export type Pair = readonly [string, string];

export const ALARM_TEXTS: Record<AlarmKey, { text: Pair; severe: boolean }> = {
  tapHot: { text: ['Plus de 50 °C au robinet', 'Over 50 °C at the tap'], severe: true },
  legionellaZone: {
    text: ['Haut du ballon entre 25 et 45 °C depuis des jours', 'Tank top at 25 to 45 °C for days'],
    severe: false,
  },
  frostNear: { text: ['Le fluide approche de son point de gel', 'The fluid nears its freezing point'], severe: false },
  frostIce: { text: ['La glace se forme dans le circuit', 'Ice forms in the circuit'], severe: true },
  tankOver95: { text: ['Ballon au-delà de 95 °C', 'Tank over 95 °C'], severe: true },
  reliefOpen: { text: ['La soupape du ballon s’est ouverte', 'The tank’s relief valve has opened'], severe: true },
  overheatShut: {
    text: ['La vanne de surchauffe a fermé le circuit', 'The overheat valve has shut the circuit'],
    severe: false,
  },
  circuitVented: {
    text: [
      'Le circuit fermé atteint son ébullition : il dégaze',
      'The closed circuit reaches its boiling point: it vents',
    ],
    severe: true,
  },
  reverseFlow: { text: ['Le circuit coule à l’envers', 'The circuit runs backward'], severe: false },
};

export const PRESET_TEXTS: Record<PresetId, Pair> = {
  'family-300': ['300 L, deux capteurs (le lab)', '300 L, two collectors (the lab)'],
  'lbl-1981': ['Le modèle de Berkeley, 1981', 'The Berkeley model, 1981'],
  'cyprus-1': ['Chypre, système 1 (mesuré, de nuit)', 'Cyprus, system 1 (measured at night)'],
  'cyprus-2': ['Chypre, système 2 (mesuré, de nuit)', 'Cyprus, system 2 (measured at night)'],
  'cyprus-3': ['Chypre, système 3 (mesuré, de nuit)', 'Cyprus, system 3 (measured at night)'],
  'isfh-200': ['200 L en double enveloppe, banc d’essai allemand', '200 L double jacket, a German test bench'],
  'ingolstadt-180': ['180 L à eau, Ingolstadt', '180 L on water, Ingolstadt'],
};

export const SCENARIO_TEXTS: Record<ScenarioId, { name: Pair; lesson: Pair }> = {
  'first-light': {
    name: ['Le premier rayon', 'First light'],
    lesson: [
      'L’aube, lentement. Le capteur se réchauffe longtemps sans que rien ne bouge : il doit d’abord remonter du froid de la nuit et dépasser le fluide des tuyaux. Puis la poussée vainc le frottement et le fluide démarre, sans moteur et sans commande.',
      'Dawn, slowly. The collector warms for a long time with nothing moving: it must first climb back from the night’s cold and pass the fluid in the pipes. Then the push beats the friction and the fluid starts, with no motor and no controller.',
    ],
  },
  'june-day': {
    name: ['Une journée de juin', 'A June day'],
    lesson: [
      'Une journée claire entière. Le débit suit le soleil, les couches du ballon montent par le haut : le froid reste au fond, et c’est lui qui retourne au capteur, là où il travaille le mieux.',
      'A whole clear day. The flow follows the sun, the tank’s layers fill from the top: the cold stays at the bottom, and that is what goes back to the collector, where it works best.',
    ],
  },
  'passing-cloud': {
    name: ['Un nuage passe', 'A passing cloud'],
    lesson: [
      'Quelques minutes par seconde. Le débit tombe en une minute ou deux, puis reprend. Le ballon, lui, n’a rien remarqué : ses trois cents litres ne bougent pas pour si peu.',
      'A few minutes per second. The flow falls within a minute or two, then returns. The tank has noticed nothing: its three hundred litres do not move for so little.',
    ],
  },
  'good-night': {
    name: ['Une bonne nuit', 'A good night'],
    lesson: [
      'Le ballon à sa place, le ciel clair. La peau du ballon perd sa part, quoi qu’on fasse. Regardez le débit : un filet à l’envers suffit au modèle, car le ciel refroidit la plaque sous l’air et ce fluide froid veut descendre.',
      'The tank in its place, a clear sky. The tank’s skin loses its share whatever you do. Watch the flow: a backward trickle is enough in the model, because the sky cools the plate below the air and that cold fluid wants to go down.',
    ],
  },
  'bad-tank': {
    name: ['Un ballon trop bas', 'A tank too low'],
    lesson: [
      'Le ballon descend au niveau du capteur. Le soir, le fluide se refroidit là-haut et tombe, le chaud du ballon monte à sa place : le circuit coule à l’envers et le ciel prend la chaleur. Plus bas encore, le modèle ne se charge presque plus le jour, et n’a plus rien à perdre.',
      'The tank comes down level with the collector. In the evening the fluid cools up there and falls, the tank’s warmth rises in its place: the circuit runs backward and the sky takes the heat. Lower still, the model’s tank hardly charges by day, and has nothing left to lose.',
    ],
  },
  'one-way-valve': {
    name: ['Le clapet', 'The one-way valve'],
    lesson: [
      'Le même ballon, un clapet sur le circuit. La fuite de nuit s’arrête. Mais la plaque, que le filet tiédissait, reste plus froide : en moyenne 3 K † de moins. Au point le plus froid, le filet ne gagnait que 1 ou 2 K † : le clapet soigne beaucoup et retire peu, sauf si le gel est juste à la limite.',
      'The same tank, a one-way valve on the circuit. The night’s leak stops. But the plate, which the trickle kept warmer, stays colder: 3 K † less on average. At its coldest point the trickle only gained 1 or 2 K †: the valve cures a lot and takes away little, unless the frost is right at the limit.',
    ],
  },
  frost: {
    name: ['Une nuit de gel', 'A frosty night'],
    lesson: [
      'Une nuit claire à −7 °C. La plaque descend d’environ 6 K † sous l’air : le mélange de cette machine atteint son point de gel vers −3 °C † d’air, et l’eau seule, ensuite, dès +5 °C † d’air. Le modèle s’arrête à la première glace, il ne dit pas si un tube éclate.',
      'A clear night at −7 °C. The plate falls about 6 K † below the air: this machine’s mix reaches its freezing point at about −3 °C † of air, and water alone, next, from +5 °C † of air. The model stops at the first ice, it does not say whether a tube bursts.',
    ],
  },
  'holiday-week': {
    name: ['Une semaine de vacances', 'A holiday week'],
    lesson: [
      'Juillet, personne ne tire d’eau. Le ballon monte de jour en jour, la dilatation fait goutter la soupape froide, puis la vanne de surchauffe ferme le circuit et le capteur reste seul au soleil.',
      'July, nobody draws any water. The tank climbs day after day, the expansion makes the cold relief drip, then the overheat valve shuts the circuit and the collector is left alone in the sun.',
    ],
  },
  'family-morning': {
    name: ['Le matin de la famille', 'The family’s morning'],
    lesson: [
      'Quatre douches de suite. La couche chaude descend, l’eau froide monte par le bas. Pour la troisième on retire le mitigeur : le chiffre du robinet montre pourquoi il est là.',
      'Four showers in a row. The hot layer falls, the cold water rises from the bottom. For the third the mixing valve is taken away: the tap’s figure shows why it is there.',
    ],
  },
  'mixed-tank': {
    name: ['Un ballon mélangé', 'A mixed tank'],
    lesson: [
      'La stratification enlevée à la main : tout le ballon à la même température. Le capteur reçoit plus chaud, perd plus, et le robinet reçoit moins chaud. Comparez l’énergie du soir à celle de la journée de juin.',
      'Stratification taken away by hand: the whole tank at one temperature. The collector receives warmer fluid, loses more, and the tap receives cooler water. Compare the evening’s energy with that of the June day.',
    ],
  },
  'narrow-tubes': {
    name: ['Des tubes trop fins', 'Tubes too narrow'],
    lesson: [
      'Les colonnes réduites à 3 mm, le principe de la grille de frigo. Le frottement monte comme la puissance quatre du diamètre, le débit s’effondre. Regardez l’énergie du soir plutôt que le débit : ce qui survit surprend.',
      'The risers cut to 3 mm, the principle of the fridge grid. Friction climbs as the fourth power of the bore, the flow collapses. Watch the evening’s energy rather than the flow: what survives is a surprise.',
    ],
  },
  'boost-always-on': {
    name: ['L’appoint toujours allumé', 'The booster always on'],
    lesson: [
      'Davos en janvier, l’appoint en marche nuit et jour. Le ballon n’est jamais froid, donc le capteur travaille peu : le soleil a moins de place, et le courant paie ce que le soleil aurait fait.',
      'Davos in January, the booster on night and day. The tank is never cold, so the collector works little: the sun has less room, and the electricity pays for what the sun would have done.',
    ],
  },
};

export const CIRCUIT_TEXTS: Record<Circuit, Pair> = {
  closed: ['Circuit fermé, eau et glycol', 'Closed circuit, water and glycol'],
  direct: ['Direct, l’eau du ballon dans le capteur', 'Direct, the tank’s water in the collector'],
};

export const ABSORBER_TEXTS: Record<Absorber, Pair> = {
  black: ['Peinture noire', 'Black paint'],
  selective: ['Sélectif', 'Selective'],
};

export const BOOST_TEXTS: Record<BoostMode, Pair> = {
  off: ['Arrêté', 'Off'],
  timer: ['Horloge, en fin de journée', 'Timer, late in the day'],
  always: ['Toujours', 'Always'],
};

export const SITE_TEXTS: Record<SiteId, Pair> = {
  athens: ['Athènes', 'Athens'],
  wurzburg: ['Wurtzbourg', 'Würzburg'],
  davos: ['Davos', 'Davos'],
  stockholm: ['Stockholm', 'Stockholm'],
};

export const SKY_TEXTS: Record<SkyMode, Pair> = {
  mean: ['Le jour moyen du mois', 'The month’s mean day'],
  clear: ['Un jour clair', 'A clear day'],
  series: ['Une suite de jours variés', 'A series of varied days'],
};
