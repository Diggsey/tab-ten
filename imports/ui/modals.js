import './modals.html';
import './modals.scss';

modalStack = new ReactiveVar([]);

function getModals() {
    return modalStack.get();
}
function updateModals(f) {
    Tracker.nonreactive(() => {
        const modals = modalStack.get();
        f(modals);
        modalStack.set(modals);
    });
}
export function pushModal(modal) {
    updateModals((modals) => {
        modal.index = modals.length;
        modal.buttons = modal.buttons || [
            {
                text: 'OK',
                result: 'ok'
            },
            {
                text: 'Cancel',
                result: 'cancel'
            }
        ];
        modals.push(modal);
    });
}

export function updateModal(modal, key, value) {
    updateModals((modals) => {
        modals[modal.index][key] = value;
    })
}

export function popModal(result) {
    var modal;
    updateModals((modals) => {
        modal = modals.pop();
    });
    modal.result = result;
    if (modal.callback)
        modal.callback();
}

Template.modals.helpers({
    modals() {
        return getModals();
    },
    modalTemplate() {
        return this.template;
    }
})

Template.modals.events({
    'click .modal_outer'() {
        popModal({result: 'cancel'});
    },
    'click .modal_dialog'(ev) {
        ev.stopPropagation();
    },
    'click .modal_buttons button'(ev) {
        popModal(ev.target.name);
    }
})
