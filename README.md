[![Run Status](https://api.shippable.com/projects/58b08461067893070065aab3/badge?branch=devel)](https://app.shippable.com/github/online-go/online-go.com/status/dashboard)

# Online-Go.com source code

This repository contains the source code for web client used by [Online-Go.com](https://online-go.com).

# Bugs, Suggestions, and Discussions

Online-Go.com has a very active community of Go players, however only a
relatively small portion of the community actively develops the code base and
regularly visits this github page and the issue tracker. As such:

* https://forums.online-go.com should be used to discuss any proposed functional changes or any new notable features, allowing non developers to chime in with their thoughts and ideas.
* https://ogs.uservoice.com/ should be used when it is desired to obtain a gauge on community interest for a feature or change
* The [github issue tracker](https://github.com/online-go/online-go.com/issues) should be used to track all bugs, minor "obvious" enhancements, and accepted major enhancements. Any enhancements (and ideally bugs) posted need to be articulated in a way that it is obvious what needs to be done, partial thoughts will be closed and should be moved back to the forums for futher discussion.


# Development Environment

Getting setup is easy, you'll need to have [node.js](https://nodejs.org/) installed,
then simply clone the repository and within the working directory run the following:

```
# You only need to run this the first time
npm install yarn
yarn install

# Run this to start the development server and build system
npm run dev
```

If you're on linux, you can simply type `make` and it will do all this for you as well.

Once running, you can then navigate to [http://dev.beta.online-go.com:8080/](http://dev.beta.online-go.com:8080/)
which loads the interface from your local server that you just started with gulp, and 
connects to the beta server for testing.
