# Regole operative per creazione personaggio D&D 2024

Seconda passata dopo confronto tra manuale PDF, JSON generati e codice corrente.

Questo file e' la bussola tecnica per finire l'app: non deve duplicare il manuale, ma trasformare le regole in dati e funzioni generiche. Quando una regola e' gia' nei JSON, il codice deve leggerla. Quando non c'e', va aggiunta al catalogo prima di creare un'eccezione nel componente.

## Fonti controllate

- Manuale locale: `C:\xampp\htdocs\Dd\D&D_5e24_Player's_Handbook_Manuale_del_Giocatore_CHQ_05_2025.pdf`
- Capitolo 2: creazione, avanzamento, livelli superiori, multiclasse.
- Capitolo 3: classi e sottoclassi.
- Capitolo 4: background e specie.
- Capitolo 5: talenti.
- Capitolo 6: equipaggiamento.
- Capitolo 7: incantesimi.
- JSON progetto:
  - `generated/catalogo_powers_tutte_classi_dnd2024_it.json`
  - `generated/dnd2024_spells_it.json`
  - `generated/dnd5e2024_rules_catalogs_it/rules/feats/feats.json`
  - `generated/dnd5e2024_rules_catalogs_it/rules/equipment/*.json`
- Codice corrente:
  - `src/services/characterCreationService.js`
  - `src/services/progressionService.js`
  - `src/services/featChoiceService.js`
  - `src/services/featsCatalog.js`

## Stato dei dati JSON

I cataloghi non sono vuoti: vanno usati come sorgente primaria dove possibile.

| Catalogo | Stato |
| --- | --- |
| Poteri classi/sottoclassi | 460 poteri dopo correzione Succhiavita; prima erano 459 |
| Incantesimi | 380 incantesimi, con classi e livelli |
| Talenti | 75 talenti |
| Armi | 38 |
| Armature | 12 |
| Scudi | 1 |
| Strumenti | 25 |
| Equipaggiamento avventura | 82 |
| Cavalcature/veicoli/servizi | 34 complessivi |

Correzione fatta in questa passata:

- aggiunta `warlock_succhiavita` in `generated/catalogo_powers_tutte_classi_dnd2024_it.json`, perche' il codice la filtrava come supplica valida ma il catalogo non la conteneva.

Limiti attuali dei JSON:

- i poteri sono presenti, ma molte descrizioni sono ancora sintetiche;
- le sottoclassi con incantesimi sempre preparati sono individuabili dai poteri, ma gli incantesimi concessi non sono tutti strutturati in dati;
- i talenti hanno quasi sempre `choices`, ma pochissimi `effects` realmente applicabili;
- l'equipaggiamento contiene oggetti, ma non pacchetti di partenza completi per classe/background;
- non esiste ancora un JSON unico per le tabelle classe 1-20 con scelta/risorsa/slot/sottoclasse;
- non esiste ancora un JSON per competenze da multiclasse.

## Regola architetturale

Il rules engine deve essere stratificato.

1. Regole base: livello, bonus competenza, caratteristiche, PF, Dadi Vita, CA, attacchi, CD incantesimi.
2. Origini: background, specie, lingue, talenti di origine, equipaggiamento iniziale.
3. Classe: privilegi, scelte, slot, risorse, sottoclasse.
4. Sottoclasse: privilegi, incantesimi concessi, risorse, scelte speciali.
5. Talento: prerequisiti, scelte, effetti.
6. Equipaggiamento: inventario, equip, CA, armi, strumenti.
7. Multiclasse: prerequisiti, competenze ridotte, slot combinati, PF/Dadi Vita.
8. UI: mostra le `ChoiceRequirement` prodotte dal motore, senza conoscere le eccezioni del manuale.

Contratto consigliato:

```js
{
  id,
  sourceType,
  sourceId,
  level,
  type,
  label,
  count,
  optionSource,
  options,
  selected,
  validation,
  apply
}
```

Ogni scelta deve poter funzionare sia in creazione diretta a livello alto sia in level-up da scheda esistente.

## Creazione personaggio

Il manuale struttura la creazione cosi':

1. scegliere classe;
2. determinare origini: background, specie, lingue;
3. determinare punteggi caratteristica;
4. scegliere allineamento;
5. inserire dettagli finali e numeri derivati.

Nell'app il flusso puo' restare piu' ergonomico, ma il motore deve rispettare questa dipendenza:

```text
classe -> origini -> caratteristiche -> scelte classe/specie/talento -> derivati -> equipaggiamento -> snapshot
```

### Creazione a livello scelto

Se il giocatore crea un PG a livello 2-20, l'app non deve creare direttamente "un livello N". Deve creare un livello 1 valido e poi applicare una sequenza di level-up fino al livello richiesto.

Questo serve per:

- non perdere scelte di livello 2, 3, 4, ecc.;
- salvare report e snapshot di ogni livello;
- permettere di estrarre il PG da un livello precedente;
- rendere possibile un percorso multiclass futuro.

Modello:

```text
createLevel1Draft()
for level in 2..targetLevel:
  buildLevelUpDraft(previousCharacter)
  validate choices
  applyLevelUpDraft()
  createProgressionSnapshot()
```

## Background

Il background concede:

- 3 caratteristiche disponibili per gli incrementi;
- un talento di origine;
- 2 competenze in abilita';
- una competenza in strumenti;
- equipaggiamento A oppure 50 mo;
- spunto narrativo.

