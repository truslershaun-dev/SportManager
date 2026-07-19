# Sport Manager Application

An early-stage web-based sports management system for organizing matches, managing teams, assigning umpires, and handling game configurations.

This prototype covers match scheduling, team registration, official/umpire management, and sport configuration. It is a strong foundation for the full OfficialOps vision, but the platform currently needs dedicated official availability, qualification, payment, and AI assignment workflows to satisfy the complete requirements.

## Features

### 1. **Authentication**
- User login with email and password
- User registration for players and team managers
- Secure session management with localStorage
- Google Sign-In integration (optional)

### 2. **Dashboard**
- **For Players**: Shows next 4 upcoming matches they are assigned to
- **For Managers**: Shows next 4 upcoming matches for their sport with quick statistics
  - Total matches
  - Upcoming matches count
  - Registered teams
  - Available umpires

### 3. **Matches Management**
- **Calendar View**: Visual calendar showing all matches with match details
- **List View**: Detailed list of all matches with filters
- Create new matches with:
  - Team details (home/away teams)
  - Date, time, and location
  - Umpire assignment from available pool
- View match details including:
  - Teams and scores
  - Match status (upcoming, ongoing, completed)
  - Assigned umpires and match officials
  - Option to assign umpires if none are assigned
- Search and filter matches by:
  - Match status (upcoming, completed)
  - Sport type

### 4. **Umpires Management**
- View all umpire profiles with complete information
- Advanced filtering by:
  - Rank (Professional, Advanced, Beginner)
  - Age range
  - Location
  - Region
  - Availability (specific days)
  - Time preferences (Morning, Afternoon, Evening)
  - Sport specialization
- Add new umpires with:
  - Personal information (name, email, phone, age)
  - Rank and location details
  - Sports expertise
  - Availability preferences
  - Time preferences
- View detailed umpire profiles showing:
  - Location and coverage area
  - Sports expertise
  - Availability schedule
  - Preferred match times
  - Rating

### 5. **Team Registration**
- Register new teams with:
  - Team name and sport
  - Location
  - Manager details (name, email, phone)
  - Number of players
  - Team description
- View all registered teams
- Search and filter teams by name, location, or manager
- Filter by sport
- View detailed team information

### 6. **Game Setup**
- Configure game rules for different sports
- Settings include:
  - Team size
  - Game duration
  - Number of periods/halves
  - Number of substitutes allowed
  - Required number of umpires
  - Custom rules
  - Scoring system (win/draw/loss points)
- Edit and manage game configurations

### 7. **Sport Registration**
- Register new sports with configurations
- Define for each sport:
  - Category (Team, Individual, Mixed)
  - Standard team size
  - Game duration
  - Required umpires
  - Scoring system
  - Age restrictions
  - Available regions
- Manage sport-specific rules

### 8. **Profile Management**
- View and edit personal information
- **For Players**:
  - Team assignment
  - Sports playing
  - Jersey number
  - Position/role
- **For Managers**:
  - Team managing
  - Sports managing
  - Years of experience
  - Bio/biography
- Notification preferences
- Change password
- Account deletion

## Project Structure

```
SportManager/
├── index.html                 # Login page
├── dashboard.html             # Main dashboard
├── matches.html               # Matches management
├── umpires.html               # Umpires management
├── team-registration.html     # Team registration
├── game-setup.html            # Game configuration
├── sport-registration.html    # Sport registration
├── profile.html               # User profile
│
├── css/
│   ├── styles.css             # Global styles
│   ├── dashboard.css          # Dashboard styles
│   ├── matches.css            # Matches page styles
│   └── umpires.css            # Umpires page styles
│
├── js/
│   ├── auth.js                # Authentication logic
│   ├── google-sheets-api.js   # Google Sheets API integration
│   ├── utils.js               # Utility functions
│   ├── dashboard.js           # Dashboard logic
│   ├── matches.js             # Matches logic
│   ├── umpires.js             # Umpires logic
│   ├── team-registration.js   # Team registration logic
│   ├── game-setup.js          # Game setup logic
│   ├── sport-registration.js  # Sport registration logic
│   └── profile.js             # Profile logic
│
├── config.js                  # Application configuration
└── README.md                  # This file
```

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google account (for Google Sheets integration - optional)
- Google Sheets with proper structure

### Setup Instructions

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd SportManager
   ```

2. **Google Sheets Setup (Optional but Recommended)**
   - Create a Google Sheet with the following sheet tabs:
     - Users
     - Teams
     - Matches
     - Umpires
     - Sports
     - GameSetups
     - PlayerAssignments
     - UmpireAssignments

3. **Configure Google Sheets API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Sheets API
   - Create credentials (API Key)
   - Update `config.js` with your:
     - `GOOGLE_SHEETS_API_KEY`
     - `GOOGLE_SHEETS_ID`
     - `GOOGLE_OAUTH_CLIENT_ID` (for OAuth)

4. **Local Storage Setup**
   - The app uses localStorage as a fallback
   - No additional setup needed for basic functionality
   - Data persists in browser's local storage

5. **Open the Application**
   - Open `index.html` in your web browser
   - Or serve with a local server:
     ```bash
     python -m http.server 8000
     # or
     npx http-server
     ```
   - Navigate to `http://localhost:8000`

