// The Sources panel: notices, safety and law said once, credits and links, the outline of the main video. The lead wires it with `about: sourcesPanel` in src/lab.ts (and `video: { id: VIDEO_ID }`, see chapters.ts). The maker is named here and nowhere else; no endorsement is implied.
// From docs/research.md §1 and §7. Left out on purpose: S3 (wrong subject, unstable figures), S5 (no figure, a page on bottles, advice we do not repeat), the seller's and forum's texts, which the research lists as not used. Page numbers and access notes stay in the research.
import { l, tr, type L } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS, type AppContext } from '@onigam/lab-kit/ui';
import { t } from '../i18n/ui';
import { CHAPTERS, VIDEO_ID } from './chapters';

export interface SourceLink {
  href: string;
  label: string | L;
  note: L;
}

export interface SourceGroup {
  title: L;
  links: SourceLink[];
}

export const MAIN_VIDEO: SourceLink = {
  href: `https://www.youtube.com/watch?v=${VIDEO_ID}`,
  label: 'Introduction to thermosiphon solar thermal systems',
  note: l(
    'SOLTRAIN, 26 novembre 2021 : un programme de formation d’Afrique australe, mené par l’autrichien AEE INTEC. Un récit court et juste, sans aucun chiffre. Aucune image n’en est reprise.',
    'SOLTRAIN, 26 November 2021: a training programme in southern Africa, run by Austria’s AEE INTEC. A short, accurate account, with no figure at all. No footage from it is reused.',
  ),
};