Regola incrementi:

- scegliere `+2/+1` su due caratteristiche del background oppure `+1/+1/+1` su tutte e tre;
- nessun valore puo' superare 20;
- la UI deve impedire combinazioni non valide.

Stato codice:

- `BACKGROUND_OPTIONS` contiene i 16 background del manuale;
- abilita', talento e strumenti sono presenti;
- manca ancora il pacchetto equipaggiamento A completo;
- l'opzione B da 50 mo e' parziale nella UI, ma va salvata come scelta strutturata.

Da implementare:

- spostare i background in JSON;
- aggiungere `startingEquipment` con opzione A/B;
- se uno strumento del background e' scelto, il pacchetto A deve usare quello stesso strumento.

## Specie

Il manuale include 10 specie: Aasimar, Dragonide, Elfo, Gnomo, Goliath, Halfling, Nano, Orco, Tiefling, Umano.

Regola generica:

- ogni specie produce tratti, taglia, velocita' e possibili scelte;
- se una specie concede magia, ogni incantesimo deve avere livello di sblocco, sorgente, caratteristica da incantatore e uso;
- alcune scelte producono resistenze, azioni o risorse scalate col bonus competenza.

Stato codice:

- `SPECIES_OPTIONS` contiene tutte le specie;
- `SPECIES_CHOICE_RULES` copre scelte rilevanti:
  - Aasimar: rivelazione dal livello 3;
  - Dragonide: discendenza draconica;
  - Elfo: lignaggio;
  - Gnomo: lignaggio;
  - Goliath: discendenza gigante;
  - Tiefling: retaggio immondo;
- mancano ancora controlli completi per risorse, usi, scaling e dettagli delle azioni.

Da implementare:

- spostare specie e scelte in JSON;
- aggiungere effetti applicabili: resistenze, velocita', azioni, risorse;
- salvare le magie di specie come `speciesSpell`, con `unlockLevel`;
- applicare automaticamente gli sblocchi di specie quando il livello totale arriva a 3 o 5.

## Caratteristiche e derivati

Metodi da supportare:

- serie standard: 15, 14, 13, 12, 10, 8;
- costo in punti: 27 punti;
- generazione casuale: 4d6 tenendo i tre migliori;
- manuale/libero, se il DM lo consente.

Derivati obbligatori:

- modificatore caratteristica;
- tiri salvezza;
- abilita';
- percezione passiva;
- iniziativa;
- CA;
- PF;
- Dadi Vita;
- bonus attacco armi;
- danno armi;
- CD incantesimo;
- bonus attacco incantesimo.

Regola PF livello 1:

- massimo del Dado Vita + modificatore COS.

Regola PF level-up:

- tirare il Dado Vita oppure usare valore fisso;
- aggiungere modificatore COS;
- minimo +1 PF per livello;
- se COS aumenta, i PF massimi aumentano retroattivamente di 1 per ogni livello per ogni punto di modificatore guadagnato.

Stato implementazione:

- il level-up applica l'aumento retroattivo dei PF quando l'ASI aumenta il modificatore di COS;
- resta da estendere lo stesso controllo agli aumenti di COS prodotti da talenti o altri effetti applicati dopo la scelta.

Valori fissi:

| Classe | PF per livello dopo il primo |
| --- | --- |
| Barbaro | 7 + COS |
| Guerriero, Paladino, Ranger | 6 + COS |
| Bardo, Chierico, Druido, Monaco, Ladro, Warlock | 5 + COS |
| Mago, Stregone | 4 + COS |

## Avanzamento di livello

Sequenza corretta:

1. scegliere classe in cui avanzare;
2. se nuova classe, applicare regole multiclasse;
3. aggiornare livello totale e livello di classe;
4. aggiungere PF e Dado Vita;
5. applicare privilegi del nuovo livello;
6. aprire scelte dei privilegi;
7. aggiornare bonus competenza se cambia;
8. aggiornare modificatori derivati se cambiano caratteristiche;
9. aggiornare incantesimi, slot e risorse;
10. salvare snapshot.

Bonus competenza:

| Livello totale | Bonus |
| --- | --- |
| 1-4 | +2 |
| 5-8 | +3 |
| 9-12 | +4 |
| 13-16 | +5 |
| 17-20 | +6 |

## ASI, talenti e doni epici

Livelli ASI generici:

- 4, 8, 12, 16.

Livello 19:

- Dono epico, non un ASI generico normale.

Eccezioni:

- Guerriero: ASI anche a 6 e 14.
- Ladro: ASI anche a 10.

Nel codice esiste:

- `GENERIC_ASI_LEVELS = [4, 8, 12, 16, 19]`
- `ASI_LEVELS_BY_CLASS` per Guerriero e Ladro.

Correzione concettuale:

- il livello 19 va gestito come scelta Dono epico;
- se l'app vuole lasciare anche ASI come talento generale al 19, deve essere una scelta valida solo se il manuale/tavolo lo consente;
- per coerenza manuale, il motore deve distinguere `featChoiceCategory: ['Dono epico']` da `['Generale']`.

## Classi: mappa dei privilegi dal JSON poteri

