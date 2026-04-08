# Handoff per Codex — Frontend React Mobile-First per Scheda D&D

## Obiettivo

Creare la **prima parte del progetto frontend** di un gestore di schede personaggio D&D, pensato **prima di tutto per mobile**.

Il backend/API e il database verranno sviluppati separatamente. In questa fase iniziale il frontend deve lavorare con **JSON fake** realistici, in modo da costruire struttura, componenti, UX e logica di base senza dipendere dalle API definitive.

L'obiettivo non è creare una semplice pagina profilo, ma una **mini app mobile-first per la gestione interattiva della scheda personaggio**, utile durante la sessione di gioco.

---

## Vincoli fondamentali

1. **Usare React** per il frontend.
2. **Inizializzare un repository Git** e impostare il progetto in modo ordinato fin dall'inizio.
3. **Partire con dati fake in JSON**.
4. **Pensare tutto mobile-first**: la UX primaria deve essere lo smartphone.
5. **Creare componenti e blocchi il più possibile generalizzati e riutilizzabili**.
6. **Non costruire una form gigante**: la scheda va pensata come un insieme di sezioni/cards/blocchi consultabili e interattivi.
7. Quando non sei sicuro su librerie, pattern, best practice o dettagli tecnici, **usa la ricerca su internet** prima di prendere decisioni.

---

## Visione del progetto

Questa applicazione deve permettere a ciascun utente di entrare e gestire la propria scheda D&D in modo rapido da telefono.

La scheda contiene sia:

- **dati quasi statici**: nome, livello, classi, caratteristiche, competenze, equipaggiamento, incantesimi conosciuti/preparati;
- **dati molto dinamici**: PF attuali, PF temporanei, slot incantesimo, risorse di classe, dadi vita, condizioni, concentrazione, riposi.

Per questo motivo il frontend non deve essere trattato come una semplice CRUD classica, ma come una **dashboard interattiva di stato del personaggio**.

---

## Priorità UX

### Mobile-first obbligatorio

Il progetto deve essere impostato **mobile-first in modo esplicito**.

Questo significa:

- layout progettato prima per schermi stretti;
- una sola colonna nella maggior parte dei casi;
- sezioni leggibili senza zoom;
- controlli touch-friendly;
- pulsanti grandi e ben spaziati;
- informazioni principali sempre accessibili;
- evitare tabelle desktop travestite da mobile;
- evitare muri di testo aperti tutti insieme;
- evitare pagine infinite piene di input.

Il desktop, se verrà gestito, dovrà essere un adattamento successivo. **La UX primaria resta il telefono.**

---

## Idea di prodotto

La scheda va pensata come combinazione di:

### 1. Blocco sempre visibile in alto
Contiene le informazioni più consultate durante la partita:

- nome personaggio;
- classe/i e livello;
- PF attuali / massimi;
- CA;
- velocità;
- eventuale risorsa principale della classe;
- pulsanti rapidi come:
  - danno,
  - cura,
  - riposo breve,
  - riposo lungo.

### 2. Sezioni a card espandibili
Il resto va diviso in card/collapsible sections, ad esempio:

- Caratteristiche
- Abilità
- Risorse
- Azioni rapide / Combattimento
- Incantesimi
- Equipaggiamento
- Tratti e capacità
- Note
- Dettagli personaggio

Le card chiuse devono già mostrare un **riassunto utile**. Non devono essere semplici intestazioni vuote.

Esempi:

- **Risorse** chiusa → mostra `Ki 5/5`, `Dadi Vita 3/5`, `Ispirazione sì/no`
- **Incantesimi** chiusa → mostra `Slot 1° 2/4`, `Slot 2° 1/2`, `Preparati 8`
- **Combattimento** chiusa → mostra `Attacco base +6`, `Danno 1d6+3`, `Concentrazione attiva/no`

---

## Scelte architetturali iniziali

### Stack iniziale richiesto

- React
- JavaScript oppure TypeScript (se scegli TypeScript, mantieni il setup semplice)
- Git
- JSON fake locali

Puoi scegliere Vite come base di avvio del progetto, mantenendo il setup pulito e leggero.

