import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('docs/uml/svg');
fs.mkdirSync(OUT_DIR, { recursive: true });

function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapSvg({ width, height, title, subtitle, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <marker id="arrow-solid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#334155"/>
    </marker>
    <marker id="arrow-indigo" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#4F46E5"/>
    </marker>
    <marker id="arrow-open" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 1 1.5 L 9 5 L 1 8.5" fill="none" stroke="#475569" stroke-width="1.6"/>
    </marker>
    <marker id="arrow-inherit" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
      <path d="M 1 1.5 L 10 6 L 1 10.5 z" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.6"/>
    </marker>
    <marker id="diamond-comp" viewBox="0 0 14 10" refX="13" refY="5" markerWidth="10" markerHeight="8" orient="auto">
      <path d="M 1 5 L 7 1 L 13 5 L 7 9 z" fill="#0F172A" stroke="#0F172A" stroke-width="1.2"/>
    </marker>
    <marker id="diamond-agg" viewBox="0 0 14 10" refX="13" refY="5" markerWidth="10" markerHeight="8" orient="auto">
      <path d="M 1 5 L 7 1 L 13 5 L 7 9 z" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.4"/>
    </marker>
    <linearGradient id="hdr-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="indigo-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="100%" stop-color="#3730A3"/>
    </linearGradient>
  </defs>

  <!-- Outer Canvas Card -->
  <rect x="0" y="0" width="${width}" height="${height}" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>

  <!-- Top Title Banner -->
  <rect x="0" y="0" width="${width}" height="64" rx="14" fill="url(#hdr-grad)"/>
  <rect x="0" y="48" width="${width}" height="16" fill="url(#hdr-grad)"/>
  <text x="28" y="30" fill="#FFFFFF" font-size="17" font-weight="700">${esc(title)}</text>
  <text x="28" y="50" fill="#94A3B8" font-size="12" font-family="monospace">${esc(subtitle)}</text>
  <rect x="${width - 175}" y="18" width="148" height="28" rx="6" fill="#1E293B" stroke="#475569" stroke-width="1"/>
  <text x="${width - 101}" y="36" text-anchor="middle" fill="#38BDF8" font-size="11" font-weight="700" font-family="monospace">OMG UML 2.5 · NexaHR</text>

  ${body}
</svg>`;
}

function drawStickActor(x, y, name, roleBadge, color = '#4F46E5') {
  return `
  <g transform="translate(${x}, ${y})">
    <circle cx="0" cy="-26" r="11" fill="#FFFFFF" stroke="${color}" stroke-width="2.4"/>
    <line x1="0" y1="-15" x2="0" y2="14" stroke="${color}" stroke-width="2.4"/>
    <line x1="-18" y1="-4" x2="18" y2="-4" stroke="${color}" stroke-width="2.4"/>
    <line x1="0" y1="14" x2="-14" y2="36" stroke="${color}" stroke-width="2.4"/>
    <line x1="0" y1="14" x2="14" y2="36" stroke="${color}" stroke-width="2.4"/>
    <rect x="-78" y="44" width="156" height="40" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <text x="0" y="61" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">${esc(name)}</text>
    <text x="0" y="76" text-anchor="middle" fill="${color}" font-size="10" font-family="monospace" font-weight="600">${esc(roleBadge)}</text>
  </g>`;
}

function drawUseCaseOval(cx, cy, rx, ry, code, label, fill = '#FFFFFF', stroke = '#4F46E5') {
  return `
  <g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.8"/>
    <text x="${cx}" y="${cy - 5}" text-anchor="middle" fill="${stroke}" font-size="10" font-weight="700" font-family="monospace">${esc(code)}</text>
    <text x="${cx}" y="${cy + 11}" text-anchor="middle" fill="#0F172A" font-size="11.5" font-weight="600">${esc(label)}</text>
  </g>`;
}

// ============================================================================
// 1. USE CASE DIAGRAM (01-use-case.svg)
// ============================================================================
function genUseCaseDiagram() {
  const width = 1280;
  const height = 860;

  const leftUCs = [
    { y: 155, code: 'UC-01', label: 'Authenticate & Switch RTL/LTR' },
    { y: 235, code: 'UC-04', label: 'Check-In & Check-Out (UTC)' },
    { y: 315, code: 'UC-05', label: 'Submit Attendance Correction' },
    { y: 395, code: 'UC-06', label: 'Submit Leave Application' },
    { y: 475, code: 'UC-08', label: 'Cancel Leave & Restore Balance' },
    { y: 555, code: 'UC-09', label: 'Manage & Update Kanban Tasks' },
    { y: 635, code: 'UC-10', label: 'Evaluate & Acknowledge OKR Review' },
  ];

  const rightUCs = [
    { y: 155, code: 'UC-02', label: 'Create & Auto-Provision Employee' },
    { y: 235, code: 'UC-03', label: 'Manage Departments & Org Hierarchy' },
    { y: 315, code: 'UC-07', label: 'Approve / Reject Team Leave' },
    { y: 395, code: 'UC-11', label: 'Manage Onboarding Checklists' },
    { y: 475, code: 'UC-12', label: 'Simulate & Approve EGP Payroll' },
    { y: 555, code: 'UC-13', label: 'Export Executive CSV Reports' },
    { y: 635, code: 'UC-14', label: 'Manage RBAC Roles & Audit Logs' },
  ];

  let body = `
  <!-- System Boundary Box -->
  <rect x="250" y="88" width="780" height="735" rx="14" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.2"/>
  <rect x="250" y="88" width="780" height="36" rx="14" fill="#EFF6FF"/>
  <text x="640" y="111" text-anchor="middle" fill="#1E3A8A" font-size="13" font-weight="700">«system» NexaHR Enterprise Employee Management System (14 Functional Modules)</text>

  <!-- Actors Left -->
  ${drawStickActor(115, 230, 'Employee', '«actor» EMPLOYEE', '#0284C7')}
  ${drawStickActor(115, 540, 'Department Manager', '«actor» DEPT_MANAGER', '#4F46E5')}

  <!-- Actors Right -->
  ${drawStickActor(1165, 250, 'HR Manager', '«actor» HR_MANAGER', '#059669')}
  ${drawStickActor(1165, 560, 'System Admin', '«actor» SYSTEM_ADMIN', '#DC2626')}

  <!-- Generalization: Dept Manager inherits Employee -->
  <line x1="115" y1="495" x2="115" y2="322" stroke="#0F172A" stroke-width="1.8" stroke-dasharray="5,4" marker-end="url(#arrow-inherit)"/>
  <text x="123" y="415" fill="#475569" font-size="10" font-family="monospace">«inherits»</text>
  `;

  // Draw Left & Right Use Cases
  for (const uc of leftUCs) {
    body += drawUseCaseOval(435, uc.y, 148, 30, uc.code, uc.label, '#F8FAFC', '#0284C7');
    body += `<line x1="193" y1="230" x2="287" y2="${uc.y}" stroke="#0284C7" stroke-width="1.4" opacity="0.85"/>`;
  }

  for (const uc of rightUCs) {
    body += drawUseCaseOval(835, uc.y, 152, 30, uc.code, uc.label, '#F8FAFC', '#4F46E5');
  }

  // Dept Manager associations
  body += `
  <line x1="193" y1="540" x2="683" y2="315" stroke="#4F46E5" stroke-width="1.5"/>
  <line x1="193" y1="540" x2="287" y2="555" stroke="#4F46E5" stroke-width="1.5"/>
  <line x1="193" y1="540" x2="287" y2="635" stroke="#4F46E5" stroke-width="1.5"/>
  `;

  // HR Manager associations
  for (const y of [155, 235, 315, 395, 475, 555]) {
    body += `<line x1="1087" y1="250" x2="987" y2="${y}" stroke="#059669" stroke-width="1.5"/>`;
  }

  // System Admin associations
  for (const y of [155, 235, 475, 555, 635]) {
    body += `<line x1="1087" y1="560" x2="987" y2="${y}" stroke="#DC2626" stroke-width="1.5"/>`;
  }

  // Include Use Cases at Bottom of System Boundary
  body += `
  <line x1="275" y1="700" x2="1005" y2="700" stroke="#E2E8F0" stroke-width="1.5" stroke-dasharray="4,4"/>
  <text x="640" y="720" text-anchor="middle" fill="#64748B" font-size="11" font-weight="700" font-family="monospace">SHARED «include» DOMAIN &amp; SECURITY SUB-ROUTINES</text>
  ${drawUseCaseOval(410, 765, 130, 26, '«include»', 'Validate Working Days & Overlap', '#EEF2FF', '#4F46E5')}
  ${drawUseCaseOval(650, 765, 120, 26, '«include»', 'Dispatch In-App Notification', '#ECFDF5', '#059669')}
  ${drawUseCaseOval(885, 765, 125, 26, '«include»', 'Write Immutable Audit Log', '#FEF2F2', '#DC2626')}

  <line x1="435" y1="425" x2="410" y2="739" stroke="#4F46E5" stroke-width="1.3" stroke-dasharray="4,3" marker-end="url(#arrow-open)"/>
  <line x1="835" y1="345" x2="650" y2="739" stroke="#059669" stroke-width="1.3" stroke-dasharray="4,3" marker-end="url(#arrow-open)"/>
  <line x1="835" y1="665" x2="885" y2="739" stroke="#DC2626" stroke-width="1.3" stroke-dasharray="4,3" marker-end="url(#arrow-open)"/>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.1 UML Use Case Diagram — NexaHR Actors, Inheritance & 14 Functional Modules',
    subtitle: 'Actors: Employee, Department Manager, HR Manager, System Administrator | Boundary: NexaHR Platform',
    body,
  });
}