Questa e' la mappa attuale estratta da `catalogo_powers_tutte_classi_dnd2024_it.json`. Il codice non deve ricopiarla a mano in `CLASS_RULES`: dovrebbe leggerla dal catalogo e aggiungere solo le scelte mancanti.

| Classe | Privilegi di classe presenti nel JSON |
| --- | --- |
| Barbaro | L1 Difesa senza Armatura, Ira, Padronanza d'armi; L2 Attacco Irruento, Percezione del Pericolo; L3 Conoscenza Primordiale, Sottoclasse; L4 ASI; L5 Attacco Extra, Movimento Veloce; L7 Balzo Istintivo, Istinto Ferino; L9 Colpo Brutale; L11 Ira Implacabile; L13 Colpo Brutale Migliorato; L15 Ira Persistente; L18 Potenza Indomabile; L19 Dono Epico; L20 Campione Primordiale |
| Bardo | L1 Incantesimi, Ispirazione Bardica; L2 Factotum, Maestria; L3 Sottoclasse; L4 ASI; L5 Fonte di Ispirazione; L7 Controfascino; L10 Segreti Magici; L18 Ispirazione Superiore; L19 Dono Epico; L20 Parole della Creazione |
| Chierico | L1 Incantesimi, Ordine Divino; L2 Incanalare Divinita, Scacciare Non Morti; L3 Sottoclasse; L4 ASI; L5 Bruciare i Non Morti; L7 Colpi Benedetti; L10 Intervento Divino; L14 Colpi Benedetti Migliorati; L19 Dono Epico; L20 Intervento Divino Superiore |
| Druido | L1 Incantesimi, Druidico, Ordine Primordiale; L2 Compagno Selvatico, Forma Selvatica; L3 Sottoclasse; L4 ASI; L5 Rinascita Selvatica; L7 Furia Elementale; L15 Furia Elementale Migliorata; L18 Incantesimi Bestiali; L19 Dono Epico; L20 Arcidruido |
| Guerriero | L1 Stile di Combattimento, Recuperare Energie, Padronanza d'armi; L2 Impeto d'Azione, Mente Tattica; L3 Sottoclasse; L4 ASI; L5 Attacco Extra, Scatto Tattico; L9 Indomabile; L13 Attacchi Studiati; L19 Dono Epico |
| Ladro | L1 Attacco Furtivo, Gergo Ladresco, Maestria, Padronanza d'armi; L2 Azione Scaltra; L3 Sottoclasse; L5 Colpo Scaltro, Schivata Prodigiosa; L7 Elusione, Talento Affidabile; L11 Colpo Scaltro Migliorato; L15 Mente Sfuggente; L18 Elusivo; L19 Dono Epico; L20 Colpo di Fortuna |
| Mago | L1 Incantesimi, Adepto dei Rituali, Recupero Arcano; L2 Studioso; L3 Sottoclasse; L4 ASI; L5 Memorizzare Incantesimo; L9 Modificare Incantesimo; L13 Creare Incantesimo; L18 Padronanza degli Incantesimi; L19 Dono Epico; L20 Incantesimi Personali |
| Monaco | L1 Arti Marziali, Colpo Senz'Armi Bonus, Difesa Senza Armatura; L2 Concentrazione da Monaco, Difesa Paziente, Passo del Vento, Raffica di Colpi, Metabolismo Straordinario, Movimento Senza Armatura; L3 Deviare Attacchi, Sottoclasse; L4 ASI, Caduta Lenta; L5 Attacco Extra, Colpo Stordente; L6 Colpi Potenziati; L7 Elusione; L9 Movimento Acrobatico; L10 Autorigenerazione, Concentrazione Superiore; L13 Deviare Energia; L14 Esperto di Sopravvivenza Disciplinato; L15 Concentrazione Perfetta; L18 Difesa Superiore; L19 Dono Epico; L20 Corpo e Mente |
| Paladino | L1 Imposizione delle Mani, Incantesimi, Padronanza d'armi; L2 Stile di Combattimento, Punizione Divina; L3 Incanalare Divinita, Sottoclasse; L4 ASI; L5 Attacco Extra; L6 Aura di Protezione; L11 Punizione Radiosa; L14 Tocco Purificante; L19 Dono Epico |
| Ranger | L1 Incantesimi, Nemico Prescelto, Padronanza d'armi; L2 Esploratore Esperto, Stile di Combattimento; L3 Sottoclasse; L4 ASI; L5 Attacco Extra; L6 Girovago; L9 Maestria; L10 Instancabile; L13 Cacciatore Implacabile; L14 Velo della Natura; L17 Precisione del Cacciatore; L18 Sensi Ferini; L19 Dono Epico; L20 Sterminatore di Nemici |
| Stregone | L1 Incantesimi, Stregoneria Innata; L2 Fonte di Magia, Metamagia; L3 Sottoclasse; L4 ASI; L5 Ripristino Stregonesco; L7 Stregoneria Incarnata; L19 Dono Epico; L20 Apoteosi Arcana |
| Warlock | L1 Magia del Patto, Suppliche Occulte; L2 Scaltrezza Magica; L3 Sottoclasse; L4 ASI; L9 Contatta Patrono; L11 Arcanum Mistico; L19 Dono Epico; L20 Maestro dell'Occulto |

Nota: il Guerriero nel manuale ha progressioni di Attacco Extra anche a livelli alti; il catalogo attuale sintetizza alcune voci e va verificato contro tabella classe prima di chiudere la copertura 1-20.

