# Branch test grafici

Aggiornato: 21 luglio 2026

Questo file serve come promemoria rapido per mostrare e confrontare i branch grafici dell'app.

## Branch da far vedere

| Branch | Stato | Ultimo commit controllato | Obiettivo |
| --- | --- | --- | --- |
| `200726_grafica` | riferimento storico | `fa1ebda` | Base precedente con menu/tile blu puliti. Utile come confronto neutro. |
| `210726_applicazione_icone` | pushato | `79b75aa` | Branch tecnico con set icone applicato: classi, magie, scuole, azioni, statistiche, utility ed equipaggiamento finale. |
| `210726_grafica2` | pushato | `d115c1a` | Test stile Stronghold Legends: metallo, armature medievali, bottoni tipo stendardi. |
| `210726_grafica3` | pushato | `3184f65` | Test stile foresta fantasy: verdi silvani, pannelli/menu con idea di albero e rami. |
| `210726_grafica4` | pushato | `7fd57c3` | Test stile libro invecchiato/doodle vintage fantasy: quasi bianco e nero, carta caffe, font piu manoscritto. |

## Allineamenti gia fatti

- Tutti i branch `210726_graficaX` hanno ricevuto le icone equipaggiamento finali.
- I menu e i tasti principali sono stati riallineati tra i branch grafici.
- I subtabs usano colonne adattive, quindi non resta una colonna vuota quando ci sono solo due voci.
- La bottom navigation ha safe-area e z-index coerenti sui branch grafici aggiornati.
- Le icone SVG restano mostrate bianche tramite CSS.

## Cosa valutare con il collega

- Quale identita visiva e piu adatta all'app principale.
- Leggibilita su mobile: titoli, bottom menu, subtabs, card e risorse.
- Coerenza delle icone dentro scheda personaggio, equipaggiamento, magie e statistiche.
- Differenza tra tema scenografico e tema pratico per uso frequente al tavolo.
- Se uno stile deve diventare base principale oppure restare come skin alternativa.

## Ordine consigliato di confronto

1. `200726_grafica` come baseline pulita.
2. `210726_applicazione_icone` per vedere solo l'impatto delle icone.
3. `210726_grafica2` per il test medievale/metallico.
4. `210726_grafica3` per il test foresta fantasy.
5. `210726_grafica4` per il test libro antico/doodle.

## Note rapide

- Il ramo ruling resta separato dai test grafici.
- I branch grafici sono pensati per confronto visivo, non per decidere nuove regole.
- Prima di scegliere il vincitore conviene guardare almeno: home, lista PG, dettaglio scheda, caratteristiche, poteri/incantesimi, equipaggiamento e risorse.
