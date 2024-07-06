import { useContext, useEffect, useMemo, useState } from "react";
import { User } from "../types/report.types";
import { UserGraph } from "../util/graph";
import { ReportContext } from "./plag-report.component";

export type OnUserSelectCallback = (user: User) => void;

const GroupComponent = ({ groupId, group, sortBy }: {
    groupId: number,
    group: User[],
    sortBy: string
}) => {
    const { graph, selectedFileId, setSelectedFileId } = useContext(ReportContext);
    const [expanded, setExpanded] = useState(false);

    const GroupItems = () => {
        const neighbours = graph.graph[selectedFileId] || {};

        const simWith: Record<string, number> = {};
        for (const user of group) {
            simWith[user.fileId] = Object.keys(graph.graph[user.fileId]).length;
        }

        const sortedGroup = useMemo(() => {
            const asc = sortBy.endsWith('a') ? 1 : -1;
            if (sortBy.startsWith('r')) return group.toSorted((a, b) => (a.rank - b.rank) * asc);
            if (sortBy.startsWith('u')) return group.toSorted((a, b) => (a.username.localeCompare(b.username)) * asc);
            if (sortBy.startsWith('sw')) return group.toSorted((a, b) => (simWith[a.fileId] - simWith[b.fileId]) * asc);
            return [...group];
        }, [group, sortBy]);

        const selectedIdx = sortedGroup.findIndex(u => u.fileId === selectedFileId);
        const lineStart = Math.min(selectedIdx, sortedGroup.findIndex(u => neighbours[u.fileId]));
        const lineEnd = Math.max(selectedIdx, sortedGroup.findLastIndex(u => neighbours[u.fileId]));

        return sortedGroup.map((user, userIdx) =>
            <tr key={user.fileId}
                className={`group-item 
                            ${selectedFileId === user.fileId && 'selected'}
                            ${neighbours[user.fileId] && 'dist1'}`}
                onClick={() => setSelectedFileId(user.fileId)} tabIndex={0}>
                <td></td>
                <td className="pipe">
                    {
                        userIdx === lineStart ? <span>┌</span> :
                            userIdx === lineEnd ? <span>└</span> :
                                neighbours[user.fileId] ? <span>├</span> :
                                    userIdx > lineStart && userIdx < lineEnd && <span>│</span>
                    }
                </td>
                <td>{user.rank}</td>
                <td>{user.username}</td>
                <td>{simWith[user.fileId]}</td>
            </tr>);
    }

    return <>
        <tr className={`group-heading ${expanded && 'expanded'}`} onClick={() => setExpanded(!expanded)}>
            <td><i className={`icon fa-solid fa-chevron-${expanded ? 'down' : 'right'}`}></i></td>
            <td>
                Group {groupId + 1}
            </td>
            <td>({group.length} users)</td>
            <td></td>
            <td></td>
        </tr>
        {expanded && <GroupItems />}
    </>
}

export function GroupsTableComponent({ filterText }: { filterText: string }) {
    const { groups } = useContext(ReportContext);
    const [sortBy, setSortBy] = useState("sw-d");

    const toggleSort = (name: string) => {
        if (sortBy.startsWith(name)) {
            if (sortBy.endsWith("a")) {
                setSortBy(`${name}-d`);
            } else {
                setSortBy(`${name}-a`);
            }
        } else {
            setSortBy(`${name}-a`);
        }
    }

    const sortToggler = (name: string) => {
        return sortBy === `${name}-a` ? <i className="fa-solid fa-arrow-up-long"></i>
            : sortBy === `${name}-d` ? <i className="fa-solid fa-arrow-down-long"></i>
                : <i style={{ opacity: 0.2 }} className="fa-solid fa-arrows-up-down"></i>;
    }

    
    const filteredGroups = useMemo(() => {
        if (!filterText) return groups;
        const f = filterText.toLowerCase();
        return groups.map(g => g.filter(u => u.username && u.username.toString().toLowerCase().includes(f)));
    }, [groups, filterText]);

    return <>
        <table className="data-table" cellSpacing={0} cellPadding={0}>
            <thead>
                <tr>
                    <th></th>
                    <th className="shrink">Group</th>
                    <th onClick={() => toggleSort("r")} className="shrink">Rank {sortToggler('r')}</th>
                    <th onClick={() => toggleSort("u")} >Username {sortToggler('u')}</th>
                    <th onClick={() => toggleSort("sw")} className="shrink">Similar with {sortToggler('sw')}</th>
                </tr>
            </thead>
            <tbody>
                {filteredGroups.map((group, groupId) =>
                    <GroupComponent key={groupId} group={group} groupId={groupId} sortBy={sortBy}/>
                )}
            </tbody>
        </table>
    </>
}   