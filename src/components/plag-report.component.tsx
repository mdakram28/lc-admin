import "../styles/prettyprint-style.css";
import { useEffect, useRef, useState } from "react";
import Papa from 'papaparse';
import { DolosFile, DolosPairs, GroupUser, SubmissionUser } from "../types/dolos.types";
import { DisjSet } from "../util/disj-set";
import { Panel, PanelGroup, PanelResizeHandle, assert } from "react-resizable-panels";
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, Slider } from "@mui/material";

declare var PR: any;

const fetchGroups = async (reportUrl: string, similarity: number) => {
    let groupsText = await (await fetch(`${reportUrl}/groups/group_${similarity}.csv`)).text();
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

    // console.log(groups)
    const groupsList = Object.values(groups);
    groupsList.sort((a, b) => b.length - a.length);
    groupsList.forEach(group => group.sort((a, b) => a.rank - b.rank));


    return groupsList;
};

const CACHE_USERS: Record<string, SubmissionUser> = {};

const fetchUser = async (reportUrl: string, userFileId: string) => {
    const url = `${reportUrl}/users/user_${userFileId}.json`;
    if (url in CACHE_USERS) {
        return CACHE_USERS[url];
    }

    const user: SubmissionUser = JSON.parse(await (await fetch(url)).text());
    CACHE_USERS[reportUrl] = user;

    return user;
}

export function PlagReportComponent({ }: {}) {
    const [reportPath, setReportPath] = useState("/dolos-report");
    const [similarity, setSimilarity] = useState(90);
    
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

    const reload = () => {
        fetchGroups(reportPath, similarity)
            .then(groups => setGroups(groups));
    }

    useEffect(() => {
        reload();
    }, [reportPath]);

    useEffect(() => {
        if (selectedFileId === undefined) return;

        fetchUser(reportPath, selectedFileId)
            .then(user => {
                setSelectedUser(user);
                setTimeout(() => {
                    codePreRef.current!.innerHTML = formatCode(user.submission);
                    codePreRef.current!.className = "prettyprint linenums lang-cpp";
                    PR.prettyPrint();
                }, 1);
            });
    }, [selectedFileId]);

    // useEffect(() => {
    //     if (PR !== undefined) ;
    // });

    return <>
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <div style={{overflow: "auto"}}>
                    <Accordion defaultExpanded>
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

                    <Accordion defaultExpanded>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel2-content"
                            id="panel2-header"
                        >
                            Stats
                        </AccordionSummary>
                        <AccordionDetails>
                            Total similar groups: {groups.length} <br/>
                            Total similar submissions: {groups.reduce((a,b) => a+b.length, 0)}
                        </AccordionDetails>
                    </Accordion>

                    <br/>
                    <br/>
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
                                    label={<><span style={{width: 100, display: "inline-block"}}>{user.rank}</span>{user.username}</>}
                                    />
                            </>)}
                        </TreeItem>
                    </>)}
                    </TreeView>
                
                </div>
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                <div style={{overflow: "auto"}}>
                <input 
                    type="checkbox" 
                    checked={hideBlankLines} 
                    onChange={ev => setHideBlankLines(ev.target.checked)} 
                    id="codeHideBlankLines" 
                />
                <label htmlFor="codeHideBlankLines">Hide blank lines</label>
                {selectedUser && <>
                    <h3><a href={`https://leetcode.com/u/${selectedUser.username}/`}target="blank">
                        {selectedUser.username}&nbsp;<i className="fa-solid fa-arrow-up-right-from-square"></i>
                    </a></h3>
                    <pre 
                        ref={codePreRef}
                        style={{color: "auto"}}></pre>
                </>}
                </div>
            </Panel>
        </PanelGroup>
        
    </>
}