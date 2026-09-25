#!/usr/bin/env node

/**
 * ProblemPool — Automated Git Synchronization Daemon
 * 
 * Safely monitors file changes, stages non-ignored files, generates meaningful
 * contextual commit messages, pulls remote changes with fast-forward/rebase,
 * and pushes to the existing GitHub repository on the active branch.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PAUSE_FILE = path.join(ROOT_DIR, '.git-sync-pause');
const LOG_FILE = path.join(ROOT_DIR, '.git-sync.log');
const DEBOUNCE_DELAY_MS = 6000; // 6 seconds after last change to group edits
const POLL_INTERVAL_MS = 4000; // Poll check interval

// Helper for running git commands safely
function runGit(command, options = {}) {
  try {
    return execSync(`git ${command}`, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      ...options,
    }).trim();
  } catch (err) {
    if (options.ignoreError) return '';
    throw err;
  }
}

// Log message to console and file
function log(msg, type = 'INFO') {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const formatted = `[${timestamp}] [${type}] ${msg}`;
  console.log(formatted);
  try {
    fs.appendFileSync(LOG_FILE, formatted + '\n', 'utf8');
  } catch (_) {}
}

// Get current git branch
function getCurrentBranch() {
  try {
    return runGit('branch --show-current', { silent: true });
  } catch (_) {
    return 'main';
  }
}

// Get remote URL
function getRemoteUrl() {
  try {
    return runGit('remote get-url origin', { silent: true });
  } catch (_) {
    return 'origin';
  }
}

// Generate meaningful contextual commit message
function generateCommitMessage(statusOutput) {
  const lines = statusOutput.split('\n').filter(Boolean);
  const files = lines.map((l) => l.substring(3).trim());

  const has3D = files.some((f) => /3D|Knowledge|EmptyState|Animated|Shader|gl/i.test(f));
  const hasButton = files.some((f) => /button|glass/i.test(f));
  const hasProblems = files.some((f) => /problem/i.test(f));
  const hasAnswers = files.some((f) => /answer|review|reply/i.test(f));
  const hasChallenges = files.some((f) => /challenge|leaderboard/i.test(f));
  const hasProfile = files.some((f) => /profile|user|follower/i.test(f));
  const hasAuth = files.some((f) => /auth|login|signup/i.test(f));
  const hasServer = files.some((f) => f.startsWith('server/'));
  const hasClient = files.some((f) => f.startsWith('client/'));
  const hasConfig = files.some((f) => /package\.json|\.gitignore|vercel\.json|vite/i.test(f));
  const hasCSS = files.some((f) => /\.css$/i.test(f));

  const descriptions = [];

  if (has3D) descriptions.push('3D visual experience & animations');
  if (hasButton) descriptions.push('GlassAiButton styling & interactions');
  if (hasProblems) descriptions.push('problem management & details');
  if (hasAnswers) descriptions.push('community answers & peer reviews');
  if (hasChallenges) descriptions.push('challenges & community leaderboard');
  if (hasProfile) descriptions.push('user profile & interests');
  if (hasAuth) descriptions.push('authentication workflow');
  if (hasServer && !hasClient) descriptions.push('backend API routes & models');
  if (hasConfig && descriptions.length === 0) descriptions.push('project configuration');
  if (hasCSS && descriptions.length === 0) descriptions.push('visual styling & design tokens');

  let subject = descriptions.length > 0
    ? descriptions.slice(0, 2).join(', ')
    : 'project files & enhancements';

  // Capitalize first letter
  subject = subject.charAt(0).toUpperCase() + subject.slice(1);

  return `Update ProblemPool: ${subject}`;
}

// Security Check: Ensure no sensitive files are ever staged
function checkSecurity() {
  const staged = runGit('diff --name-only --cached', { silent: true }).split('\n').filter(Boolean);
  const sensitivePatterns = [
    /^\.env/i,
    /\.env\./i,
    /\.pem$/i,
    /\.key$/i,
    /id_rsa/i,
    /node_modules\//i,
    /dist\//i,
  ];

  for (const file of staged) {
    if (sensitivePatterns.some((pattern) => pattern.test(file))) {
      log(`SECURITY ALERT: Sensitive/ignored file detected in staging: ${file}. Unstaging immediately!`, 'WARN');
      runGit(`reset HEAD "${file}"`, { silent: true });
    }
  }
}

// Perform a full sync cycle
function performSync(isManual = false) {
  if (fs.existsSync(PAUSE_FILE)) {
    if (isManual) log('Sync is currently paused (found .git-sync-pause). Run with --resume to re-enable.', 'WARN');
    return false;
  }

  const branch = getCurrentBranch();
  const remoteUrl = getRemoteUrl();

  // 1. Check for local modifications/untracked files
  const status = runGit('status --porcelain', { silent: true });
  if (!status) {
    if (isManual) log('Working tree clean. No local changes to commit.', 'INFO');
    return false;
  }

  log(`Detected local changes (${status.split('\n').filter(Boolean).length} file(s)). Starting sync...`, 'INFO');

  try {
    // 2. Stage changes (respecting .gitignore)
    runGit('add -A');

    // 3. Security verification
    checkSecurity();

    // Check if anything remains staged
    const stagedCheck = runGit('diff --cached --name-only', { silent: true });
    if (!stagedCheck) {
      log('No valid changes to commit after security filters.', 'INFO');
      return false;
    }

    // 4. Generate contextual commit message and commit
    const commitMsg = generateCommitMessage(status);
    runGit(`commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
    log(`Committed: "${commitMsg}"`, 'SUCCESS');

    // 5. Fetch and safely pull remote updates
    try {
      runGit(`fetch origin ${branch}`, { silent: true });
      const revLocal = runGit(`rev-parse ${branch}`, { silent: true });
      const revRemote = runGit(`rev-parse origin/${branch}`, { silent: true, ignoreError: true });

      if (revRemote && revLocal !== revRemote) {
        log('Remote has changes. Performing safe rebase pull...', 'INFO');
        runGit(`pull --rebase origin ${branch}`);
      }
    } catch (pullErr) {
      log(`Remote pull/rebase encountered a conflict. Aborting rebase to preserve local changes: ${pullErr.message}`, 'ERROR');
      runGit('rebase --abort', { ignoreError: true });
      return false;
    }

    // 6. Push to remote
    log(`Pushing to ${remoteUrl} (${branch})...`, 'INFO');
    runGit(`push origin ${branch}`);
    log(`Successfully synchronized and pushed to origin/${branch}!`, 'SUCCESS');
    return true;
  } catch (err) {
    log(`Sync failed: ${err.message}`, 'ERROR');
    return false;
  }
}

// Command-line argument handling
const args = process.argv.slice(2);

if (args.includes('--pause')) {
  fs.writeFileSync(PAUSE_FILE, 'paused at ' + new Date().toISOString());
  log('Automatic GitHub sync is now PAUSED.', 'INFO');
  process.exit(0);
}

if (args.includes('--resume')) {
  if (fs.existsSync(PAUSE_FILE)) {
    fs.unlinkSync(PAUSE_FILE);
    log('Automatic GitHub sync is now RESUMED.', 'INFO');
  } else {
    log('Automatic GitHub sync was not paused.', 'INFO');
  }
  process.exit(0);
}

if (args.includes('--once') || args.includes('--sync-now')) {
  log('Running one-time GitHub sync...', 'INFO');
  performSync(true);
  process.exit(0);
}

if (args.includes('--status')) {
  const branch = getCurrentBranch();
  const remote = getRemoteUrl();
  const isPaused = fs.existsSync(PAUSE_FILE);
  const status = runGit('status --porcelain', { silent: true });

  console.log('\n================ ProblemPool Git Sync Status ================');
  console.log(`Branch:        ${branch}`);
  console.log(`Remote:        ${remote}`);
  console.log(`Sync Status:   ${isPaused ? '⏸️ PAUSED' : '▶️ ACTIVE'}`);
  console.log(`Local Changes: ${status ? status.split('\n').filter(Boolean).length + ' uncommitted file(s)' : 'Clean'}`);
  console.log('=============================================================\n');
  process.exit(0);
}

// Continuous Watcher Daemon Mode
log('====================================================', 'INFO');
log('ProblemPool Automatic GitHub Sync Daemon started.', 'INFO');
log(`Branch: ${getCurrentBranch()} | Remote: ${getRemoteUrl()}`, 'INFO');
log(`Debounce interval: ${DEBOUNCE_DELAY_MS / 1000}s`, 'INFO');
log('====================================================', 'INFO');

// Perform initial sync on startup if uncommitted changes exist
performSync(false);

let debounceTimer = null;
let lastStatusSnapshot = runGit('status --porcelain', { silent: true, ignoreError: true });

// Periodic state poller
setInterval(() => {
  if (fs.existsSync(PAUSE_FILE)) return;

  try {
    const currentStatus = runGit('status --porcelain', { silent: true, ignoreError: true });

    if (currentStatus && currentStatus !== lastStatusSnapshot) {
      lastStatusSnapshot = currentStatus;

      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(() => {
        performSync(false);
        lastStatusSnapshot = runGit('status --porcelain', { silent: true, ignoreError: true });
      }, DEBOUNCE_DELAY_MS);
    }
  } catch (_) {}
}, POLL_INTERVAL_MS);
