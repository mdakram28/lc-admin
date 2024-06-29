import csv
import json
from pathlib import Path
from typing import List, Tuple, Dict, TypedDict
from collections import defaultdict
from os.path import join, basename
from functools import cache
from dataclasses import dataclass

csv.field_size_limit(100_000_000)

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
    def __init__(self, base_dir) -> None:
        self.base_dir = base_dir
        self.report_dir = join(base_dir, "dolos-report")

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
        files_path = join(self.report_dir, "files.csv")
        ret = {}
        with open(files_path) as files_csv:
            csv_reader = csv.DictReader(files_csv)
            for row in csv_reader:
                if csv_reader.line_num == 0:
                    continue
                ret[row["id"]] = DolosFile(row["id"], row["path"], row["content"])
        return ret

    def write_group(self, sim_thres: int):
        files = self.get_files()
        pairs = self.get_pairs()

        groups = DisjSet()
        for pair in pairs:
            if pair.similarity < sim_thres/100:
                continue
            groups.union(pair.leftFileId, pair.rightFileId)
        
        out_dir = join(self.base_dir, "groups")
        Path(out_dir).mkdir(exist_ok=True)
        with open(join(out_dir, f"group_{sim_thres}.csv"), "w") as f:
            writer = csv.writer(f)
            writer.writerow(["groupId", "fileId", "username", "rank"])
            for groupId, fileIds in enumerate(groups.get_groups()):
                writer.writerows([
                    [groupId, fileId, files[fileId].get_username(), files[fileId].get_rank()]
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
                    "submission": file.content
                }, f, indent=4)

def main():
    QUESTION_PATH = "./public/contests/weekly-contest-391/Q_4"
    SIMILARITY_PERCENTAGES = list(range(70, 101, 2))

    report = ReportProcessor(QUESTION_PATH)
    for similarity in SIMILARITY_PERCENTAGES:
        print(f"Writing group with {similarity=}")
        report.write_group(similarity)

    report.write_users()
if __name__ == "__main__":
    main()