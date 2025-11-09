QueueCTL
A minimal CLI-based background job queue with retries, exponential backoff, Dead Letter Queue, SQLite persistence, and a web dashboard.


DEMO VIDEO LINK: https://drive.google.com/file/d/1vec9T_SDS2yHMTsrOfn973dqzJQqawoI/view?usp=sharing



Quick Start
Terminal A
First install dependencies and start the dashboard:
    npm install
    npm run dev dashboard

Then open http://localhost:3000 in your browser to view the dashboard.

Terminal B
Enqueue jobs using the provided JSON files:
    npm run dev enqueue .\ok1.json
    npm run dev enqueue .\long1.json
    npm run dev enqueue .\fail1.json
    npm run dev enqueue .\invalid1.json
    npm run dev enqueue .\sched1.json
    npm run dev enqueue .\prioA.json
    npm run dev enqueue .\prioB.json
    npm run dev enqueue .\prioC.json

Optional: Check the current queue status:
    npm run dev status

Configure the backoff base and start workers:
    npm run dev config set backoff-base 2
    npm run dev worker start --count 3

DLQ Operations
List jobs in the dead letter queue:
    npm run dev dlq list
Retry a failed job from the DLQ:
    npm run dev dlq retry fail1
Check the DLQ again:
    npm run dev dlq list

State Snapshots
View current queue status:
    npm run dev status
List jobs by state:

    npm run dev list --state processing
    npm run dev list --state complete
    npm run dev list --state failed
    npm run dev list --state dead
    npm run dev list --state pending

Persistence Test
Enqueue a job to test persistence:
    npm run dev enqueue .\persist1.json
List all jobs to verify:
    npm run dev list
Graceful Stop
Press Ctrl + C in the worker terminal to stop workers gracefully. Alternatively:
    npm run dev worker stop

Setup Instructions

Prerequisites

Node.js 18 or higher and npm installed. On Windows, if installing better-sqlite3 fails, install Visual Studio Build Tools with the C++ workload and re-run npm install.

Installation

Run npm install to install all dependencies. The system will create a SQLite database file called queue.db in the project directory on first run.

Run Modes
For development, use npm run dev followed by any command. For production, first run npm run build, then use npm start followed by any command.

Database
The system uses SQLite for persistence. The database file queue.db is created automatically. To reset the database, delete queue.db, queue.db-wal, and queue.db-shm files.

Usage Examples
Enqueue Jobs

Add a job from a JSON file:
npm run dev enqueue .\job.json
A job file should contain an id, command, and optionally max_retries, priority, and run_at fields. The id must be unique. The command is the shell command to execute. max_retries defaults to 3. priority defaults to 0, with higher numbers processed first. run_at is optional and sets a scheduled execution time in ISO format.

Workers

Start multiple workers to process jobs concurrently:
npm run dev worker start --count 3
Workers poll the database for available jobs and execute them. Stop workers by pressing Ctrl+C in the worker terminal, which allows them to finish the current job before exiting.

Status and Lists

Get a summary of the queue:
npm run dev status
List all jobs:
npm run dev list
List jobs filtered by state:
npm run dev list --state pending
npm run dev list --state processing
npm run dev list --state completed
npm run dev list --state failed
npm run dev list --state dead

Dead Letter Queue
List all jobs in the dead letter queue:
npm run dev dlq list
Retry a job from the DLQ, which resets its attempts and moves it back to pending:
npm run dev dlq retry <job-id>