export const SOURCE_GROUPS: SourceGroup[] = [
  {
    title: l('La machine : constructeur et certificats', 'The machine: maker and certificates'),
    links: [
      {
        href: 'https://filesync.galvins.com.au/datasheets/FXHH0092.pdf',
        label: 'Solahart, J Series data sheet, August 2023',
        note: l(
          'Copie d’un distributeur, les liens du constructeur ne répondent plus. Les dimensions, les masses, le capteur, l’appoint, les réglages des soupapes.',
          'A distributor’s copy, the maker’s links no longer answer. The dimensions, masses, collector, booster and valve settings.',
        ),
      },
      {
        href: 'https://australianhotwater.com.au/wp-content/uploads/2016/11/Solahart-Thermosiphon-Owners-Guide.pdf',
        label: 'Solahart, Owner’s Manual, November 2013',
        note: l(
          'Le fonctionnement, la sécurité, l’ordre d’installation, le tableau de gel et les résultats annuels sur quatre sites européens, dont les rapports d’essai n’ont pas pu être lus.',
          'How it works, safety, the order of installation, the freezing table and the annual results at four European sites, whose test reports could not be read.',
        ),
      },
      {
        href: 'https://solar-rating.org/wp-content/uploads/certificates/2012020A.pdf',
        label: 'ICC-SRCC OG-100 No. 2012020A',
        note: l(
          'Certificat indépendant du capteur : sa courbe, son coefficient d’angle, sa production type.',
          'The collector’s independent certificate: its curve, its incidence modifier, its typical production.',
        ),
      },
      {
        href: 'https://solar-rating.org/wp-content/uploads/certificates/30004379.pdf',
        label: 'ICC-SRCC OG-300 No. 30004379',
        note: l(
          'Certificat indépendant du système, par simulation.',
          'The system’s independent certificate, by simulation.',
        ),
      },
      {
        href: 'https://solar-rating.org/wp-content/uploads/certificates/2011082a.pdf',
        label: 'ICC-SRCC OG-100 No. 2011082A',
        note: l(
          'Le capteur sélectif du même constructeur, pour comparer.',
          'The same maker’s selective collector, for comparison.',
        ),
      },
    ],
  },
  {
    title: l('Les autres machines, pour comparer', 'Other machines, for comparison'),
    links: [
      {
        href: 'https://www.buderus.com/it/media/country_pool/documents/011-7s1924_f.pdf',
        label: 'Solar Keymark 011-7S 1924F, Buderus CKN 2.0-s',
        note: l(
          'Un capteur sélectif, sa température de stagnation, et les quatre climats standard.',
          'A selective collector, its stagnation temperature, and the four standard climates.',
        ),
      },
      {
        href: 'https://armatec.com/4a5c66/globalassets/armatec-no/products/documents/3030-2801/ch250-solar-keymark.pdf',
        label: 'Solar Keymark 078/000216, De Dietrich CH 250',
        note: l('Un capteur sélectif de marque française.', 'A selective collector from a French brand.'),
      },
      {
        href: 'https://www.greenonetec.com/wp-content/uploads/2019/03/TSC_en_PDB_2019-02.pdf',
        label: 'GREENoneTEC, Thermosiphon CLASSIC',
        note: l('Un thermosiphon européen comparable.', 'A comparable European thermosiphon.'),
      },
      {
        href: 'https://solimpeks.com/uploads/docs/TSM-Thermosiphon-Systems-Manual.pdf',
        label: 'Solimpeks, TSM manual',
        note: l('Un autre thermosiphon, et ses dimensions.', 'Another thermosiphon, and its dimensions.'),
      },
      {
        href: 'https://www.hedestoker.dk/files/SUNCATCHER-assemply-%20instructions.pdf',
        label: 'Eurostar, thermosiphon closed circuit, manual',
        note: l('Un circuit fermé de la même taille.', 'A closed circuit of the same size.'),
      },
      {
        href: 'https://www.hellopro.fr//documentation/pdf_prod/2/0/7/2830867_c5e1db6784a5ef78d239037b5896e305_9084702.pdf',
        label: 'eaSy, chauffe-eau solaire thermosiphon, fiche',
        note: l('Une fiche du marché français.', 'A sheet from the French market.'),
      },
    ],
  },
  {
    title: l('La science : la nuit, le débit, les essais', 'The science: the night, the flow, the tests'),
    links: [
      {
        href: 'https://digital.library.unt.edu/ark:/67531/metadc829193/m2/1/high_res_d/1068188.pdf',
        label: 'Mertol, Place, Webster, Greif, 1981',
        note: l(
          'Lawrence Berkeley Lab : le modèle qui balaie la hauteur du ballon, et demande lui-même une validation. Chiffres lus à l’œil sur ses figures.',
          'Lawrence Berkeley Lab: the model that sweeps the tank’s height, and itself asks for validation. Figures read by eye from its plots.',
        ),
      },
      {
        href: 'https://proceedings.ises.org/conference/eurosun2010/papers/eurosun2010-0312-Michaelides.pdf',
        label: 'Michaelides et al., EuroSun 2010',
        note: l(
          'Trois vraies machines mesurées à Chypre, la nuit : la meilleure mesure lue.',
          'Three real machines measured at night in Cyprus: the best measurement read.',
        ),
      },
      {
        href: 'https://proceedings.ises.org/conference/eurosun2020/papers/eurosun2020-0065-Schiebler.pdf',
        label: 'Schiebler et al., ISFH, EuroSun 2020',
        note: l(
          'Un thermosiphon en double enveloppe mesuré en laboratoire, jusqu’à la stagnation.',
          'A double-jacket thermosiphon measured in a laboratory, up to stagnation.',
        ),
      },
      {
        href: 'https://proceedings.ises.org/conference/swc2011/papers/swc2011-0295-Brandmayr.pdf',
        label: 'Brandmayr, Zörner, Hanby, ISES 2011',
        note: l(
          'Une référence mesurée et simulée, et le classement de ce qui compte.',
          'A reference measured and simulated, and a ranking of what counts.',
        ),
      },
      {
        href: 'https://cris.bgu.ac.il/en/publications/experimental-and-modeling-studies-on-thermosiphon-domestic-solar-/',
        label: 'Tang, Cheng, Wu, Li, Yu, 2010',
        note: l(
          'Deux bancs par nuits claires : la sortie reste sous l’air. Résumé seulement.',
          'Two rigs on clear nights: the outlet stays below the air. Abstract only.',
        ),
      },
      {
        href: 'https://cris.bgu.ac.il/en/publications/on-the-anti-freezing-of-flat-plate-collectors-in-sdhws-under-clim/',
        label: 'Tang et al., ISES 2007',
        note: l(
          'L’écoulement inverse étudié comme protection contre le gel. Résumé seulement.',
          'Reverse flow studied as frost protection. Abstract only.',
        ),
      },
      {
        href: 'https://academic.oup.com/ijlct/article/10/4/430/2363566',
        label: 'Ong, Osmond, Tong, 2015',
        note: l('Un essai au colorant sur un autre type de capteur.', 'A dye test on another kind of collector.'),
      },
      {
        href: 'https://pure.ulster.ac.uk/en/publications/diurnal-reverse-fluid-flow-in-thermosyphon-evacuated-tube-solar-w-3/',
        label: 'Redpath, Lo, Eames, 2007',
        note: l(
          'Un écoulement inverse de jour, sur des tubes sous vide. Résumé seulement.',
          'Reverse flow by day, on evacuated tubes. Abstract only.',
        ),
      },
      {
        href: 'https://scholars.lib.ntu.edu.tw/bitstreams/b2b22cf5-8ca8-48d6-8c03-c88f20555969/download',
        label: 'Du, Huang, Yen',
        note: l(
          'Deux sortes d’écoulement inverse, dont une instabilité.',
          'Two kinds of reverse flow, one of them an instability.',
        ),
      },
      {
        href: 'https://hdl.handle.net/20.500.14279/18238',
        label: 'Kalogirou, Agathokleous, 2013',
        note: l(
          'Le système chypriote type, et la hauteur qui optimise une année, sans parler de la nuit.',
          'The typical Cypriot system, and the height that optimises a year, with no word of the night.',
        ),
      },
      {
        href: 'https://sel.me.wisc.edu/trnsys/validation/abstracts/solarenergy/28.htm',
        label: 'Morrison, Rosengarten, Behnia, 2000',
        note: l(
          'Une corrélation pour cette double enveloppe, dont les coefficients n’ont pas pu être lus.',
          'A correlation for this very jacket, whose coefficients could not be read.',
        ),
      },
      {
        href: 'https://ideas.repec.org/a/eee/appene/v14y1983i3p211-225.html',
        label: 'Norton, Probert, 1983',
        note: l(
          'L’écoulement inverse vu comme une fuite de chaleur. Résumé seulement.',
          'Reverse flow seen as a heat leak. Abstract only.',
        ),
      },
      {
        href: 'https://patents.google.com/patent/US7398779',
        label: 'US 7,398,779, Bowen, 2008',
        note: l(
          'Un brevet qui rapporte la croyance des « 18 pouces au moins », et monte le ballon à côté.',
          'A patent reporting the belief of “at least 18 inches”, and mounting the tank alongside.',
        ),
      },
      {
        href: 'https://solarthermalworld.org/news/southern-africa-soltrains-demonstration-systems-achieve-800-kwhm2a/',
        label: 'SOLTRAIN, measured yields, 2013',
        note: l(
          'Le rendement annuel mesuré d’une machine comparable.',
          'The measured annual yield of a comparable machine.',
        ),
      },
    ],
  },
  {
    title: l('Le marché, l’usage, le climat', 'The market, the use, the climate'),
    links: [
      {
        href: 'https://iea-shc.org/Data/Sites/1/publications/Solar-Heat-Worldwide-2025.pdf',
        label: 'Solar Heat Worldwide 2025',
        note: l(
          'AEE INTEC pour l’IEA SHC : environ 53 % des systèmes sont des thermosiphons.',
          'AEE INTEC for IEA SHC: about 53% of systems are thermosiphons.',
        ),
      },
      {
        href: 'https://iea-shc.org/article?NewsID=575',
        label: 'Mapping the global thermosiphon market, IEA SHC, 2025',
        note: l('Les types de systèmes et leurs prix par région.', 'Kinds of system and their prices by region.'),
      },
      {
        href: 'https://tas29.iea-shc.org/Data/Sites/1/media/events/webinars/2020-06-24/drosou-solar-academy-webinar-2020-06-24.pdf',
        label: 'Drosou, CRES, 2020',
        note: l('Le thermosiphon en Grèce.', 'Thermosiphons in Greece.'),
      },
      {
        href: 'https://www.avant-pays-savoyard.com/smaps/wp-content/uploads/2022/01/guide-pratique-chauffage-et-eau-chaude-solaires.pdf',
        label: 'ADEME, Le chauffage et l’eau chaude solaires, 2019',
        note: l(
          'Le point de vue français officiel : monobloc « réservé aux climats chauds ».',
          'The official French view: compact units “kept to warm climates”.',
        ),
      },
      {
        href: 'https://www.ffbatiment.fr/actualites-batiment/actualite/le-guide-technique-sur-les-besoins-d-eau-chaude-sanitaire-en-habitat-individuel-et-collectif',
        label: 'FFB, sur le guide ADEME et COSTIC, 2017',
        note: l('Les besoins d’eau chaude, par personne et par jour.', 'Hot water needs, per person per day.'),
      },
      {
        href: 'https://re.jrc.ec.europa.eu/pvg_tools/en/',
        label: 'PVGIS 5.3, European Commission JRC',
        note: l(
          'Les données mensuelles de soleil et d’air des quatre sites, SARAH3 et ERA5. © Union européenne.',
          'Monthly sun and air data for the four sites, SARAH3 and ERA5. © European Union.',
        ),
      },
      {
        href: 'https://engineeringtoolbox.com/propylene-glycol-d_363.html',
        label: 'Engineering ToolBox, propylene glycol',
        note: l('Densité et chaleur massique du mélange.', 'Density and specific heat of the mix.'),
      },
      {
        href: 'https://www.nist.gov/mml/acmd/fluids_modeling/upload/832373.pdf',
        label: 'NIST, water properties',
        note: l('La densité de l’eau selon Kell, 1975.', 'The density of water after Kell, 1975.'),
      },
    ],
  },
  {
    title: l('Sécurité et réglementation', 'Safety and rules'),
    links: [
      {
        href: 'https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006828036',
        label: 'Arrêté du 23 juin 1978, article 36',
        note: l('France : températures aux robinets, légionelles.', 'France: temperatures at taps, legionella.'),
      },
      {
        href: 'https://www.bag.admin.ch/fr/legionellose-maladie-du-legionnaire',
        label: 'OFSP, légionellose',
        note: l(
          'Suisse : où les légionelles se multiplient, et ce qui est demandé.',
          'Switzerland: where legionella grow, and what is asked.',
        ),
      },
      {
        href: 'https://suissetec.ch/files/PDFs/Ueber_uns/Franz/Wassertemperatur%20Trinkwasserinstallationen_Information_FR.pdf',
        label: 'suissetec, 2020',
        note: l(
          'La température minimale d’eau chaude en Suisse, côte à côte.',
          'Switzerland’s minimum hot water temperatures, side by side.',
        ),
      },
      {
        href: 'https://www.hotwater.com/info-center/technical-bulletins/bulletin-34.html',
        label: 'A. O. Smith, Technical Bulletin 34',
        note: l('Le temps avant une brûlure, selon la température.', 'The time to a scald, by temperature.'),
      },
      {
        href: 'https://www.inspq.qc.ca/securite-prevention-de-la-violence-et-des-traumatismes/prevention-des-traumatismes-non-intentionnels/dossiers/brulures-causees-par-l-eau-chaude-domestique',
        label: 'INSPQ, Québec',
        note: l(
          'Les brûlures par l’eau chaude domestique, l’adulte et l’enfant.',
          'Burns from domestic hot water, adults and children.',
        ),
      },
    ],
  },
  {
    title: l('D’autres vidéos et d’autres lectures', 'Other videos and other reading'),
    links: [
      {
        href: 'https://www.youtube.com/watch?v=8wnksG2Xe9Y',
        label: 'Trade Secrets, Solar Hot Water Systems',
        note: l(
          '2018, un film de métier australien sur le même type de machine.',
          '2018, an Australian trade film on the same kind of machine.',
        ),
      },
      {
        href: 'https://www.youtube.com/watch?v=89TbH98KaJo',
        label: 'Low-tech Lab, How to build homemade solar water heater',
        note: l(
          '13 avril 2018, avec les panneaux d’Éric Lafond : un capteur en grilles de frigo, mais une boucle à circulateur, sans thermosiphon.',
          '13 April 2018, with Éric Lafond’s panels: a collector of fridge grids, but a pumped loop, with no thermosiphon.',
        ),
      },
      {
        href: 'https://wiki.lowtechlab.org/wiki/Chauffe_eau_solaire/en',
        label: 'Low-tech Lab, Solar water heater tutorial',
        note: l(
          'Le tutoriel écrit du même panneau, licence CC BY-SA.',
          'The written tutorial for the same panel, under CC BY-SA.',
        ),
      },
      {
        href: 'https://apper-solaire.org/Pages/Experiences/Bidalot%20Yvan%2038/chauffe%20eau%20et%20chauffage%20hors%20gel%20solaire%20en%20thermosiphon%20en%20alpage/index.pdf',
        label: 'Y. Bidalot, APPER',
        note: l(
          'Un vrai thermosiphon fait maison à 1 900 m : une expérience, pas une mesure.',
          'A real home-built thermosiphon at 1,900 m: a story, not a measurement.',
        ),
      },
      {
        href: 'https://pelton-lab.vercel.app',
        label: 'Pelton Lab',
        note: l(
          'Le premier lab de la série, sur une micro-centrale hydraulique.',
          'The first lab of the series, on a micro-hydro plant.',
        ),
      },
    ],
  },
];

