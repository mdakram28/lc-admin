import "./app.scss";
import "./common.scss";
import * as React from 'react';
import { Experimental_CssVarsProvider as CssVarsProvider, Switch, useColorScheme } from "@mui/material";
import { Link, NavLink, Route, Routes, useParams } from "react-router-dom";
import GitHubButton from 'react-github-btn';
import { PlagReportComponent, ReportTitleComponent } from "./components/plag-report.component";
import { ReportListComponent } from "./components/report-list.component";

export default function Dashboard() {
  const { mode, setMode } = useColorScheme();
  const [page, setPage] = React.useState("plag");

  const menuItems: {
    page: string,
    title: string
  }[] = [];

  const setTheme = (theme: string) => {
    const c = document.body.classList;
    c.remove("dark");
    c.remove("light");
    c.add(theme);
    setMode(theme as any);
  }

  React.useEffect(() => {
    document.body.classList.add("dark");
    setMode("dark");
  }, []);


  return (
      <main>
        <div className="toolbar">
          <div className="toolbar-item">
            <NavLink to={"/"} style={{textDecoration: "none", color: "var(--font-colot)"}}>
              <b>LeetCode Admin</b>
            </NavLink>
          </div>
          {menuItems.map((menu) =>
            <NavLink to={"/" + menu.page} key={menu.page}
              className={({ isActive }) => "toolbar-item " + (isActive && "active")}>
              {menu.title}
            </NavLink>
          )}
            <Routes>
              <Route path="/report/:reportName" element={<ReportTitleComponent />} />
            </Routes>
          <span style={{ flex: 1 }}></span>
          <div className="toolbar-item gh">
            <GitHubButton
              href="https://github.com/mdakram28/lc-admin"
              data-color-scheme="no-preference: dark; light: dark; dark: dark;"
              data-size="large"
              aria-label="Star mdakram28/lc-admin on GitHub"
            >Star</GitHubButton>
          </div>
          <div className="toolbar-item">
            Light
            <Switch defaultChecked={true} inputProps={{ 'aria-label': "Dark" }} onClick={(ev: any) => setTheme(ev.target.checked ? "dark" : "light")} />
            Dark
          </div>
        </div>
        <div className="content">
          <Routes>
            <Route path="*" element={<ReportListComponent />} />
            <Route path="/report/:reportName" element={<PlagReportComponent />} />
          </Routes>
        </div>
      </main>
  );
}