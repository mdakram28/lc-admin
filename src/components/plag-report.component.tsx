import "../styles/prettyprint-style.css";
import "../styles/data-table.scss";
import { useEffect, useRef, useState } from "react";
import { GroupUser, SubmissionUser, UserPair } from "../types/dolos.types";
import { Panel, PanelGroup, PanelResizeHandle, assert } from "react-resizable-panels";
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, Slider } from "@mui/material";
import { useParams } from "react-router-dom";
import { fetchContestInfo, fetchGroups, fetchPairs, fetchUser } from "../util/api";
import { GroupsTableComponent } from "./plag-groups-table.component";
import { UserGraph } from "../util/graph";

declare var PR: any;

export function ReportTitleComponent() {
    const { reportName } = useParams();
    return <span style={{ marginLeft: 10 }}>{reportName}</span>;
}


export function PlagReportComponent({ }: {}) {
    const { reportName } = useParams();
    const [baseDir, setBaseDir] = useState<string | undefined>();
    const [similarity, setSimilarity] = useState(80);

    const [groups, setGroups] = useState<GroupUser[][]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string>();
    const [selectedUser, setSelectedUser] = useState<SubmissionUser>();
    const [graph, setGraph] = useState<UserGraph>(new UserGraph([]));

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
        
        fetchPairs(baseDir, similarity)
            .then(pairs => {
                setGraph(new UserGraph(pairs));
            })
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
            codePreRef.current!.innerHTML = "";
            codePreRef.current!.innerText = formatCode(selectedUser.submission);
            codePreRef.current!.className = "prettyprint linenums lang-cpp";
            codePreRef.current!.innerHTML = codePreRef.current!.innerHTML.replaceAll("<br>", "\n");
            PR.prettyPrint();
        }, 1);
    }, [selectedUser, hideBlankLines]);

    return <>
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <div >
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


                    <GroupsTableComponent 
                        groups={groups}
                        onUserSelect={user => setSelectedFileId(user.fileId)} 
                        graph={graph}
                        selectedFileId={selectedFileId || ""}
                    />

                </div>
            </Panel>
            <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
            <Panel className="panel">
                {selectedUser && <>
                    <div style={{ display: "flex", margin: "10px 0" }}>
                        <h3 style={{ margin: 0 }}>
                            <a href={`https://leetcode.com/u/${selectedUser.username}/`} target="blank">
                                {selectedUser.username}&nbsp;<i className="fa-solid fa-arrow-up-right-from-square"></i>
                            </a>
                        </h3>
                        <span style={{ flexGrow: 1 }}></span>
                        <span>Submitted at: {new Date(selectedUser.submit_ts * 1000).toTimeString()}</span>
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
            </Panel>
        </PanelGroup>

    </>
}