// Installation guide (10 steps): how the machine joins the house, reported where the manual speaks (docs/research.md §0.5, §4.5), said generally where it is the country's rule. It crosses `house` and `tank-and-tap`: a step plays in one world, so the valves on the cold line and the shower have steps of their own.
// `hot-line` comes with `cold-main` in step 4, and the first sun closes on the machine again. Warnings once each, where the gesture is risky: the roof in step 3, the scald in step 7, mains current in step 8, the hot relief in step 9.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { ORIGIN, withOrigin } from './assembly';
import { lf } from './part-helpers';

export const INSTALL: GuideStep[] = [
  {
    id: 'place',
    scene: 'house',
    title: l('Trouver la place : du soleil, toute l’année', 'Find the place: sun, all year'),
    text: withOrigin(
      l(
        'Cette lecture du manuel n’est pas une procédure : elle montre pourquoi chaque geste existe. La première règle regarde l’**olivier** autant que le toit : aucune ombre, à aucune saison, sur les capteurs. Le toit fait face à l’équateur, à une pente de 90 à 100 % de la latitude, entre 10° et 30° sans cadre. 20° d’écart coûtent environ 10 % par an, 45° d’écart au sud 4 à 5 %.',
        'This reading of the manual is no procedure: it shows why each gesture exists. The first rule looks at the **olive tree** as much as the roof: no shade, in any season, on the collectors. The roof faces the equator, at a pitch of 90 to 100% of the latitude, between 10° and 30° without a frame. 20° off costs about 10% a year, 45° off south 4 to 5%.',
      ),
      ORIGIN.reported,
    ),
    parts: ['shade-tree'],
    tip: l(
      'Faites tourner l’heure et le mois dans la Simulation : l’arc du soleil et les ombres de ce monde suivent le lieu choisi.',
      'Move the hour and the month in the Simulation: the sun’s arc and the shadows of this world follow the chosen place.',
    ),
  },
  {
    id: 'carry',
    scene: 'house',
    title: l('Le toit peut-il porter 515 kg ?', 'Can the roof carry 515 kg?'),
    text: withOrigin(
      lf(
        'Avant le moindre achat, on regarde les **chevrons et liteaux** et, si possible, le **mur porteur** dessous. Le poids moyen, {loadArea}, est trompeur : tout se joue à la ligne des {loadLine} sous le ballon. Le constructeur juge « souhaitable » de le reporter sur un mur porteur, et demande l’avis d’un charpentier ou d’un ingénieur si l’on doute.',
        'Before buying anything, look at the **rafters and battens** and, if possible, the **load-bearing wall** beneath. The average weight, {loadArea}, misleads: all is decided at the line of {loadLine} under the tank. The maker calls bracing on a load-bearing wall “advisable”, and asks for the view of a builder or engineer in any doubt.',
      ),
      ORIGIN.reported,
    ),
    parts: ['roof-structure', 'load-bearing-wall'],
  },
  {
    id: 'lift',
    scene: 'house',
    title: l('Les tuiles soulevées, la machine sur le toit', 'Tiles lifted, the machine on the roof'),
    text: withOrigin(
      l(
        'Les **tuiles** se soulèvent là où passeront les feuillards, et reprennent ensuite leur place. Le **chauffe-eau** monte par pièces, comme le montre le guide de montage, jamais d’un seul bloc plein : un toit de maison n’est pas fait pour recevoir 515 kg à la fois, ni pour qu’on y manœuvre avec.',
        'The **tiles** lift where the straps will pass, then go back. The **roof unit** goes up in pieces, as the assembly guide shows, never as a single full block: a house roof is not made to take 515 kg at once, or for anyone to manoeuvre with it.',
      ),
      ORIGIN.reported,
    ),
    parts: ['roof-tiles', 'roof-unit'],
    warning: l(
      'Travail en hauteur sur une surface qui glisse : engin de levage, protection contre la chute, jamais seul.',
      'Work at height on a surface that slips: a lifting device, protection against falling, never alone.',
    ),
  },
  {
    id: 'lines',
    scene: 'house',
    title: l('Un seul trou, les deux conduites', 'One hole, two lines'),
    text: withOrigin(
      lf(
        'La **traversée de toit** se fait derrière le ballon, au point haut d’une tuile, aussi petite que possible et bien étanchée. Y passent l’**arrivée d’eau froide**, limitée à 680 kPa avec la soupape, 800 kPa sans elle, et la **conduite d’eau chaude**, qui doit supporter la température du ballon : jusqu’à 95 °C, dit le manuel. Sous les fortes gelées, les vannes restent à l’intérieur.',
        'The **roof penetration** goes behind the tank, at the high point of a tile, as small as possible and well sealed. Through it pass the **cold water main**, limited to 680 kPa with the relief valve, 800 kPa without, and the **hot water line**, which must bear the tank’s temperature: up to 95 °C, says the manual. In hard frost, the valves stay indoors.',
      ),
      ORIGIN.reported,
    ),
    parts: ['roof-penetration', 'cold-main', 'hot-line'],
  },
  {
    id: 'cold-valves',
    scene: 'tank-and-tap',
    title: l('Les vannes de l’eau froide, dans l’ordre', 'The cold line’s valves, in order'),
    text: withOrigin(
      lf(
        'L’ordre vient du constructeur : d’abord une vanne d’arrêt, puis le **clapet et robinet d’arrêt**, puis la **soupape d’eau froide**, en dernier, à au moins 1 m du ballon. Cette soupape s’ouvre à 850 kPa, ce qui fait sortir les {expansionL} de la dilatation. Le clapet empêche cette eau de repartir vers la rue, et votre eau tiède de rejoindre celle des voisins.',
        'The order is the maker’s: first an isolating valve, then the **isolating and non-return valve**, then last the **cold relief valve**, at least 1 m from the tank. This valve opens at 850 kPa, letting out the {expansionL} of expansion. The non-return keeps that water from going back to the street, and your lukewarm water from reaching the neighbours’.',
      ),
      ORIGIN.reported,
    ),
    parts: ['trio-valve', 'cold-relief-valve'],
  },
  {
    id: 'drains',
    scene: 'house',
    title: l('Les évacuations : une pente, à l’air libre', 'The drains: a fall, in the open'),
    text: withOrigin(
      l(
        'Chaque soupape a son **évacuation** propre, en pente continue, sur 9 m au plus, et sa fin reste visible. Jamais sur le toit ni dans une gouttière, jamais rallongée, jamais bouchée. Le drain du circuit contient du glycol, qui ne doit pas rejoindre une cuve d’eau de pluie : il y tuerait les algues et salirait l’eau.',
        'Each valve has its own **drain**, in a continuous fall, over 9 m at most, and its end stays in view. Never on the roof or into a gutter, never extended, never blocked. The circuit’s drain holds glycol, which must not reach a rainwater tank: it would kill the algae and foul the water.',
      ),
      ORIGIN.reported,
    ),
    parts: ['drain-outlet'],
  },
  {
    id: 'shower',
    scene: 'tank-and-tap',
    title: l('Le mitigeur, puis la douche', 'The tempering valve, then the shower'),
    text: withOrigin(
      l(
        'Le **mitigeur thermostatique** se pose au plus près de ce qu’il protège, prévu pour 99 °C : le constructeur en demande un dans tous les cas. Sa sortie, à 50 °C au plus, alimente la **douche** et les robinets de salle de bains. Au-delà de ce point, tout le trajet se fait en eau mitigée.',
        'The **tempering valve** goes as near as possible to what it serves, rated for 99 °C: the maker asks for one in every case. Its outlet, at 50 °C at most, feeds the **shower** and the bathroom taps. Beyond that point, the whole way runs on mixed water.',
      ),
      ORIGIN.mixed,
    ),
    parts: ['tempering-valve', 'shower-head'],
    warning: l(
      'L’eau du ballon peut atteindre 95 °C, et brûle un adulte en 2 à 5 secondes à 60 °C, un enfant bien plus vite. Testez l’eau d’une main avant d’entrer dans la douche.',
      'The tank’s water may reach 95 °C, and at 60 °C burns an adult in 2 to 5 seconds, a child far faster. Test the water with a hand before stepping in.',
    ),
  },
  {
    id: 'power',
    scene: 'house',
    title: l('Le courant, seulement ballon plein', 'Current, only with the tank full'),
    text: withOrigin(
      l(
        'Le **tableau et interrupteur** alimente la résistance, en 240 V, de 8 à 15 A. La mise sous tension se fait seulement une fois le ballon plein et purgé : à sec, l’élément grille. L’horloge se règle pour laisser au soleil le temps de faire sa part : en fin de journée, plutôt que le matin.',
        'The **meter box and isolator** feed the element, at 240 V, 8 to 15 A. Power goes on only once the tank is full and bled: run dry, the element burns out. The timer is set to leave the sun time to do its part: late in the day rather than in the morning.',
      ),
      ORIGIN.reported,
    ),
    parts: ['meter-box'],
    warning: l(
      'C’est du courant du réseau, près de l’eau et sur un toit : le raccordement revient à un électricien qualifié.',
      'This is mains current, near water and on a roof: the wiring is for a qualified electrician.',
    ),
  },
  {
    id: 'bleed',
    scene: 'tank-and-tap',
    title: l('Purger, essayer les leviers, regarder les joints', 'Bleed, try the levers, look at the joints'),
    text: withOrigin(
      l(
        'Un robinet ouvert en haut de la maison purge l’air du circuit d’eau potable. On essaie ensuite les leviers de la **soupape température-pression** et de la **soupape d’eau froide** : l’eau doit couler franchement, puis s’arrêter. Puis on suit chaque joint des yeux, à froid. Une fuite trouvée maintenant coûte un serrage ; une fuite trouvée plus tard coûte un plafond.',
        'A tap open at the top of the house bleeds the air from the drinking-water side. Then the levers of the **temperature and pressure relief valve** and the **cold relief valve** are tried: water must run freely, then stop. Then each joint is followed by eye, cold. A leak found now costs a tightening; a leak found later costs a ceiling.',
      ),
      ORIGIN.reported,
    ),
    parts: ['tpr-valve', 'cold-relief-valve'],
    warning: l(
      'Ce qui sort d’une soupape peut être brûlant : tenez-vous à l’écart de la sortie, et ne la bouchez jamais.',
      'What leaves a relief valve may be scalding: stand clear of the outlet, and never block it.',
    ),
  },
  {
    id: 'first-sun',
    scene: 'house',
    title: l('Premier soleil, première douche', 'First sun, first shower'),
    text: withOrigin(
      lf(
        'Le premier jour clair, la machine démarre seule : un **chauffe-eau** ne s’allume pas. Une goutte à l’évacuation pendant la chauffe est normale. Puis viennent les gestes qui restent : manœuvrer les leviers tous les 6 mois, et une révision à 5 ans, où la soupape combinée et l’anode sont remplacées et le niveau du circuit vérifié. Vos règles nationales décident du reste : déclaration de travaux, eau chaude, légionelles, et le panneau Sources en dit ce que nous avons pu lire.',
        'On the first clear day the machine starts by itself: a **roof unit** does not switch on. A drip at the drain during heating is normal. Then come the gestures that remain: work the levers every 6 months, and a service at 5 years, when the combined valve and the anode are replaced and the circuit’s level checked. Your national rules decide the rest: building declarations, hot water, legionella, and the Sources panel says what we could read of them.',
      ),
      ORIGIN.mixed,
    ),
    parts: ['roof-unit'],
  },
];
