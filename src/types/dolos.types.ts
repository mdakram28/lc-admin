
export interface DolosFile {
    id: string,
    // ignored: boolean,
    path: string,
    content: string,
    // amountOfKgrams: number,
    // ast: string,
    // mapping: string,
    // extra: string
}

export interface DolosPairs {
    id: string
    leftFileId: string
    leftFilePath: string
    rightFileId: string
    rightFilePath: string
    similarity: number
    totalOverlap: number
    longestFragment: number
    leftCovered: number
    rightCovered: number
}

export interface ClusterMember {
    user: string,
    code: string
}

export interface Cluster {
    members: ClusterMember[]
}