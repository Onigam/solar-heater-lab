// Parts of the `rig` world (15): the machine alone, on a piece of the same roof. `test-stand` is no part of the machine, and its sheet says what the drawing does that the model does not. The place of the overheat valve and the mount of the
// reservoir are estimates: the sheets say so. The reason for the rail's 12 mm per collector is said in `collector-rail`, so that 0.66° does not read as a slip.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const RIG_PARTS: PartInfo[] = [
  {
    id: 'collector-left',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Capteur de gauche', 'Left collector'),
    short: l(
      'Le capteur par où le fluide chaud s’en va : le tuyau chaud part de son coin haut, et le remplissage est à son coin bas.',
      'The collector the warm fluid leaves by: the hot pipe starts at its top corner, and the fill is at its low corner.',
    ),
    description: lf(
      'Vu de face, c’est une vitre sombre dans un cadre pâle de {frameWidth} : 1,87 m² d’ouverture sur 2,003 m² hors tout. Sa courbe vient d’un laboratoire indépendant : 0,778 de rendement à température égale, moins 6,541 W/m²K d’écart à l’air, moins un petit terme au carré. Chaque degré au-dessus de l’air coûte, et c’est pour cela qu’il travaille mieux avec du froid. Il contient 3,8 L de fluide et pèse 43 kg à vide, 49 kg plein avec ses raccords. Ce qui se passe dedans se voit dans le monde du capteur.',
      'From the front it is dark glass in a pale frame {frameWidth} wide: 1.87 m² of aperture in 2.003 m² overall. Its curve comes from an independent laboratory: 0.778 of efficiency at equal temperature, less 6.541 W/m²K of difference to the air, less a small squared term. Every degree above the air costs, which is why it works best on cold fluid. It holds 3.8 L of fluid and weighs 43 kg empty, 49 kg full with its fittings. What goes on inside is seen in the collector’s world.',
    ),
    material: l('Acier, aluminium, verre, laine de polyester', 'Steel, aluminium, glass, polyester blanket'),
    qty: 1,
    specs: [
      sp('Ouverture, hors tout', 'Aperture, overall', l('1,87 m², 2,003 m²', '1.87 m², 2.003 m²')),
      sp('Rendement à température égale', 'Efficiency at equal temperature', l('0,778', '0.778')),
      sp('Perte linéaire', 'Linear loss', l('6,541 W/m²K', '6.541 W/m²K')),
      sp('Perte au carré', 'Squared loss', l('0,025 W/m²K²', '0.025 W/m²K²')),
      sp('Fluide', 'Fluid', l('3,8 L', '3.8 L')),
      sp('Masse, vide puis plein', 'Mass, empty then full', '43 kg, 49 kg'),
    ],
    maintenance: maint(
      {
        failure:
          'Un joint de raccord qui suinte, un verre cassé par la grêle ou un choc, une vitre encrassée qui retire un peu de soleil chaque année, sans bruit.',
        check:
          'Une trace bleue sous un raccord dit tout : c’est le colorant du glycol. Une buée permanente sous le verre veut dire que l’étanchéité a lâché.',
        care: 'En général la pluie suffit à nettoyer le verre. Sur un toit sale ou peu pentu, un rinçage de temps en temps, à la fraîche : un capteur en plein soleil est très chaud.',
      },
      {
        failure:
          'A union seeping, glass broken by hail or a knock, a dirty pane quietly taking a little sun each year.',
        check:
          'A blue trace under a union says it all: that is the glycol’s dye. Permanent mist under the glass means the seal has gone.',
        care: 'Rain usually cleans the glass. On a dirty or shallow roof, a rinse now and then, in the cool: a collector in full sun is very hot.',
      },
    ),
    tip: l(
      'Le bouton de cette fiche ouvre un coin du capteur en coupe, avec ses tubes à la couleur de leur température.',
      'The button on this sheet opens a corner of the collector in section, with its tubes in the colour of their temperature.',
    ),
    design: l(
      'Le constructeur a choisi ici une plaque noire plutôt que sélective : plus simple et bien adaptée à une eau peu chaude. Ce choix se discute selon le climat, et la deuxième leçon montre pourquoi.',
      'The maker chose a black plate here rather than a selective one: simpler, and well suited to water that is not very hot. The choice depends on the climate, and the second lesson shows why.',
    ),
  },
  {
    id: 'collector-right',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Capteur de droite', 'Right collector'),
    short: l(
      'Le capteur par où le fluide froid entre, au coin bas ; le bouchon de purge est à son coin haut.',
      'The collector the cold fluid enters by, at its low corner; the bleed plug is at its top corner.',
    ),
    description: lf(
      'Même machine que sa voisine, en miroir pour les raccords. Le tuyau froid arrive à son coin bas, et le fluide traverse la rangée en diagonale pour ressortir tout en haut de l’autre capteur, ce qui fait à peu près le même chemin à chacun des {risersAll} tubes. Sa fiche d’essai dit ce que vaut un capteur sur une journée normale : 6,0 kWh sous 4,7 kWh/m² de soleil, quand il tourne à 5 K au-dessus de l’air, mais 4,0 kWh à 20 K et 0,7 kWh à 50 K. Tout l’art de cette machine est de lui rendre du froid.',
      'The same machine as its neighbour, mirrored for the fittings. The cold pipe reaches its low corner, and the fluid crosses the bank on the diagonal to leave at the very top of the other collector, which gives each of the {risersAll} tubes about the same path. Its test sheet says what a collector is worth on an ordinary day: 6.0 kWh under 4.7 kWh/m² of sun when it runs 5 K above the air, but 4.0 kWh at 20 K and 0.7 kWh at 50 K. The whole art of this machine is to hand it back cold fluid.',
    ),
    material: l('Acier, aluminium, verre, laine de polyester', 'Steel, aluminium, glass, polyester blanket'),
    specs: [
      sp('Journée d’essai, à +5 K', 'Test day, at +5 K', l('6,0 kWh', '6.0 kWh')),
      sp('À +20 K', 'At +20 K', l('4,0 kWh', '4.0 kWh')),
      sp('À +50 K', 'At +50 K', l('0,7 kWh', '0.7 kWh')),
      sp('Soleil de ce jour', 'That day’s sun', l('4,7 kWh/m²', '4.7 kWh/m²')),
    ],
    maintenance: maint(
      {
        failure:
          'Mêmes faiblesses que le capteur de gauche, avec une de plus : c’est lui, à son coin bas, qui reçoit le fluide le plus froid, donc qui gèle le premier.',
        check:
          'En hiver froid, regardez la marge au gel dans « Tous les chiffres » de la Simulation : c’est le pied de ce capteur qu’elle décrit.',
        care: 'Vérifiez le dosage du glycol à la révision. Du fluide trop dilué ne prévient pas avant la première vraie nuit de gel.',
      },
      {
        failure:
          'The same weaknesses as the left collector, plus one: its low corner gets the coldest fluid, so it freezes first.',
        check:
          'In hard winter, watch the frost margin under “All the figures” in the Simulation: it describes the foot of this collector.',
        care: 'Check the glycol’s strength at the service. Over-diluted fluid gives no warning before the first real frosty night.',
      },
    ),
    tip: l(
      'À la pose, ce capteur reste dans son carton jusqu’au bout, comme l’autre : au soleil il brûle en quelques minutes.',
      'At fitting, this collector stays in its carton to the very end, like the other: in the sun it burns within minutes.',
    ),
    design: l(
      'Entrer en bas d’un côté et sortir en haut de l’autre donne à chaque tube une longueur de trajet voisine, sans autre réglage : le débit se partage de lui-même, sans vanne ni pompe.',
      'Going in low on one side and out high on the other gives each tube a similar length of path, with no other adjustment: the flow shares itself out, with no valve or pump.',
    ),
  },
  {
    id: 'collector-link',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Raccord entre capteurs', 'Collector connector'),
    short: lf(
      'Il relie les collecteurs de deux capteurs voisins : les {risersAll} tubes deviennent une seule rangée.',
      'It joins the headers of the two neighbouring collectors: the {risersAll} tubes become one bank.',
    ),
    description: lf(
      'Pour le fluide, il n’y a plus deux capteurs : un raccord en haut, un autre en bas, et les deux collecteurs n’en font qu’un. Ils comblent le jour de {gapBank} entre les caissons, une estimation qui laisse passer le tuyau froid dans la largeur de 2,43 m. Rien de plus discret dans la machine, ni de plus surveillé : c’est le seul joint entre deux pièces qui se dilatent chacune de leur côté, une fois par jour.',
      'For the fluid there are no longer two collectors: one union above, another below, and the two headers become one. They bridge the {gapBank} gap between the trays, an estimate that leaves room for the cold pipe inside the 2.43 m width. Nothing in the machine is more discreet, or more watched: it is the one joint between two parts that each expand their own way, once a day.',
    ),
    material: l('Raccords en laiton', 'Brass unions'),
    qty: 2,
    specs: [
      sp('Rôle', 'Role', l('une rangée de deux capteurs', 'one bank from two collectors')),
      sp('Tubes', 'Tubes', v('{risersAll}')),
      sp('Jour entre capteurs', 'Gap between collectors', v('{gapBank}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un suintement au serrage, qui s’aggrave lentement : le niveau du circuit baisse sur des mois, et l’air finit par arrêter la circulation.',
        check:
          'Une trace bleue et sèche sur le raccord ou le rebord du caisson. Vérifiez à la première chaleur, puis à la révision des 5 ans.',
        care: 'Ne resserrez pas à l’aveugle : le manuel réserve le circuit à des personnes formées, et un resserrage force le collecteur.',
      },
      {
        failure:
          'A seep at the joint, slowly growing: the circuit’s level falls over months, and air ends up stopping the flow.',
        check: 'A dry blue trace on the union or the tray’s edge. Check at the first heat, then at the 5-year service.',
        care: 'Do not retighten blindly: the manual keeps the circuit to trained people, and tightening strains the header.',
      },
    ),
    tip: l(
      'Cette fiche ouverte, l’outil Transparence ne garde en plein que ce raccord : tout le reste s’estompe, tubes compris. Fermez la fiche sans couper l’outil : les tubes colorés se voient à travers le verre, et le raccord se lit comme un simple pont.',
      'With this sheet open, X-ray keeps only this connector solid: everything else fades, tubes included. Close the sheet with the tool still on: the coloured tubes show through the glass, and the connector reads as a simple bridge.',
    ),
    design: l(
      'Mettre deux petits capteurs côte à côte plutôt qu’un grand simplifie tout : un carton qu’une équipe soulève, un verre qui se change seul, et une machine de 180 L qui utilise le même capteur.',
      'Putting two small collectors side by side rather than one large one simplifies everything: a carton a crew can lift, a pane changed on its own, and a 180 L machine using the same collector.',
    ),
  },
  {
    id: 'storage-tank',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Le ballon', 'The storage tank'),
    short: l(
      'Couché en haut du cadre : 300 L d’eau potable, 417 kg en charge, et la double enveloppe qui reçoit la chaleur.',
      'Lying at the top of the frame: 300 L of drinking water, 417 kg full, and the jacket that takes the heat.',
    ),
    description: lf(
      'Depuis l’extérieur, ce n’est qu’un long cylindre d’aluminium de 510 mm sur 2,31 m aux flasques noirs. Dedans, une cuve de 300 L, sa double enveloppe et sa mousse : 107 kg à vide, 417 kg en charge. Il livre 260 L solaires, et 150 L en appoint. L’agence française de l’énergie juge les ballons couchés « bien moins performants », parce qu’ils ont peu de hauteur pour garder chaud et froid séparés. Cette machine couche pourtant le sien, comme plusieurs de ses semblables : un ballon debout, sur un toit à {tiltDrawn}, serait haut, lourd et plein de vent.',
      'From outside, it is just a long aluminium cylinder, 510 mm by 2.31 m, with black end caps. Inside are a 300 L vessel, its jacket and its foam: 107 kg empty, 417 kg full. It delivers 260 L of solar water, and 150 L from the booster. The French energy agency calls horizontal tanks “far less efficient”, since they have little height to keep hot and cold apart. This machine lays its tank flat all the same, as several of its kind do: an upright tank, on a roof at {tiltDrawn}, would stand tall, heavy and full of wind.',
    ),
    material: l(
      'Acier émaillé, mousse de polyuréthane, aluminium, polypropylène',
      'Enamelled steel, polyurethane foam, aluminium, polypropylene',
    ),
    specs: [
      sp('Volume', 'Volume', '300 L'),
      sp('Masse, vide puis plein', 'Mass, empty then full', '107 kg, 417 kg'),
      sp('Livraison solaire', 'Solar delivery', '260 L'),
      sp('Volume d’appoint', 'Boost volume', '150 L'),
      sp('Pertes à l’arrêt', 'Standing loss', l('2,595 kWh en 24 h', '2.595 kWh in 24 h')),
      sp('Énergie, de 20 à 60 °C', 'Energy, from 20 to 60 °C', v('{tankfulKwh}')),
    ],
    maintenance: maint(
      {
        failure:
          'La corrosion quand l’anode est finie : la cuve perce au bout de longues années, et il n’y a pas de réparation. Le dépôt calcaire dans une eau dure, sur la résistance surtout.',
        check:
          'L’anode à 5 ans, comme le constructeur le demande. Une coulée sous le ballon ou un manque d’eau chaude inhabituel méritent une visite.',
        care: 'Une révision à 5 ans. Avant de partir longtemps, pensez à la cuve : après deux semaines sans tirage, voyez la fiche de la cuve émaillée.',
      },
      {
        failure:
          'Corrosion once the anode is spent: the vessel pierces after many years, and there is no repair. Scale in hard water, on the element above all.',
        check:
          'The anode at 5 years, as the maker asks. A run mark under the tank or an unusual lack of hot water deserves a visit.',
        care: 'A service at 5 years. Before a long absence, think of the vessel: after two weeks with no draw, see the enamelled vessel’s sheet.',
      },
    ),
    tip: l(
      'Ce bouton ouvre le ballon en coupe dans le monde suivant, où les dix couches de l’eau se colorent en direct.',
      'This button opens the tank in section in the next world, where the ten layers of water are coloured live.',
    ),
    design: lf(
      'Dans le modèle, un ballon entièrement mélangé retire {mixedYear} de l’année à Athènes : c’est le prix qu’on paierait si ce ballon ne gardait rien de sa hauteur. D’où tous les soins pris pour ne pas remuer l’eau.',
      'In the model, a fully mixed tank takes {mixedYear} off the year at Athens: the price to pay if this tank kept nothing of its height. Hence all the care taken not to stir the water.',
    ),
  },
  {
    id: 'hot-pipe',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Tuyau chaud', 'Hot pipe'),
    short: lf(
      'Le petit tuyau de gauche, d’environ {hotPipe} : ici le fluide monte du capteur vers le ballon, ou redescend s’il coule à l’envers.',
      'The short pipe on the left, about {hotPipe}: here the fluid climbs from the collector to the tank, or comes back down if it runs backward.',
    ),
    description: lf(
      'Rien ne le pousse, sinon la différence de densité entre ce qui monte et ce qui descend. À midi par ciel clair, le modèle trouve {pushPa}, soit {pushMm} d’eau, et ce tout petit effort suffit à faire circuler {peakFlow}. Un seul sens charge le ballon : par ce tuyau, vers lui. La nuit, le capteur refroidit et ce fluide lourd veut redescendre : à la place de la vraie machine, par nuit claire de juin, un filet y coule à l’envers, {nightFlow} en moyenne de minuit à l’aube. Personne ne publie son diamètre : {pipeBore} est une estimation, et le dessin le fait un peu plus court que les {hotPipe} du modèle.',
      'Nothing pushes it, except the difference in density between what climbs and what comes down. At noon under a clear sky, the model finds {pushPa}, or {pushMm} of water, and that tiny effort is enough to move {peakFlow}. Only one direction charges the tank: up this pipe to it. At night the collector cools, and that heavy fluid wants to come back down: at the real machine’s place, on a clear June night, a trickle runs backward here, {nightFlow} as a mean from midnight to dawn. Nobody publishes its bore: {pipeBore} is an estimate, and the drawing makes it a little shorter than the model’s {hotPipe}.',
    ),
    material: l('Tube métallique, écrous de raccord', 'Metal tube, union nuts'),
    specs: [
      sp('Longueur, dans le modèle', 'Length, in the model', v('{hotPipe}')),
      sp('Diamètre intérieur', 'Bore', v('{pipeBore}')),
      sp('Débit à midi', 'Flow at noon', v('{peakFlow}')),
      sp('Vitesse à midi', 'Speed at noon', lf('environ {pipeSpeed}', 'about {pipeSpeed}')),
      sp('Poussée à midi', 'Push at noon', lf('{pushPa}, {pushMm} d’eau', '{pushPa}, {pushMm} of water')),
    ],
    maintenance: maint(
      {
        failure:
          'Un écrou qui suinte, ou une poche d’air au point haut, qui suffit à bloquer une boucle dont la poussée se compte en millimètres d’eau.',
        check:
          'Par beau temps, posez la main sur le tuyau avec prudence : chaud puis tiède selon l’heure. Tiède à midi avec un ballon froid, c’est que rien ne circule.',
        care: 'Le fabricant dit que les tuyaux n’ont pas besoin d’isolant sur un toit de tuiles, et le modèle chiffre le gain d’un isolant à {pipesYearLow} à {pipesYearHigh} sur l’année : pas urgent, sauf si vous passez devant avec un manchon en main.',
      },
      {
        failure:
          'A nut seeping, or an air pocket at the high point, which is enough to stop a loop whose push is measured in millimetres of water.',
        check:
          'In good weather, carefully feel the pipe: hot then warm with the hour. Lukewarm at noon with a cold tank means nothing is moving.',
        care: 'The maker says the pipes need no insulation on a tiled roof, and the model puts the gain from insulation at {pipesYearLow} to {pipesYearHigh} over the year: not urgent, unless you are passing with a sleeve in hand.',
      },
    ),
    tip: lf(
      'Lancez « Le premier rayon » : par un jour clair de juin, à l’heure solaire, la plaque gagne dès {gainStart}, mais le fluide ne bouge que vers {flowStart}. Elle doit d’abord remonter du froid de la nuit.',
      'Run “First light”: on a clear June day, in solar time, the plate is gaining from {gainStart}, but the fluid only moves at about {flowStart}. It must first climb back from the night’s cold.',
    ),
    video: ['00:16'],
    design: lf(
      'Sa forme en U, qui part du coin haut du capteur vers le bout gauche du ballon, vient des dessins du constructeur ; sa longueur, non. Une simulation allemande classe l’isolation de ces tuyaux parmi les réglages qui comptent le plus, pour un autre parcours : sur nos {pipesAll}, le constructeur est plus près du modèle.',
      'Its U shape, from the collector’s top corner to the tank’s left end, comes from the maker’s drawings; its length does not. A German simulation ranks the insulation of these pipes among the settings that matter most, for another layout: on our {pipesAll}, the maker is nearer the model.',
    ),
  },
  {
    id: 'cold-pipe',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Tuyau froid', 'Cold pipe'),
    short: lf(
      'Le long tuyau de droite, environ {coldPipe} : la colonne de fluide refroidi, qui pèse et fait tourner la boucle.',
      'The long pipe down the right, about {coldPipe}: the column of cooled fluid, whose weight turns the loop.',
    ),
    description: lf(
      'Quand le fluide a laissé sa chaleur dans la double enveloppe, il est plus dense et descend. Ce tuyau, le long de tout le côté droit jusqu’au coin bas du capteur, est la moitié lourde de la boucle : c’est lui qui pousse. Il va tellement lentement qu’on peut tout refaire de tête : à {peakFlow}, ses 19 L font le tour en {loopTurn} environ. Au montage, c’est le premier posé, côté ballon d’abord. Quand vous activez « Clapet anti-retour » ou « Tuyaux isolés » dans la Simulation, le clapet ou le manchon apparaissent sur le dessin.',
      'Once the fluid has given up its heat in the jacket, it is denser and comes down. This pipe, along the whole right side to the collector’s low corner, is the heavy half of the loop: it does the pushing. It moves so slowly you can do the sum in your head: at {peakFlow}, the circuit’s 19 L go round in about {loopTurn}. At fitting it goes on first, tank side first. When you switch on “One-way valve” or “Insulated pipes” in the Simulation, the valve or the sleeve appears on the drawing.',
    ),
    material: l('Tube métallique, colliers sur le caisson', 'Metal tube, clips on the tray'),
    specs: [
      sp('Longueur, dans le modèle', 'Length, in the model', v('{coldPipe}')),
      sp('Diamètre intérieur', 'Bore', v('{pipeBore}')),
      sp('Circuit entier', 'Whole circuit', '19 L'),
      sp('Du côté', 'On the side', l('droit', 'right')),
    ],
    maintenance: maint(
      {
        failure:
          'Le gel, s’il reste trop peu de glycol : à fort vent et ciel clair, ce long tuyau exposé refroidit vite. Un collier qui se desserre, et le tuyau frotte contre le caisson.',
        check:
          'Une trace bleue le long du tuyau, et le jeu de chaque collier. Le niveau du circuit se vérifie à la révision des 5 ans.',
        care: 'Laissez-le libre de se dilater entre ses colliers. Pas de bouchon ni de vanne ajoutés sans raison : chaque coude et chaque rétrécissement mangent une poussée déjà minuscule.',
      },
      {
        failure:
          'Frost, if too little glycol is left: in strong wind and clear sky, this long exposed pipe cools fast. A loose clip, and the pipe rubs on the tray.',
        check:
          'A blue trace along the pipe, and the play in each clip. The circuit’s level is checked at the 5-year service.',
        care: 'Leave it free to expand between its clips. No plug or valve added without a reason: every bend and narrowing eats into a push already tiny.',
      },
    ),
    tip: lf(
      'Un clapet doit rester léger : un clapet à ressort ordinaire peut demander plus que les {pushPa} de toute la poussée, et la boucle ne repartirait pas. Le modèle prend un clapet à battant qui s’ouvre à {swingOpen}.',
      'A valve must stay light: an ordinary spring-loaded one can ask for more than the whole push of {pushPa}, and the loop would not start again. The model takes a swing valve opening at {swingOpen}.',
    ),
    design: lf(
      'À cette taille, la friction est surtout laminaire : le débit suit la poussée et le diamètre compte énormément. Dans le modèle, un tuyau de {pipeBore} donne {peakFlow}, et la boucle se règle d’elle-même sur le soleil.',
      'At this size the friction is mostly laminar: the flow follows the push, and the bore matters enormously. In the model, a {pipeBore} pipe gives {peakFlow}, and the loop adjusts itself to the sun.',
    ),
  },
  {
    id: 'collector-rail',
    scene: 'rig',
    category: 'mechanical',
    name: l('Rail de pied', 'Collector rail'),
    short: l(
      'Il porte les capteurs à 2 050 mm sous le liteau du pied du ballon, et se pose un peu de travers, à dessein.',
      'It carries the collectors 2,050 mm below the batten of the tank’s foot, and is set slightly askew, on purpose.',
    ),
    description: lf(
      'Tout part de lui : c’est lui qui fixe où finissent les capteurs et où commence le ballon. Le constructeur demande une chose qui surprend : le relever de 12 mm par capteur d’un côté, soit {railRaiseAll} ici. Tout l’ensemble se retrouve à {railAngle} de l’équerre dans le plan du toit. Ce n’est pas une erreur du dessin, c’est le chiffre du constructeur. Le manuel ne dit pas pourquoi dans ce que nous avons lu ; notre lecture : les collecteurs montent alors vers un seul coin, et l’air comme le fluide chaud n’ont qu’une direction où aller. Le côté relevé, celui du tuyau chaud, est une estimation.',
      'Everything starts from it: it fixes where the collectors end and where the tank begins. The maker asks for something surprising: raise it 12 mm per collector on one side, so {railRaiseAll} here. The whole unit ends up {railAngle} out of square in the plane of the roof. That is no slip of the drawing, it is the maker’s figure. The manual does not say why in what we read; our reading: the headers then climb towards one corner, and air and warm fluid have only one way to go. The raised side, the hot pipe’s, is an estimate.',
    ),
    material: l(
      'Profilé métallique, un choix du dessin (aluminium estimé)',
      'Metal section, a choice of the drawing (aluminium, an estimate)',
    ),
    specs: [
      sp('Jusqu’au liteau du pied du ballon', 'To the batten of the tank’s foot', l('2 050 mm', '2,050 mm')),
      sp('Relevé d’un côté', 'Raised on one side', l('12 mm par capteur', '12 mm per collector')),
      sp('Soit, en tout', 'So, in all', lf('{railRaiseAll}, ou {railAngle}', '{railRaiseAll}, or {railAngle}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un rail posé bien d’équerre, par bonne volonté : l’air reste au point haut du mauvais collecteur et la boucle s’essouffle. Une fixation qui se relâche sous le poids des capteurs.',
        check: 'Un niveau sur le rail, à la pose et à la révision : on doit bien lire la pente voulue, et du bon côté.',
        care: 'Rien de régulier sur le rail lui-même. Si un capteur est remplacé, reprenez les cotes du constructeur plutôt que de vous fier au rail existant.',
      },
      {
        failure:
          'A rail fitted dead square, out of good will: the air stays at the high point of the wrong header and the loop runs short of breath. A fixing working loose under the weight of the collectors.',
        check:
          'A level on the rail, at fitting and at the service: you should read the intended slope, on the right side.',
        care: 'Nothing regular on the rail itself. If a collector is replaced, take the maker’s dimensions again rather than trusting the rail in place.',
      },
    ),
    tip: l(
      'On pose le rail avant tout le reste : toutes les mesures se prennent à partir de lui.',
      'The rail goes on before anything else: every measurement is taken from it.',
    ),
    design: lf(
      'Sur 2,05 m de pente, le collecteur haut du capteur finit juste sous le pied du ballon : voilà ce qui met le bas du ballon au niveau du haut des capteurs, à {yBand} près, sur tout toit de 10° à 30°.',
      'Over 2.05 m of slope, the collector’s upper header ends just below the tank’s foot: that is what sets the bottom of the tank level with the top of the collectors, within {yBand}, on any roof from 10° to 30°.',
    ),
  },
  {
    id: 'collector-strap',
    scene: 'rig',
    category: 'mechanical',
    name: l('Feuillard de capteur', 'Collector strap'),
    short: l(
      'Une bande d’acier accrochée au rail et fixée aux chevrons : elle tient les capteurs contre le vent et contre la pente.',
      'A steel band hooked to the rail and fixed to the rafters: it holds the collectors against the wind and against the slope.',
    ),
    description: l(
      'Un capteur de 43 kg n’est rien pour un chevron, mais un vent de face le soulève comme une aile. Ces bandes passent sous les tuiles, s’accrochent au rail et se fixent sur les chevrons, ce qui donne leur place : le constructeur en demande là où il y a du bois. Leur nombre et leur position dépendent des chevrons de la maison. Ici, quatre sont dessinées, et leur taille est une estimation : les plans du constructeur disent qu’elles existent, pas ce qu’elles mesurent.',
      'A 43 kg collector is nothing to a rafter, but a head wind lifts it like a wing. These bands pass under the tiles, hook to the rail and fix to the rafters, which gives them their place: the maker wants them where there is timber. Their number and position depend on the house’s rafters. Four are drawn here, and their size is an estimate: the maker’s drawings say they exist, not how big they are.',
    ),
    material: l('Bande d’acier galvanisé, vis dans le chevron', 'Galvanised steel band, screws into the rafter'),
    qty: 4,
    specs: [
      sp('Accroché à', 'Hooked to', l('le rail de pied', 'the collector rail')),
      sp('Fixé à', 'Fixed to', l('un chevron', 'a rafter')),
      sp('Vent de l’essai', 'Test wind', l('56,6 m/s, soit 203,6 km/h', '56.6 m/s, or 203.6 km/h')),
    ],
    maintenance: maint(
      {
        failure:
          'La rouille sous la tuile, où elle ne se voit pas. Une vis tirée d’un bois qui a pris l’eau. Après une tempête, un feuillard déformé.',
        check: 'Une petite tuile soulevée de temps en temps : le métal doit rester propre et la bande bien tendue.',
        care: 'Après un grand coup de vent, un coup d’œil depuis le comble. Remplacez toute bande pliée : l’acier s’est déjà étiré.',
      },
      {
        failure:
          'Rust under the tile, where it cannot be seen. A screw pulled from timber that has taken water. After a storm, a bent strap.',
        check: 'One small tile lifted now and then: the metal should stay clean and the band tight.',
        care: 'After a big gale, a look from the attic. Replace any bent band: the steel has already stretched.',
      },
    ),
    tip: l(
      'Le dessin place les quatre feuillards sur les quatre chevrons sous la machine : déplacez-les du regard si les vôtres sont ailleurs.',
      'The drawing puts the four straps on the four rafters under the machine: move them in your mind if yours lie elsewhere.',
    ),
    design: l(
      'Ce qui compte n’est pas le poids à porter, déjà sur le rail : c’est l’arrachement. Une fixation au chevron travaille en traction, là où une fixation à la tuile ne tiendrait rien.',
      'What counts is not the weight, already on the rail: it is the pull-out. A fixing into a rafter works in tension, where a fixing to a tile would hold nothing.',
    ),
  },
  {
    id: 'tank-spacer',
    scene: 'rig',
    category: 'mechanical',
    name: l('Cale capteur-ballon', 'Tank-to-collector spacer'),
    short: l(
      'Deux cales, à 200 mm des bords extérieurs : elles donnent au ballon sa place, et donc la hauteur qui compte.',
      'Two spacers, 200 mm from the outer edges: they give the tank its place, and so the height that counts.',
    ),
    description: lf(
      'Le ballon glisse sur ces deux cales et s’y arrête. C’est ce qui règle la grandeur la plus discutée du lab : la hauteur du bas du ballon au-dessus du haut du capteur, celle que tout le monde appelle y. Les plans du constructeur la placent à 0, à {yBand} près, et le dessin obtient {drawnY}. Des sources sérieuses y voient la limite entre une nuit tranquille et une nuit coûteuse ; d’autres ne s’accordent pas sur la bonne valeur : c’est l’objet de la quatrième leçon. Leur forme précise est une estimation.',
      'The tank slides down onto these two spacers and stops there. That sets the most debated quantity in the lab: the height of the tank’s bottom above the top of the collector, the one everyone calls y. The maker’s drawings put it at 0, within {yBand}, and this drawing gets {drawnY}. Serious sources see it as the line between a quiet night and a costly one; others do not agree on the right value: that is the subject of the fourth lesson. Their exact shape is an estimate.',
    ),
    material: l('Métal, forme estimée', 'Metal, shape an estimate'),
    qty: 2,
    specs: [
      sp('Depuis les bords extérieurs', 'From the outer edges', '200 mm'),
      sp('Hauteur y, selon les plans', 'Height y, by the drawings', lf('0, à {yBand} près', '0, within {yBand}')),
      sp('Hauteur y, ici', 'Height y, here', v('{drawnY}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une cale qui glisse ou s’écrase sous le ballon, et tout le cadre change de géométrie : les tuyaux tirent, un raccord s’ouvre.',
        check:
          'Le jeu entre le ballon et ses cales, une fois par an, à la lampe si la chaleur a pu fatiguer le support.',
        care: 'Rien de régulier. Toute dépose du ballon se termine par un contrôle de ces cotes.',
      },
      {
        failure:
          'A spacer slipping or crushed under the tank, and the whole frame changes shape: the pipes pull, a union opens.',
        check:
          'The play between the tank and its spacers, once a year, with a lamp if the heat may have tired the support.',
        care: 'Nothing regular. Any removal of the tank ends with a check of these dimensions.',
      },
    ),
    tip: l(
      'Faites glisser « Hauteur du ballon » dans la Simulation : le ballon quitte ses cales et part sur le banc d’essai. Revenez à zéro pour qu’il retrouve sa place.',
      'Drag “Height of the tank” in the Simulation: the tank leaves its spacers for the test stand. Back at zero, it finds its place again.',
    ),
    design: l(
      'Tout le raisonnement qui suit, sur la nuit, tient à ces deux cales. Une fois sur ses cales, le ballon est juste au seuil : il ne peut pas être plus bas sans coût, et aller plus haut demanderait une structure plus lourde.',
      'All the reasoning about the night rests on these two spacers. Once on them, the tank is right on the threshold: it cannot go lower at no cost, and going higher would need a heavier structure.',
    ),
  },
  {
    id: 'tank-strap',
    scene: 'rig',
    category: 'mechanical',
    name: l('Feuillard du ballon', 'Tank strap'),
    short: l(
      'Il tient 417 kg contre le vent et contre la pente : c’est lui qui répond du ballon en cas de tempête.',
      'It holds 417 kg against the wind and the slope: it answers for the tank in a storm.',
    ),
    description: lf(
      'Le ballon ne repose pas seulement : il pend aussi vers le bas de la pente, avec un vent qui le prend de biais sur 2,31 m. Ses feuillards passent par-dessus, jusqu’aux chevrons, et fixent toute la charge de {loadLine}. Ils travaillent peu la plupart du temps, puis beaucoup, en quelques heures de tempête. Leur existence est dans les plans du constructeur, mais leur taille et leur place sont des estimations du dessin.',
      'The tank does not only rest: it also hangs down the slope, with a wind catching it at an angle along 2.31 m. Its straps pass over it to the rafters and tie down the whole {loadLine}. They do little most of the time, then a lot, over a few hours of storm. Their existence is in the maker’s drawings, but their size and place are estimates of this drawing.',
    ),
    material: l('Bande d’acier galvanisé', 'Galvanised steel band'),
    qty: 2,
    specs: [
      sp('Ballon plein', 'Tank full', '417 kg'),
      sp('Charge en ligne', 'Line load', v('{loadLine}')),
      sp('Longueur prise au vent', 'Length caught by the wind', l('2,31 m', '2.31 m')),
    ],
    maintenance: maint(
      {
        failure:
          'Une bande usée par frottement contre l’aluminium fin de l’enveloppe, ou l’enveloppe elle-même qui se marque, faute de cale.',
        check:
          'Une fois par an, du toit ou à la jumelle : marque de rouille sur le bord du feuillard, et frottement sur la peau du ballon.',
        care: 'Après une tempête, un contrôle complet. Une bande qui a pris une marque se change.',
      },
      {
        failure:
          'A band worn by rubbing against the case’s thin aluminium, or the case itself getting marked, for want of a packer.',
        check:
          'Once a year, from the roof or with binoculars: a rust mark on the strap’s edge, and rubbing on the tank’s skin.',
        care: 'After a storm, a full check. A band that has taken a mark gets changed.',
      },
    ),
    tip: l(
      'Avec l’outil Transparence, ce feuillard reste visible autour du ballon transparent : c’est le meilleur moyen de lire par où passe l’effort.',
      'In X-ray this strap stays visible around the see-through tank: that is the best way to read where the force goes.',
    ),
    design: l(
      'Sur un toit plus raide, il travaille davantage dans le sens de la pente et moins à l’arrachement ; au-delà de 30°, le constructeur passe à un cadre.',
      'On a steeper roof it works more along the slope and less in pull-out; beyond 30°, the maker moves to a frame.',
    ),
  },
  {
    id: 'fill-port',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Remplissage', 'Fill assembly'),
    short: l(
      'Au coin bas à gauche : c’est par là qu’on remplit le circuit fermé, capteurs couverts, et seulement une fois le ballon plein.',
      'At the low left corner: this is where the closed circuit is filled, collectors covered, and only once the tank is full.',
    ),
    description: lf(
      'Le remplissage se fait par siphon, par ici, jusqu’aux 19 L du circuit, avec une bouteille de 4,5 L de glycol alimentaire bleu dans une machine standard : {glycolPct} du mélange, qui ne gèle qu’à {glycolFreeze}. Le manuel réserve ce geste à des personnes formées, et le fait après le remplissage du ballon. Les capteurs restent couverts pendant toute l’opération : au soleil, ils sont déjà très chauds.',
      'Filling is done by siphon, here, up to the circuit’s 19 L, with one 4.5 L bottle of blue food-grade glycol in a standard machine: {glycolPct} of the mix, which only freezes at {glycolFreeze}. The manual keeps this job to trained people, and has it done after the tank is filled. The collectors stay covered throughout: in the sun they are already very hot.',
    ),
    material: l('Raccord de laiton, bouchon', 'Brass fitting, plug'),
    specs: [
      sp('Volume du circuit', 'Circuit volume', '19 L'),
      sp('Glycol', 'Glycol', lf('une bouteille de 4,5 L, {glycolPct}', 'one 4.5 L bottle, {glycolPct}')),
      sp('Point de gel', 'Freezing point', v('{glycolFreeze}')),
      sp('Réservé à', 'Kept to', l('des installateurs formés', 'trained installers')),
    ],
    maintenance: maint(
      {
        failure:
          'Un bouchon qui fuit, et un niveau qui baisse lentement. Un remplissage avec une eau trop dure, qui dépose dans le circuit.',
        check:
          'Le niveau, à la révision des 5 ans : c’est là que l’installateur l’ouvre. Sinon, une trace bleue sous ce coin suffit à alerter.',
        care: 'N’ouvrez jamais ce bouchon machine chaude. L’eau ajoutée dilue le glycol : à chaque appoint, mesurez sa concentration.',
      },
      {
        failure:
          'A leaking plug, and a level slowly falling. A filling with water too hard, leaving deposits in the circuit.',
        check:
          'The level, at the 5-year service: that is when the installer opens it. Otherwise, a blue trace under this corner is alert enough.',
        care: 'Never open this plug with the machine hot. Added water dilutes the glycol: at each top-up, measure its strength.',
      },
    ),
    tip: lf(
      'Un mélange à {glycolPct} ne gèle qu’à {glycolFreeze} ; le constructeur donne 20 % à −7 °C, 30 % à −13 °C, 40 % à −22 °C et 50 % à −34 °C.',
      'A mix at {glycolPct} only freezes at {glycolFreeze}; the maker gives 20% at −7 °C, 30% at −13 °C, 40% at −22 °C and 50% at −34 °C.',
    ),
    design: l(
      'Le bleu du glycol est un choix réfléchi : deux liquides séparés par une seule paroi d’acier, c’est une fuite possible, et celle-ci se voit au premier robinet.',
      'The glycol’s blue is a deliberate choice: two liquids parted by one steel wall can leak, and this leak shows at the first tap.',
    ),
  },
  {
    id: 'top-plug',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Bouchon haut', 'Collector plug'),
    short: l(
      'Au coin opposé, en haut à droite : il ferme le collecteur, et c’est là que l’air s’en va au remplissage.',
      'At the opposite corner, top right: it closes the header, and that is where air leaves during filling.',
    ),
    description: l(
      'Le fluide entre en bas à gauche et l’air part par le haut : en diagonale, il chasse tout devant lui. Ce simple bouchon termine donc le remplissage, en laissant sortir l’air jusqu’à ce que le mélange arrive. Il a un rôle minuscule et décisif : une bulle restée au point haut peut suffire à bloquer une circulation qui n’a presque rien pour la pousser. C’est aussi l’autre extrémité de la diagonale que suit le fluide en marche.',
      'The fluid comes in at the low left and the air leaves from the top: on the diagonal, it drives everything ahead of it. So this simple plug finishes the filling, letting the air out until the mix arrives. Its role is tiny and decisive: a bubble left at the high point may be enough to stop a circulation that has almost nothing to push it. It is also the other end of the diagonal the running fluid follows.',
    ),
    material: l('Bouchon de laiton', 'Brass plug'),
    specs: [
      sp('Place', 'Place', l('coin haut, à droite', 'top corner, on the right')),
      sp('Rôle', 'Role', l('la sortie de l’air', 'the way out for the air')),
      sp('Face à lui', 'Opposite', l('le remplissage, coin bas à gauche', 'the fill, low left corner')),
    ],
    maintenance: maint(
      {
        failure:
          'De l’air qui s’accumule après une fuite ou un remplissage bâclé : la machine démarre mal, ou plus du tout, avec un capteur très chaud et un ballon froid.',
        check:
          'Un capteur brûlant et un ballon froid à midi, voilà le symptôme : c’est le moment d’appeler l’installateur.',
        care: 'Ne l’ouvrez pas à chaud, le fluide pourrait jaillir. Sa purge fait partie de tout appoint de fluide.',
      },
      {
        failure:
          'Air gathering after a leak or a careless filling: the machine starts badly, or not at all, with a very hot collector and a cold tank.',
        check:
          'A scorching collector and a cold tank at noon: that is the symptom, and the time to call the installer.',
        care: 'Do not open it hot, the fluid could spurt. Bleeding it is part of any top-up.',
      },
    ),
    tip: l(
      'Il n’a ni levier ni ressort : une toute petite pièce qui répond de la circulation entière.',
      'It has no lever or spring: a very small part answering for the whole circulation.',
    ),
    design: l(
      'Le relevé du rail et ce bouchon vont ensemble, dans notre lecture : les collecteurs montent vers un coin, et ce coin peut laisser partir ce qui doit partir.',
      'The rail’s raise and this plug go together, in our reading: the headers climb towards one corner, and that corner can let out what must leave.',
    ),
  },
  {
    id: 'overheat-valve',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Vanne anti-surchauffe', 'Overheat valve'),
    short: lf(
      'Une option : quand le fluide devient trop chaud, elle ferme la boucle et laisse le capteur seul au soleil.',
      'An option: when the fluid gets too hot, it shuts the loop and leaves the collector alone in the sun.',
    ),
    description: lf(
      'Une famille part une semaine en juillet : plus rien n’est tiré, et le ballon monte. Cette vanne coupe alors la circulation. Le manuel en parle, mais ne publie ni sa consigne, ni son volume, ni sa place : sur le dessin, elle est sur le départ chaud, une estimation, et sa consigne est dans le modèle à {overheatSet}, pour une fourchette estimée de {overheatLow} à {overheatHigh}. Résultat du modèle sur une semaine sans tirage à Athènes : {holidayNoValve} sans elle, {holidayValve} avec, mais {holidayCollector} au capteur, qui reste seul au soleil. Elle change aussi la soupape du circuit, qui passe de 80 kPa à 200 kPa.',
      'A family leaves for a week in July: nothing is drawn any more, and the tank climbs. This valve then cuts the circulation. The manual mentions it, but publishes neither its setting, nor its volume, nor its place: in the drawing it sits on the hot outlet, an estimate, and the model sets it at {overheatSet}, in an estimated range of {overheatLow} to {overheatHigh}. The model’s result over a week with no draw at Athens: {holidayNoValve} without it, {holidayValve} with it, but {holidayCollector} at the collector, left alone in the sun. It also changes the circuit’s relief valve, from 80 kPa to 200 kPa.',
    ),
    material: l(
      'Corps de laiton, élément sensible à la chaleur (non publié)',
      'Brass body, heat-sensitive element (not published)',
    ),
    specs: [
      sp(
        'Consigne',
        'Setting',
        lf('non publiée ; {overheatSet} dans le modèle', 'not published; {overheatSet} in the model'),
      ),
      sp('Ballon, sans elle', 'Tank, without it', v('{holidayNoValve}')),
      sp('Ballon, avec elle', 'Tank, with it', v('{holidayValve}')),
      sp('Soupape du circuit', 'Circuit’s relief', l('80 kPa, ou 200 kPa avec elle', '80 kPa, or 200 kPa with it')),
    ],
    maintenance: maint(
      {
        failure:
          'Une vanne qui reste fermée après une surchauffe, et une boucle arrêtée pendant des jours sans raison visible. Une vanne qui ne ferme plus, et la soupape du ballon goutte tout l’été.',
        check:
          'Un capteur brûlant avec un ballon tiède, la vanne fermée : c’est elle. Avec un ballon brûlant, regardez plutôt si elle ferme bien.',
        care: 'Dans ce manuel, elle n’a pas d’entretien propre : contrôlez-la à chaque révision et remplacez-la en panne.',
      },
      {
        failure:
          'A valve staying shut after an overheat, and a loop stopped for days for no visible reason. A valve that no longer shuts, and the tank’s relief dripping all summer.',
        check:
          'A scorching collector with a lukewarm tank and the valve shut: that is the culprit. With a scorching tank, see instead whether it shuts properly.',
        care: 'In this manual it has no care of its own: check it at each service and replace it if it fails.',
      },
    ),
    tip: l(
      'Lancez « Une semaine de vacances » : le chiffre « Haut du ballon » s’arrête net quand la vanne ferme.',
      'Run “A holiday week”: the “Tank top” figure stops dead as the valve shuts.',
    ),
    design: lf(
      'Couper la boucle épargne le ballon et laisse le capteur prendre le choc. Une plaque noire plafonne plus bas qu’une sélective : environ {blackStag} en extrapolant sa courbe, un chiffre fragile, contre 200 °C à 220 °C pour des capteurs sélectifs.',
      'Cutting the loop spares the tank and lets the collector take the blow. A black plate tops out lower than a selective one: about {blackStag} by extending its curve, a shaky figure, against 200 °C to 220 °C for selective collectors.',
    ),
  },
  {
    id: 'overflow-reservoir',
    scene: 'rig',
    category: 'hydraulic',
    name: l('Vase du circuit', 'Circuit reservoir'),
    short: l(
      'Il reçoit le fluide du circuit quand celui-ci se dilate : son volume n’est pas publié, et sa fixation est de nous.',
      'It takes the circuit’s fluid as it expands: its volume is not published, and its mount is ours.',
    ),
    description: l(
      'Un circuit fermé plein de liquide chaud doit bien mettre sa dilatation quelque part. Le constructeur ne publie ni le volume de son vase ni sa fixation. Le petit cylindre arrimé au ballon sur ce dessin est donc notre estimation, et le modèle ne le compte pas : il suit le fluide sans son expansion. Regardez-le comme un rappel de ce que tout circuit doit gérer, et non comme une pièce à copier.',
      'A closed circuit full of hot liquid has to put its expansion somewhere. The maker publishes neither the volume of its reservoir nor its mount. The small cylinder tied to the tank in this drawing is therefore our estimate, and the model leaves it out: it follows the fluid without its expansion. See it as a reminder of what any circuit must handle, not as a part to copy.',
    ),
    material: l('Corps métallique, matière non publiée', 'Metal body, material not published'),
    specs: [
      sp('Volume', 'Volume', l('non publié', 'not published')),
      sp('Fixation', 'Mount', l('estimée, sur le ballon', 'an estimate, on the tank')),
      sp('Dans le modèle', 'In the model', l('absent', 'absent')),
    ],
    maintenance: maint(
      {
        failure:
          'Un vase qui perd son niveau, et le circuit qui finit par prendre de l’air. Pour le reste, rien de publié.',
        check: 'Comme tout le circuit : une trace bleue, ou un niveau qui baisse à la révision des 5 ans.',
        care: 'Le geste d’ouvrir revient à des personnes formées. Ne le remplissez pas vous-même : le circuit doit garder son dosage.',
      },
      {
        failure:
          'A reservoir losing its level, and the circuit ending up with air in it. For the rest, nothing is published.',
        check: 'Like the whole circuit: a blue trace, or a level that drops at the 5-year service.',
        care: 'Opening it is for trained people. Do not top it up yourself: the circuit must keep its mix.',
      },
    ),
    tip: l(
      'Si le constructeur répondait à un message, c’est cette fiche qui changerait le plus : volume, fixation et matière.',
      'If the maker answered one message, this is the sheet that would change most: volume, mount and material.',
    ),
    design: l(
      'Il fallait bien dessiner quelque chose : nous l’avons placé sur le ballon, au point haut du circuit, là où un fluide qui se dilate irait de lui-même.',
      'Something had to be drawn: we set it on the tank, at the circuit’s high point, where an expanding fluid would go by itself.',
    ),
  },
  {
    id: 'test-stand',
    scene: 'rig',
    category: 'structure',
    name: l('Banc d’essai', 'Test stand'),
    short: l(
      'Il n’appartient pas à la machine : c’est lui qui permet au curseur de monter et de descendre le ballon.',
      'It is no part of the machine: it is what lets the slider raise and lower the tank.',
    ),
    description: lf(
      'La vraie machine reste à y = 0, sur ses cales. Ce banc translucide existe pour poser la question de la nuit : de −1,22 m à +1,83 m, la plage du seul modèle trouvé qui balaie cette hauteur. À zéro il se retire, sauf sa règle graduée, dont le zéro cuivré reste sur le haut des capteurs : c’est ce qui lui donne une place à sélectionner. Au-dessus de zéro, le ballon monte tout droit. En dessous, il part à côté de la rangée de capteurs, sinon il les traverserait : c’est là que descend « Un ballon trop bas », à −0,61 m. Le dessin ajoute alors environ {belowDetour} de tuyau le long du haut des capteurs, que le modèle ne compte pas : ses tuyaux ne s’allongent que de la hauteur.',
      'The real machine stays at y = 0, on its spacers. This translucent stand exists to ask the question of the night: from −1.22 m to +1.83 m, the range of the only model we found that sweeps this height. At zero it withdraws, except for its graduated staff, whose copper zero stays on top of the collectors: that gives it a place to select. Above zero, the tank goes straight up. Below, it moves beside the bank of collectors, or it would pass through them: that is where “A tank too low” comes down, at −0.61 m. The drawing then adds about {belowDetour} of pipe along the top of the collectors, which the model does not count: its pipes only lengthen by the height.',
    ),
    material: l(
      'Rien : un dessin translucide, sans existence hors du lab',
      'Nothing: a see-through drawing, with no life outside the lab',
    ),
    specs: [
      sp('Plage', 'Range', l('−1,22 m à +1,83 m', '−1.22 m to +1.83 m')),
      sp('Place de la vraie machine', 'The real machine’s place', 'y = 0'),
      sp('Tuyaux du modèle, chaud', 'Model’s pipes, hot', lf('{hotPipe} + |y|', '{hotPipe} + |y|')),
      sp('Tuyaux du modèle, froid', 'Model’s pipes, cold', lf('{coldPipe} + y', '{coldPipe} + y')),
      sp('Détour dessiné sous zéro', 'Detour drawn below zero', lf('environ {belowDetour}', 'about {belowDetour}')),
    ],
    maintenance: maint(
      {
        failure: 'Aucune : ce banc n’existe que dans ce lab, et aucun vrai ballon ne se règle ainsi.',
        check: 'Le curseur à zéro : le ballon revient sur ses cales, et il ne reste du banc que sa règle.',
        care: 'Rien. Sur un vrai toit, la hauteur se décide une fois pour toutes, à la pose du rail et des cales.',
      },
      {
        failure: 'None: this stand exists only in this lab, and no real tank is adjusted this way.',
        check: 'The slider at zero: the tank goes back on its spacers, and only the staff is left of the stand.',
        care: 'Nothing. On a real roof, the height is settled once and for all when the rail and the spacers go on.',
      },
    ),
    tip: lf(
      'Réglez le curseur à +0,61 m puis à −0,30 m par une nuit claire : {lostP061} puis {lostM03Pct} de la chaleur du jour repart au matin, selon le modèle.',
      'Set the slider to +0.61 m then to −0.30 m on a clear night: {lostP061} then {lostM03Pct} of the day’s heat is gone by morning, according to the model.',
    ),
    design: l(
      'Le lab pouvait dire ce résultat par une courbe, mais voir le ballon descendre à côté de la rangée de capteurs, puis le fluide repartir à l’envers à la tombée du soir, se comprend mieux qu’une ligne de plus sur un graphique.',
      'The lab could have put this result as a curve, but seeing the tank come down beside the bank, then the fluid set off backward at dusk, reads better than one more line on a chart.',
    ),
  },
];
