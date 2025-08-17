# fossil-MV-MZ
![Fossil Project Logo](https://raw.githubusercontent.com/FossilMZ/fossil-MV-MZ/main/FossilLogo128px.png)

Project Fossil (Fixing Old Software / Script Interoperability Layer) is a RPG Maker MZ plugin designed to expand the use and usefulness of RPG MAKER MV plugins, by allowing them to work in RPG MAKER MZ projects.

How to use: 

This should be reasonably plug-and-play.  There aren't really parameters to configure. Add it to your project as the first plugin and if the MV plugins are supported it should work automatically.


**Required Plugin Order**

1) FOSSIL.js (First plugin)

2) All other plugins.


**Invoking MV Plugin Commands**

You can invoke MV plugin commands using MZ's plugin command interface (OldPluginCommand in FOSSIL).

Alternatively, you can put the command into a script using the oldCommand function.  For instance, 

oldCommand('somePlugin arguments et cetera');

Finally, you can copy-paste an old-style plugin command from a MV project (or import a map containing it, if copy-paste between versions doesn't work for you - it's very flaky.)

**Mobile and Web Deployment Note**

FOSSIL creates a 'FOSSILindex.html' file at runtime, and switches to use it instead of the original index.html.  This works seamlessly in both playtest and deploy on my computer.  However, it is possible this might not be possible in web or mobile environments (I can't test it).  However, if you just rename an existing FOSSILindex.html to index.html it'll bypass the html creation step and proceed onwards.   (Basically I need to replace 'main.js' in index.html with 'FOSSIL.js' so I can control when plugins are added).

**Terms of Use:**

All unique code in FOSSIL is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License ( https://creativecommons.org/licenses/by-sa/4.0/ ).  The remainder is taken from RPG Maker MV and RPG Maker MZ, and is covered under the appropriate licenses. No code from any existing plugin was used. Credit Restart, 'FOSSIL' or 'FOSSIL Team', and link back to the github (https://github.com/FossilMZ/fossil-MV-MZ/) or the forum thread ( https://forums.rpgmakerweb.com/index.php?threads/135523/).

In order to improve clarity, I am officially stating that the 'CC-BY-SA' only requires that code directly derived from FOSSIL be also put under a 'CC-BY-SA' license.  Any other assets in your game, (such as code, art, et cetera) as well as your game as a whole are NOT considered to be 'derivative works' for this purpose; they're just a 'collection of materials'.

