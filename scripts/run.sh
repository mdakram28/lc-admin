
export LC_CONTEST="biweekly-contest-132"
export LC_QUESNUM=4
export REPORT="${LC_CONTEST}_Q${LC_QUESNUM}"

set -e

# python.exe scripts/pre_plag.py ${LC_CONTEST} ${LC_QUESNUM}

# docker run --init --network host \
#     -v "$(pwd)/public/contests/$REPORT:/dolos" ghcr.io/dodona-edu/dolos-cli -f csv -l cpp info.csv

# mv ./public/contests/$REPORT/dolos-report-* ./public/contests/$REPORT/dolos-report

sleep 3

python.exe scripts/post_plag.py ${LC_CONTEST} ${LC_QUESNUM}