### Regola importante
Non introdurre subito complessità inutile.

Da evitare all'inizio:

- state management globale complesso senza reale necessità;
- generatori di form troppo astratti;
- architettura enterprise prematura;
- dipendenze inutili;
- overengineering.

Prima costruisci bene il nucleo.

---

## Primo obiettivo concreto

Realizzare una **prima versione funzionante del frontend** con:

1. progetto React inizializzato;
2. repository Git creato;
3. struttura cartelle ordinata;
4. un personaggio fake caricato da JSON;
5. schermata principale mobile-first;
6. sezioni a card espandibili;
7. primi componenti riutilizzabili;
8. prime interazioni locali su PF e risorse.

Non serve backend reale in questa fase.

---

## Modello dati: linee guida

I JSON fake devono essere **realistici**, già abbastanza vicini a una possibile struttura futura.

Non usare un fake troppo banale.

### Tipi di dato che il frontend deve saper gestire

1. **Valore semplice**
   - nome
   - CA
   - velocità

2. **Valore con massimo**
   - PF
   - Ki
   - Sorcery Points
   - Dadi Vita

3. **Contatore consumabile**
   - slot incantesimo
   - usi per riposo breve/lungo
   - cariche oggetti

4. **Lista**
   - incantesimi
   - attacchi
   - oggetti
   - competenze

5. **Valore derivato**
   - modificatori caratteristiche
   - spell save DC
   - bonus attacco
   - passive

6. **Stato booleano/temporaneo**
   - concentrazione
   - ispirazione
   - condizioni attive

Questi tipi devono guidare anche la progettazione dei componenti.

---

## JSON fake iniziale richiesto

Creare almeno **2 o 3 file JSON fake** differenti, per testare la UI in scenari diversi.

### Esempi richiesti

- personaggio completo e sano;
- personaggio ferito con risorse consumate;
- personaggio incantatore con slot e lista incantesimi più ricca.

### Esempio di struttura di riferimento

> Questo è un esempio guida, non un vincolo rigido. L'importante è mantenere una struttura coerente, scalabile e leggibile.

```json
{
  "id": "pg_001",
  "name": "Shisui",
  "level": 5,
  "race": "Tiefling",
  "alignment": "Neutrale Buono",
  "classes": [
    {
      "name": "Monaco",
      "level": 5,
      "subclass": "Guerriero degli Elementi"
    }
  ],
  "combat": {
    "hp": {
      "current": 23,
      "max": 31,
      "temp": 0
    },
    "ac": 15,
    "speed": 45,
    "initiativeBonus": 3,
    "hitDice": {
      "current": 3,
      "max": 5,
      "type": "d8"
    }
  },
  "abilities": {
    "str": 10,
    "dex": 16,
    "con": 14,
    "int": 8,
    "wis": 14,
    "cha": 14
  },
  "resources": [
    {
      "id": "ki",
      "label": "Ki",
      "current": 5,
      "max": 5,
      "resetOn": "short_rest"
    },
    {
      "id": "darkness",
      "label": "Contaminazione Oscura",
      "current": 1,
      "max": 1,
      "resetOn": "long_rest"
    }
  ],
  "spellcasting": {
    "ability": "cha",
    "spellSaveDc": 12,
    "spellAttackBonus": 4,
    "slots": [
      {
        "level": 1,
        "current": 2,
        "max": 4
      },
      {
        "level": 2,
        "current": 1,
        "max": 2
      }
    ],
    "spells": [
      {
        "id": "mind_sliver",
        "name": "Scheggia della Mente",
        "level": 0,
        "school": "Divinazione",
        "castingTime": "Azione",
        "range": "18 m",
        "concentration": false,
        "description": "Descrizione fake iniziale"
      }
    ]
  },
  "conditions": [
    {
      "id": "concentration",
      "label": "Concentrazione",
      "active": false
    }
  ],
  "actions": [
    {
      "id": "unarmed_strike",
      "name": "Colpo senz'armi",
      "type": "attack",
      "toHit": 6,
      "damage": "1d6+3"
    }
  ],
  "inventory": [
    {
      "id": "quarterstaff",
      "name": "Bastone",
      "type": "weapon"
    }
  ],
  "notes": "Note fake del personaggio"
}
```

