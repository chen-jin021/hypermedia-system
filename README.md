# Unit 3: Editable Nodes

## Setup

From the `unit3` directory, you should `cd` into either `server` or `client` and then run the following commands:

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

## Design Questions (10 pts)

This hypermedia system will be used for creating a pokemon directory such that pokemon pictures are linked to pokemon's detailed info (directory).

For the rich text editor, in addition to bold and italic, I also added strike, code and highlight. These are suitable for our use case as we could potentially highlight pokemon's skills. Additionally, we could strike through deprecated skills for a pokemon. We could also provide a code snippet that prints a particular pokemon's sound. For example, console.log("pika");

## Notable Design Choices

For the scaling design of the capstone/master requirement, I chose to do the scaling such that the scales are based on the original image width and height. Additionally, the free-form option is also available for users - user can drag the picture from the bottom right point to the demanded size. User can also insert the wanted width and height for the image.

## Deployed Backend URL

https://thawing-island-15534.herokuapp.com/

## Deployed Frontend URL

https://hypertext-rich-editor.web.app

## Capstone / Extra Credit

The capstone for scaled image dragging has been implemented as well. User can drag the scroll bar above the image to scale the image.

## Known Bugs

## Estimated Hours Taken

50hr
