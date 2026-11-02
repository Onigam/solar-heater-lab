import { getLang, registerStrings, tx } from '@onigam/lab-kit/i18n';
import {
  ABSORBER_TEXTS,
  ALARM_TEXTS,
  BOOST_TEXTS,
  CIRCUIT_TEXTS,
  PRESET_TEXTS,
  SCENARIO_TEXTS,
  SITE_TEXTS,
  SKY_TEXTS,
  type Pair,
} from '../sim/texts';

// The words of the simulation panel, French and English written together: `key: [fr, en]`. They are kept apart from src/i18n/ui.ts, which belongs to the data role, so that the two can be
// written at the same time. The texts of the alarms and the scenarios come from src/sim/texts.ts.

const PANEL = {
  simTitle2: ['Simulation', 'Simulation'],
  simIntro: [
    'Un modèle du capteur, de la boucle et du ballon, sans pompe et sans commande. Le chiffre du capteur vient d’un certificat indépendant ; les diamètres des tubes et l’échange de la double enveloppe, personne ne les publie : ils sont estimés. Dans cette machine, c’est un mélange d’eau et de glycol qui monte, pas l’eau que l’on boit.',
    'A model of the collector, the loop and the tank, with no pump and no controller. The collector’s figure comes from an independent certificate; the bores of the tubes and the exchange of the double jacket, nobody publishes: they are estimated. In this machine it is a mix of water and glycol that climbs, not the water you drink.',
  ],
  tagLegend: [
    '† résultat du modèle · * estimation : les sources se taisent.',
    '† result of the model · * estimate: the sources are silent.',
  ],
  preset: ['Point de départ', 'Starting point'],
  custom: ['Réglages personnels', 'Custom settings'],
  resetSim: ['Recommencer', 'Start again'],
  scenarios: ['Scénarios', 'Scenarios'],
  scenarioHint: [
    'Chacun raconte une chose. Ils règlent eux-mêmes la vitesse du temps.',
    'Each tells one thing. They set the speed of time themselves.',
  ],
  shower: ['Prendre une douche', 'Take a shower'],

  // ---- the status line
  statusStill: ['Rien ne coule : le fluide attend.', 'Nothing flows: the fluid waits.'],
  statusForward: [
    'La poussée fait tourner la boucle : le chaud monte au ballon, le froid redescend.',
    'The push turns the loop: the warm climbs to the tank, the cold comes back down.',
  ],
  statusBackward: [
    'Le circuit coule à l’envers : le chaud du ballon descend vers le capteur.',
    'The circuit runs backward: the tank’s warmth goes down to the collector.',
  ],
  statusShut: [
    'La vanne de surchauffe a fermé le circuit : le capteur reste seul au soleil.',
    'The overheat valve has shut the circuit: the collector is left alone in the sun.',
  ],
  statusFrost: [
    'Le fluide du capteur a atteint son point de gel. Le modèle s’arrête là : il ne simule pas la glace.',
    'The fluid in the collector has reached its freezing point. The model stops there: it does not simulate ice.',
  ],
  statusLow: [
    'Le ballon est plus froid que ce que la maison demande : l’appoint fait le reste.',
    'The tank is colder than the house asks for: a backup does the rest.',
  ],
  statusOffMachine: [
    'Cette machine tourne dans les chiffres seulement : la 3D montre le ballon du lab.',
    'This machine runs in the figures only: the 3D shows the lab’s tank.',
  ],

  // ---- the live figures
  liveFlow: ['Débit', 'Flow'],
  liveHead: ['Poussée', 'Push'],
  liveOut: ['Sortie capteur', 'Collector out'],
  liveTop: ['Haut du ballon', 'Tank top'],
  liveBottom: ['Bas du ballon', 'Tank bottom'],
  livePlate: ['Plaque − air', 'Plate − air'],
  liveGain: ['Gain', 'Gain'],
  liveLoss: ['Pertes', 'Losses'],
  liveToday: ['Au ballon, ce jour', 'To the tank, today'],
  liveFraction: ['Part solaire, ce jour', 'Solar share, today'],
  liveSun: ['Soleil', 'Sun'],
  liveTap: ['Robinet', 'Tap'],

  moreAir: ['Air', 'Air'],
  moreFloor: ['Plancher de la plaque', 'Floor of the plate'],
  moreIn: ['Entrée du capteur', 'Collector in'],
  moreColdest: ['Point le plus froid', 'Coldest point'],
  moreFreeze: ['Gel du fluide', 'Fluid freezes at'],
  moreMargin: ['Marge au gel', 'Frost margin'],
  moreMean: ['Moyenne du ballon', 'Tank mean'],
  moreSpeed: ['Vitesse dans le tuyau', 'Speed in the pipe'],
  moreCollector: ['Perte du capteur', 'Collector loss'],
  morePipes: ['Perte des tuyaux', 'Pipe loss'],
  moreTank: ['Perte du ballon', 'Tank loss'],
  moreToTank: ['Vers le ballon', 'Into the tank'],
  moreBoost: ['Appoint', 'Booster'],
  moreDrip: ['Goutte de la soupape', 'Relief drip'],
  moreLitres: ['Sortis par dilatation', 'Out by expansion'],
  moreTapFlow: ['Au robinet', 'At the tap'],
  moreDelivered: ['Tiré, ce jour', 'Drawn, today'],
  moreDemand: ['Demande, ce jour', 'Demand, today'],
  moreSun: ['Soleil sur le capteur, ce jour', 'Sun on the collector, today'],

  // ---- the controls
  site: ['Lieu', 'Place'],
  sky: ['Ciel', 'Sky'],
  hour: ['Heure solaire', 'Solar hour'],
  day: ['Jour de l’année', 'Day of the year'],
  tankHeight: ['Hauteur du ballon', 'Height of the tank'],
  tankHeightHint: [
    'Le bas du ballon, au-dessus ou au-dessous du haut du capteur. La vraie machine reste à zéro, sur ses cales : ailleurs, c’est un banc d’essai.',
    'The bottom of the tank, above or below the top of the collector. The real machine stays at zero, on its spacers: anywhere else is a test stand.',
  ],
  checkValve: ['Clapet anti-retour', 'One-way valve'],
  circuit: ['Circuit', 'Circuit'],
  circuitHint: [
    'En direct, c’est l’eau du ballon qui passe dans le capteur : de l’eau chaude qui monte sans pompe, au sens propre, mais elle gèle comme de l’eau.',
    'On direct, it is the tank’s water that crosses the collector: hot water climbing with no pump, to the letter, but it freezes like water.',
  ],
  secMachine: ['La machine', 'The machine'],
  tilt: ['Pente du toit', 'Roof pitch'],
  azimuth: ['Écart à l’équateur', 'Away from the equator'],
  absorber: ['Capteur', 'Collector'],
  glycol: ['Glycol', 'Glycol'],
  pipeInsulation: ['Tuyaux isolés', 'Insulated pipes'],
  overheatValve: ['Vanne de surchauffe', 'Overheat valve'],
  tankLoss: ['Perte du ballon', 'Tank loss'],
  machineHint: [
    'Le constructeur dit que les tuyaux n’ont pas besoin d’isolant sur un toit de tuiles ; une simulation allemande les classe parmi les réglages qui comptent le plus. Essayez.',
    'The maker says the pipes need no insulation on a tiled roof; a German simulation ranks them among the settings that matter most. Try it.',
  ],
  secHouse: ['La maison', 'The house'],
  demand: ['Eau à 45 °C', 'Water at 45 °C'],
  tempering: ['Mitigeur', 'Mixing valve'],
  temperSet: ['Réglage du mitigeur', 'Mixing valve set to'],
  boost: ['Appoint électrique', 'Electric booster'],
  boostPower: ['Puissance de l’appoint', 'Booster power'],
  setPoint: ['Thermostat', 'Thermostat'],
  houseHint: [
    'Soixante degrés au ballon pour les bactéries, cinquante au robinet pour la peau : le mitigeur est entre les deux. À 60 °C un adulte se brûle en quelques secondes, un enfant bien plus vite.',
    'Sixty degrees in the tank for the bacteria, fifty at the tap for the skin: the mixing valve stands between them. At 60 °C an adult burns in a few seconds, a child far faster.',
  ],
  secWeather: ['Le temps qu’il fait', 'The weather'],
  cloud: ['Nuage', 'Cloud'],
  airOffset: ['Décalage de l’air', 'Shift of the air'],
  wind: ['Vent', 'Wind'],
  secEstimates: ['Ce que personne ne publie', 'What nobody publishes'],
  riserBore: ['Diamètre des colonnes', 'Riser bore'],
  pipeBore: ['Diamètre des tuyaux', 'Pipe bore'],
  jacketUA: ['Échange de la double enveloppe', 'Exchange of the double jacket'],
  stratify: ['Chaleur qui rejoint son niveau', 'Heat that reaches its own level'],
  drawMix: ['Mélange de l’entrée froide', 'Mixing at the cold inlet'],
  mixedTank: ['Ballon mélangé', 'Mixed tank'],
  estimatesHint: [
    'Le constructeur pourrait donner la plupart de ces chiffres d’un seul message. Le modèle dit ce qu’ils changent, pas ce qu’ils valent.',
    'The maker could give most of these in one message. The model says what they change, not what they are.',
  ],
  moreTitle: ['Tous les chiffres', 'All the figures'],

  // ---- the charts
  chartLoop: ['La boucle : température selon la hauteur', 'The loop: temperature against height'],
  chartLoopHint: [
    'Deux lignes : ce qui monte et ce qui descend, à chaque hauteur. L’aire entre les deux est la poussée. Quand elles se croisent, la boucle hésite ; quand la descente passe au-dessus, elle part à l’envers.',
    'Two lines: what goes up and what comes down, at each height. The area between them is the push. When they cross, the loop hesitates; when the way down lies above, it runs backward.',
  ],
  chartLayers: ['Le ballon, du bas vers le haut', 'The tank, from bottom to top'],
  chartSweep: ['La nuit, selon la hauteur du ballon', 'The night, by the height of the tank'],
  chartSweepHint: [
    'Sur une journée claire du lieu et du mois choisis : la part de la chaleur du jour repartie au matin. Le seul autre chiffre à cet endroit est un modèle de 1981 pour un ballon debout, et sous zéro personne n’a rien mesuré : la forme de la courbe compte plus que ses valeurs.',
    'On a clear day of the chosen place and month: the share of the day’s heat gone by morning. The only other figure here is a model from 1981 for a standing tank, and below zero nobody has measured anything: the curve’s shape counts more than its values.',
  ],
  chartGain: ['Ce que la journée apporte au ballon', 'What the day brings to the tank'],
  chartGainHint: [
    'Le jour ne regarde pas la hauteur, jusqu’au moment où le ballon passe sous le milieu du capteur : là, plus rien ne monte.',
    'The day does not care about the height, until the tank goes below the middle of the collector: there, nothing climbs any more.',
  ],
  chartPlate: ['La plaque par rapport à l’air, en moyenne la nuit', 'The plate against the air, on average at night'],
  chartPlateHint: [
    'Le même filet qui vole la chaleur tient la plaque au-dessus de ce qu’elle atteindrait seule. Le clapet retire les deux ; au point le plus froid du capteur, ce filet ne gagne presque rien tant que le ballon reste haut.',
    'The same trickle that steals the heat holds the plate above where it would fall alone. The valve takes both away; at the collector’s coldest point this trickle gains almost nothing while the tank stays high.',
  ],
  chartFlow: ['Le débit, ces derniers jours', 'The flow, these last days'],
  chartTemps: ['Les températures, ces derniers jours', 'The temperatures, these last days'],
  chartYear: ['Une année, sur les quatre sites du certificat', 'A year, at the certificate’s four sites'],
  yearHint: [
    'Modèle, puis le résultat publié entre parenthèses quand il existe pour ce réglage : un essai et un calcul selon la norme européenne, pas une mesure d’un an sur un toit. À Davos, le chiffre ne dit pas que la machine y tient : le constructeur la limite au-dessus de −15 °C.',
    'The model, then the published result in brackets when one exists for this setting: a test plus a calculation under the European standard, not a year measured on a roof. At Davos the figure does not say the machine survives there: its maker limits it to above −15 °C.',
  ],
  yearSolar: ['solaire', 'solar'],
  yearFrost: ['h sous le gel', 'h below freezing'],
  computing: ['Calcul en cours…', 'Computing…'],
  seriesUp: ['ce qui monte', 'going up'],
  seriesDown: ['ce qui descend', 'coming down'],
  seriesLayers: ['Eau', 'Water'],
  seriesLost: ['perdu au matin', 'gone by morning'],
  seriesValve: ['avec clapet', 'with the valve'],
  seriesSkin: ['peau du ballon seule', 'tank skin alone'],
  seriesGain: ['sans clapet', 'no valve'],
  seriesFlow: ['Débit', 'Flow'],
  seriesTop: ['Haut', 'Top'],
  seriesBottom: ['Bas', 'Bottom'],
  seriesOut: ['Sortie capteur', 'Collector out'],
  seriesAir: ['Air', 'Air'],
  markNow: ['ici', 'here'],
  markZero: ['zéro', 'zero'],
  unitDays: ['j', 'd'],
  monthShort: [
    'janv.,févr.,mars,avr.,mai,juin,juil.,août,sept.,oct.,nov.,déc.',
    'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec',
  ],

  // ---- the strip
  stripSun: ['Soleil', 'Sun'],
  stripFlow: ['Débit', 'Flow'],
  stripOut: ['Capteur', 'Collector'],
  stripTop: ['Haut', 'Top'],
  stripBottom: ['Bas', 'Bottom'],
  stripGain: ['Gain', 'Gain'],
  stripTap: ['Robinet', 'Tap'],
} as const satisfies Record<string, Pair>;