---

## Filosofia dei componenti

### Regola chiave
Creare elementi **quanto più generalizzati possibile**, ma senza cadere nell'astrazione inutile.

Serve trovare un equilibrio:

- niente componenti super specifici e duplicati ovunque;
- niente mega-componenti astratti ingestibili;
- preferire **blocchi riutilizzabili, piccoli, chiari e componibili**.

### Esempi di blocchi riutilizzabili

#### UI generica
- `Page`
- `SectionCard`
- `StatPill`
- `Badge`
- `IconButton`
- `ActionButton`
- `Counter`
- `ProgressRow`
- `ToggleRow`
- `Tabs`
- `BottomSheet` oppure `ModalSheet`

#### Dominio D&D ma comunque riutilizzabili
- `CharacterHeader`
- `HpCard`
- `PrimaryStatsBar`
- `AbilityGrid`
- `ResourceList`
- `ResourceCounter`
- `SpellSlotTracker`
- `ActionList`
- `SpellList`
- `ConditionChips`
- `InventoryList`

### Obiettivo
Fare in modo che più sezioni possano essere costruite assemblando gli stessi mattoni.

Esempio:

- PF, Ki, Dadi Vita, Slot e cariche oggetto possono condividere la stessa logica base di un **counter reusable**;
- condizioni, lingue, tag, stati possono condividere un componente **chip/badge**;
- incantesimi, azioni, oggetti possono condividere una base comune di **list item card**.

---

## Struttura consigliata delle cartelle

Questa è una proposta iniziale. Può essere adattata, ma va mantenuta ordinata.

```bash
src/
  app/
    App.jsx
    routes.jsx
  components/
    ui/
      Badge.jsx
      Button.jsx
      Card.jsx
      Counter.jsx
      IconButton.jsx
      Tabs.jsx
      BottomSheet.jsx
    layout/
      MobileLayout.jsx
      TopBar.jsx
      BottomNav.jsx
    character/
      CharacterHeader.jsx
      HpCard.jsx
      PrimaryStatsBar.jsx
      AbilityGrid.jsx
      ResourceList.jsx
      ResourceCounter.jsx
      SpellSlotTracker.jsx
      ActionList.jsx
      SpellList.jsx
      ConditionChips.jsx
      InventoryList.jsx
      CollapsibleSection.jsx
  data/
    characters/
      shisui.json
      caster-sample.json
      injured-sample.json
  pages/
    CharacterOverviewPage.jsx
    CharacterSpellsPage.jsx
    CharacterDetailsPage.jsx
  hooks/
    useCharacterState.js
  utils/
    dnd/
      modifiers.js
      rests.js
      formatters.js
  styles/
    globals.css
```

---

## Pagine iniziali da costruire

### 1. CharacterOverviewPage
Prima pagina da realizzare.

Deve contenere:

- header del personaggio;
- PF;
- CA / Velocità / Iniziativa;
- risorse principali;
- azioni rapide;
- sezioni collapsabili;
- layout mobile-first.

Questa è la pagina più importante.

### 2. CharacterSpellsPage
Seconda fase.

Deve mostrare:

- slot incantesimo;
- lista incantesimi;
- eventuali filtri per livello;
- card singole leggibili;
- interazione touch comoda.

### 3. CharacterDetailsPage
Sezione più statica con:

- razza/specie;
- classi e sottoclassi;
- background;
- lingue;
- competenze;
- passive;
- note.

---

## Roadmap iniziale consigliata

### Fase 1 — Setup progetto
- crea il progetto React;
- inizializza Git;
- crea README iniziale;
- definisci struttura cartelle;
- aggiungi JSON fake.

### Fase 2 — Layout mobile-first base
- crea un layout mobile con max-width sensata;
- barra superiore semplice;
- spaziature coerenti;
- card base;
- typography leggibile.

