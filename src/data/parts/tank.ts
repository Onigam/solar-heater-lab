// Parts of the `tank-and-tap` world (17): the store and the way to the tap, in the order the heat flows. Said once here: the scald at `tempering-valve`, the hot discharge at `tpr-valve`, the hydrogen at `inner-vessel`, the blue leak at `mantle-jacket`, mains electricity at `booster-element`.
import type { PartInfo } from '@onigam/lab-kit/content';
import { l } from '@onigam/lab-kit/i18n';
import { lf, maint, sp, v } from '../part-helpers';

export const TANK_PARTS: PartInfo[] = [
  {
    id: 'inner-vessel',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Cuve émaillée', 'Enamelled vessel'),
    short: l(
      '2,5 mm d’acier et deux couches d’émail : elle tient 300 L d’eau potable, à la pression du réseau.',
      '2.5 mm of steel and two coats of enamel: it holds 300 L of drinking water at mains pressure.',
    ),
    description: lf(
      'C’est la seule pièce qui touche l’eau de la douche. Un acier à bas carbone de 2,5 mm porte la pression, deux couches d’émail vitrifié le séparent de l’eau, et une anode s’occupe de ce que l’émail laisse passer. Le constructeur donne le volume et le mur, pas le diamètre ni la longueur : le dessin prend {vesselDia} de diamètre, ce que 510 mm d’enveloppe laissent, et il en sort une longueur de {vesselLength} pour 300 L. Sa pression s’arrête à la soupape de 1 000 kPa.',
      'This is the only part that touches the shower’s water. Low-carbon steel, 2.5 mm thick, takes the pressure, two coats of vitreous enamel part it from the water, and an anode deals with whatever the enamel lets through. The maker gives the volume and the wall, not the diameter or length: the drawing takes {vesselDia} across, which a 510 mm case leaves room for, and that gives a length of {vesselLength} for 300 L. Its pressure stops at the 1,000 kPa valve.',
    ),
    material: l('Acier à bas carbone, deux couches d’émail vitrifié', 'Low-carbon steel, two coats of vitreous enamel'),
    specs: [
      sp('Volume', 'Volume', '300 L'),
      sp('Paroi', 'Wall', l('2,5 mm', '2.5 mm')),
      sp('Diamètre, longueur', 'Diameter, length', lf('{vesselDia}, {vesselLength}', '{vesselDia}, {vesselLength}')),
      sp('Soupape du ballon', 'Tank’s relief', l('1 000 kPa', '1,000 kPa')),
    ],
    maintenance: maint(
      {
        failure:
          'La rouille à travers un défaut d’émail, quand l’anode n’est plus là pour payer à sa place. Elle ne se répare pas : le ballon se remplace.',
        check:
          'Une eau rousse, ou l’anode très usée à la révision. Laissée sans tirage deux semaines ou plus, de l’hydrogène inflammable peut s’y amasser : le manuel demande de faire couler un robinet d’évier, sans flamme à côté.',
        care: 'L’anode à 5 ans. Une eau de moins de 1 000 ppm de sels dissous et 200 ppm de dureté prolonge sa vie.',
      },
      {
        failure:
          'Rust through a flaw in the enamel, once the anode is no longer there to pay instead. It cannot be mended: the tank gets replaced.',
        check:
          'Rusty water, or a very worn anode at the service. Left undrawn for two weeks or more, flammable hydrogen may gather in it: the manual asks you to run a sink tap, with no flame nearby.',
        care: 'The anode at 5 years. Water under 1,000 ppm of dissolved solids and 200 ppm of hardness makes it last longer.',
      },
    ),
    tip: l(
      'Ce monde s’ouvre déjà en coupe le long de l’axe. L’outil Coupe la remplace par une coupe en travers, pour voir les dix couches comme des tranches d’un cercle.',
      'This world already opens cut along the axis. The Section tool swaps that for a cut across, to see the ten layers as slices of a circle.',
    ),
    video: ['01:31'],
    design: l(
      'L’eau potable reste sous pression, ici et seulement ici. C’est pour cela qu’une cuve de cette taille pèse tant : elle pourrait être bien plus légère si elle ne servait qu’à retenir de l’eau.',
      'The drinking water stays under pressure, here and only here. That is why a vessel this size weighs so much: it could be far lighter if it only had to hold water back.',
    ),
  },
  {
    id: 'mantle-jacket',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Double enveloppe', 'Heat-exchange jacket'),
    short: lf(
      'Environ {jacketL} de mélange dans une fente autour de la cuve : les deux liquides ne se touchent jamais.',
      'About {jacketL} of mix in a thin gap round the vessel: the two liquids never touch.',
    ),
    description: lf(
      'Le fluide chaud monte dans cette fente, le long de la cuve, y laisse sa chaleur à travers l’acier, puis redescend, ses deux orifices près du bas. Son volume se déduit de deux façons qui s’accordent : la masse donne {jacketL} (417 − 107 − 300), le circuit de 19 L moins le reste donne {jacketModelL}. Le reste est estimé : une fente de {jacketGap} sur {jacketArea}, sur la moitié basse, soit {jacketHeight} de haut, avec un échange de {jacketUA}. Une corrélation publiée existe pour ce type de double enveloppe, mais ses coefficients n’ont pas pu être lus.',
      'The warm fluid climbs through this gap, along the vessel, gives up its heat through the steel, and comes back down, with both ports near the bottom. Its volume follows two ways that agree: the masses give {jacketL} (417 − 107 − 300), the 19 L circuit less the rest gives {jacketModelL}. The rest is estimated: a {jacketGap} gap over {jacketArea}, on the lower half, so {jacketHeight} high, with an exchange of {jacketUA}. A published correlation exists for this kind of jacket, but its coefficients could not be read.',
    ),
    material: l('Tôle d’acier formée autour de la cuve', 'Steel sheet formed round the vessel'),
    specs: [
      sp('Volume', 'Volume', lf('environ {jacketL}', 'about {jacketL}')),
      sp('Fente', 'Gap', v('{jacketGap}')),
      sp('Surface d’échange', 'Exchange area', v('{jacketArea}')),
      sp('Échange', 'Exchange', v('{jacketUA}')),
      sp('Hauteur', 'Height', v('{jacketHeight}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une fuite à travers la paroi commune : le glycol passerait alors du côté de l’eau potable, ou inversement. De l’eau bleue au robinet veut dire une fuite, et le colorant est là pour cela.',
        check: 'De l’eau bleue, ou un niveau qui baisse sans fuite visible. Le constructeur vérifie le niveau à 5 ans.',
        care: 'En cas d’eau bleue, coupez tout et appelez l’installateur. Le glycol est de qualité alimentaire, mais personne ne veut en boire.',
      },
      {
        failure:
          'A leak through the common wall: the glycol would then reach the drinking water, or the other way round. Blue water at the tap means a leak, and the dye is there for that.',
        check: 'Blue water, or a level dropping with no visible leak. The maker checks the level at 5 years.',
        care: 'If the water runs blue, shut everything off and call the installer. The glycol is food-grade, but nobody wants to drink it.',
      },
    ),
    tip: l(
      'Allumez Flux dans ce monde : deux boucles y tournent, dans deux couleurs. L’une traverse la double enveloppe, l’autre descend vers la douche.',
      'Switch on Flows in this world: two loops run there, in two colours. One crosses the jacket, the other goes down to the shower.',
    ),
    video: ['02:13'],
    design: lf(
      'Le jour, ses {jacketHeight} de haut suffisent : le fluide chaud réchauffe sa couche d’eau et laisse le froid en bas. Dans le modèle, sous {cliffY}, le centre du capteur n’est plus au-dessus de la double enveloppe, et la boucle ne monte presque plus : ce faible dénivelé décide de la falaise.',
      'By day, its {jacketHeight} of height are enough: the warm fluid heats its own layer and leaves the cold below. In the model, below {cliffY}, the collector’s centre is no longer above the jacket, and the loop hardly climbs: that small drop in level decides the cliff.',
    ),
  },
  {
    id: 'water-column',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('La colonne d’eau', 'The water column'),
    short: lf(
      'Le cœur du lab : l’eau colorée en direct, couche par couche, avec {topEvening} en haut le soir et le froid en bas.',
      'The heart of the lab: the water coloured live, layer by layer, with {topEvening} at the top by evening and the cold below.',
    ),
    description: lf(
      'L’eau chaude est plus légère, donc elle reste au-dessus, et ces couches sont toute la fortune du ballon : l’eau froide retourne au capteur, là où il travaille le mieux, et l’eau chaude sort par le haut. Le modèle en compte dix, de même hauteur : {layerEnd} aux bouts, {layerMid} au milieu, car le ballon est couché. Le soir d’un jour clair de juin, à Athènes, il trouve {topEvening} en haut et {bottomEvening} en bas ; à l’aube, le haut est encore à {topMorning}. Au tirage, ce ballon garde ses couches sur {drawFraction} de son volume ; la plupart des ballons mesurés de ce type restent entre 40 et 60 %.',
      'Hot water is lighter, so it stays on top, and these layers are the tank’s whole fortune: the cold water goes back to the collector, where it works best, and the hot water leaves from the top. The model counts ten, of equal height: {layerEnd} at the ends, {layerMid} in the middle, since the tank lies flat. On the evening of a clear June day at Athens, it finds {topEvening} at the top and {bottomEvening} at the bottom; at dawn, the top is still at {topMorning}. When drawn, this tank keeps its layers over {drawFraction} of its volume; most such tanks measured stay between 40 and 60%.',
    ),
    material: l('Eau potable', 'Drinking water'),
    specs: [
      sp('Haut du ballon, le soir', 'Tank top, by evening', v('{topEvening}')),
      sp('Bas du ballon, le soir', 'Tank bottom, by evening', v('{bottomEvening}')),
      sp('Volume', 'Volume', '300 L'),
      sp('De 20 à 60 °C', 'From 20 to 60 °C', v('{tankfulKwh}')),
      sp('Couches du modèle', 'Layers in the model', v('{layersN}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une eau trop tiède trop longtemps : entre 25 °C et 45 °C, c’est la zone où les légionelles se multiplient. Un temps gris sans appoint y mène, et le panneau le signale.',
        check:
          'Le chiffre « Haut du ballon » lors d’une longue période grise. Un mélange anormal se voit à un bas de ballon plus chaud que d’habitude, le matin.',
        care: 'Ce qui compte n’est pas de vider, mais de monter parfois à la température voulue. L’appoint et son thermostat servent aussi à cela.',
      },
      {
        failure:
          'Water too lukewarm for too long: between 25 °C and 45 °C is the band where legionella multiply. A grey spell with no boost leads there, and the panel points it out.',
        check:
          'The “Tank top” figure over a long grey spell. Abnormal mixing shows as a warmer tank bottom than usual, in the morning.',
        care: 'What counts is not emptying it, but reaching the right temperature now and then. The booster and its thermostat are also there for that.',
      },
    ),
    tip: lf(
      'Dans le scénario « Le matin de la famille », regardez la couche chaude descendre douche après douche. Une douche, pour le modèle : {showerFlow} pendant {showerMin}, deux chiffres d’usage.',
      'In the “The family’s morning” scenario, watch the hot layer fall shower by shower. One shower, to the model: {showerFlow} for {showerMin}, two figures of usual practice.',
    ),
    video: ['00:38'],
    design: lf(
      'Sa hauteur, {vesselDia} à peine, est son point faible et le prix d’un ballon couché. Le modèle suppose que {stratify} de la chaleur reçue rejoint sa propre couche : une estimation, qui fait bouger l’année de {stratLow} à {stratHigh} sur la plage plausible.',
      'Its height, barely {vesselDia}, is its weak point and the price of a tank lying flat. The model assumes {stratify} of the heat received reaches its own layer: an estimate, which moves the year by {stratLow} to {stratHigh} over the plausible range.',
    ),
  },
  {
    id: 'tank-foam',
    scene: 'tank-and-tap',
    category: 'structure',
    name: l('Mousse isolante', 'Insulating foam'),
    short: l(
      'Du polyuréthane injecté dans l’espace que laisse l’enveloppe : 2,595 kWh en 24 h, c’est tout ce qu’il laisse partir.',
      'Polyurethane injected into the room the case leaves: 2.595 kWh in 24 h is all it lets go.',
    ),
    description: lf(
      'L’enveloppe fait 510 mm et la cuve {vesselDia} : il reste de quoi mettre la double enveloppe et environ {foamThick} de mousse au-dessus, 35 mm plus haut. C’est moins que chez d’autres machines, qui ont de 30 à 50 mm. On ne parle pas ici d’un mauvais choix : c’est le prix d’une forme mince sur un toit. La mousse laisse partir 2,595 kWh en 24 h, ce qui donne {tankLossWk} pour 45 K d’écart. Le modèle retrouve à peu près cette perte en laissant refroidir le ballon, et c’est une part stable de ce que perd la machine.',
      'The case is 510 mm across and the vessel {vesselDia}: that leaves room for the jacket and about {foamThick} of foam over it, 35 mm at the top. That is less than on other machines, which have 30 to 50 mm. It is no bad choice: it is the price of a slim shape on a roof. The foam lets 2.595 kWh go in 24 h, which gives {tankLossWk} for a 45 K difference. The model finds about the same loss by letting the tank cool, and it is a steady share of what the machine loses.',
    ),
    material: l('Polyuréthane injecté', 'Injected polyurethane'),
    specs: [
      sp('Pertes à l’arrêt', 'Standing loss', l('2,595 kWh en 24 h', '2.595 kWh in 24 h')),
      sp('Coefficient', 'Coefficient', v('{tankLossWk}')),
      sp('Épaisseur', 'Thickness', lf('environ {foamThick}', 'about {foamThick}')),
      sp('Ailleurs', 'Elsewhere', l('30 à 50 mm', '30 to 50 mm')),
    ],
    maintenance: maint(
      {
        failure:
          'De l’eau qui entre par un joint de l’enveloppe et imbibe la mousse : la perte augmente sans bruit, et la fuite peut venir de bien plus haut.',
        check:
          'Un ballon qui a nettement refroidi au matin, sans tirage. Une tache sombre et humide sous l’enveloppe mérite une dépose.',
        care: 'Rien de régulier. Gardez les joints de l’enveloppe et des flasques en bon état : la mousse, elle, ne se remplace pas.',
      },
      {
        failure:
          'Water getting in through a seam in the case and soaking the foam: the loss grows quietly, and the leak may come from far above.',
        check:
          'A tank clearly colder by morning, with no draw. A dark, damp stain under the case deserves a closer look.',
        care: 'Nothing regular. Keep the seams of the case and caps sound: the foam itself cannot be replaced.',
      },
    ),
    tip: lf(
      'Sur une nuit claire de juin, par la peau du ballon, le modèle laisse partir {skin0} ; par le circuit à l’envers, {lost0} de plus.',
      'On a clear June night, through the tank’s skin, the model loses {skin0}; through the circuit running backward, {lost0} more.',
    ),
    design: l(
      'Injectée, elle remplit jusqu’au moindre angle et colle aux parois : le ballon entier devient rigide, et c’est aussi elle qui tient l’enveloppe fine en forme.',
      'Injected, it fills the smallest corner and sticks to the walls: the whole tank goes rigid, and it also keeps the thin case in shape.',
    ),
  },
  {
    id: 'outer-case',
    scene: 'tank-and-tap',
    category: 'structure',
    name: l('Enveloppe aluminium', 'Aluminium case'),
    short: l(
      '0,4 mm d’aluminium côté intempéries, 510 mm de diamètre, 2,31 m de long.',
      '0.4 mm of aluminium on the weather side, 510 mm across, 2.31 m long.',
    ),
    description: lf(
      'Une tôle de 0,4 mm, c’est très peu : elle n’est là que pour la pluie, le soleil et l’œil. Le manuel de 2013 lui donne 2,31 m de long, et la fiche de 2023 donne 2,43 m au système entier : les {fittingsWidth} d’écart logent vannes et tuyaux. Sa section est arrondie, et le plan du constructeur imprime aussi une cote de 0,62 m le long de la pente, sans dire de quoi : une limite extérieure. Le dessin retient 510 mm.',
      'A 0.4 mm sheet is very little: it is only there for the rain, the sun and the eye. The 2013 manual gives it 2.31 m of length, and the 2023 sheet gives the whole system 2.43 m: the {fittingsWidth} between them house valves and pipes. Its section is rounded, and the maker’s drawing also prints 0.62 m along the slope, without saying of what: an outer limit. The drawing keeps 510 mm.',
    ),
    material: l('Aluminium de 0,4 mm', '0.4 mm aluminium'),
    specs: [
      sp('Épaisseur', 'Thickness', l('0,4 mm', '0.4 mm')),
      sp('Section', 'Section', '510 × 510 mm'),
      sp('Longueur', 'Length', l('2,31 m', '2.31 m')),
    ],
    maintenance: maint(
      {
        failure:
          'Une bosse due à une chute de branche ou à une échelle posée contre lui. Une rayure qui, au contact d’un acier nu, se met à piquer.',
        check:
          'Un regard depuis le toit, sans marcher dessus : aucune ouverture, aucune déformation à l’endroit des feuillards.',
        care: 'Il ne porte rien : ne vous y appuyez jamais. Rebouchez une fente sans attendre.',
      },
      {
        failure:
          'A dent from a falling branch or a ladder set against it. A scratch which, in contact with bare steel, starts to pit.',
        check: 'A look from the roof, without stepping on it: no opening, no deformation where the straps go.',
        care: 'It carries nothing: never lean on it. Close a split at once.',
      },
    ),
    tip: l(
      'En X-ray, cette enveloppe et la mousse s’effacent : le ballon se lit alors en entier, sans coupe.',
      'In X-ray, this case and the foam fade: the tank then reads whole, without a section.',
    ),
    design: l(
      'L’aluminium ne craint guère la pluie et pèse peu : le poids du ballon reste dans l’acier qui tient la pression, pas dans sa peau.',
      'Aluminium fears little from rain and weighs little: the tank’s weight stays in the steel that holds the pressure, not in its skin.',
    ),
  },
  {
    id: 'end-cap',
    scene: 'tank-and-tap',
    category: 'structure',
    name: l('Flasque', 'End cap'),
    short: l(
      'Polypropylène noir, stabilisé contre les ultraviolets : il ferme le ballon et porte la trappe et les orifices.',
      'Black polypropylene, stabilised against ultraviolet: it closes the tank and carries the hatch and the ports.',
    ),
    description: lf(
      'Deux flasques noirs, légèrement bombés, ferment les bouts du cylindre. Celui de gauche porte une trappe ovale pour la résistance, et c’est par ces deux flasques que sortent les orifices de la double enveloppe, en dessous de l’axe. Leur matière est donnée par le constructeur ; leur bombé, et la taille de la trappe, sont des estimations du dessin, qui doit rester dans les 2,31 m. Noirs, au soleil, ils chauffent : c’est pour cela que le plastique est stabilisé.',
      'Two black caps, slightly domed, close the ends of the cylinder. The left one carries an oval hatch for the element, and the jacket’s ports leave through these two caps, below the axis. Their material is the maker’s; their dome and the hatch’s size are estimates of the drawing, which must stay inside the 2.31 m. Being black, in the sun, they get hot: that is why the plastic is stabilised.',
    ),
    material: l('Polypropylène noir stabilisé aux UV', 'UV-stabilised black polypropylene'),
    qty: 2,
    specs: [
      sp('Matière', 'Material', l('polypropylène noir', 'black polypropylene')),
      sp('Porte', 'Carries', l('la trappe, les orifices', 'the hatch, the ports')),
    ],
    maintenance: maint(
      {
        failure:
          'Des années de soleil finissent par fissurer un plastique, même stabilisé. Une trappe mal refermée laisse entrer l’eau dans la mousse.',
        check: 'À chaque révision : la trappe, sa vis, et les bords du plastique autour des orifices.',
        care: 'Ouvrez la trappe seulement courant coupé, à l’interrupteur. Reposez-la bien serrée sur son joint.',
      },
      {
        failure:
          'Years of sun end up cracking any plastic, stabilised or not. A badly closed hatch lets water into the foam.',
        check: 'At each service: the hatch, its screw, and the plastic’s edges round the ports.',
        care: 'Open the hatch only with the isolator off. Put it back tight on its seal.',
      },
    ),
    tip: l(
      'Le dessin montre la trappe sur le flasque de gauche : c’est par là que la résistance se sort d’un seul bloc, sans vider la machine entière.',
      'The drawing shows the hatch on the left cap: that is where the element comes out in one piece, without emptying the whole machine.',
    ),
    design: l(
      'Un plastique à cet endroit coupe aussi un pont thermique : la chaleur de la cuve ne trouve pas un chemin métallique jusqu’à l’air.',
      'Plastic at this spot also cuts a thermal bridge: the vessel’s heat finds no metal path to the air.',
    ),
  },
  {
    id: 'sacrificial-anode',
    scene: 'tank-and-tap',
    category: 'mechanical',
    name: l('Anode', 'Sacrificial anode'),
    short: l(
      'Du magnésium sur une âme d’acier : elle se dissout pour que l’acier ne le fasse pas. À remplacer à 5 ans.',
      'Magnesium on a steel core: it dissolves so that the steel does not. To be replaced at 5 years.',
    ),
    description: l(
      'Aucun émail n’est parfait : il reste toujours quelques défauts minuscules où l’eau touche l’acier. Le magnésium, plus prompt à se corroder que l’acier, prend cette corrosion à sa place, et il s’use donc à vue d’œil. C’est pour cela qu’il se remplace, et qu’on ne peut pas juste l’oublier : une fois parti, la cuve commence à se corroder. La révision à 5 ans le prévoit ; une eau plus dure ou plus chargée en sels peut demander de la regarder plus tôt. Le dessin le met le long du haut de la cuve, sur une taille estimée.',
      'No enamel is perfect: a few tiny flaws always remain, where water touches steel. Magnesium, quicker to corrode than steel, takes that corrosion in its place, and so it wears away visibly. That is why it gets replaced, and cannot just be forgotten: once it has gone, the vessel starts to corrode. The 5-year service allows for it; harder water, or water with more salts, may call for a look sooner. The drawing sets it along the top of the vessel, at an estimated size.',
    ),
    material: l('Magnésium sur âme d’acier', 'Magnesium on a steel core'),
    specs: [
      sp('À remplacer', 'To be replaced', l('à 5 ans', 'at 5 years')),
      sp('Eau admise', 'Water allowed', l('sous 1 000 ppm et 200 ppm', 'under 1,000 ppm and 200 ppm')),
    ],
    maintenance: maint(
      {
        failure:
          'Sa disparition silencieuse : l’anode ne prévient pas. Une eau qui sent l’œuf pourri vient parfois d’une réaction sur l’anode dans une eau particulière.',
        check: 'La sortir à la révision et la regarder : si l’âme d’acier apparaît, elle est finie.',
        care: 'À 5 ans, comme le constructeur le demande, avant que l’âme ne soit à nu. Ne la remplacez pas par une pièce au hasard : mauvais métal, mauvais résultat.',
      },
      {
        failure:
          'Its silent disappearance: the anode gives no warning. Water smelling of rotten eggs sometimes comes from a reaction on the anode, in certain waters.',
        check: 'Pull it at the service and look: if the steel core shows, it is finished.',
        care: 'At 5 years, as the maker asks, before the core is bare. Do not replace it with any part that comes along: wrong metal, wrong result.',
      },
    ),
    tip: l(
      'En coupe, c’est la tige qui court dans la moitié haute de l’eau : il ne faut pas la confondre avec la résistance, qui est en dessous.',
      'In section, it is the rod running through the upper half of the water: do not confuse it with the element, which is below.',
    ),
    design: l(
      'Payer un peu de magnésium pour garder une cuve : c’est le marché le moins cher de toute la machine, si on pense à le renouveler.',
      'Paying a little magnesium to keep a vessel: the cheapest bargain in the whole machine, as long as you remember to renew it.',
    ),
  },
  {
    id: 'booster-element',
    scene: 'tank-and-tap',
    category: 'electrical',
    name: l('Résistance d’appoint', 'Booster element'),
    short: lf(
      'À mi-hauteur : elle ne chauffe que les 150 L du dessus, et laisse le bas froid pour le capteur.',
      'At half height: it heats only the upper 150 L, and leaves the lower part cold for the collector.',
    ),
    description: lf(
      'Elle est gainée de cuivre, en 1,8, 2,4 ou 3,6 kW sous 240 V, et se place à mi-hauteur, car le volume d’appoint est de 150 L. C’est un choix de place : l’eau au-dessus d’elle chauffe, celle du dessous reste froide et le capteur y trouve encore de quoi travailler. Avec 50 K à gagner, le constructeur annonce 5 h à 1,8 kW, 3¾ h à 2,4 kW et 2½ h à 3,6 kW, et le compte tombe juste : 150 L sur 50 K font 8,7 kWh. Le modèle met {boostHours} à 3,6 kW, car il ajoute l’acier, la peau et la conduction vers le bas.',
      'It is copper-sheathed, at 1.8, 2.4 or 3.6 kW on 240 V, and sits at half height, since the boost volume is 150 L. That place is a choice: the water above it heats, the water below stays cold and the collector still finds something to work with. With 50 K to gain, the maker quotes 5 h at 1.8 kW, 3¾ h at 2.4 kW and 2½ h at 3.6 kW, and the sum checks: 150 L over 50 K is 8.7 kWh. The model takes {boostHours} at 3.6 kW, adding the steel, the skin and the conduction downward.',
    ),
    material: l('Élément de chauffe gainé de cuivre', 'Copper-sheathed heating element'),
    specs: [
      sp('Puissance', 'Power', l('1,8, 2,4 ou 3,6 kW', '1.8, 2.4 or 3.6 kW')),
      sp('Tension', 'Voltage', '240 V'),
      sp('Volume d’appoint', 'Boost volume', '150 L'),
      sp('À 3,6 kW, sur 50 K', 'At 3.6 kW, over 50 K', l('2½ h', '2½ h')),
      sp('Dans le modèle', 'In the model', v('{boostHours}')),
    ],
    maintenance: maint(
      {
        failure:
          'Le calcaire qui l’enrobe dans une eau dure : elle chauffe mal, puis casse. Une mise sous tension à vide la grille presque à coup sûr.',
        check:
          'Un disjoncteur qui saute, ou une eau tiède après la période prévue. La mesure d’isolement est une affaire d’électricien.',
        care: 'Détartrez-la lors de la révision. Coupez à l’interrupteur avant d’ouvrir la trappe : c’est du courant de réseau, et la mise sous tension se fait seulement ballon plein, par une personne qualifiée.',
      },
      {
        failure:
          'Scale coating it in hard water: it heats badly, then breaks. Powering it empty burns it out almost for certain.',
        check:
          'A breaker that trips, or lukewarm water after the planned period. An insulation test is a job for an electrician.',
        care: 'Descale it at the service. Open the isolator before the hatch: this is mains current, and powering up is only with the tank full, by a qualified person.',
      },
    ),
    tip: l(
      'Lancez « L’appoint toujours allumé » et comparez la part solaire avec le réglage Horloge : c’est là que tout se joue en hiver.',
      'Run “The booster always on” and compare the solar share with the Timer setting: that is what decides everything in winter.',
    ),
    design: l(
      'L’élément placé au bas du ballon aurait chauffé tout le volume, et le capteur n’aurait rien trouvé de froid : ce gain tient à un simple choix de hauteur.',
      'An element at the bottom of the tank would heat the whole volume, leaving nothing cold for the collector: that gain comes down to a simple choice of height.',
    ),
  },
  {
    id: 'tank-thermostat',
    scene: 'tank-and-tap',
    category: 'electrical',
    name: l('Thermostat', 'Thermostat'),
    short: l(
      'Il arrête l’appoint à 60 °C, à 70 °C au plus, et un disjoncteur thermique coupe à 83 °C.',
      'It stops the booster at 60 °C, at 70 °C at most, and a thermal cut-out trips at 83 °C.',
    ),
    description: l(
      'Soixante degrés, c’est un chiffre choisi. Il répond aux légionelles, qui se multiplient de 25 °C à 45 °C : en Suisse, l’eau doit quitter le ballon à au moins 60 °C ; en Australie, le pays du constructeur, l’appoint se règle à 60 °C ou plus. Le manuel autorise 70 °C au plus. Un second dispositif, à 83 °C, coupe l’élément si le thermostat a lâché. Dans ce dessin et dans le modèle, il mesure près de l’élément, à mi-hauteur, et non au sommet : c’est pour cela qu’il ne coupe pas quand le soleil a seulement rempli le haut.',
      'Sixty degrees is a chosen figure. It answers legionella, which multiply from 25 °C to 45 °C: in Switzerland, water must leave the tank at 60 °C at least; in Australia, the maker’s country, the booster is set at 60 °C or more. The manual allows 70 °C at most. A second device, at 83 °C, cuts the element if the thermostat has failed. In this drawing and in the model, it measures near the element, at half height, not at the top: that is why it does not cut out when the sun has only filled the top.',
    ),
    material: l('Thermostat en doigt de gant', 'Thermostat in a pocket'),
    specs: [
      sp('Réglage', 'Setting', '60 °C'),
      sp('Au plus', 'At most', '70 °C'),
      sp('Coupure de sécurité', 'Thermal cut-out', '83 °C'),
    ],
    maintenance: maint(
      {
        failure:
          'Un thermostat qui dérive ou se bloque : soit l’eau reste trop basse, soit l’appoint chauffe jusqu’à la coupure. Si la coupure se déclenche, ce n’est jamais un hasard.',
        check:
          'Comparez la température affichée dans la cuisine, à robinet ouvert, à la consigne. Une coupure qui se déclenche appelle un contrôle du thermostat.',
        care: 'Pas d’entretien propre. Tout réglage passe par l’interrupteur coupé, et par un électricien qualifié si le capot doit s’ouvrir.',
      },
      {
        failure:
          'A thermostat that drifts or sticks: either the water stays too low, or the booster heats up to the cut-out. If the cut-out trips, it is never by chance.',
        check:
          'Compare the temperature at a kitchen tap, running, with the setting. A cut-out that trips calls for the thermostat to be checked.',
        care: 'No care of its own. Any adjustment goes with the isolator off, and through a qualified electrician if the cover must open.',
      },
    ),
    tip: l(
      'Essayez de baisser « Thermostat » dans la Simulation : l’appoint coûte moins, mais le ballon passe plus de temps dans la bande que signale le panneau.',
      'Try lowering “Thermostat” in the Simulation: the booster costs less, but the tank spends more time in the band the panel points out.',
    ),
    design: l(
      'La règle de l’eau chaude tient en un seul chiffre sur cette pièce : elle tranche à l’avance entre deux risques, les bactéries en dessous et la brûlure au-dessus, et le mitigeur fait le reste.',
      'The rule of hot water comes down to one figure on this part: it decides in advance between two risks, bacteria below and burns above, and the tempering valve does the rest.',
    ),
  },
  {
    id: 'tpr-valve',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Soupape température-pression', 'Temperature and pressure relief valve'),
    short: l(
      'Elle s’ouvre à 99 °C ou à 1 000 kPa : le dernier recours du ballon, et il ne faut jamais la boucher.',
      'It opens at 99 °C or at 1,000 kPa: the tank’s last resort, and it must never be blocked.',
    ),
    description: lf(
      'Ce qu’elle fait est mesuré ailleurs : sans tirage et au soleil, un ballon comparable a atteint 109 °C et environ +3,7 bar, dans un essai allemand. Le modèle trouve {stagnationModel} sur une semaine claire à Würzburg, et rend la main à cette soupape, qui laisse partir jusqu’à 10 kW. L’eau qui sort est donc très chaude : l’évacuation doit tomber à l’air libre, et jamais sur le toit ni dans une gouttière. Le constructeur demande de manœuvrer son levier tous les 6 mois, et de la remplacer à 5 ans.',
      'What it does has been measured elsewhere: with no draw and in the sun, a comparable tank reached 109 °C and about +3.7 bar, in a German test. The model finds {stagnationModel} over a clear week at Würzburg, and hands over to this valve, which lets out up to 10 kW. The water leaving it is therefore very hot: the drain must fall in the open, never on the roof or into a gutter. The maker asks you to work its lever every 6 months, and to replace it at 5 years.',
    ),
    material: l('Corps en laiton, ressort et élément thermique', 'Brass body, spring and thermal element'),
    specs: [
      sp('S’ouvre à', 'Opens at', l('99 °C ou 1 000 kPa', '99 °C or 1,000 kPa')),
      sp('Débit de chaleur', 'Heat flow', '10 kW'),
      sp('Essai d’un ballon comparable', 'Test on a comparable tank', l('109 °C, +3,7 bar', '109 °C, +3.7 bar')),
      sp('Levier', 'Lever', l('tous les 6 mois', 'every 6 months')),
      sp('Remplacement', 'Replacement', l('à 5 ans', 'at 5 years')),
    ],
    maintenance: maint(
      {
        failure:
          'Du tartre qui la bloque fermée, sans aucun signe, ou un siège qui ne referme plus et goutte en permanence. Dans les deux cas, on se croit tranquille à tort.',
        check:
          'Tous les 6 mois, le levier : l’eau coule franchement, puis s’arrête. Écartez-vous, elle peut être brûlante.',
        care: 'Ne la bouchez jamais, ne la réglez pas et ne la remplacez que par le même modèle. À 5 ans, elle se change.',
      },
      {
        failure:
          'Scale that sticks it shut, with no sign at all, or a seat that no longer closes and drips all the time. Either way you think all is well, wrongly.',
        check: 'Every 6 months, the lever: water runs freely, then stops. Stand clear, it may be scalding.',
        care: 'Never block it, never adjust it, and replace it only with the same model. At 5 years, it gets changed.',
      },
    ),
    tip: lf(
      'L’alarme « Ballon au-delà de 95 °C » arrive bien avant elle. Le modèle ne simule ni l’ébullition ni la perte d’eau : au-delà, ses chiffres ne valent plus qu’un drapeau.',
      'The “Tank over 95 °C” alarm comes long before it. The model simulates no boiling or loss of water: past that point, its figures are only a flag.',
    ),
    design: l(
      'Un seul organe pour deux seuils : la pression qui monte vite en cas de blocage, et la température qui monte lentement au soleil. L’une ou l’autre l’ouvre, et personne n’a à choisir.',
      'One device for two thresholds: pressure that climbs fast if something blocks, and temperature that climbs slowly in the sun. Either one opens it, and nobody has to choose.',
    ),
  },
  {
    id: 'jacket-relief-valve',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Soupape du circuit', 'Jacket relief valve'),
    short: l(
      'À 80 kPa sur le circuit fermé, 200 kPa avec la vanne de surchauffe : il ne faut jamais l’ôter quand le système tourne.',
      'At 80 kPa on the closed circuit, 200 kPa with the overheat valve: it must never be taken off while the system runs.',
    ),
    description: lf(
      'Les capteurs travaillent à 80 kPa au plus : c’est cette soupape qui les y tient, très loin des 1 000 kPa de la cuve. Le circuit n’a pas à tenir la pression du réseau, ce qui autorise des tubes si fins. Elle fixe aussi le point d’ébullition du mélange : le modèle donne {boil80} à 80 kPa et {boil200} à 200 kPa. Au-delà, il signale « le circuit dégaze », sans simuler la perte de fluide. Le manuel prévient de ne pas la retirer en service.',
      'The collectors work at 80 kPa at most: this valve keeps them there, far below the vessel’s 1,000 kPa. The circuit need not bear mains pressure, which is what allows such thin tubes. It also fixes the mix’s boiling point: the model gives {boil80} at 80 kPa and {boil200} at 200 kPa. Past that, it says “it vents”, without simulating any lost fluid. The manual warns not to take it off in service.',
    ),
    material: l('Corps en laiton, ressort', 'Brass body, spring'),
    specs: [
      sp('Réglage', 'Setting', '80 kPa'),
      sp('Avec la vanne de surchauffe', 'With the overheat valve', '200 kPa'),
      sp('Ébullition, à 80 kPa', 'Boiling, at 80 kPa', v('{boil80}')),
      sp('À 200 kPa', 'At 200 kPa', v('{boil200}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une soupape qui suinte après une surchauffe : le circuit perd sa pression et son fluide peu à peu, et l’air finit par entrer.',
        check:
          'Une trace bleue sur sa sortie et, à la révision, le niveau du circuit. Une ouverture isolée peut s’expliquer, une trace répétée non.',
        care: 'Le geste revient à un installateur formé. Ne la remplacez pas par une soupape à la pression de la cuve : ce serait donner aux capteurs dix fois plus de pression que prévu.',
      },
      {
        failure:
          'A valve seeping after an overheat: the circuit slowly loses pressure and fluid, and air ends up getting in.',
        check:
          'A blue trace at its outlet and, at the service, the circuit’s level. One opening may be explained, a repeated trace cannot.',
        care: 'The job is for a trained installer. Do not replace it with a valve at the vessel’s pressure: that would give the collectors over ten times the pressure planned.',
      },
    ),
    tip: l(
      'Le drain de ce circuit contient du glycol : il ne doit pas rejoindre une cuve d’eau de pluie.',
      'This circuit’s drain holds glycol: it must not reach a rainwater tank.',
    ),
    design: l(
      'Deux pressions, deux mondes : l’eau potable à la pression du réseau, le circuit presque sans pression. La cuve et sa double enveloppe séparent les deux, et chacune a sa soupape.',
      'Two pressures, two worlds: drinking water at mains pressure, the circuit at almost none. The vessel and its jacket part the two, and each has its valve.',
    ),
  },
  {
    id: 'cold-diffuser',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Diffuseur d’eau froide', 'Cold water diffuser'),
    short: l(
      'Il fait entrer le réseau en douceur, pour que l’eau froide ne vienne pas remuer les couches.',
      'It lets the mains in gently, so that the cold water does not stir the layers.',
    ),
    description: lf(
      'Quand on ouvre la douche, autant d’eau froide entre en bas qu’il en sort de chaude en haut. Un jet direct remuerait tout : ballon mélangé, moins d’eau chaude utilisable, capteur moins bien nourri. D’où ce tube posé au fond, avec son répartiteur. Des mesures sur d’autres ballons montrent l’enjeu : la plupart restent en couches sur 40 à 60 % du volume à 600 L/h, et un bon diffuseur atteint 95 %. Le modèle mélange le bas sur 5,5 % du volume, chiffre mesuré ailleurs, et trouve {drawFraction}. Sa forme ici est notre estimation.',
      'When the shower opens, as much cold water comes in below as hot leaves above. A direct jet would stir everything: a mixed tank, less usable hot water, a poorly fed collector. Hence this tube along the bottom, with its spreader. Measurements on other tanks show what is at stake: most stay layered over 40 to 60% of the volume at 600 L/h, and a good diffuser reaches 95%. The model mixes the bottom over 5.5% of the volume, a figure measured elsewhere, and finds {drawFraction}. Its shape here is our estimate.',
    ),
    material: l('Tube métallique, répartiteur (forme estimée)', 'Metal tube, spreader (shape an estimate)'),
    specs: [
      sp('Mélange à l’entrée, ailleurs', 'Inlet mixing, elsewhere', l('5,5 %', '5.5%')),
      sp('Ballons mesurés, à 600 L/h', 'Measured tanks, at 600 L/h', l('40 à 60 %', '40 to 60%')),
      sp('Un bon diffuseur', 'A good diffuser', l('95 %', '95%')),
      sp('Dans le modèle', 'In the model', v('{drawFraction}')),
    ],
    maintenance: maint(
      {
        failure:
          'Un répartiteur entartré dans une eau dure : le jet se concentre, le ballon se mélange davantage, et on dit juste que l’eau chaude dure moins.',
        check:
          'Une douche plus courte qu’avant, sans autre cause. L’ouverture de la cuve, à la révision, permet seule de le voir.',
        care: 'Une eau sous 200 ppm de dureté. Si le ballon s’ouvre pour l’anode, profitez-en pour le regarder.',
      },
      {
        failure:
          'A spreader scaled up in hard water: the jet narrows, the tank mixes more, and all you notice is that the hot water lasts less.',
        check:
          'A shorter shower than before, with no other cause. Only opening the vessel at the service will show it.',
        care: 'Water under 200 ppm of hardness. If the tank is open for the anode, take a look at it.',
      },
    ),
    tip: l(
      'En scénario « Un ballon mélangé », le lab supprime les couches à la main : c’est ce qui arriverait si ce diffuseur n’existait plus, en pire.',
      'In the “A mixed tank” scenario, the lab removes the layers by hand: that is what would happen if this diffuser were gone, only worse.',
    ),
    design: lf(
      'Un ballon sans couches perd {mixedYear} de son année dans le modèle : une pièce simple, au prix d’un bout de tube, en sauve une bonne part.',
      'A tank with no layers loses {mixedYear} of its year in the model: a simple part, for the price of a length of tube, saves a good share of that.',
    ),
  },
  {
    id: 'hot-outlet',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Sortie d’eau chaude', 'Hot outlet'),
    short: l(
      'Un tube qui plonge vers le haut de la cuve : on tire toujours l’eau la plus chaude.',
      'A tube reaching to the top of the vessel: you always draw the hottest water.',
    ),
    description: lf(
      'Le robinet ne tire pas au hasard : il prend tout en haut. C’est le point où l’eau est la plus chaude et, grâce au diffuseur, le dernier à être refroidi. On peut ainsi prendre une douche à un ballon à moitié froid : c’est toute la différence avec un ballon mélangé. Le raccord extérieur est un R ½, avec le Rp ¾ de l’eau froide de l’autre côté, chiffres du constructeur ; sa place sur l’axe, ici, est une estimation. Sur le dessin, le tube traverse le plan de coupe pour rester visible.',
      'The tap does not draw at random: it takes from the very top. That is where the water is hottest and, thanks to the diffuser, the last to be cooled. So you can shower from a tank half cold: that is the whole difference from a mixed tank. The outer connection is an R ½, with the cold side’s Rp ¾ opposite, the maker’s figures; its place along the axis, here, is an estimate. In the drawing, the tube crosses the section plane so as to stay visible.',
    ),
    material: l('Tube métallique, raccord fileté', 'Metal tube, threaded connection'),
    specs: [
      sp('Raccord', 'Connection', 'R ½'),
      sp('De l’autre côté, eau froide', 'Opposite, cold water', 'Rp ¾'),
      sp('Prend', 'Draws from', l('le haut de la cuve', 'the top of the vessel')),
    ],
    maintenance: maint(
      {
        failure:
          'Un raccord qui fuit à la jonction avec la conduite, surtout après un grand écart de température. La cuve se vidange peu, mais la mousse prend l’eau.',
        check: 'Le raccord, à chaque révision, flasque ouvert. Une trace ronde et sèche indique une fuite ancienne.',
        care: 'Une clé et une main libre : tenez le raccord pendant le serrage. Coupez l’eau avant de démonter.',
      },
      {
        failure:
          'A joint leaking where it meets the line, above all after a big swing in temperature. The vessel drains little, but the foam gets wet.',
        check: 'The joint, at each service, cap open. A round, dry trace points to an old leak.',
        care: 'A wrench and a free hand: hold the fitting while tightening. Shut off the water before taking it apart.',
      },
    ),
    tip: l(
      'En Flux, ses points ne bougent que quand un robinet tire : sinon, l’eau du ballon reste immobile, et seule la chaleur circule.',
      'In Flows, its dots only move when a tap draws: otherwise the tank’s water stays still, and only the heat moves.',
    ),
    video: ['01:07'],
    design: l(
      'Prendre en haut et remplir en bas, c’est le même choix que la résistance à mi-hauteur : garder chaud et froid séparés, à chaque geste.',
      'Drawing from the top and filling at the bottom is the same choice as the element at half height: keeping hot and cold apart, at every move.',
    ),
  },
  {
    id: 'trio-valve',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Clapet et robinet d’arrêt', 'Isolating and non-return valve'),
    short: l(
      'Sur le départ froid, à au moins 1 m du ballon : il empêche l’eau du ballon de repartir vers la rue.',
      'On the cold line, at least 1 m from the tank: it stops the tank’s water going back to the street.',
    ),
    description: l(
      'Sur le chemin de l’eau froide, l’ordre vient du constructeur : d’abord une vanne d’arrêt, puis ce clapet, puis en dernier la soupape d’eau froide. Le clapet ne laisse passer l’eau que dans un sens : quand le ballon chauffe et se dilate, ce n’est pas le réseau de la rue qui encaisse cette poussée, et l’eau tiède ne rejoint pas celle de vos voisins. Il doit être à au moins 1 m du ballon, à l’intérieur en climat froid. Ce clapet est sur l’eau potable : il n’a rien à voir avec celui, facultatif, qu’on peut mettre sur le circuit fermé.',
      'On the cold water’s path, the order comes from the maker: first an isolating valve, then this non-return valve, then last the cold relief valve. It lets water through one way only: when the tank heats and expands, the street’s network does not take the push, and lukewarm water does not reach your neighbours’. It must stand at least 1 m from the tank, indoors in a cold climate. This valve is on the drinking water: it has nothing to do with the optional one that can go on the closed circuit.',
    ),
    material: l('Corps en laiton', 'Brass body'),
    specs: [
      sp('Depuis le ballon', 'From the tank', l('au moins 1 m', 'at least 1 m')),
      sp('En climat froid', 'In a cold climate', l('à l’intérieur', 'indoors')),
      sp('Ordre', 'Order', l('arrêt, clapet, puis soupape', 'isolating, non-return, then relief')),
    ],
    maintenance: maint(
      {
        failure:
          'Le clapet qui se grippe ouvert laisse repartir l’eau chaude vers le réseau ; grippé fermé, il coupe l’eau froide. Du tartre dans l’eau dure en est la cause courante.',
        check: 'Une conduite froide qui devient chaude en amont du clapet, sans tirage : il ne retient plus rien.',
        care: 'Manœuvrez le robinet une fois par an pour qu’il ne se fige pas. Un clapet défectueux se remplace, il ne se répare pas.',
      },
      {
        failure:
          'The non-return stuck open lets hot water back towards the mains; stuck shut, it cuts the cold. Scale in hard water is the usual cause.',
        check: 'A cold line that turns warm upstream of the valve, with no draw: it no longer holds anything back.',
        care: 'Work the tap once a year so that it does not seize. A faulty non-return is replaced, not mended.',
      },
    ),
    tip: l(
      'Dans le guide d’installation, cette pièce arrive avec la soupape d’eau froide : leur ordre est l’un des rares points où le constructeur est très précis.',
      'In the installation guide this part comes with the cold relief valve: their order is one of the few points where the maker is very precise.',
    ),
    design: l(
      'C’est lui qui oblige le ballon à évacuer ailleurs : une fois le clapet en place, la seule sortie d’une eau qui se dilate est la soupape d’eau froide, et il faut donc qu’elle marche.',
      'It is what forces the tank to relieve elsewhere: with the valve in place, the only way out for expanding water is the cold relief valve, so that valve has to work.',
    ),
  },
  {
    id: 'cold-relief-valve',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Soupape d’eau froide', 'Cold relief valve'),
    short: lf(
      'À 850 kPa : elle laisse sortir les {expansionL} de dilatation, ce qui explique le goutte-à-goutte quand le ballon chauffe.',
      'At 850 kPa: it lets out the {expansionL} of expansion, which explains the drip as the tank warms.',
    ),
    description: lf(
      'L’eau chaude prend plus de place, et l’eau ne se comprime pas. Une fois la soupape du ballon à 1 000 kPa et le clapet en place, il fallait un chemin : cette soupape s’ouvre à 850 kPa, à la place du ballon. De 10 à 80 °C, {expansionL} doivent partir, et le manuel prévient : de l’eau coulera de sa sortie pendant le chauffage. Pas une fuite, donc. Les 680 kPa admis à l’entrée laissent une marge sous ces 850 kPa. Le modèle compte cette eau en « Sortis par dilatation ».',
      'Hot water takes more room, and water does not compress. With the tank’s relief at 1,000 kPa and the non-return in place, a path was needed: this valve opens at 850 kPa, ahead of the tank’s. From 10 to 80 °C, {expansionL} must leave, and the manual warns: water will run from its outlet during heating. So it is no leak. The 680 kPa allowed at the inlet leaves a margin under those 850 kPa. The model counts this water under “Out by expansion”.',
    ),
    material: l('Corps en laiton, ressort', 'Brass body, spring'),
    specs: [
      sp('S’ouvre à', 'Opens at', '850 kPa'),
      sp('Réseau, avec elle', 'Mains, with it', '680 kPa'),
      sp('Réseau, sans elle', 'Mains, without it', '800 kPa'),
      sp('Dilatation, 10 à 80 °C', 'Expansion, 10 to 80 °C', v('{expansionL}')),
    ],
    maintenance: maint(
      {
        failure:
          'Une soupape qui fuit en continu après un grain de sable ou du tartre, et qui gaspille l’eau chaude. Ou bloquée fermée, et la pression monte jusqu’à la suivante.',
        check:
          'Tous les 6 mois, son levier : l’eau doit sortir à gros débit puis s’arrêter. Une soupape qui coule sans chauffage a un problème.',
        care: 'Laissez-la sans bouchon ni rallonge bouchée. Gardez sa sortie hors gel et visible : si elle gèle, c’est aussi la soupape qui gèle.',
      },
      {
        failure:
          'A valve leaking all the time after a grain of grit or scale, wasting hot water. Or stuck shut, and the pressure climbs to the next one.',
        check:
          'Every 6 months, its lever: water should flow strongly then stop. A valve running with no heating has a problem.',
        care: 'Leave it with no plug or blocked extension. Keep its outlet frost-free and in view: if it freezes, so does the valve.',
      },
    ),
    tip: lf(
      'Lancez « Une semaine de vacances » et ouvrez « Tous les chiffres » : la dilatation s’y compte litre par litre, et la goutte du dessin suit le même chiffre.',
      'Run “A holiday week” and open “All the figures”: the expansion is counted there litre by litre, and the drip in the drawing follows the same figure.',
    ),
    design: l(
      'Une petite soupape qui travaille souvent évite qu’une grosse ne travaille jamais pour rien : c’est elle, et non la soupape du ballon, qui encaisse le quotidien.',
      'A small valve that works often spares a big one from working for nothing: it is this one, not the tank’s, that handles every day.',
    ),
  },
  {
    id: 'tempering-valve',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('Mitigeur thermostatique', 'Tempering valve'),
    short: l(
      'La ligne entre la brûlure et la légionelle : de 60 °C à 95 °C d’un côté, 50 °C de l’autre.',
      'The line between a scald and legionella: 60 °C to 95 °C on one side, 50 °C on the other.',
    ),
    description: lf(
      'À 60 °C, un adulte se brûle en 2 à 5 secondes, un enfant environ quatre fois plus vite ; à 50 °C, il faut de 1 à 5 minutes. L’été, ce ballon tourne à 60 °C ou 70 °C et peut atteindre 95 °C : le constructeur demande un mitigeur dans tous les cas, prévu pour 99 °C, et de tester l’eau avant d’entrer dans la douche. Il mélange de l’eau froide pour ne laisser passer que 50 °C vers la salle de bains. Rien ne le remplace : baisser le thermostat redonnerait de la place aux bactéries, qui se plaisent de 25 °C à 45 °C. L’eau reste chaude en amont, et douce en aval.',
      'At 60 °C an adult burns in 2 to 5 seconds, a child about four times faster; at 50 °C it takes 1 to 5 minutes. In summer this tank runs at 60 °C or 70 °C and may reach 95 °C: the maker asks for a tempering valve in every case, rated for 99 °C, and for the water to be tested before stepping into the shower. It mixes in cold water to let only 50 °C on to the bathroom. Nothing replaces it: lowering the thermostat would give room back to the bacteria, which thrive at 25 °C to 45 °C. The water stays hot upstream, and gentle downstream.',
    ),
    material: l('Corps en laiton, cartouche thermostatique', 'Brass body, thermostatic cartridge'),
    specs: [
      sp('Sort à', 'Delivers at', '50 °C'),
      sp('Reçoit', 'Receives', l('60 °C à 95 °C', '60 °C to 95 °C')),
      sp('Prévu pour', 'Rated for', '99 °C'),
      sp('Brûlure à 60 °C, adulte', 'Scald at 60 °C, adult', l('2 à 5 s', '2 to 5 s')),
      sp('Brûlure à 50 °C, adulte', 'Scald at 50 °C, adult', l('1 à 5 min', '1 to 5 min')),
    ],
    maintenance: maint(
      {
        failure:
          'Une cartouche entartrée qui dérive : l’eau du robinet monte doucement au-delà de sa consigne, surtout sur les plus forts écarts d’été.',
        check:
          'Un thermomètre sous le robinet le plus proche, une fois par an, en été, ballon chaud : au-delà de 50 °C, on intervient.',
        care: 'Le remplacement suit la notice de son fabricant. Sur un ballon solaire, n’acceptez qu’un mitigeur prévu pour 99 °C. Avant d’entrer dans une douche, testez toujours l’eau d’une main.',
      },
      {
        failure:
          'A scaled cartridge drifting: the tap’s water slowly creeps past its setting, above all with the summer’s biggest differences.',
        check: 'A thermometer under the nearest tap, once a year, in summer, tank hot: above 50 °C, act.',
        care: 'Replacement follows its maker’s notes. On a solar tank, accept only a valve rated for 99 °C. Before stepping into a shower, always test the water with a hand.',
      },
    ),
    tip: l(
      'Dans « Le matin de la famille », le mitigeur disparaît pour la troisième douche : regardez le chiffre « Robinet » sur la barre du bas.',
      'In “The family’s morning”, the valve goes away for the third shower: watch the “Tap” figure on the bottom strip.',
    ),
    design: l(
      'Le problème est sans solution unique : la peau veut moins de 50 °C, les bactéries demandent plus de 60 °C. Ce mitigeur laisse les deux chiffres exister dans la même maison, à une pièce d’écart.',
      'The problem has no single answer: skin wants under 50 °C, the bacteria call for over 60 °C. This valve lets both figures exist in one house, one part apart.',
    ),
  },
  {
    id: 'shower-head',
    scene: 'tank-and-tap',
    category: 'hydraulic',
    name: l('La douche', 'The shower'),
    short: lf(
      'Ce pour quoi tout existe : {showerFlow} d’eau à 40 °C pendant {showerMin}, le matin d’une famille.',
      'What it is all for: {showerFlow} of water at 40 °C for {showerMin}, on a family’s morning.',
    ),
    description: lf(
      'Une enquête française trouve 56 L par personne et par jour à 40 °C, à 23 L près. Pour quatre personnes et une eau du réseau à 12 °C, cela fait {fourPeople} à 45 °C, de {fourPeopleLow} à {fourPeopleHigh} selon les foyers : d’où les 200 L/jour des résultats publiés de ce ballon. Le modèle y répond à sa façon : une douche est un choix d’usage, {showerFlow} pendant {showerMin}. Les gouttes de ce dessin suivent le débit, et leur nombre aussi, mais pas la vapeur, un simple décor qui grossit avec la température.',
      'A French survey finds 56 L per person per day at 40 °C, give or take 23 L. For four people and mains water at 12 °C, that makes {fourPeople} at 45 °C, from {fourPeopleLow} to {fourPeopleHigh} depending on the household: hence the 200 L a day in this tank’s published results. The model answers in its own way: a shower is a usual-practice choice, {showerFlow} for {showerMin}. The drops in this drawing follow the flow, and so does their number, but not the steam, a mere decoration that grows with the temperature.',
    ),
    material: l('Pomme de douche, flexible', 'Shower head, hose'),
    specs: [
      sp(
        'Une douche, dans le modèle',
        'One shower, in the model',
        lf('{showerFlow}, {showerMin}', '{showerFlow}, {showerMin}'),
      ),
      sp('Besoin par personne', 'Need per person', l('56 L à 40 °C, à 23 L près', '56 L at 40 °C, give or take 23 L')),
      sp('Pour quatre personnes', 'For four people', lf('{fourPeople} à 45 °C', '{fourPeople} at 45 °C')),
    ],
    maintenance: maint(
      {
        failure:
          'Le calcaire qui bouche la pomme et réduit le débit : on le met souvent sur le compte du ballon. Un flexible poreux donne une fuite dans un coin de la pièce.',
        check:
          'Le débit au seau, de temps en temps. Une eau bleue au robinet est une alerte à prendre au sérieux : voyez la double enveloppe.',
        care: 'Détartrez la pomme. Une eau qui stagne longtemps dans un flexible se purge avant usage, comme le reste de la maison après une absence.',
      },
      {
        failure:
          'Scale blocking the head and cutting the flow: it is often blamed on the tank. A porous hose gives a leak in a corner of the room.',
        check:
          'The flow, into a bucket, now and then. Blue water at the tap is a warning to take seriously: see the jacket.',
        care: 'Descale the head. Water that has stood a long time in a hose is run off before use, like the rest of the house after an absence.',
      },
    ),
    tip: l(
      'Le bouton « Prendre une douche » de la Simulation la déclenche à tout moment, et l’on voit descendre le haut du ballon.',
      'The “Take a shower” button in the Simulation starts one at any time, and you see the top of the tank fall.',
    ),
    design: l(
      'Toute l’histoire finit ici, par une eau à 40 °C sur le dos. Ce n’est pas un exploit technique : on l’attend tous les matins, et c’est bien ce que ce lab veut montrer.',
      'The whole story ends here, with water at 40 °C on a back. It is no technical feat: it is what you expect every morning, and that is just what this lab wants to show.',
    ),
  },
];
