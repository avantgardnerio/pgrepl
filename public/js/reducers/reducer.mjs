const initial = {
    people: []
}

const reducer = (state = initial, action) => {
    switch(action.type) {
        case 'GOT_USERS': return gotPeople(state, action);
        default: return state;
    }
}

const gotPeople = (state, action) => {
    return {...state, people: action.users};
}

export default reducer;