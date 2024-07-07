import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SimilarSubmission, UsersAnalysis } from "../types/app.types";
import { fetchContestInfo, fetchUserSimilarSubmissions, fetchUsersAnalysis } from "../util/api";
import { ContestInfo } from "../types/report.types";

function SimilarPairsGroup({ pairs, report }: {
    report: ContestInfo,
    pairs: SimilarSubmission[]
}) {
    const [expanded, setExpanded] = useState(true);

    return <>
        <tr className={`group-heading`} onClick={() => setExpanded(!expanded)}>
            <td><i className={`icon fa-solid fa-chevron-${expanded ? 'down' : 'right'}`}></i></td>
            <td>{report.name}</td>
            <td>({pairs.length} users)</td>
            <td></td>
        </tr>
        {expanded && pairs.map(pair =>
            <tr key={pair.username} className={`group-item`} tabIndex={0}>
                <td></td>
                <td><Link to={`/u/${pair.username}`}>{pair.username}</Link></td>
                <td>{pair.similarity}</td>
            </tr>
        )}
    </>
}

export function UserPageComponent() {
    const { username } = useParams();
    const [reportPairs, setReportPairs] = useState<Record<string, SimilarSubmission[]>>({});
    const [contestInfo, setContestInfo] = useState<[string, ContestInfo][]>();

    useEffect(() => {
        if (!username) return;
        fetchContestInfo().then(infos => {
            const reports = Object.entries(infos.reports);
            reports.sort((r1, r2) => (r2[1].contest_start_ts + r2[1].ques_num) - (r1[1].contest_start_ts + r1[1].ques_num));
            setContestInfo(reports);
        });
        fetchUserSimilarSubmissions(username).then(pairs => {
            const reports: Record<string, SimilarSubmission[]> = {};
            for (const pair of pairs) {
                if (reports[pair.reportId] === undefined) {
                    reports[pair.reportId] = [];
                }
                reports[pair.reportId].push(pair);
            }
            Object.values(reports).forEach(pairs => {
                pairs.sort((p1, p2) => p1.similarity - p2.similarity);
            })
            setReportPairs(reports);
        });
    }, [username]);

    return <div style={{ height: "100%" }}>
        <h2 style={{display: "inline-block"}}>{username}</h2> &nbsp;
        <h4 style={{display: "inline-block"}}><a href={`https://leetcode.com/u/${username}/`} target="blank">
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
        </a></h4>

        {!reportPairs || !contestInfo
            ? <>Loading ...</>
            : <table className="data-table" cellSpacing={0} cellPadding={0} style={{ minWidth: 500 }}>
                <thead>
                    <tr>
                        <th className="shrink"></th>
                        <th>Username</th>
                        <th className="shrink">Similarity</th>
                    </tr>
                </thead>
                <tbody>
                    {contestInfo.map(([reportId, reportInfo]) =>
                        reportPairs[reportId] && <SimilarPairsGroup pairs={reportPairs[reportId]} report={reportInfo} />)}
                </tbody>
            </table>}
    </div>
}


export function UsersListPageComponent() {
    const [usersList, setUsersList] = useState<[string, number][]>();

    useEffect(() => {
        fetchUsersAnalysis().then(analysis => {
            const list = Object.entries(analysis.num_contests);
            list.sort((a, b) => b[1] - a[1])
            setUsersList(list);
        });
    }, []);

    return <div style={{ height: "100%" }}>
        <h2>Users found in reports</h2>
        {!usersList
            ? <>Loading ...</>
            : <table className="data-table" cellSpacing={0} cellPadding={0} style={{ minWidth: 200 }}>
                <thead>
                    <tr>
                        <th></th>
                        <th>Username</th>
                        <th className="shrink"># Contests</th>
                    </tr>
                </thead>
                <tbody>
                    {usersList.map(([username, numContest]) =>
                        <tr key={username} className={`group-item`} tabIndex={0}>
                            <td></td>
                            <td><Link to={`/u/${username}`}>{username}</Link></td>
                            <td>{numContest}</td>
                        </tr>
                    )}
                </tbody>
            </table>}
    </div>
}

