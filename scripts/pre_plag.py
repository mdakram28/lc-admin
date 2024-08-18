import base64
from concurrent.futures import ThreadPoolExecutor
from functools import cached_property
import os
import queue
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
    "ruby": "rb",
    "racket": "rkt",
}

class LcClient:
    def __init__(self, contest: str, ques_num: int, use_cache: bool = True) -> None:
        self.contest = contest
        self.ques_num = ques_num
        self.out_path = join(CONTESTS_OUT_PATH, f"{contest}_Q{ques_num}")
        self.api_base = f"https://leetcode.com/contest/api"
        self.api_base_base = {
            "US": f"https://leetcode.com/api",
            "CN": f"https://leetcode.cn/api"
        }
        self.contest_base = f"{self.api_base}/ranking/{contest}"

        Path(self.out_path).mkdir(exist_ok=True, parents=True)
        self._driver_queue: queue = queue.Queue(4)
        self.thread_pool = ThreadPoolExecutor(max_workers=4)
        self.use_cache = use_cache

    def json_request(self, url):
        cache_dir = join("tmp", "cache2")
        Path(cache_dir).mkdir(exist_ok=True, parents=True)
        cache_file = join(cache_dir, hashlib.md5(url.encode('utf-8')).hexdigest() + ".json")
        if self.use_cache and exists(cache_file):
            with open(cache_file, encoding="utf8") as f:
                return json.load(f)

        try:
            driver = self._driver_queue.get_nowait()
        except queue.Empty:
            driver = webdriver.Chrome()
        
        delay = 0.5
        for attempt in itertools.count(1):
            try:
                print("Fetching url:", url)

                driver.get(url)
                content = driver.find_element(By.TAG_NAME, 'pre').text
                resp = json.loads(content)
                break
            except Exception as e:
                print(f"Unexpected error: {str(e)}")
                time.sleep(delay)
                delay *= 2
        
        # Recycle browser
        self._driver_queue.put_nowait(driver)

        time.sleep(0.1)
        with open(cache_file, 'w', encoding="utf8") as f:
            json.dump(resp, f, indent=4)
        
        return resp
    
    def fetch_contest_info(self):
        '''
        {
            "contest": {
                "id": 1031,
                "title": "Biweekly Contest 133",
                "title_slug": "biweekly-contest-133",
                "description": "<style>\r\n.contest-information ol:not(.list-group) {\r\n    padding-left: 20px;\r\n}\r\n.contest-information ul:not(.list-group) {\r\n    padding-left: 20px;\r\n}\r\n.contest-information li:not(.list-group-item) {\r\n    margin-top: 5px;\r\n}\r\n\r\n.contest-information .list-group .list-group-item {\r\n    border: none;\r\n    margin-bottom: 1px;\r\n}\r\n.contest-information img[alt=\"LeetCoin\"] {\r\n    position: relative;\r\n    top: -2px;\r\n}\r\n</style>\r\n\r\n<div class=\"contest-information container\">\r\n    <div class=\"row\">\r\n        <div class=\"col-sm-8 col-md-9\">\r\n            <h3 class=\"text-300\">\r\n                Welcome to the 133rd LeetCode Biweekly Contest\r\n            </h3>\r\n            <br>\r\n\r\n            <p>This LeetCode contest is sponsored by LeetCode. <a target=\"_blank\" href=\"/track/?data=eyJ1cmwiOiAiaHR0cHM6Ly9sZWV0Y29kZS5jb20vZGlzY3Vzcy9nZW5lcmFsLWRpc2N1c3Npb24vMTUxMTI3NC90aGluay15b3UtZ290LXdoYXQtaXQtdGFrZXMtdG8td29yay1hdC1sZWV0Y29kZSIsICJ1dWlkIjogImxlZXRjb2RlLWZyb250ZW5kLWVuZ2luZWVyaW5nIn0%3D\">Checkout what it feels like to work at LeetCode.</a></p> \r\n\r\n            <h4 class=\"text-300\">\r\n                <i class=\"fa fa-newspaper-o\" style=\"color: #1DA09C\" aria-hidden=\"true\"></i>\r\n                &nbsp;Important Note\r\n            </h4>\r\n            <ol>\r\n               <li>\r\n                  To provide a better contest and ensure fairness, we listened to LeetCoders' feedback and put in lots of thoughts behind the updated contest rule. Please check out our new contest <a href=\"https://leetcode.com/discuss/general-discussion/951105/new-contest-rule-effective-from-december-2020\">rule</a> which covers more scenarios with details explained.\r\n                </li>\r\n                <li>\r\n                    The penalty time of <b>5</b> minutes will be applied for each wrong submission.\r\n                </li>\r\n                <li>\r\n                  To ensure the fairness of the contest, LeetCode will hide some test cases during the contest. When users submit incorrect submissions, LeetCode will not show the hidden test cases to the users.\r\n                </li>\r\n                <li>\r\n                  The final rating of this contest will be updated within 5 working days after the contest.\r\n                </li>\r\n      <br /> <b>Below actions are deemed contest violations</b>:\r\n      <ul>\r\n       <li>One user submitting with multiple accounts during a contest. LCUS (leetcode.com) account and LCCN (leetcode-cn.com) account are considered to be separate accounts, even if both accounts belong to the same user.</li>\r\n       <li>Multiple accounts submitting similar code for the same problem.</li>\r\n       <li>Creating unwanted disturbances which interrupt other users' participation in a contest. </li> \r\n       <li>Disclosing contest solutions in public discuss posts before the end of a contest. </li>\r\n      </ul>\r\n      <br /> LeetCode heavily emphasizes on the justice and fairness of our contests. We have absolutely <b>ZERO TOLERANCE</b> for violation behaviors (such as plagiarism, cheating, etc). When a user is deemed violating contest rules, we will apply the following penalties on this user:\r\n      <ul>\r\n       <li><b>First violation</b>: LeetCoin amount resets to zero and a contest and discuss ban for 1 month.</li>\r\n       <li><b>Second violation</b>: Permanent account deactivation without appeal. </li> \r\n      </ul>\r\n      <br /> Furthermore, we encourage all participants to contribute to maintaining the justice and fairness of our contest. Users who submit valid violation report(s) will earn additional LeetCoins:\r\n      <ul>\r\n       <li>For each violating participant, the first 10 users who submit the violation report towards this participant will each earn 20 LeetCoins. </li>\r\n       <li>Each user can earn up to 100 LeetCoins for reporting violations in a contest.</li>\r\n       <li>Users will not be rewarded LeetCoins for reports on LCCN users.</li>\r\n      </ul>\r\n     </ol>\r\n            <br><br>\r\n  <h4 class=\"text-300\">\r\n    <i class=\"fa fa-bullhorn\" style=\"color: #FEA116\" aria-hidden=\"true\"></i>\r\n    &nbsp;Announcement\r\n</h4>\r\n            <p>\r\n                Users <b class=\"text-orange\">must register</b> to participate. We hope you enjoy this contest!\r\n            </p>\r\n            <br>\r\n        </div>\r\n        <div class=\"col-sm-4 col-md-3\">\r\n            <h3 class=\"text-300\">\r\n                <i class=\"fa fa-trophy text-orange\" aria-hidden=\"true\"></i>\r\n                &nbsp;Prize\r\n            </h3>\r\n            <ul class=\"list-group\" style=\"margin-top: 20px\">\r\n                <li class=\"list-group-item\">\r\n                    <b>1st</b>\r\n                    <span class=\"pull-right\">\r\n                        5,000 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n                    <b>2nd</b>\r\n                    <span class=\"pull-right\">\r\n                        2,500 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n                    <b>3rd</b>\r\n                    <span class=\"pull-right\">\r\n                        1,000 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n                    <b>4</b> - <b>50th</b>\r\n                    <span class=\"pull-right\">\r\n                        300 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n                    <b>51</b> - <b>100th</b>\r\n                    <span class=\"pull-right\">\r\n                        100 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n                    <b>101</b> - <b>200th</b>\r\n                    <span class=\"pull-right\">\r\n                        50 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n                    <b>Participate</b>\r\n                    <span class=\"pull-right\">\r\n                        5 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n                    <b>First Time Participant</b>\r\n                    <span class=\"pull-right\">\r\n                        200 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n                <li class=\"list-group-item\">\r\n<span style=\"\r\n    position: absolute;\r\n    color: rgb(245, 0, 87);\r\n    font-size: 10px;\r\n    transform: translate(-8px, -9px);\r\n\"></span>\r\n                    <b>Participate Biweekly + Weekly Contests in Same Week</b>\r\n                    <span class=\"pull-right\">\r\n                        35 <a href=\"/points/\" target=\"_blank\"><img src=\"/static/images/LeetCoin.png\" height=\"15px\" alt=\"LeetCoin\"></a>\r\n                    </span>\r\n                </li>\r\n            </ul>\r\n        </div>\r\n   </div>\r\n</div>\r\n<hr>\r\n<p><b>Want millions of LeetCode users to <i>recognize your company</i>? <a href=\"mailto:contest@leetcode.com\" target=\"_href\">Contact us</a> to sponsor a contest.</b></p>",
                "duration": 5400,
                "start_time": 1719066600,
                "is_virtual": false,
                "origin_start_time": 1719066600,
                "is_private": false,
                "discuss_topic_id": 5352797
            },
            "questions": [...],
            "company": {...},
            "containsPremium": false,
            "registered": true,
            "survey": null,
            "current_timestamp": 1720070679.162951
        }'''
        data = self.json_request(f"{self.api_base}/info/{self.contest}")
        return data

    def fetch_submissions(self, pages: list[int]):
        Path(join(self.out_path, "submissions")).mkdir(exist_ok=True)

        info_path = join(f"{self.out_path}", "info.csv")
        info_file = open(info_path, 'w', newline='', encoding='utf-8')
        writer = csv.writer(info_file)
        writer.writerow(["filename", "created_at", "subm_ts", "subm_id"])

        for page in pages:
            data = self.json_request(f"{self.contest_base}/?pagination={page}&region=global")
            # print(json.dumps(data["questions"], indent=4))
            question_id = str(data["questions"][self.ques_num-1]["question_id"])

            submission_futures = []

            for user, submissions in zip(data["total_rank"], data["submissions"]):
                if question_id not in submissions:
                    submission_futures.append(None)
                    continue
                cont_subm = submissions[question_id]
                api_base = self.api_base_base.get(cont_subm['data_region'], self.api_base_base['US'])
                submission_futures.append(
                    self.thread_pool.submit(self.json_request, f"{api_base}/submissions/{cont_subm['submission_id']}/")
                )
            
            for user, submissions, submission_future in zip(data["total_rank"], data["submissions"], submission_futures):
                if submission_future is None:
                    continue
                cont_subm = submissions[question_id]
                api_base = self.api_base_base.get(cont_subm['data_region'], self.api_base_base['US'])
                submission = submission_future.result()
                
                # filename = f"{user['rank']}____{user['username']}.{LANG_EXT[submission['lang']]}"
                uname_encoded = base64.urlsafe_b64encode(user['username'].encode('utf-8')).decode()
                filename = f"{user['rank']}__b_{uname_encoded}.{LANG_EXT[submission['lang']]}"
                print(filename)
                subm_path = join(self.out_path, "submissions", filename)
                content = submission['code'].encode('utf-8')
                if not exists(subm_path) or getsize(subm_path) != len(content):
                    with open(subm_path, "wb") as f:
                        f.write(content)
                        
                subm_time = datetime.fromtimestamp(cont_subm['date'])
                subm_time = subm_time.strftime("%Y-%m-%d %H:%M:%S") + " -0400"
                writer.writerow([f"submissions/{filename}", subm_time, cont_subm['date'], cont_subm['submission_id']])
                info_file.flush()
        
        info_file.close()

def main():
    client = LcClient(sys.argv[1], int(sys.argv[2]))
    client.fetch_submissions(range(1, 50))

if __name__ == "__main__":
    main()