# Create an E2E Test - Guide

Intended as an AI prompt, untested as that yet.

This guide provides step-by-step instructions for creating end-to-end (E2E) tests for the OGS web client.

## Inputs

The inputs are provided in prose/text by the user:

-   A description of the test scenario: what function or use case is to be tested
-   Optionally (if required in the test) the E2E_MODERATOR user password

## Outputs

-   A new e2e test file, `.ts`, in a suitable directory of the e2e folder structure, that implements the test
-   Updated Playwright spec file, `.spec.ts`, to include the test in the test suite

## Process

### Step 1: Understand the Feature to Test

Before writing any code, thoroughly understand what you're testing:

1. **Read the UI implementation code** - DO NOT guess how the UI works. Check the actual component files to understand:

    - What class names are used (e.g., `.private-chat-window.open` not `.PrivateChat`)
    - What button types exist (buttons vs links that look like buttons)
    - What state changes occur
    - What elements appear/disappear based on conditions

2. **Identify the user flow** - Map out the steps a user takes to complete the scenario

3. **Determine test prerequisites**:
    - Does the test need seeded users (moderators, users with special privileges)?
    - Does the test need newly created test users?
    - What initial state is required?

#### Understanding Seeded Users vs. Created Users

**When to use `prepareNewUser()` (Created Users)**:

-   For most test scenarios where you need regular users
-   When testing regular user functionality (registration, profiles, games, etc.)
-   When you need guaranteed unique usernames and clean state
-   When privileges aren't needed (just regular players)

**When to use Seeded Users**:
Seeded users are pre-created by the backend's `init_e2e` function and should ONLY be used when:

-   You need privileges that CANNOT be granted via API (full moderator powers, Community Moderator powers)
-   The test requires specific pre-existing data (games, reports, etc.) that would be complex to set up

**Available Seeded Users**:

-   `E2E_MODERATOR` - Full moderator with all moderator powers. Use this when you need:

    -   To suspend/restore user accounts
    -   To grant Community Moderator powers to other users
    -   Full moderator-level functionality
    -   Password: `process.env.E2E_MODERATOR_PASSWORD` (must be set as environment variable)

-   `E2E_CM_*` - Pre-seeded Community Moderators with specific powers. Each test that needs CMs should have its own set:
    -   Named with test-specific prefix (e.g., `E2E_CM_AA_V1` for "Ack Acknowledgement" test, voter 1)
    -   Used when testing Community Moderation voting/escalation workflows
    -   Password: `"test"` (standard for seeded CM accounts)

**Naming Convention for Seeded Users**:

-   Prefix identifies the test: `E2E_CM_[TEST_ABBREV]_[ROLE]`
-   Example: `E2E_CM_VSU_V1` = "Vote Suspend User" test, Voter 1
-   Each test should have its own seeded users (not shared between tests)

**Important Notes**:

-   Seeded users must be listed in test file header comments
-   Seeded CMs need unique IPv6 addresses like any other user
-   Use `setupSeededCM()` helper for Community Moderators
-   Use `loginAsUser(page, "E2E_MODERATOR", process.env.E2E_MODERATOR_PASSWORD)` for full moderator
-   Avoid seeding when `prepareNewUser()` + E2E_MODERATOR can achieve the same result

### Step 2: Research Existing Tests

Look at similar existing tests to understand patterns:

1. **Find similar tests** - Look in the appropriate directory (e.g., `moderation/`, `game/`, etc.)

2. **Review helper utilities** available in `helpers/`:

    - `user-utils.ts`: User creation, authentication, navigation, reporting
    - `matchers.ts`: Custom assertions like `expectOGSClickableByName`

3. **Note common patterns**:
    - Test structure and organization
    - How contexts and pages are managed
    - Error handling approaches
    - Cleanup procedures

### Step 3: Plan the Test Structure

Create a mental outline following this pattern:

```typescript
export const testFunctionName = async ({ browser }: { browser: Browser }) => {
    console.log("=== Test Name ===");

    // 1. Setup phase - Create users, contexts, login
    // 2. Precondition phase - Set up initial state
    // 3. Action phase - Perform the user actions being tested
    // 4. Assertion phase - Verify expected outcomes
    // 5. Cleanup phase - Close contexts and pages
};
```

### Step 4: Write the Test File

Create a new test file following these guidelines:

#### File Header