// ============================================================================
// 2. ACTIVITY DIAGRAM — LEAVE WORKFLOW (02-activity-leave.svg)
// ============================================================================
function genActivityLeaveDiagram() {
  const width = 1240;
  const height = 820;

  const body = `
  <!-- 3 Swimlanes -->
  <rect x="28" y="84" width="360" height="710" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="388" y="84" width="464" height="710" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="852" y="84" width="360" height="710" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>

  <rect x="28" y="84" width="360" height="38" fill="#E0F2FE" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="208" y="108" text-anchor="middle" fill="#0369A1" font-size="13" font-weight="700">Swimlane 1: Employee (Self-Service UI)</text>

  <rect x="388" y="84" width="464" height="38" fill="#EEF2FF" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="620" y="108" text-anchor="middle" fill="#3730A3" font-size="13" font-weight="700">Swimlane 2: NexaHR Backend &amp; Domain Engine (rules.ts)</text>

  <rect x="852" y="84" width="360" height="38" fill="#ECFDF5" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="1032" y="108" text-anchor="middle" fill="#047857" font-size="13" font-weight="700">Swimlane 3: Department Manager / HR Manager</text>

  <!-- Initial Node -->
  <circle cx="208" cy="155" r="11" fill="#0F172A"/>
  <line x1="208" y1="166" x2="208" y2="195" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Action 1 -->
  <rect x="78" y="195" width="260" height="48" rx="20" fill="#FFFFFF" stroke="#0284C7" stroke-width="2"/>
  <text x="208" y="216" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Select Leave Type, Start/End Dates</text>
  <text x="208" y="232" text-anchor="middle" fill="#64748B" font-size="10.5">&amp; Optional Half-Day Flag (POST /api/leave/requests)</text>

  <line x1="338" y1="219" x2="460" y2="219" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Action 2: Working Day Calculation -->
  <rect x="460" y="192" width="320" height="54" rx="20" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>
  <text x="620" y="215" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">calculateWorkingLeaveDays(start, end)</text>
  <text x="620" y="233" text-anchor="middle" fill="#475569" font-size="10.5">Excludes Fri/Sat Weekends &amp; Official Cairo Holidays</text>

  <line x1="620" y1="246" x2="620" y2="280" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Decision 1: Overlap & Quota Check -->
  <polygon points="620,280 730,320 620,360 510,320" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="620" y="317" text-anchor="middle" fill="#92400E" font-size="11" font-weight="700">Valid Days &gt; 0, No Overlap</text>
  <text x="620" y="331" text-anchor="middle" fill="#92400E" font-size="10.5">&amp; Sufficient Balance?</text>

  <!-- Guard [Invalid / Overlap] -->
  <line x1="510" y1="320" x2="338" y2="320" stroke="#DC2626" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="424" y="312" text-anchor="middle" fill="#DC2626" font-size="10.5" font-weight="700">[No: Overlap or Insufficient]</text>

  <rect x="78" y="296" width="260" height="48" rx="12" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.8"/>
  <text x="208" y="317" text-anchor="middle" fill="#991B1B" font-size="12" font-weight="700">Return HTTP 400 Validation Error</text>
  <text x="208" y="333" text-anchor="middle" fill="#B91C1C" font-size="10.5">Balance Unchanged · Display Error Toast</text>

  <!-- Guard [Valid] -->
  <line x1="620" y1="360" x2="620" y2="405" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="675" y="386" fill="#059669" font-size="10.5" font-weight="700">[Yes: Valid]</text>

  <!-- Action 3: Reserve Pending Days -->
  <rect x="460" y="405" width="320" height="54" rx="20" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>
  <text x="620" y="428" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Reserve Quota: pending_days += total_days</text>
  <text x="620" y="445" text-anchor="middle" fill="#475569" font-size="10.5">Insert PENDING leave_requests &amp; Notify Manager</text>

  <line x1="780" y1="432" x2="900" y2="432" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Action 4: Manager Review -->
  <rect x="900" y="405" width="264" height="54" rx="20" fill="#FFFFFF" stroke="#059669" stroke-width="2"/>
  <text x="1032" y="428" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Inspect Team Leave Request</text>
  <text x="1032" y="445" text-anchor="middle" fill="#475569" font-size="10.5">Verify via canApproveLeaveForEmployee()</text>

  <line x1="1032" y1="459" x2="1032" y2="500" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Decision 2: Manager Decision -->
  <polygon points="1032,500 1125,538 1032,576 939,538" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="1032" y="542" text-anchor="middle" fill="#92400E" font-size="11.5" font-weight="700">Approval Decision?</text>

  <!-- Approve Branch -->
  <line x1="939" y1="538" x2="780" y2="538" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="860" y="529" text-anchor="middle" fill="#059669" font-size="10.5" font-weight="700">[APPROVE]</text>

  <rect x="460" y="512" width="320" height="52" rx="18" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="620" y="534" text-anchor="middle" fill="#065F46" font-size="12" font-weight="700">Commit Approval (status = APPROVED)</text>
  <text x="620" y="551" text-anchor="middle" fill="#047857" font-size="10.5">pending_days -= days · used_days += days</text>

  <!-- Reject Branch -->
  <line x1="1032" y1="576" x2="1032" y2="635" stroke="#DC2626" stroke-width="1.8"/>
  <line x1="1032" y1="635" x2="780" y2="635" stroke="#DC2626" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="920" y="626" text-anchor="middle" fill="#DC2626" font-size="10.5" font-weight="700">[REJECT / CANCEL]</text>

  <rect x="460" y="609" width="320" height="52" rx="18" fill="#FFF1F2" stroke="#E11D48" stroke-width="2"/>
  <text x="620" y="631" text-anchor="middle" fill="#9F1239" font-size="12" font-weight="700">Release Quota (status = REJECTED)</text>
  <text x="620" y="648" text-anchor="middle" fill="#BE123C" font-size="10.5">pending_days -= days · Restore Available Quota</text>

  <!-- Merge to Audit & Notification -->
  <line x1="460" y1="538" x2="395" y2="538" stroke="#334155" stroke-width="1.8"/>
  <line x1="395" y1="538" x2="395" y2="715" stroke="#334155" stroke-width="1.8"/>
  <line x1="620" y1="661" x2="620" y2="695" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <line x1="395" y1="715" x2="460" y2="715" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="460" y="695" width="320" height="46" rx="18" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
  <text x="620" y="716" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Write Audit Log &amp; Notify Employee</text>
  <text x="620" y="732" text-anchor="middle" fill="#64748B" font-size="10.5">Persist in audit_logs &amp; notifications tables</text>

  <!-- Final Bullseye Node -->
  <line x1="460" y1="718" x2="230" y2="718" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <circle cx="208" cy="718" r="14" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.2"/>
  <circle cx="208" cy="718" r="8" fill="#0F172A"/>
  <text x="208" y="748" text-anchor="middle" fill="#0F172A" font-size="11" font-weight="700">Activity Final</text>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.2 UML Activity Diagram — Leave Request, Balance Reservation & Approval Workflow',
    subtitle: 'Swimlanes: Employee | NexaHR Domain & Persistence Engine | Department Manager / HR Manager',
    body,
  });
}

// ============================================================================
// 3. ACTIVITY DIAGRAM — ATTENDANCE WORKFLOW (03-activity-attendance.svg)
// ============================================================================
function genActivityAttendanceDiagram() {
  const width = 1240;
  const height = 760;

  const body = `
  <!-- 3 Swimlanes -->
  <rect x="28" y="84" width="360" height="650" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="388" y="84" width="464" height="650" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <rect x="852" y="84" width="360" height="650" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>

  <rect x="28" y="84" width="360" height="38" fill="#E0F2FE" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="208" y="108" text-anchor="middle" fill="#0369A1" font-size="13" font-weight="700">Swimlane 1: Employee</text>

  <rect x="388" y="84" width="464" height="38" fill="#EEF2FF" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="620" y="108" text-anchor="middle" fill="#3730A3" font-size="13" font-weight="700">Swimlane 2: Attendance Engine (UTC / Cairo Shift)</text>

  <rect x="852" y="84" width="360" height="38" fill="#ECFDF5" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="1032" y="108" text-anchor="middle" fill="#047857" font-size="13" font-weight="700">Swimlane 3: Department Manager / HR</text>

  <!-- Initial Node -->
  <circle cx="208" cy="155" r="11" fill="#0F172A"/>
  <line x1="208" y1="166" x2="208" y2="195" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Action 1: Check-In -->
  <rect x="78" y="195" width="260" height="46" rx="20" fill="#FFFFFF" stroke="#0284C7" stroke-width="2"/>
  <text x="208" y="216" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Click Check-In Button</text>
  <text x="208" y="232" text-anchor="middle" fill="#64748B" font-size="10.5">POST /api/attendance/check-in</text>

  <line x1="338" y1="218" x2="510" y2="218" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Decision 1: Open Session Exists? -->
  <polygon points="620,182 730,218 620,254 510,218" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="620" y="216" text-anchor="middle" fill="#92400E" font-size="11" font-weight="700">Open Session Exists?</text>
  <text x="620" y="230" text-anchor="middle" fill="#92400E" font-size="10">(status == OPEN)</text>

  <line x1="620" y1="254" x2="620" y2="298" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="665" y="280" fill="#059669" font-size="10.5" font-weight="700">[No: Valid]</text>

  <!-- Action 2: Calculate Late Minutes -->
  <rect x="460" y="298" width="320" height="54" rx="20" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>
  <text x="620" y="320" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Capture Server UTC &amp; Compare Shift Grace</text>
  <text x="620" y="338" text-anchor="middle" fill="#475569" font-size="10.5">09:00 Cairo Shift + 15m Grace → Insert OPEN Row</text>

  <!-- Employee Check-Out -->
  <line x1="460" y1="325" x2="208" y2="325" stroke="#334155" stroke-width="1.8"/>
  <line x1="208" y1="325" x2="208" y2="390" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="78" y="390" width="260" height="46" rx="20" fill="#FFFFFF" stroke="#0284C7" stroke-width="2"/>
  <text x="208" y="411" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Click Check-Out at End of Shift</text>
  <text x="208" y="427" text-anchor="middle" fill="#64748B" font-size="10.5">POST /api/attendance/check-out</text>

  <line x1="338" y1="413" x2="460" y2="413" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Action 3: Compute Worked Duration -->
  <rect x="460" y="386" width="320" height="54" rx="20" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>
  <text x="620" y="408" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Compute worked_minutes &amp; Final Status</text>
  <text x="620" y="426" text-anchor="middle" fill="#475569" font-size="10.5">&lt;240m: HALF_DAY | late&gt;0: LATE | else: PRESENT</text>

  <!-- Optional Correction Flow -->
  <line x1="208" y1="436" x2="208" y2="510" stroke="#475569" stroke-width="1.6" stroke-dasharray="5,3" marker-end="url(#arrow-solid)"/>
  <text x="200" y="476" text-anchor="end" fill="#475569" font-size="10" font-family="monospace">[If Missed Punch]</text>

  <rect x="78" y="510" width="260" height="48" rx="20" fill="#FFFFFF" stroke="#0284C7" stroke-width="2"/>
  <text x="208" y="531" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Submit Attendance Correction</text>
  <text x="208" y="547" text-anchor="middle" fill="#64748B" font-size="10.5">POST /api/attendance/corrections</text>

  <line x1="338" y1="534" x2="900" y2="534" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="900" y="508" width="264" height="52" rx="20" fill="#FFFFFF" stroke="#059669" stroke-width="2"/>
  <text x="1032" y="530" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Manager Reviews Justification</text>
  <text x="1032" y="547" text-anchor="middle" fill="#475569" font-size="10.5">PATCH /api/attendance/corrections/:id</text>

  <line x1="1032" y1="560" x2="1032" y2="645" stroke="#059669" stroke-width="1.8"/>
  <line x1="1032" y1="645" x2="780" y2="645" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="910" y="636" text-anchor="middle" fill="#059669" font-size="10.5" font-weight="700">[APPROVED → status = CORRECTED]</text>

  <line x1="620" y1="440" x2="620" y2="620" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="460" y="620" width="320" height="48" rx="18" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="620" y="641" text-anchor="middle" fill="#065F46" font-size="12" font-weight="700">Persist Attendance Log &amp; Audit Entry</text>
  <text x="620" y="657" text-anchor="middle" fill="#047857" font-size="10.5">attendance_records &amp; audit_logs Updated</text>

  <line x1="460" y1="644" x2="230" y2="644" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <circle cx="208" cy="644" r="14" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.2"/>
  <circle cx="208" cy="644" r="8" fill="#0F172A"/>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.3 UML Activity Diagram — Attendance Check-In, Check-Out & Correction Workflow',
    subtitle: 'Server-Authoritative UTC Timestamps, Cairo Shift Grace Period (15m) & Manager Correction Review',
    body,
  });
}

