// Assembly guide (20 steps), docs/research.md §0.5 and §4.5: how the machine is built, then how it goes up. Steps 1 to 8 are the factory, our reconstruction from the material list (no source gives that order); steps 9 to 20 are the maker's order on the roof, reported.
// Every step ends on its origin. No torque, no tool list, no duration: no source gives one, and nothing here is offered as a procedure. That is said once, at the top, in step 1. `test-stand` is in no step: it is no part of the machine.
// A step plays in one world and shows the parts of that world: `collector` 1-4, `tank-and-tap` 5-8, 18, 19, `rig` 9-17, 20. The filling of the circuit says it is for trained installers.
import type { GuideStep } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from './part-helpers';

/** The closing words of a step: where it comes from. */
export const ORIGIN = {
  reconstruction: l('**Origine** : notre reconstitution.', '**Origin**: our reconstruction.'),
  reported: l('**Origine** : le manuel du constructeur.', '**Origin**: the maker’s manual.'),
  practice: l('**Origine** : pratique courante.', '**Origin**: usual practice.'),
  mixed: l(
    '**Origine** : le manuel du constructeur, et les règles de votre pays.',
    '**Origin**: the maker’s manual, and the rules of your country.',
  ),
} as const;

export const withOrigin = (t: L, o: L): L => l(`${t.fr} ${o.fr}`, `${t.en} ${o.en}`);