```typescript
/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * Test the [feature name] functionality
 *
 * This test verifies that:
 * 1. [First thing being tested]
 * 2. [Second thing being tested]
 * ...
 *
 * Uses E2E_MODERATOR from init_e2e data if needed for moderator functionality.
 * Requires E2E_MODERATOR_PASSWORD environment variable to be set if using moderator.
 *
 * If using seeded Community Moderators, list them here:
 * Uses init_e2e data:
 * - E2E_CM_[TEST]_[ROLE]: Description of what this user does in test
 * - E2E_CM_[TEST]_ACCUSED: User being reported (if applicable)
 * - "E2E CM [TEST] Game": Pre-seeded game (if applicable)
 */
```

#### Imports

```typescript
import { Browser, expect } from "@playwright/test";
import {
    newTestUsername,
    prepareNewUser,
    generateUniqueTestIPv6,
    loginAsUser,
    turnOffDynamicHelp,
    goToUsersProfile,
    setupSeededCM, // For Community Moderator seeded users
    // ... other helpers as needed
} from "../helpers/user-utils";
import { expectOGSClickableByName } from "../helpers/matchers";
```

#### Test Implementation

Follow these critical rules:

**User Creation:**

```typescript
// For new test users:
const username = newTestUsername("RoleDesc"); // Max 20 chars!
const { userPage, userContext } = await prepareNewUser(browser, username, "test");

// For seeded full moderators (E2E_MODERATOR):
const moderatorPassword = process.env.E2E_MODERATOR_PASSWORD;
if (!moderatorPassword) {
    throw new Error("E2E_MODERATOR_PASSWORD environment variable must be set");
}
const uniqueIPv6 = generateUniqueTestIPv6();
const modContext = await browser.newContext({
    extraHTTPHeaders: { "X-Forwarded-For": uniqueIPv6 },
});
const modPage = await modContext.newPage();
await loginAsUser(modPage, "E2E_MODERATOR", moderatorPassword);
await turnOffDynamicHelp(modPage);

// For seeded Community Moderators (E2E_CM_*):
const { seededCMPage, seededCMContext } = await setupSeededCM(browser, "E2E_CM_TEST_V1");
// setupSeededCM automatically logs in, turns off dynamic help, and turns off moderation quota
```

**Finding and Clicking Buttons:**

```typescript
// ALWAYS use expectOGSClickableByName for buttons/links
const button = await expectOGSClickableByName(page, /Button Text/);
await button.click();

// DO NOT use:
// await page.getByRole("button", { name: /Text/ }).click(); // Not all "buttons" are of role "button" in OGS UI
```

**Input Validation:**

```typescript
// ALWAYS verify input was accepted before proceeding
const textarea = page.locator(".input-card textarea");
await textarea.fill("Message text");
await expect(textarea).toHaveValue("Message text"); // ✓ Verify it was accepted
console.log("Message entered ✓");

// Then check button is enabled
const submitButton = await expectOGSClickableByName(page, /Submit/);
await expect(submitButton).toBeEnabled(); // ✓ Verify it's enabled
```

**Console Logging:**

```typescript
// Add descriptive console logs for debugging:
console.log("=== Test Name ===");
console.log("Creating test user...");
console.log(`User created: ${username} ✓`);
console.log("Navigating to page...");
console.log("Page loaded ✓");
```

**Step Numbering:**

```typescript
// Number and describe each major step:
// 1. Create test user
// 2. Navigate to feature
// 3. Perform action
// 4. Verify result
```

**Cleanup:**

```typescript
// ALWAYS clean up contexts and pages at the end:
await userPage.close();
await userContext.close();
await modPage.close();
await modContext.close();

console.log("=== Test Complete ===");
console.log("✓ [Summary of what was tested]");
```

### Step 5: Critical Rules from AGENTS.md

These are mandatory requirements:

1. **Check UI Code** - NEVER guess how UI elements work. Read the actual component code to find:

    - Correct class names
    - Element structure
    - State transitions

2. **Validate Inputs** - Always verify input was accepted before continuing

3. **Use Helper Functions**:

    - `expectOGSClickableByName()` for ALL buttons/links
    - `prepareNewUser()` for creating test users
    - `newTestUsername()` for unique usernames (max 20 characters!)
    - `generateUniqueTestIPv6()` for unique IP addresses

4. **Username Constraints** - The argument to `newTestUsername()` MUST be 20 characters or less (10 chars are used for uniquification: e2e prefix, underscore, timestamp, worker ID)

5. **Avoid Direct API Calls** - Drive the system as a user does through the UI

6. **Reports Testing** - Wrap report actions in `withIncidentIndicatorLock` and check no reports are open at start

