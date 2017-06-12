"use strict";

var _ = require('underscore'),
    guid = require('guid'),
    Emitter = require('events'),
    matching = require('./matching/ImmediateNeighbour'),
    playerDb = require('./util/PlayerDb'),
    fairnessTuning = require('./matching/DynamicFairness'),
    filterOpts;

const DEFAULT_MATCHING_INTERVAL = 350; // milliseconds
const DEFAULT_FAIR_MATCHING_MMR_THRESHOLD = 250;
const DEFAULT_TUNING_ADJUSTMENT_DELAY = 1000; // microseconds

function Matchmaker(opts) {
    var self = this;

    this.opts = _(opts).defaults({
        players: require('../data/Players.js'),
        matchingInterval: DEFAULT_MATCHING_INTERVAL,
        searchWideningDelay: DEFAULT_TUNING_ADJUSTMENT_DELAY,
        fairMMRThreshold: DEFAULT_FAIR_MATCHING_MMR_THRESHOLD,
        verbose: false
    });

    if (opts.players instanceof playerDb.db) {
        this.players = opts.players
    } else if (_(opts.players).isArray()) {
        this.players = new playerDb.static(opts.players);
    }
    else {
        this.players = new playerDb.db();
    }

    this.emitter = new Emitter();
    this.running = false;
    this.lobby = [];
    this.matchingLoop = undefined;

    process.on("SIGINT", function() {
        self.stop();

        process.exit();
    });
}

Matchmaker.prototype.log = function () {
    if (this.opts.verbose)
        console.log.apply(console, Array.prototype.slice.call(arguments));
};

Matchmaker.prototype.start = function () {
    var lobby, matcher, tuner, emitter, log = this.log.bind(this);

    this.lobby = [];
    this.running = true;

    lobby = this.lobby;
    emitter = this.emitter;

    matcher = matching(this.lobby, function (m1, m2) {
        var match = {
            matchId: guid.raw(),
            p1: m1.playerId,
            p2: m2.playerId
        };

        log("*** Match found", match.p1, "vs.", match.p2, "(match id " + match.matchId + ")");
        emitter.emit('match', match);
    }, {threshold: this.opts.fairMMRThreshold});

    tuner = fairnessTuning(this.lobby, {tuningDelay: this.opts.searchWideningDelay});

    this.matchingLoop = setInterval(function () {
        tuner();
        log(lobby);
        matcher();
    }, this.opts.matchingInterval);

    return this;
};

Matchmaker.prototype.stop = function () {
    if (this.running) {
        clearInterval(this.matchingLoop);

        this.log("Stopping. Dropping", this.lobby.length, "players in lobby.");
    }
};

Matchmaker.prototype.getLobbySize = function () {
    return this.lobby.length;
};

Matchmaker.prototype.onMatch = function (callback) {
    this.emitter.on('match', callback);

    return this;
};

/**
 * @throws Error when invalid player given
 * @param pId
 */
Matchmaker.prototype.joinPlayer = function (pId) {
    var player = this.players.findPlayer(pId),
        insertionIndex;

    player.time = new Date().getTime();
    player.adjustedMMR = player.MMR;

    insertionIndex = _(this.lobby).sortedIndex(player, "adjustedMMR");

    this.lobby.splice(insertionIndex, 0, player);

    this.log("Player joined", player.name, "(" + player.playerId + ")", "MMR:", player.MMR);
};

filterOpts = function (opts) {
    return _(opts).pick(["players", "matchingInterval", "verbose", "searchWideningDelay", "fairMMRThreshold"]);
};

module.exports = function (opts) {
    return new Matchmaker(filterOpts(opts));
};