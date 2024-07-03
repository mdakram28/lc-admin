import "../styles/prettyprint-style.css";
import "../styles/data-table.scss";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { User, Submission, UserPair } from "../types/report.types";
import { Panel, PanelGroup, PanelResizeHandle, assert } from "react-resizable-panels";
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Drawer, IconButton, Slider, TextField } from "@mui/material";
import { useParams } from "react-router-dom";
import { fetchContestInfo, fetchPairs, fetchUserSubmission, fetchUsers } from "../util/api";
import { GroupsTableComponent } from "./plag-groups-table.component";
import { UserGraph } from "../util/graph";
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';

declare var PR: any;

export const ReportContext = createContext<{
    graph: UserGraph,
    selectedSubmission?: Submission,
    selectedFileId: string,
    setSelectedFileId: (id: string) => void,
    similarity: number,
    setSimilarity: (sim: number) => void,
    reload: () => void,
    groups: User[][]
}>({} as any);

export function ReportTitleComponent() {
    const { reportName } = useParams();
    return <span style={{ marginLeft: 10 }}>{reportName}</span>;
}

function GroupsPanelComponent() {

    const { similarity, setSimilarity, reload } = useContext(ReportContext);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [filterText, setFilterText] = useState("");

    return <div>
        <div className="toolbar">

            <span className="toolbar-item" style={{ flexGrow: 1 }}>
                <SearchIcon style={{ fontSize: 20 }} />
                <input type="text" onChange={ev => setFilterText(ev.target.value)} value={filterText} />
            </span>
            <a className="toolbar-item" onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
            </a>
        </div>
        <Drawer open={settingsOpen} onClose={() => setSettingsOpen(false)}>
            <Box sx={{ width: 250, padding: "20px" }} role="presentation">
                Similarity &gt;= {similarity}
                <Slider
                    aria-label="Similarity"
                    value={similarity}
                    getAriaValueText={(perc) => `${perc}%`}
                    valueLabelDisplay="auto"
                    shiftStep={2}
                    step={2}
                    marks
                    min={70}
                    max={100}
                    onChange={(ev, value) => setSimilarity(value as number)}
                />
                <Divider />
                <br />
                <Button variant="outlined" onClick={ev => reload()}>Save</Button>
            </Box>
        </Drawer>

        <GroupsTableComponent filterText={filterText} />

    </div>
}

function UserDetailComponent() {
    const [hideBlankLines, setHideBlankLines] = useState(true);
    const codePreRef = useRef<HTMLPreElement>(null);

    const { selectedSubmission } = useContext(ReportContext);

    useEffect(() => {
        if (!selectedSubmission) return;
        setTimeout(() => {
            codePreRef.current!.innerHTML = "";
            codePreRef.current!.innerText = formatCode(selectedSubmission.submission);
            codePreRef.current!.className = "prettyprint linenums lang-cpp";
            codePreRef.current!.innerHTML = codePreRef.current!.innerHTML.replaceAll("<br>", "\n");
            PR.prettyPrint();
        }, 1);
    }, [selectedSubmission, hideBlankLines]);

    const formatCode = (code: string) => {
        let lines = code.split("\n");
        if (hideBlankLines) {
            lines = lines.filter(line => line.trim().length > 0);
        }
        return lines.join("\n");
    }

    return !selectedSubmission ? <></> : <>
        <div style={{ display: "flex", margin: "10px 0" }}>
            <h3 style={{ margin: 0 }}>
                <a href={`https://leetcode.com/u/${selectedSubmission.username}/`} target="blank">
                    {selectedSubmission.username}&nbsp;<i className="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            </h3>
            <span style={{ flexGrow: 1 }}></span>
            <span>Submitted at: {new Date(selectedSubmission.submit_ts * 1000).toTimeString()}</span>
        </div>
        <a href={`https://leetcode.com/submissions/detail/${selectedSubmission.subm_id}/`} target="blank">
            Code&nbsp;<i className="fa-solid fa-arrow-up-right-from-square"></i>
        </a>
        <div>
            <input
                type="checkbox"
                checked={hideBlankLines}
                onChange={ev => setHideBlankLines(ev.target.checked)}
                id="codeHideBlankLines"
            />
            <label htmlFor="codeHideBlankLines">Hide blank lines</label>
        </div>
        <pre
            ref={codePreRef}
            style={{ color: "auto" }}></pre>
    </>;
}

export function PlagReportComponent({ }: {}) {
    const { reportName } = useParams();
    const [baseDir, setBaseDir] = useState<string | undefined>();
    const [similarity, setSimilarity] = useState(80);

    const [selectedFileId, setSelectedFileId] = useState<string>("");
    const [pairs, setPairs] = useState<UserPair[]>();
    const [graph, setGraph] = useState<UserGraph>(new UserGraph([]));
    const [selectedSubmission, setSelectedSubmission] = useState<Submission>();
    const [users, setUsers] = useState<Record<string, User>>();

    const groups = useMemo(() => {
        if (!users) return [];
        const idGroups = graph.makeGroups(0);
        const userGroups = idGroups.map(g => g.map(fileId => users[fileId]));
        userGroups.sort((g1, g2) => g2.length - g1.length);
        return userGroups;
    }, [users, graph]);

    useEffect(() => {
        if (!pairs) return;
        const graph = new UserGraph(pairs.filter(p => p.similarity >= similarity));
        setGraph(graph);
    }, [pairs, similarity]);

    useEffect(() => {
        if (!reportName) return;
        fetchContestInfo().then(infos => setBaseDir(infos.reports[reportName].url));
    }, [reportName])

    const reload = () => {
        if (baseDir === undefined) return;

        // Fetch pairs with lowest similarity threshold
        fetchPairs(baseDir, 70)
            .then(setPairs);

        fetchUsers(baseDir).then(setUsers);
    }

    useEffect(() => {
        reload();
    }, [baseDir]);

    useEffect(() => {
        if (!selectedFileId || !baseDir) {
            setSelectedSubmission(undefined);
        } else {
            fetchUserSubmission(baseDir, selectedFileId).then(setSelectedSubmission);
        }
    }, [baseDir, selectedFileId]);

    return <>
        <ReportContext.Provider value={{
            reload,
            graph,
            groups,
            selectedFileId,
            setSelectedFileId,
            selectedSubmission,
            similarity,
            setSimilarity,
        }} >
            <PanelGroup autoSaveId="example" direction="horizontal">
                <Panel defaultSize={50} className="panel">
                    <GroupsPanelComponent />
                </Panel>
                <PanelResizeHandle className="resize-handle fa-solid fa-ellipsis-vertical" />
                <Panel className="panel">
                    <UserDetailComponent />
                </Panel>
            </PanelGroup>
        </ReportContext.Provider>
    </>
}