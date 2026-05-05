# Progressione personaggio - app D&D React

## Obiettivo

Costruire una sezione per gestire la crescita del personaggio nel tempo:

- creazione da zero;
- passaggio di livello;
- multiclass;
- scelta di privilegi, talenti, incantesimi, competenze e risorse;
- aggiornamento coerente della scheda giocabile.

La progressione non deve essere una form enorme. Deve sembrare una guida passo passo, utile anche a chi non ricorda tutte le regole.

## Principio UX

La domanda principale non e:

> "Quali campi devo compilare?"

Ma:

> "A questo livello, cosa devo scegliere e cosa cambia nella mia scheda?"

Quindi la UX deve essere guidata da milestone e scelte.

## Due flussi distinti

### 1. Creazione personaggio da zero

Flusso lungo, ma guidato:

1. concept base;
2. specie;
3. background;
4. classe livello 1;
5. caratteristiche;
6. competenze;
7. equipaggiamento;
8. incantesimi se presenti;
9. riepilogo finale.

Questo flusso puo arrivare dopo. E piu grande.

### 2. Passaggio di livello

Flusso piu urgente e piu utile per l'app attuale.

Esempio Shisui da livello 3 a livello 4:

1. scegli quale classe sale di livello;
2. leggi cosa sblocca quel livello;
3. fai le scelte obbligatorie;
4. aggiorni PF, risorse, privilegi, incantesimi;
5. confermi.

Per ora conviene partire dal passaggio di livello.

## Esperienza desiderata

La pagina potrebbe chiamarsi:

- `Progressione`
- `Level up`
- `Crescita`

Struttura mobile:

```txt
Progressione

Shisui
Livello attuale: 3

[Passa di livello]

Piano futuro
Monaco 5 / Stregone 3

Prossimo livello consigliato
Monaco 4

Scelte richieste
- Aumento caratteristiche oppure talento
- Aggiorna PF
- Aggiorna Ki se necessario
```

## Modello mentale

Ogni livello di una classe deve rispondere a queste domande:

```txt
Quando arrivo a questo livello...

1. Che privilegi ottengo automaticamente?
2. Che scelte devo fare?
3. Quali risorse aumentano?
4. Gli slot incantesimo cambiano?
5. Posso imparare o preparare nuovi incantesimi?
6. Aumentano PF, competenza o altri valori derivati?
```

## Dati necessari

Abbiamo gia alcune fonti:

- JSON classi complete 2024;
- catalogo powers per privilegi/capacita;
- catalogo incantesimi;
- catalogo talenti;
- equipaggiamento;
- JSON personaggi.

La progressione deve combinare:

```txt
personaggio attuale
+ regole classe
+ regole specie/background/talenti
+ scelte utente
= nuova scheda
```

## Tipi di cambiamento da gestire

### Automatici

Sono cose che l'app puo applicare senza chiedere troppo:

- livello totale +1;
- livello della classe scelta +1;
- bonus competenza se cambia;
- nuovi privilegi automatici;
- aumento risorse basate sul livello;
- nuovi slot incantesimo se deterministici.

### Scelte obbligatorie

L'app deve fermarsi e chiedere:

- talento oppure aumento caratteristica;
- quale talento;
- quali caratteristiche aumentare;
- nuova sottoclasse;
- nuove competenze;
- nuovi incantesimi;
- stile di combattimento;
- padronanze;
- metamagia;
- invocazioni o scelte simili.

### Scelte opzionali

L'app puo proporre ma non forzare:

- cambiare incantesimi conosciuti;
- cambiare incantesimi preparati;
- aggiornare equipaggiamento;
- modificare piano futuro;
- aggiungere note narrative.

## Passaggio di livello: flusso consigliato

### Step 1 - Scelta classe

Se il personaggio ha una sola classe:

```txt
Vuoi salire a Monaco 4?
```

Se e multiclass o ha piano multiclass:

```txt
Quale classe sale?

[Monaco -> 4]
[Stregone -> 1]
```

Per Shisui, anche se ora e Monaco 3, vogliamo gia pensare al caso:

```txt
Monaco 4
oppure
iniziare Stregone 1
```

### Step 2 - Anteprima modifiche

Prima di scegliere, l'app mostra cosa cambierebbe.

Esempio:

```txt
Monaco 4

Ottieni:
- Aumento dei Punteggi di Caratteristica oppure talento

Cambia:
- Dado vita: +1d8 da tirare o media fissa
- Ki: probabilmente 4
```

### Step 3 - Scelte richieste

Ogni scelta diventa una card.

Esempio:

```txt
Scelta richiesta
Aumento caratteristiche o talento

[Aumento caratteristiche]
[Talento]
```

Se scegli talento:

```txt
Scegli un talento disponibile
[Fortunato]
[Resiliente]
[Mobile]
...
```

