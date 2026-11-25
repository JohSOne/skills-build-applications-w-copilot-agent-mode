# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Use React Router routes and the shared `getJson` API client. Keep loading, empty, success, and error states in each route component and expose them through semantic, accessible markup.
- Logic tier decision: Keep Express routes thin and put validation and database behavior in explicit service functions. Return deliberate 400 or 404 responses for invalid input or missing records instead of allowing Mongoose cast errors to become 500 responses.
- Data tier decision: Add Mongoose `required` validation and meaningful defaults to the User, Team, Activity, and Workout schemas. Preserve application data and make seed updates idempotent with stable upserts.
- Activity tracking approach: Validate ObjectIds and require the referenced user and team to exist. Store the submitted references, type, and minutes, then compute points and set `occurredAt` in the service.
- Team management approach: Require `name` and `mascot`, default `members` to an empty array, and create the team with submitted valid member references.  
- Leaderboard approach: Aggregate activity points by team, sort descending, and add a 1-based rank to each team result.
- Workout suggestions approach: Find the user by decoded email, determine the user's goal or strongest recent activity focus, and return matching workouts first with a reason.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`; baseline is red because required fields and seed behavior are incomplete (4 of 5 tests fail, with the seed test already passing).
- API command: `npm run test:api --prefix octofit-tracker/backend`; baseline is red because activity and team creation return 501, leaderboard returns no entries, and workout suggestions do not match the user's focus (4 of 4 tests fail).
- Frontend command: `npm test --prefix octofit-tracker/frontend`; baseline is red because the route UI and API-backed states are not implemented (15 of 15 tests fail).
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
