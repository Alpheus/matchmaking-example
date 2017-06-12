"use strict";

var assert = require("chai").assert,
    mm = require("../src/Matchmaker.js"),
    players = require("./fixtures/TestPlayers.js");

describe("Matchmaker", function () {
    var matchmaker;

    beforeEach(function () {
        matchmaker = mm({
            players: players,
            matchingInterval: 5, // 5 milliseconds. Keep this fast
            searchWideningDelay: 600, // 0.6 seconds. Keep this slow,
            fairMMRThreshold: 121 // matches players 2 and 3 (see fixtures) immediately
            //,verbose: true // Testing
        }).start();
    });

    afterEach(function () {
        matchmaker.stop();
    });

    it("Should allow known players to enter the lobby.", function () {
        matchmaker.joinPlayer(2);

        assert.equal(matchmaker.getLobbySize(), 1);

        assert.throws(function () {
            matchmaker.joinPlayer(666); // Unknown player
        })
    });

    it("Should match players of similar skill level immediately", function (done) {
        var PLAYER_A = 2,
            PLAYER_B = 3;

        this.timeout(1000);

        matchmaker.onMatch(function (match) {
            // Will not repeat this assertion in further tests for brevity
            assert.notEqual(match.p1, match.p2, "Matched players must be unique!");

            assert.oneOf(match.p1, [PLAYER_A, PLAYER_B]);
            assert.oneOf(match.p2, [PLAYER_A, PLAYER_B]);

            done();
        });

        matchmaker.joinPlayer(PLAYER_A);
        matchmaker.joinPlayer(PLAYER_B);
    });

    it("Should not take long to match a player if players of similar skill cannot be matched", function (done) {
        var PLAYER_A = 1,
            PLAYER_B = 3,
            instant = true; // We want the matchmaker to widen the search before matching

        this.timeout(6000);

        matchmaker.onMatch(function (match) {
            if (instant) {
                assert.fail();
            }

            assert.oneOf(match.p1, [PLAYER_A, PLAYER_B]);
            assert.oneOf(match.p2, [PLAYER_A, PLAYER_B]);

            done();
        });

        // This should be enough time to make sure search parameters have been widened
        setTimeout(function () {
            instant = false;
        }, 150);

        matchmaker.joinPlayer(PLAYER_A);
        matchmaker.joinPlayer(PLAYER_B);
    });

    it("Should favor the closest MMR match in case the search has been widened and a more suitable players enters the lobby", function (done) {
        var PLAYER_NOOB = 1,
            PLAYER_A = 2,
            PLAYER_B = 3,
            instant = true; // We want the matchmaker to widen the search before matching

        this.timeout(10000);

        matchmaker.onMatch(function (match) {
            if (instant) {
                assert.fail();
            }

            assert.oneOf(match.p1, [PLAYER_A, PLAYER_B]);
            assert.oneOf(match.p2, [PLAYER_A, PLAYER_B]);

            done();
        });

        // This should be enough time to make sure search parameters have been widened
        setTimeout(function () {
            instant = false;
        }, 150);

        matchmaker.joinPlayer(PLAYER_NOOB);
        matchmaker.joinPlayer(PLAYER_B);

        setTimeout(function () {
            matchmaker.joinPlayer(PLAYER_A);
        }, 1000);
    });

    it("Should match more than one pair of players per session.", function () {
        var PLAYER_PAIR1_A = 1,
            PLAYER_PAIR1_B = 5,
            PLAYER_PAIR2_A = 2,
            PLAYER_PAIR2_B = 3,
            PAIR1 = [PLAYER_PAIR1_A, PLAYER_PAIR1_B],
            PAIR2 = [PLAYER_PAIR2_A, PLAYER_PAIR2_B],
            firstPairMatched, secondPairMatched;

        this.timeout(10000);

        firstPairMatched = new Promise(function (resolve, reject) {
            matchmaker.onMatch(function (match) {
                if (match.p1 == PLAYER_PAIR1_A || match.p1 == PLAYER_PAIR1_B) {
                    assert.oneOf(match.p2, PAIR1);
                    resolve(match);
                }
            });
        });

        secondPairMatched = new Promise(function (resolve, reject) {
            matchmaker.onMatch(function (match) {
                if (match.p1 == PLAYER_PAIR2_A || match.p1 == PLAYER_PAIR2_B) {
                    assert.oneOf(match.p2, PAIR2);
                    resolve(match);
                }
            });
        });

        matchmaker.joinPlayer(PLAYER_PAIR1_A);
        matchmaker.joinPlayer(PLAYER_PAIR1_B);
        matchmaker.joinPlayer(PLAYER_PAIR2_A);
        matchmaker.joinPlayer(PLAYER_PAIR2_B);

        return Promise.all([firstPairMatched, secondPairMatched]).then(function (promises) {
            var pair1 = promises[0], pair2 = promises[1];
            assert.oneOf(pair1.p1, PAIR1);
            assert.oneOf(pair1.p2, PAIR1);

            assert.oneOf(pair2.p1, PAIR2);
            assert.oneOf(pair2.p2, PAIR2);

            assert.notEqual(pair1.matchId, pair2.matchId);
        });
    });
});