### Step 4 - PF

Serve una UX chiara:

```txt
Punti ferita

[Media fissa]
[Tiro manuale]
```

Per tiro manuale:

```txt
Hai tirato: [ input ]
Mod COS: +2
Nuovi PF massimi: X
```

### Step 5 - Riepilogo finale

Prima di applicare:

```txt
Riepilogo level up

Shisui diventa livello 4
Monaco 3 -> 4
PF max: 24 -> 31
Ki: 3 -> 4
Nuovo talento: Fortunato

[Conferma]
[Annulla]
```

## Dati temporanei: draft

Il level up non deve modificare subito il personaggio.

Serve un concetto di draft:

```json
{
  "characterId": "pg_001",
  "fromLevel": 3,
  "toLevel": 4,
  "classChoice": {
    "name": "Monaco",
    "fromLevel": 3,
    "toLevel": 4
  },
  "choices": {
    "asiOrFeat": "feat",
    "featId": "fortunato"
  },
  "hp": {
    "mode": "manual",
    "rolled": 6,
    "conMod": 2
  }
}
```

Solo quando confermi, il draft viene applicato al JSON/stato.

## Regole importanti per React

Questa feature va separata bene:

```txt
UI
mostra step, card, pulsanti

logica
calcola cosa cambia

dati
legge classi, talenti, spell, personaggio
```

Da evitare:

- regole del level up direttamente nel JSX;
- `if` enormi dentro il componente;
- modificare il personaggio mentre stai ancora scegliendo;
- creare subito un sistema troppo astratto per tutte le classi.

## Componenti probabili

Non sono da creare ora, solo idee:

```txt
ProgressionSection
LevelUpStartCard
ClassLevelChoiceCard
LevelChangePreview
LevelChoiceCard
HpIncreaseCard
LevelUpSummary
```

Utility/logica:

```txt
getAvailableLevelUpOptions(character)
getClassLevelChanges(classId, fromLevel, toLevel)
getRequiredChoices(levelChanges)
buildLevelUpDraft(...)
applyLevelUpDraft(character, draft)
```

## Prima milestone sensata

Non partire dalla creazione da zero.

Prima milestone:

```txt
Level up guidato per personaggi gia esistenti.
```

Scenario iniziale:

```txt
Shisui livello 3 -> livello 4 Monaco
```

Deve gestire:

- leggere privilegi Monaco 4 dal JSON classi;
- mostrare anteprima;
- chiedere talento oppure ASI;
- aggiornare livello;
- aggiornare PF;
- aggiornare Ki;
- salvare una bozza o applicare in locale.

## Seconda milestone

Multiclass.

Scenario:

```txt
Shisui Monaco 5 -> Stregone 1
```

Qui bisogna gestire:

- requisiti multiclass se vogliamo validarli;
- aggiunta nuova classe;
- competenze ottenute o non ottenute;
- incantesimi da stregone;
- nuova risorsa eventuale;
- spellcasting separato o combinato.

## Terza milestone

Creazione personaggio da zero.

Arriva dopo, quando il motore di scelte funziona.

## Domande aperte

1. Vogliamo permettere level up liberi anche se non rispettano le regole?
2. Il DM deve poter sbloccare eccezioni?
3. I PF usano media fissa, tiro manuale o entrambi?
4. Le scelte devono essere salvate come storico?
5. La progressione deve avere un piano futuro modificabile?
6. La creazione da zero deve usare solo regole 2024 o anche homebrew?
7. Le spell preparate vanno scelte durante il level up o in una sezione separata?
8. Gli oggetti ottenuti al level up/background vanno aggiunti automaticamente all'equipaggiamento?

## Decisione provvisoria

Per ora la direzione migliore e:

```txt
Costruire prima un level up guidato, non la creazione completa.
Partire da Shisui Monaco 3 -> 4.
Usare draft temporaneo.
Mostrare anteprima prima di applicare.
Separare logica di progressione dalla UI.
```

## Confine della feature

La progressione gestisce cambiamenti permanenti o semi-permanenti del personaggio.

Per ora NON gestisce:

- preparazione giornaliera degli incantesimi dopo riposo lungo;
- cambio lista preparata dopo riposo lungo;
- reset risorse;
- reset slot;
- recupero PF;
- gestione condizioni temporanee.

Queste cose restano nel flusso di Riposo Lungo / Riposo Breve gia presente in Panoramica.

In futuro il riposo lungo potra aprire un flusso separato di preparazione:

```txt
Riposo lungo
-> reset risorse e slot
-> vuoi preparare incantesimi?
-> salva lista giornaliera
```

Ma non fa parte della prima milestone di Progressione.

## Mappa responsabilita

