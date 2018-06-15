# Development Environment

Getting setup is easy, you'll need to have [node.js](https://nodejs.org/) installed,
then simply clone the repository and within the working directory run the following:

```
# You only need to run this the first time
sudo npm install -g yarn
yarn install

# Run this to start the development server and build system
npm run dev
```

If you're on linux, you can simply type `make` and it will do all this for you as well.

Once running, you can then navigate to [http://dev.beta.online-go.com:8080/](http://dev.beta.online-go.com:8080/)
which loads the interface from your local server that you just started with gulp, and 
connects to the beta server for testing.

## Getting Started
* Sign up for a [GitHub account](https://github.com/signup/free).
* Search the [issue tracker](https://github.com/online-go/online-go.com/issues) to see if the problem is already submitted or the requrest for an enhancement exists.
* Submit an issue if one does not exist.  Please include as much of the below information as possible:
  * A clear summary.
  * Operating System tested on.
  * Browser used when bug appeared (or multiple browsers if you have replicated the bug.)
  * Browser version.
  * Steps to reproduce the issue.
  * Any additional information that you might think is useful.

## How to Make Changes
1. [Fork the repository](https://help.github.com/articles/fork-a-repo/).
    * If you haven't done so, [set up git](https://help.github.com/articles/set-up-git/).
2. Clone the repository to your computer. (Found in step 2 of "keeping your fork synced" in the fork a repo help article.)
    * To ensure you track the latest updates, you will want to configure git to sync your fork with the original online-go repository. (See step 3 in the same article.)
3. [Create a branch](https://help.github.com/articles/creating-and-deleting-branches-within-your-repository/) on your local machine. Name it something that makes sense for your updates.
    * This could also be done from the [git bash command line](https://github.com/Kunena/Kunena-Forum/wiki/Create-a-new-branch-with-git-and-manage-branches).
    * If you used the first method, you will need to ensure you [pull down your project's remote branches](https://stackify.com/git-checkout-remote-branch/).
4. Make the desired changes in the code or documentation.
5. [Add, commit, and push](https://help.github.com/articles/adding-a-file-to-a-repository-using-the-command-line/) your changes to your forked repository.

## How to Submit Changes
1. Navigate to the branch you created in your forked repository on github.
2. Select [`New Pull Request`](https://help.github.com/articles/creating-a-pull-request/).
3. Write an appropriate title and comment for the proposed updates.
4. Create the pull request.

## Technologies Utilized
This project is largely built with Typescript and React. If you are unfamiliar with these, please take a few minutes to familiarize yourself.
* [React](https://reactjs.org/)
* [Typescript](https://www.typescriptlang.org/)