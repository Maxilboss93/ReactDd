# -*- coding: utf-8 -*-
import csv
import io
import json
import re
import shutil
import zipfile
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "generated" / "dnd5e2024_rules_catalogs_it"
ZIP_PATH = ROOT / "generated" / "dnd5e2024_rules_catalogs_it.zip"
EXTERNAL_ZIP_PATH = Path(r"C:\xampp\htdocs\Dd\dnd5e2024_rules_catalogs_it.zip")
SPELLS_SRC = Path(r"C:\xampp\htdocs\Dd\dnd2024_spells_it.json")
PDF_SRC = Path(r"C:\xampp\htdocs\Dd\D&D_5e24_Player's_Handbook_Manuale_del_Giocatore_CHQ_05_2025.pdf")


def slugify(value):
    replacements = {
        "à": "a", "è": "e", "é": "e", "ì": "i", "ò": "o", "ù": "u",
        "À": "a", "È": "e", "É": "e", "Ì": "i", "Ò": "o", "Ù": "u",
        "'": "", "’": "", '"': "",
    }
    for src, dst in replacements.items():
        value = value.replace(src, dst)
    return re.sub(r"[^a-zA-Z0-9]+", "-", value.lower()).strip("-")


def rows(text):
    return list(csv.DictReader(io.StringIO(text.strip()), delimiter="|"))


def prereq(category, code):
    if code:
        parts = code.split(",")
        result = []
        for part in parts:
            part = part.strip()
            if part == "spellcasting":
                result.append({"type": "feature_any", "ids": ["incantesimi", "magia_del_patto"]})
            elif part == "fighting_style":
                result.append({"type": "feature", "id": "stile_di_combattimento"})
            elif part.startswith("level"):
                result.append({"type": "character_level", "min": int(part.replace("level", ""))})
            elif part.startswith("ability_any:"):
                bits = part.split(":")
                result.append({"type": "ability_any", "abilities": bits[1].split("/"), "min": int(bits[2])})
            elif part.startswith("ability:"):
                bits = part.split(":")
                result.append({"type": "ability", "ability": bits[1], "min": int(bits[2])})
            elif part.startswith("proficiency:"):
                result.append({"type": "proficiency", "id": part.split(":")[1]})
        return result

    if category == "Origini":
        return []
    if category == "Generale":
        return [{"type": "character_level", "min": 4}]
    if category == "Stile di combattimento":
        return [{"type": "feature", "id": "stile_di_combattimento"}]
    if category == "Dono epico":
        return [{"type": "character_level", "min": 19}]
    return []