Configuration
Set configuration values:
npm run dev config set backoff-base 2
npm run dev config set poll_interval_ms 200
Get a configuration value:
npm run dev config get backoff-base
List all configuration:
npm run dev config list

    Dashboard
    Start the web dashboard:
    npm run dev dashboard
    Open http://localhost:3000 in your browser. The dashboard shows job counts by state, active workers, and recent jobs. It auto-refreshes every 2 seconds.

    Architecture Overview
    The system consists of a CLI layer that parses commands, service layers that handle business logic, a SQLite database for persistence, and a web dashboard for monitoring.
    Component Architecture
    The CLI layer uses commander.js to parse commands and route them to appropriate services. The Queue Service handles enqueueing and listing jobs. The Scheduler Service manages job claiming, state transitions, and retry logic. The Worker Service executes jobs and manages worker processes. All services interact with the SQLite database which stores jobs, workers, and configuration. The Dashboard Server provides a web interface via Express.js.
    Job Lifecycle
    Jobs start in the pending state when enqueued. A worker claims a job atomically, moving it to processing. If execution succeeds, the job moves to completed. If execution fails, the job moves to failed and will retry after an exponential backoff delay. If retries are exhausted, the job moves to dead and enters the Dead Letter Queue.

    State transitions:
    - pending: Job is queued and waiting
    - processing: Job is being executed by a worker
    - completed: Job executed successfully
    - failed: Job failed but will retry if attempts remain
    - dead: Job exceeded max retries, moved to DLQ

    Data Persistence
    All data is stored in SQLite using better-sqlite3. The database uses WAL mode to support concurrent reads and writes. Three tables store the data: jobs table contains all job information including state, attempts, errors, and metadata; workers table tracks active workers with heartbeats; config table stores system configuration as key-value pairs. Jobs persist across restarts. Workers register themselves on startup and clean up on shutdown.

    Worker Logic
    Workers run in a continuous polling loop. When a worker starts, it registers itself in the database with a unique ID. It then polls for available jobs using an atomic claim transaction that prevents duplicate processing. When a job is claimed, the worker executes the command in a child process, capturing stdout, stderr, and exit code. Based on the execution result, the worker updates the job state. Workers send periodic heartbeats every 5 seconds to indicate they are alive. On graceful shutdown via Ctrl+C, workers finish the current job before exiting.

    Multiple workers can run concurrently, each polling independently. The atomic claim mechanism ensures no job is processed by multiple workers simultaneously.

    Concurrency and Safety
    The system uses database transactions for atomic job claiming, preventing duplicate processing even with multiple workers. Multiple workers can run in parallel, each polling independently. Workers support graceful shutdown, finishing the current job before exiting when Ctrl+C is pressed. Workers update their heartbeat every 5 seconds to indicate liveness.

    Project Directory Structure
    The project is organized into several directories. The src/cli directory contains command handlers for each CLI command. The src/dashboard directory contains the web dashboard with a public HTML file and Express server. The src/db directory handles database connection, migrations, and schema. The src/services directory contains business logic for queue operations, scheduling, worker execution, and configuration. The src/utils directory contains utility functions for logging, signal handling, and time operations. The root contains sample JSON job files, package.json, TypeScript configuration, and the SQLite database file.

    Assumptions and Trade-offs

    Technology Choices
    SQLite was chosen for simplicity and is sufficient for this scope. It provides ACID guarantees and concurrent access via WAL mode without requiring a separate database server. Workers run in-process within the same Node.js process. External process management is out of scope. better-sqlite3 is a synchronous SQLite driver chosen for simplicity, suitable for this use case where blocking operations are acceptable.

    Design Decisions
    The worker stop command is informational only. Actual stopping is done via Ctrl+C for graceful shutdown. Only backoff base and poll interval are configurable. Other retry policies and behaviors are hardcoded for simplicity. Logging is console-based only with no centralized log storage. The dashboard is a simple polling-based UI that refreshes every 2 seconds, with no WebSocket or real-time updates. Commands run in shell processes with no sandboxing or isolation between jobs. Priority is simple integer-based with higher numbers processed first, then by next_run_at. Retry backoff uses exponential backoff with the formula base raised to the power of attempts, with delay in seconds.

Bonus Features

    Job Priority Queues
    Implemented. Jobs support a priority field that defaults to 0. Higher priority values are processed first. When multiple jobs are available, the scheduler selects jobs ordered by priority descending, then by next_run_at ascending. Set priority in the job JSON file when enqueueing.

    Scheduled and Delayed Jobs
    Implemented. Jobs support a run_at field that accepts an ISO timestamp. When provided, the job remains in pending state until the scheduled time. The scheduler only claims jobs where next_run_at is less than or equal to the current time. This allows jobs to be scheduled for future execution.

    Job Output Logging
    Partially implemented. The system captures stdout and stderr from job execution in memory. However, this output is not persisted to the database. The run_log field exists in the database schema but is not currently populated. Output is used for error messages when jobs fail.

    Metrics and Execution Stats
    Implemented. The system tracks execution duration for each job, logging completion time in milliseconds. Worker heartbeats are tracked with started_at and last_heartbeat timestamps. Job counts by state are available through the status command and dashboard. Worker information including IDs and heartbeat times is displayed in both CLI and web dashboard.

    Web Dashboard for Monitoring
    Implemented. A minimal web dashboard is available at http://localhost:3000. It displays job counts by state, active worker information, and recent jobs. The dashboard auto-refreshes every 2 seconds to show current queue status. The dashboard is built with Express.js serving a static HTML interface with REST API endpoints for status, jobs, and DLQ operations.

    Job Timeout Handling
    Not implemented. Jobs run until completion or failure with no automatic timeout mechanism. There is no way to cancel a running job once it has been claimed by a worker.

Testing Instructions

    Basic Success Test
    Create a job file with id ok1, command echo Success, and max_retries 3. Run npm run dev enqueue with the file, then start a worker with count 1. Wait a few seconds and verify the job appears in completed state using npm run dev list --state completed.

    Retry and DLQ Test
    Create a job file with id fail1, command cmd /c exit 1, and max_retries 2. Set backoff-base to 2, enqueue the job, and start a worker. Wait approximately 10-12 seconds for retries to complete, then check the DLQ using npm run dev dlq list. The job should appear in the dead letter queue after exhausting retries.

    Multiple Workers Test
    Enqueue three quick jobs, then start three workers using npm run dev worker start --count 3. Verify concurrent processing using npm run dev status and npm run dev list. You should see jobs being processed concurrently by different workers.

    Invalid Command Test
    Create a job file with id invalid1, command this-command-does-not-exist, and max_retries 2. Enqueue the job and start a worker. Observe the worker logs showing retry attempts, then verify the job moves to DLQ using npm run dev dlq list.

    Persistence Test
    Enqueue a job using npm run dev enqueue .\persist1.json. Close all terminals without deleting the database files. Reopen and verify using npm run dev list. The job should still be present in the database.

    Scheduled Jobs Test
    Create a job file with id sched1, command echo Scheduled, and run_at set to a future ISO timestamp. Enqueue the job and verify it stays in pending until the scheduled time using npm run dev list --state pending.

    Priority Test
    Create three jobs with different priorities, for example priority 10, 5, and 1. Enqueue all three and start a worker. Higher priority jobs should be processed first.

    Graceful Shutdown Test
    Enqueue a long-running job and start a worker. Press Ctrl+C in the worker terminal. The worker should finish the current job before exiting. Verify in logs that graceful shutdown occurred.
