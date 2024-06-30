import { UserPair } from "../types/dolos.types";

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


}
