// Parts of the `collector` world (9): one collector, layer by layer. The bores are estimates, the header's forced by the 3.8 L the maker gives; `air-gap` names something with no surface, and its sheet says so. Where the sun becomes heat, and where the night takes it back.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const COLLECTOR_PARTS: PartInfo[] = [
  {
    id: 'glass-cover',
    scene: 'collector',
    category: 'structure',
    name: l('Vitrage', 'Glass cover'),
    short: l(
      '3,2 mm de verre trempé à faible teneur en fer : il laisse entrer le soleil et retient ce que la plaque renvoie.',
      '3.2 mm of tempered low-iron glass: it lets the sun in and holds back what the plate sends out.',
    ),
    description: l(
      'La lumière du soleil traverse le verre, et la plaque chauffée renvoie une chaleur de plus grande longueur d’onde, que le verre arrête en bonne partie. Ce verre est à faible teneur en fer, sans le reflet vert du verre courant, pour moins absorber au passage. Il est trempé : en cas de choc, il part en petits morceaux. Son rendement n’est pas le même selon l’angle du soleil, et le laboratoire le mesure : 0,98 du rendement à 10° d’incidence, 0,96 à 30°, 0,90 à 50°, 0,83 à 60°, et 0,69 à 70°, ce qui compte surtout tôt et tard.',
      'Sunlight passes through the glass, and the heated plate sends back heat at a longer wavelength, which the glass largely stops. This is low-iron glass, without the green edge of ordinary glass, so it takes less on the way through. It is tempered: if struck, it goes into small pieces. Its efficiency changes with the sun’s angle, as the laboratory measures: 0.98 of the efficiency at 10° of incidence, 0.96 at 30°, 0.90 at 50°, 0.83 at 60° and 0.69 at 70°, which counts mostly early and late in the day.',
    ),
    material: l('Verre trempé à faible teneur en fer', 'Tempered low-iron glass'),
    specs: [
      sp('Épaisseur', 'Thickness', l('3,2 mm', '3.2 mm')),
      sp('Coefficient à 10°, 30°', 'Modifier at 10°, 30°', l('0,98, 0,96', '0.98, 0.96')),
      sp('Coefficient à 50°, 60°, 70°', 'Modifier at 50°, 60°, 70°', l('0,90, 0,83, 0,69', '0.90, 0.83, 0.69')),
    ],
    maintenance: maint(
      {
        failure:
          'La grêle, un outil tombé, une pierre : le verre trempé casse d’un coup, et la plaque est alors à nu. Une pellicule de poussière, sur un toit trop plat ou dans un lieu sec.',
        check:
          'Un coup d’œil en passant, du jardin. Sur un toit plat, comparez le rendement d’un mois sur l’autre : la poussière se lit dans les chiffres.',
        care: 'En général la pluie suffit. Sinon de l’eau propre, à la fraîche, jamais d’eau froide sur un verre brûlant. Une casse se répare avec un verre du même modèle, pas au hasard.',
      },
      {
        failure:
          'Hail, a dropped tool, a stone: tempered glass goes all at once, leaving the plate bare. A film of dust, on a roof too flat or in a dry place.',
        check:
          'A glance in passing, from the garden. On a flat roof, compare output month by month: dust shows in the figures.',
        care: 'Rain usually does it. Otherwise clean water, in the cool, never cold water on hot glass. A break is mended with glass of the same model, not whatever comes.',
      },
    ),
    tip: l(
      'Cette fiche ouverte, l’outil Transparence ne garde en plein que le verre : les autres pièces s’estompent, tubes compris. Fermez la fiche sans couper l’outil : le verre, son joint et la plaque s’effacent, et les tubes restent à la couleur de leur température.',
      'With this sheet open, X-ray keeps only the glass solid: the other parts fade, tubes included. Close the sheet with the tool still on: the glass, its seal and the plate fade, and the tubes keep the colour of their temperature.',
    ),
    design: lf(
      'Il coûte de la lumière dès l’entrée : c’est pour cela que le rendement à température égale n’est que 0,778. Mais sans lui, le vent emporterait la chaleur. La nuit, c’est lui qui rayonne vers le ciel clair et tire la plaque vers le bas : le modèle le place à {depression} sous l’air pour de l’air à 10 °C.',
      'It costs light right at the entrance: that is why the efficiency at equal temperature is only 0.778. But without it, the wind would carry the heat off. At night, it is the glass that radiates to the clear sky and pulls the plate down: the model puts the plate {depression} below the air for air at 10 °C.',
    ),
  },
  {
    id: 'glass-seal',
    scene: 'collector',
    category: 'structure',
    name: l('Joint de vitrage', 'Glass seal'),
    short: l(
      'Le joint souple autour du verre : il garde l’air immobile et la pluie dehors.',
      'The flexible seal round the glass: it keeps the air still and the rain out.',
    ),
    description: lf(
      'Il remplit le cadre de {frameWidth} qui reste autour de l’ouverture, entre le verre et l’aluminium. C’est un bon exemple de pièce sans chiffre : personne ne publie sa matière ni sa forme, et le dessin en donne une, générique. Son travail se voit par son absence : un joint qui fuit laisse entrer le vent, et l’air bouge sous le verre. La buée vient aussi par là, et c’est elle qui signale d’abord que quelque chose s’ouvre.',
      'It fills the {frameWidth} frame left round the aperture, between the glass and the aluminium. It is a fine example of a part with no figure: nobody publishes its material or its shape, and the drawing gives it a generic one. Its work shows by its absence: a seal that leaks lets the wind in, and the air moves under the glass. Mist comes that way too, and that is what first tells you something is opening.',
    ),
    material: l('Élastomère, matière non publiée', 'Elastomer, material not published'),
    specs: [
      sp('Cadre autour de l’ouverture', 'Frame round the aperture', v('{frameWidth}')),
      sp('Matière, forme', 'Material, shape', l('non publiées', 'not published')),
    ],
    maintenance: maint(
      {
        failure:
          'Le soleil et les chocs de température le durcissent peu à peu : il finit par se fendre aux angles. La buée sous le verre est le premier signe.',
        check:
          'Un doigt le long du joint, capteur froid : souple et continu. Une fissure à un angle ou une buée qui reste au soleil appellent une intervention.',
        care: 'Sa réparation passe par le fournisseur du capteur, parce que le verre doit être déposé. Évitez les mastics au hasard : ils piègent l’humidité.',
      },
      {
        failure:
          'Sun and temperature swings slowly harden it: it ends up splitting at the corners. Mist under the glass is the first sign.',
        check:
          'A finger along the seal, collector cold: supple and continuous. A crack at a corner or mist that stays in the sun calls for a repair.',
        care: 'Mending it goes through the collector’s supplier, since the glass must come off. Avoid random sealants: they trap moisture.',
      },
    ),
    tip: l(
      'Sélectionnez-le et faites tourner la vue : ce fin contour fait toute l’étanchéité du capteur.',
      'Select it and turn the view: this thin outline is the whole of the collector’s seal.',
    ),
    design: l(
      'Il doit à la fois serrer un verre fragile et laisser le caisson se dilater. C’est pour cela qu’il est souple, et qu’on ne colle pas simplement le verre.',
      'It has to grip a fragile pane and still let the tray expand. That is why it is soft, and why the glass is not simply glued in.',
    ),
  },
  {
    id: 'air-gap',
    scene: 'collector',
    category: 'structure',
    name: l('Lame d’air', 'Air gap'),
    short: l(
      'Aucune surface, aucune matière à toucher : juste de l’air immobile, l’isolant côté soleil. Son contour n’est qu’un repère.',
      'No surface, nothing to touch: just still air, the insulation on the sun’s side. Its outline is only a marker.',
    ),
    description: l(
      'Cette pièce n’en est pas une : l’air n’a pas de surface. Le lab lui donne une fine plaque presque invisible pour pouvoir la nommer, la sélectionner et voir son contour, mais il n’y a rien à cet endroit. Pourtant, elle compte autant qu’un isolant : tant qu’il ne bouge pas, l’air conduit très mal la chaleur, et c’est grâce à lui que la face avant ne se vide pas. Il n’a qu’une faiblesse : si le joint fuit, le vent entre et l’isolant disparaît. La nuit, à travers cette lame, la plaque regarde le ciel et se refroidit.',
      'This part is no part: air has no surface. The lab gives it a thin, nearly invisible slab so that it can be named, selected and outlined, but nothing is there. Yet it counts as much as any insulation: as long as it stays still, air conducts heat very poorly, and it is thanks to the air that the front face does not empty itself. It has one weakness: if the seal leaks, the wind gets in and the insulation is gone. At night, through this gap, the plate looks at the sky and cools.',
    ),
    material: l('De l’air, immobile', 'Air, keeping still'),
    specs: [
      sp('Surface', 'Surface', l('aucune : son contour est un repère', 'none: its outline is a marker')),
      sp('Fonction', 'Duty', l('l’isolant côté soleil', 'the insulation on the sun’s side')),
    ],
    maintenance: maint(
      {
        failure:
          'De l’air qui bouge ou qui prend l’humidité : une fuite du joint, pas de la lame elle-même. Elle ne s’use pas toute seule.',
        check:
          'La buée. Si elle s’installe durablement sous le verre, c’est que le joint a laissé entrer de l’air humide.',
        care: 'Rien : on soigne le joint. C’est aussi la seule fiche de ce lab qui n’a pas de pièce à commander.',
      },
      {
        failure:
          'Air that moves or takes in moisture: a leak from the seal, not from the gap itself. It does not wear out by itself.',
        check: 'The mist. If it settles for good under the glass, the seal has let moist air in.',
        care: 'Nothing: you look after the seal. This is also the only sheet in the lab with no part to order.',
      },
    ),
    tip: l(
      'Sélectionnez-la, et regardez ce qui s’allume : un contour dans le vide. C’est honnête : il n’y a rien d’autre à montrer.',
      'Select it and see what lights up: an outline in empty space. That is honest: there is nothing else to show.',
    ),
    design: l(
      'Trop mince, l’air conduit directement ; trop épais, il se met à tourner. Le constructeur ne publie pas sa valeur : l’écart dessiné ici est ce que les 83 mm du capteur laissent.',
      'Too thin, the air conducts straight across; too thick, it starts to turn over. The maker does not publish its value: the gap drawn here is what the collector’s 83 mm leaves.',
    ),
  },
  {
    id: 'absorber-plate',
    scene: 'collector',
    category: 'hydraulic',
    name: l('Absorbeur', 'Absorber plate'),
    short: l(
      'Une tôle d’acier couverte de poudre polyester noire : elle prend le soleil, et elle rayonne aussi.',
      'A steel sheet with a black polyester powder coat: it takes in the sun, and it radiates too.',
    ),
    description: lf(
      'Cette plaque fait la seule transformation de la machine : le soleil devient chaleur, à sa surface, et passe dans les tubes qu’elle épouse. Elle est peinte en noir, sans revêtement sélectif : elle absorbe bien, mais rayonne aussi fort, environ {plateEps} d’émissivité. Quand le fluide est peu chaud, c’est un bon choix : la courbe noire bat la courbe sélective jusqu’à {crossK} au-dessus de l’air pour {crossG}. Mais la nuit, ce rayonnement la refroidit plus vite qu’une plaque sélective : {depression} sous l’air contre {depressionSel}.',
      'This plate does the machine’s one conversion: sunlight turns into heat at its surface and passes into the tubes it hugs. It is painted black, with no selective coating: it absorbs well, but also radiates strongly, about {plateEps} of emissivity. When the fluid is not very hot, that is a good choice: the black curve beats the selective one up to {crossK} above the air at {crossG}. At night, though, this radiation cools it faster than a selective plate: {depression} below the air against {depressionSel}.',
    ),
    material: l('Acier, poudre polyester noire', 'Steel, black polyester powder coat'),
    specs: [
      sp('Revêtement', 'Coating', l('noir, non sélectif', 'black, non-selective')),
      sp('Émissivité', 'Emissivity', v('{plateEps}')),
      sp('Sous l’air, nuit claire à 10 °C', 'Below the air, clear night at 10 °C', v('{depression}')),
      sp('Même nuit, sans vent', 'Same night, no wind', v('{depressionCalm}')),
      sp('Même nuit, à 5 m/s', 'Same night, at 5 m/s', v('{depressionWindy}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une peinture qui se farine au bout de longues années, et une tôle qui se tache si l’humidité entre. Le rendement baisse doucement, sans panne à constater.',
        check: 'À travers le verre : un noir mat et égal. Une zone grise ou des cloques disent qu’il a pris l’eau.',
        care: 'Pas d’entretien propre. Sa vie se joue dans le joint et le verre : c’est eux qu’on surveille.',
      },
      {
        failure:
          'Paint chalking after many years, and a sheet that stains if moisture gets in. Output falls gently, with no fault to point to.',
        check: 'Through the glass: an even matt black. A grey patch or blisters say it has taken water.',
        care: 'No care of its own. Its life depends on the seal and the glass: those are what you watch.',
      },
    ),
    tip: lf(
      'Essayez « Sélectif » dans la Simulation : le modèle gagne de {selectiveModelLow} à {selectiveModelHigh} par an selon le lieu. Mais ce réglage ne change pas la couleur de la plaque sur le dessin.',
      'Try “Selective” in the Simulation: the model gains {selectiveModelLow} to {selectiveModelHigh} a year depending on the place. That setting does not change the plate’s colour in the drawing, though.',
    ),
    design: lf(
      'Le fabricant publie les deux versions, et ses propres résultats favorisent le sélectif de {selectiveLow} à {selectiveHigh} selon le site. Le modèle, avec la courbe d’un autre capteur sélectif, n’en trouve qu’une partie : son bilan ne remplace pas celui du fabricant.',
      'The maker publishes both versions, and its own results favour the selective one by {selectiveLow} to {selectiveHigh} depending on the site. The model, using the curve of another selective collector, finds only part of that: its balance does not replace the maker’s.',
    ),
  },
  {
    id: 'riser-tube',
    scene: 'collector',
    category: 'hydraulic',
    name: l('Tube montant', 'Riser tube'),
    short: lf(
      '35 tubes d’acier espacés de {riserPitch} : c’est là que le fluide chauffe, et que la montée commence.',
      '35 steel tubes spaced {riserPitch} apart: this is where the fluid warms, and where the climb starts.',
    ),
    description: lf(
      'Un capteur a 35 tubes, et la rangée en a {risersAll}. Le fluide les monte à environ {riserSpeed} à midi, dix fois moins vite que dans les tuyaux, car il se répartit entre eux tous. Personne ne publie leur diamètre : {riserBore} est une estimation, entre d’autres machines et ce que permet l’écart. Le chiffre surprend moins qu’on ne croit, car l’énergie survit à un tube étroit : dans le modèle, 3 mm ramènent le débit de midi à {narrow3Flow}, mais ne retirent que {narrow3Day} à la journée et {narrow3Year} à l’année. À 2 mm, {narrow2Flow}, {narrow2Rise} de montée et {narrow2Day} de moins.',
      'A collector has 35 tubes, and the bank has {risersAll}. The fluid climbs them at about {riserSpeed} at noon, ten times slower than in the pipes, since it shares itself out among them all. Nobody publishes their bore: {riserBore} is an estimate, between other machines and what the spacing allows. The figure surprises less than you might think, because energy survives a narrow tube: in the model, 3 mm brings the noon flow down to {narrow3Flow}, but only takes {narrow3Day} off the day and {narrow3Year} off the year. At 2 mm, {narrow2Flow}, a rise of {narrow2Rise} and {narrow2Day} less.',
    ),
    material: l('Tube d’acier', 'Steel tube'),
    qty: 35,
    specs: [
      sp('Par capteur', 'Per collector', '35'),
      sp('Espacement', 'Spacing', v('{riserPitch}')),
      sp('Diamètre intérieur', 'Bore', v('{riserBore}')),
      sp('Vitesse à midi', 'Speed at noon', v('{riserSpeed}')),
    ],
    maintenance: maint(
      {
        failure:
          'Le gel, qui fend un tube dans un mélange trop dilué. Des boues dans un circuit mal rempli, qui bouchent les tubes les plus étroits en premier.',
        check:
          'Une image thermique, si vous en trouvez une : un tube froid au milieu de tubes chauds dit qu’il est bouché. À défaut, une trace bleue sur le caisson.',
        care: 'Du bon glycol, au bon dosage, à chaque changement : le manuel confie le fluide aux installateurs à la révision.',
      },
      {
        failure:
          'Frost, which splits a tube in an over-diluted mix. Sludge in a badly filled circuit, blocking the narrowest tubes first.',
        check:
          'A thermal image, if you can find one: a cold tube among warm ones means a blockage. Failing that, a blue trace on the tray.',
        care: 'Good glycol, at the right strength, at each change: the manual leaves the fluid to the installers at the service.',
      },
    ),
    tip: l(
      'Lancez « Des tubes trop fins » et regardez l’énergie du soir plutôt que le débit. Un modèle ne dit pas si un tel circuit démarre : il n’a pas de seuil.',
      'Run “Tubes too narrow” and watch the evening’s energy rather than the flow. A model cannot say whether such a circuit starts: it has no threshold.',
    ),
    design: lf(
      'Des bricoleurs utilisent des grilles de frigo, à tubes fins. Elles ont porté du fluide frigorigène et de l’huile : à notre avis, cela les écarte d’une boucle d’eau potable, même si aucune source lue ne le dit en toutes lettres. Les {riserBore} de ce modèle sont une hypothèse, pas une recette à copier.',
      'Some home builders use fridge grids, with narrow tubes. These have carried refrigerant and oil: in our view that rules them out of a drinking-water loop, though no source we read says so outright. This model’s {riserBore} are an assumption, not a recipe to copy.',
    ),
  },
  {
    id: 'upper-header',
    scene: 'collector',
    category: 'hydraulic',
    name: l('Collecteur haut', 'Upper header'),
    short: l(
      'Il reçoit le fluide chaud de tous les tubes, tout en haut du capteur : c’est de sa hauteur que tout se mesure.',
      'It gathers the warm fluid from every tube, at the very top of the collector: every height is measured from here.',
    ),
    description: lf(
      'Il court le long du bord haut, sur toute la largeur de 1 027 mm, et reçoit le fluide des 35 tubes. Son diamètre vient d’un petit calcul : un capteur tient 3,8 L, les tubes en prennent la plus grande part, et ce qui reste, pour deux collecteurs, donne {headerBore}. C’est aussi à lui que se réfère la hauteur du ballon : y = 0 veut dire que le bas du ballon est juste à ce niveau.',
      'It runs along the upper edge, over the whole 1,027 mm width, and takes the fluid from the 35 tubes. Its bore comes from a small calculation: a collector holds 3.8 L, the tubes take most of that, and what is left, for two headers, gives {headerBore}. The tank’s height refers to it as well: y = 0 means the bottom of the tank is just at this level.',
    ),
    material: l('Tube d’acier soudé', 'Welded steel tube'),
    specs: [
      sp('Longueur', 'Length', l('1 027 mm', '1,027 mm')),
      sp('Diamètre intérieur', 'Bore', v('{headerBore}')),
      sp('Hauteur à 30°, sur le bas', 'Rise at 30°, above the foot', v('{rise30}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une poche d’air, au point haut : c’est ici qu’elle s’installe si le remplissage est bâclé. La soudure avec un tube peut suinter à la longue.',
        check:
          'Un collecteur froid à midi, avec un bas de capteur chaud : la circulation est coupée. Un raccord taché de bleu au bout dit où la fuite se trouve.',
        care: 'Laissez à l’installateur la purge et les soudures : c’est lui qui rouvre le circuit.',
      },
      {
        failure:
          'An air pocket at the high point: this is where it settles after a careless filling. A weld with a tube may seep in time.',
        check:
          'A cold header at noon, with the collector’s foot warm: the flow is cut. A joint stained blue at the end says where the leak is.',
        care: 'Leave bleeding and welds to the installer: they are the one who reopens the circuit.',
      },
    ),
    tip: l(
      'La couleur de ce tube est celle de la sortie du capteur dans la Simulation : le chiffre « Sortie capteur » du panneau parle de lui.',
      'This tube’s colour is the collector’s outlet in the Simulation: the “Collector out” figure in the panel is about it.',
    ),
    design: lf(
      'Le bas du ballon, le haut de ce tube : deux pièces qu’on règle sans aucun instrument. C’est ce qui fait que la machine reste à y = 0 à {yBand} près, sur un toit de 10° à 30°.',
      'The bottom of the tank, the top of this tube: two things set with no instrument at all. That is what keeps the machine at y = 0 within {yBand}, on a roof from 10° to 30°.',
    ),
  },
  {
    id: 'lower-header',
    scene: 'collector',
    category: 'hydraulic',
    name: l('Collecteur bas', 'Lower header'),
    short: l(
      'Il partage le fluide froid entre tous les tubes, et c’est le premier endroit du capteur qui gèle.',
      'It shares the cold fluid among all the tubes, and it is the first place in the collector to freeze.',
    ),
    description: lf(
      'Ce que le collecteur haut rassemble, celui-ci le distribue, au pied du capteur. Il est froid par construction : il reçoit le bas du ballon. La nuit, il joue un rôle inverse : quand un filet coule à l’envers, c’est par là qu’il sort, et il sort plus froid que l’air, comme le mesurent des essais et comme le retrouve le modèle, à {depression} sous l’air quand l’air est à 10 °C. Par nuit de gel, ce pied du capteur atteint en premier le point de gel : c’est lui que regarde l’alarme.',
      'What the upper header gathers, this one hands out, at the collector’s foot. It is cold by design: it receives the tank’s bottom. At night it plays the opposite part: when a trickle runs backward, this is where it leaves, and it leaves colder than the air, as tests measure and as the model finds, {depression} below the air when the air is at 10 °C. On a frosty night, this foot of the collector reaches the freezing point first: that is what the alarm watches.',
    ),
    material: l('Tube d’acier soudé', 'Welded steel tube'),
    specs: [
      sp('Diamètre intérieur', 'Bore', v('{headerBore}')),
      sp('Point de gel du mélange', 'The mix freezes at', v('{glycolFreeze}')),
      sp('Air qui l’y amène, nuit claire', 'Air that brings it there, clear night', v('{frostMix}')),
      sp('Avec de l’eau seule', 'With water alone', lf('dès {frostWater} d’air', 'from {frostWater} of air')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fissure après un gel, à l’endroit le plus froid. Un dépôt, au point bas, dans un circuit jamais rincé.',
        check: 'Après toute nuit très froide, cherchez une trace bleue ici en premier.',
        care: 'Le bon dosage de glycol en hiver. Sous −15 °C, ou avec une neige qui reste, c’est le constructeur qu’il faut interroger.',
      },
      {
        failure: 'A crack after a frost, at the coldest spot. A deposit, at the low point, in a circuit never flushed.',
        check: 'After any very cold night, look for a blue trace here first.',
        care: 'The right glycol strength in winter. Below −15 °C, or with lying snow, the maker is the one to ask.',
      },
    ),
    tip: lf(
      'Sur une nuit de gel, le modèle s’arrête à la première glace : il ne dit pas si un tube éclate. Il faut garder ces {frostMix} pour ce qu’ils sont, les premiers cristaux, pas un seuil de rupture.',
      'On a frosty night, the model stops at the first ice: it does not say whether a tube bursts. Those {frostMix} must be taken for what they are, the first crystals, not a burst point.',
    ),
    design: lf(
      'Un clapet anti-retour supprime le filet qui passe ici la nuit. Le modèle montre que le pied du capteur n’y perd presque rien tant que le ballon est haut : ce filet, trop vite refroidi, ne le protégeait pas vraiment.',
      'A one-way valve removes the trickle that passes here at night. The model shows that the collector’s foot loses almost nothing by it while the tank stands high: that trickle, cooled so fast, was not really guarding it.',
    ),
  },
  {
    id: 'back-insulation',
    scene: 'collector',
    category: 'structure',
    name: l('Isolant arrière', 'Back insulation'),
    short: l(
      '38 mm de laine de polyester sous la plaque : la chaleur ne doit partir que vers les tubes.',
      '38 mm of polyester blanket under the plate: the heat should only go towards the tubes.',
    ),
    description: l(
      'Toute la chaleur que la plaque ne donne pas aux tubes peut partir vers l’avant, par le verre, ou vers l’arrière. Cette couche ferme l’arrière. C’est une laine de polyester de 38 mm. Elle pose aussi les tubes à leur niveau, au-dessus du caisson : c’est ce qui règle la hauteur de la plaque sous le verre. Le chiffre de perte du certificat, 6,541 W/m²K, la compte déjà.',
      'All the heat the plate does not hand to the tubes can go forward, through the glass, or backward. This layer closes the back. It is a 38 mm polyester blanket. It also sets the tubes at their level, above the tray: that fixes the plate’s height under the glass. The certificate’s loss figure, 6.541 W/m²K, already includes it.',
    ),
    material: l('Laine de polyester', 'Polyester blanket'),
    specs: [
      sp('Épaisseur', 'Thickness', '38 mm'),
      sp('Perte du capteur, en tout', 'Whole collector’s loss', l('6,541 W/m²K', '6.541 W/m²K')),
    ],
    maintenance: maint(
      {
        failure:
          'L’eau, si le caisson ou le joint laisse entrer la pluie : une laine humide isole mal, et elle sèche lentement sous le verre. La buée du matin en est souvent le signe.',
        check:
          'Rien à voir de dehors. Un capteur qui donne moins qu’avant, ou une buée qui ne part plus, justifie une dépose.',
        care: 'Elle se remplace seulement à la dépose. L’essentiel est de garder le caisson étanche.',
      },
      {
        failure:
          'Water, if the tray or the seal lets rain in: a wet blanket insulates poorly and dries slowly under the glass. Morning mist is often the sign.',
        check:
          'Nothing to see from outside. A collector giving less than before, or mist that no longer clears, justifies taking it down.',
        care: 'It is only replaced when the collector comes down. The main thing is to keep the tray sealed.',
      },
    ),
    tip: l(
      'Lancez Éclaté : cette couche, entre le caisson et les tubes, est la plus épaisse du capteur.',
      'Use Explode: this layer, between the tray and the tubes, is the thickest in the collector.',
    ),
    design: l(
      'Le caisson de ce capteur a 83 mm : 38 mm vont à cette laine, le reste aux tubes, à la lame d’air et au verre. Sur un petit toit, chaque millimètre gagné ici en épaisseur en coûte un autre ailleurs.',
      'This collector’s tray is 83 mm deep: 38 mm go to this blanket, the rest to the tubes, the air gap and the glass. On a small roof, each extra millimetre here costs one elsewhere.',
    ),
  },
  {
    id: 'collector-tray',
    scene: 'collector',
    category: 'structure',
    name: l('Caisson', 'Tray'),
    short: l(
      'Le plateau d’aluminium de 0,7 mm qui porte tout : 1 943 × 1 027 × 83 mm, et 43 kg avec tout ce qu’il contient.',
      'The 0.7 mm aluminium pan that carries it all: 1,943 × 1,027 × 83 mm, and 43 kg with everything in it.',
    ),
    description: lf(
      'Sa tôle est fine, 0,7 mm d’aluminium : le capteur tient par sa forme, pas par son épaisseur. Ses dimensions sont celles du constructeur, à quelques millimètres de l’échantillon du laboratoire. Le cadre qui reste autour de l’ouverture, {frameWidth}, se déduit des 1,87 m² : aucune fiche ne le donne. C’est lui qui se pose sur le rail et prend les feuillards.',
      'Its sheet is thin, 0.7 mm of aluminium: the collector holds by its shape, not its thickness. Its dimensions are the maker’s, within a few millimetres of the laboratory’s sample. The frame left round the aperture, {frameWidth}, follows from the 1.87 m²: no sheet gives it. This is what sits on the rail and takes the straps.',
    ),
    material: l('Aluminium de 0,7 mm', '0.7 mm aluminium'),
    specs: [
      sp('Tôle', 'Sheet', l('0,7 mm', '0.7 mm')),
      sp('Masse, capteur complet', 'Mass, whole collector', '43 kg'),
      sp('Cadre autour de l’ouverture', 'Frame round the aperture', v('{frameWidth}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un coup au bord au moment de la pose, qui ouvre le joint plus tard. Une corrosion au contact d’une pièce d’un autre métal, là où un feuillard frotte.',
        check:
          'Le tour du caisson, une fois posé : aucun enfoncement, aucun jour sous le verre. Une petite trace blanche d’oxydation aux fixations.',
        care: 'Une cale ou un isolant entre l’aluminium et un acier nu. Déplacez un capteur à deux, sans le prendre par le verre.',
      },
      {
        failure:
          'A knock on the edge during fitting, which opens the seal later. Corrosion where it touches another metal, where a strap rubs.',
        check:
          'A walk round the tray once fitted: no dents, no gap under the glass. A small white trace of oxide at the fixings.',
        care: 'A packer between aluminium and bare steel. Move a collector with two people, never by the glass.',
      },
    ),
    tip: l(
      'Ce monde s’ouvre déjà en coupe : la marche au coin du capteur montre les couches l’une sous l’autre. L’outil Coupe remplace cette marche par une vraie coupe à travers les tubes.',
      'This world already opens cut: the stair at the collector’s corner shows the layers one under the other. The Section tool replaces that stair with a true cut across the tubes.',
    ),
    design: l(
      'Une tôle fine suffit parce que le fluide ne s’y appuie jamais : la pression reste dans les tubes. C’est aussi ce qui rend le capteur assez léger pour être monté sur un toit.',
      'A thin sheet will do because the fluid never presses on it: the pressure stays in the tubes. That is also what makes the collector light enough to carry up to a roof.',
    ),
  },
];