// ============================================================================
// 4. ACTIVITY DIAGRAM — EMPLOYEE CREATION & FORK/JOIN ONBOARDING (04-activity-onboarding.svg)
// ============================================================================
function genActivityOnboardingDiagram() {
  const width = 1200;
  const height = 740;

  const body = `
  <!-- Initial Node -->
  <circle cx="600" cy="105" r="11" fill="#0F172A"/>
  <line x1="600" y1="116" x2="600" y2="145" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Step 1 -->
  <rect x="410" y="145" width="380" height="48" rx="20" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2"/>
  <text x="600" y="167" text-anchor="middle" fill="#0F172A" font-size="12.5" font-weight="700">HR Manager or Admin Submits New Employee Form</text>
  <text x="600" y="183" text-anchor="middle" fill="#64748B" font-size="10.5">POST /api/employees (First/Last Name, Email, Dept, Title, Manager, Salary)</text>

  <line x1="600" y1="193" x2="600" y2="225" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- Decision: RBAC & Domain Validation -->
  <polygon points="600,225 745,265 600,305 455,265" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="600" y="262" text-anchor="middle" fill="#92400E" font-size="11.5" font-weight="700">RBAC Authorized, Unique Email</text>
  <text x="600" y="277" text-anchor="middle" fill="#92400E" font-size="10.5">&amp; No Circular Reporting Loop?</text>

  <!-- Invalid Branch -->
  <line x1="745" y1="265" x2="880" y2="265" stroke="#DC2626" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="812" y="256" text-anchor="middle" fill="#DC2626" font-size="10.5" font-weight="700">[Invalid / Loop]</text>
  <rect x="880" y="241" width="260" height="48" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.8"/>
  <text x="1010" y="262" text-anchor="middle" fill="#991B1B" font-size="12" font-weight="700">Abort &amp; Return HTTP 400 / 403</text>
  <text x="1010" y="278" text-anchor="middle" fill="#B91C1C" font-size="10.5">Zero Partial Rows Written</text>

  <!-- Valid Branch -->
  <line x1="600" y1="305" x2="600" y2="345" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="650" y="330" fill="#059669" font-size="10.5" font-weight="700">[Valid Input]</text>

  <!-- Step 2: Generate Code & Insert Employee -->
  <rect x="400" y="345" width="400" height="50" rx="20" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
  <text x="600" y="367" text-anchor="middle" fill="#0F172A" font-size="12.5" font-weight="700">generateNextEmployeeNumber() → NW-EMP-026</text>
  <text x="600" y="384" text-anchor="middle" fill="#475569" font-size="10.5">Insert Master Record into PostgreSQL employees Table</text>

  <line x1="600" y1="395" x2="600" y2="430" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <!-- UML Fork Bar -->
  <rect x="110" y="430" width="980" height="8" rx="4" fill="#0F172A"/>
  <text x="1040" y="422" text-anchor="end" fill="#475569" font-size="10" font-family="monospace">«fork» Parallel Auto-Provisioning</text>

  <!-- 4 Parallel Provisioning Branches -->
  <line x1="215" y1="438" x2="215" y2="485" stroke="#4F46E5" stroke-width="1.8" marker-end="url(#arrow-indigo)"/>
  <line x1="470" y1="438" x2="470" y2="485" stroke="#4F46E5" stroke-width="1.8" marker-end="url(#arrow-indigo)"/>
  <line x1="730" y1="438" x2="730" y2="485" stroke="#4F46E5" stroke-width="1.8" marker-end="url(#arrow-indigo)"/>
  <line x1="985" y1="438" x2="985" y2="485" stroke="#4F46E5" stroke-width="1.8" marker-end="url(#arrow-indigo)"/>

  <rect x="95" y="485" width="240" height="64" rx="16" fill="#FFFFFF" stroke="#4F46E5" stroke-width="1.8"/>
  <text x="215" y="512" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Provision Leave Quotas</text>
  <text x="215" y="530" text-anchor="middle" fill="#64748B" font-size="10.5">Insert 2026 leave_entitlements</text>

  <rect x="350" y="485" width="240" height="64" rx="16" fill="#FFFFFF" stroke="#059669" stroke-width="1.8"/>
  <text x="470" y="512" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Provision EGP Compensation</text>
  <text x="470" y="530" text-anchor="middle" fill="#64748B" font-size="10.5">Insert compensation_records</text>

  <rect x="610" y="485" width="240" height="64" rx="16" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.8"/>
  <text x="730" y="512" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Create Onboarding Checklist</text>
  <text x="730" y="530" text-anchor="middle" fill="#64748B" font-size="10.5">IT, HR, Finance &amp; Manager Tasks</text>

  <rect x="865" y="485" width="240" height="64" rx="16" fill="#FFFFFF" stroke="#D97706" stroke-width="1.8"/>
  <text x="985" y="512" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Record Security Audit Log</text>
  <text x="985" y="530" text-anchor="middle" fill="#64748B" font-size="10.5">Insert EMPLOYEE_CREATE Event</text>

  <!-- Join Bar -->
  <line x1="215" y1="549" x2="215" y2="595" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <line x1="470" y1="549" x2="470" y2="595" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <line x1="730" y1="549" x2="730" y2="595" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <line x1="985" y1="549" x2="985" y2="595" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="110" y="595" width="980" height="8" rx="4" fill="#0F172A"/>
  <text x="1040" y="622" text-anchor="end" fill="#475569" font-size="10" font-family="monospace">«join» Transaction Synchronized</text>

  <line x1="600" y1="603" x2="600" y2="665" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <circle cx="600" cy="680" r="14" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.2"/>
  <circle cx="600" cy="680" r="8" fill="#0F172A"/>
  <text x="600" y="710" text-anchor="middle" fill="#0F172A" font-size="11.5" font-weight="700">Return HTTP 201 Created &amp; Refresh Workspace</text>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.4 UML Activity Diagram — Employee Creation & Parallel Onboarding Provisioning',
    subtitle: 'Fork/Join Concurrency Model: Employee Row + 2026 Leave Quotas + EGP Compensation + Onboarding Tasks + Audit Log',
    body,
  });
}

// ============================================================================
// HELPER FOR SEQUENCE DIAGRAMS (05, 06, 07, 08)
// ============================================================================
function buildSequenceDiagram({ title, subtitle, participants, fragments = [], messages }) {
  const width = 1280;
  const rowH = 42;
  const startY = 165;
  const height = startY + messages.length * rowH + 85;

  let body = '';

  // Lifelines
  for (const p of participants) {
    body += `
    <line x1="${p.x}" y1="138" x2="${p.x}" y2="${height - 35}" stroke="#94A3B8" stroke-width="1.6" stroke-dasharray="6,4"/>
    <rect x="${p.x - 88}" y="86" width="176" height="48" rx="8" fill="${p.fill || '#FFFFFF'}" stroke="${p.stroke || '#0F172A'}" stroke-width="1.8"/>
    <text x="${p.x}" y="106" text-anchor="middle" fill="${p.stereoColor || '#4F46E5'}" font-size="10" font-family="monospace" font-weight="700">${esc(p.stereo)}</text>
    <text x="${p.x}" y="123" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">${esc(p.name)}</text>
    <rect x="${p.x - 6}" y="150" width="12" height="${messages.length * rowH}" rx="3" fill="#E2E8F0" stroke="#64748B" stroke-width="1"/>
    `;
  }

  // Combined Fragments (alt / loop / opt)
  for (const f of fragments) {
    const fy = startY + f.fromStep * rowH - 22;
    const fh = (f.toStep - f.fromStep + 1) * rowH + 14;
    body += `
    <rect x="42" y="${fy}" width="${width - 84}" height="${fh}" rx="6" fill="none" stroke="#4F46E5" stroke-width="1.6" stroke-dasharray="4,2"/>
    <polygon points="42,${fy} 125,${fy} 125,${fy + 14} 115,${fy + 22} 42,${fy + 22}" fill="#4F46E5"/>
    <text x="80" y="${fy + 15}" text-anchor="middle" fill="#FFFFFF" font-size="10.5" font-weight="700" font-family="monospace">${esc(f.kind)}</text>
    <text x="138" y="${fy + 15}" fill="#1E1B4B" font-size="11" font-weight="700" font-family="monospace">${esc(f.guard)}</text>
    `;
  }

  // Messages
  messages.forEach((m, idx) => {
    const y = startY + idx * rowH + 14;
    const fromX = participants[m.from].x;
    const toX = participants[m.to].x;
    const isReply = Boolean(m.reply);
    const dir = toX >= fromX ? 1 : -1;
    const x1 = fromX + dir * 6;
    const x2 = toX - dir * 6;
    const midX = (x1 + x2) / 2;

    body += `
    <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${isReply ? '#059669' : '#1E293B'}" stroke-width="1.8" ${isReply ? 'stroke-dasharray="5,3" marker-end="url(#arrow-open)"' : 'marker-end="url(#arrow-solid)"'}/>
    <rect x="${midX - 165}" y="${y - 19}" width="330" height="16" rx="3" fill="#F8FAFC" opacity="0.92"/>
    <text x="${midX}" y="${y - 7}" text-anchor="middle" fill="${isReply ? '#047857' : '#0F172A'}" font-size="11" font-weight="600" font-family="monospace">${idx + 1}. ${esc(m.label)}</text>
    `;
  });

  return wrapSvg({ width, height, title, subtitle, body });
}

// ============================================================================
// 5, 6, 7, 8 SEQUENCE DIAGRAMS
// ============================================================================
function genSequenceLeaveDiagram() {
  return buildSequenceDiagram({
    title: '4.5 UML Sequence Diagram — Leave Request Submission & Manager Approval',
    subtitle: 'Lifelines: Employee, DeptManager, LeavePage UI, LeaveController (server.ts), DomainRulesService (rules.ts), PostgreSQL',
    participants: [
      { x: 115, stereo: '«actor»', name: ':Employee', stroke: '#0284C7' },
      { x: 315, stereo: '«actor»', name: ':DeptManager', stroke: '#4F46E5' },
      { x: 520, stereo: '«boundary»', name: ':LeavePageUI', stroke: '#0F172A' },
      { x: 740, stereo: '«control»', name: ':LeaveController', stroke: '#4F46E5' },
      { x: 960, stereo: '«service»', name: ':DomainRules', stroke: '#059669' },
      { x: 1165, stereo: '«database»', name: ':PostgreSQL', stroke: '#D97706' },
    ],
    fragments: [
      { kind: 'alt', guard: '[Phase 1: Leave Submission & Working-Day Validation]', fromStep: 0, toStep: 7 },
      { kind: 'alt', guard: '[Phase 2: Manager Approval & Entitlement Transition]', fromStep: 8, toStep: 13 },
    ],
    messages: [
      { from: 0, to: 2, label: 'submitLeaveForm(typeId, start, end, reason)' },
      { from: 2, to: 3, label: 'POST /api/leave/requests' },
      { from: 3, to: 5, label: 'SELECT public_holidays, organization_settings' },
      { from: 3, to: 4, label: 'calculateWorkingLeaveDays(start, end, holidays)' },
      { from: 4, to: 3, label: 'workingDays = 4 (Fri/Sat excluded)', reply: true },
      { from: 3, to: 4, label: 'doDateRangesOverlap() & applyLeaveBalanceTransition(SUBMIT)' },
      { from: 3, to: 5, label: 'UPDATE leave_entitlements + INSERT leave_requests (PENDING)' },
      { from: 3, to: 2, label: 'HTTP 201 Created (pending_days reserved)', reply: true },
      { from: 1, to: 2, label: 'clickApproveLeave(requestId, comment)' },
      { from: 2, to: 3, label: 'PATCH /api/leave/requests/:id/decision' },
      { from: 3, to: 4, label: 'canApproveLeaveForEmployee(actor, employee)' },
      { from: 4, to: 3, label: 'authorized = true & applyLeaveBalanceTransition(APPROVE)', reply: true },
      { from: 3, to: 5, label: 'UPDATE leave_entitlements (used_days) & status = APPROVED' },
      { from: 3, to: 2, label: 'HTTP 200 OK + Notification Dispatched', reply: true },
    ],
  });
}

function genSequenceEmployeeDiagram() {
  return buildSequenceDiagram({
    title: '4.6 UML Sequence Diagram — Employee Creation & Automated Multi-Table Provisioning',
    subtitle: 'Transactional Provisioning across employees, leave_entitlements, compensation_records, onboarding_checklists & audit_logs',
    participants: [
      { x: 130, stereo: '«actor»', name: ':HRManager', stroke: '#059669' },
      { x: 380, stereo: '«boundary»', name: ':EmployeesPageUI', stroke: '#0F172A' },
      { x: 640, stereo: '«control»', name: ':EmployeeController', stroke: '#4F46E5' },
      { x: 900, stereo: '«service»', name: ':DomainRules', stroke: '#059669' },
      { x: 1150, stereo: '«database»', name: ':PostgreSQL', stroke: '#D97706' },
    ],
    fragments: [
      { kind: 'opt', guard: '[canPerformAction(MANAGE_EMPLOYEES) == true]', fromStep: 2, toStep: 10 },
    ],
    messages: [
      { from: 0, to: 1, label: 'submitNewEmployeeModal(payload)' },
      { from: 1, to: 2, label: 'POST /api/employees' },
      { from: 2, to: 3, label: 'canPerformAction(actor.roles, MANAGE_EMPLOYEES)' },
      { from: 2, to: 4, label: 'SELECT email, employee_number FROM employees' },
      { from: 2, to: 3, label: 'validateEmployeeInput() & generateNextEmployeeNumber()' },
      { from: 3, to: 2, label: 'valid = true, code = "NW-EMP-026"', reply: true },
      { from: 2, to: 4, label: 'INSERT INTO employees (employee_number = NW-EMP-026)' },
      { from: 2, to: 4, label: 'INSERT INTO leave_entitlements (2026 Annual, Sick, Casual)' },
      { from: 2, to: 4, label: 'INSERT INTO compensation_records (base_salary_egp)' },
      { from: 2, to: 4, label: 'INSERT INTO onboarding_checklists & audit_logs' },
      { from: 2, to: 1, label: 'HTTP 201 Created (Employee Provisioned)', reply: true },
    ],
  });
}

function genSequenceAuthRtlDiagram() {
  return buildSequenceDiagram({
    title: '4.7 UML Sequence Diagram — Default Egyptian Arabic (ar-EG RTL), Auth & RBAC Bootstrap',
    subtitle: 'Traces resolveInitialLocale() -> dir="rtl" -> POST /api/auth/login -> Scoped GET /api/bootstrap',
    participants: [
      { x: 120, stereo: '«actor»', name: ':User', stroke: '#0284C7' },
      { x: 350, stereo: '«boundary»', name: ':LandingAndLoginUI', stroke: '#0F172A' },
      { x: 580, stereo: '«context»', name: ':LanguageContext', stroke: '#059669' },
      { x: 810, stereo: '«context»', name: ':AuthContext', stroke: '#4F46E5' },
      { x: 1030, stereo: '«control»', name: ':ExpressAPI', stroke: '#4F46E5' },
      { x: 1190, stereo: '«database»', name: ':PostgreSQL', stroke: '#D97706' },
    ],
    fragments: [
      { kind: 'alt', guard: '[Default Mount: Egyptian Arabic ar-EG RTL]', fromStep: 0, toStep: 2 },
      { kind: 'alt', guard: '[Authentication & Role-Scoped Workspace Hydration]', fromStep: 3, toStep: 9 },
    ],
    messages: [
      { from: 0, to: 1, label: 'open NexaHR Landing Page (/)' },
      { from: 1, to: 2, label: 'resolveInitialLocale() -> "ar"' },
      { from: 2, to: 1, label: 'set document.dir="rtl", lang="ar-EG"', reply: true },
      { from: 0, to: 1, label: 'submitLogin(email, password) or 1-Click Role' },
      { from: 1, to: 3, label: 'loginWithCredentials(email, password)' },
      { from: 3, to: 4, label: 'POST /api/auth/login' },
      { from: 4, to: 5, label: 'Verify profile + Load user_roles + Write USER_LOGIN audit' },
      { from: 4, to: 3, label: 'Return signed HMAC token + Actor role scope', reply: true },
      { from: 3, to: 4, label: 'GET /api/bootstrap (Bearer Token)' },
      { from: 4, to: 3, label: 'Return RBAC-filtered WorkspaceData (26 tables)', reply: true },
    ],
  });
}

function genSequencePayrollDiagram() {
  return buildSequenceDiagram({
    title: '4.8 UML Sequence Diagram — EGP Payroll Engine & RBAC Compensation Confidentiality',
    subtitle: 'Demonstrates Negative RBAC Filtering for Department Managers vs Full Payroll Governance for HR/Admin',
    participants: [
      { x: 125, stereo: '«actor»', name: ':DeptManager', stroke: '#4F46E5' },
      { x: 335, stereo: '«actor»', name: ':HRManager', stroke: '#059669' },
      { x: 555, stereo: '«boundary»', name: ':PayrollPageUI', stroke: '#0F172A' },
      { x: 785, stereo: '«control»', name: ':PayrollController', stroke: '#4F46E5' },
      { x: 1000, stereo: '«service»', name: ':DomainRules', stroke: '#059669' },
      { x: 1180, stereo: '«database»', name: ':PostgreSQL', stroke: '#D97706' },
    ],
    fragments: [
      { kind: 'alt', guard: '[Case A: Dept Manager Restricted to Own Payslip Only]', fromStep: 0, toStep: 3 },
      { kind: 'alt', guard: '[Case B: HR Manager EGP Simulation & Period Approval]', fromStep: 4, toStep: 9 },
    ],
    messages: [
      { from: 0, to: 2, label: 'navigate to /payroll' },
      { from: 2, to: 3, label: 'GET /api/bootstrap (Dept Manager Token)' },
      { from: 3, to: 4, label: 'canAccessEmployeeCompensation(actor, targetId)' },
      { from: 3, to: 2, label: 'Return ONLY actor.employeeId compensation & payslip', reply: true },
      { from: 1, to: 2, label: 'adjustEgpPayrollSimulator(base, housing, unpaidDays)' },
      { from: 2, to: 4, label: 'calculatePayrollItem(base, allowances, deductions)' },
      { from: 4, to: 2, label: 'Return grossPayEgp & netPayEgp breakdown', reply: true },
      { from: 1, to: 3, label: 'PATCH /api/payroll/periods/:id/status (APPROVED / PAID)' },
      { from: 3, to: 5, label: 'UPDATE payroll_periods & INSERT PAYROLL_STATUS_UPDATE audit' },
      { from: 3, to: 2, label: 'HTTP 200 OK (Payroll Period Locked)', reply: true },
    ],
  });
}

// ============================================================================
// 9. DOMAIN CLASS DIAGRAM (09-class-diagram.svg)
// ============================================================================
function drawUmlClass(x, y, w, stereo, name, attrs, methods, hdrColor = '#0F172A') {
  const attrH = Math.max(24, attrs.length * 17 + 10);
  const methH = Math.max(24, methods.length * 17 + 10);
  const totalH = 42 + attrH + methH;

  let out = `
  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="${w}" height="${totalH}" rx="8" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.8"/>
    <rect x="0" y="0" width="${w}" height="42" rx="8" fill="${hdrColor}"/>
    <rect x="0" y="30" width="${w}" height="12" fill="${hdrColor}"/>
    <text x="${w / 2}" y="16" text-anchor="middle" fill="#38BDF8" font-size="9.5" font-family="monospace">${esc(stereo)}</text>
    <text x="${w / 2}" y="33" text-anchor="middle" fill="#FFFFFF" font-size="12.5" font-weight="700">${esc(name)}</text>
    <line x1="0" y1="${42 + attrH}" x2="${w}" y2="${42 + attrH}" stroke="#CBD5E1" stroke-width="1.4"/>
  `;

  attrs.forEach((a, i) => {
    out += `<text x="10" y="${58 + i * 17}" fill="#1E293B" font-size="10.5" font-family="monospace">${esc(a)}</text>`;
  });

  methods.forEach((m, i) => {
    out += `<text x="10" y="${42 + attrH + 16 + i * 17}" fill="#4F46E5" font-size="10.5" font-family="monospace" font-weight="600">${esc(m)}</text>`;
  });

  out += `</g>`;
  return { svg: out, bottom: y + totalH, right: x + w };
}

function genClassDiagram() {
  const width = 1320;
  const height = 920;

  const classes = [
    drawUmlClass(35, 92, 260, '«entity»', 'Profile', [
      '+ id : int «PK»',
      '+ uid : string «UQ»',
      '+ email : string «UQ»',
      '+ fullName : string',
      '+ accountStatus : AccountStatus',
    ], ['+ verifyPassword(raw) : bool', '+ isActive() : bool']),

    drawUmlClass(35, 315, 260, '«entity»', 'UserRole', [
      '+ id : int «PK»',
      '+ profileId : int «FK»',
      '+ role : RoleType',
    ], ['+ hasPrivilege(action) : bool']),

    drawUmlClass(35, 495, 260, '«entity»', 'Department', [
      '+ id : int «PK»',
      '+ code : string «UQ»',
      '+ name : string',
      '+ managerEmployeeId : int',
      '+ budgetEgp : decimal(14,2)',
      '+ isArchived : bool',
    ], ['+ canArchive(activeCount) : bool']),

    drawUmlClass(35, 710, 260, '«entity»', 'JobTitle', [
      '+ id : int «PK»',
      '+ code : string «UQ»',
      '+ title : string',
      '+ departmentId : int «FK»',
      '+ minSalaryEgp : decimal(12,2)',
      '+ maxSalaryEgp : decimal(12,2)',
    ], ['+ isWithinBand(salary) : bool']),

    drawUmlClass(375, 195, 295, '«aggregateRoot»', 'Employee', [
      '+ id : int «PK»',
      '+ employeeNumber : string «UQ»',
      '+ profileId : int «FK»',
      '+ firstName : string',
      '+ lastName : string',
      '+ email : string «UQ»',
      '+ departmentId : int «FK»',
      '+ jobTitleId : int «FK»',
      '+ managerId : int «FK»',
      '+ employmentStatus : EmpStatus',
      '+ hireDate : date',
      '+ onboardingProgress : int',
    ], [
      '+ assignManager(mgrId) : void',
      '+ archiveNonDestructive() : void',
      '+ reactivate() : void',
    ], '#1E1B4B'),

    drawUmlClass(750, 92, 260, '«entity»', 'AttendanceRecord', [
      '+ id : int «PK»',
      '+ employeeId : int «FK»',
      '+ attendanceDate : date',
      '+ checkInUtc : timestamp',
      '+ checkOutUtc : timestamp',
      '+ workedMinutes : int',
      '+ lateMinutes : int',
      '+ status : AttendanceStatus',
    ], ['+ markCorrected(mgrId) : void']),

    drawUmlClass(750, 340, 260, '«entity»', 'LeaveEntitlement', [
      '+ id : int «PK»',
      '+ employeeId : int «FK»',
      '+ leaveTypeId : int «FK»',
      '+ year : int',
      '+ allocatedDays : decimal(5,1)',
      '+ usedDays : decimal(5,1)',
      '+ pendingDays : decimal(5,1)',
    ], ['+ availableDays() : decimal']),

    drawUmlClass(750, 560, 260, '«entity»', 'LeaveRequest', [
      '+ id : int «PK»',
      '+ employeeId : int «FK»',
      '+ leaveTypeId : int «FK»',
      '+ startDate : date',
      '+ endDate : date',
      '+ totalDays : decimal(5,1)',
      '+ status : LeaveStatus',
    ], ['+ transitionTo(next) : bool']),

    drawUmlClass(1040, 92, 245, '«entity»', 'CompensationRecord', [
      '+ id : int «PK»',
      '+ employeeId : int «FK»',
      '+ baseSalaryEgp : decimal',
      '+ housingAllowanceEgp : decimal',
      '+ standardDeductionEgp : decimal',
      '+ isCurrent : bool',
    ], ['+ computeNetPay() : decimal']),

    drawUmlClass(1040, 325, 245, '«entity»', 'PayrollItem', [
      '+ id : int «PK»',
      '+ payrollPeriodId : int «FK»',
      '+ employeeId : int «FK»',
      '+ grossPayEgp : decimal',
      '+ netPayEgp : decimal',
      '+ paymentStatus : PayStatus',
    ], ['+ lockDisbursement() : void']),

    drawUmlClass(375, 575, 310, '«domainService»', 'DomainRulesService (rules.ts)', [
      '+ BRAND_NAME : "NexaHR"',
      '+ CAIRO_WEEKEND : ["Friday","Saturday"]',
    ], [
      '+ validateEmployeeInput(input) : Result',
      '+ hasCircularManagerRelationship() : bool',
      '+ generateNextEmployeeNumber() : string',
      '+ calculateWorkingLeaveDays() : number',
      '+ applyLeaveBalanceTransition() : Quota',
      '+ calculateAttendanceMetrics() : Metrics',
      '+ calculatePayrollItem() : PayrollBreakdown',
      '+ canPerformAction(roles, act) : bool',
      '+ validateDemoContactRequest() : Result',
    ], '#312E81'),

    drawUmlClass(1040, 555, 245, '«domainService»', 'LocalizationService', [
      '+ defaultLocale : "ar" (ar-EG)',
      '+ direction : "rtl" | "ltr"',
    ], [
      '+ resolveInitialLocale() : Locale',
      '+ getDirectionForLocale() : Dir',
      '+ translateDepartmentName() : str',
      '+ translateJobTitle() : str',
      '+ translateRole() : str',
      '+ translateStatus() : str',
    ], '#065F46'),
  ];

  const rels = `
  <!-- Relationships with Multiplicities -->
  <line x1="165" y1="264" x2="165" y2="315" stroke="#0F172A" stroke-width="1.6" marker-start="url(#diamond-comp)"/>
  <text x="175" y="292" fill="#0F172A" font-size="10.5" font-weight="700">1 .. 1..*</text>

  <line x1="295" y1="210" x2="375" y2="240" stroke="#0F172A" stroke-width="1.6" marker-end="url(#arrow-open)"/>
  <text x="332" y="218" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">0..1 ── 1</text>

  <line x1="295" y1="545" x2="375" y2="410" stroke="#0F172A" stroke-width="1.6" marker-start="url(#diamond-agg)"/>
  <text x="330" y="468" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">1 ── 0..*</text>

  <line x1="670" y1="245" x2="750" y2="185" stroke="#0F172A" stroke-width="1.6" marker-start="url(#diamond-comp)"/>
  <text x="710" y="205" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">1 ── 0..*</text>

  <line x1="670" y1="320" x2="750" y2="410" stroke="#0F172A" stroke-width="1.6" marker-start="url(#diamond-comp)"/>
  <text x="710" y="360" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">1 ── 4</text>

  <line x1="670" y1="395" x2="750" y2="610" stroke="#0F172A" stroke-width="1.6" marker-end="url(#arrow-open)"/>
  <text x="710" y="520" text-anchor="middle" fill="#0F172A" font-size="10" font-weight="700">1 ── 0..*</text>

  <line x1="670" y1="280" x2="1040" y2="175" stroke="#0F172A" stroke-width="1.6" marker-start="url(#diamond-comp)"/>
  <line x1="670" y1="350" x2="1040" y2="395" stroke="#0F172A" stroke-width="1.6" marker-end="url(#arrow-open)"/>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.9 UML Domain Class Diagram — Entities, Aggregate Root, Multiplicities & Pure Domain Services',
    subtitle: '3-Compartment UML Class Specification mapped to src/db/schema.ts and src/domain/rules.ts',
    body: rels + classes.map((c) => c.svg).join('\n'),
  });
}