## Sottoclassi

Pattern livelli sottoclasse dal JSON:

| Classe | Livelli sottoclasse |
| --- | --- |
| Barbaro | 3, 6, 10, 14 |
| Bardo | 3, 6, 14 |
| Chierico | 3, 6, 17 |
| Druido | 3, 6, 10, 14 |
| Guerriero | 3, 7, 10, 15, 18 |
| Ladro | 3, 9, 13, 17 |
| Mago | 3, 6, 10, 14 |
| Monaco | 3, 6, 11, 17 |
| Paladino | 3, 7, 15, 20 |
| Ranger | 3, 7, 11, 15 |
| Stregone | 3, 6, 14, 18 |
| Warlock | 3, 6, 10, 14 |

Regola:

- il livello di scelta sottoclasse e' 3 per tutte le classi del manuale 2024 base;
- i livelli successivi non sono uguali per tutti;
- il motore deve leggere i livelli dal catalogo sottoclasse, non da un array fisso unico.

Da implementare:

- applicare privilegi sottoclasse a ogni livello del pattern;
- non solo al livello 3;
- strutturare gli incantesimi sempre preparati di sottoclasse.

Audit livello 6:

- privilegi di classe al livello 6:
  - Monaco: Colpi Potenziati;
  - Paladino: Aura di Protezione;
  - Ranger: Girovago;
- hanno privilegio di sottoclasse al livello 6: Barbaro, Bardo, Chierico, Druido, Mago, Monaco, Stregone, Warlock;
- non hanno privilegio di sottoclasse al livello 6: Guerriero, Ladro, Paladino, Ranger;
- il codice deve quindi aggiungere privilegi di sottoclasse al level-up 5 -> 6 solo per le classi che hanno poteri `source_type: subclass` e `level: 6` nel catalogo.

Stato implementazione:

- `getSubclassFeatureChanges()` legge dal catalogo i poteri di sottoclasse del livello raggiunto;
- il level-up aggiunge quei poteri in anteprima se la classe del personaggio ha gia' una sottoclasse;
- `applyFeatureChanges()` e `applyPowerChanges()` li salvano rispettivamente in `features` e `powers`;
- il tipo del potere (`active`, `passive`, `reaction`, ecc.) viene preservato nella feature salvata.
- Girovago del Ranger applica anche l'aumento automatico di velocita' e registra scalare/nuotare tra i movimenti.

Audit livello 7:

- privilegi di classe al livello 7:
  - Barbaro: Balzo Istintivo, Istinto Ferino;
  - Bardo: Controfascino;
  - Chierico: Colpi Benedetti, scelta fra Colpo Divino e Incantesimi Potenti;
  - Druido: Furia Elementale, scelta fra Colpo Primordiale e Incantesimi Potenti;
  - Ladro: Elusione, Talento Affidabile;
  - Monaco: Elusione;
  - Stregone: Stregoneria Incarnata;
  - Mago, Warlock: nessun privilegio di classe nuovo dal catalogo, ma il Warlock aumenta le Suppliche Occulte note secondo tabella.
- privilegi di sottoclasse al livello 7:
  - Guerriero: Campione ottiene Stile Aggiuntivo; Cavaliere Mistico ottiene Magia da Guerra; Guerriero Psionico ottiene Balzo Telecinetico; Maestro di Battaglia ottiene Conosci il tuo Nemico;
  - Paladino: Antichi Aura di Interdizione; Devozione Aura di Devozione; Gloria Aura di Alacrita; Vendetta Vendetta Implacabile;
  - Ranger: Cacciatore ottiene Tattiche Difensive; Cacciatore delle Tenebre ottiene Mente di Ferro; Signore delle Bestie ottiene Addestramento Eccezionale; Viandante Fatato ottiene Scambio Seducente.

Stato implementazione livello 7:

- Chierico e Druido hanno scelte esplicite in `CLASS_RULES.levelChoices[7]`, quindi Colpi Benedetti e Furia Elementale non diventano semplici acknowledgment;
- `SUBCLASS_LEVEL_CHOICES` gestisce le scelte di sottoclasse non marcate come `choice` nel catalogo:
  - Guerriero Campione L7: scelta di uno Stile di Combattimento aggiuntivo dalla lista filtrata degli stili;
  - Ranger Cacciatore L7: scelta fra Difesa dal multiattacco e Sfuggire all'orda.
- i poteri di sottoclasse rappresentati da una scelta esplicita vengono esclusi dalle feature automatiche per evitare doppioni;
- le scelte semplici applicate al level-up vengono salvate come feature di categoria `class_choice`, con riferimento al potere sorgente.

Da completare dopo il livello 7:

- modellare il cambio al riposo breve/lungo per le opzioni del Cacciatore, perche' il manuale permette di sostituire l'opzione scelta;
- trasformare in effetti strutturati alcune feature oggi solo descrittive, per esempio Aura di Alacrita, Mente di Ferro e altri bonus numerici/competenze;
- proseguire livello per livello con lo stesso schema: prima audit catalogo/manuale, poi scelta esplicita se il privilegio richiede decisione.

## Incantesimi

Il manuale contiene una tabella generale importante: il cambio degli incantesimi preparati cambia per classe.

