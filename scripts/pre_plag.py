import os
import sys
from common import *

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
from selenium import webdriver
from selenium.webdriver.common.by import By

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
    "dart": "dart",
    "php": "php",
    "ruby": "rb"
}

class LcClient:
    def __init__(self, contest: str, ques_num: int) -> None:
        self.ques_num = ques_num
        self.out_path = join(OUT_PATH, f"{contest}_Q{ques_num}")
        self.api_base = f"https://leetcode.com/contest/api"
        self.api_base_base = {
            "US": f"https://leetcode.com/api",
            "CN": f"https://leetcode.cn/api"
        }
        self.contest_base = f"{self.api_base}/ranking/{contest}"
        self.driver = webdriver.Chrome()

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

            self.driver.get(url)
            content = self.driver.find_element(By.TAG_NAME, 'pre').text
            resp = json.loads(content)
            break
            # resp = requests.get(url, headers=REQUEST_HEADERS)
            # if resp.status_code == 200:
            #     break

            print(f"Unexpected status code: {resp.status_code}. Waiting {delay}s")
            time.sleep(delay)
            delay *= 2
            

        time.sleep(0.1)
        with open(cache_file, 'w') as f:
            json.dump(resp, f, indent=4)
        
        return resp

    def fetch_submissions(self, pages: list[int]):
        Path(join(self.out_path, "submissions")).mkdir(exist_ok=True)

        info_path = join(f"{self.out_path}", "info.csv")
        info_file = open(info_path, 'w', newline='', encoding='utf-8')
        writer = csv.writer(info_file)
        writer.writerow(["filename", "created_at", "subm_ts"])

        for page in pages:
            data = self.json_request(f"{self.contest_base}/?pagination={page}&region=global")
            
            question_id = str(data["questions"][self.ques_num-1]["question_id"])

            for user, submissions in zip(data["total_rank"], data["submissions"]):
                if question_id not in submissions:
                    continue
                cont_subm = submissions[question_id]
                api_base = self.api_base_base.get(cont_subm['data_region'], self.api_base_base['US'])
                submission = self.json_request(f"{api_base}/submissions/{cont_subm['submission_id']}/")
                
                filename = f"{user['rank']}____{user['username']}.{LANG_EXT[submission['lang']]}"
                subm_path = join(self.out_path, "submissions", filename)
                content = submission['code'].encode('utf-8')
                if not exists(subm_path) or getsize(subm_path) != len(content):
                    with open(subm_path, "wb") as f:
                        f.write(content)
                        
                subm_time = datetime.fromtimestamp(cont_subm['date'])
                subm_time = subm_time.strftime("%Y-%m-%d %H:%M:%S") + " -0400"
                writer.writerow([f"submissions/{filename}", subm_time, cont_subm['date']])
                info_file.flush()
        
        info_file.close()

def main():
    client = LcClient(sys.argv[1], int(sys.argv[2]))
    client.fetch_submissions(range(1, 50))

if __name__ == "__main__":
    main()