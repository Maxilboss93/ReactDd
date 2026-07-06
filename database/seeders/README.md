# Seeders DB v2

Questi seeders vanno importati dopo:

```sql
database/migrations/001_rebuild_dnd_app_v2.sql
```

Ordine consigliato:

1. `010_seed_rules_core.sql`
2. `020_seed_catalog_from_json.sql`
3. `030_seed_demo_characters.sql`

## Cosa caricano

`010_seed_rules_core.sql`

- abilita;
- tipi di danno;
- condizioni;
- linguaggi;
- progressioni slot incantesimo: full caster, half caster, pact magic.

`020_seed_catalog_from_json.sql`

- 12 classi base;
- prerequisiti multiclasse;
- sottoclassi ricavate dal catalogo poteri;
- talenti dal JSON `feats.json`;
- equipaggiamento da JSON: armi, armature, scudi, strumenti, gear, cavalcature, veicoli, servizi;
- relazioni armi/proprieta e armi/maestrie;
- privilegi di classe e sottoclasse dal catalogo poteri;
- livelli classe 1-20 con bonus competenza e lista privilegi;
- effetti regola ad alto livello per privilegi e talenti;
- incantesimi dal JSON, con dati meccanici strutturati e lista classi.

Nota sugli incantesimi: il seeder non copia nel DB il testo descrittivo lungo del manuale. Carica nomi, livello, scuola, tempo, gittata, componenti, durata, concentrazione, rituale, meccaniche strutturate e lista classi.

`030_seed_demo_characters.sql`

- crea un utente locale `demo@dnd.local`;
- importa Shisui, Imbrathil ed Escanor dai JSON in `src/data/characters`;
- crea placeholder per specie/background mancanti dal catalogo;
- importa classi, sottoclassi quando riconosciute, caratteristiche base, competenze, risorse, incantesimi, slot, inventario e snapshot scheda.

## Rigenerazione

Per rigenerare gli SQL dai JSON:

```powershell
python database\seeders\generate_seeders.py
```

I file sono pensati per essere rieseguibili dove possibile tramite `ON DUPLICATE KEY UPDATE` o `WHERE NOT EXISTS`.
