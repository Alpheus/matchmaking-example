var _ = require('underscore');

function PlayerDb() {}

PlayerDb.prototype.findPlayer = function (playerId) {
    throw new Error("Unknown player with id '" + playerId + "'");
};

function StaticDb(list)
{
    this.staticList = list;
}

StaticDb.prototype = Object.assign({}, PlayerDb.prototype);

/**
 * @throws Error when invalid player given
 * @param pId
 * @return Object player with id, mmr
 */
StaticDb.prototype.findPlayer = function (playerId) {
    var player = _(this.staticList).findWhere({playerId: playerId});

    if (player) {
        return _.clone(player);
    }

    throw new Error("Unknown player with id '" + playerId + "'");
};

module.exports = {
    db: PlayerDb,
    static: StaticDb
};