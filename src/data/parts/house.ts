// Parts of the `house` world (10, ids of docs/research.md §4): how the machine joins a house. Conventions of the sheets: a figure with no mark is reported by a source; {placeholders} carry † or *. The maker stays
// « le constructeur » / « the maker »: named only in the Sources. The warning about the roof and the weight is said here once, in `roof-structure`.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const HOUSE_PARTS: PartInfo[] = [
  {
    id: 'roof-unit',
    scene: 'house',
    category: 'hydraulic',
    name: l('Le chauffe-eau sur le toit', 'The roof unit'),
    short: lf(
      'Deux capteurs, un ballon de 300 L juste au-dessus, et aucune pompe : toute la machine, vue d’ici.',
      'Two collectors, a 300 L tank just above them, and no pump: the whole machine, seen from here.',
    ),
    description: lf(
      'C’est un chauffe-eau solaire en thermosiphon. Deux capteurs plats de 1,87 m² d’ouverture chacun sont posés juste sous un ballon couché, sur un même cadre. Le soleil chauffe un mélange d’eau et de glycol, qui monte de lui-même dans une double enveloppe autour de la cuve, y laisse sa chaleur, puis redescend par un tuyau extérieur. Il n’y a ni pompe, ni sonde, ni commande : seule la résistance d’appoint demande du courant. L’eau que vous buvez ne quitte jamais le ballon.',
      'This is a thermosiphon solar water heater. Two flat collectors of 1.87 m² aperture each sit just below a horizontal tank, on one frame. The sun heats a mix of water and glycol, which climbs by itself into a jacket round the vessel, gives up its heat there, then comes back down an outside pipe. There is no pump, no sensor and no controller: only the booster element asks for current. The water you drink never leaves the tank.',
    ),
    material: l(
      'Capteurs en acier, aluminium et verre ; ballon en acier émaillé, mousse et aluminium',
      'Collectors in steel, aluminium and glass; tank in enamelled steel, foam and aluminium',
    ),
    specs: [
      sp('Surface d’ouverture', 'Aperture', lf('2 × 1,87 m², soit {apertureAll}', '2 × 1.87 m², so {apertureAll}')),
      sp('Ballon', 'Tank', '300 L'),
      sp('Masse, vide puis pleine', 'Mass, empty then full', '196 kg, 515 kg'),
      sp('Encombrement sur le toit', 'Footprint on the roof', l('2,43 × 2,49 m', '2.43 × 2.49 m')),
      sp(
        'Pente sur un toit',
        'Pitch on a roof',
        lf('10° à 30° ; {tiltDrawn} dessinés', '10° to 30°; {tiltDrawn} as drawn'),
      ),
    ],
    maintenance: maint(
      {
        failure:
          'Rien ne tourne, donc rien ne s’use vite. La machine perd plutôt du rendement sans bruit : une ombre nouvelle, du niveau en moins dans le circuit, une anode finie. L’eau reste tiède, sans alarme.',
        check:
          'Comparez une journée claire à celles d’avant. Une sortie de la soupape qui reste sèche quand le ballon chauffe, ou un robinet qui coule bleu, se remarquent à l’œil.',
        care: 'Le constructeur demande deux gestes : manœuvrer les leviers des soupapes tous les 6 mois, et une révision à 5 ans, où la soupape combinée et l’anode sont remplacées et le niveau du circuit vérifié.',
      },
      {
        failure:
          'Nothing turns, so nothing wears fast. The machine tends to lose output quietly: a new shadow, a low level in the circuit, a spent anode. The water stays lukewarm, with no alarm.',
        check:
          'Compare a clear day with earlier ones. A relief drain that stays dry while the tank heats, or a tap running blue, can be spotted by eye.',
        care: 'The maker asks for two things: work the easing levers of the valves every 6 months, and a service at 5 years, when the combined valve and the anode are replaced and the circuit’s level is checked.',
      },
    ),
    tip: l(
      'Le bouton de cette fiche ouvre la machine seule : c’est là que le ballon peut monter et descendre.',
      'The button on this sheet opens the machine alone: that is where the tank can go up and down.',
    ),
    video: ['00:00'],
    design: lf(
      'Tout tient sur un cadre parce que la boucle veut être courte et le ballon haut. Posé sur ses cales, le bas du ballon arrive au niveau du haut des capteurs, à {yBand} près : le constructeur s’arrête juste à la limite où la nuit commence à coûter.',
      'It all sits on one frame because the loop wants to be short and the tank high. On its spacers, the bottom of the tank comes level with the top of the collectors, within {yBand}: the maker stops right at the point where the night starts to cost.',
    ),
  },
  {
    id: 'roof-structure',
    scene: 'house',
    category: 'structure',
    name: l('Chevrons et liteaux', 'Rafters and battens'),
    short: lf(
      'Ils portent 515 kg en charge, dont les 417 kg du ballon presque sur une seule ligne, tout en haut.',
      'They carry 515 kg when full, with the tank’s 417 kg almost on one line, at the very top.',
    ),
    description: lf(
      'Étalée sur 2,43 × 2,49 m, la machine pleine fait en moyenne {loadArea}. Cette moyenne trompe : le ballon pèse 417 kg et repose le long de 2,43 m, soit {loadLine} au même endroit de chaque chevron. C’est cette ligne, pas la moyenne, qui décide si un toit convient. Le constructeur donne une table de fentes selon l’entraxe des chevrons, et la maison du lab a ses chevrons à 600 mm, l’une des valeurs de cette table. Ni la maison ni sa charpente ne viennent d’un vrai bâtiment.',
      'Spread over 2.43 × 2.49 m, the full machine comes to an average of {loadArea}. That average misleads: the tank weighs 417 kg and rests along 2.43 m, which is {loadLine} at the same spot on every rafter. That line, not the average, decides whether a roof will do. The maker gives a table of slots by rafter spacing, and the lab’s house has its rafters at 600 mm, one of the values in that table. Neither the house nor its timberwork comes from a real building.',
    ),
    material: l('Bois de charpente, liteaux de bois', 'Structural timber, timber battens'),
    specs: [
      sp('Charge moyenne', 'Average load', v('{loadArea}')),
      sp('Sous le ballon', 'Under the tank', v('{loadLine}')),
      sp('Limites données', 'Limits given', l('vent 56,6 m/s, neige 2 kN/m²', 'wind 56.6 m/s, snow 2 kN/m²')),
    ],
    maintenance: maint(
      {
        failure:
          'Un chevron qui fléchit lentement sous la ligne du ballon, ou un bois attaqué par une fuite que personne n’a vue. Le ballon penche alors, et les tuiles autour ne ferment plus.',
        check:
          'Depuis le comble, à la lampe : traces d’eau autour des traversées et sous le ballon, chevron qui n’est plus droit. Faites la première visite après le premier remplissage.',
        care: 'Gardez le comble aéré et notez tout changement. Toute reprise de charpente passe par un charpentier.',
      },
      {
        failure:
          'A rafter sagging slowly under the tank’s line, or timber damaged by a leak nobody saw. The tank then tilts, and the tiles around it no longer close.',
        check:
          'From the attic, with a lamp: water stains around the penetrations and under the tank, a rafter no longer straight. Make the first visit after the first filling.',
        care: 'Keep the attic ventilated and note any change. Any work on the timbers goes through a carpenter.',
      },
    ),
    tip: l(
      'Ce sont 515 kg à lever sur un toit qui glisse, et sur une charpente qui n’a peut-être pas été prévue pour ça : engin de levage et avis d’un charpentier ou d’un ingénieur de structure, avant tout achat.',
      'That is 515 kg to get onto a roof that slips, and a structure perhaps never meant for it: a lifting device and the view of a builder or structural engineer, before buying anything.',
    ),
    design: lf(
      'Ces limites de vent et de neige viennent d’un essai arrêté aux 2 000 Pa du banc, et le manuel les place avant les tableaux d’un autre capteur : elles valent peut-être pour celui-là. La moitié haute du toit prend presque tout le poids, ce que {loadArea} ne dit pas.',
      'These wind and snow limits come from a test stopped at the rig’s 2,000 Pa, and the manual prints them just before the tables of another collector: they may belong to that one. The upper half of the roof takes nearly all the weight, which {loadArea} does not say.',
    ),
  },
  {
    id: 'roof-tiles',
    scene: 'house',
    category: 'structure',
    name: l('Tuiles', 'Roof tiles'),
    short: l(
      'On les soulève pour glisser les feuillards dessous, puis on les remet : la machine reste sur le toit, pas dedans.',
      'They are lifted to slip the straps underneath, then put back: the machine stays on the roof, not in it.',
    ),
    description: l(
      'La machine ne remplace pas la couverture : elle se pose dessus. Les feuillards passent sous les tuiles pour se fixer aux chevrons, et les tuiles reprennent ensuite leur place, sauf là où un feuillard les oblige à un petit ajustement. Le constructeur note aussi que les tuyaux n’ont pas besoin d’isolant sur un toit de tuiles. Ici ce sont des tuiles canal, choisies pour le décor : un toit plus plat ou une autre couverture changerait les gestes, pas le principe.',
      'The machine does not replace the roof covering: it sits on top. The straps pass under the tiles to fix to the rafters, and the tiles then go back, except where a strap calls for a small adjustment. The maker also notes that the pipes need no insulation on a tiled roof. These are canal tiles, chosen for the setting: a flatter roof or another covering would change the gestures, not the principle.',
    ),
    material: l('Terre cuite, tuiles canal dans ce décor', 'Fired clay, canal tiles in this setting'),
    specs: [
      sp('Rôle', 'Role', l('la couverture, sous la machine', 'the covering, under the machine')),
      sp('Soulevées pour', 'Lifted for', l('les feuillards et la traversée', 'the straps and the penetration')),
      sp('Pente dessinée', 'Pitch as drawn', v('{tiltDrawn}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une tuile fendue au moment de la pose, ou calée par un feuillard, qui laisse entrer l’eau au droit de la machine, là où personne ne regarde.',
        check:
          'Après la pose et après le premier gros orage : le comble sous la machine doit rester sec. Regardez aussi la rive des tuiles autour des feuillards.',
        care: 'Remplacez sans attendre une tuile cassée. Marchez sur les chevrons, jamais au milieu d’une tuile, et prévoyez des tuiles de rechange avant de commencer.',
      },
      {
        failure:
          'A tile cracked during fitting, or wedged by a strap, letting water in right under the machine, where nobody looks.',
        check:
          'After fitting and after the first big storm: the attic under the machine must stay dry. Look also at the edges of the tiles around the straps.',
        care: 'Replace a broken tile at once. Walk over the rafters, never mid-tile, and have spare tiles before you start.',
      },
    ),
    tip: l(
      'Dans le guide d’installation, les tuiles arrivent après les chevrons : profitez de cette étape pour voir la charpente nue.',
      'In the installation guide the tiles come after the rafters: use that step to see the bare timbers.',
    ),
    design: l(
      'Laisser les tuiles en place évite de refaire un toit, et c’est une raison du succès de ces machines : elles se posent sans grand chantier, tant que la charpente suit.',
      'Leaving the tiles in place avoids redoing a roof, and it is one reason these machines spread: they go on with no major works, as long as the timbers can take it.',
    ),
  },
  {
    id: 'roof-penetration',
    scene: 'house',
    category: 'hydraulic',
    name: l('Traversée de toit', 'Roof penetration'),
    short: l(
      'Le seul trou de toute l’affaire : derrière le ballon, au point haut d’une tuile, petit et étanche.',
      'The only hole in the whole job: behind the tank, at the high point of a tile, small and sealed.',
    ),
    description: lf(
      'Tout ce qui relie la machine à la maison passe ici : l’eau froide, l’eau chaude, le câble de l’appoint et l’évacuation. Le constructeur la veut au point haut d’une tuile, pour que l’eau de pluie passe à côté, et derrière le ballon, où elle reste à l’abri. Sa place exacte le long de la pente, dans ce dessin, est une estimation.',
      'Everything that ties the machine to the house passes here: cold water, hot water, the booster’s cable and the drain. The maker wants it at the high point of a tile, so that rain runs past it, and behind the tank, where it stays sheltered. Its exact place along the slope, in this drawing, is an estimate.',
    ),
    material: l('Manchons et mastic pour toiture', 'Sleeves and roofing sealant'),
    specs: [
      sp('Place', 'Place', l('point haut d’une tuile, derrière le ballon', 'high point of a tile, behind the tank')),
      sp('Ce qui passe', 'What passes', l('eau froide, eau chaude, câble, évacuation', 'cold, hot, cable, drain')),
      sp('Taille', 'Size', l('la plus petite possible', 'as small as possible')),
    ],
    maintenance: maint(
      {
        failure:
          'Le mastic fatigue au soleil et se fend : l’eau entre goutte à goutte, le long des tuyaux, loin de l’endroit où elle ressort au plafond.',
        check:
          'Une fois par an, depuis le comble après la pluie, à la lampe. Suivez chaque tuyau du regard : une trace sur un tuyau remonte toujours vers sa cause.',
        care: 'Refaites l’étanchéité dès la première fissure, en nettoyant l’ancien mastic. Si un tuyau vibre ou bouge, fixez-le d’abord : il rouvrirait le joint.',
      },
      {
        failure:
          'The sealant tires in the sun and splits: water gets in drop by drop, along the pipes, far from where it shows on the ceiling.',
        check:
          'Once a year, from the attic after rain, with a lamp. Follow each pipe by eye: a stain on a pipe always leads back to its cause.',
        care: 'Redo the seal at the first crack, cleaning off the old sealant. If a pipe vibrates or moves, fix it first: it would open the joint again.',
      },
    ),
    tip: l(
      'Le point haut d’une tuile canal, c’est son dos, pas son creux : l’eau de pluie court dans le creux.',
      'The high point of a canal tile is its back, not its trough: the rain runs in the trough.',
    ),
    design: l(
      'Rassembler tout en un seul passage fait une seule étanchéité à soigner et à surveiller, au lieu de quatre.',
      'Gathering everything into one passage makes a single seal to care for and watch, instead of four.',
    ),
  },
  {
    id: 'load-bearing-wall',
    scene: 'house',
    category: 'structure',
    name: l('Mur porteur', 'Load-bearing wall'),
    short: l(
      'Sous la ligne du ballon, un mur qui descend jusqu’au sol : le constructeur juge « souhaitable » d’y reporter le poids.',
      'Under the tank’s line, a wall that goes down to the ground: the maker calls it “advisable” to brace the weight on it.',
    ),
    description: lf(
      'Le ballon plein charge chaque chevron de {loadLine} au même endroit de leur portée. Un mur placé dessous raccourcit le chemin de cet effort jusqu’au sol, au lieu de tout faire passer par le milieu des chevrons. Le constructeur ne l’impose pas : il dit que c’est souhaitable. Ici, la maison est dessinée avec un mur de refend sous le ballon, pour que le chemin se lise d’un coup d’œil dans la tranche. C’est un choix de décor : toutes les maisons n’offrent pas ce mur au bon endroit.',
      'The full tank loads each rafter with {loadLine} at the same point of its span. A wall underneath shortens the path of that force to the ground, instead of sending it all through mid-span. The maker does not insist: it says this is advisable. Here the house is drawn with a spine wall under the tank, so that the path reads at a glance in the slice. That is a choice for the setting: not every house has that wall in the right place.',
    ),
    material: l('Maçonnerie de pierre, dans ce décor', 'Stone masonry, in this setting'),
    specs: [
      sp('Avis du constructeur', 'The maker’s word', l('« souhaitable »', '“advisable”')),
      sp('Ce qu’il reprend', 'What it takes', v('{loadLine}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fissure neuve, ou une cale qui se tasse entre le mur et la charpente, et l’effort repart dans les chevrons sans que rien ne le signale.',
        check:
          'Marquez au crayon la fin d’une fissure ancienne et la date : si elle dépasse le trait, elle travaille. Regardez aussi la cale sous la charpente après le premier été.',
        care: 'Rien de régulier à faire. Toute ouverture percée dans ce mur après coup passe d’abord par un avis de structure.',
      },
      {
        failure:
          'A new crack, or a packer settling between wall and timber, and the force goes back into the rafters with nothing to show it.',
        check:
          'Pencil the end of an old crack and date it: if it passes the line, it is moving. Look too at the packer under the timbers after the first summer.',
        care: 'Nothing regular to do. Any opening cut through this wall later needs a structural opinion first.',
      },
    ),
    tip: l(
      'Coupez la maison du regard : du ballon au sol, l’effort doit pouvoir descendre sans détour.',
      'Follow the slice with your eye: from the tank to the ground, the force should come down with no detour.',
    ),
    design: l(
      'La charge la plus lourde de la maison arrive d’un coup par le toit. Un mur dessous vaut souvent mieux qu’un chevron renforcé, parce qu’il raccourcit le chemin au lieu de le muscler.',
      'The heaviest load in the house comes in all at once through the roof. A wall below is often better than a stronger rafter, because it shortens the path instead of beefing it up.',
    ),
  },
  {
    id: 'cold-main',
    scene: 'house',
    category: 'hydraulic',
    name: l('Arrivée d’eau froide', 'Cold water main'),
    short: l(
      'L’eau de la rue monte jusqu’au toit par sa propre pression : au plus 680 kPa au ballon, ou 800 kPa, selon les soupapes.',
      'The street’s water climbs to the roof on its own pressure: at most 680 kPa at the tank, or 800 kPa, depending on the valves.',
    ),
    description: lf(
      'Il n’y a pas de pompe non plus de ce côté : c’est le réseau qui remplit le ballon, par le bas, chaque fois qu’un robinet tire en haut. La pression admise est de 680 kPa avec une soupape d’eau froide et de 800 kPa sans elle. L’eau elle-même a des limites : moins de 1 000 ppm de sels dissous, moins de 200 ppm de dureté, selon le manuel. Sa température compte aussi : d’un lieu à l’autre, elle change le travail à faire, et le modèle la lie à l’air moyen du site.',
      'There is no pump on this side either: the mains fill the tank from below, each time a tap draws from the top. The pressure allowed is 680 kPa with a cold relief valve and 800 kPa without. The water itself has limits: under 1,000 ppm of dissolved solids, under 200 ppm of hardness, by the manual. Its temperature matters too: from one place to another it changes the work to do, and the model ties it to the site’s mean air.',
    ),
    material: l('Tube de distribution d’eau potable', 'Drinking-water pipe'),
    specs: [
      sp(
        'Pression au ballon',
        'Pressure at the tank',
        l('680 kPa avec soupape, 800 kPa sans', '680 kPa with the valve, 800 kPa without'),
      ),
      sp('Sels dissous', 'Dissolved solids', l('moins de 1 000 ppm', 'under 1,000 ppm')),
      sp('Dureté', 'Hardness', l('moins de 200 ppm CaCO₃', 'under 200 ppm CaCO₃')),
    ],
    maintenance: maint(
      {
        failure:
          'Une pression qui monte la nuit, quand le quartier ne tire plus d’eau, et fait couler la soupape en continu. Un gel du tuyau au passage du comble, en climat froid.',
        check:
          'Un manomètre sur un robinet, la nuit : si la pression dépasse la limite, le réducteur du logement est le premier suspect.',
        care: 'Sous −10 °C fréquents, le manuel prévient que tuyaux et vannes peuvent geler même isolés : gardez les vannes à l’intérieur, et sachez où couper l’eau.',
      },
      {
        failure:
          'A pressure that rises at night, when the neighbourhood draws no water, making the valve run all the time. A frozen pipe where it crosses the attic, in a cold climate.',
        check: 'A gauge on a tap at night: if the pressure passes the limit, the house’s reducer is the first suspect.',
        care: 'With frequent −10 °C, the manual warns that pipes and valves can freeze even when insulated: keep the valves indoors, and know where to shut the water off.',
      },
    ),
    tip: l(
      'En dessous de −15 °C, ou avec une neige qui reste plus de 24 h, le constructeur demande de le consulter : c’est écrit noir sur blanc.',
      'Below −15 °C, or with snow lying more than 24 h, the maker asks to be consulted: it is written in plain words.',
    ),
    design: l(
      'Le réseau pousse aussi l’eau chaude vers les robinets : cette même pression sert deux fois, et c’est pourquoi le ballon est une cuve d’acier épais, pas un réservoir.',
      'The mains also push the hot water to the taps: the same pressure serves twice, which is why the tank is a thick steel vessel, not a cistern.',
    ),
  },
  {
    id: 'hot-line',
    scene: 'house',
    category: 'hydraulic',
    name: l('Conduite d’eau chaude', 'Hot water line'),
    short: l(
      'Du toit aux robinets, à travers la maison : elle doit tenir la température du ballon, pas celle de la douche.',
      'From the roof to the taps, down through the house: it must bear the tank’s temperature, not the shower’s.',
    ),
    description: lf(
      'Entre le ballon et le mitigeur, cette conduite voit l’eau telle qu’elle sort : de 60 °C à 70 °C en été, et parfois jusqu’à 95 °C selon le manuel. Son matériau doit le supporter, ce qui écarte les tuyaux ordinaires pour eau froide. Dans ce dessin, elle descend par la tranche de la maison jusqu’à la salle de bains, et ses points ne bougent que quand un robinet tire. Le reste du temps, elle refroidit : plus elle est longue, plus d’eau chaude y reste à perdre.',
      'Between the tank and the mixing valve, this line sees the water as it leaves: 60 °C to 70 °C in summer, and at times up to 95 °C according to the manual. Its material must bear that, which rules out ordinary cold-water pipe. In this drawing it comes down through the slice of the house to the bathroom, and its dots only move when a tap draws. The rest of the time it cools: the longer it is, the more hot water sits in it to be lost.',
    ),
    material: l('Tube résistant à la température du ballon', 'Pipe rated for the tank’s temperature'),
    specs: [
      sp('En usage familial, en été', 'In family use, in summer', l('60 °C à 70 °C', '60 °C to 70 °C')),
      sp('Parfois', 'At times', l('jusqu’à 95 °C', 'up to 95 °C')),
      sp('Départ du ballon', 'Tank connection', l('R ½', 'R ½')),
    ],
    maintenance: maint(
      {
        failure:
          'Un tuyau qui se déforme ou un raccord qui cède sous une eau bien plus chaude que prévu, en général après une semaine sans tirage.',
        check:
          'Touchez la conduite prudemment après une longue absence, ouvrez un robinet de cuisine à petit débit et regardez les raccords dans les premières minutes.',
        care: 'Isolez la conduite là où elle est accessible. Remplacez toute section en matériau non prévu pour ces températures : elle ne préviendra pas.',
      },
      {
        failure:
          'A pipe creeping or a joint giving way under water far hotter than planned, usually after a week with no draw.',
        check:
          'Feel the line with care after a long absence, open a kitchen tap to a small flow and watch the joints for the first few minutes.',
        care: 'Insulate the line where you can reach it. Replace any section of a material not meant for these temperatures: it will give no warning.',
      },
    ),
    tip: l(
      'Après deux semaines sans tirage, c’est un robinet de cuisine qu’on ouvre le premier, jamais une flamme à côté : le manuel explique pourquoi, sur la fiche de la cuve.',
      'After two weeks with no draw, a kitchen tap is what you open first, with no flame nearby: the manual says why, on the vessel’s sheet.',
    ),
    design: l(
      'Le mitigeur se pose le plus près possible de ce qu’il protège : la partie brûlante de la conduite s’arrête là, et le trajet jusqu’à la douche se fait en eau mitigée.',
      'The mixing valve goes as close as it can to what it serves: the scalding part of the line stops there, and the rest of the way to the shower runs on mixed water.',
    ),
  },
  {
    id: 'drain-outlet',
    scene: 'house',
    category: 'hydraulic',
    name: l('Évacuation des soupapes', 'Relief drain outlet'),
    short: lf(
      'Là où retombe ce que les soupapes laissent sortir : de l’eau parfois brûlante, à l’air libre, jamais bouchée.',
      'Where whatever the valves let out comes down: water that may be scalding, in the open, never blocked.',
    ),
    description: lf(
      'Quand le ballon chauffe, son eau se dilate : de 10 °C à 80 °C, {expansionL} doivent sortir. C’est pour cela qu’il coule un peu ici pendant le chauffage, ce que le manuel annonce noir sur blanc : une goutte à cet endroit veut dire que tout va bien. Chaque évacuation descend sans contre-pente, séparément, sur 9 m au plus, et finit visible. Jamais sur le toit ni dans une gouttière : l’eau y serait brûlante, et le glycol ne doit pas rejoindre une cuve d’eau de pluie, dont il tue les algues et salit l’eau.',
      'As the tank heats, its water expands: from 10 °C to 80 °C, {expansionL} must leave. That is why a little runs here during heating, as the manual says in plain words: a drip at this spot means all is well. Each drain falls with no rise, on its own, over 9 m at most, and ends in view. Never on the roof or in a gutter: the water there would be scalding, and glycol must not reach a rainwater tank, where it kills the algae and fouls the water.',
    ),
    material: l('Tube rigide résistant à la chaleur', 'Rigid heat-resistant pipe'),
    specs: [
      sp('Dilatation, 10 °C à 80 °C', 'Expansion, 10 °C to 80 °C', v('{expansionL}')),
      sp('Longueur', 'Length', l('9 m au plus', '9 m at most')),
      sp('Pente', 'Fall', l('continue, sans contre-pente', 'continuous, with no rise')),
      sp('Fin', 'End', l('à l’air libre, visible', 'in the open, in view')),
    ],
    maintenance: maint(
      {
        failure:
          'Une sortie bouchée par un nid, le calcaire ou le gel : c’est un défaut grave, puisqu’il retire la voie de sortie de la pression.',
        check:
          'Tous les 6 mois, quand on manœuvre les leviers : de l’eau doit couler franchement ici, puis s’arrêter. Si rien ne sort, ou si cela coule sans arrêt, cherchez pourquoi.',
        care: 'Ne prolongez jamais une sortie, n’y posez ni bouchon ni robinet. Gardez la fin dégagée, et hors de portée des enfants.',
      },
      {
        failure:
          'An outlet blocked by a nest, scale or frost: this is a serious fault, since it removes the pressure’s way out.',
        check:
          'Every 6 months, when working the levers: water must run freely here, then stop. If nothing comes, or if it never stops, find out why.',
        care: 'Never extend an outlet or put a plug or tap on it. Keep its end clear, and out of children’s reach.',
      },
    ),
    tip: lf(
      'Dans le monde du ballon, la goutte sur l’entonnoir suit le chiffre du modèle : en semaine de vacances, regardez-la à côté de la « Goutte de la soupape » du panneau.',
      'In the tank’s world, the drip at the funnel follows the model’s figure: in the holiday week, watch it beside “Relief drip” in the panel.',
    ),
    design: l(
      'Une goutte visible vaut mieux qu’un tuyau discret : personne ne remarque une soupape qui ne s’ouvre plus, sauf si on a appris à attendre sa goutte.',
      'A visible drip beats a discreet pipe: nobody notices a valve that no longer opens, unless they have learned to expect its drip.',
    ),
  },
  {
    id: 'meter-box',
    scene: 'house',
    category: 'electrical',
    name: l('Tableau et interrupteur', 'Meter box and isolator'),
    short: l(
      'Le seul courant de toute la machine : l’appoint, son interrupteur de coupure et son horloge.',
      'The only current in the whole machine: the booster, its isolating switch and its timer.',
    ),
    description: lf(
      'La circulation ne demande aucune électricité : seule la résistance d’appoint en prend, en 240 V, entre 8 et 15 A selon sa puissance. Elle a son propre interrupteur de coupure et une horloge, qui décide quand elle a le droit de chauffer. Tout le choix est là : laissée allumée en permanence, elle chauffe l’eau que le soleil aurait chauffée. Dans le modèle, l’horloge chauffe de {timerFrom} à {timerTo}, une hypothèse, pour la douche du soir et sans voler la place du soleil du lendemain.',
      'The circulation asks for no electricity: only the booster takes any, at 240 V, between 8 and 15 A depending on its power. It has its own isolating switch and a timer that decides when it may heat. The whole choice lies there: left on all the time, it heats water the sun would have heated. In the model the timer runs from {timerFrom} to {timerTo}, an assumption, for the evening shower and without taking room from the next day’s sun.',
    ),
    material: l('Tableau électrique du logement', 'The house’s electrical panel'),
    specs: [
      sp('Tension', 'Voltage', '240 V'),
      sp('Courant', 'Current', l('8 à 15 A', '8 to 15 A')),
      sp('Appoint', 'Booster', l('1,8, 2,4 ou 3,6 kW', '1.8, 2.4 or 3.6 kW')),
      sp('Mise sous tension', 'Powering up', l('seulement ballon plein', 'only with the tank full')),
    ],
    maintenance: maint(
      {
        failure:
          'Une résistance sous tension dans un ballon vide grille en quelques instants. Un disjoncteur qui saute signale le plus souvent un élément entartré ou percé.',
        check:
          'L’hiver, comparez l’heure de chauffe à celle prévue : une horloge décalée d’une heure après un changement d’heure gaspille sans rien dire.',
        care: 'Coupez l’interrupteur avant toute intervention sur le ballon, et laissez le raccordement à un électricien qualifié : c’est du courant du réseau, sur un toit, à côté de l’eau.',
      },
      {
        failure:
          'An element powered in an empty tank burns out in moments. A breaker that trips most often points to a scaled or holed element.',
        check:
          'In winter, compare the heating hour with the planned one: a timer one hour out after the clocks change wastes energy silently.',
        care: 'Open the isolator before any work on the tank, and leave the wiring to a qualified electrician: this is mains current, on a roof, next to water.',
      },
    ),
    tip: l(
      'Le mot « sans électricité » vaut pour la circulation, pas pour les jours gris : c’est ici que se lit la différence.',
      'The words “no electricity” hold for the circulation, not for grey days: this is where the difference shows.',
    ),
    design: l(
      'Une horloge qui n’allume qu’en fin de journée laisse d’abord travailler le soleil, sur une eau encore froide : l’appoint n’a plus qu’à finir.',
      'A timer that only comes on late in the day lets the sun work first, on water still cold: the booster just has to finish.',
    ),
  },
  {
    id: 'shade-tree',
    scene: 'house',
    category: 'site',
    name: l('L’olivier', 'The olive tree'),
    short: l(
      'Son ombre doit manquer les capteurs toute l’année : c’est la première règle de la pose.',
      'Its shadow must miss the collectors all year: that is the first rule of siting.',
    ),
    description: l(
      'Le constructeur ne demande pas seulement un toit bien orienté : il demande aucune ombre, toute l’année. Un arbre pousse, et le soleil d’hiver passe bas : ce qui est dégagé en juin peut ne plus l’être en décembre. Cet olivier est dessiné assez bas pour que son ombre manque les capteurs sur les quatre sites du lab, à toute heure et en toute saison, vérifié par calcul sur le dessin. Le modèle, lui, ne connaît aucune ombre : il faudrait ajouter vous-même le manque à gagner d’un voisin trop grand.',
      'The maker does not just ask for a well-facing roof: it asks for no shade, all year. A tree grows, and the winter sun runs low: what is clear in June may not be in December. This olive is drawn low enough for its shadow to miss the collectors at all four of the lab’s sites, at any hour and in any season, checked by calculation on the drawing. The model knows no shade at all: you would have to take off the loss from a tall neighbour yourself.',
    ),
    material: l('Olivier, un décor générique', 'Olive tree, a generic setting'),
    specs: [
      sp('Règle du constructeur', 'The maker’s rule', l('aucune ombre, toute l’année', 'no shade, all year')),
      sp('Face à', 'Facing', l('l’équateur', 'the equator')),
      sp('Pente conseillée', 'Advised pitch', l('90 à 100 % de la latitude', '90 to 100% of the latitude')),
      sp('20° d’écart', '20° off', l('environ −10 % par an', 'about −10% a year')),
      sp('45° d’écart au sud', '45° off south', l('−4 à −5 %', '−4 to −5%')),
    ],
    maintenance: maint(
      {
        failure:
          'L’ombre qui revient en quelques années, à mesure que l’arbre grandit, sans aucune alarme : la machine perd simplement ses matins d’hiver.',
        check:
          'Un soir de décembre, regardez où finit l’ombre, ou faites le tour du toit avec une application de course du soleil. L’ombre d’hiver est la seule qui compte vraiment.',
        care: 'Taillez avant que l’ombre n’arrive sur le verre. Préférez déplacer le problème sur plan, avant de poser, plutôt que de le tailler chaque année.',
      },
      {
        failure:
          'The shadow coming back over a few years as the tree grows, with no alarm: the machine simply loses its winter mornings.',
        check:
          'On a December evening, see where the shadow ends, or walk the roof with a sun-path app. The winter shadow is the only one that really counts.',
        care: 'Prune before the shadow reaches the glass. Better to solve it on paper before fitting than to prune every year.',
      },
    ),
    tip: l(
      'Faites avancer l’heure dans la Simulation : le soleil et les ombres de ce monde suivent le lieu et le jour choisis.',
      'Move the hour on in the Simulation: the sun and the shadows of this world follow the chosen place and day.',
    ),
    design: l(
      'L’axe de la machine est l’équateur, et non le sud : ce modèle vient d’Australie, où son « nord » est notre sud. Sur le toit, seule compte la direction du soleil de midi.',
      'The machine’s axis is the equator, not the south: this model comes from Australia, where its “north” is our south. On the roof, only the direction of the noon sun counts.',
    ),
  },
];
