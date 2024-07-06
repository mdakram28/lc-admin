import { SimilarSubmission, UsersAnalysis } from "../types/app.types";
import { ContestInfo, Submission, User, UserPair } from "../types/report.types";
import Papa from 'papaparse';

const APP_BASE = import.meta.env.PROD ? "/lc-admin/" : "";


export const fetchContestInfo = async () => {
    const url = `${APP_BASE}contests/contest-info.json`;
    console.log(url)
    const contestInfo: {
        reports: Record<string, ContestInfo>
    } = JSON.parse(await (await fetch(url)).text());
    return contestInfo;
}

export const fetchUsersAnalysis = async () => {
    const url = `${APP_BASE}analysis/users.json`;
    console.log(url)
    const usersInfo: UsersAnalysis = JSON.parse(await (await fetch(url)).text());
    return usersInfo;
}

export const fetchPairs = async (baseDir: string, similarity: number) => {
    const url = `${APP_BASE}${baseDir}/pairs/pairs_${similarity}.csv`;
    console.log(url);
    let pairsText = await (await fetch(url)).text();
    const parsedFiles = Papa.parse<UserPair>(pairsText.trim(), {
        header: true,
        dynamicTyping: true
    });

    return parsedFiles.data;
};

export const fetchUserSimilarSubmissions = async (username: string) => {
    const url = `${APP_BASE}analysis/users/sim_${username}.json`;
    console.log(url);
    let pairsText = await (await fetch(url)).text();
    const parsedFiles = Papa.parse<SimilarSubmission>(pairsText.trim(), {
        header: true,
        dynamicTyping: true
    });

    return parsedFiles.data;
};

const CACHE_USERS: Record<string, Submission> = {};

export const fetchUserSubmission = async (baseDir: string, userFileId: string) => {
    const url = `${APP_BASE}${baseDir}/users/user_${userFileId}.json`;
    if (url in CACHE_USERS) {
        return CACHE_USERS[url];
    }

    const user: Submission = JSON.parse(await (await fetch(url)).text());
    CACHE_USERS[url] = user;

    return user;
}

export const fetchUsers = async (baseDir: string) => {
    const url = `${APP_BASE}${baseDir}/users.csv`;
    let text = await (await fetch(url)).text();
    const parsed = Papa.parse<User>(text.trim(), {
        header: true,
        dynamicTyping: true
    });
    const ret: Record<string, User> = {};
    for (const user of parsed.data) {
        ret[user.fileId] = user;
    }
    return ret;
}