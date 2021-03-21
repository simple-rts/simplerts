
# Log

To have intellisense in VSCode for p5 in global mode, I did this: https://stackoverflow.com/questions/54581512/make-vscode-understand-p5js

# References

[p5 reference API](https://p5js.org/reference/)

[p5 examples](https://p5js.org/examples/)

[natureofcode book](https://natureofcode.com/book/chapter-6-autonomous-agents/)

[type checking js with JSDoc](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)

[javascript in VSCode](https://code.visualstudio.com/Docs/languages/javascript)

[working with javascript (VSCode)](https://code.visualstudio.com/docs/nodejs/working-with-javascript#_type-checking-javascript)

[VSCode debugger for chrome](https://marketplace.visualstudio.com/items?itemName=msjsdiag.debugger-for-chrome)

[game development by mozilla](https://developer.mozilla.org/en-US/docs/Games)

[html5 game devs forum](https://www.html5gamedevs.com/)

# Debug

You can open the `index.html` file in a brower and start playing.

You can stop/restart the simulation with the in-game buttons.

To debug the application with VSCode and Chrome, set breakpoints in the javascript in VSCode, go to Run and Debug, and launch the `Launch index.html in chrome` configuration. This will run a chrome instance with the page inside. The debugger in VSCode will stop when reaching a breakpoint.

Right click and set conditions on breakpoints to have conditional breakpoints.

Open the console in VSCode and select `DEBUG CONSOLE` to have an interactive console that you can use while debugging (to inspect and run javascript code interactively while the execution is stuck on a frame).

# Plan

[x] Capturable nodes which become buildings

[x] move id out from unit (it's just the index in the global entities)

[x] enums as statics

[x] p5js locally for intellisense

[x] generic entities

[x] Buildings can be destroyed

[x] Node is freed when building is destroyed

[x] cleanup and upload to git

[ ] borders (collisions/ridigBodies in general?)

[x] formations

[ ] kill/damage only if you come from behind or come to a still target?

[ ] Grid for navigation

[ ] Spatial division for fast neighbors querying

[ ] spacing between units in a group (no overlap)

[ ] units cap

[ ] win/lose conditions

[ ] enemy AI

[ ] UI for units' production in buildings

[ ] add code to modulate frame rate

[ ] HUD

[ ] single click selection

[ ] layered rendering
