
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

export interface GroupUser {
    groupId: string
    fileId: string
    username: string
    rank: number
}

export interface SubmissionUser {
    username: string,
    submission: string
}