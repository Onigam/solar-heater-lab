import { registerStrings, tx, type CommonKey } from '@onigam/lab-kit/i18n';

// The lab's own interface strings, `key: [fr, en]`. The ones every lab shares (modes, toolbar, panels, guides) live in the kit, the simulation's in src/panels/strings.ts; add here only what is specific to this lab.
// Said once, here and in the Sources panel: educational reconstruction, the marks in full, the law.

export const LAB_STRINGS = {
  labTitle: ['CHAUFFE-EAU SOLAIRE', 'SOLAR WATER HEATER'],
  tagline: [
    'Sans pompe, en 3D : le capteur, le ballon, la nuit, la douche',
    'With no pump, in 3D: the collector, the tank, the night, the shower',
  ],
  // the four must fit the phone's bar, 358 px at 13 px: with their articles the fourth was cut in both languages, and it has no way to scroll
  sceneHouse: ['Maison', 'House'],
  sceneRig: ['Machine', 'Machine'],
  sceneCollector: ['Capteur', 'Collector'],
  sceneTank: ['Ballon et douche', 'Tank, shower'],
  goHouse: ['Revenir à la maison', 'Back to the house'],
  goRig: ['Voir la machine seule', 'See the machine alone'],
  goCollector: ['Ouvrir un capteur', 'Open a collector'],
  goTank: ['Ouvrir le ballon', 'Open the tank'],
  goSimulation: ['Lancer la simulation', 'Run the simulation'],
  plansIntro: [
    'Dix planches A3 générées à partir des cotes du modèle 3D et du modèle de simulation : l’ensemble vu du dessus et de côté, les hauteurs de la boucle, les coupes du capteur et du ballon, le schéma hydraulique, la fixation au toit, les charges et les pressions, le bilan de chaleur, l’ordre de montage et la nomenclature. Une marque dit ce qui vient du constructeur et ce que nous avons estimé. Elles servent à comprendre : ce ne sont pas des plans de fabrication.',
    'Ten A3 sheets generated from the dimensions of the 3D model and from the simulation: the whole unit from above and from the side, the heights of the loop, sections of the collector and the tank, the hydraulic diagram, the roof fixing, the loads and pressures, the heat balance, the order of assembly and the bill of materials. A mark says what comes from the maker and what we estimated. They are for understanding: they are not manufacturing drawings.',
  ],
  lessonsIntro: [
    'Six leçons, de ce qui fait monter le fluide à ce qui coule sous la douche. Chacune ouvre un scénario de la Simulation et finit par deux questions. Un chiffre marqué † est calculé, à partir de chiffres publiés ou par le modèle de ce lab ; marqué *, c’est une estimation de ce lab, faute de source.',
    'Six lessons, from what makes the fluid climb to what comes out of the shower. Each opens a scenario of the Simulation and ends with two questions. A figure marked † is computed, from published figures or by this lab’s model; marked *, it is an estimate of this lab, for want of a source.',
  ],
  disclaimer: [
    'Reconstitution pédagogique indépendante, d’après les documents publics du constructeur : ce n’est ni un plan officiel ni un produit de celui-ci, et ce lab n’y est pas affilié.',
    'An independent educational reconstruction, from the maker’s public documents: it is neither an official drawing nor a product of the maker, and this lab is not affiliated with it.',
  ],
  noticeMachine: [
    'La machine dessinée est un Solahart 302J tel que sa fiche d’août 2023 le décrit : deux capteurs, 300 L, un circuit fermé. Ce choix tient aux documents disponibles, pas à une préférence : c’est le seul thermosiphon pour lequel nous avons pu lire ensemble une fiche cotée, un manuel complet, deux certificats indépendants et des résultats annuels sur quatre sites européens. Aucun logo dans la 3D, aucune recommandation d’achat.',
    'The machine drawn is a Solahart 302J as its August 2023 sheet describes it: two collectors, 300 L, a closed circuit. That choice follows the documents available, not a preference: it is the only thermosiphon for which we could read together a dimensioned sheet, a full manual, two independent certificates and annual results at four European sites. No logo in the 3D, no advice to buy.',
  ],
  noticeMarks: [
    'Les chiffres : sans marque, ils viennent d’une source ; † ils sont calculés, à partir de chiffres publiés ou par le modèle de ce lab ; * ce sont des estimations de ce lab, faute de source. Le débit, le diamètre des tubes et l’échange de la double enveloppe ne sont publiés par personne. Le seul modèle qui balaie la hauteur du ballon date de 1981 et demande lui-même à être validé, et personne n’a mesuré un capteur plan avec son ballon plus bas que lui. Un chiffre † n’est pas une mesure.',
    'The figures: with no mark, they come from a source; † they are computed, from published figures or by this lab’s model; * they are this lab’s estimates, for want of a source. Nobody publishes the flow, the tubes’ bore or the jacket’s exchange. The one model that sweeps the tank’s height dates from 1981 and asks for its own validation, and nobody has measured a flat collector with its tank below it. A † figure is not a measurement.',
  ],
  safety: [
    'Pression du réseau, eau à 95 °C, courant du réseau et travail sur un toit : cette machine a besoin d’un installateur formé et d’un électricien qualifié. Le manuel réserve le remplissage du circuit à des personnes formées. Ce lab explique, il ne donne pas de procédure.',
    'Mains pressure, water at 95 °C, mains current and work on a roof: this machine needs a trained installer and a qualified electrician. The manual keeps the filling of the circuit to trained people. This lab explains, it gives no procedure.',
  ],
  legal: [
    'Droit et règles : ce lab ne donne aucun avis juridique, et les règles de votre pays s’appliquent. En France, l’arrêté du 23 juin 1978, article 36, fixe 50 °C aux robinets des pièces de toilette et 60 °C ailleurs, avec des règles contre les légionelles au-delà de 3 L de conduite et dès 400 L de stockage : ce ballon de 300 L est sous ce second seuil. En Suisse, l’OFSP et la norme SIA 385/1:2020 demandent au moins 60 °C en sortie de ballon (55 °C sans boucle chauffée). Une machine sur un toit change l’aspect d’un bâtiment : déclaration préalable en France, et pour la Suisse nous n’avons pas vérifié. Ces deux derniers points, et les normes citées dans la documentation du constructeur, restent à lire pour votre cas.',
    'Law and rules: this lab gives no legal advice, and the rules of your country apply. France’s decree of 23 June 1978, article 36, sets 50 °C at washing taps and 60 °C elsewhere, with legionella rules above 3 L of pipe and from 400 L of storage: this 300 L tank is under the second threshold. In Switzerland, the federal office and SIA 385/1:2020 ask for at least 60 °C leaving the tank (55 °C with no heated loop). A roof unit changes a building’s look: a prior declaration in France, and for Switzerland we did not check. Those last points, and the standards cited in the maker’s documents, remain to be read for your own case.',
  ],
  sourceMain: ['La vidéo qui accompagne ce lab', 'The video that goes with this lab'],
  chapters: ['Son déroulé', 'Its outline'],
  sourcesNoCopy: [
    'Aucune image, séquence ni transcription de ces vidéos n’est reprise ici : le lab n’en retient que des faits, rédigés avec ses propres mots. Plusieurs documents n’ont pas pu être lus (un article de 1986 sur l’écoulement inverse, les normes payantes) : le lab le dit là où cela compte.',
    'No image, footage or transcript from these videos is reused here: the lab keeps only facts from them, in its own words. Several documents could not be read (a 1986 note on reverse flow, the paid standards): the lab says so where it matters.',
  ],
} as const satisfies Record<string, readonly [string, string]>;

registerStrings(LAB_STRINGS);

export type UiKey = keyof typeof LAB_STRINGS | CommonKey;

export { colon } from '@onigam/lab-kit/i18n';

export function t(key: UiKey): string {
  return tx(key);
}
