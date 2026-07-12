import React from "react";

/**
 * StatusBadge — used everywhere in the Memo Portal. Maps a status string
 * (draft/published/archived/active/inactive) to the matching memo-badge--*
 * CSS modifier from memo.css.
 */
const StatusBadge = ({ status }) => {
  const cls = `memo-badge memo-badge--${status}`;
  const label =
    {
      draft: "Draft",
      published: "Published",
      archived: "Archived",
      active: "Active",
      inactive: "Inactive",
    }[status] || status;
  return <span className={cls}>{label}</span>;
};

export default StatusBadge;