// ============================================================================
// 10. ENTITY-RELATIONSHIP (ER) DIAGRAM (10-er-diagram.svg)
// ============================================================================
function drawErTable(x, y, w, tableName, cols, hdrFill = '#1E293B') {
  const h = 34 + cols.length * 19 + 8;
  let svg = `
  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="${w}" height="${h}" rx="7" fill="#FFFFFF" stroke="#334155" stroke-width="1.6"/>
    <rect x="0" y="0" width="${w}" height="32" rx="7" fill="${hdrFill}"/>
    <rect x="0" y="22" width="${w}" height="10" fill="${hdrFill}"/>
    <text x="12" y="21" fill="#FFFFFF" font-size="11.5" font-weight="700" font-family="monospace">${esc(tableName)}</text>
  `;
  cols.forEach(([key, name, type], idx) => {
    const cy = 49 + idx * 19;
    const keyColor = key === 'PK' ? '#D97706' : key === 'FK' ? '#4F46E5' : '#94A3B8';
    svg += `
    <text x="10" y="${cy}" fill="${keyColor}" font-size="9.5" font-weight="700" font-family="monospace">${esc(key)}</text>
    <text x="38" y="${cy}" fill="#0F172A" font-size="10.5" font-family="monospace" font-weight="600">${esc(name)}</text>
    <text x="${w - 10}" y="${cy}" text-anchor="end" fill="#64748B" font-size="10" font-family="monospace">${esc(type)}</text>
    `;
  });
  svg += `</g>`;
  return svg;
}