FEATS_TSV = """
name|category|pages|repeatable|tags|prereq|summary
Abile|Origini|203|yes|competenza,strumenti||Ottiene tre competenze tra abilita e strumenti.
Aggressore selvaggio|Origini|203||armi,danni||Migliora una volta per turno l'affidabilita dei danni con arma.
Allerta|Origini|203||iniziativa||Migliora iniziativa e scambio tattico con un alleato.
Fortunato|Origini|204||risorsa,d20||Aggiunge punti fortuna spendibili su prove con d20 e attacchi contro il personaggio.
Guaritore|Origini|204||cura,dadi_vita||Migliora l'uso della borsa del guaritore e alcune cure.
Iniziato alla magia|Origini|204|yes|magia,incantesimi||Concede due trucchetti e un incantesimo di 1 livello da una lista scelta.
Lavoro manuale|Origini|204||strumenti,crafting||Concede strumenti da artigiano, sconto e piccole fabbricazioni.
Lottatore da taverna|Origini|205||colpo_senz_armi,improvvisate||Migliora colpi senz'armi, armi improvvisate e spinte.
Musicista|Origini|205||strumenti,ispirazione||Concede strumenti musicali e Ispirazione eroica dopo riposi.
Robusto|Origini|205||pf||Aumenta i punti ferita massimi e continua a scalarli con i livelli.
Abilita impeccabile|Generale|205||competenza,maestria,asi||Aumenta una caratteristica, aggiunge una competenza e una maestria.
Adepto elementale|Generale|205|yes|magia,danno_elementale,asi|level4,spellcasting|Potenzia un tipo di danno elementale per gli incantesimi.
Appostato|Generale|205||furtivita,vista_cieca,asi|level4,ability:dex:13|Migliora furtivita in combattimento e concede vista cieca breve.
Atleta|Generale|205||movimento,scalata,asi|level4,ability_any:str/dex:13|Aumenta mobilita fisica, scalata e recupero da prono.
Attore|Generale|205,206||sociale,inganno,asi|level4,ability:cha:13|Migliora impersonificazione e imitazione.
Aumento dei Punteggi di Caratteristica|Generale|206|yes|asi|level4|Aumenta una caratteristica di 2 o due caratteristiche di 1, massimo 20.
Bisturi da battaglia|Generale|206||armi,taglienti,asi|level4|Specializzazione sui danni taglienti e controllo del bersaglio.
Carica|Generale|206||movimento,mischia,asi|level4,ability_any:str/dex:13|Potenzia scatto e impatto dopo movimento in linea retta.
Cecchino magico|Generale|206||magia,gittata,copertura,asi|level4,spellcasting|Migliora tiri per colpire con incantesimi, copertura e distanza.
Combattente a due armi|Generale|206||armi,due_armi,asi|level4,ability_any:str/dex:13|Migliora il combattimento con due armi leggere e l'estrazione rapida.
Combattente in sella|Generale|206||cavalcatura,asi|level4|Migliora efficacia e difese mentre si combatte in sella.
Competenza nelle armi da guerra|Generale|202||armi,competenza|level4|Concede o amplia competenze con armi da guerra.
Condottiero ispiratore|Generale|207||supporto,pf_temporanei,asi|level4,ability_any:wis/cha:13|Ispira il gruppo dopo riposi e migliora Saggezza o Carisma.
Contaminazione fatata|Generale|202||magia,fey,asi|level4|Talento magico legato alla Selva Fatata.
Contaminazione oscura|Generale|202||magia,ombra,asi|level4|Talento magico legato a ombre e influenza occulta.
Corazze leggere|Generale|202||armature,competenza,asi|level4|Migliora accesso o uso delle armature leggere.
Corazze medie|Generale|202||armature,competenza,asi|level4|Migliora accesso o uso delle armature medie.
Corazze pesanti|Generale|202||armature,competenza,asi|level4|Migliora accesso o uso delle armature pesanti.
Cuoco|Generale|208||strumenti,cura,riposo,asi|level4|Usa utensili da cuoco per benefici durante il riposo.
Duellante difensivo|Generale|203||reazione,difesa,armi|level4|Opzione difensiva reattiva in mischia.
Esperto di balestre|Generale|203||balestre,armi,distanza|level4|Migliora uso tattico delle balestre.
Incantatore da guerra|Generale|208||concentrazione,magia,reazione|level4,spellcasting|Migliora concentrazione e uso di magia in combattimento.
Incantatore rituale|Generale|203||rituali,magia|level4,spellcasting|Apre accesso a incantesimi rituali e utilita magica.
Lottatore|Generale|203||lotta,colpo_senz_armi|level4|Migliora lotta, presa e controllo fisico.
Maestria dei veleni|Generale|209||veleni,crafting,asi|level4|Migliora uso, creazione e applicazione dei veleni.
Maestro d'armi possenti|Generale|209||armi_pesanti,danni,asi|level4,ability:str:13|Specializzazione con armi pesanti e colpi potenti.
Maestro d'armi|Generale|203||armi,padronanza,asi|level4|Amplia competenze e padronanze con le armi.
Maestro degli scudi|Generale|203||scudi,difesa,asi|level4|Migliora uso attivo e difensivo dello scudo.
Maestro delle armature medie|Generale|210||armature_medie,furtivita,asi|level4,proficiency:armature_medie|Migliora mobilita e furtivita in armatura media.
Maestro delle armature pesanti|Generale|210||armature_pesanti,difesa,asi|level4,proficiency:armature_pesanti|Migliora resistenza mentre si indossano armature pesanti.
Maestro delle armi su asta|Generale|210||armi_su_asta,reazione,bonus_action,asi|level4|Aggiunge attacchi e reazioni con armi ad asta o portata.
Martello vivente|Generale|210||contundenti,spinta,asi|level4|Specializzazione su danni contundenti e spinte.
Mente acuta|Generale|210||studio,conoscenza,asi|level4,ability:int:13|Migliora Intelligenza, conoscenze e azione Studio.
Osservatore|Generale|210||percezione,ricerca,asi|level4,ability_any:int/wis:13|Migliora osservazione, ricerca e competenze percettive.
Rapidita|Generale|210,211||movimento,difesa,asi|level4,ability_any:dex/con:13|Aumenta velocita e facilita movimento tattico.
Resiliente|Generale|211||tiro_salvezza,asi|level4|Aumenta una caratteristica e concede competenza nel relativo tiro salvezza.
Sentinella|Generale|211||reazione,opportunita,controllo,asi|level4,ability_any:str/dex:13|Blocca movimento e punisce chi ignora il personaggio.
Sterminatore di maghi|Generale|211||anti_magia,concentrazione,asi|level4|Disturba concentrazione e migliora difese mentali contro magia.
Stile penetrante|Generale|211||perforanti,critico,asi|level4|Specializzazione sui danni perforanti e critici.
Telecinesi|Generale|211||magia,mano_magica,bonus_action,asi|level4|Concede mano magica migliorata e spinta telecinetica.
Telepatia|Generale|211,212||telepatia,magia,asi|level4|Concede comunicazione telepatica e individuazione dei pensieri.
Tenace|Generale|212||pf,dadi_vita,morte,asi|level4|Migliora sopravvivenza, tiri contro morte e uso dei Dadi Vita.
Tiratore scelto|Generale|212||armi_distanza,copertura,gittata,asi|level4,ability:dex:13|Migliora attacchi a distanza con armi, copertura e gittate lunghe.
Combattere alla cieca|Stile di combattimento|212||vista_cieca|fighting_style|Concede vista cieca a breve raggio.
Combattere con armi da lancio|Stile di combattimento|212||armi_da_lancio,danni|fighting_style|Bonus ai danni con armi da lancio.
Combattere con armi possenti|Stile di combattimento|212||due_mani,danni|fighting_style|Rende piu affidabili i danni con armi a due mani o versatili.
Combattere con due armi|Stile di combattimento|212||due_armi,danni|fighting_style|Aggiunge modificatore ai danni dell'attacco extra con arma leggera.
Combattere disarmato|Stile di combattimento|212||colpo_senz_armi,lotta|fighting_style|Migliora danni senz'armi e pressione sui bersagli afferrati.
Difesa|Stile di combattimento|212||armature,ca|fighting_style|Aggiunge +1 alla CA mentre si indossa armatura.
Duellare|Stile di combattimento|212||mischia,danni|fighting_style|Bonus ai danni con arma da mischia a una mano.
Intercettazione|Stile di combattimento|213||reazione,protezione|fighting_style|Riduce danni subiti da una creatura vicina usando reazione.
Protezione|Stile di combattimento|213||scudo,reazione,difesa|fighting_style|Con scudo, impone svantaggio agli attacchi contro un alleato vicino.
Tiro|Stile di combattimento|213||armi_distanza|fighting_style|Aggiunge +2 ai tiri per colpire con armi a distanza.
Dono dell'abilita|Dono epico|213||epico,competenze,maestria|level19|Dono epico orientato a competenze e maestrie.
Dono delle abilita di combattimento|Dono epico|213||epico,combattimento|level19|Dono epico orientato all'affidabilita offensiva.
Dono del fato|Dono epico|213||epico,d20|level19|Manipola una prova con d20 con bonus o penalita.
Dono dell'offensiva irresistibile|Dono epico|213||epico,danni|level19|Ignora resistenze fisiche e aumenta l'impatto dei colpi migliori.
Dono del recupero|Dono epico|213||epico,cura|level19|Recupero potente quando si cade a 0 PF e riserva di cura.
Dono della resistenza all'energia|Dono epico|214||epico,resistenze|level19|Concede resistenze energetiche e reazione di deviazione.
Dono del richiamo degli incantesimi|Dono epico|214||epico,magia|level19,spellcasting|Permette di non consumare alcuni slot con un tiro favorevole.
Dono dello spirito notturno|Dono epico|214||epico,ombra|level19|Potenzia furtivita e difese in oscurita o luce fioca.
Dono della tempra|Dono epico|214||epico,pf|level19|Aumenta molto i PF massimi e migliora le guarigioni ricevute.
Dono della velocita|Dono epico|214||epico,movimento|level19|Migliora velocita e fuga rapida.
Dono del viaggio dimensionale|Dono epico|214||epico,teletrasporto|level19|Teletrasporto breve dopo attacco o magia.
Dono della vista pura|Dono epico|214||epico,vista_pura|level19|Concede vista pura a medio raggio.
"""


