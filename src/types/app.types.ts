


export interface SimilarSubmission {
    reportId: string
    username: string
    similarity: number
}

export interface UsersAnalysis {
    num_contests: Record<string, number>
}