import { ContestInfo, GroupUser, SubmissionUser } from "../types/dolos.types";
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


export const fetchGroups = async (baseDir: string, similarity: number) => {
    const url = `${APP_BASE}${baseDir}/groups/group_${similarity}.csv`;
    console.log(url);
    let groupsText = await (await fetch(url)).text();
    const parsedFiles = Papa.parse<GroupUser>(groupsText.trim(), {
        header: true,
        dynamicTyping: true
    });
    const groups: Record<string, GroupUser[]> = {};
    for (const user of parsedFiles.data) {
        if (groups[user.groupId] === undefined) {
            groups[user.groupId] = [];
        }
        groups[user.groupId].push(user);
    }

    console.log(groups)
    const groupsList = Object.values(groups);
    groupsList.sort((a, b) => b.length - a.length);
    groupsList.forEach(group => group.sort((a, b) => a.subm_ts - b.subm_ts));

    return groupsList;
};

const CACHE_USERS: Record<string, SubmissionUser> = {};

export const fetchUser = async (baseDir: string, userFileId: string) => {
    const url = `${APP_BASE}${baseDir}/users/user_${userFileId}.json`;
    if (url in CACHE_USERS) {
        return CACHE_USERS[url];
    }

    const user: SubmissionUser = JSON.parse(await (await fetch(url)).text());
    CACHE_USERS[url] = user;

    return user;
}