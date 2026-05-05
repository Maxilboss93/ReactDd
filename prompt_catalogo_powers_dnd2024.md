# Prompt per catalogo capacita D&D 2024

Devo creare un catalogo JSON per una app React mobile-first che serve a giocare a D&D 5e 2024 al tavolo.

## Obiettivo

Creare un catalogo globale di capacita, privilegi di classe, tecniche, azioni speciali, reazioni, risorse e tratti razziali/specie, organizzato in modo simile a un catalogo spell.

La UI non deve mostrare testo da manuale come lettura lunga: deve mostrare prima le informazioni utili in gioco.

## Struttura richiesta

Per ogni capacita crea un oggetto JSON con questa struttura:

```json
{
  "id": "stringa_snake_case_stabile",
  "name": "Nome capacita",
  "source_type": "class | subclass | species | feat | background | item",
  "source": "Monaco | Ranger | Paladino | Tiefling | Goliath | ecc.",
  "subsource": "eventuale sottoclasse/specie specifica",
  "level": null,
  "kind": "active | passive | reaction | bonus_action | resource | rest | toggle | choice",
  "action_type": "Azione | Azione bonus | Reazione | Nessuna | Parte di un attacco | Durante il riposo | ecc.",
  "trigger": "quando si puo usare, se rilevante",
  "cost": {
    "resource_id": "ki | spell_slot | lay_on_hands | luck | null",
    "amount": null,
    "label": "1 Ki | 1 uso | nessun costo"
  },
  "uses": {
    "max": null,
    "scales_with": "level | proficiency_bonus | ability_modifier | null",
    "reset_on": "short_rest | long_rest | dawn | none | null"
  },
  "range": "Personale | Mischia | 18 m | ecc.",
  "area": "eventuale area o null",
  "duration": "Istantanea | 1 minuto | Sempre attiva | ecc.",
  "roll": "eventuale tiro richiesto o null",
  "damage": "eventuale danno, es. 1d10 fuoco, o null",
  "save": {
    "ability": "str | dex | con | int | wis | cha | null",
    "dc": "spell_save_dc | monk_dc | fixed | null",
    "effect_on_success": "testo breve o null",
    "effect_on_failure": "testo breve o null"
  },
  "quick_effect": "frase breve, utile da leggere durante il turno",
  "details": "spiegazione piu completa ma sintetica, per accordion chiuso/apribile",
  "tags": ["Offesa", "Difesa", "Mobilita", "Ki", "Cura", "Controllo"]
}
```

## Regole importanti

- Non scrivere descrizioni lunghe da manuale: usa sintesi operative.
- Non lasciare capacita importanti come riassunti generici.
- Se una feature sblocca sotto-tecniche, crea oggetti separati per le sotto-tecniche.
- Esempio: per il Monaco, non basta "Concentrazione da Monaco"; devi creare anche "Raffica di Colpi", "Difesa Paziente", "Passo del Vento".
- Ogni oggetto deve essere pensato come una card da gioco: prima azione, costo, trigger, durata, gittata, tiro/danno/CD, poi descrizione.
- Usa id stabili e coerenti, preferibilmente snake_case.
- Se un valore non esiste, usa null.
- Mantieni il JSON valido.
- Non inventare campi fuori schema se non strettamente necessario.

## Formato finale richiesto

Organizza il risultato cosi:

```json
{
  "meta": {
    "game": "D&D 5e",
    "edition": "2024",
    "language": "it",
    "catalog": "powers"
  },
  "powers": [],
  "indexes": {
    "by_source": {},
    "by_level": {},
    "by_kind": {}
  }
}
```

## Prima consegna richiesta

Prima genera almeno tutte le capacita del Monaco 2024 dal livello 1 al 20, includendo le sottoclassi se disponibili.

Poi useremo lo stesso formato per Ranger, Paladino e le altre classi.

## Focus immediato

Fai particolare attenzione al Monaco perche mi serve per un personaggio Monaco livello 3, Guerriero degli Elementi.

Deve includere almeno:

- Arti Marziali
- Difesa senza Armatura
- Concentrazione da Monaco
- Raffica di Colpi
- Difesa Paziente
- Passo del Vento
- Metabolismo Straordinario
- Movimento senza Armatura
- Deviare Attacco
- Manipolare gli Elementi
- Sintonia Elementale

## Nota di prodotto

Questa app serve a giocare, non a leggere il manuale.

Ogni card deve aiutare il giocatore a decidere rapidamente cosa puo fare nel proprio turno:

- Che tipo di azione usa?
- Quanto costa?
- Quando si puo usare?
- Che gittata o area ha?
- Quanto dura?
- Che tiro, danno o CD richiede?
- Qual e l'effetto rapido?
- Quale descrizione sintetica posso aprire in accordion se mi serve?
