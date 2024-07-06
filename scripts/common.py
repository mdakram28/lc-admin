import csv
from os.path import join
csv.field_size_limit(100_000_000)

CONTESTS_OUT_PATH = join("public", "contests")
ANALYSIS_OUT_PATH = join("public", "analysis")
