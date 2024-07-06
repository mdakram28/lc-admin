from pre_plag import LcClient
from post_plag import ReportProcessor
from analyzer import LcAnalyzer
from common import *
from subprocess import run, PIPE, call
from os import system, listdir, rename
from os.path import isdir, abspath, exists
from shutil import rmtree

contests = [
    "biweekly-contest-134"
    # "weekly-contest-404",
    # "weekly-contest-403",
    # "biweekly-contest-133",
    # "weekly-contest-402",
    # "weekly-contest-401",
    # "biweekly-contest-132",
    # "weekly-contest-400",
    # "weekly-contest-399",
    # "biweekly-contest-131",
    # "weekly-contest-398",
]

for LC_CONTEST in contests:
    LC_QUESNUM=4
    REPORT=f"{LC_CONTEST}_Q{LC_QUESNUM}"
    SIMILARITY_PERCENTAGES = list(range(70, 101, 2))
    REPORT_DIR = join(CONTESTS_OUT_PATH, REPORT)

    print(f"Processing : {REPORT}")

    client = LcClient(LC_CONTEST, LC_QUESNUM)
    client.fetch_submissions(range(1, 200))

    system(f"""
    docker run --init --network host -v "{abspath(REPORT_DIR)}:/dolos" ghcr.io/dodona-edu/dolos-cli -k 15 -f csv -l cpp info.csv
    """)

    report_dir_name = [f for f in listdir(REPORT_DIR) if f.startswith("dolos-report-")][0]
    new_report_dir = join(REPORT_DIR, "dolos-report")
    if exists(new_report_dir):
        rmtree(new_report_dir)
    rename(join(REPORT_DIR, report_dir_name), new_report_dir)

    report = ReportProcessor(LC_CONTEST, LC_QUESNUM, client)

    report.write_pairs(70)
    report.write_users()
    report.write_contest_info()

# analyzer = LcAnalyzer()
# analyzer.process(80)
# analyzer.write()