
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

export interface UserPair {
    fileId1: string
    fileId2: string
    similarity: number
}

export interface GroupUser {
    groupId: string
    fileId: string
    username: string
    rank: number
    subm_ts: number
}

export interface SubmissionUser {
    username: string
    submission: string
    submit_ts: number
}

export interface ContestInfo {
    name: string
    contest: string
    question: number
    url: string
    numsubm: number
    sim80_numgroups: number
    sim80_numsubm: number
    subm1_ts: number
}