## Linking the New Database to the Pages

Follow these steps to connect the Cloudflare D1 database to the website pages.

1. Create the database in Cloudflare D1.
   - Open the Cloudflare dashboard.
   - Go to D1 and create a new database.
   - Name it `sportsmanager_db`.

2. Create the tables.
   - Open the SQL editor for the new database.
   - Paste the SQL from [cloudflare-d1-schema.md](cloudflare-d1-schema.md).
   - Run the script to create all tables.

3. Configure the Worker.
   - Open [cloudflare-worker/wrangler.toml](cloudflare-worker/wrangler.toml).
   - Make sure the D1 binding is present:
     - `binding = "D1"`
     - `database_name = "sportsmanager_db"`

4. Deploy the Worker.
   - From the [cloudflare-worker](cloudflare-worker) folder, install dependencies:
     ```bash
     npm install
     ```
   - Sign in to Cloudflare:
     ```bash
     npm run login
     ```
   - Upload/deploy the Worker:
     ```bash
     npm run deploy
     ```
   - If you prefer the raw Wrangler command, run:
     ```bash
     npx wrangler deploy
     ```

5. **(Optional) Set up automatic GitHub deployment.**
   - Create a Cloudflare API token:
     - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → My Profile → API Tokens.
     - Create a token with Worker permissions (Edit Cloudflare Workers, Read Account Settings).
   - Add secrets to GitHub:
     - Go to your GitHub repo → Settings → Secrets and variables → Actions.
     - Add `CLOUDFLARE_API_TOKEN` with your Cloudflare API token.
     - Add `CLOUDFLARE_ACCOUNT_ID` with your Cloudflare Account ID (found in the dashboard).
   - The workflow [.github/workflows/deploy-worker.yml](.github/workflows/deploy-worker.yml) will now automatically deploy on every push to `main` or `master`.

6. Set the API URL in the frontend.
   - Open [config.js](config.js).
   - Set `CLOUDFLARE_API_URL` to the deployed Worker URL.

7. Test the connection.
   - Open the site and log in.
   - Confirm the auth flow, owner portal, and data reads/writes work.

8. Verify the pages are using the same backend.
   - Ensure pages such as [dashboard.html](dashboard.html), [matches.html](matches.html), [profile.html](profile.html), and [owner.html](owner.html) are loading data through the same API endpoint.

## Adding Pages Using GitHub

Use these steps to add a new page to the project and publish it through GitHub.

1. Create the new HTML file.
   - Add the page to the project root, for example `new-page.html`.
   - Include the shared layout, navigation, and styles.

2. Link the page in the navigation.
   - Update the sidebar links in the relevant HTML files.
   - Add a link to the new page where needed.

3. Create the page logic if needed.
   - Add a matching JavaScript file in [js](js) if the page needs custom behavior.
   - Connect it from the HTML file with a `<script>` tag.

4. Commit the changes.
   - Run:
     ```bash
     git add .
     git commit -m "Add new page"
     ```

5. Push to GitHub.
   - Run:
     ```bash
     git push origin main
     ```

6. Publish through GitHub Pages.
   - Open the GitHub repository.
   - Go to Settings → Pages.
   - Select the branch to publish, usually `main`.
   - Save the settings.

7. Verify the published page.
   - Open the GitHub Pages URL.
   - Confirm the new page appears and works correctly.

## Usage

### First Time Setup

1. **Register an Account**
   - Click "Sign up here" on the login page
   - Choose user type (Player or Team Manager)
   - Create your account

2. **Login**
   - Enter your email and password
   - Select your user type
   - Click "Login"

### Creating Matches (Team Managers)

1. Go to **Matches** tab
2. Click **+ Create Match**
3. Fill in:
   - Sport
   - Date and Time
   - Location
   - Home and Away teams
   - Select umpires from the available list
4. Click **Create Match**

### Managing Umpires

1. Go to **Umpires** tab
2. Use filters to find available umpires
3. Click **+ Add Umpire** to register a new umpire
4. View umpire profiles for detailed information

### Registering Teams

1. Go to **Team Registration** tab
2. Click **+ Register New Team**
3. Fill in team details
4. Click **Register Team**

### Setting Up Games

1. Go to **Game Setup** tab
2. Click **+ New Game Setup**
3. Configure game rules
4. Click **Create**

### Managing Sports

1. Go to **Sport Registration** tab
2. Click **+ Register New Sport**
3. Define sport-specific rules
4. Click **Register Sport**

### Managing Profile

1. Go to **Profile** tab
2. Click **Edit Profile** to make changes
3. Update your information
4. Change password if needed
5. View your match statistics

