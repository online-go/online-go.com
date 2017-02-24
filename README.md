# Online-Go.com source code

This repository contains the source code for web client used by Online-Go.com.

# Development Environment

Getting setup is easy, you'll need to have [node.js](https://nodejs.org/) installed,
then simply clone the repository and within the working directory run the following:

```
# You only need to run this the first time
npm install

# Run this to start the development server and build system
node_modules/.bin/gulp
```

If you're on linux, you can simply type `make` and it will do all this for you as well.

Once running, you can then navigate to [http://dev.beta.online-go.com:8080/](http://dev.beta.online-go.com:8080/)
which loads the interface from your local server that you just started with gulp, and 
connects to the beta server for testing.