WEAPONS_TSV = """
name|proficiency|kind|damage|damage_type|properties|mastery|weight|cost
Ascia|semplice|mischia|1d6|taglienti|lancio 6/18,leggera|Vessazione|1 kg|5 mo
Bastone ferrato|semplice|mischia|1d6|contundenti|versatile 1d8|Rovesciamento|2 kg|2 ma
Falcetto|semplice|mischia|1d4|taglienti|leggera|Graffio|1 kg|1 mo
Giavellotto|semplice|mischia|1d6|perforanti|lancio 9/36|Lentezza|1 kg|5 ma
Lancia|semplice|mischia|1d6|perforanti|lancio 6/18,versatile 1d8|Prosciugamento|1.5 kg|1 mo
Martello leggero|semplice|mischia|1d4|contundenti|lancio 6/18,leggera|Graffio|1 kg|2 mo
Mazza|semplice|mischia|1d6|contundenti||Prosciugamento|2 kg|5 mo
Pugnale|semplice|mischia|1d4|perforanti|accurata,lancio 6/18,leggera|Graffio|0.5 kg|2 mo
Randello pesante|semplice|mischia|1d8|contundenti|due mani|Spinta|5 kg|2 ma
Randello|semplice|mischia|1d4|contundenti|leggera|Lentezza|1 kg|1 ma
Arco corto|semplice|distanza|1d6|perforanti|due mani,munizioni 24/96 freccia|Vessazione|1 kg|25 mo
Balestra leggera|semplice|distanza|1d8|perforanti|due mani,munizioni 24/96 quadrello,ricarica|Lentezza|2.5 kg|25 mo
Dardo|semplice|distanza|1d4|perforanti|accurata,lancio 6/18|Vessazione|0.125 kg|5 mr
Fionda|semplice|distanza|1d4|contundenti|munizioni 9/36 proiettile|Lentezza||1 ma
Alabarda|da guerra|mischia|1d10|taglienti|due mani,pesante,portata|Doppio fendente|3 kg|20 mo
Ascia bipenne|da guerra|mischia|1d12|taglienti|due mani,pesante|Doppio fendente|3.5 kg|30 mo
Ascia da battaglia|da guerra|mischia|1d8|taglienti|versatile 1d10|Rovesciamento|2 kg|10 mo
Falcione|da guerra|mischia|1d10|taglienti|due mani,pesante,portata|Colpo di striscio|3 kg|20 mo
Frusta|da guerra|mischia|1d4|taglienti|accurata,portata|Lentezza|1.5 kg|2 mo
Lancia da cavaliere|da guerra|mischia|1d10|perforanti|due mani eccetto in sella,pesante,portata|Rovesciamento|3 kg|10 mo
Maglio|da guerra|mischia|2d6|contundenti|due mani,pesante|Rovesciamento|5 kg|10 mo
Martello da guerra|da guerra|mischia|1d8|contundenti|versatile 1d10|Spinta|2.5 kg|15 mo
Mazza chiodata|da guerra|mischia|1d8|perforanti||Prosciugamento|2 kg|15 mo
Mazza frusto|da guerra|mischia|1d8|contundenti||Prosciugamento|1 kg|10 mo
Picca|da guerra|mischia|1d10|perforanti|due mani,pesante,portata|Spinta|9 kg|5 mo
Scimitarra|da guerra|mischia|1d6|taglienti|accurata,leggera|Graffio|1.5 kg|25 mo
Spada corta|da guerra|mischia|1d6|perforanti|accurata,leggera|Vessazione|1 kg|10 mo
Spada lunga|da guerra|mischia|1d8|taglienti|versatile 1d10|Prosciugamento|1.5 kg|15 mo
Spadone|da guerra|mischia|2d6|taglienti|due mani,pesante|Colpo di striscio|3 kg|50 mo
Stocco|da guerra|mischia|1d8|perforanti|accurata|Vessazione|1 kg|25 mo
Tridente|da guerra|mischia|1d8|perforanti|lancio 6/18,versatile 1d10|Rovesciamento|2 kg|5 mo
Piccone da guerra|da guerra|mischia|1d8|perforanti|versatile 1d10|Prosciugamento|1 kg|5 mo
Arco lungo|da guerra|distanza|1d8|perforanti|due mani,munizioni 45/180 freccia,pesante|Lentezza|1 kg|50 mo
Balestra a mano|da guerra|distanza|1d6|perforanti|leggera,munizioni 9/36 quadrello,ricarica|Vessazione|1.5 kg|75 mo
Balestra pesante|da guerra|distanza|1d10|perforanti|due mani,munizioni 30/120 quadrello,pesante,ricarica|Spinta|9 kg|50 mo
Cerbottana|da guerra|distanza|1|perforante|munizioni 7/30 ago,ricarica|Vessazione|0.5 kg|10 mo
Moschetto|da guerra|distanza|1d12|perforanti|due mani,munizioni 12/36 proiettile,ricarica|Lentezza|5 kg|500 mo
Pistola|da guerra|distanza|1d10|perforanti|munizioni 9/27 proiettile,ricarica|Vessazione|1.5 kg|250 mo
"""