| Classe | Quando modifica preparati | Quanti |
| --- | --- | --- |
| Bardo | quando acquisisce un livello | 1 |
| Chierico | dopo riposo lungo | qualsiasi |
| Druido | dopo riposo lungo | qualsiasi |
| Mago | dopo riposo lungo | qualsiasi, dal libro |
| Paladino | dopo riposo lungo | 1 |
| Ranger | dopo riposo lungo | 1 |
| Stregone | quando acquisisce un livello | 1 |
| Warlock | quando acquisisce un livello | 1 |

Regola di lancio:

- per lanciare un incantesimo, deve essere preparato o provenire da una fonte che lo concede;
- gli incantesimi sempre preparati non contano come scelta libera se il privilegio dice cosi';
- gli slot di livello superiore possono lanciare incantesimi di livello inferiore;
- gli slot non determinano automaticamente che il personaggio possa preparare incantesimi di quel livello se la sua classe non lo consente.

Stato codice:

- `SPELLCASTING_CHOICE_RULES` contiene cantrips/preparati fino al 20 per classi principali;
- `SPELL_REPLACEMENT_RULES` e' gia' vicino alla tabella manuale;
- lo Stregone Aberrante ha `SUBCLASS_GRANTED_SPELLS` parziale;
- la UI di scelta incantesimi e' stata migliorata a picker, ma va estesa ovunque appare ancora select/lista lunga.

Da implementare:

- separare `known`, `prepared`, `alwaysPrepared`, `spellbook`, `pactMagic`, `innate`;
- gestire libro del Mago: 6 incantesimi iniziali, +2 a ogni livello da Mago;
- gestire Arcanum Mistico del Warlock;
- gestire incantesimi di sottoclasse per Chierico, Druido, Paladino, Ranger, Stregone e Warlock;
- creare UI per cambio incantesimi al riposo lungo, separata dal level-up.

Sottoclassi con spellcasting proprio:

- Cavaliere Mistico: sottoclasse del Guerriero, lista da Mago, caratteristica INT, tabella `Incantesimi del Cavaliere Mistico`.
- Mistificatore Arcano: sottoclasse del Ladro, lista da Mago, caratteristica INT, tabella `Incantesimi del Mistificatore Arcano`, con Mano Magica fissa.
- Entrambe usano progressione da third caster: slot dal livello 3, preparati 3-13, slot di 4° livello a 19-20.

Stato implementazione:

- aggiunta tabella third caster per Cavaliere Mistico e Mistificatore Arcano;
- selezionando una di queste sottoclassi al livello 3 compaiono le scelte incantesimi figlie della sottoclasse;
- ai level-up successivi la stessa tabella aumenta cantrips/preparati/slot quando previsto;
- Mistificatore Arcano riceve automaticamente Mano Magica.

Audit altre sottoclassi con incantesimi:

- Bardo, Collegio della Sapienza: Scoperte Magiche.
- Chierico: Domini Inganno, Guerra, Luce, Vita.
- Druido: Circoli Mare, Luna, Terra.
- Paladino: Giuramenti Antichi, Devozione, Gloria, Vendetta.
- Ranger: Cacciatore delle Tenebre, Viandante Fatato.
- Stregone: Aberrante, Draconica, Meccanica.
- Warlock: Celestiale, Grande Antico, Immondo, Signore Fatato.

Queste non sono tutte equivalenti:

- alcune concedono incantesimi sempre preparati;
- alcune espandono la lista e/o concedono lancio gratuito;
- alcune sono privilegi di scelta e non semplici auto-grant.

Da completare:

- creare dati strutturati per ciascuna lista di incantesimi di sottoclasse;
- applicare gli incantesimi sempre preparati al livello corretto;
- distinguere lista espansa, sempre preparato, free cast e scelta.

## Slot incantesimo

Single class:

- incantatori pieni usano tabella full caster;
- Paladino/Ranger usano progressione half caster;
- Warlock usa Magia del Patto separata, recupero riposo breve.

Multiclasse:

- sommare tutti i livelli da Bardo, Chierico, Druido, Mago, Stregone;
- sommare meta' dei livelli da Paladino e Ranger, arrotondando per eccesso;
- sommare un terzo dei livelli da Guerriero/Ladro solo se Cavaliere Mistico/Mistificatore Arcano, arrotondando per difetto;
- Warlock resta separato con Magia del Patto, ma gli slot possono essere usati incrociati secondo manuale.

Stato codice:

- tabelle full, half e pact presenti;
- manca calcolo multiclass spellcasting completo.

## Warlock e Suppliche Occulte

Il Warlock richiede tre livelli di regole:

1. numero di suppliche note per livello;
2. prerequisiti di ogni supplica;
3. sottoscelte generate dalla supplica.

Suppliche note:

| Livello Warlock | Suppliche |
| --- | --- |
| 1 | 1 |
| 2 | 3 |
| 3 | 3 |
| 4 | 3 |
| 5 | 5 |
| 6 | 5 |
| 7 | 6 |
| 8 | 6 |
| 9 | 7 |
| 10 | 7 |
| 11 | 7 |
| 12 | 8 |
| 13 | 8 |
| 14 | 8 |
| 15 | 9 |
| 16 | 9 |
| 17 | 9 |
| 18 | 10 |
| 19 | 10 |
| 20 | 10 |

Regole:

