// The six lessons of the lab, in the order of docs/research.md §0.6: 1 why it climbs, 2 black plate under glass, 3 the layers, 4 the night, 5 too cold, too hot, 6 the shower. Each opens a world, a part and one of the simulation's twelve scenarios, and names the others it needs by the name the panel gives them, so that all twelve are reachable from a lesson (lessons.test.ts checks it).
// Shape: four paragraphs of at most 95 words, twelve questions in all, three choices of about the same length, the longest right about one time in three (lessons.test.ts), a wrong choice for each misconception the text names. Every term is defined once, in bold, in the first lesson that needs it.
// Numbers: no mark, reported by a source; † computed, from published figures or by the model; * an estimate of ours. What the physics found instead of the research's first guess is what the lessons say: the push is about 6.6 mm of water, not 4; the flow starts about 7:10, well after the plate's gain turns positive; the worst tank is at −0.61 m, not −1.22 m. Home builds and the Low-tech Lab are named once, in lesson 1, and the 1981 model's status once, in lesson 4.
import type { Lesson, Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf, v } from './part-helpers';

const chip = (fr: string, en: string, value: L | string): Spec => ({ label: l(fr, en), value });

export const LESSONS: Lesson[] = [
  // ------------------------------------------------------------------------------------------------ 1
  {
    id: 'why-it-climbs',
    title: l('Pourquoi ça monte tout seul', 'Why it climbs on its own'),
    summary: lf(
      'Une poussée de {pushMm} d’eau, sans moteur, fait tourner la boucle : voyez d’où elle vient, et pourquoi elle ne démarre pas à l’aube.',
      'A push of {pushMm} of water, with no motor, turns the loop: see where it comes from, and why it does not start at dawn.',
    ),
    body: [
      l(
        'Un liquide chaud est moins dense qu’un liquide froid. Dans une boucle fermée, si un côté est plus chaud, la colonne froide pèse plus lourd, et le tout se met à tourner : c’est le **thermosiphon**, qui n’a ni pompe ni commande. Ici le capteur chauffe le mélange, qui monte par le tuyau chaud jusqu’à la double enveloppe, y laisse sa chaleur, puis redescend par le tuyau froid. Ce n’est pas l’eau du robinet qui monte : c’est un mélange d’eau et de glycol.',
        'A hot liquid is less dense than a cold one. In a closed loop, if one side is warmer, the cold column weighs more and the whole thing starts to turn: that is the **thermosiphon**, with no pump and no controller. Here the collector heats the mix, which climbs the hot pipe to the jacket, gives up its heat there, then comes down the cold pipe. It is not tap water that climbs: it is a mix of water and glycol.',
      ),
      lf(
        'Tout se calcule en additionnant, tout le long de la boucle, la densité et la hauteur. Le graphique de la Simulation trace la température contre la hauteur : l’aire entre la montée et la descente est la **poussée**. À midi, par ciel clair, le modèle trouve {pushPa}, soit {pushMm} d’eau, pour {peakRise} de montée dans le capteur. Cela suffit à faire circuler {peakFlow}, soit environ {pipeSpeed} dans les tuyaux : les 19 L du circuit font le tour en {loopTurn} environ.',
        'It is all worked out by adding up density and height, all along the loop. The Simulation’s chart plots temperature against height: the area between the way up and the way down is the **push**. At noon under a clear sky, the model finds {pushPa}, or {pushMm} of water, for a rise of {peakRise} in the collector. That is enough to move {peakFlow}, about {pipeSpeed} in the pipes: the circuit’s 19 L go round in about {loopTurn}.',
      ),
      lf(
        'Regardez « Le premier rayon ». Par un jour clair de juin, la plaque gagne plus qu’elle ne perd dès {gainStart}, mais le fluide ne bouge que vers {flowStart} : la nuit a laissé la plaque sous l’air, et il faut d’abord qu’elle remonte et dépasse le fluide des tuyaux. Pas de moteur, donc pas de bouton : c’est le soleil qui décide de l’heure. Lancez ensuite « Une journée de juin » : le débit suit le soleil toute la journée.',
        'Watch “First light”. On a clear June day, the plate gains more than it loses from {gainStart}, but the fluid only moves at about {flowStart}: the night left the plate below the air, and it must first climb back and pass the fluid in the pipes. No motor, so no button: the sun decides the hour. Then run “A June day”: the flow follows the sun all day.',
      ),
      lf(
        'Une poussée si faible craint la friction. Dans « Des tubes trop fins », des tubes de 3 mm ramènent le débit à {narrow3Flow}, mais l’énergie survit presque : {narrow3Day} de moins sur la journée. Le débit n’est donc pas tout. Des panneaux en grilles de frigo circulent en ligne, comme ceux du Low-tech Lab, mais les leurs sont poussés par un circulateur : ce n’est pas ce principe. Ce lab explique ce qui arrête la montée, sans cotes à copier.',
        'So faint a push fears friction. In “Tubes too narrow”, 3 mm tubes bring the flow down to {narrow3Flow}, yet the energy nearly survives: {narrow3Day} less over the day. So flow is not everything. Panels made of fridge grids can be found online, such as the Low-tech Lab’s, but theirs are driven by a circulator: that is not this principle. This lab explains what stops the climb, with no dimensions to copy.',
      ),
    ],
    formula: 'Δp = −g ∮ ρ dz',
    figures: [
      chip('La poussée, à midi', 'The push, at noon', lf('{pushPa}, {pushMm} d’eau', '{pushPa}, {pushMm} of water')),
      chip('Le débit, à midi', 'The flow, at noon', v('{peakFlow}')),
      chip('Le départ du fluide', 'When the fluid starts', v('{flowStart}')),
    ],
    focus: { scene: 'rig', part: 'hot-pipe', scenario: 'first-light' },
    video: '00:16',
    quiz: [
      {
        q: l('Qu’est-ce qui fait tourner cette boucle, à midi ?', 'What turns this loop at noon?'),
        choices: [
          l('La pression de l’eau du réseau qui entre', 'The pressure of the mains water coming in'),
          l('Une colonne froide plus lourde que la chaude', 'A cold column heavier than the warm one'),
          l('La vapeur qui se forme en haut du capteur', 'Steam forming at the very top of the collector'),
        ],
        answer: 1,
        explain: lf(
          '**La densité.** Une colonne froide pèse plus qu’une chaude, et ce tout petit écart, {pushPa} à midi selon le modèle, suffit. Le réseau ne pousse que l’eau potable, et rien ici ne bout en marche normale.',
          '**Density.** A cold column weighs more than a warm one, and that tiny difference, {pushPa} at noon by the model, is enough. The mains only push the drinking water, and nothing here boils in normal running.',
        ),
      },
      {
        q: lf(
          'La plaque gagne de la chaleur dès {gainStart}, mais le fluide part vers {flowStart}. Pourquoi ?',
          'The plate gains heat from {gainStart}, but the fluid starts at about {flowStart}. Why?',
        ),
        choices: [
          l('Elle doit d’abord remonter du froid de la nuit', 'It must first climb back from the night’s cold'),
          l(
            'Une vanne attend qu’il y ait assez de soleil sur le capteur',
            'A valve waits until the collector has enough sun on it',
          ),
          l('Le ballon empêche tout départ avant le matin', 'The tank prevents any start before morning'),
        ],
        answer: 0,
        explain: l(
          '**La plaque remonte d’abord.** Aucune vanne n’attend, puisqu’il n’y en a pas. Le fluide du capteur doit devenir plus chaud que celui des tuyaux avant qu’une poussée n’apparaisse.',
          '**The plate climbs first.** No valve waits, since there is none. The collector’s fluid must get warmer than the fluid in the pipes before any push appears.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 2
  {
    id: 'black-plate-under-glass',
    title: l('Une plaque noire sous un verre', 'A black plate under glass'),
    summary: lf(
      'Ce que le soleil donne, ce que l’air reprend, et pourquoi un capteur noir peut battre un capteur sélectif en dessous de {crossK}.',
      'What the sun gives, what the air takes back, and why a black collector can beat a selective one below {crossK}.',
    ),
    body: [
      l(
        'Un laboratoire indépendant a mesuré ce capteur. Son **rendement** vaut 0,778 quand le fluide entre à la température de l’air, puis baisse : on retire 6,541 W/m²K et un petit terme au carré, 0,025, pour chaque degré d’écart. Autrement dit, 0,778 est ce que le verre et la plaque laissent passer ; le reste de la courbe, c’est ce que le capteur perd à être plus chaud que l’air.',
        'An independent laboratory measured this collector. Its **efficiency** is 0.778 when the fluid enters at air temperature, then falls: subtract 6.541 W/m²K and a small squared term, 0.025, for each degree of difference. In other words, 0.778 is what the glass and the plate let through; the rest of the curve is what the collector loses by being warmer than the air.',
      ),
      l(
        'La fiche d’essai le dit en clair. Sur une journée de 4,7 kWh/m² de soleil, un capteur donne 6,0 kWh quand il tourne à 5 K au-dessus de l’air, 4,0 kWh à 20 K et 0,7 kWh à 50 K. Aucun réglage ne rattrape cela : il faut lui rendre du froid. Toute la machine est dessinée pour ça, depuis la résistance à mi-hauteur jusqu’au diffuseur d’eau froide.',
        'The test sheet says it plainly. On a day of 4.7 kWh/m² of sun, a collector gives 6.0 kWh when running 5 K above the air, 4.0 kWh at 20 K and 0.7 kWh at 50 K. No setting makes up for that: it must be handed cold fluid. The whole machine is drawn for that, from the element at half height to the cold water diffuser.',
      ),
      lf(
        'Une plaque **sélective** absorbe aussi bien mais rayonne bien moins. Elle part de plus bas, ici 0,671, mais perd moins, 3,592 W/m²K. Les deux courbes se croisent à {crossK} au-dessus de l’air pour {crossG}. En dessous, le noir gagne ; au-dessus, le sélectif. Sur une année, les résultats publiés du constructeur lui donnent de {selectiveLow} à {selectiveHigh} de plus selon le site. Le modèle, avec la courbe d’un autre capteur, trouve de {selectiveModelLow} à {selectiveModelHigh} : c’est sa limite.',
        'A **selective** plate absorbs as well but radiates far less. It starts lower, 0.671 here, but loses less, 3.592 W/m²K. The two curves cross at {crossK} above the air at {crossG}. Below that, black wins; above it, selective. Over a year, the maker’s published results give it {selectiveLow} to {selectiveHigh} more depending on the site. The model, using another collector’s curve, finds {selectiveModelLow} to {selectiveModelHigh}: that is its limit.',
      ),
      lf(
        'Lancez « Un nuage passe ». Le soleil disparaît, le débit tombe en une minute ou deux, et le ballon ne le remarque pas : 300 L ne bougent pas pour si peu. Le capteur, lui, réagit vite, car il a peu de masse : environ {dryCapacity}, une estimation tirée d’autres capteurs. Dans le monde du capteur, cette différence se lit à la couleur des tubes, qui changent bien avant que rien ne change dans la colonne d’eau.',
        'Run “A passing cloud”. The sun goes, the flow falls within a minute or two, and the tank does not notice: 300 L do not move for so little. The collector reacts quickly, having little mass: about {dryCapacity}, an estimate taken from other collectors. In the collector’s world, the difference reads in the colour of the tubes, which change long before anything changes in the water column.',
      ),
    ],
    formula: 'η = η₀ − a₁·x − a₂·G·x²,  x = (Ti − Ta) / G',
    figures: [
      chip('À température égale', 'At equal temperature', l('0,778', '0.778')),
      chip('Perte par degré', 'Loss per degree', l('6,541 W/m²K', '6.541 W/m²K')),
      chip('Noir et sélectif se croisent', 'Black and selective cross', v('{crossK}')),
    ],
    focus: { scene: 'collector', part: 'absorber-plate', scenario: 'passing-cloud' },
    quiz: [
      {
        q: l(
          'Un capteur tourne déjà à 50 K au-dessus de l’air. Comment gagner le plus, sans rien changer d’autre ?',
          'A collector already runs 50 K above the air. How do you gain most, changing nothing else?',
        ),
        choices: [
          l('Lui rendre un fluide plus froid', 'Give it back colder fluid'),
          l('Faire circuler le fluide bien plus vite', 'Move the fluid round much faster'),
          l('Lui ajouter une seconde couche de verre sombre', 'Add a second layer of dark glass'),
        ],
        answer: 0,
        explain: l(
          '**Lui rendre du froid.** À 50 K, la journée d’essai tombe à 0,7 kWh, contre 6,0 kWh à 5 K. Le débit compte moins qu’on ne croit, et un verre sombre retirerait du soleil.',
          '**Hand it cold fluid.** At 50 K the test day falls to 0.7 kWh, against 6.0 kWh at 5 K. Flow counts less than you might think, and dark glass would take away sun.',
        ),
      },
      {
        q: lf(
          'Une plaque noire bat-elle toujours une plaque sélective ?',
          'Does a black plate always beat a selective one?',
        ),
        choices: [
          l('Oui : le noir absorbe toujours le plus de soleil', 'Yes: black always absorbs the most sun'),
          l('Non : il gagne tant que le fluide reste peu chaud', 'No: it wins while the fluid stays fairly cool'),
          l('Non : le sélectif gagne à toute température', 'No: selective wins at any temperature'),
        ],
        answer: 1,
        explain: lf(
          '**Tant que le fluide reste peu chaud.** Les courbes se croisent à {crossK} au-dessus de l’air pour {crossG}. Sur une année, le sélectif prend l’avantage, de {selectiveLow} à {selectiveHigh} selon le constructeur, car les hivers et les fins de journée comptent.',
          '**While the fluid stays fairly cool.** The curves cross at {crossK} above the air at {crossG}. Over a year selective takes the lead, by {selectiveLow} to {selectiveHigh} according to the maker, since winters and late afternoons count.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 3
  {
    id: 'the-layers',
    title: l('Les couches du ballon', 'The tank’s layers'),
    summary: lf(
      'L’eau chaude reste en haut, la froide retourne au capteur. Mélangez tout, et le modèle perd {mixedYear} de son année.',
      'Hot water stays on top, cold goes back to the collector. Mix it all, and the model loses {mixedYear} of its year.',
    ),
    body: [
      lf(
        'La **stratification**, c’est l’eau chaude qui reste au-dessus de l’eau froide, sans paroi entre elles. Le soir d’un jour clair de juin, à Athènes, le modèle trouve {topEvening} en haut du ballon et {bottomEvening} en bas. Remplir 300 L de 20 à 60 °C demande {tankfulKwh}, {tankfulHours} de chauffe à {kettle2}. Pourtant une douche ne demande pas tout le ballon : le haut suffit, tant qu’il reste en haut.',
        '**Stratification** is hot water staying above cold water, with no wall between them. On the evening of a clear June day at Athens, the model finds {topEvening} at the top of the tank and {bottomEvening} at the bottom. Filling 300 L from 20 to 60 °C takes {tankfulKwh}, {tankfulHours} of heating at {kettle2}. Yet a shower does not take the whole tank: the top is enough, as long as it stays on top.',
      ),
      lf(
        'Les couches donnent deux choses à la fois : une eau chaude au robinet, et une eau froide au capteur, là où il travaille le mieux. Lancez « Un ballon mélangé » : le lab enlève les couches à la main. Le capteur reçoit plus chaud et perd plus, le robinet reçoit moins chaud. Le modèle y perd {mixedYear} sur l’année à Athènes ; un modèle de 1981 trouvait environ 10 % sur sa journée d’essai, avec un autre ballon. Comparez à « Une journée de juin ».',
        'Layers give two things at once: hot water at the tap, and cold water at the collector, where it works best. Run “A mixed tank”: the lab removes the layers by hand. The collector gets warmer fluid and loses more, the tap gets cooler water. The model loses {mixedYear} of its year at Athens; a 1981 model found about 10% on its test day, with another tank. Compare with “A June day”.',
      ),
      lf(
        'Un ballon couché a moins de hauteur qu’un ballon debout : l’agence française de l’énergie les juge « bien moins performants ». Tous les monoblocs les utilisent quand même, pour rester bas sur le toit. Sa résistance à mi-hauteur laisse le bas froid, son diffuseur fait entrer le réseau en douceur, et le haut sert de réserve. Des essais sur d’autres ballons trouvent des couches sur 40 à 60 % du volume, au tirage ; ici le modèle trouve {drawFraction}.',
        'A tank lying flat has less height than an upright one: the French energy agency calls them “far less efficient”. Every compact unit uses them all the same, to stay low on the roof. Its element at half height leaves the bottom cold, its diffuser lets the mains in gently, and the top serves as a reserve. Tests on other tanks find layers over 40 to 60% of the volume when drawn; here the model finds {drawFraction}.',
      ),
      lf(
        'Comment la double enveloppe chauffe-t-elle sans tout mélanger ? Une paroi chaude crée un film d’eau tiède, qui monte jusqu’à une couche aussi chaude que lui, et s’y arrête. Le modèle suppose que {stratify} de la chaleur reçue arrive ainsi à sa propre couche, le reste à la couche voisine de la paroi. Cette part n’a jamais été mesurée sur ce ballon : c’est l’estimation qui pèse le plus sur son année, de {stratLow} à {stratHigh}.',
        'How does the jacket heat with no mixing? A warm wall makes a film of warm water, which climbs to a layer as warm as itself and stops there. The model assumes {stratify} of the heat received reaches its own layer this way, the rest going to the layer beside the wall. That share was never measured on this tank: it is the estimate that weighs most on its year, from {stratLow} to {stratHigh}.',
      ),
    ],
    formula: 'Q = m · c · ΔT',
    figures: [
      chip('Haut du ballon, le soir', 'Tank top, by evening', v('{topEvening}')),
      chip('Bas du ballon, le soir', 'Tank bottom, by evening', v('{bottomEvening}')),
      chip('Un ballon mélangé', 'A mixed tank', lf('{mixedYear} de moins', '{mixedYear} less')),
    ],
    focus: { scene: 'tank-and-tap', part: 'water-column', scenario: 'mixed-tank' },
    video: '00:38',
    quiz: [
      {
        q: l(
          'Pourquoi un ballon mélangé donne-t-il moins, avec le même soleil ?',
          'Why does a mixed tank give less, under the same sun?',
        ),
        choices: [
          l('Le capteur reçoit du fluide plus chaud, et perd plus', 'The collector gets warmer fluid, and loses more'),
          l('L’eau chaude pèse plus lourd une fois mélangée', 'Hot water weighs more once it is mixed'),
          l(
            'Le mélange détruit une part de la chaleur reçue du capteur',
            'Mixing destroys some of the heat received from the collector',
          ),
        ],
        answer: 0,
        explain: lf(
          '**Le capteur perd plus.** La chaleur ne disparaît pas en se mélangeant, et aucun chiffre de masse ne change ; mais le fond du ballon n’est plus froid, et le capteur tourne plus chaud : {mixedYear} de moins dans le modèle.',
          '**The collector loses more.** Heat does not vanish by mixing, and no mass changes; but the tank’s bottom is no longer cold, so the collector runs hotter: {mixedYear} less in the model.',
        ),
      },
      {
        q: l(
          'Pourquoi tous les monoblocs utilisent-ils un ballon couché, malgré ses faibles couches ?',
          'Why do all compact units use a tank lying flat, despite its poor layers?',
        ),
        choices: [
          l('Parce qu’il coûte moins d’acier qu’un ballon debout', 'Because it takes less steel than an upright tank'),
          l('Parce qu’il garde mieux ses couches par grand vent', 'Because it keeps its layers better in strong wind'),
          l('Pour rester bas, juste au-dessus du capteur', 'To stay low, just above the collector'),
        ],
        answer: 2,
        explain: l(
          '**Pour rester bas sur le toit.** Il doit se trouver au-dessus du capteur sans monter très haut, avec tout son poids. Le vent n’aide pas ses couches, et l’acier n’est pas la question.',
          '**To stay low on the roof.** It must lie above the collector without rising far, with all its weight. Wind does nothing for its layers, and steel is not the point.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 4
  {
    id: 'the-night',
    title: l('La nuit : ce que le ballon perd', 'The night: what the tank loses'),
    summary: lf(
      'Ce qui monte le jour peut couler à l’envers la nuit. À sa place, la machine y perd {lost0Pct}. Plus bas, bien plus, et le clapet coûte moins qu’on ne le dit.',
      'What climbs by day can run backward at night. In its place, the machine loses {lost0Pct} that way. Lower down, far more, and the valve costs less than people say.',
    ),
    body: [
      lf(
        'La nuit, le ballon perd de deux façons. Par sa peau, quoi qu’on fasse : {skin0} sur une nuit claire de juin, selon le modèle. Et par la boucle : le ciel clair refroidit la plaque jusqu’à {depression} sous l’air, ce fluide froid veut descendre, et il entraîne le chaud du ballon. C’est l’**écoulement inverse**. À la place de la vraie machine, y = 0, il coule à {nightFlow} et emporte {lost0} : {lost0Pct} de la chaleur du jour.',
        'At night the tank loses in two ways. Through its skin, whatever you do: {skin0} on a clear June night, by the model. And through the loop: the clear sky cools the plate to {depression} below the air, that cold fluid wants to go down, and it draws in the tank’s warmth. That is **reverse flow**. At the real machine’s place, y = 0, it runs at {nightFlow} and carries off {lost0}: {lost0Pct} of the day’s heat.',
      ),
      lf(
        'Faites descendre le ballon. À −0,30 m, l’écoulement emporte {lostM03}, {lostM03Pct} de la journée, et la nuit totale double : {nightGood} à +0,61 m, {nightM03} ici. Un modèle de 1981 le disait déjà négligeable si le bas du ballon est au niveau du haut du capteur, et important en dessous. Mais sur un ballon debout : personne n’a mesuré un capteur plan avec son ballon plus bas. Le nôtre repose sur un calcul du ciel : sans lui, {noSky0} à zéro, et {noSkyM03} à −0,30 m.',
        'Lower the tank. At −0.30 m the flow carries off {lostM03}, {lostM03Pct} of the day, and the whole night doubles: {nightGood} at +0.61 m, {nightM03} here. A 1981 model already said reverse flow is negligible if the tank’s bottom is level with the collector’s top, and substantial below. But of an upright tank: nobody has measured a flat collector with its tank lower. And ours rests on a sum for the sky: without it, {noSky0} at zero, and {noSkyM03} at −0.30 m.',
      ),
      lf(
        'Lancez « Un ballon trop bas », à −0,61 m : le banc porte le ballon à côté de la rangée de capteurs, et les points repartent à l’envers à la tombée du soir. C’est la pire place du modèle, {lostM061Pct}. Plus bas, le jour s’arrête : {gainM061} à −0,61 m, {gainM09} à −0,90 m, {gainM122} à −1,22 m, car le fluide ne monte plus jusqu’à la double enveloppe. Et « Une bonne nuit » montre la place de la vraie machine, avec son petit filet.',
        'Run “A tank too low”, at −0.61 m: the stand carries the tank beside the bank of collectors, and the dots set off backward at dusk. That is the model’s worst place, {lostM061Pct}. Lower still, the day stops: {gainM061} at −0.61 m, {gainM09} at −0.90 m, {gainM122} at −1.22 m, since the fluid can no longer climb to the jacket. And “A good night” shows the real machine’s place, with its small trickle.',
      ),
      lf(
        '« Le clapet » coupe ce filet : {valveLost0} à y = 0, et de {valveYearLow} à {valveYearHigh} de plus sur l’année, à condition d’un clapet léger, car la poussée n’a que {pushPa}. Ce même filet tiédit la plaque en moyenne, {plateOpen0} contre {plateValve0} par rapport à l’air. Des chercheurs l’étudient contre le gel, mais au point le plus froid, le modèle ne trouve aucun gain à cette hauteur. Mesuré à Chypre, sur de vraies machines : environ 7 000 kJ par nuit, {cyprusKwh}, surtout par la peau.',
        '“The one-way valve” cuts that trickle: {valveLost0} at y = 0, and {valveYearLow} to {valveYearHigh} more over the year, provided the valve is light, since the push has only {pushPa}. That same trickle warms the plate on average, {plateOpen0} against {plateValve0} relative to the air. Researchers study it against frost, but at the coldest point the model finds no gain at this height. Measured in Cyprus, on real machines: about 7,000 kJ a night, {cyprusKwh}, mostly through the skin.',
      ),
    ],
    formula: 'Q = U · A · ΔT · t + ṁ · c · ΔT · t',
    figures: [
      chip('Par la peau, une nuit', 'Through the skin, one night', v('{skin0}')),
      chip('À l’envers, à y = 0', 'Backward, at y = 0', v('{lost0}')),
      chip('À l’envers, à −0,30 m', 'Backward, at −0.30 m', v('{lostM03}')),
    ],
    focus: { scene: 'rig', part: 'hot-pipe', scenario: 'bad-tank' },
    quiz: [
      {
        q: lf(
          'Un clapet coupe l’écoulement inverse. À la vraie place du ballon, que gagne-t-on sur l’année, dans le modèle ?',
          'A valve cuts the reverse flow. At the tank’s real place, what is gained over the year, in the model?',
        ),
        choices: [
          l(
            'Environ le double de la chaleur du jour, à chaque nuit claire',
            'About twice the day’s heat, on every clear night',
          ),
          lf(
            'De {valveYearLow} à {valveYearHigh} de plus, guère davantage',
            '{valveYearLow} to {valveYearHigh} more, little beyond that',
          ),
          l('Rien du tout, puisqu’il ne se passe rien', 'Nothing at all, since nothing happens'),
        ],
        answer: 1,
        explain: lf(
          '**De {valveYearLow} à {valveYearHigh} de plus.** À y = 0, la peau du ballon pèse plus que le filet. Il y a bien un écoulement, {nightFlow} selon le modèle, mais la machine est posée juste à la limite.',
          '**{valveYearLow} to {valveYearHigh} more.** At y = 0, the tank’s skin weighs more than the trickle. There is a flow, {nightFlow} by the model, but the machine sits right on the limit.',
        ),
      },
      {
        q: l(
          'Pourquoi le pire ballon du modèle n’est-il pas le plus bas ?',
          'Why is the model’s worst tank not the lowest?',
        ),
        choices: [
          l('Plus bas, un clapet se ferme tout seul', 'Lower down, a valve shuts by itself'),
          l('Plus bas, l’écoulement inverse change de sens', 'Lower down, the reverse flow changes direction'),
          l('Plus bas, il ne charge plus rien le jour', 'Lower down, it charges nothing by day'),
        ],
        answer: 2,
        explain: lf(
          '**Il n’a plus rien à perdre.** Sous {cliffY}, le fluide ne monte plus jusqu’à la double enveloppe : {gainM122} à −1,22 m. Sans chaleur le jour, rien à voler la nuit. Aucun clapet n’entre en jeu ici.',
          '**It has nothing left to lose.** Below {cliffY}, the fluid can no longer climb to the jacket: {gainM122} at −1.22 m. No heat by day, nothing to steal at night. No valve comes into it.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 5
  {
    id: 'too-cold-too-hot',
    title: l('Trop froid, trop chaud', 'Too cold, too hot'),
    summary: lf(
      'Une nuit de gel, une semaine de vacances : ce que le glycol retient, ce que les soupapes laissent sortir, et jusqu’où le modèle peut parler.',
      'A frosty night, a holiday week: what the glycol holds back, what the valves let out, and how far the model can speak.',
    ),
    body: [
      lf(
        'Sous un ciel clair, une plaque descend sous l’air : {depression} par air à 10 °C et 2 m/s, {depressionCalm} sans vent, {depressionWindy} à 5 m/s, un calcul qu’aucune rosée ne vient corriger. Dans « Une nuit de gel », de l’eau seule atteint son point de gel dès {frostWater} d’air. C’est la limite du constructeur, trouvée sans la viser : un circuit ouvert n’est « pas adapté » sous 5 °C. Une nuit claire peut donc geler un capteur alors que l’air ne gèle pas.',
        'Under a clear sky, a plate falls below the air: {depression} with air at 10 °C and 2 m/s, {depressionCalm} with no wind, {depressionWindy} at 5 m/s, a sum no dew comes to correct. In “A frosty night”, water alone reaches its freezing point from {frostWater} of air. That is the maker’s limit, found with no aim at it: an open circuit is “not suitable” below 5 °C. So a clear night can freeze a collector while the air stays above freezing.',
      ),
      lf(
        'D’où le **glycol**. Le constructeur donne −7 °C à 20 %, −13 °C à 30 %, −22 °C à 40 %, −34 °C à 50 %. Une bouteille de 4,5 L dans 19 L fait {glycolPct}, soit {glycolFreeze} pour le mélange ; le modèle l’y amène quand l’air tombe à {frostMix}. À 40 %, c’est {frostMix40}. Ce sont les premiers cristaux : le modèle s’arrête là, il ne dit pas si un tube éclate. Sous −15 °C, le constructeur demande qu’on le consulte.',
        'Hence the **glycol**. The maker gives −7 °C at 20%, −13 °C at 30%, −22 °C at 40%, −34 °C at 50%. One 4.5 L bottle in 19 L makes {glycolPct}, so {glycolFreeze} for the mix; the model brings it there when the air falls to {frostMix}. At 40%, it is {frostMix40}. Those are the first crystals: the model stops there, and does not say whether a tube bursts. Below −15 °C, the maker asks to be consulted.',
      ),
      lf(
        'Lancez « Une semaine de vacances ». Plus personne ne tire d’eau en juillet, le ballon monte, la dilatation fait goutter la soupape d’eau froide : {expansionL} de 10 à 80 °C. Sans vanne de surchauffe, le modèle atteint {holidayNoValve} ; avec elle, {holidayValve}, mais {holidayCollector} au capteur, seul au soleil. Sa consigne n’est pas publiée, {overheatSet} est une estimation. Un ballon voisin a atteint 109 °C et +3,7 bar en laboratoire, de quoi ouvrir une soupape de 3 bar.',
        'Run “A holiday week”. Nobody draws water in July, the tank climbs, and the expansion makes the cold relief drip: {expansionL} from 10 to 80 °C. With no overheat valve, the model reaches {holidayNoValve}; with one, {holidayValve}, but {holidayCollector} at the collector, alone in the sun. Its setting is not published, {overheatSet} is an estimate. A similar tank reached 109 °C and +3.7 bar in a laboratory, enough to open a 3-bar relief.',
      ),
      lf(
        'Ce que subit le capteur dépend de sa plaque. La noire plafonne vers {blackStag}, en prolongeant sa courbe : un chiffre fragile, hors du domaine de l’essai. Des capteurs sélectifs annoncent de 200 °C à 220 °C. Le glycol s’abîme en surchauffe, et seuls des fabricants parlent d’environ 150 °C : nous n’avons trouvé aucune limite dans une revue à comité de lecture. Le modèle ne suit ni l’ébullition, ni l’usure du fluide, ni la perte d’eau : il signale, il ne simule pas.',
        'What the collector goes through depends on its plate. The black one tops out at about {blackStag}, by extending its curve: a shaky figure, outside the test’s range. Selective collectors quote 200 °C to 220 °C. Glycol degrades when overheated, and only makers speak of about 150 °C: we found no peer-reviewed limit. The model follows no boiling, no fluid ageing and no water lost: it flags, it does not simulate.',
      ),
    ],
    formula: 'ΔV = V · (ρ₁₀ / ρ₈₀ − 1)',
    figures: [
      chip('Le mélange, point de gel', 'The mix, freezing point', v('{glycolFreeze}')),
      chip('L’eau, air qui suffit', 'Water, air that is enough', v('{frostWater}')),
      chip('Dilatation, 300 L', 'Expansion, 300 L', v('{expansionL}')),
    ],
    focus: { scene: 'tank-and-tap', part: 'tpr-valve', scenario: 'holiday-week' },
    quiz: [
      {
        q: lf(
          'L’air reste à {frostWater} toute une nuit claire. Un capteur plein d’eau peut-il geler ?',
          'The air stays at {frostWater} all through a clear night. Can a collector full of water freeze?',
        ),
        choices: [
          l('Non : il ne gèle jamais au-dessus de zéro dans l’air', 'No: it never freezes with the air above zero'),
          l('Non : le verre garde toujours la plaque au chaud', 'No: the glass always keeps the plate warm'),
          l('Oui : le ciel tire sa plaque sous l’air', 'Yes: the sky pulls its plate below the air'),
        ],
        answer: 2,
        explain: lf(
          '**Oui, d’après le modèle.** La plaque descend de plusieurs degrés sous l’air, et le constructeur exclut les circuits ouverts sous 5 °C. Le chiffre de {frostWater} dépend d’un calcul du ciel sans rosée, à prendre comme un ordre de grandeur.',
          '**Yes, by the model.** The plate falls several degrees below the air, and the maker rules out open circuits below 5 °C. The {frostWater} figure rests on a sum for the sky with no dew, to be taken as an order of magnitude.',
        ),
      },
      {
        q: lf(
          'Pendant le chauffage, la soupape d’eau froide goutte. Que faut-il penser ?',
          'During heating, the cold relief valve drips. What should you think?',
        ),
        choices: [
          l('Il faut la boucher avant que la cuve ne se vide', 'It must be plugged before the vessel empties'),
          l('C’est normal : l’eau chaude prend plus de place', 'It is normal: hot water takes more room'),
          l('Le ballon perce, il faut le remplacer au plus vite', 'The tank is holing, so replace it quickly'),
        ],
        answer: 1,
        explain: lf(
          '**C’est normal.** De 10 à 80 °C, {expansionL} doivent sortir, et le manuel le dit noir sur blanc. Ne bouchez jamais une soupape : c’est la sortie de la pression.',
          '**It is normal.** From 10 to 80 °C, {expansionL} must leave, and the manual says so in plain words. Never plug a relief valve: it is the pressure’s way out.',
        ),
      },
    ],
  },
  // ------------------------------------------------------------------------------------------------ 6
  {
    id: 'the-shower',
    title: l('La douche : entre brûlure et légionelle', 'The shower: between scald and legionella'),
    summary: l(
      '60 °C pour les bactéries, 50 °C pour la peau, un mitigeur entre les deux. Et quelle part de votre eau chaude, de Stockholm à Athènes ?',
      '60 °C for the bacteria, 50 °C for the skin, a valve between them. And what share of your hot water, from Stockholm to Athens?',
    ),
    body: [
      l(
        'Deux risques tirent en sens contraire. Les **légionelles** se multiplient de 25 °C à 45 °C dans l’eau qui stagne, d’où le thermostat à 60 °C : la Suisse demande au moins 60 °C en sortie de ballon, l’Australie 60 °C pour l’appoint. La **brûlure**, elle, va vite : à 50 °C, de 1 à 5 min ; à 55 °C, de 5 à 25 s ; à 60 °C, de 2 à 5 s ; les enfants environ quatre fois plus vite. Personne n’a mesuré ce risque-là sur cette machine.',
        'Two risks pull in opposite directions. **Legionella** multiply at 25 °C to 45 °C in standing water, hence the thermostat at 60 °C: Switzerland asks for at least 60 °C leaving the tank, Australia 60 °C for the booster. A **scald** comes fast: at 50 °C, 1 to 5 min; at 55 °C, 5 to 25 s; at 60 °C, 2 to 5 s; children about four times faster. Nobody has measured this risk on this machine.',
      ),
      l(
        'Le **mitigeur** tranche : l’eau chaude reste chaude en amont, et il n’en laisse passer que 50 °C vers la salle de bains. Lancez « Le matin de la famille » : quatre douches à la suite, la couche chaude descend, et pour la troisième le lab retire le mitigeur. Regardez le chiffre du robinet. Baisser le thermostat ne remplacerait pas ce mitigeur : on redonnerait de la place aux bactéries. L’alarme du panneau signale cette zone, sans prétendre mesurer un risque.',
        'The **tempering valve** settles it: the water stays hot upstream, and it lets only 50 °C on to the bathroom. Run “The family’s morning”: four showers in a row, the hot layer falls, and for the third the lab takes the valve away. Watch the tap’s figure. Lowering the thermostat would not replace this valve: it would give room back to the bacteria. The panel’s alarm points to that band, without claiming to measure a risk.',
      ),
      lf(
        'Quelle part de l’eau chaude ? Les résultats publiés pour cette machine, à 200 L/jour, donnent 45,3 % à Stockholm, 51,5 % à Würzburg, 65,0 % à Davos et 81,4 % à Athènes ; à 400 L/jour, 28,7, 34,2, 40,4 et 60,7 %. C’est un essai plus un calcul selon une norme européenne, pas une année mesurée sur un toit. Le modèle les suit de {yearSpreadLow} à {yearSpreadHigh}. Une famille de quatre tire environ {fourPeople} à 45 °C : la ligne des 200 L.',
        'What share of the hot water? The published results for this machine, at 200 L a day, give 45.3% at Stockholm, 51.5% at Würzburg, 65.0% at Davos and 81.4% at Athens; at 400 L a day, 28.7, 34.2, 40.4 and 60.7%. That is a test plus a calculation under a European standard, not a year measured on a roof. The model follows them within {yearSpreadLow} to {yearSpreadHigh}. A family of four draws about {fourPeople} at 45 °C: the 200 L line.',
      ),
      l(
        'Davos surprend. La montagne a du soleil et de l’eau très froide à chauffer, donc beaucoup à gagner. Mais le constructeur demande à être consulté sous −15 °C, et l’agence française de l’énergie réserve le monobloc aux climats chauds : le chiffre dit ce que la machine fournit, pas qu’elle y tient. Et pendant les jours gris, l’appoint fait le reste. « L’appoint toujours allumé » montre son piège : le ballon n’est jamais froid, et le soleil a moins de place.',
        'Davos is a surprise. The mountain has sun and very cold water to heat, so plenty to gain. But the maker asks to be consulted below −15 °C, and the French energy agency keeps compact units to warm climates: the figure says what the machine delivers, not that it survives there. And on grey days the booster does the rest. “The booster always on” shows its trap: the tank is never cold, and the sun has less room.',
      ),
    ],
    formula: 'f = QL / Qd',
    figures: [
      chip('Athènes, à 200 L/jour', 'Athens, at 200 L a day', l('81,4 %', '81.4%')),
      chip('Stockholm, à 200 L/jour', 'Stockholm, at 200 L a day', l('45,3 %', '45.3%')),
      chip('Au robinet, au plus', 'At the tap, at most', '50 °C'),
    ],
    focus: { scene: 'tank-and-tap', part: 'tempering-valve', scenario: 'family-morning' },
    quiz: [
      {
        q: l(
          'Pour éviter de se brûler, pourquoi ne pas simplement régler le ballon à 45 °C ?',
          'To avoid scalds, why not simply set the tank to 45 °C?',
        ),
        choices: [
          l(
            'L’eau resterait dans la zone où les légionelles se multiplient',
            'The water would stay in the band where legionella multiply',
          ),
          l(
            'Le capteur cesserait de chauffer sous cette température',
            'The collector would stop heating below that temperature',
          ),
          l('Le glycol ne supporte pas une température aussi basse', 'The glycol cannot bear so low a temperature'),
        ],
        answer: 0,
        explain: l(
          '**À cause des légionelles.** Elles se multiplient de 25 °C à 45 °C. D’où deux chiffres dans la même maison : 60 °C au ballon, 50 °C au robinet, et le mitigeur entre les deux.',
          '**Because of legionella.** They multiply at 25 °C to 45 °C. Hence two figures in one house: 60 °C in the tank, 50 °C at the tap, and the tempering valve between them.',
        ),
      },
      {
        q: l(
          'À Davos, 65,0 % à 200 L/jour : qu’en conclure ?',
          'At Davos, 65.0% at 200 L a day: what do you conclude?',
        ),
        choices: [
          l(
            'La machine y fonctionnera tout l’hiver sans aucun souci',
            'The machine will run there all winter with no trouble',
          ),
          l('Un calcul : le constructeur la limite dans le froid', 'A calculation: the maker limits it in the cold'),
          l('L’appoint ne servira jamais de toute l’année', 'The booster will never be used all year'),
        ],
        answer: 1,
        explain: l(
          '**Un calcul, et une limite.** Le chiffre vient d’un essai plus un calcul. Le constructeur demande à être consulté sous −15 °C : le rendement annuel ne répond pas à cette question.',
          '**A calculation, and a limit.** The figure comes from a test plus a calculation. The maker asks to be consulted below −15 °C: the annual yield does not answer that question.',
        ),
      },
    ],
  },
];