ARMORS_TSV = """
name|category|armor_class|strength|stealth_disadvantage|weight|cost
Armatura imbottita|leggera|11 + mod Des||yes|4 kg|5 mo
Armatura di cuoio|leggera|11 + mod Des|||5 kg|10 mo
Armatura di cuoio borchiato|leggera|12 + mod Des|||6.5 kg|45 mo
Armatura di pelle|media|12 + mod Des max 2|||6 kg|10 mo
Giaco di maglia|media|13 + mod Des max 2|||10 kg|50 mo
Corazza a scaglie|media|14 + mod Des max 2||yes|22.5 kg|50 mo
Corazza di piastre|media|14 + mod Des max 2|||10 kg|400 mo
Mezza armatura|media|15 + mod Des max 2||yes|20 kg|750 mo
Corazza ad anelli|pesante|14||yes|20 kg|30 mo
Cotta di maglia|pesante|16|For 13|yes|27.5 kg|75 mo
Corazza a strisce|pesante|17|For 15|yes|30 kg|200 mo
Armatura a piastre|pesante|18|For 15|yes|32.5 kg|1500 mo
"""


TOOLS_TSV = """
name|category|ability|weight|cost
Scorte da alchimista|artigiano|Intelligenza|4 kg|50 mo
Scorte da birraio|artigiano|Intelligenza|4.5 kg|20 mo
Scorte da calligrafo|artigiano|Destrezza|2.5 kg|10 mo
Strumenti da calzolaio|artigiano|Destrezza|2.5 kg|5 mo
Strumenti da cartografo|artigiano|Saggezza|3 kg|15 mo
Strumenti da conciatore|artigiano|Destrezza|2.5 kg|5 mo
Strumenti da fabbro|artigiano|Forza|4 kg|20 mo
Strumenti da falegname|artigiano|Forza|3 kg|8 mo
Strumenti da gioielliere|artigiano|Intelligenza|1 kg|25 mo
Strumenti da intagliatore|artigiano|Destrezza|2.5 kg|1 mo
Strumenti da inventore|artigiano|Destrezza|5 kg|50 mo
Strumenti da muratore|artigiano|Forza|4 kg|10 mo
Strumenti da pittore|artigiano|Saggezza|2.5 kg|10 mo
Strumenti da soffiatore|artigiano|Intelligenza|2.5 kg|30 mo
Strumenti da tessitore|artigiano|Destrezza|2.5 kg|1 mo
Strumenti da vasaio|artigiano|Intelligenza|1.5 kg|10 mo
Utensili da cuoco|artigiano|Saggezza|4 kg|1 mo
Arnesi da falsario|altro|Destrezza|2.5 kg|15 mo
Arnesi da scasso|altro|Destrezza|0.5 kg|25 mo
Borsa da erborista|altro|Intelligenza|1.5 kg|5 mo
Gioco|altro|Saggezza||variabile
Sostanze da avvelenatore|altro|Intelligenza|1 kg|50 mo
Strumenti da navigatore|altro|Saggezza|1 kg|25 mo
Strumento musicale|altro|Carisma|variabile|variabile
Trucchi per il camuffamento|altro|Carisma|1.5 kg|25 mo
"""


