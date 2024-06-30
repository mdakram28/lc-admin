import { UserPair } from "../types/report.types";
import { DisjSet } from "./disj-set";

export class UserGraph {
    graph: Record<string, Record<string, UserPair>>

    constructor(pairs: UserPair[]) {
        this.graph = {}
        for (const pair of pairs) {
            if (this.graph[pair.fileId1] === undefined) {
                this.graph[pair.fileId1] = {};
            }
            if (this.graph[pair.fileId2] === undefined) {
                this.graph[pair.fileId2] = {};
            }
            this.graph[pair.fileId1][pair.fileId2] = pair;
            this.graph[pair.fileId2][pair.fileId1] = pair;
        }
    }

    makeGroups(simThres: number) {
        const ds = new DisjSet();
        for (const id1 in this.graph) {
            const g = this.graph[id1];
            for (const id2 in g) {
                if (g[id2].similarity >= simThres) {
                    ds.union(id1, id2);
                }
            }
        }

        return ds.groups();
    }
}
