
export LC_CONTEST="weekly-contest-398"
export LC_QUESNUM=4
export REPORT="${LC_CONTEST}_Q${LC_QUESNUM}"

set -e

# python.exe scripts/pre_plag.py ${LC_CONTEST} ${LC_QUESNUM}

# docker run --init --network host \
#     -v "$(pwd)/public/contests/$REPORT:/dolos" ghcr.io/dodona-edu/dolos-cli -f csv -l cpp info.csv

# mv ./public/contests/$REPORT/dolos-report-* ./public/contests/$REPORT/dolos-report

# sleep 10
python.exe scripts/post_plag.py ${LC_CONTEST} ${LC_QUESNUM}

npm run build
git add . && git commit -m "[auto_commit] generated ${REPORT}" && git push