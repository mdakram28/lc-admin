from common import *
import csv
import json
from pathlib import Path
from typing import List, Tuple, Dict, TypedDict
from collections import defaultdict
from os.path import join, basename, exists
from functools import cache
from dataclasses import dataclass

class DisjSet: 
    def __init__(self): 
        self.rank: defaultdict[str, int] = defaultdict(int)
        self.parent: Dict[str, str] = {}
  
    def findParent(self, x: str) -> str: 
        if x not in self.parent:
            self.parent[x] = x
        if self.parent[x] != x:
            self.parent[x] = self.findParent(self.parent[x])
        return self.parent[x] 

    def union(self, x: str, y: str): 
        xset = self.findParent(x)
        yset = self.findParent(y)
        if xset == yset:
            return

        if self.rank[xset] < self.rank[yset]: 
            self.parent[xset] = yset 
        elif self.rank[xset] > self.rank[yset]: 
            self.parent[yset] = xset 
        else: 
            self.parent[yset] = xset
            self.rank[xset] = self.rank[xset] + 1

    def get_groups(self) -> List[List[str]]:
        groups: defaultdict[str, List[str]] = defaultdict(list)
        for node in self.parent.keys():
            groups[self.findParent(node)].append(node)
        group_list = list(groups.values())
        group_list.sort(key=lambda l: len(l), reverse=True)
        return group_list

@dataclass
class DolosPair:
    leftFileId: str
    rightFileId: str
    similarity: float

@dataclass
class DolosFile:
    id: str
    path: str
    content: str
    subm_ts: float

    # Computed fields
    def get_username(self):
        name, ext = basename(self.path).rsplit(".", 1)
        rank, name = name.split("____", 1)
        assert rank.isnumeric(), "Invalid rank"
        return name
    
    def get_rank(self):
        name, ext = basename(self.path).rsplit(".", 1)
        rank, name = name.split("____", 1)
        assert rank.isnumeric(), "Invalid rank"
        return rank

class ReportProcessor:
    def __init__(self, contest_name, ques_num) -> None:
        self.contest_name = contest_name
        self.ques_num = ques_num
        self.report_name = f"{contest_name}_Q{ques_num}"
        self.base_dir = join(OUT_PATH, self.report_name)
        self.report_dir = join(self.base_dir, "dolos-report")

    @cache
    def get_pairs(self) -> List[DolosPair]:
        pairs_path = join(self.report_dir, "pairs.csv")
        ret = []
        with open(pairs_path) as pairs_csv:
            csv_reader = csv.DictReader(pairs_csv)
            for row in csv_reader:
                if csv_reader.line_num == 0:
                    continue
                ret.append(DolosPair(row["leftFileId"], row["rightFileId"], float(row["similarity"])))
        return ret

    @cache
    def get_files(self) -> Dict[str, DolosFile]:
        dolos_info_path = join(self.base_dir, "info.csv")
        subm_time = {}
        with open(dolos_info_path) as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                if csv_reader.line_num == 0:
                    continue
                subm_time[row["filename"]] = float(row["subm_ts"])

        files_path = join(self.report_dir, "files.csv")
        ret = {}
        with open(files_path) as f:
            csv_reader = csv.DictReader(f)
            for row in csv_reader:
                if csv_reader.line_num == 0:
                    continue
                ret[row["id"]] = DolosFile(row["id"], row["path"], row["content"], subm_time[row["path"]])
        return ret

    def get_groups(self, sim_thres: int):
        pairs = self.get_pairs()

        groups = DisjSet()
        for pair in pairs:
            if pair.similarity < sim_thres/100:
                continue
            groups.union(pair.leftFileId, pair.rightFileId)
        
        return groups.get_groups()

    def write_group(self, sim_thres: int):
        files = self.get_files()
        groups = self.get_groups(sim_thres)
        
        out_dir = join(self.base_dir, "groups")
        Path(out_dir).mkdir(exist_ok=True)
        with open(join(out_dir, f"group_{sim_thres}.csv"), "w") as f:
            writer = csv.writer(f)
            writer.writerow(["groupId", "fileId", "username", "rank", "subm_ts"])
            for groupId, fileIds in enumerate(groups):
                writer.writerows([
                    [groupId, fileId, files[fileId].get_username(), files[fileId].get_rank(), files[fileId].subm_ts]
                    for fileId in fileIds
                ])

    def write_users(self):
        files = self.get_files()
        out_dir = join(self.base_dir, "users")
        Path(out_dir).mkdir(exist_ok=True)

        for file in files.values():
            user_file = join(out_dir, f"user_{file.id}.json")
            with open(user_file, 'w') as f:
                json.dump({
                    "username": file.get_username(),
                    "submission": file.content,
                    "submit_ts": file.subm_ts
                }, f, indent=4)

    def write_contest_info(self):
        info_path = join(OUT_PATH, "contest-info.json")
        info = {
            "reports": {}
        }
        if exists(info_path):
            with open(info_path) as f:
                info = json.load(f)

        sim80 = self.get_groups(80)

        info["reports"][self.report_name] = {
            "name": self.report_name,
            "contest": self.contest_name,
            "ques_num": self.ques_num,
            "url": f"/contests/{self.report_name}",
            "numsubm": len(self.get_files()),
            "sim80_numgroups": len(sim80),
            "sim80_numsubm": sum(len(g) for g in sim80),
        }

        with open(info_path, 'w') as f:
            json.dump(info, f, indent=4)

def main():
    SIMILARITY_PERCENTAGES = list(range(70, 101, 2))

    report = ReportProcessor("weekly-contest-391", 4)
    for similarity in SIMILARITY_PERCENTAGES:
        print(f"Writing group with {similarity=}")
        report.write_group(similarity)

    # report.write_users()
    # report.write_contest_info()

if __name__ == "__main__":
    main()