| Evento di gioco | Dove si gestisce |
|---|---|
| Level up | Progressione |
| Multiclass | Progressione |
| Scelta talento/ASI | Progressione |
| Nuove capacita di classe | Progressione |
| Nuovi slot massimi | Progressione |
| Nuovi incantesimi conosciuti | Progressione |
| Riposo breve | Panoramica / Riposi |
| Riposo lungo | Panoramica / Riposi |
| Preparazione spell giornaliera | Dopo Riposo Lungo |
| Consumo oggetti | Equipaggiamento |
| Note campagna | Dettagli |

## Contratto preview level up

La progressione non modifica subito il personaggio.

Prima produce una preview:

```txt
personaggio attuale
+ classe scelta
= anteprima cambiamenti
```

La preview deve contenere:

- livello totale prima/dopo;
- livello della classe prima/dopo;
- cambi automatici;
- scelte richieste;
- eventuali avvisi;
- eventuali scelte opzionali.

Forma dati proposta:

```js
{
  type: 'level_up_preview',
  characterId: 'pg_001',
  totalLevel: {
    from: 3,
    to: 4
  },
  classLevel: {
    className: 'Monaco',
    from: 3,
    to: 4
  },
  automaticChanges: [
    {
      id: 'hit_dice_max',
      label: 'Dado vita massimo',
      from: '3d8',
      to: '4d8'
    },
    {
      id: 'ki_max',
      label: 'Ki',
      from: 3,
      to: 4
    }
  ],
  requiredChoices: [
    {
      id: 'hp_increase',
      label: 'Aumento punti ferita',
      type: 'hp_roll_or_average'
    },
    {
      id: 'monk_4_asi_or_feat',
      label: 'Aumento caratteristiche oppure talento',
      type: 'asi_or_feat'
    }
  ],
  optionalChoices: [],
  warnings: []
}
```

Questa preview serve alla UI per sapere cosa mostrare.

La UI non deve conoscere le regole del Monaco. Deve solo leggere:

```txt
automaticChanges -> mostra elenco cambi automatici
requiredChoices -> mostra card di scelta
warnings -> mostra avvisi
```

## Caso studio 1 - Shisui Monaco 3 -> Monaco 4

Shisui attuale:

```txt
Livello totale: 3
Classe: Monaco 3
Sottoclasse: Guerriero degli Elementi
PF max: 24
Dadi vita: 3d8
Ki: 3/3
Bonus competenza: +2
```

Passaggio scelto:

```txt
Monaco 3 -> Monaco 4
Livello totale 3 -> 4
```

### Cambi automatici previsti

Da applicare senza scelta, salvo conferma finale:

```txt
Livello totale: 3 -> 4
Monaco: 3 -> 4
Dadi vita massimi: 3d8 -> 4d8
Ki massimo: 3 -> 4
Bonus competenza: resta +2
```

Nota: il bonus competenza resta +2 perche aumenta al livello totale 5.

### Scelte richieste

Il livello 4 del Monaco richiede:

```txt
Aumento dei Punteggi di Caratteristica oppure talento
```

Quindi la preview deve generare:

```js
{
  id: 'monk_4_asi_or_feat',
  label: 'Aumento caratteristiche oppure talento',
  type: 'asi_or_feat',
  source: {
    className: 'Monaco',
    level: 4
  }
}
```

Serve anche la scelta PF:

```js
{
  id: 'hp_increase',
  label: 'Aumento punti ferita',
  type: 'hp_roll_or_average',
  hitDie: 'd8',
  constitutionModifier: 2
}
```

### Possibili scelte PF

Media fissa:

```txt
d8 da Monaco -> 5
COS +2
Incremento PF = 7
PF max: 24 -> 31
```

Tiro manuale:

```txt
utente inserisce valore da 1 a 8
incremento = tiro + COS
PF max = PF max attuale + incremento
```

### Possibili scelte ASI/talento

ASI:

```txt
+2 a una caratteristica
oppure
+1 a due caratteristiche
```

Talento:

```txt
scegli un talento disponibile dal catalogo talenti
applica eventuali aumenti caratteristica
aggiungi eventuali risorse/privilegi
```

Nota importante: i talenti possono modificare molte cose:

- caratteristiche;
- risorse;
- competenze;
- incantesimi;
- velocita;
- azioni o reazioni;
- bonus passivi.

Quindi la scelta talento deve essere trattata come una mini-applicazione di regole, non come semplice testo aggiunto.

## Draft dopo le scelte

Dopo che l'utente completa le scelte, la preview diventa un draft.

Esempio con media fissa e talento:

```js
{
  characterId: 'pg_001',
  type: 'level_up_draft',
  totalLevel: {
    from: 3,
    to: 4
  },
  classLevel: {
    className: 'Monaco',
    from: 3,
    to: 4
  },
  hp: {
    mode: 'average',
    hitDie: 'd8',
    baseIncrease: 5,
    constitutionModifier: 2,
    totalIncrease: 7,
    maxHpFrom: 24,
    maxHpTo: 31
  },
  choices: {
    asiOrFeat: 'feat',
    featId: 'fortunato'
  },
  automaticChanges: [
    {
      id: 'hit_dice_max',
      from: 3,
      to: 4,
      die: 'd8'
    },
    {
      id: 'ki_max',
      from: 3,
      to: 4
    }
  ]
}
```

