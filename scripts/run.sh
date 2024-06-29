
export LC_CONTEST="biweekly-contest-133"
export LC_QUESNUM=4

set -e

python.exe scripts/pre_plag.py ${LC_CONTEST} ${LC_QUESNUM}

docker run --init --network host \
    -v "$(pwd)/public/contests/${LC_CONTEST}_Q${LC_QUESNUM}:/dolos" ghcr.io/dodona-edu/dolos-cli -f web -l cpp info.csv

python.exe scripts/post_plag.py ${LC_CONTEST} ${LC_QUESNUM}