This is information for Agents to take into account when working on e2e tests.

(Also useful for humans to know :) )

When creating e2e tests, note that:

-   When writing tests that use UI elements to achieve outcomes, always check the UI code of of the elements you're using to make sure you are using them correctly.
    -- DO NOT guess how the UI works when developing tests, check how it works in the code.

-   When entering inputs, include a check to make sure the input was accepted before proceeding to the next action.

-   Any actions involving looking at reports should be wrapped in `withIncidentIndicatorLock`, and should check that there are no open reports at the start, so that debug of "already open reports" is easy.

(The problem is that tests can fail if the wrong number of reports is open, due to previously failed tests)

-   Any actions or assertions using buttons need to use `expectOGSClickable` to find the button, because OGS buttons are implemented in a range of ways.

-   Users (user data) can be created either by seeding it or using `prepareNewUser`.

-   Seeded data is to be used when we need users with privileges that can only be given by full moderators. We do not have full moderator powers in the test suite.

-   `prepareNewUser` creates a new user with suitable settings and guaranteed unique name.

-   The string argument of `newTestUsername` must be less than 21 characters. This is because OGS username limit is 20 chars and 8 are used for uniquification. It's helpful to have characters identifying which test and which role

-   Avoid direct API calls - the intent of e2e testing is to test by driving the system as a user does.

-   We do all our testing in English, we don't have to worry about pgettext

-   Community Moderation is controlled by MODERATOR_POWERS. This is different to "full moderation", which is controlled by is_moderator.
