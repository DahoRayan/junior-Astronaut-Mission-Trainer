import argparse

from . import fetch, index, label, parse, report


def main() -> None:
    ap = argparse.ArgumentParser(prog="osdr_pipeline", description=__doc__)
    sub = ap.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fetch", help="download study METADATA (resumable)")
    f.add_argument(
        "--ids", help="e.g. 1-50,137 (default: scan from --start until consecutive misses)"
    )
    f.add_argument("--start", type=int, default=1)
    f.add_argument("--end", type=int, default=3000)
    f.add_argument("--max-miss", type=int, default=40)
    f.add_argument(
        "--files", action="store_true", help="also save file LISTINGS (names/sizes, no downloads)"
    )
    f.add_argument("--refresh", action="store_true")
    f.add_argument("--sleep", type=float, default=0.4)
    f.add_argument("--max-file-pages", type=int, default=40)
    f.add_argument(
        "--probe-search", action="store_true", help="save one search response to inspect its schema"
    )
    sub.add_parser("build", help="raw JSON -> normalized tables")
    sub.add_parser("label", help="keyword labels")
    sub.add_parser("report", help="quality + descriptive statistics report")
    sub.add_parser("index", help="topic index for the expert system")
    sub.add_parser("all", help="build + label + report + index")
    a = ap.parse_args()
    if a.cmd == "fetch":
        fetch.run(
            a.ids,
            a.start,
            a.end,
            a.max_miss,
            a.files,
            a.refresh,
            a.sleep,
            a.max_file_pages,
            a.probe_search,
        )
    elif a.cmd == "build":
        parse.build_tables()
    elif a.cmd == "label":
        label.label_studies()
    elif a.cmd == "report":
        report.make_report()
    elif a.cmd == "index":
        index.build_topic_index()
    elif a.cmd == "all":
        parse.build_tables()
        label.label_studies()
        report.make_report()
        index.build_topic_index()


if __name__ == "__main__":
    main()
