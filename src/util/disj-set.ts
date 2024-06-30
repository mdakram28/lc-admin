
export class DisjSet {
    rank: {[k: string]: number}
    parent: {[k: string]: string}

    constructor() {
        this.rank = {};
        this.parent = {};
    }

    groupOf(x: string) {
        if (this.parent[x] === undefined) {
            this.parent[x] = x;
        }
        if (this.parent[x] !== x) {
            this.parent[x] = this.groupOf(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x: string, y: string) {
        const xset = this.groupOf(x);
        const yset = this.groupOf(y);

        if (xset === yset) return;

        const xrank = this.rank[xset] ?? 0;
        const yrank = this.rank[yset] ?? 0;

        if (xrank < yrank) {
            this.parent[xset] = yset;
        } else if (xrank > yrank) {
            this.parent[yset] = xset;
        } else {
            this.parent[yset] = xset;
            this.rank[xset]++;
        }
    }

    groups() {
        const groups: {[k: string]: string[]} = {};

        for (const x in this.parent) {
            const g = this.groupOf(x);
            if (groups[g] === undefined) {
                groups[g] = [];
            }
            groups[g].push(x);
        }

        return Object.values(groups);
    }
}