export const ASSEMBLY: GuideStep[] = [
  {
    id: 'tray',
    scene: 'collector',
    title: l('Le caisson et sa laine', 'The tray and its blanket'),
    text: withOrigin(
      l(
        'Ce guide est une lecture du manuel du constructeur, pour apprendre : ce n’est pas une procédure, et aucune cote n’est à recopier. Tout commence à l’usine, par le **caisson** en aluminium de 0,7 mm. On y pose l’**isolant arrière**, 38 mm de laine de polyester, qui donne aussitôt leur hauteur aux tubes.',
        'This guide is a reading of the maker’s manual, for learning: it is not a procedure, and no dimension is there to be copied. It all starts in the factory, with the 0.7 mm aluminium **tray**. The **back insulation** goes in, 38 mm of polyester blanket, which at once gives the tubes their height.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['collector-tray', 'back-insulation'],
  },
  {
    id: 'waterway',
    scene: 'collector',
    title: l('Les tubes et les collecteurs', 'The tubes and the headers'),
    text: withOrigin(
      lf(
        'Les 35 **tubes montants** se soudent entre le **collecteur bas** et le **collecteur haut**, tous les {riserPitch}. C’est la seule partie du capteur qui voit le fluide, et son volume de 3,8 L est tout ce que le constructeur publie : le diamètre des tubes, {riserBore}, et celui des collecteurs, {headerBore}, sont nos estimations. Un tel ensemble se contrôle à la pression avant de disparaître sous la plaque.',
        'The 35 **riser tubes** are welded between the **lower header** and the **upper header**, every {riserPitch}. This is the only part of the collector to see the fluid, and its 3.8 L is all the maker publishes: the tubes’ bore, {riserBore}, and the headers’, {headerBore}, are our estimates. Such an assembly is pressure-tested before it disappears under the plate.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['lower-header', 'upper-header', 'riser-tube'],
  },
  {
    id: 'plate',
    scene: 'collector',
    title: l('L’absorbeur', 'The absorber'),
    text: withOrigin(
      l(
        'L’**absorbeur** d’acier se pose sur les tubes, une selle sur chacun : sans bon contact, la chaleur reste dans la tôle. Sa peinture noire au polyester est cuite à l’usine. Une pièce sans mouvement, dont dépend pourtant tout le rendement.',
        'The steel **absorber** goes onto the tubes, a saddle over each: without good contact the heat stays in the sheet. Its black polyester coat is baked on at the factory. A part with no movement, yet the whole efficiency depends on it.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['absorber-plate'],
  },
  {
    id: 'glass',
    scene: 'collector',
    title: l('Le joint, la lame d’air, le verre', 'The seal, the air gap, the glass'),
    text: withOrigin(
      l(
        'Le **joint de vitrage** ferme le caisson, et le **vitrage** de 3,2 mm vient dessus. Entre les deux reste la **lame d’air**, qui n’est pas une pièce : c’est ce qu’on ne remplit pas. Le capteur ne sera plus jamais ouvert : tout ce qu’il contient doit être propre et sec à ce moment-là.',
        'The **glass seal** closes the tray, and the 3.2 mm **glass cover** goes on top. Between them remains the **air gap**, which is no part: it is what you do not fill. The collector will never be opened again: all it holds must be clean and dry at this moment.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['glass-seal', 'air-gap', 'glass-cover'],
  },
  {
    id: 'vessel',
    scene: 'tank-and-tap',
    title: l('La cuve émaillée', 'The enamelled vessel'),
    text: withOrigin(
      l(
        'Dans un second atelier, la **cuve** se roule en acier à bas carbone de 2,5 mm, puis reçoit ses deux couches d’émail vitrifié, cuites l’une après l’autre. Elle est éprouvée à la pression : c’est elle qui tiendra l’eau du réseau.',
        'In a second workshop, the **vessel** is rolled from 2.5 mm low-carbon steel, then gets its two coats of vitreous enamel, baked one after the other. It is pressure-tested: this is what will hold the mains water.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['inner-vessel'],
  },
  {
    id: 'jacket',
    scene: 'tank-and-tap',
    title: l('La double enveloppe et ce qui entre dans la cuve', 'The jacket and what goes into the vessel'),
    text: withOrigin(
      lf(
        'La **double enveloppe** se ferme autour de la moitié basse de la cuve, une fente d’environ {jacketGap}. Dedans, l’**anode** de magnésium, le **diffuseur d’eau froide** en bas et la **sortie d’eau chaude** en haut trouvent leur place : on n’y reviendra que pour l’anode. Leurs formes sont des estimations, seuls leurs rôles sont publiés.',
        'The **jacket** closes round the lower half of the vessel, a gap of about {jacketGap}. Inside, the magnesium **anode**, the **cold water diffuser** at the bottom and the **hot outlet** at the top find their places: only the anode will ever be touched again. Their shapes are estimates, only their roles are published.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['mantle-jacket', 'sacrificial-anode', 'cold-diffuser', 'hot-outlet'],
  },
  {
    id: 'element',
    scene: 'tank-and-tap',
    title: l('La résistance et son thermostat', 'The element and its thermostat'),
    text: withOrigin(
      l(
        'La **résistance d’appoint** gainée de cuivre entre par une trappe à mi-hauteur, avec le **thermostat** juste au-dessus. C’est un choix de place : 150 L chauffés en haut, le reste laissé froid pour le capteur.',
        'The copper-sheathed **booster element** goes in through a hatch at half height, with the **thermostat** just above it. That place is a choice: 150 L heated above, the rest left cold for the collector.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['booster-element', 'tank-thermostat'],
  },
  {
    id: 'skin',
    scene: 'tank-and-tap',
    title: l('La mousse, l’enveloppe et les flasques', 'The foam, the case and the end caps'),
    text: withOrigin(
      l(
        'L’**enveloppe aluminium** de 0,4 mm et les **flasques** noirs ferment le tout, et la **mousse isolante** s’injecte dans l’espace qui reste : elle fait du ballon un bloc rigide. Après cela, ce qui est dedans n’est plus accessible que par la trappe. Le ballon est fini : 107 kg, 2,31 m de long.',
        'The 0.4 mm **aluminium case** and the black **end caps** close it all, and the **insulating foam** is injected into the space left: it turns the tank into one rigid block. After that, what is inside can only be reached through the hatch. The tank is finished: 107 kg, 2.31 m long.',
      ),
      ORIGIN.reconstruction,
    ),
    parts: ['tank-foam', 'outer-case', 'end-cap'],
  },
  {
    id: 'rail',
    scene: 'rig',
    title: l('Sur le toit : le rail et ses feuillards', 'On the roof: the rail and its straps'),
    text: withOrigin(
      lf(
        'Tout le reste est dans l’ordre du constructeur. Le **rail de pied** se pose à 2 050 mm sous le liteau du pied du ballon, ses **feuillards de capteur** accrochés dessous et fixés aux chevrons sous les tuiles. Un côté se relève de 12 mm par capteur, soit {railRaiseAll} : la machine finit à {railAngle} de l’équerre, à dessein, et non par erreur.',
        'From here on it is the maker’s order. The **collector rail** goes 2,050 mm below the batten of the tank’s foot, its **collector straps** hooked beneath and fixed to the rafters under the tiles. One side is raised 12 mm per collector, so {railRaiseAll}: the machine ends up {railAngle} out of square, on purpose, not by mistake.',
      ),
      ORIGIN.reported,
    ),
    parts: ['collector-rail', 'collector-strap'],
    tip: l(
      'La raison de ce relevé n’est pas écrite dans ce que nous avons lu. Notre lecture : les collecteurs montent vers un seul coin, et l’air y trouve sa sortie.',
      'The reason for this raise is not written in what we read. Our reading: the headers climb towards one corner, where the air finds its way out.',
    ),
  },
  {
    id: 'collectors',
    scene: 'rig',
    title: l('Les capteurs, encore dans leur carton', 'The collectors, still in their cartons'),
    text: withOrigin(
      l(
        'Le **capteur de gauche** et le **capteur de droite** se posent dans le rail. Ils gardent leur carton jusqu’à la fin : sans fluide, en plein soleil, un capteur devient brûlant, et le constructeur veut qu’on le découvre le plus tard possible.',
        'The **left collector** and the **right collector** go into the rail. They keep their cartons until the very end: with no fluid, in full sun, a collector gets scorching, and the maker wants it uncovered as late as possible.',
      ),
      ORIGIN.reported,
    ),
    parts: ['collector-left', 'collector-right'],
    warning: l(
      'Un capteur au soleil brûle les mains : le carton reste en place. Et un toit glisse : un engin de levage, et personne seul là-haut.',
      'A collector in the sun burns hands: the carton stays on. And a roof slips: a lifting device, and nobody alone up there.',
    ),
  },
  {
    id: 'link',
    scene: 'rig',
    title: l('Le raccord entre capteurs', 'The collector connector'),
    text: withOrigin(
      lf(
        'Les **raccords entre capteurs** unissent les collecteurs voisins, en haut et en bas, par-dessus le jour de {gapBank} : à partir de là, il n’y a plus qu’une rangée de {risersAll} tubes. Ces joints travailleront chaque jour : ils demandent plus de soin qu’ils n’en ont l’air.',
        'The **collector connectors** join the neighbouring headers, above and below, across the {gapBank} gap: from here on, there is one bank of {risersAll} tubes. These joints will work every day: they need more care than they look.',
      ),
      ORIGIN.reported,
    ),
    parts: ['collector-link'],
  },
  {
    id: 'corners',
    scene: 'rig',
    title: l('Le remplissage et le bouchon', 'The fill and the plug'),
    text: withOrigin(
      l(
        'Le **remplissage** se visse au coin bas à gauche, le **bouchon haut** au coin haut à droite. Une diagonale entière les sépare : le fluide qui entrera chassera l’air devant lui, et rien ne devra rester au point haut.',
        'The **fill assembly** screws on at the low left corner, the **collector plug** at the top right corner. A whole diagonal parts them: the incoming fluid will drive the air ahead of it, and nothing must stay at the high point.',
      ),
      ORIGIN.reported,
    ),
    parts: ['fill-port', 'top-plug'],
  },
  {
    id: 'spacers',
    scene: 'rig',
    title: l('Les cales du ballon', 'The tank’s spacers'),
    text: withOrigin(
      lf(
        'Deux **cales capteur-ballon** se placent en haut des capteurs, à 200 mm de leurs bords extérieurs. Ce geste discret fixe la grandeur dont tout dépend la nuit : le bas du ballon va se retrouver au niveau du haut des capteurs, à {yBand} près.',
        'Two **tank-to-collector spacers** go on top of the collectors, 200 mm from their outer edges. This quiet gesture sets the quantity everything hangs on at night: the bottom of the tank will end up level with the top of the collectors, within {yBand}.',
      ),
      ORIGIN.reported,
    ),
    parts: ['tank-spacer'],
  },
  {
    id: 'tank',
    scene: 'rig',
    title: l('Le ballon sur ses cales', 'The tank onto its spacers'),
    text: withOrigin(
      l(
        'Le **ballon** vide, 107 kg sur 2,31 m, se lève, se pose plus haut sur la pente, puis glisse jusqu’à ses cales. Un engin de levage est de rigueur : une fois rempli, il ne bougera plus.',
        'The empty **tank**, 107 kg over 2.31 m, is lifted, set higher up the slope, then slid down onto its spacers. A lifting device is a must: once filled, it will not move again.',
      ),
      ORIGIN.reported,
    ),
    parts: ['storage-tank'],
  },
  {
    id: 'tank-straps',
    scene: 'rig',
    title: l('Les feuillards du ballon', 'The tank’s straps'),
    text: withOrigin(
      lf(
        'Les **feuillards du ballon** passent par-dessus et se fixent aux chevrons. Ils tiennent ce qui pèsera {loadLine} en charge, contre la pente et contre le vent. Le constructeur donne leur existence, leur nombre et leur taille restent de notre dessin.',
        'The **tank straps** pass over and fix to the rafters. They hold what will come to {loadLine} when full, against the slope and the wind. The maker gives their existence; their number and size stay those of our drawing.',
      ),
      ORIGIN.reported,
    ),
    parts: ['tank-strap'],
  },
  {
    id: 'cold-first',
    scene: 'rig',
    title: l('Le tuyau froid d’abord, côté ballon d’abord', 'The cold pipe first, tank side first'),
    text: withOrigin(
      lf(
        'Le constructeur est précis : le **tuyau froid** se pose avant le chaud, et d’abord côté ballon. Il descend le long du côté droit, environ {coldPipe}, jusqu’au coin bas du capteur de droite, et se clipse au caisson.',
        'The maker is precise: the **cold pipe** goes on before the hot one, and tank side first. It runs down the right side, about {coldPipe}, to the low corner of the right collector, and clips onto the tray.',
      ),
      ORIGIN.reported,
    ),
    parts: ['cold-pipe'],
  },
  {
    id: 'hot-second',
    scene: 'rig',
    title: l('Le tuyau chaud, écrou côté capteur d’abord', 'The hot pipe, collector-side nut first'),
    text: withOrigin(
      lf(
        'Le **tuyau chaud** forme un petit U, environ {hotPipe}, du coin haut du capteur de gauche au bout gauche du ballon. Ici c’est l’écrou côté capteur qu’on serre le premier : l’inverse du froid. Les deux tuyaux n’ont pas besoin d’isolant sur un toit de tuiles, dit le manuel.',
        'The **hot pipe** forms a small U, about {hotPipe}, from the top corner of the left collector to the left end of the tank. Here the collector-side nut is tightened first: the reverse of the cold pipe. The two pipes need no insulation on a tiled roof, says the manual.',
      ),
      ORIGIN.reported,
    ),
    parts: ['hot-pipe'],
  },
  {
    id: 'tank-valves',
    scene: 'tank-and-tap',
    title: l('Les deux soupapes du ballon', 'The tank’s two relief valves'),
    text: withOrigin(
      l(
        'La **soupape température-pression** se visse au ballon, à 99 °C et 1 000 kPa, et la **soupape du circuit**, à 80 kPa, sur l’autre eau. Deux réglages très éloignés pour deux liquides que sépare une seule paroi. Sur chacune se branchera une évacuation : jamais de bouchon.',
        'The **temperature and pressure relief valve** screws onto the tank, at 99 °C and 1,000 kPa, and the **jacket relief valve**, at 80 kPa, on the other liquid. Two settings far apart for two liquids parted by a single wall. A drain will go on each: never a plug.',
      ),
      ORIGIN.reported,
    ),
    parts: ['tpr-valve', 'jacket-relief-valve'],
  },
  {
    id: 'fill-water',
    scene: 'tank-and-tap',
    title: l('L’eau d’abord, avant le circuit', 'Water first, before the circuit'),
    text: withOrigin(
      l(
        'Le ballon se remplit d’eau du réseau, en purgeant par un robinet, jusqu’à ce que la **colonne d’eau** soit complète : 300 L, qui pèsent maintenant sur le toit. L’ordre est imposé par le manuel : **l’eau du ballon avant le fluide du circuit**, toujours. Coupez la résistance à l’interrupteur tant que cette étape n’est pas finie.',
        'The tank fills from the mains, bleeding through a tap, until the **water column** is complete: 300 L, now weighing on the roof. The manual sets the order: **the tank’s water before the circuit’s fluid**, always. Keep the element off at the isolator until this step is done.',
      ),
      ORIGIN.reported,
    ),
    parts: ['water-column'],
  },
  {
    id: 'fill-circuit',
    scene: 'rig',
    title: l('Le circuit fermé, par des personnes formées', 'The closed circuit, by trained people'),
    text: withOrigin(
      lf(
        'Dernier geste : le circuit se remplit par siphon, jusqu’à 19 L, avec une bouteille de 4,5 L de glycol bleu pour une machine standard, capteurs toujours couverts. La **vanne anti-surchauffe**, en option, et le **vase du circuit** sont sur ce chemin : leurs places sont nos estimations, le manuel ne les dessine pas. On retire enfin les cartons, et la machine commence à chauffer. Elle vient de se mettre en route toute seule : il n’y a rien à allumer.',
        'The last move: the circuit is filled by siphon, up to 19 L, with one 4.5 L bottle of blue glycol for a standard machine, the collectors still covered. The optional **overheat valve** and the **circuit reservoir** are on this path: their places are our estimates, since the manual does not draw them. Then the cartons come off, and the machine starts to heat. It has just started by itself: there is nothing to switch on.',
      ),
      ORIGIN.reported,
    ),
    parts: ['overheat-valve', 'overflow-reservoir'],
    warning: l(
      'Le manuel réserve le remplissage du circuit à des installateurs formés : ce n’est pas un geste de particulier.',
      'The manual keeps the filling of the circuit to trained installers: this is no job for a home owner.',
    ),
  },
];
