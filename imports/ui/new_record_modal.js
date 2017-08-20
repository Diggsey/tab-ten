import './new_record_modal.html';
import './new_record_modal.scss';
import { Players } from '../api/players.js'
import { updateModal } from './modals.js'

Template.new_record_modal.helpers({
    players() {
        return Players.get();
    },
    playerClass(key) {
        const modal = Template.parentData();
        if (modal[key] == this.name) {
            return "selected";
        } else {
            return "";
        }
    },
    newPlayerClass(key) {
        const name = this[key];
        if (Players.get().every((p) => p.name != name)) {
            return "selected";
        } else {
            return "";
        }
    }
})

Template.new_record_modal.events({
    'mousedown .winner div.player'(ev, t) {
        updateModal(t.data, 'winner', this.name);
    },
    'mousedown .loser div.player'(ev, t) {
        updateModal(t.data, 'loser', this.name);
    },
    'input .winner input'(ev, t) {
        updateModal(t.data, 'winner', ev.target.value);
    },
    'input .loser input'(ev, t) {
        updateModal(t.data, 'loser', ev.target.value);
    },
    'mousedown .winner input'(ev, t) {
        updateModal(t.data, 'winner', ev.target.value);
    },
    'mousedown .loser input'(ev, t) {
        updateModal(t.data, 'loser', ev.target.value);
    }
});
