from collections import defaultdict
from dataclasses import dataclass
from math import floor
from pathlib import Path
from common import *
from os.path import join, isdir, exists
import os
import json
from post_plag import ReportProcessor, DolosPair
import sqlite3
import base64
from shutil import rmtree

def bs_int(num_bytes):
    def f(val):
        return val.to_bytes(num_bytes, 'big')
    return f

def bs_tuple(*val_encoders):
    def f(t):
        ret = bytes()
        for val, enc in zip(t, val_encoders):
            # if isinstance(val, int):
                # ret += val.to_bytes(size, 'big')
            ret += enc(val)
            # else:
            #     raise Exception(f"Serialize of type {val.__class__.__name__} is not supported")
        return ret
    return f

def bs_array(item_encoder):
    def f(arr):
        ret = bytes()
        ret += len(arr).to_bytes(2, 'big')
        for item in arr:
            item = item_encoder(item)
            assert isinstance(item, bytes), "Item not binary"
            ret += item
        return ret
    return f
    # ret = base64.b64encode(ret)
    # return ret.decode("ascii") 

def bs_dict(key_encoder, val_encoder):
    def f(d):
        ret = bytes()
        ret += len(d).to_bytes(2, 'big')
        for k, v in d.items():
            k = key_encoder(k)
            v = val_encoder(v)
            assert isinstance(k, bytes), "Key not binary"
            assert isinstance(v, bytes), "Val not binary"
            ret += k + v
        return ret
    return f

# user_struct = bs_dict(
#     bs_int(2), 
# )

# data_struct = bs_dict(
#     bs_int(2), bs_dict(
#         bs_int(2), bs_array(bs_tuple(bs_int(1), bs_int(1)))
#     )
# )


class LcAnalyzer:
    def __init__(self) -> None:
        self.contests_dir = CONTESTS_OUT_PATH
        self.users_json_path = join(ANALYSIS_OUT_PATH, "users.json")
        self.users_dir = join(ANALYSIS_OUT_PATH, "users")

        Path(ANALYSIS_OUT_PATH).mkdir(exist_ok=True)
        Path(self.users_dir).mkdir(exist_ok=True)

    def write_pair(self, username: str, report_id, username2, similarity):
        user_file = join(self.users_dir, f"sim_{username}.json")
        write_header = not exists(user_file)

        with open(user_file, "a", newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if write_header:
                writer.writerow(["reportId", "username", "similarity"])
            writer.writerow([report_id, username2, similarity])
            f.flush()

    def process(self, sim_thres):
        contest_info_path = join(self.contests_dir, "contest-info.json")
        with open(contest_info_path) as f:
            reports = json.load(f)["reports"]
        
        rmtree(self.users_dir)
        Path(self.users_dir).mkdir()

        users_cont = defaultdict(set)

        for report_id, report_info in reports.items():
            report_proc = ReportProcessor(report_info["contest"], report_info["ques_num"], None)

            print(f"Reading report {report_proc.report_name}")
            pairs = report_proc.get_pairs()
            files = report_proc.get_files()
            print(f"Processing report {report_proc.report_name}")
            for pair in pairs:
                if pair.similarity < sim_thres/100:
                    continue
                user1 = files[pair.leftFileId]
                user2 = files[pair.rightFileId]
                sim_perc = floor(pair.similarity*100)

                self.write_pair(user1.get_username(), report_id, user2.get_username(), sim_perc)
                self.write_pair(user2.get_username(), report_id, user1.get_username(), sim_perc)

                users_cont[user1.get_username()].add(report_id)
                users_cont[user2.get_username()].add(report_id)
        
        with open(self.users_json_path, 'w') as f:
            json.dump({
                "num_contests": {
                    name: len(cont) for name, cont in users_cont.items()
                }
            }, f)
                

    # def write(self):
    #     with open(self.users_json_path, "w") as f:
    #         data = data_struct(self.user_user_contest_sim)
    #         print(f"Encoded size: {len(data)} bytes")
    #         json.dump({
    #             "reports": self.reports,
    #             "user_user_contest_sim": base64.b64encode(data).decode("ascii"),
    #             # "user_user_sim": self.user_user_sim,
    #             "users": self.users
    #         }, f, indent=4)

    
    