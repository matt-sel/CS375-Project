/* Load it before the other scripts, since tickets.js will rely on it:
e.g. :
<script src="/js/constants.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/tickets.js"></script>
*/

const TICKET_STATUSES = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed"
};

const TICKET_STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed"
};