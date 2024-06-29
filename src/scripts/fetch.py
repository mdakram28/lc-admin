from datetime import datetime
import itertools
import json
from pathlib import Path
import time
import requests
import math
from os.path import join, exists, getsize
import hashlib
import csv

OUT_PATH = join("public", "contests")

LANG_EXT = {
    "python": "py",
    "python3": "py",
    "c": "c",
    "cpp": "cpp",
    "java": "java",
    "javascript": "js",
    "kotlin": "kt",
    "csharp": "cs",
    "rust": "rs",
    "swift": "swift",
    "golang": "go",
    "typescript": "ts",
    "scala": 'sc',
    "dart": "dart"
}

REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Priority": "u=0, i",
    "Sec-Ch-Ua-Mobile": '?0',
    "Sec-Ch-Ua-Platform": "macOS",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
}

class LcClient:
    def __init__(self, contest: str) -> None:
        self.out_path = join(OUT_PATH, contest)
        self.api_base = f"https://leetcode.com/contest/api"
        self.api_base_base = {
            "US": f"https://leetcode.com/api",
            "CN": f"https://leetcode.cn/api"
        }
        self.contest_base = f"{self.api_base}/ranking/{contest}"

        Path(self.out_path).mkdir(exist_ok=True, parents=True)

    def json_request(self, url):
        cache_dir = join("tmp", "cache")
        Path(cache_dir).mkdir(exist_ok=True, parents=True)
        cache_file = join(cache_dir, hashlib.md5(url.encode('utf-8')).hexdigest() + ".json")
        if exists(cache_file):
            with open(cache_file) as f:
                return json.load(f)
        
        delay = 0.5
        for attempt in itertools.count(1):
            print("Fetching url:", url)
            resp = requests.get(url, headers=REQUEST_HEADERS)
            if resp.status_code == 200:
                break

            print(f"Unexpected status code: {resp.status_code}. Waiting {delay}s")
            time.sleep(delay)
            delay *= 2
            

        resp = resp.json()
        time.sleep(0.1)
        with open(cache_file, 'w') as f:
            json.dump(resp, f, indent=4)
        
        return resp

    def fetch_submissions(self, pages: list[int], ques_num: int):
        out_dir = join(f"{self.out_path}", f"Q_{ques_num}")
        Path(out_dir).mkdir(exist_ok=True)
        Path(join(out_dir, "submissions")).mkdir(exist_ok=True)

        info_path = join(f"{self.out_path}", f"Q_{ques_num}", "info.csv")
        info_file = open(info_path, 'w')
        writer = csv.writer(info_file)
        writer.writerow(["filename", "created_at"])

        for page in pages:
            data = self.json_request(f"{self.contest_base}/?pagination={page}&region=global")
            
            question_id = data["questions"][ques_num-1]["question_id"]

            for user, submissions in zip(data["total_rank"], data["submissions"]):
                cont_subm = submissions[str(question_id)]
                api_base = self.api_base_base[cont_subm['data_region']]
                submission = self.json_request(f"{api_base}/submissions/{cont_subm['submission_id']}/")
                
                rel_code_path = join("submissions", f"{user['rank']}____{user['username']}.{LANG_EXT[submission['lang']]}")
                subm_path = join(out_dir, rel_code_path)
                content = submission['code'].encode('utf-8')
                if not exists(subm_path) or getsize(subm_path) != len(content):
                    with open(subm_path, "wb") as f:
                        f.write(content)
                        
                subm_time = datetime.fromtimestamp(cont_subm['date'])
                subm_time = subm_time.strftime("%Y-%m-%d %H:%M:%S") + " -0400"
                writer.writerow([rel_code_path, subm_time])
                info_file.flush()
        
        info_file.close()


def main():
    client = LcClient("weekly-contest-391")
    client.fetch_submissions(range(1, 50), 4)

if __name__ == "__main__":
    main()