function genErDiagram() {
  const width = 1320;
  const height = 880;

  const tables = [
    drawErTable(30, 90, 260, 'profiles', [
      ['PK', 'id', 'serial'],
      ['UQ', 'uid', 'varchar(128)'],
      ['UQ', 'email', 'varchar(255)'],
      ['', 'full_name', 'varchar(255)'],
      ['', 'account_status', 'varchar(32)'],
    ]),
    drawErTable(30, 255, 260, 'user_roles', [
      ['PK', 'id', 'serial'],
      ['FK', 'profile_id', 'integer'],
      ['', 'role', 'varchar(64)'],
    ]),
    drawErTable(30, 385, 260, 'departments', [
      ['PK', 'id', 'serial'],
      ['UQ', 'code', 'varchar(32)'],
      ['', 'name', 'varchar(160)'],
      ['FK', 'manager_employee_id', 'integer'],
      ['', 'budget_egp', 'numeric(14,2)'],
      ['', 'is_archived', 'boolean'],
    ]),
    drawErTable(30, 565, 260, 'job_titles', [
      ['PK', 'id', 'serial'],
      ['UQ', 'code', 'varchar(32)'],
      ['', 'title', 'varchar(160)'],
      ['FK', 'department_id', 'integer'],
      ['', 'min_salary_egp', 'numeric(12,2)'],
      ['', 'max_salary_egp', 'numeric(12,2)'],
    ]),
    drawErTable(30, 735, 260, 'audit_logs', [
      ['PK', 'id', 'serial'],
      ['FK', 'actor_profile_id', 'integer'],
      ['', 'action', 'varchar(120)'],
      ['', 'entity_type', 'varchar(80)'],
      ['', 'created_at', 'timestamp'],
    ]),

    drawErTable(365, 195, 290, 'employees (Core Hub)', [
      ['PK', 'id', 'serial'],
      ['UQ', 'employee_number', 'varchar(32)'],
      ['FK', 'profile_id', 'integer'],
      ['', 'first_name', 'varchar(120)'],
      ['', 'last_name', 'varchar(120)'],
      ['UQ', 'email', 'varchar(255)'],
      ['FK', 'department_id', 'integer'],
      ['FK', 'job_title_id', 'integer'],
      ['FK', 'manager_id', 'integer'],
      ['', 'employment_status', 'varchar(32)'],
      ['', 'hire_date', 'date'],
      ['', 'onboarding_progress', 'integer'],
    ], '#312E81'),

    drawErTable(365, 515, 290, 'tasks', [
      ['PK', 'id', 'serial'],
      ['', 'title', 'varchar(255)'],
      ['FK', 'assignee_employee_id', 'integer'],
      ['FK', 'department_id', 'integer'],
      ['', 'priority', 'varchar(24)'],
      ['', 'status', 'varchar(32)'],
      ['', 'progress_percent', 'integer'],
    ]),
    drawErTable(365, 710, 290, 'performance_reviews', [
      ['PK', 'id', 'serial'],
      ['FK', 'employee_id', 'integer'],
      ['FK', 'reviewer_employee_id', 'integer'],
      ['', 'review_cycle', 'varchar(64)'],
      ['', 'overall_rating', 'numeric(3,2)'],
      ['', 'status', 'varchar(32)'],
    ]),

    drawErTable(730, 90, 270, 'attendance_records', [
      ['PK', 'id', 'serial'],
      ['FK', 'employee_id', 'integer'],
      ['', 'attendance_date', 'date'],
      ['', 'check_in_utc', 'timestamp'],
      ['', 'check_out_utc', 'timestamp'],
      ['', 'worked_minutes', 'integer'],
      ['', 'late_minutes', 'integer'],
      ['', 'status', 'varchar(32)'],
    ]),
    drawErTable(730, 305, 270, 'leave_types', [
      ['PK', 'id', 'serial'],
      ['UQ', 'code', 'varchar(32)'],
      ['', 'name', 'varchar(120)'],
      ['', 'default_days_per_year', 'integer'],
      ['', 'is_paid', 'boolean'],
    ]),
    drawErTable(730, 465, 270, 'leave_entitlements', [
      ['PK', 'id', 'serial'],
      ['FK', 'employee_id', 'integer'],
      ['FK', 'leave_type_id', 'integer'],
      ['', 'year', 'integer'],
      ['', 'allocated_days', 'numeric(5,1)'],
      ['', 'used_days', 'numeric(5,1)'],
      ['', 'pending_days', 'numeric(5,1)'],
    ]),
    drawErTable(730, 665, 270, 'leave_requests', [
      ['PK', 'id', 'serial'],
      ['FK', 'employee_id', 'integer'],
      ['FK', 'leave_type_id', 'integer'],
      ['', 'start_date', 'date'],
      ['', 'end_date', 'date'],
      ['', 'total_days', 'numeric(5,1)'],
      ['', 'status', 'varchar(32)'],
    ]),

    drawErTable(1045, 90, 245, 'compensation_records', [
      ['PK', 'id', 'serial'],
      ['FK', 'employee_id', 'integer'],
      ['', 'base_salary_egp', 'numeric(12,2)'],
      ['', 'housing_allowance_egp', 'numeric(12,2)'],
      ['', 'transport_allowance', 'numeric(12,2)'],
      ['', 'standard_deduction', 'numeric(12,2)'],
      ['', 'is_current', 'boolean'],
    ], '#065F46'),
    drawErTable(1045, 315, 245, 'payroll_periods', [
      ['PK', 'id', 'serial'],
      ['UQ', 'period_code', 'varchar(32)'],
      ['', 'status', 'varchar(32)'],
      ['', 'total_gross_egp', 'numeric(14,2)'],
      ['', 'total_net_egp', 'numeric(14,2)'],
    ], '#065F46'),
    drawErTable(1045, 495, 245, 'payroll_items', [
      ['PK', 'id', 'serial'],
      ['FK', 'payroll_period_id', 'integer'],
      ['FK', 'employee_id', 'integer'],
      ['', 'gross_pay_egp', 'numeric(12,2)'],
      ['', 'net_pay_egp', 'numeric(12,2)'],
      ['', 'payment_status', 'varchar(32)'],
    ], '#065F46'),
    drawErTable(1045, 695, 245, 'onboarding_checklists', [
      ['PK', 'id', 'serial'],
      ['FK', 'employee_id', 'integer'],
      ['', 'checklist_type', 'varchar(32)'],
      ['', 'status', 'varchar(32)'],
    ]),
  ];

  const connectors = `
  <!-- Crow's Foot Relational Connectors -->
  <line x1="160" y1="224" x2="160" y2="255" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="290" y1="150" x2="365" y2="245" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="290" y1="450" x2="365" y2="340" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="290" y1="620" x2="365" y2="380" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="510" y1="465" x2="510" y2="515" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="655" y1="240" x2="730" y2="175" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="655" y1="330" x2="730" y2="535" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="655" y1="395" x2="730" y2="735" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="865" y1="435" x2="865" y2="465" stroke="#475569" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  <line x1="655" y1="265" x2="1045" y2="175" stroke="#059669" stroke-width="1.5" stroke-dasharray="4,3" marker-end="url(#arrow-solid)"/>
  <line x1="1165" y1="450" x2="1165" y2="495" stroke="#059669" stroke-width="1.6" marker-end="url(#arrow-solid)"/>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.10 Crow’s Foot Entity-Relationship (ER) Diagram — Normalized PostgreSQL Schema',
    subtitle: 'Core Relational Schema (src/db/schema.ts) · Google Cloud SQL PostgreSQL 16 (europe-west2)',
    body: connectors + tables.join('\n'),
  });
}

// ============================================================================
// 11. STATE MACHINE DIAGRAMS (11-state-machines.svg)
// ============================================================================
function genStateMachinesDiagram() {
  const width = 1280;
  const height = 820;

  const body = `
  <!-- 4 Quadrant Cards -->
  <!-- Quadrant A: Leave State Machine -->
  <rect x="28" y="84" width="600" height="345" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
  <rect x="28" y="84" width="600" height="36" rx="12" fill="#EEF2FF"/>
  <text x="46" y="107" fill="#312E81" font-size="13" font-weight="700">A. Leave Request &amp; Entitlement Balance State Machine</text>

  <circle cx="75" cy="215" r="10" fill="#0F172A"/>
  <line x1="85" y1="215" x2="145" y2="215" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="145" y="182" width="145" height="66" rx="14" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="217" y="206" text-anchor="middle" fill="#92400E" font-size="12" font-weight="700">PENDING</text>
  <line x1="145" y1="214" x2="290" y2="214" stroke="#F59E0B" stroke-width="1"/>
  <text x="217" y="232" text-anchor="middle" fill="#78350F" font-size="9.5" font-family="monospace">entry / pending += days</text>

  <line x1="290" y1="198" x2="385" y2="155" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="335" y="165" text-anchor="middle" fill="#059669" font-size="9.5" font-weight="700">[Approve]</text>

  <rect x="385" y="128" width="165" height="58" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="467" y="150" text-anchor="middle" fill="#065F46" font-size="12" font-weight="700">APPROVED</text>
  <text x="467" y="170" text-anchor="middle" fill="#047857" font-size="9.5" font-family="monospace">entry / used += days</text>

  <line x1="290" y1="230" x2="385" y2="275" stroke="#DC2626" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <text x="335" y="268" text-anchor="middle" fill="#DC2626" font-size="9.5" font-weight="700">[Reject]</text>

  <rect x="385" y="250" width="165" height="58" rx="14" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <text x="467" y="272" text-anchor="middle" fill="#991B1B" font-size="12" font-weight="700">REJECTED</text>
  <text x="467" y="292" text-anchor="middle" fill="#B91C1C" font-size="9.5" font-family="monospace">entry / pending -= days</text>

  <line x1="217" y1="248" x2="217" y2="345" stroke="#475569" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <line x1="467" y1="186" x2="320" y2="365" stroke="#475569" stroke-width="1.6" stroke-dasharray="4,3" marker-end="url(#arrow-solid)"/>

  <rect x="145" y="345" width="175" height="54" rx="14" fill="#F1F5F9" stroke="#475569" stroke-width="2"/>
  <text x="232" y="367" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">CANCELLED</text>
  <text x="232" y="385" text-anchor="middle" fill="#475569" font-size="9.5" font-family="monospace">entry / restore quota</text>

  <!-- Quadrant B: Kanban Task Lifecycle -->
  <rect x="652" y="84" width="600" height="345" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
  <rect x="652" y="84" width="600" height="36" rx="12" fill="#E0F2FE"/>
  <text x="670" y="107" fill="#0369A1" font-size="13" font-weight="700">B. Kanban Task Execution State Machine</text>

  <circle cx="695" cy="205" r="10" fill="#0F172A"/>
  <line x1="705" y1="205" x2="745" y2="205" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="745" y="180" width="105" height="50" rx="12" fill="#F8FAFC" stroke="#475569" stroke-width="2"/>
  <text x="797" y="210" text-anchor="middle" fill="#0F172A" font-size="11.5" font-weight="700">TODO</text>

  <line x1="850" y1="205" x2="900" y2="205" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="900" y="180" width="130" height="50" rx="12" fill="#EEF2FF" stroke="#4F46E5" stroke-width="2"/>
  <text x="965" y="210" text-anchor="middle" fill="#312E81" font-size="11.5" font-weight="700">IN_PROGRESS</text>

  <line x1="965" y1="230" x2="965" y2="320" stroke="#DC2626" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <rect x="900" y="320" width="130" height="50" rx="12" fill="#FEF2F2" stroke="#DC2626" stroke-width="2"/>
  <text x="965" y="350" text-anchor="middle" fill="#991B1B" font-size="11.5" font-weight="700">BLOCKED</text>

  <line x1="1030" y1="205" x2="1085" y2="205" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <rect x="1085" y="180" width="130" height="50" rx="12" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
  <text x="1150" y="210" text-anchor="middle" fill="#92400E" font-size="11.5" font-weight="700">IN_REVIEW</text>

  <line x1="1150" y1="230" x2="1150" y2="320" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>
  <rect x="1085" y="320" width="130" height="50" rx="12" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="1150" y="350" text-anchor="middle" fill="#065F46" font-size="11.5" font-weight="700">COMPLETED</text>

  <!-- Quadrant C: Performance Review State Machine -->
  <rect x="28" y="452" width="600" height="335" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
  <rect x="28" y="452" width="600" height="36" rx="12" fill="#ECFDF5"/>
  <text x="46" y="475" fill="#065F46" font-size="13" font-weight="700">C. Performance Review Appraisal State Machine</text>

  <circle cx="72" cy="615" r="10" fill="#0F172A"/>
  <line x1="82" y1="615" x2="125" y2="615" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="125" y="582" width="130" height="66" rx="14" fill="#F8FAFC" stroke="#475569" stroke-width="2"/>
  <text x="190" y="608" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">DRAFT</text>
  <text x="190" y="628" text-anchor="middle" fill="#64748B" font-size="9.5" font-family="monospace">Confidential to Mgr</text>

  <line x1="255" y1="615" x2="310" y2="615" stroke="#4F46E5" stroke-width="1.8" marker-end="url(#arrow-indigo)"/>
  <text x="282" y="604" text-anchor="middle" fill="#4F46E5" font-size="9.5" font-weight="700">publish()</text>

  <rect x="310" y="582" width="135" height="66" rx="14" fill="#EEF2FF" stroke="#4F46E5" stroke-width="2"/>
  <text x="377" y="608" text-anchor="middle" fill="#312E81" font-size="12" font-weight="700">PUBLISHED</text>
  <text x="377" y="628" text-anchor="middle" fill="#4F46E5" font-size="9.5" font-family="monospace">Visible to Employee</text>

  <line x1="445" y1="615" x2="490" y2="615" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="490" y="582" width="120" height="66" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="550" y="608" text-anchor="middle" fill="#065F46" font-size="11" font-weight="700">ACKNOWLEDGED</text>
  <text x="550" y="628" text-anchor="middle" fill="#047857" font-size="9.5" font-family="monospace">Signed Off</text>

  <!-- Quadrant D: Payroll Period State Machine -->
  <rect x="652" y="452" width="600" height="335" rx="12" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"/>
  <rect x="652" y="452" width="600" height="36" rx="12" fill="#FEF3C7"/>
  <text x="670" y="475" fill="#92400E" font-size="13" font-weight="700">D. EGP Payroll Cycle Governance State Machine</text>

  <circle cx="695" cy="615" r="10" fill="#0F172A"/>
  <line x1="705" y1="615" x2="750" y2="615" stroke="#334155" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="750" y="582" width="135" height="66" rx="14" fill="#F8FAFC" stroke="#475569" stroke-width="2"/>
  <text x="817" y="608" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">DRAFT</text>
  <text x="817" y="628" text-anchor="middle" fill="#64748B" font-size="9.5" font-family="monospace">Simulation Open</text>

  <line x1="885" y1="615" x2="940" y2="615" stroke="#4F46E5" stroke-width="1.8" marker-end="url(#arrow-indigo)"/>
  <text x="912" y="604" text-anchor="middle" fill="#4F46E5" font-size="9.5" font-weight="700">approve()</text>

  <rect x="940" y="582" width="135" height="66" rx="14" fill="#EEF2FF" stroke="#4F46E5" stroke-width="2"/>
  <text x="1007" y="608" text-anchor="middle" fill="#312E81" font-size="12" font-weight="700">APPROVED</text>
  <text x="1007" y="628" text-anchor="middle" fill="#4F46E5" font-size="9.5" font-family="monospace">HR Verified</text>

  <line x1="1075" y1="615" x2="1120" y2="615" stroke="#059669" stroke-width="1.8" marker-end="url(#arrow-solid)"/>

  <rect x="1120" y="582" width="110" height="66" rx="14" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
  <text x="1175" y="608" text-anchor="middle" fill="#065F46" font-size="12" font-weight="700">PAID</text>
  <text x="1175" y="628" text-anchor="middle" fill="#047857" font-size="9.5" font-family="monospace">Disbursed</text>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.11 UML State Machine Diagrams — Leave, Kanban Task, Performance & EGP Payroll Lifecycles',
    subtitle: 'Formal State Transitions, Entry Effects & Guard Conditions enforced in src/domain/rules.ts',
    body,
  });
}

