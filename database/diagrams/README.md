# Diagrammi DB D&D App

File principale:

```txt
database/diagrams/dnd_app_db_design.drawio
```

Aprilo con diagrams.net / draw.io.

Contiene 6 pagine:

1. **ER Core DB** - vista generale delle aree principali del database.
2. **ER Modificatori** - dettaglio del nuovo principio dei modificatori centralizzati.
3. **Attori e Contesti** - SuperAdmin, Master, Player e aree applicative.
4. **Flussi Creazione e Level Up** - come creazione lv0 e progressione scrivono eventi/scelte/modificatori.
5. **Architettura Software** - separazione frontend, API futura, servizi dominio, DB e snapshot.
6. **Copertura Manuale PHB** - mappa tra blocchi del Manuale del Giocatore 2024 e tabelle DB v2.

Il file e pensato come supporto alla progettazione, non come fonte eseguibile.
La migration SQL collegata e:

```txt
database/migrations/001_rebuild_dnd_app_v2.sql
```