GEAR_TSV = """
name|weight|cost
Abiti da viaggiatore|2 kg|2 mo
Abiti eleganti|3 kg|15 mo
Acciarino e pietra focaia|0.5 kg|5 ma
Acido|0.5 kg|25 mo
Acqua santa|0.5 kg|25 mo
Ampolla|0.5 kg|2 mr
Antitossina||50 mo
Ariete portatile|17.5 kg|4 mo
Asta|3.5 kg|5 mr
Attrezzi da scalatore|6 kg|25 mo
Barile|35 kg|2 mo
Borsa del guaritore|1.5 kg|5 mo
Borsa per componenti|1 kg|25 mo
Borsa|0.5 kg|5 ma
Bottiglia di vetro|1 kg|2 mo
Brocca|2 kg|2 mr
Campanella||1 mo
Candela||1 mr
Cannocchiale|0.5 kg|1000 mo
Carrucola e paranco|2.5 kg|1 mo
Carta||2 ma
Catena|5 kg|5 mo
Cesto|1 kg|4 ma
Coperta|1.5 kg|5 ma
Corda|2.5 kg|1 mo
Costume|2 kg|5 mo
Custodia per mappe o pergamene|0.5 kg|1 mo
Custodia per quadrelli da balestra|0.5 kg|1 mo
Dotazione da avventuriero|27.5 kg|12 mo
Dotazione da diplomatico|19.5 kg|39 mo
Dotazione da esploratore|27.5 kg|10 mo
Dotazione da intrattenitore|29 kg|40 mo
Dotazione da sacerdote|14 kg|33 mo
Dotazione da scassinatore|19 kg|16 mo
Dotazione da studioso|11 kg|40 mo
Faretra|0.5 kg|1 mo
Fiala||1 mo
Fischietto da richiamo||5 mr
Focus arcano|variabile|variabile
Focus druidico|variabile|variabile
Forziere|12.5 kg|5 mo
Fuoco dell'alchimista|0.5 kg|50 mo
Giaciglio|3.5 kg|1 mo
Inchiostro||10 mo
Lampada|0.5 kg|5 ma
Lanterna a lente sporgente|1 kg|10 mo
Lanterna schermabile|1 kg|5 mo
Lente d'ingrandimento||100 mo
Libro|2.5 kg|25 mo
Manette|3 kg|2 mo
Mappa||1 mo
Munizioni|variabile|variabile
Olio|0.5 kg|1 ma
Otre|2.5 kg|2 ma
Pala|2.5 kg|2 mo
Pennino||2 mr
Pentola di ferro|5 kg|2 mo
Pergamena||1 ma
Pergamena magica - trucchetto||30 mo
Pergamena magica - livello 1||50 mo
Piede di porco|2.5 kg|2 mo
Pozione di guarigione|0.25 kg|50 mo
Profumo||5 mo
Rampino|2 kg|2 mo
Razioni|1 kg|5 ma
Rete|1.5 kg|1 mo
Sacco|0.25 kg|1 mr
Scala a pioli|12.5 kg|1 ma
Secchio|1 kg|5 mr
Serratura|0.5 kg|10 mo
Sfere metalliche|1 kg|1 mo
Simbolo sacro|variabile|variabile
Spago||1 ma
Specchio|0.25 kg|5 mo
Spuntoni di ferro|2.5 kg|1 mo
Tagliola|12.5 kg|5 mo
Tenda|10 kg|2 mo
Torcia|0.5 kg|1 mr
Triboli|1 kg|1 mo
Tunica|2 kg|1 mo
Veleno base||100 mo
Zaino|2.5 kg|2 mo
"""