- al livello 1 il Warlock sceglie suppliche;
- quando il numero aumenta, deve scegliere nuove suppliche;
- quando sale da Warlock puo' sostituire una supplica, rispettando prerequisiti e dipendenze;
- non puo' scegliere la stessa supplica piu' volte salvo indicazione di ripetibilita';
- non puo' rimuovere una supplica che e' prerequisito di un'altra che mantiene.
- una supplica selezionata puo' generare sottoscelte obbligatorie: il motore deve creare `ChoiceRequirement` figlie della supplica e validarle prima di applicare il level-up.

Prerequisiti principali:

- nessun prerequisito: Armatura delle Ombre, Mente Occulta, Patto del Tomo, Patto della Catena, Patto della Lama;
- Warlock 2+: Balzo Ultraterreno, Conoscenze degli Antichi, Deflagrazione Agonizzante, Deflagrazione Respingente, Lancia Occulta, Maschera dei Molti Volti, Vigore Immondo, Visioni Velate, Vista del Diavolo;
- Warlock 5+: Dono degli Abissi, Investitura del Signore delle Catene, Lama Assetata, Maestro di Mille Forme, Passo Ascendente, Punizione Occulta, Sguardo delle Due Menti, Tutt'uno con le Ombre;
- Warlock 7+: Sussurri dalla Tomba;
- Warlock 9+: Dono del Protettore, Succhiavita, Visione dei Reami Lontani;
- Warlock 12+: Lama Divoratrice;
- Warlock 15+: Vista Stregata.

Prerequisiti collegati:

- Dono del Protettore richiede Patto del Tomo;
- Investitura del Signore delle Catene richiede Patto della Catena;
- Lama Assetata, Punizione Occulta e Succhiavita richiedono Patto della Lama;
- Lama Divoratrice richiede Lama Assetata;
- Deflagrazione Agonizzante e Lancia Occulta richiedono un trucchetto da Warlock che infligge danni;
- Deflagrazione Respingente richiede un trucchetto da Warlock che infligge danni e usa tiro per colpire.

Da implementare:

- UI per scelta suppliche in creazione a livello alto;
- UI per sostituzione supplica al level-up;
- completare sottoscelte per Conoscenze degli Antichi e altre suppliche con scelta non ancora strutturata;
- supporto `repeatable`;
- aggiornare indici del catalogo se il frontend in futuro usa `indexes`.

Stato implementazione:

- il level-up genera scelte figlie per le suppliche selezionate;
- Patto del Tomo chiede trucchetti e rituali e salva gli incantesimi come `invocationSpell`;
- Deflagrazione Agonizzante, Deflagrazione Respingente e Lancia Occulta chiedono a quale trucchetto da Warlock applicare il beneficio;
- le scelte figlie vengono validate nel draft e salvate nel power della supplica.

Sottoscelte note da modellare:

- Patto del Tomo: scelta di trucchetti e rituali concessi dal tomo; gli incantesimi vanno salvati come fonte `Warlock - Patto del Tomo`, non come normali preparati scelti dalla classe.
- Deflagrazione Agonizzante: scelta del trucchetto da Warlock che infligge danni a cui applicare il beneficio.
- Deflagrazione Respingente: scelta del trucchetto da Warlock con danni e tiro per colpire.
- Lancia Occulta: scelta del trucchetto da Warlock che infligge danni a cui applicare il beneficio di gittata.
- Le sottoscelte devono restare agganciate alla supplica scelta, cosi' se in futuro si sostituisce/rimuove la supplica il motore sa quali effetti dipendenti rimuovere o invalidare.

## Talenti

Stato JSON:

- 75 talenti;
- categorie: Origini, Generale, Stile di combattimento, Dono epico;
- 59 talenti hanno `choices`;
- solo pochissimi hanno `effects` applicabili;
- i talenti con incantesimi importanti sono gia' modellati meglio di prima, per esempio Contaminazione Oscura concede Invisibilita come `grantedSpells` e chiede un incantesimo aggiuntivo.

Regola motore:

- il filtro talenti deve usare categoria, prerequisiti, ripetibilita' e livello;
- le scelte del talento devono produrre effetti veri, non solo testo;
- ogni effetto deve avere un tipo applicabile:
  - `abilityIncrease`;
  - `skillProficiency`;
  - `toolProficiency`;
  - `weaponMastery`;
  - `savingThrowProficiency`;
  - `spellGrant`;
  - `resourceGrant`;
  - `attackModifier`;
  - `armorTraining`;
  - `movement`;
  - `passiveBonus`.

Da implementare:

- completare `effects` per tutti i talenti;
- far usare `effects` a `applyFeatDraftToCharacter`;
- non affidarsi solo a `choices`;
- gestire i talenti Stile di combattimento come scelta di classe quando una classe concede Stile;
- gestire Doni epici al 19.

## Equipaggiamento

Stato JSON:

- oggetti di equipaggiamento presenti;
- armi hanno danni, proprieta', maestria, costo, peso;
- armature hanno formula CA, requisiti FOR, svantaggio furtivita';
- strumenti e oggetti avventura presenti;
- aggiunto `generated/dnd5e2024_rules_catalogs_it/rules/equipment/starting_equipment.json`;
- il nuovo JSON contiene 12 classi, 25 opzioni iniziali di classe, competenze in armature/armi/strumenti, regole base di equip e competenze multiclasse;
- il nuovo JSON e' registrato in `manifest.json` e `indexes/catalogs.index.json`.