Solo il draft confermato modifica il personaggio.

## Contratto scelte utente

La UI non deve modificare direttamente il personaggio.

La UI raccoglie solo scelte in una forma semplice.

Esempio con PF medi e talento:

```js
const choices = {
  hpIncrease: {
    mode: 'average'
  },
  asiOrFeat: {
    mode: 'feat',
    featId: 'resiliente'
  }
}
```

Esempio con PF tirati manualmente e ASI:

```js
const choices = {
  hpIncrease: {
    mode: 'manual',
    rolled: 6
  },
  asiOrFeat: {
    mode: 'asi',
    increases: [
      { ability: 'dex', amount: 1 },
      { ability: 'wis', amount: 1 }
    ]
  }
}
```

Queste scelte non sono ancora modifiche.

Sono input per:

```js
buildLevelUpDraft(character, preview, choices)
```

## Contratto draft level up

Il draft e il risultato calcolato delle scelte, ma non applicato.

Input:

```txt
character attuale
preview generata
choices raccolte dalla UI
```

Output:

```js
{
  type: 'level_up_draft',
  characterId: 'pg_001',
  preview,
  hp: {
    mode: 'average',
    hitDie: 'd8',
    baseIncrease: 5,
    constitutionModifier: 2,
    totalIncrease: 7,
    maxHpFrom: 24,
    maxHpTo: 31
  },
  choices: {
    asiOrFeat: {
      mode: 'feat',
      featId: 'resiliente'
    }
  },
  readyToApply: true,
  warnings: []
}
```

Il draft deve rispondere a:

```txt
Se confermo, cosa succede davvero?
```

Ma ancora non modifica nulla.

## Regole PF nel draft

Ogni level up richiede aumento PF.

Per una classe con dado vita `d8`:

```txt
media fissa = 5
tiro manuale = numero scelto dall'utente da 1 a 8
```

Formula:

```txt
incremento PF = base + modificatore Costituzione
```

Esempio Shisui:

```txt
dado vita Monaco: d8
media fissa: 5
COS 14: +2
incremento: 7
PF max: 24 -> 31
```

La funzione deve evitare risultati non validi:

```txt
se mode manual e rolled manca -> warning
se rolled < 1 o rolled > dado vita -> warning
se hitDie non riconosciuto -> warning
```

## Regole ASI/talento nel draft

La scelta `asiOrFeat` puo avere due forme.

### Talento

```js
{
  mode: 'feat',
  featId: 'resiliente'
}
```

Il draft deve:

- verificare che il talento esista;
- verificare che sia tra quelli disponibili per quella scelta;
- indicare quale talento verrebbe aggiunto;
- preparare eventuali effetti da applicare dopo.

Per la prima versione puo limitarsi a:

```js
feat: {
  id: 'resiliente',
  name: 'Resiliente'
}
```

Gli effetti completi del talento arriveranno dopo.

### ASI

```js
{
  mode: 'asi',
  increases: [
    { ability: 'dex', amount: 1 },
    { ability: 'wis', amount: 1 }
  ]
}
```

Il draft deve:

- verificare che gli aumenti siano validi;
- calcolare caratteristiche prima/dopo;
- non applicarle ancora.

Per la prima versione, ASI puo essere progettato ma non implementato subito.

## Prima funzione draft da scrivere

La prossima funzione da implementare sara:

```js
buildLevelUpDraft(character, preview, choices)
```

Prima milestone del draft:

```txt
calcolare solo i PF
```

Poi:

```txt
aggiungere talento scelto
```

Poi:

```txt
aggiungere ASI
```

Poi:

```txt
applyLevelUpDraft
```

## Funzioni logiche future

Quando passeremo al codice, la prima utility potrebbe essere:

```js
getLevelUpPreview(character, className)
```

Poi:

```js
buildLevelUpDraft(preview, choices)
applyLevelUpDraft(character, draft)
```

Regola:

```txt
getLevelUpPreview non modifica nulla.
buildLevelUpDraft non modifica nulla.
applyLevelUpDraft e l'unica funzione che produce il personaggio aggiornato.
```

## Nota sulla generalizzazione

Il caso Shisui e solo il primo test.

La logica non deve diventare:

```js
if (character.name === 'Shisui') ...
```

Deve ragionare su:

```txt
classe scelta
livello attuale
livello successivo
regole classe
regole privilegi
scelte richieste
```

Shisui serve come scenario concreto per verificare che il sistema funzioni.
