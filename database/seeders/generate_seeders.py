from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "database" / "seeders"
GENERATED = ROOT / "generated"
RULES_DIR = GENERATED / "dnd5e2024_rules_catalogs_it" / "rules"
CHARACTERS_DIR = ROOT / "src" / "data" / "characters"


class Raw:
    def __init__(self, value: str) -> None:
        self.value = value


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def slug(value: str) -> str:
    replacements = {
        "à": "a",
        "è": "e",
        "é": "e",
        "ì": "i",
        "ò": "o",
        "ù": "u",
        "'": "_",
    }
    text = value.lower().strip()
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return re.sub(r"_+", "_", text).strip("_")


def q(value) -> str:
    if isinstance(value, Raw):
        return value.value
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def q_json(value) -> str:
    if value is None:
        return "NULL"
    return q(json.dumps(value, ensure_ascii=False, separators=(",", ":")))


def raw_json(value) -> Raw:
    return Raw(q_json(value))


def select_id(table: str, code: str) -> Raw:
    return Raw(f"(SELECT `id` FROM `{table}` WHERE `code` = {q(code)} LIMIT 1)")


def select_ability(code: str) -> Raw:
    return select_id("rule_abilities", code)


def insert_many(table: str, columns: list[str], rows: list[list], update_columns: list[str] | None = None) -> list[str]:
    if not rows:
        return []
    update_columns = update_columns or []
    lines: list[str] = []
    chunk_size = 80
    for start in range(0, len(rows), chunk_size):
        chunk = rows[start : start + chunk_size]
        col_sql = ", ".join(f"`{col}`" for col in columns)
        values_sql = ",\n".join(
            "(" + ", ".join(q(value) for value in row) + ")" for row in chunk
        )
        sql = f"INSERT INTO `{table}` ({col_sql}) VALUES\n{values_sql}"
        if update_columns:
            update_sql = ", ".join(f"`{col}` = VALUES(`{col}`)" for col in update_columns)
            sql += f"\nON DUPLICATE KEY UPDATE {update_sql}"
        sql += ";"
        lines.append(sql)
    return lines


def header(title: str) -> list[str]:
    return [
        f"-- {title}",
        "-- Generato da database/seeders/generate_seeders.py",
        "-- Importare dopo database/migrations/001_rebuild_dnd_app_v2.sql",
        "USE `dnd_app`;",
        "SET NAMES utf8mb4;",
        "SET FOREIGN_KEY_CHECKS = 1;",
        "",
        "START TRANSACTION;",
        "SET @phb_source_id = (SELECT `id` FROM `rule_sources` WHERE `code` = 'phb_2024_it' LIMIT 1);",
        "SET @homebrew_source_id = (SELECT `id` FROM `rule_sources` WHERE `code` = 'homebrew' LIMIT 1);",
        "",
    ]


def footer() -> list[str]:
    return ["", "COMMIT;", ""]


SKILLS = [
    ("acrobatics", "Acrobazia", "dex"),
    ("animal", "Addestrare Animali", "wis"),
    ("arcana", "Arcano", "int"),
    ("athletics", "Atletica", "str"),
    ("deception", "Inganno", "cha"),
    ("history", "Storia", "int"),
    ("insight", "Intuizione", "wis"),
    ("intimidation", "Intimidire", "cha"),
    ("investigation", "Investigazione", "int"),
    ("medicine", "Medicina", "wis"),
    ("nature", "Natura", "int"),
    ("perception", "Percezione", "wis"),
    ("performance", "Intrattenere", "cha"),
    ("persuasion", "Persuasione", "cha"),
    ("religion", "Religione", "int"),
    ("sleight", "Rapidita di Mano", "dex"),
    ("stealth", "Furtivita", "dex"),
    ("survival", "Sopravvivenza", "wis"),
]

DAMAGE_TYPES = [
    ("acido", "Acido"),
    ("contundenti", "Contundenti"),
    ("forza", "Forza"),
    ("freddo", "Freddo"),
    ("fuoco", "Fuoco"),
    ("fulmine", "Fulmine"),
    ("necrotici", "Necrotici"),
    ("perforanti", "Perforanti"),
    ("psichici", "Psichici"),
    ("radiosi", "Radiosi"),
    ("taglienti", "Taglienti"),
    ("tuono", "Tuono"),
    ("veleno", "Veleno"),
]

CONDITIONS = [
    ("accecato", "Accecato"),
    ("affascinato", "Affascinato"),
    ("afferrato", "Afferrato"),
    ("assordato", "Assordato"),
    ("avvelenato", "Avvelenato"),
    ("incapacitato", "Incapacitato"),
    ("intralciato", "Intralciato"),
    ("invisibile", "Invisibile"),
    ("paralizzato", "Paralizzato"),
    ("pietrificato", "Pietrificato"),
    ("privo_di_sensi", "Privo di sensi"),
    ("prono", "Prono"),
    ("spaventato", "Spaventato"),
    ("stordito", "Stordito"),
    ("sfinimento", "Sfinimento"),
]

