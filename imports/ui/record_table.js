import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Records } from '../api/records.js';
import { pushModal } from './modals.js';

import {getSelectedRecordId} from './record.js';
import './record_table.html';
import './record_table.scss';
import './new_record_modal.js';

Template.record_table.helpers({
    records() {
        const instance = Template.instance();
        // Otherwise, return all of the tasks
        return Records.find({}, { sort: { gameNo: -1 } });
    },
    recordCount() {
        return Records.find({}).count();
    },
});

Template.record_table.events({
    'click .new_record'(event) {
        pushModal({
            template: 'new_record_modal',
            title: 'Add Record',
            winner: Session.get('defaultWinner') || '',
            loser: Session.get('defaultLoser') || '',
            callback() {
                if (this.result != 'ok')
                    return;

                Session.set('defaultWinner', this.winner);
                Session.set('defaultLoser', this.loser);

                Meteor.call('records.add', {
                    winner: this.winner,
                    winnerScore: 11,
                    loser: this.loser,
                    loserScore: 0
                });
            }
        });
    },
    'click .remove_record'(event) {
        Meteor.call('records.remove', getSelectedRecordId());
    }
});
