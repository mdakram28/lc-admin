import { useEffect, useState } from "react";
import Papa from 'papaparse';
import { DolosFile, DolosPairs } from "../types/dolos.types";
import { DisjSet } from "../util/disj-set";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const cluster = (pairs: DolosPairs[], similarity: number) => {
    const ds = new DisjSet();
    for (const pair of pairs) {
        if (pair.similarity >= similarity) {
            ds.union(pair.leftFileId, pair.rightFileId);
        }
    }
    const groups = ds.groups();
    groups.sort((a, b) => b.length - a.length);
    return groups;
}

export function PlagReportComponent({ }: {}) {
    const [reportPath, setReportPath] = useState("/dolos-report");
    const [similarity, setSimilarity] = useState(0.99);
    const [pairs, setPairs] = useState<DolosPairs[]>([]);
    const [files, setFiles] = useState<Record<string, DolosFile>>({});
    const [groups, setGroups] = useState<string[][]>([]);
    const [selected, setSelected] = useState<string | undefined>();
    const [hideBlankLines, setHideBlankLines] = useState(true);

    const load = async (reportUrl: string) => {
        const filesText = await (await fetch(`${reportUrl}/files.csv`)).text();
        const parsedFiles = Papa.parse<DolosFile>(filesText, {
            header: true,
            dynamicTyping: true
        });
        const filesMap: Record<string, DolosFile> = {};
        for (const row of parsedFiles.data)
            filesMap[row.id] = {
                id: row.id,
                path: row.path,
                content: row.content
            };
        setFiles(filesMap);

        const pairsText = await (await fetch(`${reportUrl}/pairs.csv`)).text();
        const parsedPairs = Papa.parse<DolosPairs>(pairsText, {
            header: true,
            dynamicTyping: true
        });

        setPairs(parsedPairs.data);
    };

    const formatCode = (code: string) => {
        let lines = code.split("\n");
        if (hideBlankLines) {
            lines = lines.filter(line => line.trim().length > 0);
        }
        return lines.join("\n");
    }

    useEffect(() => {
        load(reportPath);
    }, [reportPath]);

    useEffect(() => {
        setGroups(cluster(pairs, similarity));
    }, [pairs, similarity])

    return <>
        <PanelGroup autoSaveId="example" direction="horizontal">
            <Panel defaultSize={50} className="panel">
                <div style={{overflow: "auto"}}>
                    Similarity &gt;= <input type="number" value={similarity} /> <br/>
                    Total similar groups: {groups.length} <br/>
                    Total similar submissions: {groups.reduce((a,b) => a+b.length, 0)}

                    <br/>
                    <br/>
                    <TreeView
                        aria-label="file system navigator"
                        defaultCollapseIcon={<ExpandMoreIcon />}
                        defaultExpandIcon={<ChevronRightIcon />}
                        // sx={{ height: 240, flexGrow: 1, maxWidth: 400, overflowY: 'auto' }}
                        onNodeSelect={(ev, selected) => setSelected(selected)}
                        >
                    {groups.map((group, groupId) => <>
                        <TreeItem nodeId={`g${groupId.toString()}`} label={`Group ${groupId} (${group.length})`}>
                            {group.map(fileId => <>
                                <TreeItem
                                    nodeId={fileId} 
                                    label={files[fileId].path}
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
                {selected && files[selected] && <>
                    <h3>{files[selected].path}</h3>
                    <pre>{formatCode(files[selected].content)}</pre>
                </>}
                </div>
            </Panel>
        </PanelGroup>
        
    </>
}