### Fase 3 — Schermata overview
- costruisci `CharacterHeader`;
- costruisci `HpCard`;
- costruisci `PrimaryStatsBar`;
- crea 3-4 card collapsabili;
- mostra i dati fake.

### Fase 4 — Prime interazioni locali
- modifica PF correnti;
- modifica PF temporanei;
- decrementa/incrementa risorse;
- toggle concentrazione;
- simulazione di riposo breve/lungo in locale.

### Fase 5 — Generalizzazione componenti
- elimina duplicazioni;
- estrai `Counter` riusabile;
- estrai `SectionCard` / `CollapsibleSection`;
- riusa la stessa logica base per più risorse.

### Fase 6 — Pagine secondarie
- incantesimi;
- dettagli;
- eventuale inventario.

Solo dopo, e non prima, si penserà all'integrazione reale con API.

---

## Gestione dello stato iniziale

All'inizio mantenere lo stato il più semplice possibile.

### Preferenza iniziale
- stato locale con React hooks;
- nessun global store complesso finché non serve davvero.

Puoi prevedere un hook come:

- `useCharacterState()`

che gestisca:

- caricamento del personaggio fake;
- update locale dei valori numerici;
- reset/riposo breve;
- reset/riposo lungo;
- toggle condizioni.

### Importante
La logica di dominio non deve finire sparsa a caso nei componenti.

Per esempio:

- il calcolo del modificatore caratteristica va in una utility;
- la logica del riposo breve/lungo va in una utility o in un hook dedicato;
- i componenti devono restare il più possibile focalizzati sulla UI.

---

## Logica D&D da predisporre già adesso

Anche se inizialmente fake, il progetto deve essere predisposto a gestire correttamente questi concetti:

- PF correnti / massimi / temporanei;
- risorse con `current/max`;
- risorse che si resettano con riposo breve;
- risorse che si resettano con riposo lungo;
- slot incantesimo per livello;
- condizioni attive;
- concentrazione;
- azioni / attacchi / spell card;
- valori derivati come modificatori.

Non serve implementare subito tutta la logica profonda del regolamento, ma la struttura deve già permettere di farlo senza riscrivere tutto.

---

## Regole di design da seguire

1. **Mobile-first reale**
2. **Una sola colonna come base**
3. **Card come unità principale di layout**
4. **Controlli veloci per i valori dinamici**
5. **Sintesi utile nelle card chiuse**
6. **Tipografia leggibile**
7. **Niente schermate infinite ingestibili**
8. **Riutilizzare tutto il riutilizzabile**
9. **Separare UI e logica**
10. **Preparare il terreno per le API future**

---

## Errori da evitare

- fare una sola pagina gigantesca con tutto aperto;
- trattare tutto come semplice form input;
- usare componenti duplicati invece di estrarre blocchi comuni;
- pensare desktop-first e poi “adattare”; 
- accoppiare troppo il frontend al fake JSON del momento;
- infilare regole di dominio direttamente dentro JSX casuale;
- creare fin da subito un sistema super generico ingestibile.

---

## Deliverable iniziale richiesto a Codex

Codex deve impostare una **prima milestone concreta**, composta da:

1. progetto React creato;
2. Git inizializzato;
3. struttura cartelle definita;
4. almeno 2-3 JSON fake personaggio;
5. pagina overview mobile-first funzionante;
6. componenti base riutilizzabili;
7. card espandibili con riassunto da chiuse;
8. contatori locali per PF e almeno una risorsa;
9. utilities iniziali per modificatori e riposi;
10. codice pulito e pronto a crescere.

---

## Indicazione finale per Codex

Prima di aggiungere funzionalità nuove, assicurati che il nucleo sia solido:

- struttura chiara;
- componenti riutilizzabili;
- stato semplice ma ordinato;
- UX mobile-first davvero usabile;
- JSON fake realistici.

Quando hai dubbi tecnici o architetturali, **usa la ricerca su internet** per verificare librerie, pattern o best practice, invece di inventare a caso.

L'obiettivo di questa prima fase non è “finire il prodotto”, ma costruire **una base React pulita, mobile-first e scalabile** per il gestore di schede D&D.