const fromSim = (prefix: string, table: Record<string, Pair>): Record<string, Pair> =>
  Object.fromEntries(Object.entries(table).map(([k, v]) => [`${prefix}:${k}`, v]));

const SIM_TEXTS: Record<string, Pair> = {
  ...fromSim('alarm', Object.fromEntries(Object.entries(ALARM_TEXTS).map(([k, v]) => [k, v.text]))),
  ...fromSim('preset', PRESET_TEXTS),
  ...fromSim('scenario', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.name]))),
  ...fromSim('lesson', Object.fromEntries(Object.entries(SCENARIO_TEXTS).map(([k, v]) => [k, v.lesson]))),
  ...fromSim('circuit', CIRCUIT_TEXTS),
  ...fromSim('absorber', ABSORBER_TEXTS),
  ...fromSim('boost', BOOST_TEXTS),
  ...fromSim('site', SITE_TEXTS),
  ...fromSim('sky', SKY_TEXTS),
};

/** Every word of the panel, for the parity test. */
export const PANEL_STRINGS: Record<string, Pair> = { ...PANEL, ...SIM_TEXTS };

registerStrings(PANEL_STRINGS);

export type PanelKey = keyof typeof PANEL;

/** A word of the panel in the language of the moment. */
export const st = (key: PanelKey): string => tx(key);

/** A word that comes from the simulation: `sx('alarm', 'frostIce')`. */
export const sx = (
  table: 'alarm' | 'preset' | 'scenario' | 'lesson' | 'circuit' | 'absorber' | 'boost' | 'site' | 'sky',
  id: string,
): string => tx(`${table}:${id}`);

/** A number with the decimal mark of the language; no "-0". */
export function num(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return '—';
  const v = Math.round(Math.abs(value) * 10 ** digits) === 0 ? 0 : value;
  return v.toLocaleString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export const months = (): string[] => st('monthShort').split(',');
