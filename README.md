# Unit 4: Additional Hypertext Features

## Setup

From the `unit4` directory, you should `cd` into either `server` or `client` and then run the following commands:

### `yarn install`

Installs all of `MyHypermedia`'s dependencies.

### `touch .env`

Creates a .env file for you to set up.

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

## Testing

### `yarn test`

Launches the test runner in the interactive watch mode.

## Design Questions

This hypermedia system will be used for creating a pokemon directory such that pokemon pictures are linked to pokemon's detailed info (directory).

For the rich text editor, in addition to bold and italic, I also added strike, code and highlight. These are suitable for our use case as we could potentially highlight pokemon's skills. Additionally, we could strike through deprecated skills for a pokemon. We could also provide a code snippet that prints a particular pokemon's sound. For example, console.log("pika");

## Notable Design Choices

The Temporal Media feature supports both video and audio uploads - note that it supports direct video and audio URL uploads (URLs that ends with .mp3 and .mp4).

## Deployed Backend URL

https://peaceful-tundra-97528.herokuapp.com/ | https://git.heroku.com/peaceful-tundra-97528.git

[This is for previous assignment 3]
https://thawing-island-15534.herokuapp.com/

## Deployed Frontend URL

[Same as previous assignment 3]
https://hypertext-rich-editor.web.app

## Capstone / Extra Credit

The capstone here is to implement two additional features - Temporal Media and Search.

Search: the default search behavior searches in the global environent, ignoring node types, etc. It will return results such that the node's title or content contains user specified keywords and the results are ordered in chronological order. Additionally, users will be able to filter the result using by node types.

The Temporal Media feature supports both video and audio uploads - note that it supports direct video and audio URL uploads (URLs that ends with .mp3 and .mp4). From there, this hypertext system also supports user's to create link where users can make text annotations to the video or link this part of the video to another text/image/etc. node.

## Known Bugs

## Estimated Hours Taken

60hr
