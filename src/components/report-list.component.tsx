import "../styles/prettyprint-style.css";
import { useEffect, useRef, useState } from "react";
import Papa from 'papaparse';
import { ContestInfo } from "../types/report.types";
import { DisjSet } from "../util/disj-set";
import { Panel, PanelGroup, PanelResizeHandle, assert } from "react-resizable-panels";
import { TreeView, TreeItem } from '@mui/x-tree-view';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Accordion, AccordionDetails, AccordionSummary, Button, IconButton, Paper, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { fetchContestInfo } from "../util/api";

export function ReportListComponent({ }: {}) {
    const [infos, setInfos] = useState<ContestInfo[] | undefined>();

    useEffect(() => {
        fetchContestInfo()
            .then(infos => {
                const reports = Object.values(infos.reports);
                reports.sort((r1, r2) => r2.subm1_ts - r1.subm1_ts);
                setInfos(reports);
            });
    }, []);

    return <div style={{height: "100%"}}>
            <h2>Contests</h2>
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} size="small" aria-label="simple table">
                    <TableHead>
                    <TableRow>
                        <TableCell>Contest</TableCell>
                        <TableCell>Question</TableCell>
                        <TableCell>Similar count (&gt;= 80%)</TableCell>
                        <TableCell>Checked Upto</TableCell>
                        {/* <TableCell>Similar groups (&gt;= 80%)</TableCell> */}
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {infos && infos.map((info) => (
                        <TableRow
                        key={info.name}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                <Link to={`/report/${info.name}`}>{info.name}</Link>
                            </TableCell>
                            <TableCell>{info.ques_num}</TableCell>
                            <TableCell>{info.sim80_numsubm}</TableCell>
                            <TableCell>{info.numsubm}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </TableContainer>
    </div>
}