### Cataloghi da usare

La UI non deve inventare oggetti a mano. Deve comporre l'inventario leggendo questi cataloghi:

| Scopo | File |
| --- | --- |
| Pacchetti classe, competenze, regole equip | `rules/equipment/starting_equipment.json` |
| Armi, danni, proprieta', maestria | `rules/equipment/weapons.json` |
| Armature e formule CA | `rules/equipment/armors.json` |
| Scudi | `rules/equipment/shields.json` |
| Strumenti | `rules/equipment/tools.json` |
| Dotazioni, focus, munizioni, oggetti | `rules/equipment/adventuring_gear.json` |
| Cavalcature, veicoli, servizi | `rules/equipment/mounts_vehicles_services.json` |

### Competenze classe

`starting_equipment.json` ora definisce per ogni classe:

- `armorTraining`: categorie indossabili in modo efficiente;
- `weaponTraining`: categorie o filtri sulle armi;
- `toolTraining`: strumenti fissi o scelte;
- `multiclassTraining`: competenze ridotte da applicare quando la classe viene presa dopo il livello 1;
- `startingOptions`: pacchetto A/B/C oppure denaro.

Esempi importanti:

- Guerriero e Paladino: armature leggere, medie, pesanti e scudi; armi semplici e da guerra.
- Ranger: armature leggere, medie, scudi; armi semplici e da guerra.
- Ladro: armature leggere; armi semplici e armi da guerra con proprieta' `accurata` o `leggera`.
- Monaco: nessuna armatura; armi semplici e armi da guerra con proprieta' `leggera`; uno strumento da artigiano o musicale.
- Mago e Stregone: nessuna armatura; armi semplici.
- Warlock e Bardo: armature leggere; armi semplici.

Questi filtri vanno usati anche per:

- mostrare solo armi valide nelle scelte di padronanza quando una feature richiede una lista filtrata;
- segnalare armi non competenti nella scheda;
- impedire equipaggiamenti incoerenti in creazione, salvo scelta manuale/DM.

### Regole armature

Il motore deve calcolare:

- CA senza armatura: `10 + mod Des`, salvo feature alternative;
- CA con armatura leggera: formula armatura + mod Des;
- CA con armatura media: formula armatura + mod Des massimo 2;
- CA con armatura pesante: valore fisso;
- scudo: +2 solo se il personaggio ha competenza negli scudi;
- requisito Forza: se non soddisfatto, velocita' -3 m;
- svantaggio Furtivita': se l'armatura lo indica;
- penalita' non competente: svantaggio a prove d20 di Forza/Destrezza e impossibilita' a lanciare incantesimi.

Feature alternative:

- Barbaro Difesa senza Armatura: `10 + mod Des + mod Cos`, scudo consentito.
- Monaco Difesa senza Armatura: `10 + mod Des + mod Sag`, senza armatura e senza scudo.
- altri privilegi/oggetti futuri devono produrre una `armorClassFormula` alternativa, non modificare direttamente la CA.

### Regole armi

Il motore deve generare attacchi dalle armi equipaggiate:

- arma da mischia: usa Forza;
- arma a distanza: usa Destrezza;
- proprieta' `accurata`: usa il migliore tra Forza e Destrezza, o lascia scelta;
- proprieta' `lancio`: usa la caratteristica dell'arma da mischia salvo regola specifica;
- competenza: aggiunge bonus competenza al tiro per colpire;
- danno: aggiunge lo stesso modificatore usato per colpire, salvo attacchi bonus o eccezioni;
- proprieta' `versatile`: deve offrire danno a una mano/due mani;
- proprieta' `pesante`: svantaggio se Forza/Destrezza sotto 13 secondo tipo arma;
- proprieta' `munizioni`: consumare munizioni e tracciarne recupero;
- proprieta' `ricarica`: limita numero di colpi;
- proprieta' `leggera`: abilita attacco bonus con altra arma leggera, senza modificatore al danno salvo eccezioni.

La `mastery` dell'arma non deve essere sempre attiva: funziona solo se il personaggio ha Padronanza d'armi e ha scelto quell'arma tra quelle disponibili.

Regola creazione:

- ogni background offre equipaggiamento A oppure 50 mo;
- ogni classe ha equipaggiamento iniziale/alternative secondo manuale nel nuovo JSON;
- le scelte interne del pacchetto devono essere risolte prima di creare l'inventario.

Scelte interne gia' previste nel JSON:

- Bardo: strumento musicale nel pacchetto;
- Monaco: strumento scelto con la competenza;
- Chierico/Paladino: variante simbolo sacro;
- Druido/Ranger: variante focus druidico;
- Mago/Stregone/Warlock: variante focus arcano o libro.

Da aggiungere in una prossima passata:

- pacchetti equipaggiamento dei background come dati strutturati;
- contenuto espanso delle dotazioni, se vogliamo far vedere ogni oggetto interno invece del pack unico;
- scelta avanzata a livelli superiori dalla tabella "Equipaggiamento di partenza a livelli superiori".

Regola scheda:

- oggetto posseduto non significa oggetto equipaggiato;
- armatura e scudo equipaggiati modificano CA;
- arma equipaggiata genera attacco;
- focus/component pouch servono a incantesimi;
- strumenti danno competenze e azioni contestuali;
- consumabili devono avere quantita' e tracker.

