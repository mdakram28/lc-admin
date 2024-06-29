import "../styles/prettyprint-style.css";
import { useEffect, useRef, useState } from "react";
import Papa from 'papaparse';
import { ContestInfo, DolosFile, DolosPairs, GroupUser, SubmissionUser } from "../types/dolos.types";
import { DisjSet } from "../util/disj-set";
import { Panel, PanelGroup, PanelResizeHandle, assert } from "react-resizable-panels";
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, Slider } from "@mui/material";
import { useParams } from "react-router-dom";
import { fetchContestInfo } from "./report-list.component";

declare var PR: any;

const fetchGroups = async (baseDir: string, similarity: number) => {
    let groupsText = await (await fetch(`${baseDir}/groups/group_${similarity}.csv`)).text();
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

    const groupsList = Object.values(groups);
    groupsList.sort((a, b) => b.length - a.length);
    groupsList.forEach(group => group.sort((a, b) => a.subm_ts - b.subm_ts));

    return groupsList;
};

const CACHE_USERS: Record<string, SubmissionUser> = {};

const fetchUser = async (baseDir: string, userFileId: string) => {
    const url = `${baseDir}/users/user_${userFileId}.json`;
    if (url in CACHE_USERS) {
        return CACHE_USERS[url];
    }

    const user: SubmissionUser = JSON.parse(await (await fetch(url)).text());
    CACHE_USERS[url] = user;

    return user;
}

export function PlagReportComponent({ }: {}) {
    const { reportName } = useParams();
    const [baseDir, setBaseDir] = useState<string | undefined>();
    const [similarity, setSimilarity] = useState(80);

    const [groups, setGroups] = useState<GroupUser[][]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | undefined>();
    const [selectedUser, setSelectedUser] = useState<SubmissionUser | undefined>();

    const [hideBlankLines, setHideBlankLines] = useState(true);
    const codePreRef = useRef<HTMLPreElement>(null);

    const formatCode = (code: string) => {
        let lines = code.split("\n");
        if (hideBlankLines) {
            lines = lines.filter(line => line.trim().length > 0);
        }
        return lines.join("\n");
    }

    useEffect(() => {
        if (!reportName) return;
        fetchContestInfo()
            .then(infos => setBaseDir(infos.reports[reportName].url));
    }, [reportName])

    const reload = () => {
        if (baseDir === undefined) return;
        fetchGroups(baseDir, similarity)
            .then(groups => setGroups(groups));
    }

    useEffect(() => {
        reload();
    }, [baseDir]);

    useEffect(() => {
        if (selectedFileId === undefined || baseDir === undefined) return;

        fetchUser(baseDir, selectedFileId)
            .then(user => setSelectedUser(user));
    }, [selectedFileId]);

    useEffect(() => {
        if (!selectedUser) return;

        setTimeout(() => {
            codePreRef.current!.innerHTML = formatCode(selectedUser.submission);
            codePreRef.current!.className = "prettyprint linenums lang-cpp";
            PR.prettyPrint();
        }, 1);
    }, [selectedUser, hideBlankLines]);

    return <>
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <div style={{ overflow: "auto" }}>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1-content"
                            id="panel1-header"
                        >
                            Settings
                        </AccordionSummary>
                        <AccordionDetails>
                            Similarity &gt;= {similarity}
                            <Slider
                                aria-label="Similarity"
                                defaultValue={similarity}
                                getAriaValueText={(perc) => `${perc}%`}
                                valueLabelDisplay="auto"
                                shiftStep={2}
                                step={2}
                                marks
                                min={70}
                                max={100}
                                onChange={(ev, value) => setSimilarity(value as number)}
                            />
                            <Button variant="outlined" onClick={ev => reload()}>Save</Button>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel2-content"
                            id="panel2-header"
                        >
                            Stats
                        </AccordionSummary>
                        <AccordionDetails>
                            Total similar groups: {groups.length} <br />
                            Total similar submissions: {groups.reduce((a, b) => a + b.length, 0)}
                        </AccordionDetails>
                    </Accordion>

                    <br />
                    <br />
                    <TreeView
                        aria-label="file system navigator"
                        defaultCollapseIcon={<ExpandMoreIcon />}
                        defaultExpandIcon={<ChevronRightIcon />}
                        // sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                        onNodeSelect={(ev, selected) => setSelectedFileId(selected)}
                    >
                        {groups.map((group, groupId) => <>
                            <TreeItem nodeId={`g${groupId.toString()}`} label={`Group ${groupId} (${group.length})`}>
                                {group.map(user => <>
                                    <TreeItem
                                        nodeId={user.fileId.toString()}
                                        label={<><span style={{ width: 100, display: "inline-block" }}>{user.rank}</span>{user.username}</>}
                                    />
                                </>)}
                            </TreeItem>
                        </>)}
                    </TreeView>

                </div>
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                <div style={{ overflow: "auto" }}>
                    
                    {selectedUser && <>
                        <div style={{display: "flex", margin: "10px 0"}}>
                            <h3 style={{margin: 0}}>
                                <a href={`https://leetcode.com/u/${selectedUser.username}/`} target="blank">
                                {selectedUser.username}&nbsp;<i className="fa-solid fa-arrow-up-right-from-square"></i>
                                </a>
                            </h3>
                            <span style={{flexGrow: 1}}></span>
                            <span>Submitted at: {new Date(selectedUser.submit_ts).toTimeString()}</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={hideBlankLines}
                            onChange={ev => setHideBlankLines(ev.target.checked)}
                            id="codeHideBlankLines"
                        />
                        <label htmlFor="codeHideBlankLines">Hide blank lines</label>
                        <pre
                            ref={codePreRef}
                            style={{ color: "auto" }}></pre>
                    </>}
                </div>
            </Panel>
        </PanelGroup>

    </>
}