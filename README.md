# 1v1 Matchmaking Example

> Written in node.js

## API & Usage

> In the spirit of brevity, this example program was not added to npm as a package so you will have to link source files manually

## Installation & Tests

Checkout with your favorite git client and run npm install.

Run tests with `npm test`

### Startup

```js
    var matchmaker = require('./index.js');

    var options = {};

    var mm = matchmaker(options);
    mm.start();
```

### Options

> players

Either supply an array of player objects or extend `util/PlayerDb`. Player objects must contain a player id and MMR information.

```js
options.players = [
    {
        playerId: 1,
        name: "Goofy",
        MMR: 1350
    },
    {
        playerId: 2,
        name: "Rob",
        MMR: 2100
    }
];
```

> matchingInterval

Integer denoting the number of milliseconds the matchmaker loop waits between cycles (lower meaning faster loops and higher cpu usage).

> verbose

Boolean denoting whether additional debugging information will be output to the console.

> searchWideningDelay

Integer denoting the number of milliseconds a player can remain unmatched before the matchmaker starts widening the search, potentially matching the player with a less suitable opponent

> fairMMRThreshold

The MMR range between two players that the matchmaker deems "fair" to match without widening search parameters.

### Joining

```js
    matchmaker.joinPlayer(15); // 15 is the identifier of the player. This does not have to be an integer, it can be any type you wish to use
    matchmaker.joinPlayer(19);
```

### Matches

```js
    matchmaker.onMatch(function (match) {
        // match.matchId
        // match.p1 // player identifier from the player db
        // match.p2 // player identifier from the player db

        // ...
    });