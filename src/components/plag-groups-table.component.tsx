import { useMemo, useState } from "react";
import { GroupUser } from "../types/dolos.types";
import { UserGraph } from "../util/graph";

export type OnUserSelectCallback = (user: GroupUser) => void;

const GroupComponent = ({ groupId, group, onUserSelect, graph, selectedFileId }: {
    groupId: number,
    group: GroupUser[],
    selectedFileId: string,
    onUserSelect: OnUserSelectCallback,
    graph: UserGraph
}) => {
    const [expanded, setExpanded] = useState(false);

    const neighbours = graph.graph[selectedFileId] || {};
    console.log(selectedFileId, neighbours);

    const selectedIdx = group.findIndex(u => u.fileId === selectedFileId);
    const lineStart = Math.min(selectedIdx, group.findIndex(u => neighbours[u.fileId]));
    const lineEnd = Math.max(selectedIdx, group.findLastIndex(u => neighbours[u.fileId]));
    
    return <>
        <tr className={`group-heading ${expanded && 'expanded'}`} onClick={() => setExpanded(!expanded)}>
            <td><i className={`icon fa-solid fa-chevron-${expanded ? 'down': 'right'}`}></i></td>
            <td>
                Group {groupId + 1}
            </td>
            <td>({group.length} users)</td>
            <td></td>
        </tr>
        {expanded && group.map((user, userIdx) =>
            <tr className={`group-item 
                            ${selectedFileId === user.fileId && 'selected'}
                            ${neighbours[user.fileId] && 'dist1'}`} onClick={() => onUserSelect(user)} tabIndex={0}>
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
            </tr>)}
    </>
}

export function GroupsTableComponent({ groups, onUserSelect, graph, selectedFileId }: {
    groups: GroupUser[][],
    onUserSelect: OnUserSelectCallback,
    selectedFileId: string,
    graph: UserGraph
}) {

    return <>
        <table className="data-table" cellSpacing={0} cellPadding={0}>
            <tr>
                <th></th>
                <th className="shrink">Group</th>
                <th className="shrink">Rank</th>
                <th>Username</th>
            </tr>
            {groups.map((group, groupId) => <>
                <GroupComponent selectedFileId={selectedFileId} group={group} groupId={groupId} onUserSelect={onUserSelect} graph={graph}/>
            </>)}
        </table>
    </>
}