/* ============================================================
   ACTIVITY FEED — AkdenizOS

   Reads the organisation's public event stream at page load.
   Unauthenticated GitHub API: 60 requests/hour per IP, which is
   ample here and keeps the feed genuinely live rather than frozen
   at build time. If the call fails or returns nothing usable, the
   whole section removes itself instead of leaving an empty frame.

   Note: /orgs/{org}/events returns trimmed payloads — a PushEvent
   carries no commit list or count — so descriptions are built from
   the fields that are actually present.
   ============================================================ */

(function () {
  "use strict";

  const mount = document.getElementById("activity");
  if (!mount) return;

  const section = mount.closest("[data-activity-section]") || mount;
  const status = document.getElementById("activity-status");
  const ENDPOINT = "https://api.github.com/orgs/AkdenizOS/events?per_page=100";
  const MAX_ROWS = 25;

  const branchOf = (ref) => String(ref || "").replace(/^refs\/heads\//, "");

  /* One line of plain English per event type. Anything else is skipped
     rather than rendered as raw API noise. */
  const describe = (event) => {
    const p = event.payload || {};
    switch (event.type) {
      case "PushEvent": {
        const branch = branchOf(p.ref);
        return { kind: "push", text: branch ? `pushed to ${branch}` : "pushed" };
      }
      case "PullRequestEvent": {
        const pr = p.pull_request;
        if (p.action !== "opened" && p.action !== "closed") return null;
        const merged = pr && pr.merged;
        return {
          kind: merged ? "merged" : "pull request",
          text: `${merged ? "merged" : p.action} ${pr && pr.title ? `“${pr.title}”` : "a pull request"}`,
          href: pr && pr.html_url
        };
      }
      case "IssuesEvent": {
        if (p.action !== "opened" && p.action !== "closed") return null;
        const issue = p.issue;
        return {
          kind: "issue",
          text: `${p.action} ${issue && issue.title ? `“${issue.title}”` : "an issue"}`,
          href: issue && issue.html_url
        };
      }
      case "CreateEvent":
        if (p.ref_type === "repository") return { kind: "new repo", text: "created the repository" };
        if (p.ref_type === "tag") return { kind: "tag", text: `tagged ${p.ref}` };
        return null;
      case "ReleaseEvent":
        return {
          kind: "release",
          text: `released ${(p.release && p.release.tag_name) || ""}`.trim(),
          href: p.release && p.release.html_url
        };
      case "WatchEvent":
        return { kind: "star", text: "starred the repo" };
      default:
        return null;
    }
  };

  const relative = (iso) => {
    const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  const buildRow = (event, detail) => {
    const repo = (event.repo && event.repo.name) || "";
    const short = repo.replace(/^AkdenizOS\//, "");
    const href = detail.href || (repo ? `https://github.com/${repo}` : null);
    if (!href) return null;

    const row = document.createElement("a");
    row.className = "activity__row";
    row.href = href;
    row.target = "_blank";
    row.rel = "noopener noreferrer";

    const kind = document.createElement("span");
    kind.className = "activity__kind";
    kind.textContent = detail.kind;

    const text = document.createElement("span");
    text.className = "activity__text";
    const who = document.createElement("span");
    who.className = "activity__repo";
    who.textContent = (event.actor && event.actor.login) || "someone";
    text.append(who, document.createTextNode(` ${detail.text} · ${short}`));

    const when = document.createElement("span");
    when.className = "activity__when";
    when.textContent = relative(event.created_at);

    row.append(kind, text, when);
    return row;
  };

  const render = (events) => {
    const rows = [];
    /* A burst of pushes to one repo reads as twenty identical lines,
       so keep only the most recent of each actor/repo/kind. */
    const seen = new Set();

    for (const event of events) {
      const detail = describe(event);
      if (!detail) continue;

      const key = [
        (event.actor && event.actor.login) || "",
        (event.repo && event.repo.name) || "",
        detail.kind
      ].join("|");
      if (seen.has(key)) continue;

      const row = buildRow(event, detail);
      if (!row) continue;

      seen.add(key);
      rows.push(row);
      if (rows.length >= MAX_ROWS) break;
    }

    if (!rows.length) return false;
    mount.replaceChildren(...rows);
    return true;
  };

  if (status) status.textContent = "Loading recent activity…";

  fetch(ENDPOINT, { headers: { Accept: "application/vnd.github+json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
      return response.json();
    })
    .then((events) => {
      if (!Array.isArray(events) || !render(events)) throw new Error("no renderable events");
    })
    .catch(() => {
      /* Rate limited, offline, or a quiet stretch — say nothing rather
         than show a broken panel. */
      section.remove();
    });
})();
