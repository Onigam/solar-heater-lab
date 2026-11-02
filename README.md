# Chauffe-eau solaire · Solar Water Heater

An interactive 3D lab of a **thermosiphon solar water heater**: two flat collectors on a roof, a 300 L tank just above them, and a fluid that climbs by itself, with no pump and no controller. It shows what pushes it, what the night takes back, and what reaches the shower. The machine drawn is a reconstruction of one real unit, read from its maker's public documents.

**▶ https://solar-heater-lab.vercel.app** · French and English · desktop, tablet and phone

It belongs to a series that started with [Pelton Lab](https://github.com/Onigam/pelton-lab), built on the same frame, [lab-kit](https://github.com/Onigam/lab-kit). The lab is being built: `public/lab.json` says `building` until the bar of the series is met and the owner has said yes.

## What is in it

- **Four 3D worlds**: the **house** (a stone village house sliced along the machine, its rafters, the mains from the street, the hot line down to the bathroom, the drain in the open, the meter box, an olive tree whose shadow must miss the collectors, the sun following the hour, the day and the place), the **machine** alone, whose tank moves up and down on a translucent test stand, **one collector** on its easel, its layers stepped open at a corner and its tubes in false colour, and the **tank and the way to the shower**, the tank cut along its axis, ten layers coloured live, then the valves in the order of the heat. Explode, X-ray, isolate, section, flows, labels.
- **A catalogue of 51 parts**, each with a sheet (what it does, how it is made and sized, how it fails and is looked after, why it is designed that way). **Two guides**, each step ending on its origin (the maker's manual, usual practice, or our reconstruction): how the machine is built and goes up on the roof (20 steps) and how it joins the house (10 steps).
- **Six lessons with twelve questions**, each opening on a scenario: why it climbs, the black plate under glass, the layers, the night, too cold and too hot, the shower.
- **A simulation** (a pure, unit-tested model): the sun and the night sky at four European sites, the collector's certified curve, a loop of 94 nodes with its buoyancy and friction, a closed circuit or a direct one, a tank of ten layers, the taps, the booster, and twelve scenarios.
- **Ten A3 design drawings** generated from the same dimensions as the 3D model and from the model's results.
- **A spoken guide** for the introduction, each world and each part, in both languages: not written yet.

## What is real and what is not

- **The year.** The model comes within about 13 % of the sixteen published annual figures, with no tuning: Athens +1 to +8 %, Würzburg −4 to +1 %, Stockholm −4 to +6 %, Davos −12 to −4 %. Those figures are a test plus a calculation on the maker's side, and a model on ours, so agreement proves little by itself. Nothing here is a measurement of the whole machine on a roof.
- **The night.** The one model that sweeps the tank's height dates from 1981, asks for its own validation, and has an upright tank. On this machine's horizontal tank, **our model finds the push is 65 Pa, 6.6 mm of water, and that on a clear night the loss starts to matter at about the level of the collector's top**: about 5 % of the day's gain at the machine's real place, against 15 % at −0.61 m, and lower still the day itself stops working. That rests on a formula for the night sky, without which those figures fall to about a quarter. **Nobody has measured a flat collector with its tank below it.**
- **Reading and estimates.** The maker's sheet gives the outline, the masses, the collector and the valves. It gives no bore, no flow, no jacket exchange, no vessel size: those are estimates, and the sheets, the drawings and the panel mark them. Where the overheat valve sits and how the circuit's reservoir is mounted are drawn from no source. The tank's test stand is a device of this lab: the real machine stays at zero. Every figure is tagged: no mark, from a source; † computed; \* estimated.
- **An independent educational reconstruction**, not an official drawing and not a product of the maker, with which it has no link; no logo, no advice to buy, and no footage from any source is reused. Mains pressure, water at 95 °C, mains current and work on a roof: this machine needs a trained installer and a qualified electrician. The lab explains, it gives no procedure, and the rules of your country apply.

## Run it

```bash
npm install
npm run dev
```

`npm run typecheck && npm run format:check && npm test && npm run build` is what CI runs; every push to `main` deploys to Vercel. `npm run kit:bump` moves to a newer lab-kit.

## Project layout

- `src/three/` the four worlds and `dims.ts`, the single source of dimensions; `src/sim/` the pure physics, with its thermal core; `src/data/` the parts, guides, lessons, sources and figures; `src/drawings/` the A3 sheets; `src/panels/` the simulation panel; `src/lab.ts` describes the lab to the kit.
- `docs/` research notes and sources, physics notes (what the model finds, figure by figure), the 3D, the setting and the water, data, drawings and lessons notes, requests to the kit; `BRIEF.md` is the brief the agent team works from.

Built with Three.js, TypeScript and Vite (MIT). Credits and links to every source are in the app, in _Sources_.

---

## Français

Un labo 3D interactif d’un **chauffe-eau solaire à thermosiphon** : deux capteurs plans sur un toit, un ballon de 300 L juste au-dessus, et un fluide qui monte tout seul, sans pompe et sans commande. Il montre ce qui le pousse, ce que la nuit reprend et ce qui arrive à la douche. La machine dessinée est la reconstitution d’un appareil réel, lu dans les documents publics de son constructeur.

**▶ https://solar-heater-lab.vercel.app** · français et anglais · ordinateur, tablette et téléphone

Il fait partie d’une série commencée avec [Pelton Lab](https://github.com/Onigam/pelton-lab), sur le même socle, [lab-kit](https://github.com/Onigam/lab-kit). Le labo est en construction : `public/lab.json` reste à `building` tant que le niveau de la série n’est pas atteint et que le propriétaire n’a pas dit oui.

**Ce qu’il contient.** Quatre mondes 3D (la maison tranchée le long de la machine, avec sa charpente, le réseau, la conduite jusqu’à la salle de bains, l’olivier et un soleil qui suit l’heure, le jour et le lieu ; la machine seule, dont le ballon monte et descend sur un banc d’essai translucide ; un capteur sur son chevalet, ouvert en marche à son coin, ses tubes en fausses couleurs ; le ballon coupé le long de son axe, dix couches colorées en direct, puis les vannes dans l’ordre de la chaleur) ; un catalogue de 51 pièces avec leur fiche ; deux guides, chaque étape finissant sur son origine (le manuel du constructeur, la pratique courante ou notre reconstitution) : comment la machine se construit et monte sur le toit (20 étapes), comment elle rejoint la maison (10 étapes) ; six leçons et douze questions, chacune ouverte sur un scénario ; une simulation pure et testée, quatre sites européens, douze scénarios ; dix planches A3 générées à partir des dimensions du modèle et de ses résultats. Un guide parlé pour l’introduction, chaque monde et chaque pièce, en deux langues : pas encore écrit.

**Ce qui est réel et ce qui ne l’est pas.** Le modèle tient à environ 13 % près les seize chiffres annuels publiés, sans aucun réglage : Athènes +1 à +8 %, Wurtzbourg −4 à +1 %, Stockholm −4 à +6 %, Davos −12 à −4 %. Ces chiffres sont un essai plus un calcul côté constructeur, un modèle de notre côté : cet accord prouve peu par lui-même, et rien ici n’est une mesure de la machine entière sur un toit. Le seul modèle qui balaie la hauteur du ballon date de 1981, demande lui-même à être validé et a un ballon debout. Sur le ballon couché de cette machine, **notre modèle trouve une poussée de 65 Pa, 6,6 mm d’eau, et une perte qui, par nuit claire, commence à compter vers le niveau du haut du capteur** : environ 5 % du gain du jour à la vraie place de la machine, 15 % à −0,61 m, et plus bas, c’est le jour lui-même qui s’arrête. Cela repose sur une formule du ciel nocturne, sans laquelle ces chiffres tombent à environ un quart. **Personne n’a mesuré un capteur plan avec son ballon plus bas que lui.** La fiche du constructeur donne l’encombrement, les masses, le capteur et les soupapes ; ni diamètre de tube, ni débit, ni échange de la double enveloppe, ni taille de cuve : ce sont des estimations, et les fiches, les planches et le panneau les marquent. La place de la vanne de surchauffe et le montage du vase du circuit ne viennent d’aucune source. Le banc d’essai est un dispositif de ce lab : la vraie machine reste à zéro. Chaque chiffre porte sa marque : sans marque, d’une source ; † calculé ; \* estimé.

**Reconstitution pédagogique indépendante**, ni plan officiel ni produit du constructeur, sans lien avec lui, sans logo, sans recommandation d’achat, sans aucune image reprise d’une source. Pression du réseau, eau à 95 °C, courant du réseau et travail sur un toit : cette machine demande un installateur formé et un électricien qualifié. Le lab explique, il ne donne pas de procédure, et les règles de votre pays s’appliquent.

`npm install` puis `npm run dev` pour lancer en local ; chaque push sur `main` déploie sur Vercel. Les crédits et les liens vers toutes les sources sont dans l’application, dans _Sources_.