/** The Sources panel, for `about` in src/lab.ts. */
export function sourcesPanel(ctx: AppContext): HTMLElement[] {
  const link = (s: SourceLink): HTMLElement =>
    h(
      'li',
      {},
      h(
        'a',
        { href: s.href, target: '_blank', rel: 'noopener noreferrer' },
        typeof s.label === 'string' ? s.label : tr(s.label),
      ),
      ' — ',
      tr(s.note),
    );
  const warn = (key: 'safety' | 'legal'): HTMLElement =>
    h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, t(key)));
  const tip = (key: 'disclaimer' | 'noticeMachine' | 'noticeMarks'): HTMLElement =>
    h('div', { class: 'callout callout--tip' }, h('span', {}, t(key)));
  return [
    tip('disclaimer'),
    tip('noticeMachine'),
    tip('noticeMarks'),
    warn('safety'),
    warn('legal'),
    h('h3', { class: 'section-title' }, t('sourceMain')),
    h('ul', { class: 'links' }, link(MAIN_VIDEO)),
    h('h3', { class: 'section-title' }, t('chapters')),
    h(
      'ul',
      { class: 'chapters' },
      ...CHAPTERS.map(([ts, fr, en]) =>
        h(
          'li',
          {},
          h('a', { href: ctx.videoUrl(ts), target: '_blank', rel: 'noopener noreferrer' }, ts),
          ' ',
          tr({ fr, en }),
        ),
      ),
    ),
    ...SOURCE_GROUPS.flatMap((g) => [
      h('h3', { class: 'section-title' }, tr(g.title)),
      h('ul', { class: 'links' }, ...g.links.map(link)),
    ]),
    h('p', { class: 'hint' }, t('sourcesNoCopy')),
    h('p', { class: 'hint' }, 'Three.js · TypeScript · Vite — MIT'),
  ];
}