// ============================================================================
// 12. COMPONENT & 5-LAYER ARCHITECTURE DIAGRAM (12-component-architecture.svg)
// ============================================================================
function genComponentArchitectureDiagram() {
  const width = 1260;
  const height = 780;

  const layers = [
    {
      y: 92,
      title: 'Layer 1: Presentation Layer (React 19, Tailwind CSS 4, Motion, Bilingual RTL/LTR)',
      bg: '#EFF6FF',
      border: '#3B82F6',
      comps: [
        ['«component» LandingPage', 'Hero, EGP Simulator & Contact Modal'],
        ['«component» AppShell', 'RTL/LTR Layout, Sidebar & Role Switcher'],
        ['«component» 12 Feature Views', 'Dashboard, Employees, Org, Leave, Payroll...'],
      ],
    },
    {
      y: 222,
      title: 'Layer 2: Application & State Orchestration Layer (React Context Hooks)',
      bg: '#EEF2FF',
      border: '#4F46E5',
      comps: [
        ['«component» LanguageContext', 'Default Egyptian Arabic (ar-EG RTL) & Translators'],
        ['«component» AuthContext', 'Session Token, /api/bootstrap & Instant Personas'],
        ['«component» CSV Exporter', 'Client-side Roster, Attendance & Leave Reports'],
      ],
    },
    {
      y: 352,
      title: 'Layer 3: Backend API & Security Middleware Layer (Express 4 on Port 3000)',
      bg: '#F0FDF4',
      border: '#059669',
      comps: [
        ['«component» requireAuth Middleware', 'HMAC & Firebase Token Verification'],
        ['«component» RBAC Policy Filter', 'Row-Level Compensation & Team Scope Guard'],
        ['«component» REST Controllers', '32 Endpoints in server.ts + Audit Dispatcher'],
      ],
    },
    {
      y: 482,
      title: 'Layer 4: Pure Domain Layer (src/domain/rules.ts — 100% Decoupled & Unit Tested)',
      bg: '#FEF3C7',
      border: '#D97706',
      comps: [
        ['«service» Leave & Attendance Engine', 'Fri/Sat + Cairo Holidays & Shift Grace Math'],
        ['«service» EGP Payroll Calculator', 'Gross/Net EGP & Unpaid Leave Deduction'],
        ['«service» Hierarchy & RBAC Validator', 'Circular Manager Detection & Role Matrix'],
      ],
    },
    {
      y: 612,
      title: 'Layer 5: Persistence & Relational Database Layer (Drizzle ORM + Google Cloud SQL)',
      bg: '#F8FAFC',
      border: '#0F172A',
      comps: [
        ['«component» Drizzle Schema', 'src/db/schema.ts (26 Typed Tables)'],
        ['«component» Seed & Migration Engine', 'src/db/seed.ts (25 NexaWorks Employees)'],
        ['«database» Cloud SQL PostgreSQL 16', 'Instance in europe-west2 (Transactional ACID)'],
      ],
    },
  ];

  let body = '';
  layers.forEach((l, idx) => {
    body += `
    <rect x="40" y="${l.y}" width="1180" height="106" rx="12" fill="${l.bg}" stroke="${l.border}" stroke-width="2"/>
    <text x="60" y="${l.y + 24}" fill="#0F172A" font-size="13" font-weight="700">${esc(l.title)}</text>
    `;
    l.comps.forEach(([cTitle, cSub], cIdx) => {
      const cx = 60 + cIdx * 385;
      const cy = l.y + 36;
      body += `
      <rect x="${cx}" y="${cy}" width="360" height="56" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
      <text x="${cx + 16}" y="${cy + 23}" fill="#4F46E5" font-size="11.5" font-weight="700" font-family="monospace">${esc(cTitle)}</text>
      <text x="${cx + 16}" y="${cy + 42}" fill="#475569" font-size="11">${esc(cSub)}</text>
      `;
    });

    if (idx < layers.length - 1) {
      body += `
      <line x1="240" y1="${l.y + 106}" x2="240" y2="${l.y + 130}" stroke="#334155" stroke-width="2" marker-end="url(#arrow-solid)"/>
      <line x1="630" y1="${l.y + 106}" x2="630" y2="${l.y + 130}" stroke="#334155" stroke-width="2" marker-end="url(#arrow-solid)"/>
      <line x1="1020" y1="${l.y + 106}" x2="1020" y2="${l.y + 130}" stroke="#334155" stroke-width="2" marker-end="url(#arrow-solid)"/>
      `;
    }
  });

  return wrapSvg({
    width,
    height,
    title: '4.12 UML Component & 5-Layer Enterprise Software Architecture Diagram',
    subtitle: 'Strict Unidirectional Dependency Flow: Presentation -> Context -> Express API -> Pure Domain -> PostgreSQL',
    body,
  });
}