7. **User Privileges**:

    - Use seeded users ONLY when you need privileges that cannot be granted via API:
        - `E2E_MODERATOR`: For full moderator powers (suspension, restoration, granting CM powers)
        - `E2E_CM_*`: For Community Moderator powers (voting on reports, escalation)
    - Use `prepareNewUser()` for all regular test users (the vast majority of cases)
    - Each test needing seeded CMs should have its own uniquely named set (not shared between tests)

8. **English Testing** - We test in English only; no need to worry about `pgettext`

9. **Wait for Specific Elements** - Wait for specific UI elements to be visible, not `waitForLoadState("networkidle")` which is unreliable. Example: `await expect(page.locator(".Game")).toBeVisible({ timeout: 15000 })`

### Step 6: Register the Test

Add the test to the appropriate `.spec.ts` file:

```typescript
// In moderation/moderation.spec.ts (example):
import { myNewTest } from "./my-new-test";

ogsTest.describe("@Mod Moderation Tests", () => {
    // ... existing tests ...
    ogsTest("Description of what test does", myNewTest);
});
```

### Step 7: Lint and Type Check

Before considering the test complete:

```bash
npm run type-check  # Verify TypeScript types
npx eslint e2e-tests/path/to/test.ts  # Verify linting
```

Fix any errors before proceeding.

### Step 8: Run the Test

**IMPORTANT**: You must test your test before considering the task complete. This ensures it works correctly and doesn't break the test suite.

#### Prerequisites

1. **Set up environment variables** (if your test uses moderator functionality):

    ```bash
    export E2E_MODERATOR_PASSWORD="your-moderator-password"
    ```

    For persistent setup, add to your shell configuration file (`~/.bashrc`, `~/.zshrc`, etc.):

    ```bash
    echo 'export E2E_MODERATOR_PASSWORD="your-moderator-password"' >> ~/.bashrc
    source ~/.bashrc
    ```

2. **Ensure dev server is running** (in a separate terminal):

    ```bash
    yarn dev
    # or
    npm run dev
    ```

    Wait for the server to be ready (typically at `http://dev.beta.online-go.com:8080/`)

#### Running Your Test

**Run only your specific test** to verify it works. Other tests in the suite may fail for unrelated reasons, so focus on testing what you wrote:

```bash
# Run your specific test file (RECOMMENDED)
yarn test:e2e e2e-tests/moderation/mod-system-pm-button.ts

# Run with UI mode for visual debugging
yarn test:e2e:ui e2e-tests/moderation/mod-system-pm-button.ts

# Run in debug mode to step through execution
yarn test:e2e:debug e2e-tests/moderation/mod-system-pm-button.ts
```

**Do NOT run all tests** - other tests may fail for reasons unrelated to your changes. The CI system will run the full test suite.

#### Verify Test Results

1. **Check the output** - All steps should show ✓ marks and no errors
2. **Review the console logs** - Ensure your descriptive console.log statements appear
3. **Check for failures** - If the test fails:
    - Read the error message carefully
    - Check which step failed
    - Verify you followed all the critical rules
    - Re-read the UI component code to confirm selectors
    - Add more waits if needed for async operations

#### Common Test Execution Issues

**Issue**: `E2E_MODERATOR_PASSWORD environment variable must be set`

**Solution**: Set the environment variable as shown in Prerequisites above.

---

**Issue**: Test times out or hangs

**Solution**:

-   Ensure dev server is running (`yarn dev`)
-   Check network connectivity
-   Increase timeout values if needed
-   Verify page navigation by waiting for specific elements to be visible

---

**Issue**: Element not found errors

**Solution**:

-   Double-check you read the UI component code for correct selectors
-   Verify the element should exist at that point in the test flow
-   Add waits before looking for elements
-   Check if element is conditionally rendered based on state

---

**Issue**: Button not clickable

**Solution**:

-   Verify input was entered first (buttons often disabled without input)
-   Check button text exactly matches (case-sensitive, regex patterns)
-   Ensure page has fully loaded before clicking

#### After Successful Test Run

Once your test passes locally:

1. **Run it multiple times** to ensure it's not flaky:

    ```bash
    # Run the same test 3 times
    yarn test:e2e e2e-tests/moderation/mod-system-pm-button.ts --repeat-each=3
    ```

2. **Verify cleanup** - Ensure your test properly closes all contexts and pages (check the code at the end of your test)

3. **Document any special requirements** - Note in your test comments if it requires specific environment setup

**Note**: You don't need to verify it doesn't interfere with other tests. The CI system will handle running the full test suite. Other tests may fail locally for unrelated reasons (missing data, environment differences, etc.).