def parse_pages(value):
    return [int(x) for x in value.split(",") if x.strip()]


def write_json(relative_path, data):
    path = OUT_DIR / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    feats = []
    for row in rows(FEATS_TSV):
        choices = []
        effects = []
        if row["name"] == "Aumento dei Punteggi di Caratteristica":
            choices = [{"type": "ability_score_increase", "modes": [{"count": 1, "amount": 2}, {"count": 2, "amount": 1}], "max": 20}]
        elif row["name"] == "Resiliente":
            choices = [{"type": "ability_without_save_proficiency", "increase": 1}]
        elif row["name"] == "Fortunato":
            effects = [{"type": "resource", "id": "luck_points", "scales_with": "proficiency_bonus", "resetOn": "long_rest"}]
        feats.append({
            "id": slugify(row["name"]),
            "name": row["name"],
            "category": row["category"],
            "repeatable": row["repeatable"] == "yes",
            "prerequisites": prereq(row["category"], row["prereq"]),
            "tags": [x for x in row["tags"].split(",") if x],
            "choices": choices,
            "effects": effects,
            "summary": row["summary"],
            "source": {"manual": "Manuale del Giocatore", "edition": "2024", "language": "it", "pages_pdf": parse_pages(row["pages"])},
        })

    weapons = [{
        "id": slugify(row["name"]),
        "name": row["name"],
        "proficiency": row["proficiency"],
        "kind": row["kind"],
        "damage": {"dice": row["damage"], "type": row["damage_type"]},
        "properties": [x for x in row["properties"].split(",") if x],
        "mastery": row["mastery"],
        "weight": row["weight"] or None,
        "cost": row["cost"] or None,
        "source": {"pages_pdf": [218]},
    } for row in rows(WEAPONS_TSV)]

    armors = [{
        "id": slugify(row["name"]),
        "name": row["name"],
        "category": row["category"],
        "armor_class": row["armor_class"],
        "strength_requirement": row["strength"] or None,
        "stealth_disadvantage": row["stealth_disadvantage"] == "yes",
        "weight": row["weight"] or None,
        "cost": row["cost"] or None,
        "source": {"pages_pdf": [222]},
    } for row in rows(ARMORS_TSV)]

    shields = [{
        "id": "scudo",
        "name": "Scudo",
        "category": "scudo",
        "armor_class_bonus": 2,
        "equip_action": "azione di Utilizzo",
        "weight": "3 kg",
        "cost": "10 mo",
        "source": {"pages_pdf": [222]},
    }]

    tools = [{
        "id": slugify(row["name"]),
        "name": row["name"],
        "category": row["category"],
        "ability": row["ability"],
        "weight": row["weight"] or None,
        "cost": row["cost"] or None,
        "source": {"pages_pdf": [223, 224]},
    } for row in rows(TOOLS_TSV)]

    gear = [{
        "id": slugify(row["name"]),
        "name": row["name"],
        "category": "equipaggiamento_avventura",
        "weight": row["weight"] or None,
        "cost": row["cost"] or None,
        "source": {"pages_pdf": [225, 226, 227, 228, 229, 230, 231, 232]},
    } for row in rows(GEAR_TSV)]

    mounts = [
        {"id": slugify(name), "name": name, "carry_capacity": cap, "cost": cost, "source": {"pages_pdf": [232]}}
        for name, cap, cost in [
            ("Cammello", "225 kg", "50 mo"), ("Cavallo da galoppo", "240 kg", "75 mo"),
            ("Cavallo da guerra", "270 kg", "400 mo"), ("Cavallo da tiro", "270 kg", "50 mo"),
            ("Elefante", "660 kg", "200 mo"), ("Mastino", "97.5 kg", "25 mo"),
            ("Mulo", "210 kg", "8 mo"), ("Pony", "112.5 kg", "30 mo"),
        ]
    ]
    vehicles = [
        {"id": slugify(name), "name": name, "category": category, "weight": weight, "cost": cost, "source": {"pages_pdf": [232, 233]}}
        for name, category, weight, cost in [
            ("Biga", "veicolo_da_tiro", "50 kg", "250 mo"), ("Carretto", "veicolo_da_tiro", "100 kg", "15 mo"),
            ("Carro", "veicolo_da_tiro", "200 kg", "35 mo"), ("Carrozza", "veicolo_da_tiro", "300 kg", "100 mo"),
            ("Slitta", "veicolo_da_tiro", "150 kg", "20 mo"), ("Barca a remi", "imbarcazione", None, "50 mo"),
            ("Barcone", "imbarcazione", None, "3000 mo"), ("Dirigibile", "veicolo_aereo", None, "40000 mo"),
            ("Galea", "imbarcazione", None, "30000 mo"), ("Nave da guerra", "imbarcazione", None, "25000 mo"),
            ("Nave lunga", "imbarcazione", None, "10000 mo"), ("Nave a vela", "imbarcazione", None, "10000 mo"),
        ]
    ]
    services = [
        {"id": slugify(name), "name": name, "category": category, "cost": cost, "source": {"pages_pdf": [233, 234]}}
        for name, category, cost in [
            ("Stile di vita miserabile", "lifestyle", "gratis"), ("Stile di vita squallido", "lifestyle", "1 ma al giorno"),
            ("Stile di vita povero", "lifestyle", "2 ma al giorno"), ("Stile di vita modesto", "lifestyle", "1 mo al giorno"),
            ("Stile di vita agiato", "lifestyle", "2 mo al giorno"), ("Stile di vita ricco", "lifestyle", "4 mo al giorno"),
            ("Stile di vita aristocratico", "lifestyle", "10 mo al giorno"), ("Gregario abile", "hireling", "2 mo al giorno"),
            ("Gregario inesperto", "hireling", "2 ma al giorno"), ("Messaggero", "hireling", "2 mr per 1.5 km"),
            ("Passaggio in nave", "travel", "1 ma per 1.5 km"), ("Pedaggio stradale o ingresso", "travel", "1 mr"),
            ("Viaggio in carrozza dentro una citta", "travel", "1 mr per 1.5 km"), ("Viaggio in carrozza tra cittadine", "travel", "3 mr per 1.5 km"),
        ]
    ]

    counts = {
        "feats": len(feats),
        "weapons": len(weapons),
        "armors": len(armors),
        "shields": len(shields),
        "tools": len(tools),
        "adventuring_gear": len(gear),
        "mounts": len(mounts),
        "vehicles": len(vehicles),
        "services": len(services),
    }

    manifest = {
        "title": "D&D 5e 2024 - Cataloghi regole base IT",
        "schema_version": 1,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "language": "it",
        "sources": {"manual_pdf": str(PDF_SRC), "spells_json": str(SPELLS_SRC)},
        "copyright_note": "Cataloghi strutturali con descrizioni brevi/parafrasate per uso nel frontend; non contiene trascrizioni estese del manuale.",
        "counts": counts,
    }

    index = [
        {"id": "feats", "name": "Talenti", "file": "rules/feats/feats.json", "count": len(feats)},
        {"id": "weapons", "name": "Armi", "file": "rules/equipment/weapons.json", "count": len(weapons)},
        {"id": "armors", "name": "Armature", "file": "rules/equipment/armors.json", "count": len(armors)},
        {"id": "shields", "name": "Scudi", "file": "rules/equipment/shields.json", "count": len(shields)},
        {"id": "tools", "name": "Strumenti", "file": "rules/equipment/tools.json", "count": len(tools)},
        {"id": "adventuring_gear", "name": "Equipaggiamento d'avventura", "file": "rules/equipment/adventuring_gear.json", "count": len(gear)},
        {"id": "mounts_vehicles_services", "name": "Cavalcature, veicoli e servizi", "file": "rules/equipment/mounts_vehicles_services.json", "count": len(mounts) + len(vehicles) + len(services)},
        {"id": "spells", "name": "Incantesimi", "file": "rules/spells/dnd2024_spells_it.json", "source": "copied"},
    ]

    write_json("manifest.json", manifest)
    write_json("indexes/catalogs.index.json", index)
    write_json("rules/feats/feats.json", {"meta": {"count": len(feats), "source_pages_pdf": list(range(202, 215))}, "items": feats})
    write_json("rules/equipment/weapons.json", {"meta": {"count": len(weapons), "source_pages_pdf": [218]}, "items": weapons})
    write_json("rules/equipment/armors.json", {"meta": {"count": len(armors), "source_pages_pdf": [222]}, "items": armors})
    write_json("rules/equipment/shields.json", {"meta": {"count": len(shields), "source_pages_pdf": [222]}, "items": shields})
    write_json("rules/equipment/tools.json", {"meta": {"count": len(tools), "source_pages_pdf": [223, 224]}, "items": tools})
    write_json("rules/equipment/adventuring_gear.json", {"meta": {"count": len(gear), "source_pages_pdf": list(range(225, 233))}, "items": gear})
    write_json("rules/equipment/mounts_vehicles_services.json", {"meta": {"source_pages_pdf": [232, 233, 234]}, "mounts": mounts, "vehicles": vehicles, "services": services})
    write_json("schemas/feat.schema.json", {"title": "FeatCatalogIt", "type": "object", "required": ["id", "name", "category", "prerequisites"]})
    write_json("schemas/weapon.schema.json", {"title": "WeaponCatalogIt", "type": "object", "required": ["id", "name", "proficiency", "kind", "damage"]})
    write_json("schemas/equipment.schema.json", {"title": "EquipmentCatalogIt", "type": "object", "required": ["id", "name", "category"]})

    (OUT_DIR / "rules" / "spells").mkdir(parents=True, exist_ok=True)
    shutil.copy2(SPELLS_SRC, OUT_DIR / "rules" / "spells" / "dnd2024_spells_it.json")
    (OUT_DIR / "README.txt").write_text(
        "D&D 5e 2024 - Cataloghi regole base IT\n\n"
        "Contiene talenti, armi, armature, scudi, strumenti, equipaggiamento, cavalcature/veicoli/servizi e una copia del JSON incantesimi fornito.\n"
        "Le descrizioni sono brevi e parafrasate: il pacchetto e pensato per filtri, wizard di creazione personaggio e level-up nel frontend React.\n",
        encoding="utf-8",
    )

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    ZIP_PATH.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in OUT_DIR.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(OUT_DIR.parent).as_posix())
    shutil.copy2(ZIP_PATH, EXTERNAL_ZIP_PATH)

    print(json.dumps({"output_dir": str(OUT_DIR), "zip": str(ZIP_PATH), "external_zip": str(EXTERNAL_ZIP_PATH), "counts": counts}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
