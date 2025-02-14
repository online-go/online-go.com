# Development Environment Quick Start

If you're familiar with GitHub and want to dive into the code, all you'll need
is to have [Node.js](https://nodejs.org/) installed then clone the repository
or your fork with the `--recurse-submodules` flag and perform the following actions:

```
# First install the necessary dependencies
npx yarn install

# Next install `husky`, this provides pre-commit checks to ensure the code
# meets some basic guidelines
npx husky install

# Run this to start the development server and build system
npm run dev
```

If you're on Linux, you can simply type `make` and it will do all this for you as well.

If you're on Windows and need specific help getting tools installed and the repo cloned, see [Detailed Setup Steps](#detailed-setup-steps-windows-but-applicable-mostly-to-others) below.

(And ... those detailed steps may even be a useful pointer about how to get started under Linux/macOS: they're broadly applicable, even if details differ slightly.)

Once running, you can then navigate to [http://dev.beta.online-go.com:8080/](http://dev.beta.online-go.com:8080/)
which loads the interface from your local server that you just started with gulp, and
connects to the beta server for testing.

# Getting Started

To open issues or make code contributions you'll need to have a GitHub account, you can sign up for one for free here: https://github.com/signup/free

## Opening issues

-   Search the [issue tracker](https://github.com/online-go/online-go.com/issues) to see if the problem is already submitted or the request for an enhancement exists.
-   Submit an issue if one does not exist. Please include as much of the below information as possible:
    -   A clear summary.
    -   Operating System tested on.
    -   Browser used when bug appeared (or multiple browsers if you have replicated the bug).
    -   Browser version.
    -   Steps to reproduce the issue.
    -   Any additional information that you might think is useful.

## How to Make Changes

1. [Fork the repository](https://help.github.com/articles/fork-a-repo/).
    - If you haven't done so, [set up git](https://help.github.com/articles/set-up-git/).
2. Clone the repository to your computer. (Found in step 2 of "keeping your fork synced" in the fork a repo help article.)
    - To ensure you track the latest updates, you will want to configure git to sync your fork with the original online-go repository. (See step 3 in the same article.)
    - You may need to install [Git LFS](https://git-lfs.github.com/) if your clone doesn't complete.
3. [Create a branch](https://help.github.com/articles/creating-and-deleting-branches-within-your-repository/) on your local machine. Name it something that makes sense for your updates.
    - This could also be done from the [git bash command line](https://github.com/Kunena/Kunena-Forum/wiki/Create-a-new-branch-with-git-and-manage-branches).
    - If you used the first method, you will need to ensure you [pull down your project's remote branches](https://stackify.com/git-checkout-remote-branch/).
4. Make the desired changes in the code or documentation.
5. [Add, commit, and push](https://help.github.com/articles/adding-a-file-to-a-repository-using-the-command-line/) your changes to your forked repository.

## How to Submit Changes

1. Navigate to the branch you created in your forked repository on github.
2. Select [`New Pull Request`](https://help.github.com/articles/creating-a-pull-request/).
3. Write an appropriate title and comment for the proposed updates.
4. Create the pull request.

## Technologies Utilized

This project is largely built with TypeScript and React. If you are unfamiliar with these, please take a few minutes to familiarize yourself.

-   [React](https://reactjs.org/)
-   [TypeScript](https://www.typescriptlang.org/)

## Detailed Setup Steps (Windows, but applicable mostly to others)

0. Create a fork of [online-go.com](http://online-go.com/)

-   Have an account at [github.com](http://github.com/), login there
-   Go to [GitHub - online-go/online-go.com: Source code for the Online-Go.com web interface](https://github.com/online-go/online-go.com)
-   Press the “fork” button

1. Install VSCode

2. Install git from the windows installer: [Git - Downloading Package (git-scm.com)](https://git-scm.com/download/win).
   Choose all defaults _except_ "**Configuring Line Ending Conversions**".
   No matter what the description says, chose `checkout-as-is, commit-as-is` (the description makes it sound like you would not want this)
3. Download and run `nvm-setup.exe` from https://github.com/coreybutler/nvm-windows/releases
4. In a command window, run

`nvm install lts`

`npm install -g husky`

5. Open VSCode

-   Choose "clone git repository"
-   Chose "clone from github"
-   Allow it to log you into GitHub
-   Choose _your fork_ of online-go.com to clone
    -   **make sure it's your fork** - VSCode may offer the official repo at the top of the list, don't chose that one
-   Chose a local folder somewhere sensible to clone it into (definitely distinct from anything left over from before!)
-   Agree to install the recommended extensions
    (you definitely need these for OGS, they setup the editor for coding standards that are enforced, and provide linting while editing)

... you should now see a code explorer on the left pane of VSCode showing the OGS repo file structure (maybe you need to click on the top icon in the left pane to get this view).

... now you have online-go.com checked out, without silly CRLF problems!

You could poke around in `src/` if you are already curious

6. in a command window, cd to the folder that was created when you cloned the repo and do

`npm clean-install`

`npm run dev`

This should result in a bunch of packages being installed, then a server starting up and telling you it's running

Navigate to localhost:8080 in your browser and hopefully see your local checkout rendering the Beta server....

... and if that works, we have VSCode done and ready to edit something.

You can immediately edit something:

-   Click on the search magnifying glass top left pane of VSCode
-   Type `no games being played` into the search bar

It should show you where this string is in [ObserveGamesComponent.tsx](src/components/ObserveGamesComponent/ObserveGamesComponent.tsx).

-   click on that to be taken to that place in the code
-   Edit the string, save the file
-   See in the browser that string update on the "Watch" page that was open.

:tada: you made an edit to OGS UI.

7.  Commit your change (locally)

You will want to commit your changes regularly locally. To prepare for this you need to make a branch for them.

This is easiest done in VSCode - down the bottom left is a label telling you what branch you are in fact on now. It has the "source control" symbol (branchy thing) and the name of the branch. To make a branch and commit to it:

-   Click the branch label
-   "Create a branch"
-   Give it a name

Then

-   Click on the "source control" symbol in the left pane (select git actions)
-   Type a meaningful commit message in the obvious message entry place
-   click commit

Do the last three steps often :slight_smile:

8. Publish your change (to GitHub)

When your change is ready for incorporation into OGS:

-   Click "source control" in the left
-   Click "publish change"

**Note**: it might be saying "Sync" instead of "Publish" - this means that GitHub knows about your branch already from something you did previously, that's OK.

🎉 Now your code is available ready for a Pull Request into the main repo.