## Data Persistence

The application uses two methods for data persistence:

1. **Google Sheets** (Primary - if configured)
   - Real-time cloud storage
   - Shared access across devices
   - Requires API configuration

2. **Local Storage** (Fallback)
   - Browser-based storage
   - No configuration needed
   - Data persists until browser cache is cleared

## API Reference

### Google Sheets API Methods

```javascript
// Read data from a sheet
await sheetsAPI.readSheet(sheetName, range);

// Write data to a sheet
await sheetsAPI.writeSheet(sheetName, range, values);

// Append data to a sheet
await sheetsAPI.appendSheet(sheetName, values);
```

### Authentication Methods

```javascript
// Register new user
await authManager.register(email, password, name, userType);

// Login user
await authManager.login(email, password, userType);

// Logout
authManager.logout();

// Update profile
await authManager.updateProfile(userId, updates);

// Change password
await authManager.changePassword(userId, oldPassword, newPassword);
```

### Utility Functions

```javascript
// Formatting
formatDate(date);
formatTime(time);
formatDateTime(datetime);
getCurrentDate();
getCurrentTime();

// Validation
validateEmail(email);
validatePassword(password);

// UI
showToast(message, type, duration);
openModal(modalId);
closeModal(modalId);
showLoading();
hideLoading();

// Data
generateId();
getFormData(formId);
```

## Configuration

Edit `config.js` to customize:

- API keys and credentials
- Sheet names
- User types
- Match statuses
- Umpire ranks
- Time slots
- Sports categories
- Cache duration
- Pagination settings

## Troubleshooting

### Issue: "Google Sheets API configuration incomplete"
**Solution**: Set up Google Sheets API credentials in `config.js`

### Issue: Data not saving
**Solution**: Check browser's localStorage settings or configure Google Sheets API

### Issue: Matches not showing in calendar
**Solution**: Ensure matches are in the correct date format (YYYY-MM-DD)

### Issue: Umpires not appearing in filters
**Solution**: Check that umpire data includes required fields (rank, location, region, etc.)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Current Platform Coverage

This project currently supports a core sports management experience focused on match scheduling, team registration, umpire/official registration, sport configuration, and user profile management.

### Included today
- Match creation, calendar view, list view, and match details
- Umpire/official registration and filtering by rank, location, region, availability, and sport expertise
- Team registration and sport-specific configuration
- Profile editing and basic statistics for users and managers
- Sport registration and game setup for new sport types
- Google Sheets and localStorage persistence options

### Missing or partially supported relative to the requested platform
- Official availability management: weekly availability, blocked dates, and availability-based assignments
- Qualification structures per sport and assignment-level qualification requirements
- Match history, performance records, assessments, and development tracking
- Payment management: fees, travel allowances, outstanding balances, payment schedules, and payment status tracking
- Assignment workflows: self-assignment, manual assignment, AI-assisted recommendations, neutral assignor appointment, and approval workflows
- Tournament and league fixture management: full season uploads, tournaments, multi-match scheduling, and assignment generation
- Multi-sport official management: multiple sports per official, sport-specific qualification levels, and configurable assignment/payment models
- Notifications for assignment creation, fixture changes, approvals, withdrawals, and payment updates

## Feature Gap Summary

To align this project with the requested OfficialOps platform, the following areas should be added or expanded:

- **Official Management**: add profiles with contact info, qualifications, multiple sports, availability calendar, match history, performance records, payment history, and outstanding payment tracking.
- **Availability Management**: add weekly availability input, unavailable date blocks, and use availability during assignment recommendations.
- **Fixture & Tournament Management**: add season fixture uploads, tournament creation, league competition creation, and editable fixtures when schedules change.
- **Assignment Management**: add self-assignment, manual appointment, AI-assisted recommendations, neutral assignor flow, and configurable approval requirements.
- **Performance Tracking**: add match assessments, attendance/reliability tracking, performance trends, and development support.
- **Payment Management**: add match fees, tournament fees, travel allowances, outstanding payment dashboards, and scheduled payment generation.
- **Notifications**: add automated notifications for assignments, changes, approvals, withdrawals, and payment updates.
- **Multi-Sport Support**: add administrator tools for creating new sports, defining qualification levels, configuring officiating requirements, and setting payment rules.

## Limitations

- localStorage has a ~5-10MB limit per domain
- Google Sheets API has usage quotas
- Real-time sync requires page refresh without Google Sheets API

## Future Enhancements

- Email notifications for match updates
- SMS alerts for umpires
- Mobile app version
- Advanced analytics and reporting
- Player statistics tracking
- Team standings and rankings
- Payment integration for registrations
- Advanced user roles and permissions
- API documentation for third-party integrations

## Support

For issues, questions, or suggestions, please contact the development team or create an issue in the repository.

## License

This project is provided as-is for educational and organizational purposes.

## Credits

Created with ♥️ for sports management excellence.

---

**Last Updated**: June 2026
**Version**: 1.0.0