LANGUAGES = [
    ("comune", "Comune", "standard"),
    ("draconico", "Draconico", "standard"),
    ("nanico", "Nanico", "standard"),
    ("elfico", "Elfico", "standard"),
    ("gigante", "Gigante", "standard"),
    ("gnomico", "Gnomico", "standard"),
    ("goblin", "Goblin", "standard"),
    ("halfling", "Halfling", "standard"),
    ("orchesco", "Orchesco", "standard"),
    ("abissale", "Abissale", "exotic"),
    ("celestiale", "Celestiale", "exotic"),
    ("profondo", "Gergo delle Profondita", "exotic"),
    ("infernale", "Infernale", "exotic"),
    ("primordiale", "Primordiale", "exotic"),
    ("silvano", "Silvano", "exotic"),
    ("sottocomune", "Sottocomune", "exotic"),
    ("druidico", "Druidico", "special"),
    ("cant_ladro", "Gergo Ladresco", "special"),
]

CLASS_DATA = {
    "Barbaro": {"code": "barbaro", "hit_die": 12, "primary": ["str"], "spellcasting": None},
    "Bardo": {"code": "bardo", "hit_die": 8, "primary": ["cha"], "spellcasting": {"progression": "full_caster", "ability": "cha", "preparation": "known"}},
    "Chierico": {"code": "chierico", "hit_die": 8, "primary": ["wis"], "spellcasting": {"progression": "full_caster", "ability": "wis", "preparation": "prepared"}},
    "Druido": {"code": "druido", "hit_die": 8, "primary": ["wis"], "spellcasting": {"progression": "full_caster", "ability": "wis", "preparation": "prepared"}},
    "Guerriero": {"code": "guerriero", "hit_die": 10, "primary": ["str", "dex"], "spellcasting": None},
    "Ladro": {"code": "ladro", "hit_die": 8, "primary": ["dex"], "spellcasting": None},
    "Mago": {"code": "mago", "hit_die": 6, "primary": ["int"], "spellcasting": {"progression": "full_caster", "ability": "int", "preparation": "prepared"}},
    "Monaco": {"code": "monaco", "hit_die": 8, "primary": ["dex", "wis"], "spellcasting": None},
    "Paladino": {"code": "paladino", "hit_die": 10, "primary": ["str", "cha"], "spellcasting": {"progression": "half_caster_class_level", "ability": "cha", "preparation": "prepared"}},
    "Ranger": {"code": "ranger", "hit_die": 10, "primary": ["dex", "wis"], "spellcasting": {"progression": "half_caster_class_level", "ability": "wis", "preparation": "prepared"}},
    "Stregone": {"code": "stregone", "hit_die": 6, "primary": ["cha"], "spellcasting": {"progression": "full_caster", "ability": "cha", "preparation": "known"}},
    "Warlock": {"code": "warlock", "hit_die": 8, "primary": ["cha"], "spellcasting": {"progression": "pact_magic", "ability": "cha", "preparation": "known"}},
}

MULTICLASS_REQUIREMENTS = {
    "barbaro": {"all": [{"ability": "str", "minimum": 13}]},
    "bardo": {"all": [{"ability": "cha", "minimum": 13}]},
    "chierico": {"all": [{"ability": "wis", "minimum": 13}]},
    "druido": {"all": [{"ability": "wis", "minimum": 13}]},
    "guerriero": {"any": [{"ability": "str", "minimum": 13}, {"ability": "dex", "minimum": 13}]},
    "ladro": {"all": [{"ability": "dex", "minimum": 13}]},
    "mago": {"all": [{"ability": "int", "minimum": 13}]},
    "monaco": {"all": [{"ability": "dex", "minimum": 13}, {"ability": "wis", "minimum": 13}]},
    "paladino": {"all": [{"ability": "str", "minimum": 13}, {"ability": "cha", "minimum": 13}]},
    "ranger": {"all": [{"ability": "dex", "minimum": 13}, {"ability": "wis", "minimum": 13}]},
    "stregone": {"all": [{"ability": "cha", "minimum": 13}]},
    "warlock": {"all": [{"ability": "cha", "minimum": 13}]},
}