// ============================================================================
// 13. DEPLOYMENT & INFRASTRUCTURE DIAGRAM (13-deployment-diagram.svg)
// ============================================================================
function genDeploymentDiagram() {
  const width = 1240;
  const height = 560;

  const body = `
  <!-- Node 1: Client Browser -->
  <rect x="45" y="130" width="320" height="360" rx="12" fill="#FFFFFF" stroke="#0284C7" stroke-width="2.2"/>
  <rect x="45" y="130" width="320" height="48" rx="12" fill="#E0F2FE"/>
  <text x="205" y="152" text-anchor="middle" fill="#0369A1" font-size="11" font-family="monospace" font-weight="700">«device»</text>
  <text x="205" y="170" text-anchor="middle" fill="#0F172A" font-size="14" font-weight="700">Client Browser (Desktop / Mobile)</text>

  <rect x="70" y="205" width="270" height="82" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="205" y="230" text-anchor="middle" fill="#4F46E5" font-size="11" font-family="monospace" font-weight="700">«artifact» nexahr-spa-bundle</text>
  <text x="205" y="250" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="600">React 19 + Vite + Motion UI</text>
  <text x="205" y="270" text-anchor="middle" fill="#64748B" font-size="10.5">Default: ar-EG (RTL) &amp; English (LTR)</text>

  <rect x="70" y="310" width="270" height="72" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="205" y="335" text-anchor="middle" fill="#059669" font-size="11" font-family="monospace" font-weight="700">«artifact» domain/rules.ts</text>
  <text x="205" y="355" text-anchor="middle" fill="#0F172A" font-size="11.5" font-weight="600">Client-Side EGP Payroll Simulator</text>
  <text x="205" y="372" text-anchor="middle" fill="#64748B" font-size="10.5">&amp; Instant Form Validation</text>

  <!-- Node 2: Cloud Run Container -->
  <rect x="460" y="130" width="340" height="360" rx="12" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2.2"/>
  <rect x="460" y="130" width="340" height="48" rx="12" fill="#EEF2FF"/>
  <text x="630" y="152" text-anchor="middle" fill="#4F46E5" font-size="11" font-family="monospace" font-weight="700">«executionEnvironment»</text>
  <text x="630" y="170" text-anchor="middle" fill="#0F172A" font-size="14" font-weight="700">Google Cloud Run (Node.js 22)</text>

  <rect x="485" y="205" width="290" height="82" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="630" y="230" text-anchor="middle" fill="#4F46E5" font-size="11" font-family="monospace" font-weight="700">«artifact» server.ts (Port 3000)</text>
  <text x="630" y="250" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="600">Express 4 REST API &amp; RBAC Guard</text>
  <text x="630" y="270" text-anchor="middle" fill="#64748B" font-size="10.5">HMAC Session &amp; Audit Logger</text>

  <rect x="485" y="310" width="290" height="72" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="630" y="335" text-anchor="middle" fill="#059669" font-size="11" font-family="monospace" font-weight="700">«artifact» Drizzle ORM Pool</text>
  <text x="630" y="355" text-anchor="middle" fill="#0F172A" font-size="11.5" font-weight="600">src/db/index.ts &amp; schema.ts</text>
  <text x="630" y="372" text-anchor="middle" fill="#64748B" font-size="10.5">Connection Pooling via Cloud SQL Proxy</text>

  <!-- Node 3: Cloud SQL PostgreSQL -->
  <rect x="895" y="130" width="300" height="360" rx="12" fill="#FFFFFF" stroke="#059669" stroke-width="2.2"/>
  <rect x="895" y="130" width="300" height="48" rx="12" fill="#ECFDF5"/>
  <text x="1045" y="152" text-anchor="middle" fill="#059669" font-size="11" font-family="monospace" font-weight="700">«databaseServer»</text>
  <text x="1045" y="170" text-anchor="middle" fill="#0F172A" font-size="14" font-weight="700">Cloud SQL PostgreSQL 16</text>

  <rect x="920" y="205" width="250" height="177" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="1045" y="232" text-anchor="middle" fill="#047857" font-size="11.5" font-family="monospace" font-weight="700">«database» nexahr_production</text>
  <text x="1045" y="256" text-anchor="middle" fill="#0F172A" font-size="12" font-weight="700">Region: europe-west2 (London)</text>
  <text x="1045" y="280" text-anchor="middle" fill="#475569" font-size="11">• 26 Normalized Tables</text>
  <text x="1045" y="300" text-anchor="middle" fill="#475569" font-size="11">• 25 Seeded NexaWorks Employees</text>
  <text x="1045" y="320" text-anchor="middle" fill="#475569" font-size="11">• Immutable Security Audit Trail</text>
  <text x="1045" y="340" text-anchor="middle" fill="#475569" font-size="11">• EGP Payroll &amp; Leave Ledgers</text>

  <!-- Communication Links -->
  <line x1="365" y1="250" x2="460" y2="250" stroke="#0F172A" stroke-width="2.2" marker-end="url(#arrow-solid)" marker-start="url(#arrow-solid)"/>
  <rect x="372" y="218" width="82" height="22" rx="4" fill="#0F172A"/>
  <text x="413" y="233" text-anchor="middle" fill="#38BDF8" font-size="9.5" font-family="monospace" font-weight="700">HTTPS/JSON</text>

  <line x1="800" y1="340" x2="895" y2="340" stroke="#059669" stroke-width="2.2" marker-end="url(#arrow-solid)" marker-start="url(#arrow-solid)"/>
  <rect x="806" y="308" width="82" height="22" rx="4" fill="#065F46"/>
  <text x="847" y="323" text-anchor="middle" fill="#FFFFFF" font-size="9.5" font-family="monospace" font-weight="700">TCP :5432</text>
  `;

  return wrapSvg({
    width,
    height,
    title: '4.13 UML Deployment & Cloud Infrastructure Diagram — NexaHR Production Topology',
    subtitle: 'Nodes: Client Browser (RTL/LTR) <-> Cloud Run Container (Node 22 / Express) <-> Cloud SQL PostgreSQL 16 (europe-west2)',
    body,
  });
}

const files = [
  ['01-use-case.svg', genUseCaseDiagram()],
  ['02-activity-leave.svg', genActivityLeaveDiagram()],
  ['03-activity-attendance.svg', genActivityAttendanceDiagram()],
  ['04-activity-onboarding.svg', genActivityOnboardingDiagram()],
  ['05-sequence-leave.svg', genSequenceLeaveDiagram()],
  ['06-sequence-employee.svg', genSequenceEmployeeDiagram()],
  ['07-sequence-auth-rtl.svg', genSequenceAuthRtlDiagram()],
  ['08-sequence-payroll.svg', genSequencePayrollDiagram()],
  ['09-class-diagram.svg', genClassDiagram()],
  ['10-er-diagram.svg', genErDiagram()],
  ['11-state-machines.svg', genStateMachinesDiagram()],
  ['12-component-architecture.svg', genComponentArchitectureDiagram()],
  ['13-deployment-diagram.svg', genDeploymentDiagram()],
];

for (const [filename, content] of files) {
  fs.writeFileSync(path.join(OUT_DIR, filename), content, 'utf8');
  console.log('Generated:', path.join(OUT_DIR, filename));
}