## Common Patterns

### Pattern: Using Seeded Community Moderators for Voting

```typescript
// Create a reporter (regular user)
const { userPage: reporterPage } = await prepareNewUser(
    browser,
    newTestUsername("Reporter"),
    "test",
);

// Report a seeded user who has pre-existing game data
await goToUsersFinishedGame(reporterPage, "E2E_CM_TEST_ACCUSED", "E2E CM TEST Game");
await reportUser(reporterPage, "E2E_CM_TEST_ACCUSED", "ai_use", "Detailed reason here");

// Set up multiple seeded CMs to vote
const cmVoters = ["E2E_CM_TEST_V1", "E2E_CM_TEST_V2", "E2E_CM_TEST_V3"];
const cmContexts = [];

for (const cmUser of cmVoters) {
    const { seededCMPage, seededCMContext } = await setupSeededCM(browser, cmUser);
    cmContexts.push({ cmPage: seededCMPage, cmContext: seededCMContext });

    // Navigate to Reports Center and vote
    const indicator = await assertIncidentReportIndicatorActive(seededCMPage, 1);
    await indicator.click();

    // Perform voting action...
    await seededCMPage.locator('.action-selector input[type="radio"]').nth(1).click();
    const voteButton = await expectOGSClickableByName(seededCMPage, /Vote$/);
    await voteButton.click();
}

// Clean up
for (const { cmPage, cmContext } of cmContexts) {
    await cmPage.close();
    await cmContext.close();
}
```

### Pattern: Testing Button Visibility Based on State

```typescript
// Enter message first to enable buttons
await textarea.fill("Message text");
await expect(textarea).toHaveValue("Message text");

// Now check buttons are enabled
const button1 = await expectOGSClickableByName(page, /Button 1/);
await expect(button1).toBeVisible();
await expect(button1).toBeEnabled();

const button2 = await expectOGSClickableByName(page, /Button 2/);
await expect(button2).toBeVisible();
await expect(button2).toBeEnabled();
```

### Pattern: Checking Mutually Exclusive UI Elements

```typescript
// When condition is true, certain elements should appear
if (condition) {
    await expect(page.locator(".element-a")).toBeVisible();
    await expect(page.locator(".element-b")).not.toBeVisible();
} else {
    await expect(page.locator(".element-a")).not.toBeVisible();
    await expect(page.locator(".element-b")).toBeVisible();
}
```

### Pattern: Finding Correct Selectors

```typescript
// Read the component code first!
// Example: PrivateChat.tsx line 147:
//   this.dom.classList.add("private-chat-window", "open");
// So use:
const privateChat = page.locator(".private-chat-window.open");

// NOT:
// const privateChat = page.locator(".PrivateChat"); // ✗ Wrong guess
```

### Pattern: Handling Async Operations

```typescript
// Click action button
await actionButton.click();
console.log("Action triggered ✓");

// Wait for backend to process
await page.waitForTimeout(1000);

// Reload to get fresh state
await page.reload();

// Verify new state - wait for specific element instead of networkidle
await expect(page.getByText(/Expected Result/)).toBeVisible({ timeout: 15000 });
```

## Troubleshooting

### Buttons Not Clickable

**Problem**: `expectOGSClickableByName` fails or button doesn't respond

**Solutions**:

1. Check if message/input is required first (buttons often disabled without input)
2. Verify you're using the exact button text (check the component code)
3. Wait for the specific element you need to be visible (avoid `networkidle` - it's unreliable)
4. Check if button is hidden by CSS classes based on state

### Wrong Selector

**Problem**: Element not found or test selects wrong element

**Solutions**:

1. Read the component code to find actual class names
2. Use browser dev tools to inspect the live element
3. Be specific with selectors (e.g., `.private-chat-window.open` not just `.open`)
4. Use `.first()` or `.last()` if multiple elements match

### Test Flakiness

**Problem**: Test passes sometimes but fails other times

**Solutions**:

1. Add appropriate waits (`waitForLoadState`, `waitForTimeout`)
2. Verify inputs were accepted before proceeding
3. Check for race conditions (async operations finishing out of order)
4. Ensure unique test data (usernames, IPs) to avoid conflicts

## Example: Complete Test File

See `e2e-tests/moderation/mod-system-pm-button.ts` for a complete example following all these patterns.

## Resources

-   `CLAUDE.md`: Additional important notes for AI agents
-   `README.md`: General E2E testing documentation
-   `helpers/user-utils.ts`: User management utilities
-   `helpers/matchers.ts`: Custom matchers and assertions