def proficiency_bonus(level: int) -> int:
    return 2 + ((level - 1) // 4)


def full_caster_slots() -> list[tuple[str, int, dict]]:
    rows = {
        1: [2],
        2: [3],
        3: [4, 2],
        4: [4, 3],
        5: [4, 3, 2],
        6: [4, 3, 3],
        7: [4, 3, 3, 1],
        8: [4, 3, 3, 2],
        9: [4, 3, 3, 3, 1],
        10: [4, 3, 3, 3, 2],
        11: [4, 3, 3, 3, 2, 1],
        12: [4, 3, 3, 3, 2, 1],
        13: [4, 3, 3, 3, 2, 1, 1],
        14: [4, 3, 3, 3, 2, 1, 1],
        15: [4, 3, 3, 3, 2, 1, 1, 1],
        16: [4, 3, 3, 3, 2, 1, 1, 1],
        17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
        18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
        19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
        20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
    }
    return [("full_caster", level, {str(i + 1): count for i, count in enumerate(slots)}) for level, slots in rows.items()]


def half_caster_slots() -> list[tuple[str, int, dict]]:
    rows = {
        1: [],
        2: [2],
        3: [3],
        4: [3],
        5: [4, 2],
        6: [4, 2],
        7: [4, 3],
        8: [4, 3],
        9: [4, 3, 2],
        10: [4, 3, 2],
        11: [4, 3, 3],
        12: [4, 3, 3],
        13: [4, 3, 3, 1],
        14: [4, 3, 3, 1],
        15: [4, 3, 3, 2],
        16: [4, 3, 3, 2],
        17: [4, 3, 3, 3, 1],
        18: [4, 3, 3, 3, 1],
        19: [4, 3, 3, 3, 2],
        20: [4, 3, 3, 3, 2],
    }
    return [("half_caster_class_level", level, {str(i + 1): count for i, count in enumerate(slots)}) for level, slots in rows.items()]


def pact_magic_slots() -> list[tuple[str, int, dict]]:
    rows = {
        1: {"slot_level": 1, "slots": 1},
        2: {"slot_level": 1, "slots": 2},
        3: {"slot_level": 2, "slots": 2},
        4: {"slot_level": 2, "slots": 2},
        5: {"slot_level": 3, "slots": 2},
        6: {"slot_level": 3, "slots": 2},
        7: {"slot_level": 4, "slots": 2},
        8: {"slot_level": 4, "slots": 2},
        9: {"slot_level": 5, "slots": 2},
        10: {"slot_level": 5, "slots": 2},
        11: {"slot_level": 5, "slots": 3},
        12: {"slot_level": 5, "slots": 3},
        13: {"slot_level": 5, "slots": 3},
        14: {"slot_level": 5, "slots": 3},
        15: {"slot_level": 5, "slots": 3},
        16: {"slot_level": 5, "slots": 3},
        17: {"slot_level": 5, "slots": 4},
        18: {"slot_level": 5, "slots": 4},
        19: {"slot_level": 5, "slots": 4},
        20: {"slot_level": 5, "slots": 4},
    }
    return [("pact_magic", level, value) for level, value in rows.items()]


def build_core() -> str:
    lines = header("Seeder 010 - regole core manuale")
    lines += insert_many(
        "rule_skills",
        ["code", "name", "ability_id"],
        [[code, name, select_ability(ability)] for code, name, ability in SKILLS],
        ["name", "ability_id"],
    )
    lines.append("")
    lines += insert_many(
        "rule_damage_types",
        ["code", "name"],
        [[code, name] for code, name in DAMAGE_TYPES],
        ["name"],
    )
    lines.append("")
    lines += insert_many(
        "rule_conditions",
        ["code", "name", "rules_json"],
        [[code, name, raw_json({"seeded_as": "lookup", "details_source": "manuale"})] for code, name in CONDITIONS],
        ["name", "rules_json"],
    )
    lines.append("")
    lines += insert_many(
        "rule_languages",
        ["code", "name", "category"],
        [[code, name, category] for code, name, category in LANGUAGES],
        ["name", "category"],
    )
    lines.append("")
    slot_rows = full_caster_slots() + half_caster_slots() + pact_magic_slots()
    lines += insert_many(
        "rule_spell_slot_progressions",
        ["progression_code", "caster_level", "slots_json"],
        [[code, level, raw_json(slots)] for code, level, slots in slot_rows],
        ["slots_json"],
    )
    lines += footer()
    return "\n".join(lines)


def feat_category(value: str) -> str:
    return {
        "Origini": "origin",
        "Generale": "general",
        "Stile di combattimento": "fighting_style",
        "Dono epico": "epic_boon",
    }.get(value, "other")


def feature_type(power: dict) -> str:
    kind = power.get("kind")
    if kind == "choice":
        return "choice"
    if kind == "resource":
        return "resource"
    tags = {str(tag).lower() for tag in power.get("tags") or []}
    if "incantesimi" in tags or "magia" in tags:
        return "spellcasting"
    return "automatic"


def activation(power: dict) -> str:
    value = str(power.get("action_type") or power.get("kind") or "").lower()
    if "bonus" in value:
        return "bonus_action"
    if "reazione" in value:
        return "reaction"
    if "nessuna" in value or power.get("kind") == "passive":
        return "passive"
    if "azione" in value or power.get("kind") == "active":
        return "action"
    return "special"


def duration_type(power: dict) -> str:
    value = str(power.get("duration") or "").lower()
    if "sempre" in value:
        return "permanent"
    if "istant" in value:
        return "instant"
    if "round" in value or "turno" in value:
        return "rounds"
    if "minut" in value:
        return "minutes"
    if "ora" in value:
        return "hours"
    return "special"


def effect_category(power: dict) -> str:
    tags = {str(tag).lower() for tag in power.get("tags") or []}
    if power.get("damage"):
        return "damage"
    if power.get("kind") == "resource":
        return "resource"
    if power.get("kind") == "choice":
        return "choice"
    if "cura" in tags or "guarigione" in tags:
        return "healing"
    if "difesa" in tags or "ca" in tags:
        return "defense"
    if "movimento" in tags:
        return "movement"
    return "other"


MASTERIES = {
    "Doppio fendente": "cleave",
    "Colpo di striscio": "graze",
    "Graffio": "nick",
    "Spinta": "push",
    "Prosciugamento": "sap",
    "Lentezza": "slow",
    "Rovesciamento": "topple",
    "Vessazione": "vex",
}


def property_code(raw: str) -> tuple[str, dict]:
    value = raw.lower()
    payload = {"raw": raw}
    if value.startswith("lancio"):
        return "thrown", payload
    if value.startswith("munizioni"):
        return "ammunition", payload
    if value.startswith("versatile"):
        dice = raw.split(" ", 1)[1] if " " in raw else None
        if dice:
            payload["dice"] = dice
        return "versatile", payload
    if value.startswith("due mani"):
        return "two_handed", payload
    mapping = {
        "accurata": "finesse",
        "leggera": "light",
        "pesante": "heavy",
        "ricarica": "loading",
        "portata": "reach",
    }
    return mapping.get(value, value.replace(" ", "_")), payload


def parse_weight(value) -> float | None:
    if value is None:
        return None
    match = re.search(r"([0-9]+(?:[.,][0-9]+)?)", str(value))
    if not match:
        return None
    return float(match.group(1).replace(",", "."))


def equipment_row(item: dict, category: str, subtype: str | None = None, extra: dict | None = None) -> list:
    payload = dict(extra or {})
    for key, value in item.items():
        if key not in {"id", "name", "cost", "weight", "source"}:
            payload[key] = value
    if item.get("source"):
        payload["source"] = item["source"]
    return [
        Raw("@phb_source_id"),
        item["id"],
        item["name"],
        category,
        subtype or item.get("category"),
        raw_json({"raw": item.get("cost")}) if item.get("cost") is not None else None,
        parse_weight(item.get("weight")),
        raw_json(payload) if payload else None,
        None,
    ]


def class_code(name: str) -> str:
    return CLASS_DATA[name]["code"]


def subclass_code(class_name: str, subclass_name: str) -> str:
    return f"{class_code(class_name)}_{slug(subclass_name)}"


def build_catalog() -> str:
    powers = read_json(GENERATED / "catalogo_powers_tutte_classi_dnd2024_it.json")["powers"]
    feats = read_json(RULES_DIR / "feats" / "feats.json")["items"]
    spells = read_json(RULES_DIR / "spells" / "dnd2024_spells_it.json")["spells"]
    weapons = read_json(RULES_DIR / "equipment" / "weapons.json")["items"]
    armors = read_json(RULES_DIR / "equipment" / "armors.json")["items"]
    shields = read_json(RULES_DIR / "equipment" / "shields.json")["items"]
    tools = read_json(RULES_DIR / "equipment" / "tools.json")["items"]
    gear = read_json(RULES_DIR / "equipment" / "adventuring_gear.json")["items"]
    mounts_vehicles_services = read_json(RULES_DIR / "equipment" / "mounts_vehicles_services.json")

    lines = header("Seeder 020 - cataloghi da JSON")

    class_rows = []
    for name in sorted(CLASS_DATA):
        data = CLASS_DATA[name]
        class_rows.append([
            Raw("@phb_source_id"),
            data["code"],
            name,
            data["hit_die"],
            raw_json(data["primary"]),
            raw_json({"seeded_as": "minimal_catalog"}),
            raw_json({"seeded_as": "minimal_catalog"}),
            raw_json(data["spellcasting"]) if data["spellcasting"] else None,
            None,
        ])
    lines += insert_many(
        "rule_classes",
        ["source_id", "code", "name", "hit_die", "primary_abilities_json", "proficiencies_json", "starting_equipment_json", "spellcasting_json", "description"],
        class_rows,
        ["name", "hit_die", "primary_abilities_json", "spellcasting_json"],
    )
    lines.append("")

    multiclass_rows = []
    for code, requirements in MULTICLASS_REQUIREMENTS.items():
        multiclass_rows.append([
            select_id("rule_classes", code),
            raw_json(requirements),
            "Prerequisiti minimi di caratteristica per multiclasse.",
        ])
    lines += insert_many(
        "rule_multiclass_prerequisites",
        ["class_id", "requirements_json", "description"],
        multiclass_rows,
        ["requirements_json", "description"],
    )
    lines.append("")

    subclass_names: dict[tuple[str, str], int] = {}
    for power in powers:
        if power.get("source_type") == "subclass" and power.get("subsource"):
            key = (power["source"], power["subsource"])
            subclass_names[key] = min(subclass_names.get(key, 99), int(power.get("level") or 1))
    subclass_rows = []
    for (cls, sub), level in sorted(subclass_names.items()):
        subclass_rows.append([
            select_id("rule_classes", class_code(cls)),
            Raw("@phb_source_id"),
            subclass_code(cls, sub),
            sub,
            level,
            None,
            raw_json({"source_class": cls}),
        ])
    lines += insert_many(
        "rule_subclasses",
        ["class_id", "source_id", "code", "name", "level_obtained", "description", "rules_json"],
        subclass_rows,
        ["name", "level_obtained", "rules_json"],
    )
    lines.append("")

    feat_rows = []
    for feat in feats:
        feat_rows.append([
            Raw("@phb_source_id"),
            feat["id"],
            feat["name"],
            feat_category(feat.get("category")),
            bool(feat.get("repeatable")),
            raw_json(feat.get("prerequisites") or []),
            feat.get("summary"),
            raw_json({
                "tags": feat.get("tags") or [],
                "choices": feat.get("choices") or [],
                "effects": feat.get("effects") or [],
                "source": feat.get("source"),
                "category_label": feat.get("category"),
            }),
        ])
    lines += insert_many(
        "rule_feats",
        ["source_id", "code", "name", "category", "is_repeatable", "prerequisites_json", "description", "rules_json"],
        feat_rows,
        ["name", "category", "is_repeatable", "prerequisites_json", "description", "rules_json"],
    )
    lines.append("")

    equipment_rows = []
    for item in weapons:
        equipment_rows.append(equipment_row(item, "weapon", item.get("kind")))
    for item in armors:
        equipment_rows.append(equipment_row(item, "armor", item.get("category")))
    for item in shields:
        equipment_rows.append(equipment_row(item, "shield", item.get("category")))
    for item in tools:
        equipment_rows.append(equipment_row(item, "tool", item.get("category")))
    for item in gear:
        equipment_rows.append(equipment_row(item, "gear", item.get("category")))
    for item in mounts_vehicles_services.get("mounts", []):
        equipment_rows.append(equipment_row(item, "vehicle", "mount"))
    for item in mounts_vehicles_services.get("vehicles", []):
        equipment_rows.append(equipment_row(item, "vehicle", item.get("category")))
    for item in mounts_vehicles_services.get("services", []):
        equipment_rows.append(equipment_row(item, "service", item.get("category")))
    lines += insert_many(
        "rule_equipment",
        ["source_id", "code", "name", "category", "subtype", "cost_json", "weight", "properties_json", "description"],
        equipment_rows,
        ["name", "category", "subtype", "cost_json", "weight", "properties_json"],
    )
    lines.append("")

    relation_rows = []
    for item in weapons:
        for prop in item.get("properties") or []:
            code, payload = property_code(prop)
            relation_rows.append([select_id("rule_equipment", item["id"]), select_id("rule_weapon_properties", code), raw_json(payload)])
    lines += insert_many(
        "rule_equipment_weapon_properties",
        ["equipment_id", "weapon_property_id", "value_json"],
        relation_rows,
        ["value_json"],
    )
    lines.append("")

    mastery_rows = []
    for item in weapons:
        mastery = MASTERIES.get(item.get("mastery"))
        if mastery:
            mastery_rows.append([select_id("rule_equipment", item["id"]), select_id("rule_weapon_masteries", mastery)])
    lines += insert_many(
        "rule_equipment_weapon_masteries",
        ["equipment_id", "weapon_mastery_id"],
        mastery_rows,
        ["weapon_mastery_id"],
    )
    lines.append("")

    tool_rows = []
    tool_category = {"artigiano": "artisan", "altro": "other"}
    ability_names = {
        "Forza": "str",
        "Destrezza": "dex",
        "Costituzione": "con",
        "Intelligenza": "int",
        "Saggezza": "wis",
        "Carisma": "cha",
    }
    for item in tools:
        ability = ability_names.get(item.get("ability"))
        tool_rows.append([
            select_id("rule_equipment", item["id"]),
            item["id"],
            item["name"],
            tool_category.get(item.get("category"), "other"),
            raw_json([ability] if ability else []),
            None,
        ])
    lines += insert_many(
        "rule_tools",
        ["equipment_id", "code", "name", "tool_category", "ability_suggestions_json", "description"],
        tool_rows,
        ["equipment_id", "name", "tool_category", "ability_suggestions_json"],
    )
    lines.append("")

    feature_rows = []
    for power in powers:
        cls = power["source"]
        sub_code = subclass_code(cls, power["subsource"]) if power.get("source_type") == "subclass" and power.get("subsource") else None
        rules_payload = {key: value for key, value in power.items() if key not in {"details"}}
        feature_rows.append([
            select_id("rule_classes", class_code(cls)),
            select_id("rule_subclasses", sub_code) if sub_code else None,
            power["id"],
            power["name"],
            int(power.get("level") or 1),
            feature_type(power),
            power.get("quick_effect"),
            raw_json({
                "kind": power.get("kind"),
                "action_type": power.get("action_type"),
                "choices": power.get("choices") if power.get("choices") else None,
            }),
            raw_json(rules_payload),
        ])
    lines += insert_many(
        "rule_class_features",
        ["class_id", "subclass_id", "code", "name", "level", "feature_type", "description", "options_json", "rules_json"],
        feature_rows,
        ["name", "level", "feature_type", "description", "options_json", "rules_json"],
    )
    lines.append("")

    class_level_rows = []
    by_class_level: dict[tuple[str, int], list[dict]] = {}
    for power in powers:
        if power.get("source_type") == "class":
            by_class_level.setdefault((power["source"], int(power.get("level") or 1)), []).append(
                {"code": power["id"], "name": power["name"], "type": feature_type(power)}
            )
    for class_name in CLASS_DATA:
        for level in range(1, 21):
            class_level_rows.append([
                select_id("rule_classes", class_code(class_name)),
                level,
                proficiency_bonus(level),
                raw_json(by_class_level.get((class_name, level), [])),
                raw_json([]),
                raw_json(CLASS_DATA[class_name].get("spellcasting")),
                raw_json([]),
            ])
    lines += insert_many(
        "rule_class_levels",
        ["class_id", "level", "proficiency_bonus", "features_json", "resources_json", "spellcasting_json", "choices_json"],
        class_level_rows,
        ["proficiency_bonus", "features_json", "resources_json", "spellcasting_json", "choices_json"],
    )
    lines.append("")

    effect_rows = []
    for power in powers:
        effect_rows.append([
            f"{power['id']}_effect",
            power["name"],
            "class_feature",
            select_id("rule_class_features", power["id"]),
            effect_category(power),
            activation(power),
            duration_type(power),
            power.get("quick_effect"),
            raw_json({key: power.get(key) for key in ["cost", "uses", "range", "area", "roll", "damage", "save", "tags"]}),
        ])
    for feat in feats:
        effect_rows.append([
            f"{feat['id']}_feat_effect",
            feat["name"],
            "feat",
            select_id("rule_feats", feat["id"]),
            "grant",
            "passive",
            "permanent",
            feat.get("summary"),
            raw_json({"effects": feat.get("effects") or [], "choices": feat.get("choices") or [], "tags": feat.get("tags") or []}),
        ])
    lines += insert_many(
        "rule_effects",
        ["code", "name", "origin_type", "origin_id", "category", "activation", "duration_type", "description", "rules_json"],
        effect_rows,
        ["name", "origin_id", "category", "activation", "duration_type", "description", "rules_json"],
    )
    lines.append("")

    spell_rows = []
    for spell in spells:
        spell_rows.append([
            Raw("@phb_source_id"),
            spell["id"],
            spell["name"],
            int(spell.get("level") or 0),
            spell.get("school"),
            (spell.get("casting_time") or {}).get("raw"),
            (spell.get("range") or {}).get("raw"),
            raw_json(spell.get("components") or {}),
            (spell.get("duration") or {}).get("raw"),
            bool((spell.get("duration") or {}).get("concentration")),
            bool((spell.get("casting_time") or {}).get("ritual")),
            None,
            None,
            raw_json({
                "classes": spell.get("classes") or [],
                "level_label": spell.get("level_label"),
                "is_cantrip": spell.get("is_cantrip"),
                "mechanics": spell.get("mechanics") or {},
                "source": spell.get("source"),
            }),
        ])
    lines += insert_many(
        "rule_spells",
        ["source_id", "code", "name", "level", "school", "casting_time", "range_text", "components_json", "duration_text", "is_concentration", "is_ritual", "description", "at_higher_levels", "mechanics_json"],
        spell_rows,
        ["name", "level", "school", "casting_time", "range_text", "components_json", "duration_text", "is_concentration", "is_ritual", "mechanics_json"],
    )
    lines.append("")

    spell_link_rows = []
    for spell in spells:
        for spell_class in spell.get("classes") or []:
            if spell_class in {data["code"] for data in CLASS_DATA.values()}:
                spell_link_rows.append([select_id("rule_classes", spell_class), select_id("rule_spells", spell["id"]), False])
    lines += insert_many(
        "rule_class_spell_lists",
        ["class_id", "spell_id", "is_optional"],
        spell_link_rows,
        ["is_optional"],
    )

    lines += footer()
    return "\n".join(lines)


def equipment_lookup() -> dict[str, str]:
    lookup = {}
    for file_name in ["weapons", "armors", "shields", "tools", "adventuring_gear"]:
        for item in read_json(RULES_DIR / "equipment" / f"{file_name}.json")["items"]:
            lookup[item["id"]] = item["id"]
            lookup[slug(item["name"])] = item["id"]
    lookup.update({
        "halberd": "alabarda",
        "javelins": "giavellotto",
        "javelin": "giavellotto",
        "chain_mail": "cotta-di-maglia",
        "longbow": "arco-lungo",
        "shortsword": "spada-corta",
        "shortswords": "spada-corta",
        "studded_leather": "armatura-di-cuoio-borchiato",
        "dagger": "pugnale",
        "daggers": "pugnale",
        "backpack": "zaino",
    })
    return lookup


def find_subclass_code(class_name: str, raw_name: str | None, known_subclasses: set[tuple[str, str]]) -> str | None:
    if not raw_name:
        return None
    normalized = raw_name.lower()
    candidates = [sub for cls, sub in known_subclasses if cls == class_name and sub.lower() in normalized]
    if not candidates:
        return None
    return subclass_code(class_name, sorted(candidates, key=len, reverse=True)[0])


def sql_insert_select(table: str, columns: list[str], values: list, where_not_exists: str) -> str:
    col_sql = ", ".join(f"`{col}`" for col in columns)
    value_sql = ", ".join(q(value) for value in values)
    return f"INSERT INTO `{table}` ({col_sql})\nSELECT {value_sql}\nWHERE NOT EXISTS ({where_not_exists});"


def build_demo_characters() -> str:
    powers = read_json(GENERATED / "catalogo_powers_tutte_classi_dnd2024_it.json")["powers"]
    known_subclasses = {
        (power["source"], power["subsource"])
        for power in powers
        if power.get("source_type") == "subclass" and power.get("subsource")
    }
    equip_lookup = equipment_lookup()

    lines = header("Seeder 030 - personaggi demo da JSON app")
    lines += [
        "INSERT INTO `users` (`email`, `username`, `display_name`, `password_hash`, `status`) VALUES",
        "('demo@dnd.local', 'demo', 'Demo Locale', 'not-a-real-password', 'active')",
        "ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`), `status` = VALUES(`status`);",
        "SET @demo_user_id = (SELECT `id` FROM `users` WHERE `email` = 'demo@dnd.local' LIMIT 1);",
        "",
    ]

    for path in sorted(CHARACTERS_DIR.glob("*.json")):
        character = read_json(path)
        char_code = slug(character["name"])
        species_code = f"import_{slug(character.get('race') or 'species')}"
        background_code = f"import_{slug(character.get('background') or 'background')}"

        lines += [
            f"-- Personaggio demo: {character['name']}",
            *insert_many(
                "rule_species",
                ["source_id", "code", "name", "traits_json", "description"],
                [[Raw("@homebrew_source_id"), species_code, character.get("race") or "Specie importata", raw_json({"imported_from": path.name}), "Placeholder importato dai JSON demo."]],
                ["name", "traits_json", "description"],
            ),
            *insert_many(
                "rule_backgrounds",
                ["source_id", "code", "name", "description"],
                [[Raw("@homebrew_source_id"), background_code, character.get("background") or "Background importato", "Placeholder importato dai JSON demo."]],
                ["name", "description"],
            ),
            sql_insert_select(
                "characters",
                ["owner_user_id", "name", "concept", "species_id", "background_id", "alignment", "total_level_snapshot", "status", "notes"],
                [
                    Raw("@demo_user_id"),
                    character["name"],
                    character.get("concept"),
                    select_id("rule_species", species_code),
                    select_id("rule_backgrounds", background_code),
                    character.get("alignment"),
                    int(character.get("level") or 0),
                    "active",
                    character.get("notes") if isinstance(character.get("notes"), str) else None,
                ],
                f"SELECT 1 FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = {q(character['name'])}",
            ),
            f"SET @{char_code}_id = (SELECT `id` FROM `characters` WHERE `owner_user_id` = @demo_user_id AND `name` = {q(character['name'])} LIMIT 1);",
            "",
        ]

        for entry in character.get("classes") or []:
            cls = entry.get("name")
            if cls not in CLASS_DATA:
                continue
            sub_code = find_subclass_code(cls, entry.get("subclass"), known_subclasses)
            lines += insert_many(
                "character_classes",
                ["character_id", "class_id", "subclass_id", "level", "is_primary"],
                [[Raw(f"@{char_code}_id"), select_id("rule_classes", class_code(cls)), select_id("rule_subclasses", sub_code) if sub_code else None, int(entry.get("level") or 0), True]],
                ["subclass_id", "level", "is_primary"],
            )

        ability_rows = []
        for ability, value in (character.get("abilities") or {}).items():
            ability_rows.append([Raw(f"@{char_code}_id"), select_ability(ability), int(value), "imported", f"Import da {path.name}"])
        lines += insert_many(
            "character_ability_bases",
            ["character_id", "ability_id", "base_value", "method", "notes"],
            ability_rows,
            ["base_value", "method", "notes"],
        )

        for skill in character.get("skills") or []:
            if skill.get("proficient"):
                lines.append(sql_insert_select(
                    "character_proficiencies",
                    ["character_id", "proficiency_type", "proficiency_ref", "rank", "origin_type", "notes"],
                    [Raw(f"@{char_code}_id"), "skill", skill.get("id"), "proficient", "manual", "Import da JSON demo."],
                    f"SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @{char_code}_id AND `proficiency_type` = 'skill' AND `proficiency_ref` = {q(skill.get('id'))}",
                ))
        for ability, proficient in (character.get("savingThrows") or {}).items():
            if proficient:
                lines.append(sql_insert_select(
                    "character_proficiencies",
                    ["character_id", "proficiency_type", "proficiency_ref", "rank", "origin_type", "notes"],
                    [Raw(f"@{char_code}_id"), "saving_throw", ability, "proficient", "manual", "Import da JSON demo."],
                    f"SELECT 1 FROM `character_proficiencies` WHERE `character_id` = @{char_code}_id AND `proficiency_type` = 'saving_throw' AND `proficiency_ref` = {q(ability)}",
                ))

        combat = character.get("combat") or {}
        hp = combat.get("hp") or {}
        for target_code, target_ref, operation, number in [
            ("max_hp", None, "set", hp.get("max")),
            ("armor_class", None, "set", combat.get("ac")),
            ("speed", "walk", "set", combat.get("speed")),
            ("initiative", None, "add", combat.get("initiativeBonus")),
        ]:
            if number is None:
                continue
            ref_check = "IS NULL" if target_ref is None else f"= {q(target_ref)}"
            lines.append(sql_insert_select(
                "character_modifiers",
                ["character_id", "target_code", "target_ref", "operation", "value_number", "origin_type", "origin_ref", "duration_type", "notes"],
                [Raw(f"@{char_code}_id"), target_code, target_ref, operation, number, "manual", f"import_{path.stem}_{target_code}_{target_ref or 'base'}", "permanent", "Valore importato dallo stato corrente del JSON demo."],
                f"SELECT 1 FROM `character_modifiers` WHERE `character_id` = @{char_code}_id AND `target_code` = {q(target_code)} AND `target_ref` {ref_check} AND `origin_ref` = {q(f'import_{path.stem}_{target_code}_{target_ref or 'base'}')}",
            ))

        for resource in character.get("resources") or []:
            recovery = (resource.get("resetOn") or "special").replace("-", "_")
            if recovery not in {"never", "turn_start", "turn_end", "short_rest", "long_rest", "short_or_long_rest", "dawn", "special"}:
                recovery = "special"
            lines.append(sql_insert_select(
                "character_resources",
                ["character_id", "code", "name", "max_value_snapshot", "current_value", "recovery", "origin_type", "notes"],
                [Raw(f"@{char_code}_id"), resource.get("id"), resource.get("label") or resource.get("id"), int(resource.get("max") or 0), int(resource.get("current") or 0), recovery, resource.get("category") if resource.get("category") in {"class", "subclass", "feat", "spell", "species", "background", "equipment", "manual", "other"} else "other", "Import da JSON demo."],
                f"SELECT 1 FROM `character_resources` WHERE `character_id` = @{char_code}_id AND `code` = {q(resource.get('id'))}",
            ))

        spellcasting = character.get("spellcasting") or {}
        ability = spellcasting.get("ability")
        if ability:
            first_class = (character.get("classes") or [{}])[0].get("name")
            lines.append(sql_insert_select(
                "character_spellcasting_profiles",
                ["character_id", "class_id", "source_type", "casting_ability_id", "preparation_mode", "spell_list_ref", "prepared_count_formula", "focus_rules_json"],
                [Raw(f"@{char_code}_id"), select_id("rule_classes", class_code(first_class)) if first_class in CLASS_DATA else None, "class", select_ability(ability), "prepared", class_code(first_class) if first_class in CLASS_DATA else None, str(spellcasting.get("preparedCount")) if spellcasting.get("preparedCount") is not None else None, raw_json({"imported_from": path.name})],
                f"SELECT 1 FROM `character_spellcasting_profiles` WHERE `character_id` = @{char_code}_id AND `source_type` = 'class'",
            ))
        for spell in spellcasting.get("spells") or []:
            lines.append(
                "INSERT INTO `character_spells` (`character_id`, `spell_id`, `origin_type`, `is_known`, `is_prepared`, `prepared_context`)\n"
                f"SELECT @{char_code}_id, `id`, 'manual', 1, {q(bool(spell.get('prepared', True)))}, 'daily'\n"
                f"FROM `rule_spells` WHERE `code` = {q(spell.get('id'))}\n"
                f"AND NOT EXISTS (SELECT 1 FROM `character_spells` WHERE `character_id` = @{char_code}_id AND `spell_id` = `rule_spells`.`id`);"
            )
        for slot in spellcasting.get("slots") or []:
            lines.append(sql_insert_select(
                "character_spell_slots",
                ["character_id", "slot_type", "slot_level", "max_slots_snapshot", "used_slots", "recovery", "origin_type"],
                [Raw(f"@{char_code}_id"), "spellcasting", int(slot.get("level") or 0), int(slot.get("max") or 0), max(0, int(slot.get("max") or 0) - int(slot.get("current") or 0)), (slot.get("resetOn") or "long_rest"), "manual"],
                f"SELECT 1 FROM `character_spell_slots` WHERE `character_id` = @{char_code}_id AND `slot_type` = 'spellcasting' AND `slot_level` = {q(int(slot.get('level') or 0))}",
            ))

        equipment = character.get("equipment") or {}
        for section_name in ["weapons", "armor", "tools", "adventuringGear"]:
            for item in equipment.get(section_name) or []:
                catalog_code = equip_lookup.get(item.get("id")) or equip_lookup.get(slug(item.get("name") or ""))
                lines.append(sql_insert_select(
                    "character_inventory",
                    ["character_id", "equipment_id", "custom_name", "quantity", "origin_type", "notes"],
                    [
                        Raw(f"@{char_code}_id"),
                        select_id("rule_equipment", catalog_code) if catalog_code else None,
                        item.get("name"),
                        int(item.get("quantity") or 1),
                        "manual",
                        " ".join(str(item.get(key) or "") for key in ["description", "notes"]).strip() or None,
                    ],
                    f"SELECT 1 FROM `character_inventory` WHERE `character_id` = @{char_code}_id AND `custom_name` = {q(item.get('name'))}",
                ))

        lines.append(sql_insert_select(
            "character_sheet_snapshots",
            ["character_id", "snapshot_type", "sheet_json"],
            [Raw(f"@{char_code}_id"), "active", raw_json(character)],
            f"SELECT 1 FROM `character_sheet_snapshots` WHERE `character_id` = @{char_code}_id AND `snapshot_type` = 'active'",
        ))
        lines.append("")

    lines += footer()
    return "\n".join(lines)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = {
        "010_seed_rules_core.sql": build_core(),
        "020_seed_catalog_from_json.sql": build_catalog(),
        "030_seed_demo_characters.sql": build_demo_characters(),
    }
    for name, content in files.items():
        (OUT_DIR / name).write_text(content, encoding="utf-8", newline="\n")
        print(f"wrote {OUT_DIR / name}")


if __name__ == "__main__":
    main()
