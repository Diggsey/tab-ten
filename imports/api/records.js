import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
//import moment from 'moment'

export const Records = new Mongo.Collection('records');

if (Meteor.isServer) {
    Meteor.publish('records', function recordsPublication() {
        return Records.find({});
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('records');
}

var workerActive = false;
var scheduledActions = [];

function scheduleAction(callback) {
    scheduledActions.push(Meteor.bindEnvironment(callback));
    performOutstandingActions();
}

function performOutstandingActions() {
    if (workerActive)
        return;
    workerActive = true;
    var callback;
    while ((callback = scheduledActions.shift()) !== undefined) {
        callback();
    }
    workerActive = false;
}

Meteor.methods({
    'records.add'({ winner, winnerScore, loser, loserScore }) {
        check(winner, String);
        check(winnerScore, Match.Integer);
        check(loser, String);
        check(loserScore, Match.Integer);

        // Make sure the user is logged in before adding a record
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        const _id = Records._makeNewID();
        const date = moment().format('YYYY-MM-DD');

        scheduleAction(() => {
            const gameNo = (Records.findOne({}, { sort: { gameNo: -1 } }) || { gameNo: 0 }).gameNo + 1;
            Records.insert({
                _id, gameNo, winner, winnerScore, loser, loserScore, date
            });
        });
    },
    'records.remove'(recordId) {
        check(recordId, String);

        scheduleAction(() => {
            const record = Records.findOne(recordId);
            if (record) {
                Records.remove(recordId);
                Records.update(
                    { gameNo: { $gt: record.gameNo } },
                    { $inc: { gameNo: -1 } },
                    { multi: true }
                );
            }
        })
    },
    'records.move'({ fromId, toId }) {
        check(fromId, String);
        check(toId, String);

        scheduleAction(() => {
            const fromRecord = Records.findOne(fromId);
            const toRecord = Records.findOne(toId);
            if (fromRecord && toRecord) {
                const toGameNo = toRecord.gameNo;
                const fromGameNo = fromRecord.gameNo;

                if (fromRecord.gameNo > toRecord.gameNo) {
                    Records.update(
                        {
                            gameNo: {
                                $gte: toGameNo,
                                $lt: fromGameNo
                            }
                        },
                        { $inc: { gameNo: 1 } },
                        { multi: true }
                    );
                } else {
                    Records.update(
                        {
                            gameNo: {
                                $gt: fromGameNo,
                                $lte: toGameNo
                            }
                        },
                        { $inc: { gameNo: -1 } },
                        { multi: true }
                    );
                }
                Records.update(
                    fromId,
                    { $set: { gameNo: toGameNo } }
                );
            }
        })
    }
});
