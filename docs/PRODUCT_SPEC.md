# Product Spec — World Cup 2026 Pick'em App

## Product goal

Build a mobile-first web app where friends can predict the FIFA World Cup 2026 results, compete in a ranking, and track points automatically.

## MVP 1 scope

The first version must include:

- Supabase authentication.
- User profile creation.
- Protected dashboard.
- Match calendar using mock data.
- Group prediction flow for groups A-L.
- Group scoring.
- Top 10 ranking.
- User points breakdown.
- Mock sync endpoint.
- Vercel-ready deployment.
- GitHub Actions workflow prepared.

## Not included in MVP 1

The following are not required in the first implementation:

- Real external football API.
- Scraper provider.
- Full dynamic knockout bracket logic.
- Push notifications.
- Admin panel.
- Payment system.
- Social features.

## Product principles

- Mobile-first.
- Dark visual style.
- Sports dashboard look.
- Simple interactions.
- Clear prediction status.
- Clear ranking.
- Frontend reads normalized data only from Supabase.
- External data must always be normalized before being used by the frontend.

## Main user flows

### Authentication

1. User visits the app.
2. User signs up or logs in.
3. If profile does not exist, it is created.
4. User is redirected to dashboard.

### Group predictions

1. User opens predictions page.
2. User sees groups A-L.
3. User orders the 4 teams in each group.
4. User saves predictions.
5. App validates:
   - exactly 4 teams;
   - no duplicates;
   - positions 1, 2, 3, 4;
   - phase is not locked.

### Ranking

1. User opens ranking page.
2. User sees Top 10.
3. User sees own ranking position.
4. User can see points by phase.

### Calendar

1. User opens calendar page.
2. User sees matches.
3. User can filter by phase and group.
4. Match cards show date, teams, result and status.

## MVP acceptance

The app is accepted when:

- A user can sign up.
- A user can log in.
- A user can see dashboard.
- A user can see calendar.
- A user can save group predictions.
- Mock results can be synced.
- Points can be recalculated.
- Ranking updates correctly.
- App builds without TypeScript errors.
- No private keys are exposed in the client.
