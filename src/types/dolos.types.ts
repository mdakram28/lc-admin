

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
    ques_num: number
    url: string
    numsubm: number
    sim80_numgroups: number
    sim80_numsubm: number
    subm1_ts: number
}