Da implementare:

- importare `starting_equipment.json` in un nuovo `equipmentService.js`;
- costruire `getClassEquipmentOptions(classId, mode)` per creazione e multiclasse;
- costruire `buildStartingEquipmentDraft(character, choices)`;
- costruire `applyStartingEquipmentDraft(character, draft)`;
- salvare inventario strutturato con gruppi `weapons`, `armor`, `tools`, `gear`, `currency`;
- aggiungere equip/unequip;
- calcolare CA generica da armatura/scudo/feature alternative;
- calcolare attacchi generici da armi equipaggiate;
- tracker munizioni/consumabili;
- denaro persistente;
- validare warning: armatura non competente, scudo non competente, arma non competente, requisito Forza non rispettato.

## Multiclasse

Correzione importante dalla seconda passata manuale:

- per prendere una nuova classe, il personaggio deve avere almeno 13 nella caratteristica primaria della nuova classe e nelle caratteristiche primarie delle classi attuali.

Esempio manuale:

- Barbaro che vuole diventare Druido deve soddisfare Forza 13 e Saggezza 13.

Quindi il controllo corretto non e' solo:

```text
nuova classe >= 13
```

ma:

```text
tutte le classi attuali soddisfano i loro prerequisiti
e
la nuova classe soddisfa i suoi prerequisiti
```

Nota per il tavolo:

- se si vuole una house rule piu' permissiva, si puo' aggiungere un flag impostazioni. Di default il motore deve seguire il manuale.

Regole:

- PF della nuova classe come livello successivo, non PF massimi da livello 1;
- Dadi Vita separati per tipo;
- bonus competenza da livello totale;
- competenze da multiclasse ridotte, non uguali alla classe presa al livello 1;
- privilegi di classe si ottengono normalmente, salvo regole specifiche;
- Attacco Extra non si somma tra classi;
- Classe Armatura da piu' privilegi non si somma: il giocatore sceglie quale formula usare;
- Incantesimi multiclass usano tabella combinata;
- Magia del Patto resta separata ma interagisce con Incantesimi.

Stato codice:

- `MULTICLASS_MIN_SCORE = 13`;
- alcune classi hanno prerequisiti in `CLASS_RULES`;
- il controllo va rivisto per includere anche le classi attuali;
- competenze multiclass sono appena accennate solo per alcuni casi;
- slot multiclass non completo.

## Report progressione

Ogni applicazione di regole deve produrre snapshot.

Snapshot minimo:

```js
{
  level,
  classLevel,
  totalLevel,
  classTaken,
  choices,
  automaticChanges,
  characterBefore,
  characterAfter,
  summary
}
```

Funzioni richieste:

- vedere il PG a ogni livello;
- estrarre/duplicare da un livello precedente;
- confrontare due livelli;
- cambiare una scelta da un livello precedente rigenerando quelli successivi.

## Piano tecnico aggiornato

### Priorita' 1: spostare regole dai servizi ai dati

- creare `rules/classes.json` con tabelle 1-20, scelte, risorse, spellcasting, sottoclasse;
- creare `rules/species.json`;
- creare `rules/backgrounds.json`;
- `rules/equipment/starting_equipment.json` esiste per le classi; va esteso ai background o va creato un file gemello;
- mantenere `progressionService.js` come motore, non come catalogo.

### Priorita' 2: ChoiceRequirement unico

Tutti questi casi devono usare lo stesso sistema:

- skill choice;
- tool choice;
- language choice;
- spell choice;
- cantrip choice;
- subclass choice;
- feat choice;
- invocation choice;
- fighting style;
- metamagic;
- expertise;
- weapon mastery;
- ASI;
- equipment package;
- spell replacement.

### Priorita' 3: completare incantesimi

- libro del Mago;
- preparazione al riposo lungo;
- sostituzione al level-up;
- incantesimi sempre preparati;
- Arcanum Mistico;
- sottoclassi caster;
- UI a sezioni/pagine per livelli incantesimo.

### Priorita' 4: completare Warlock

- scelta suppliche da catalogo filtrato;
- sostituzione suppliche;
- sottoscelte delle suppliche;
- Patto del Tomo/Catena/Lama come suppliche speciali;
- Succhiavita ora presente nel catalogo, ma va testata in UI.

### Priorita' 5: equipaggiamento reale

- collegare `starting_equipment.json` alla creazione;
- pacchetti background strutturati;
- inventario normalizzato;
- equip/unequip;
- calcolo CA da armatura/scudo/feature;
- calcolo attacchi da armi/proprieta'/competenze;
- tracker munizioni e consumabili;
- denaro.

### Priorita' 6: multiclasse

- prerequisiti su classi attuali + nuova classe;
- competenze ridotte;
- PF/Dadi Vita;
- spell slots;
- pact magic;
- report progressione multiclasse.

## Regola per ogni prossimo intervento

Quando il manuale richiede una scelta:

1. aggiungere/controllare dato nel JSON;
2. produrre `ChoiceRequirement`;
3. validare scelte;
4. applicare effetti al personaggio;
5. salvare snapshot;
6. verificare creazione diretta a livello alto;
7. verificare level-up da scheda;
8. aggiornare questo file se la regola e' nuova o corretta.

Questa e' la strada per evitare un'app fragile fatta di casi speciali.
