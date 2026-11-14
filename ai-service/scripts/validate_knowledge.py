from pathlib import Path

from app.expert.knowledge import KNOWLEDGE_ROOT, load_catalog


def main() -> None:
    catalog = load_catalog(Path(KNOWLEDGE_ROOT))
    print(
        "Knowledge files are valid: "
        f"version={catalog.version}, "
        f"questions={len(catalog.questions)}, "
        f"rules={len(catalog.rules)}, "
        f"facts={len(catalog.facts)}"
    )


if __name__ == "__main__":
    main()
