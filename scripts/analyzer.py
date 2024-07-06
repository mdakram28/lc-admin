from collections import defaultdict
from dataclasses import dataclass
from math import floor
from pathlib import Path
from common import *
from os.path import join, isdir
import os
import json
from post_plag import ReportProcessor
import sqlite3
import base64

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

        self.users = defaultdict(lambda: defaultdict(dict))
        self.reports = {}

        Path(ANALYSIS_OUT_PATH).mkdir(exist_ok=True)
        pass
    

    # def read_users(self):
    #     csv_reader = csv.DictReader(self.users_csv_path)
    #     self.users.clear()
    #     for row in csv_reader:
    #         if csv_reader.line_num == 0:
    #             continue
    #         self.users[row["username"]] = row

    def process(self, sim_thres):
        contest_info_path = join(self.contests_dir, "contest-info.json")
        with open(contest_info_path) as f:
            reports = json.load(f)["reports"]

        # self.user_contest_user_sim = defaultdict(lambda: defaultdict(dict))
        self.user_user_contest_sim = defaultdict(lambda: defaultdict(list))
        # self.user_user_sim = defaultdict(lambda: defaultdict(int))
        self.reports = dict(enumerate(reports.values()))
        self.uids = {}
        self.users = {}

        for report_id, report_info in self.reports.items():
            report_proc = ReportProcessor(report_info["contest"], report_info["ques_num"])

            print(f"Reading report {report_proc.report_name}")
            pairs = report_proc.get_pairs()
            files = report_proc.get_files()
            print(f"Processing report {report_proc.report_name}")
            for pair in pairs:
                if pair.similarity < sim_thres/100:
                    continue
                user1 = files[pair.leftFileId]
                user2 = files[pair.rightFileId]
                uid1 = self.uids.setdefault(user1.get_username(), len(self.users))
                uid2 = self.uids.setdefault(user2.get_username(), len(self.users))

                self.users[uid1] = user1.get_username()
                self.users[uid2] = user2.get_username()

                self.user_user_contest_sim[uid1][uid2].append([report_id, floor(pair.similarity*100)])
                # self.user_contest_user_sim[uid1][report_id][uid2] = floor(pair.similarity*100)
                # self.user_contest_user_sim[uid2][report_id][uid1] = floor(pair.similarity*100)

    def process_sql(self):
        contest_info_path = join(self.contests_dir, "contest-info.json")
        with open(contest_info_path) as f:
            reports = json.load(f)["reports"]

        self.user_contest_user_sim = defaultdict(lambda: defaultdict(dict))
        self.reports = dict(enumerate(reports.values()))
        self.uids = {}
        self.users = {}

        con = sqlite3.connect(join(ANALYSIS_OUT_PATH, "reports.db"))
        cur = con.cursor()
        cur.execute("CREATE TABLE report(report_id, contest_name, ques_name, report_name)")
        cur.execute("CREATE TABLE user(user_id, user_name)")
        cur.execute("CREATE TABLE pair(report_id, user_id_1, user_id_2, similarity)")

        for report_id, report_info in self.reports.items():
            report_proc = ReportProcessor(report_info["contest"], report_info["ques_num"])
            
            q = f"INSERT INTO report VALUES ({report_id}, '{report_info["contest"]}', '{report_info["ques_num"]}', '{report_proc.report_name}')"
            print(q)
            cur.execute(q)
            con.commit()

            print(f"Reading report {report_proc.report_name}")
            pairs = report_proc.get_pairs()
            files = report_proc.get_files()
            print(f"Processing report {report_proc.report_name}")
            for pair in pairs:
                user1 = files[pair.leftFileId].get_username()
                user2 = files[pair.rightFileId].get_username()

                if user1 not in self.uids:
                    self.uids[user1] = len(self.uids)
                    cur.execute(f"INSERT INTO user VALUES ({self.uids[user1]}, '{user1}')")
                    con.commit()
                
                if user2 not in self.uids:
                    self.uids[user2] = len(self.uids)
                    cur.execute(f"INSERT INTO user VALUES ({self.uids[user2]}, '{user2}')")
                    con.commit()
                
                cur.execute(f"INSERT INTO pair VALUES ({report_id}, {self.uids[user1]}, {self.uids[user2]}, {round(100*pair.similarity)})")
                con.commit()

    def write(self):
        with open(self.users_json_path, "w") as f:
            data = data_struct(self.user_user_contest_sim)
            print(f"Encoded size: {len(data)} bytes")
            json.dump({
                "reports": self.reports,
                "user_user_contest_sim": base64.b64encode(data).decode("ascii"),
                # "user_user_sim": self.user_user_sim,
                "users": self.users
            }, f, indent=4)

    
    